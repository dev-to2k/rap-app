import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWebhookSecret, verifyWebhookSignature } from "@/lib/webhook";
import { unlockOrder } from "@/lib/unlock";
import { releaseExclusiveReserve } from "@/lib/orders";
import { isProductionRuntime } from "@/lib/security";

export const dynamic = "force-dynamic";

function asNonEmptyString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

export async function POST(req: NextRequest) {
  if (isProductionRuntime() && !getWebhookSecret()) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const orderId = asNonEmptyString(body.orderId);
  const amountVnd = body.amountVnd;
  const paymentRef = asNonEmptyString(body.paymentRef) ?? undefined;
  const status = body.status;
  const resultCode = body.resultCode;
  const success =
    status === "success" || resultCode === 0 || resultCode === "0";
  const idempotencyKey =
    asNonEmptyString(body.idempotencyKey) ||
    asNonEmptyString(body.transId) ||
    asNonEmptyString(body.requestId);

  if (!orderId || typeof amountVnd !== "number" || !Number.isFinite(amountVnd) || !idempotencyKey || !success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  // Idempotent: if key already used, return existing
  const existing = await prisma.order.findFirst({
    where: { webhookIdempotencyKey: idempotencyKey },
    include: { license: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, idempotent: true, order: existing });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (amountVnd !== order.amountVnd) {
    return NextResponse.json({ error: "AMOUNT_MISMATCH" }, { status: 400 });
  }

  if (order.status === "unlocked") {
    return NextResponse.json({ ok: true, idempotent: true, order });
  }

  try {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        paymentRef: paymentRef || order.paymentRef,
        webhookIdempotencyKey: idempotencyKey,
      },
    });

    const result = await unlockOrder(order.id);
    return NextResponse.json({ ok: true, order: result.order, license: result.license, already: result.already });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "EXCLUSIVE_CONFLICT" || msg === "EXCLUSIVE_UNAVAILABLE") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed", webhookIdempotencyKey: idempotencyKey },
      });
      if (order.sku === "exclusive") {
        await releaseExclusiveReserve(order.beatId);
      }
      return NextResponse.json({ error: "EXCLUSIVE_CONFLICT", code: "EXCLUSIVE_CONFLICT" }, { status: 409 });
    }
    console.error("webhook unlock error", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
