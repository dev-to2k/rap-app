import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clientIp, durableRateLimit } from "@/lib/security";
import {
  createPayosPaymentLink,
  formatPayosPaymentRef,
  generatePayosOrderCode,
  isPayosConfigured,
  parsePayosPaymentRef,
  payosCheckoutUrl,
  payosDescriptionForOrder,
  PAYOS_PAYMENT_TTL_MINUTES,
} from "@/lib/payos";
import { expireOrderIfStale } from "@/lib/payment-ttl";
import { z } from "zod";

export const dynamic = "force-dynamic";

const AWAITING = new Set(["pending", "pending_ck", "awaiting_payment"]);

const schema = z.object({
  /** Create a new payOS attempt on the same order (new orderCode / paymentRef). */
  retry: z.boolean().optional().default(false),
});

function appBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000"
  );
}

/**
 * Create (or retry) a payOS payment link for an existing order.
 * Same order id on retry — new paymentRef / orderCode (CoS LOCK).
 * Missing PAYOS_* keys → 503 with clear code; CK rail remains available.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const ip = clientIp(req.headers);
  const okRl = await durableRateLimit(`payos:create:${user.id}:${ip}`, 20, 60_000);
  if (!okRl) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (!isPayosConfigured()) {
    return NextResponse.json(
      {
        error: "payOS chưa cấu hình — dùng chuyển khoản MoMo",
        code: "PAYOS_KEYS_MISSING",
        fallback: "ck",
      },
      { status: 503 },
    );
  }

  await expireOrderIfStale(params.id);

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status === "paid" || order.status === "unlocked") {
    return NextResponse.json({ error: "Order already paid", code: "ALREADY_PAID" }, { status: 400 });
  }
  if (order.status === "failed") {
    return NextResponse.json({ error: "Order expired", code: "ORDER_EXPIRED" }, { status: 410 });
  }
  if (!AWAITING.has(order.status) && order.status !== "pending_confirm") {
    return NextResponse.json(
      { error: `Order status is ${order.status}`, code: "INVALID_STATUS" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const existing = parsePayosPaymentRef(order.paymentRef);
  // Reuse existing attempt when not retrying and still within TTL window
  if (existing && !parsed.data.retry) {
    const ageMs = Date.now() - order.createdAt.getTime();
    if (ageMs < PAYOS_PAYMENT_TTL_MINUTES * 60_000) {
      return NextResponse.json({
        ok: true,
        reused: true,
        order,
        payos: {
          orderCode: existing.orderCode,
          paymentLinkId: existing.paymentLinkId,
          checkoutUrl: payosCheckoutUrl(existing.paymentLinkId),
          qrCode: "",
          ttlMinutes: PAYOS_PAYMENT_TTL_MINUTES,
        },
      });
    }
  }

  const orderCode = generatePayosOrderCode();
  const base = appBase().replace(/\/$/, "");
  const created = await createPayosPaymentLink({
    orderCode,
    amountVnd: order.amountVnd,
    description: payosDescriptionForOrder(order.id),
    returnUrl: `${base}/checkout/${order.id}`,
    cancelUrl: `${base}/checkout/${order.id}`,
  });

  if (!created.ok) {
    // Graceful — buyer can still use CK rail
    return NextResponse.json(
      {
        error: created.error,
        code: created.code || "PAYOS_CREATE_FAILED",
        fallback: "ck",
      },
      { status: 502 },
    );
  }

  const paymentRef = formatPayosPaymentRef(created.orderCode, created.paymentLinkId);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: "payos",
      paymentRef,
      // Keep awaiting_payment for payOS; pending_confirm stays if buyer already marked CK
      status: order.status === "pending_confirm" ? "pending_confirm" : "awaiting_payment",
    },
  });

  await prisma.auditLog.create({
    data: {
      beatId: order.beatId,
      action: parsed.data.retry ? "payos_payment_retry" : "payos_payment_created",
      meta: JSON.stringify({
        orderId: order.id,
        orderCode: created.orderCode,
        paymentLinkId: created.paymentLinkId,
        amountVnd: order.amountVnd,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    reused: false,
    order: updated,
    payos: {
      orderCode: created.orderCode,
      paymentLinkId: created.paymentLinkId,
      checkoutUrl: created.checkoutUrl,
      qrCode: created.qrCode,
      accountNumber: created.accountNumber,
      accountName: created.accountName,
      bin: created.bin,
      ttlMinutes: PAYOS_PAYMENT_TTL_MINUTES,
    },
  });
}
