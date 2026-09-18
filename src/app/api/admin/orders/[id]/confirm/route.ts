import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clientIp, durableRateLimit } from "@/lib/security";
import { confirmPaymentAndUnlock } from "@/lib/confirm-payment";

export const dynamic = "force-dynamic";

/**
 * Admin-only MoMo personal CK confirm → paid → unlock PDF + ledger.
 * Authz: admin role. Rate-limited. Audit admin_id/order_id/at. Idempotent.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireUser(["admin"]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req.headers);
  const ok =
    (await durableRateLimit(`admin:confirm:${admin.id}`, 30, 60_000)) &&
    (await durableRateLimit(`admin:confirm:ip:${ip}`, 60, 60_000));
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });

  // Fully unlocked → idempotent OK
  if (order.status === "unlocked") {
    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { license: true },
    });
    return NextResponse.json({ ok: true, idempotent: true, order: full });
  }

  // paid-without-unlock falls through to confirmPaymentAndUnlock (heal)
  if (
    order.status !== "pending_confirm" &&
    order.status !== "pending_ck" &&
    order.status !== "awaiting_payment" &&
    order.status !== "pending" &&
    order.status !== "paid"
  ) {
    return NextResponse.json(
      { error: `Order status is ${order.status}`, code: "INVALID_STATUS" },
      { status: 400 },
    );
  }

  const at = new Date().toISOString();
  const idempotencyKey = `admin_ck_${order.id}`;

  const out = await confirmPaymentAndUnlock({
    orderId: order.id,
    amountVnd: order.amountVnd,
    idempotencyKey,
    paymentRef: order.paymentRef || `CK-ADMIN-${Date.now()}`,
    fromStatuses: ["pending", "pending_ck", "awaiting_payment", "pending_confirm", "paid"],
  });

  await prisma.auditLog.create({
    data: {
      beatId: order.beatId,
      action: "admin_ck_confirm",
      meta: JSON.stringify({
        admin_id: admin.id,
        order_id: order.id,
        at,
        result: out.kind,
      }),
    },
  });

  if (out.kind === "error") {
    return NextResponse.json(
      { error: out.error, code: out.code },
      { status: out.status },
    );
  }

  return NextResponse.json({
    ok: true,
    idempotent: out.kind === "idempotent",
    order: out.order,
    license: out.kind === "ok" ? out.license : undefined,
  });
}
