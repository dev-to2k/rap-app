import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();
const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const unlockOrderMock = vi.fn();
const releaseExclusiveReserveMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

vi.mock("@/lib/unlock", () => ({
  unlockOrder: (...args: unknown[]) => unlockOrderMock(...args),
}));

vi.mock("@/lib/orders", () => ({
  releaseExclusiveReserve: (...args: unknown[]) => releaseExclusiveReserveMock(...args),
}));

import { confirmPaymentAndUnlock } from "@/lib/confirm-payment";

const baseOrder = {
  id: "ord_1",
  beatId: "beat_1",
  sku: "lease",
  amountVnd: 100_000,
  takeRateBps: 2000,
  momoFeeVnd: 0,
  status: "pending_ck",
  paymentRef: null as string | null,
  webhookIdempotencyKey: null as string | null,
  unlockedAt: null as Date | null,
  license: null as { id: string } | null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmPaymentAndUnlock", () => {
  it("pending_ck → unlock happy path", async () => {
    findFirstMock.mockResolvedValue(null);
    findUniqueMock.mockResolvedValue({ ...baseOrder });
    updateMock.mockResolvedValue({ ...baseOrder, status: "paid" });

    const unlockedOrder = { ...baseOrder, status: "unlocked", unlockedAt: new Date() };
    const license = { id: "lic_1" };
    unlockOrderMock.mockResolvedValue({
      order: unlockedOrder,
      license,
      already: false,
    });

    const result = await confirmPaymentAndUnlock({
      orderId: "ord_1",
      amountVnd: 100_000,
      idempotencyKey: "idem_ck_1",
      paymentRef: "CK-REF-1",
    });

    expect(result).toEqual({
      kind: "ok",
      order: unlockedOrder,
      license,
      already: false,
    });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ord_1" },
        data: expect.objectContaining({
          status: "paid",
          webhookIdempotencyKey: "idem_ck_1",
          paymentRef: "CK-REF-1",
        }),
      }),
    );
    expect(unlockOrderMock).toHaveBeenCalledWith("ord_1");
  });

  it("idempotent when order already unlocked", async () => {
    const unlocked = {
      ...baseOrder,
      status: "unlocked",
      unlockedAt: new Date(),
      webhookIdempotencyKey: null,
    };
    findFirstMock.mockResolvedValue(null);
    findUniqueMock.mockResolvedValue(unlocked);

    const result = await confirmPaymentAndUnlock({
      orderId: "ord_1",
      amountVnd: 100_000,
      idempotencyKey: "idem_ck_2",
    });

    expect(result).toEqual({ kind: "idempotent", order: unlocked });
    expect(updateMock).not.toHaveBeenCalled();
    expect(unlockOrderMock).not.toHaveBeenCalled();
  });

  it("idempotent when webhookIdempotencyKey already consumed", async () => {
    const existing = {
      ...baseOrder,
      status: "unlocked",
      unlockedAt: new Date(),
      webhookIdempotencyKey: "idem_ck_3",
      license: { id: "lic_1" },
    };
    findFirstMock.mockResolvedValue(existing);

    const result = await confirmPaymentAndUnlock({
      orderId: "ord_1",
      amountVnd: 100_000,
      idempotencyKey: "idem_ck_3",
    });

    expect(result).toEqual({ kind: "idempotent", order: existing });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(unlockOrderMock).not.toHaveBeenCalled();
  });
});
