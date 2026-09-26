import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getPaymentMomoPhone } from "@/lib/payment-phone";
import {
  isPayosConfigured,
  parsePayosPaymentRef,
  payosCheckoutUrl,
  PAYOS_PAYMENT_TTL_MINUTES,
} from "@/lib/payos";
import { expireOrderIfStale } from "@/lib/payment-ttl";
import { buyerSafeOrder } from "@/lib/buyer-safe-order";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  // Payment TTL 60m — expire on read before returning
  try {
    await expireOrderIfStale(params.id);
  } catch (e) {
    console.error("expireOrderIfStale", e);
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { license: true, beat: true },
  });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const momoPhone = getPaymentMomoPhone();
  const payosConfigured = isPayosConfigured();
  const parsed = parsePayosPaymentRef(order.paymentRef);
  const expiresAt = new Date(order.createdAt.getTime() + PAYOS_PAYMENT_TTL_MINUTES * 60_000).toISOString();

  return NextResponse.json({
    order: buyerSafeOrder(order as unknown as Record<string, unknown>),
    payment: {
      momoPhone,
      amountVnd: order.amountVnd,
      transferContent: order.id,
      ttlMinutes: PAYOS_PAYMENT_TTL_MINUTES,
      expiresAt,
      payosConfigured,
      payos: parsed
        ? {
            orderCode: parsed.orderCode,
            paymentLinkId: parsed.paymentLinkId,
            checkoutUrl: payosCheckoutUrl(parsed.paymentLinkId),
          }
        : null,
    },
  });
}
