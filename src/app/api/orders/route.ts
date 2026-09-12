import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getEffectiveTakeRateBps } from "@/lib/take-rate";
import { z } from "zod";

const schema = z.object({
  beatId: z.string().min(1),
  sku: z.enum(["lease", "wav", "exclusive"]),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const beat = await prisma.beat.findUnique({ where: { id: parsed.data.beatId } });
  if (!beat || beat.status !== "listed") {
    return NextResponse.json({ error: "Beat unavailable" }, { status: 400 });
  }
  if (parsed.data.sku === "exclusive" && beat.sampleFlag === "uncleared") {
    return NextResponse.json(
      { error: "Exclusive forbidden for uncleared samples" },
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
    },
  });

  return NextResponse.json({ order }, { status: 201 });
}
