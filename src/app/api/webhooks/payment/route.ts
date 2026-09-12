import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWebhookSecret, verifyWebhookSignature } from "@/lib/webhook";
import { unlockOrder } from "@/lib/unlock";
import { releaseExclusiveReserve } from "@/lib/orders";
import { allowPaymentMocks, isProductionRuntime } from "@/lib/security";
import { isMomoIpnPayload, verifyMomoIpn } from "@/lib/momo";

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

async function unlockFromVerifiedPayment(opts: {
  orderId: string;
  amountVnd: number;
  idempotencyKey: string;
  paymentRef?: string;
}) {
  const existing = await prisma.order.findFirst({
    where: { webhookIdempotencyKey: opts.idempotencyKey },
    include: { license: true },
  });
  if (existing) return { kind: "idempotent" as const, order: existing };

  const order = await prisma.order.findUnique({ where: { id: opts.orderId } });
  if (!order) return { kind: "error" as const, status: 404, error: "ORDER_NOT_FOUND" };
  if (opts.amountVnd !== order.amountVnd) {
    return { kind: "error" as const, status: 400, error: "AMOUNT_MISMATCH" };
  }
  if (order.status === "unlocked") return { kind: "idempotent" as const, order };

  try {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        paymentRef: opts.paymentRef || order.paymentRef,
        webhookIdempotencyKey: opts.idempotencyKey,
      },
    });
    const result = await unlockOrder(order.id);
    return { kind: "ok" as const, order: result.order, license: result.license, already: result.already };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "EXCLUSIVE_CONFLICT" || msg === "EXCLUSIVE_UNAVAILABLE") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed", webhookIdempotencyKey: opts.idempotencyKey },
      });
      if (order.sku === "exclusive") await releaseExclusiveReserve(order.beatId);
      return { kind: "error" as const, status: 409, error: "EXCLUSIVE_CONFLICT", code: "EXCLUSIVE_CONFLICT" };
    }
    console.error("webhook unlock error", msg);
    return { kind: "error" as const, status: 500, error: msg };
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // A) MoMo Business AIOv2 IPN — signature in body (not stub header)
  if (isMomoIpnPayload(body)) {
    const verified = verifyMomoIpn(body);
    if (!verified.ok) {
      return NextResponse.json({ error: "Invalid MoMo signature", reason: verified.reason }, { status: 401 });
    }
    const resultCode = body.resultCode;
    const success = resultCode === 0 || resultCode === "0";
    if (!success) {
      return NextResponse.json({ error: "Payment not success", resultCode }, { status: 400 });
    }
    const orderId = asNonEmptyString(body.orderId);
    const amountVnd = coerceAmount(body.amount);
    const idempotencyKey =
      asNonEmptyString(body.transId) || asNonEmptyString(body.requestId);
    if (!orderId || amountVnd === null || !idempotencyKey) {
      return NextResponse.json({ error: "Invalid MoMo IPN payload" }, { status: 400 });
    }
    const out = await unlockFromVerifiedPayment({
      orderId,
      amountVnd,
      idempotencyKey,
      paymentRef: asNonEmptyString(body.transId) || undefined,
    });
    if (out.kind === "error") {
      return NextResponse.json(
        { error: out.error, code: "code" in out ? out.code : undefined },
        { status: out.status }
      );
    }
    // MoMo expects 204
    return new NextResponse(null, { status: 204 });
  }

  // Local/dev stub HMAC only when mocks allowed
  if (!allowPaymentMocks()) {
    return NextResponse.json({ error: "Stub webhook disabled — send MoMo IPN" }, { status: 404 });
  }
  if (isProductionRuntime() && !getWebhookSecret()) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const stub = body as Record<string, unknown>;
  const sig = req.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const orderId = asNonEmptyString(stub.orderId);
  const amountVnd = coerceAmount(stub.amountVnd ?? stub.amount);
  const success =
    stub.status === "success" || stub.resultCode === 0 || stub.resultCode === "0";
  const idempotencyKey =
    asNonEmptyString(stub.idempotencyKey) ||
    asNonEmptyString(stub.transId) ||
    asNonEmptyString(stub.requestId);

  if (!orderId || amountVnd === null || !idempotencyKey || !success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const out = await unlockFromVerifiedPayment({
    orderId,
    amountVnd,
    idempotencyKey,
    paymentRef: asNonEmptyString(stub.paymentRef) || undefined,
  });
  if (out.kind === "error") {
    return NextResponse.json(
      { error: out.error, code: "code" in out ? out.code : undefined },
      { status: out.status }
    );
  }
  if (out.kind === "idempotent") {
    return NextResponse.json({ ok: true, idempotent: true, order: out.order });
  }
  return NextResponse.json({ ok: true, order: out.order, license: out.license, already: out.already });
}
