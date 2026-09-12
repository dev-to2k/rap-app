"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEffectiveTakeRateBps } from "@/lib/take-rate";

export async function createOrderAction(beatId: string, sku: "lease" | "wav" | "exclusive") {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");

  const beat = await prisma.beat.findUnique({ where: { id: beatId } });
  if (!beat || beat.status !== "listed") throw new Error("UNAVAILABLE");
  if (sku === "exclusive" && beat.sampleFlag === "uncleared") {
    throw new Error("EXCLUSIVE_FORBIDDEN");
  }

  const amountVnd = sku === "lease" ? beat.priceLease : sku === "wav" ? beat.priceWav : beat.priceExclusive;
  const takeRateBps = await getEffectiveTakeRateBps();

  const order = await prisma.order.create({
    data: {
      buyerId: session.id,
      beatId: beat.id,
      sku,
      amountVnd,
      takeRateBps,
      status: "pending",
    },
  });
  return order.id;
}
