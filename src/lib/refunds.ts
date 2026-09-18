import { prisma } from "./prisma";
import { EXCLUSIVE_DISPUTE_MS } from "./ledger";
import { releaseExclusiveReserve } from "./orders";

export class RefundError extends Error {
  code: string;
  constructor(code: string, message = code) {
    super(message);
    this.code = code;
    this.name = code;
  }
}

/**
 * Exclusive refund inside 48h dispute window after unlock.
 * Freezes order (failed), clears payableAt — does NOT enter payable.
 * Outside window → DISPUTE_WINDOW_CLOSED.
 */
export async function refundExclusiveWithinDisputeWindow(
  orderId: string,
  actor: { id: string; role: string },
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { beat: { select: { producerId: true } } },
  });
  if (!order) throw new RefundError("ORDER_NOT_FOUND");
  const allowed = order.buyerId === actor.id || order.beat.producerId === actor.id;
  if (!allowed) throw new RefundError("FORBIDDEN");
  if (order.sku !== "exclusive") throw new RefundError("NOT_EXCLUSIVE");
  if (order.status !== "unlocked" && order.status !== "paid") {
    throw new RefundError("NOT_REFUNDABLE", "Order not in refundable status");
  }
  if (order.creditedAt) throw new RefundError("ALREADY_CREDITED", "Already credited — cannot refund via dispute path");

  const anchor = order.unlockedAt ?? order.paidAt;
  if (!anchor) throw new RefundError("NOT_REFUNDABLE", "No unlock/paid timestamp");
  const elapsed = Date.now() - anchor.getTime();
  if (elapsed > EXCLUSIVE_DISPUTE_MS) {
    throw new RefundError("DISPUTE_WINDOW_CLOSED", "Exclusive dispute window (48h) closed");
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "failed",
      payableAt: null,
    },
  });

  // Beat already sold_exclusive — leave sold (do not re-open for MVP); release only if still reserved
  await releaseExclusiveReserve(order.beatId);

  await prisma.auditLog.create({
    data: {
      beatId: order.beatId,
      action: "exclusive_refund_dispute",
      meta: JSON.stringify({ orderId: order.id, withinMs: elapsed, actorId: actor.id }),
    },
  });

  return updated;
}
