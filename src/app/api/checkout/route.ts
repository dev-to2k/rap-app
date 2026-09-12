import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getEffectiveTakeRateBps } from "@/lib/take-rate";
import { z } from "zod";

const schema = z.object({
  beatId: z.string().min(1),
  sku: z.enum(["lease", "wav", "exclusive"]),
  paymentMethod: z.enum(["momo", "vnpay", "ck"]),
});

export async function POST(req: NextRequest) {
  const user = await requireUser(["buyer", "producer"]);
  if (!user) return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const beat = await prisma.beat.findUnique({ where: { id: parsed.data.beatId } });
  if (!beat || beat.status !== "available") {
    return NextResponse.json({ error: "Beat không còn bán", code: "BEAT_UNAVAILABLE" }, { status: 409 });
  }
  if (parsed.data.sku === "exclusive" && beat.sampleFlag === "uncleared") {
    return NextResponse.json(
      { error: "Không bán Exclusive khi sample chưa clear", code: "EXCLUSIVE_FORBIDDEN_UNCLEARED" },
      { status: 400 }
    );
  }

  const amountVnd =
    parsed.data.sku === "lease"
      ? beat.priceLease
      : parsed.data.sku === "wav"
        ? beat.priceWav
        : beat.priceExclusive;

  const takeRateBps = await getEffectiveTakeRateBps();

  const order = await prisma.order.create({
    data: {
      buyerId: user.id,
      beatId: beat.id,
      sku: parsed.data.sku,
      amountVnd,
      takeRateBps,
      status: "pending",
      paymentMethod: parsed.data.paymentMethod,
    },
  });

  return NextResponse.json({ order });
}
