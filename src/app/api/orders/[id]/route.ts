import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getPaymentMomoPhone } from "@/lib/payment-phone";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { license: true, beat: true },
  });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Buyer-facing: phone + CK content only — never take/fund fields in UI copy
  const momoPhone = getPaymentMomoPhone();
  return NextResponse.json({
    order,
    payment: {
      momoPhone,
      amountVnd: order.amountVnd,
      transferContent: order.id,
    },
  });
}
