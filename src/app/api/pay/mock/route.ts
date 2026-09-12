import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { signWebhookBody } from "@/lib/webhook";
import { z } from "zod";

const schema = z.object({
  orderId: z.string().min(1),
  /** simulate fail path */
  fail: z.boolean().optional(),
});

/**
 * Mock MoMo/VNPay/CK: marks pending, then POSTs signed webhook stub to unlock.
 * In real life the PSP calls our webhook; here we self-call after "pay".
 */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "pending" && order.status !== "failed") {
    return NextResponse.json({ order, message: "Already processed" });
  }

  if (parsed.data.fail) {
    const failed = await prisma.order.update({
      where: { id: order.id },
      data: { status: "failed" },
    });
    return NextResponse.json({ order: failed, paid: false });
  }

  const paymentRef = `MOCK-${order.paymentMethod || "pay"}-${Date.now()}`;
  const idempotencyKey = `wh_${order.id}_${paymentRef}`;

  const payload = {
    orderId: order.id,
    amountVnd: order.amountVnd,
    paymentRef,
    status: "success",
    idempotencyKey,
  };
  const { raw, signature } = signWebhookBody(payload);

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const wh = await fetch(`${base}/api/webhooks/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
    },
    body: raw,
  });
  const whJson = await wh.json().catch(() => ({}));

  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: { license: true },
  });

  return NextResponse.json({
    order: updated,
    paid: updated?.status === "unlocked" || updated?.status === "paid",
    webhook: whJson,
  });
}
