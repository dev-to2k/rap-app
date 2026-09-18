import { prisma } from "./prisma";
import { getEffectiveTakeRateBps } from "./take-rate";
import { computeOrderLedger } from "./ledger";

export class OrderError extends Error {
  code: string;
  constructor(code: string, message = code) {
    super(message);
    this.code = code;
    this.name = code;
  }
}

export async function releaseExclusiveReserve(beatId: string) {
  await prisma.beat.updateMany({
    where: { id: beatId, status: "reserved" },
    data: { status: "available", reservedAt: null },
  });
}

/** Create order; exclusive SKU atomically reserves the beat in the same transaction. */
export async function createMarketplaceOrder(input: {
  buyerId: string;
  beatId: string;
  sku: "lease" | "wav" | "exclusive";
  paymentMethod?: string;
}) {
  const takeRateBps = await getEffectiveTakeRateBps();

  return prisma.$transaction(async (tx) => {
    const beat = await tx.beat.findUnique({ where: { id: input.beatId } });
    if (!beat) throw new OrderError("BEAT_UNAVAILABLE", "Beat không còn bán");
    if (input.sku === "exclusive" && beat.sampleFlag === "uncleared") {
      throw new OrderError("EXCLUSIVE_FORBIDDEN_UNCLEARED", "Không bán Exclusive khi sample chưa clear");
    }

    if (input.sku === "exclusive") {
      const reserved = await tx.beat.updateMany({
        where: { id: beat.id, status: "available" },
        data: { status: "reserved", reservedAt: new Date() },
      });
      if (reserved.count !== 1) {
        throw new OrderError("EXCLUSIVE_CONFLICT", "EXCLUSIVE_CONFLICT");
      }
    } else if (beat.status !== "available") {
      // sold_exclusive / reserved / delisted: block new lease/WAV; prior paid leases stay valid
      throw new OrderError("BEAT_UNAVAILABLE", "Beat không còn bán");
    }

    const amountVnd =
      input.sku === "lease" ? beat.priceLease : input.sku === "wav" ? beat.priceWav : beat.priceExclusive;

    const ledger = computeOrderLedger({ gmvVnd: amountVnd, takeRateBps, momoFeeVnd: 0 });

    const method = input.paymentMethod || "momo";
    const awaiting =
      method === "momo" || method === "ck" ? "pending_ck" : "awaiting_payment";

    return tx.order.create({
      data: {
        buyerId: input.buyerId,
        beatId: beat.id,
        sku: input.sku,
        amountVnd,
        takeRateBps,
        ...ledger,
        status: awaiting,
        paymentMethod: method,
      },
    });
  });
}
