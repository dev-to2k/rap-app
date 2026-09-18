import { prisma } from "./prisma";

export class PayoutError extends Error {
  code: string;
  constructor(code: string, message = code) {
    super(message);
    this.code = code;
    this.name = code;
  }
}

/**
 * Credit producer net for one paid/unlocked order (idempotent).
 * - before payableAt → WITHDRAW_TOO_EARLY
 * - already credited → ALREADY_CREDITED (idempotent reject)
 * - failed/conflict / missing payable → NOT_PAYABLE
 */
export async function creditOrderPayable(orderId: string, producerUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { beat: { select: { producerId: true } } },
  });
  if (!order) throw new PayoutError("ORDER_NOT_FOUND");
  if (order.beat.producerId !== producerUserId) throw new PayoutError("FORBIDDEN");
  if (order.status !== "paid" && order.status !== "unlocked") {
    throw new PayoutError("NOT_PAYABLE", "Order not in payable status");
  }
  if (!order.payableAt || order.payableVnd <= 0) {
    throw new PayoutError("NOT_PAYABLE", "Order has no payable balance");
  }
  if (order.creditedAt) {
    throw new PayoutError("ALREADY_CREDITED", "Order already credited");
  }
  const now = new Date();
  if (now.getTime() < order.payableAt.getTime()) {
    throw new PayoutError("WITHDRAW_TOO_EARLY", "Withdraw blocked until payableAt");
  }

  const updated = await prisma.order.updateMany({
    where: {
      id: orderId,
      creditedAt: null,
      status: { in: ["paid", "unlocked"] },
      payableAt: { lte: now },
    },
    data: { creditedAt: now },
  });
  if (updated.count !== 1) {
    const again = await prisma.order.findUnique({ where: { id: orderId } });
    if (again?.creditedAt) throw new PayoutError("ALREADY_CREDITED", "Order already credited");
    throw new PayoutError("WITHDRAW_TOO_EARLY", "Withdraw blocked until payableAt");
  }

  return {
    orderId,
    payableVnd: order.payableVnd,
    creditedAt: now,
    payableAt: order.payableAt,
  };
}
