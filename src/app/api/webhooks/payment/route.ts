import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/webhook";
import { unlockOrder } from "@/lib/unlock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    orderId?: string;
    amountVnd?: number;
    paymentRef?: string;
    status?: string;
    idempotencyKey?: string;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { orderId, amountVnd, paymentRef, status, idempotencyKey } = body;
  if (!orderId || !idempotencyKey || status !== "success") {
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
  if (typeof amountVnd === "number" && amountVnd !== order.amountVnd) {
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
      return NextResponse.json({ error: "EXCLUSIVE_CONFLICT", code: "EXCLUSIVE_CONFLICT" }, { status: 409 });
    }
    console.error("webhook unlock error", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
