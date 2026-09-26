import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmPaymentAndUnlock } from "@/lib/confirm-payment";
import {
  formatPayosPaymentRef,
  parsePayosPaymentRef,
  verifyPayosWebhook,
  type PayosWebhookPayload,
} from "@/lib/payos";

export const dynamic = "force-dynamic";

function asNonEmptyString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function coerceAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function coerceOrderCode(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

async function findOrderByPayosCode(orderCode: number, paymentLinkId?: string | null) {
  if (paymentLinkId) {
    const exact = formatPayosPaymentRef(orderCode, paymentLinkId);
    const byExact = await prisma.order.findFirst({ where: { paymentRef: exact } });
    if (byExact) return byExact;
  }
  const prefix = `payos:${orderCode}:`;
  return prisma.order.findFirst({
    where: { paymentRef: { startsWith: prefix } },
  });
}

/**
 * payOS payment webhook — separate from MoMo IPN at /api/webhooks/payment (CoS LOCK).
 * Verify signature with PAYOS_CHECKSUM_KEY → confirmPaymentAndUnlock.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let body: PayosWebhookPayload;
  try {
    body = JSON.parse(raw) as PayosWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const verified = verifyPayosWebhook(body);
  if (!verified.ok || !verified.data) {
    // payOS may probe webhook with sample payload during confirm-webhook;
    // still reject bad signatures with 401 (do not unlock).
    return NextResponse.json(
      { error: "Invalid payOS signature", reason: verified.reason },
      { status: 401 },
    );
  }

  const data = verified.data;
  const code = asNonEmptyString(data.code) ?? asNonEmptyString(body.code);
  const success =
    body.success === true || code === "00" || asNonEmptyString(data.desc)?.includes("Thành công");

  // Non-success paid codes: ack 2xx without unlock (idempotent, avoid retries storm)
  if (!success || (code && code !== "00")) {
    return NextResponse.json({ ok: true, ignored: true, code }, { status: 200 });
  }

  const orderCode = coerceOrderCode(data.orderCode);
  const amountVnd = coerceAmount(data.amount);
  const paymentLinkId = asNonEmptyString(data.paymentLinkId);
  const reference = asNonEmptyString(data.reference);

  if (orderCode === null || amountVnd === null) {
    return NextResponse.json({ error: "Invalid payOS payload" }, { status: 400 });
  }

  const order = await findOrderByPayosCode(orderCode, paymentLinkId);
  if (!order) {
    // Unknown orderCode — 2xx so payOS stops retrying; ops can investigate
    console.error("payos webhook: order not found for orderCode", orderCode);
    return NextResponse.json({ ok: true, ignored: true, reason: "ORDER_NOT_FOUND" }, { status: 200 });
  }

  const idempotencyKey =
    (paymentLinkId ? `payos:${paymentLinkId}` : null) ||
    (reference ? `payos:ref:${reference}` : null) ||
    `payos:${orderCode}:${amountVnd}`;

  const paymentRef =
    paymentLinkId != null
      ? formatPayosPaymentRef(orderCode, paymentLinkId)
      : parsePayosPaymentRef(order.paymentRef)
        ? order.paymentRef!
        : `payos:${orderCode}:unknown`;

  const out = await confirmPaymentAndUnlock({
    orderId: order.id,
    amountVnd,
    idempotencyKey,
    paymentRef,
    fromStatuses: ["pending", "pending_ck", "awaiting_payment", "pending_confirm", "paid"],
  });

  if (out.kind === "error") {
    // Amount mismatch / frozen → 4xx so ops see it; exclusive conflict → 409
    if (out.status >= 500) {
      console.error("payos webhook confirm error", out.error);
    }
    return NextResponse.json(
      { error: out.error, code: "code" in out ? out.code : undefined },
      { status: out.status },
    );
  }

  // 2xx for success + idempotent replays
  return NextResponse.json(
    {
      ok: true,
      idempotent: out.kind === "idempotent",
      orderId: order.id,
    },
    { status: 200 },
  );
}
