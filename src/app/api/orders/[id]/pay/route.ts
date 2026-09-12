import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { signWebhookBody } from "@/lib/webhook";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  paymentMethod: z.enum(["momo", "vnpay", "ck"]),
  /** Mock: if true, auto-fire signed webhook (simulator) */
  simulateWebhook: z.boolean().optional().default(true),
});

/**
 * Mock checkout: marks intent + optionally POSTs to webhook simulator.
 * Unlock ONLY happens after webhook OK (amount/order match + signature).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "pending") {
    return NextResponse.json({ error: `Order status is ${order.status}` }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const paymentRef = `${parsed.data.paymentMethod.toUpperCase()}-${Date.now()}`;
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentMethod: parsed.data.paymentMethod, paymentRef },
  });

  let webhookResult = null;
  if (parsed.data.simulateWebhook) {
    const payload = {
      orderId: order.id,
      amountVnd: order.amountVnd,
      paymentRef,
      status: "success",
      idempotencyKey: `wh-${order.id}-${paymentRef}`,
    };
    const { raw, signature } = signWebhookBody(payload);
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/webhooks/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: raw,
    });
    webhookResult = await res.json().catch(() => ({ ok: false }));
  }

  const refreshed = await prisma.order.findUnique({
    where: { id: order.id },
    include: { license: true },
  });

  return NextResponse.json({
    ok: true,
    order: refreshed,
    paymentStub: parsed.data.paymentMethod,
    webhookResult,
  });
}
