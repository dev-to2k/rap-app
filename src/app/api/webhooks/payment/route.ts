import { NextRequest, NextResponse } from "next/server";
import { getWebhookSecret, verifyWebhookSignature } from "@/lib/webhook";
import { allowPaymentMocks, isProductionRuntime } from "@/lib/security";
import { isMomoIpnPayload, verifyMomoIpn } from "@/lib/momo";
import { confirmPaymentAndUnlock } from "@/lib/confirm-payment";

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
    const out = await confirmPaymentAndUnlock({
      orderId,
      amountVnd,
      idempotencyKey,
      paymentRef: asNonEmptyString(body.transId) || undefined,
      momoFeeVnd: 0,
    });
    if (out.kind === "error") {
      return NextResponse.json(
        { error: out.error, code: "code" in out ? out.code : undefined },
        { status: out.status }
      );
    }
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

  const out = await confirmPaymentAndUnlock({
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
