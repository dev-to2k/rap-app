import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clientIp, durableRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const AWAITING = new Set(["pending", "pending_ck", "awaiting_payment"]);

/** Buyer marks MoMo CK transferred → pending_confirm (NO unlock). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const ip = clientIp(req.headers);
  const ok = await durableRateLimit(`ck:transferred:${user.id}:${ip}`, 10, 60_000);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status === "pending_confirm") {
    return NextResponse.json({ order, already: true });
  }
  if (order.status === "paid" || order.status === "unlocked") {
    return NextResponse.json({ order, already: true });
  }
  if (!AWAITING.has(order.status)) {
    return NextResponse.json(
      { error: `Order status is ${order.status}`, code: "INVALID_STATUS" },
      { status: 400 },
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "pending_confirm" },
    include: { license: true, beat: true },
  });

  await prisma.auditLog.create({
    data: {
      beatId: order.beatId,
      action: "buyer_ck_transferred",
      meta: JSON.stringify({
        orderId: order.id,
        buyerId: user.id,
        at: new Date().toISOString(),
      }),
    },
  });

  return NextResponse.json({ order: updated, already: false });
}
