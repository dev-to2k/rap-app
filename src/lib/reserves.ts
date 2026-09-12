import { prisma } from "./prisma";

/**
 * Soft-reserve TTL: release exclusive beats stuck in reserved longer than ttlMinutes.
 * Fails related pending exclusive orders and writes auditLog exclusive_reserve_expired.
 */
export async function releaseExpiredExclusiveReserves(ttlMinutes = 15): Promise<{
  releasedBeatIds: string[];
  failedOrderIds: string[];
}> {
  const cutoff = new Date(Date.now() - ttlMinutes * 60_000);

  const expired = await prisma.beat.findMany({
    where: {
      status: "reserved",
      reservedAt: { lt: cutoff },
    },
    select: { id: true },
  });

  const releasedBeatIds: string[] = [];
  const failedOrderIds: string[] = [];

  for (const beat of expired) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.beat.updateMany({
        where: {
          id: beat.id,
          status: "reserved",
          reservedAt: { lt: cutoff },
        },
        data: { status: "available", reservedAt: null },
      });
      if (updated.count !== 1) return;

      const pending = await tx.order.findMany({
        where: {
          beatId: beat.id,
          sku: "exclusive",
          status: "pending",
        },
        select: { id: true },
      });

      if (pending.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: pending.map((o) => o.id) } },
          data: { status: "failed" },
        });
        for (const o of pending) failedOrderIds.push(o.id);
      }

      await tx.auditLog.create({
        data: {
          beatId: beat.id,
          action: "exclusive_reserve_expired",
          meta: JSON.stringify({
            ttlMinutes,
            failedOrderIds: pending.map((o) => o.id),
          }),
        },
      });

      releasedBeatIds.push(beat.id);
    });
  }

  return { releasedBeatIds, failedOrderIds };
}
