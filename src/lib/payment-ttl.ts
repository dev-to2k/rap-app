import { prisma } from "./prisma";
import { PAYOS_PAYMENT_TTL_MINUTES } from "./payos";

const UNPAID_STATUSES = ["pending", "pending_ck", "awaiting_payment"] as const;

/**
 * Expire unpaid orders older than ttlMinutes (default 60 — CoS payOS TTL).
 * Exclusive SKUs also release soft-reserve on the beat.
 * Prefer calling on read (order GET) and from cron alongside exclusive reserve release.
 */
export async function expireUnpaidOrders(
  ttlMinutes: number = PAYOS_PAYMENT_TTL_MINUTES,
): Promise<{ expiredOrderIds: string[]; releasedBeatIds: string[] }> {
  const cutoff = new Date(Date.now() - ttlMinutes * 60_000);

  const stale = await prisma.order.findMany({
    where: {
      status: { in: [...UNPAID_STATUSES] },
      createdAt: { lt: cutoff },
    },
    select: { id: true, beatId: true, sku: true },
  });

  const expiredOrderIds: string[] = [];
  const releasedBeatIds: string[] = [];

  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: { in: [...UNPAID_STATUSES] },
        },
        data: { status: "failed", payableAt: null },
      });
      if (updated.count !== 1) return;

      expiredOrderIds.push(order.id);

      if (order.sku === "exclusive") {
        const released = await tx.beat.updateMany({
          where: { id: order.beatId, status: "reserved" },
          data: { status: "available", reservedAt: null },
        });
        if (released.count === 1) releasedBeatIds.push(order.beatId);
      }

      await tx.auditLog.create({
        data: {
          beatId: order.beatId,
          action: "payment_ttl_expired",
          meta: JSON.stringify({
            orderId: order.id,
            ttlMinutes,
            at: new Date().toISOString(),
          }),
        },
      });
    });
  }

  return { expiredOrderIds, releasedBeatIds };
}

/** Expire a single order if unpaid and past TTL. Returns true when expired this call. */
export async function expireOrderIfStale(
  orderId: string,
  ttlMinutes: number = PAYOS_PAYMENT_TTL_MINUTES,
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, createdAt: true, beatId: true, sku: true },
  });
  if (!order) return false;
  if (!(UNPAID_STATUSES as readonly string[]).includes(order.status)) return false;
  const cutoff = Date.now() - ttlMinutes * 60_000;
  if (order.createdAt.getTime() >= cutoff) return false;

  const result = await expireUnpaidOrders(ttlMinutes);
  return result.expiredOrderIds.includes(orderId);
}
