import { prisma } from "./prisma";
import { unlockOrder } from "./unlock";
import { releaseExclusiveReserve } from "./orders";
import { ledgerAmountsForOrder } from "./ledger";

export type ConfirmPaymentResult =
  | { kind: "ok"; order: Awaited<ReturnType<typeof unlockOrder>>["order"]; license: Awaited<ReturnType<typeof unlockOrder>>["license"]; already: boolean }
  | { kind: "idempotent"; order: NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>> }
  | { kind: "error"; status: number; error: string; code?: string };

async function freezeOrderConflict(orderId: string, beatId: string, sku: string, idempotencyKey: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "failed",
      payableAt: null,
      webhookIdempotencyKey: idempotencyKey,
    },
  });
  if (sku === "exclusive") await releaseExclusiveReserve(beatId);
}

/**
 * Mark paid + unlock (idempotent via webhookIdempotencyKey).
 * Shared by MoMo IPN stub webhook and admin CK confirm.
 */
export async function confirmPaymentAndUnlock(opts: {
  orderId: string;
  amountVnd: number;
  idempotencyKey: string;
  paymentRef?: string;
  momoFeeVnd?: number;
  /** Allowed pre-pay statuses (admin CK may confirm from pending_confirm). */
  fromStatuses?: string[];
}): Promise<ConfirmPaymentResult> {
  const existing = await prisma.order.findFirst({
    where: { webhookIdempotencyKey: opts.idempotencyKey },
    include: { license: true },
  });
  if (existing) return { kind: "idempotent", order: existing };

  const order = await prisma.order.findUnique({ where: { id: opts.orderId } });
  if (!order) return { kind: "error", status: 404, error: "ORDER_NOT_FOUND" };
  if (opts.amountVnd !== order.amountVnd) {
    return { kind: "error", status: 400, error: "AMOUNT_MISMATCH" };
  }
  if (order.status === "unlocked") return { kind: "idempotent", order };
  if (order.status === "failed") {
    return { kind: "error", status: 409, error: "ORDER_FROZEN", code: "ORDER_FROZEN" };
  }

  const allowed =
    opts.fromStatuses ??
    ["pending", "pending_ck", "awaiting_payment", "pending_confirm", "paid"];
  if (!allowed.includes(order.status) && order.status !== "paid") {
    return { kind: "error", status: 400, error: `ORDER_STATUS_${order.status}`, code: "INVALID_STATUS" };
  }

  try {
    const paidAt = new Date();
    const amounts = ledgerAmountsForOrder(order, opts.momoFeeVnd);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        paidAt,
        ...amounts,
        payableAt: null,
        paymentRef: opts.paymentRef || order.paymentRef,
        webhookIdempotencyKey: opts.idempotencyKey,
      },
    });
    const result = await unlockOrder(order.id);
    return { kind: "ok", order: result.order, license: result.license, already: result.already };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg === "EXCLUSIVE_CONFLICT" ||
      msg === "EXCLUSIVE_UNAVAILABLE" ||
      msg === "EXCLUSIVE_FORBIDDEN_UNCLEARED"
    ) {
      await freezeOrderConflict(order.id, order.beatId, order.sku, opts.idempotencyKey);
      return {
        kind: "error",
        status: 409,
        error: msg === "EXCLUSIVE_FORBIDDEN_UNCLEARED" ? msg : "EXCLUSIVE_CONFLICT",
        code: msg === "EXCLUSIVE_FORBIDDEN_UNCLEARED" ? msg : "EXCLUSIVE_CONFLICT",
      };
    }
    console.error("confirmPaymentAndUnlock error", msg);
    return { kind: "error", status: 500, error: msg };
  }
}
