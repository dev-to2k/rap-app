import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const updateMany = vi.fn();
const orderCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformConfig: {
      findUnique: async () => null,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        beat: {
          findUnique: (...args: unknown[]) => findUnique(...args),
          updateMany: (...args: unknown[]) => updateMany(...args),
        },
        order: {
          create: (...args: unknown[]) => orderCreate(...args),
        },
      }),
  },
}));

import { createMarketplaceOrder } from "@/lib/orders";

function beat(sampleFlag: string | null | undefined) {
  return {
    id: "beat_1",
    sampleFlag,
    status: "available",
    priceLease: 100_000,
    priceWav: 200_000,
    priceExclusive: 1_000_000,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  updateMany.mockResolvedValue({ count: 1 });
  orderCreate.mockResolvedValue({ id: "ord_1" });
});

describe("createMarketplaceOrder exclusive sample gate", () => {
  it("allows exclusive only when sampleFlag is exactly clean, and creates the order", async () => {
    findUnique.mockResolvedValue(beat("clean"));

    await createMarketplaceOrder({ buyerId: "buyer_1", beatId: "beat_1", sku: "exclusive" });

    expect(orderCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects uncleared, missing, and unexpected flags before order.create", async () => {
    for (const flag of ["uncleared", null, undefined, "", "unknown"] as const) {
      findUnique.mockResolvedValue(beat(flag));
      orderCreate.mockClear();
      updateMany.mockClear();

      await expect(
        createMarketplaceOrder({ buyerId: "buyer_1", beatId: "beat_1", sku: "exclusive" }),
      ).rejects.toMatchObject({ code: "EXCLUSIVE_FORBIDDEN_UNCLEARED" });

      expect(orderCreate).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
    }
  });

  it("leaves lease and WAV unchanged when the sample flag is not clean", async () => {
    for (const sku of ["lease", "wav"] as const) {
      findUnique.mockResolvedValue(beat("uncleared"));
      orderCreate.mockClear();

      await createMarketplaceOrder({ buyerId: "buyer_1", beatId: "beat_1", sku });

      expect(orderCreate).toHaveBeenCalledTimes(1);
      expect(orderCreate.mock.calls[0]?.[0]).toMatchObject({
        data: expect.objectContaining({ sku }),
      });
    }
  });
});

