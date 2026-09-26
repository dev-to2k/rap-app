import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const confirmMock = vi.fn();
vi.mock("@/lib/confirm-payment", () => ({
  confirmPaymentAndUnlock: (...args: unknown[]) => confirmMock(...args),
}));

import { PAYOS_TTL_EXPIRE_STATUSES } from "@/lib/payment-ttl";
import {
  createPaymentRequestSignature,
  createSignatureFromObj,
  formatPayosPaymentRef,
  getPayosConfig,
  isPayosConfigured,
  parsePayosPaymentRef,
  verifyPayosWebhook,
  verifyPayosWebhookData,
} from "@/lib/payos";

const CHECKSUM = "1a54716c8f0efb2744fb28b6e38b25da7f67a925d98bc1c18bd8faaecadd7675";

const sampleData = {
  orderCode: 123,
  amount: 3000,
  description: "VQRIO123",
  accountNumber: "12345678",
  reference: "TF230204212323",
  transactionDateTime: "2023-02-04 18:25:00",
  currency: "VND",
  paymentLinkId: "124c33293c43417ab7879e14c8d9eb18",
  code: "00",
  desc: "Thành công",
  counterAccountBankId: "",
  counterAccountBankName: "",
  counterAccountName: "",
  counterAccountNumber: "",
  virtualAccountName: "",
  virtualAccountNumber: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.PAYOS_CLIENT_ID;
  delete process.env.PAYOS_API_KEY;
  delete process.env.PAYOS_CHECKSUM_KEY;
});

describe("payos config", () => {
  it("missing keys → not configured, getPayosConfig null (no crash)", () => {
    expect(isPayosConfigured()).toBe(false);
    expect(getPayosConfig()).toBeNull();
  });

  it("all three keys → configured", () => {
    process.env.PAYOS_CLIENT_ID = "cid";
    process.env.PAYOS_API_KEY = "akey";
    process.env.PAYOS_CHECKSUM_KEY = CHECKSUM;
    expect(isPayosConfigured()).toBe(true);
    expect(getPayosConfig()?.clientId).toBe("cid");
  });
});

describe("payos signatures", () => {
  it("webhook signature happy path (docs sample)", () => {
    const expected = "412e915d2871504ed31be63c8f62a149a4410d34c4c42affc9006ef9917eaa03";
    expect(verifyPayosWebhookData(sampleData, expected, CHECKSUM)).toBe(true);
    expect(createSignatureFromObj(sampleData, CHECKSUM)).toBe(expected);
  });

  it("webhook signature bad → reject", () => {
    expect(verifyPayosWebhookData(sampleData, "deadbeef", CHECKSUM)).toBe(false);
    expect(
      verifyPayosWebhookData({ ...sampleData, amount: 9999 }, "412e915d2871504ed31be63c8f62a149a4410d34c4c42affc9006ef9917eaa03", CHECKSUM),
    ).toBe(false);
  });

  it("payment request signature order", () => {
    const fields = {
      amount: 10000,
      cancelUrl: "https://example.com/cancel",
      description: "RAPTEST01",
      orderCode: 99,
      returnUrl: "https://example.com/return",
    };
    const raw = `amount=${fields.amount}&cancelUrl=${fields.cancelUrl}&description=${fields.description}&orderCode=${fields.orderCode}&returnUrl=${fields.returnUrl}`;
    const expected = createHmac("sha256", CHECKSUM).update(raw).digest("hex");
    expect(createPaymentRequestSignature(fields, CHECKSUM)).toBe(expected);
  });

  it("verifyPayosWebhook missing keys → PAYOS_KEYS_MISSING", () => {
    const sig = createSignatureFromObj(sampleData, CHECKSUM);
    const out = verifyPayosWebhook({
      code: "00",
      success: true,
      data: sampleData,
      signature: sig,
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("PAYOS_KEYS_MISSING");
  });

  it("verifyPayosWebhook happy when keys set", () => {
    process.env.PAYOS_CLIENT_ID = "cid";
    process.env.PAYOS_API_KEY = "akey";
    process.env.PAYOS_CHECKSUM_KEY = CHECKSUM;
    const sig = createSignatureFromObj(sampleData, CHECKSUM);
    const out = verifyPayosWebhook({
      code: "00",
      success: true,
      data: sampleData,
      signature: sig,
    });
    expect(out.ok).toBe(true);
    expect(out.data?.orderCode).toBe(123);
  });
});

describe("paymentRef helpers", () => {
  it("format + parse roundtrip", () => {
    const ref = formatPayosPaymentRef(42, "abcLINK");
    expect(ref).toBe("payos:42:abcLINK");
    expect(parsePayosPaymentRef(ref)).toEqual({ orderCode: 42, paymentLinkId: "abcLINK" });
    expect(parsePayosPaymentRef("nope")).toBeNull();
  });
});

describe("POST /api/webhooks/payos", () => {
  it("bad signature → 401; valid → confirmPaymentAndUnlock", async () => {
    process.env.PAYOS_CLIENT_ID = "cid";
    process.env.PAYOS_API_KEY = "akey";
    process.env.PAYOS_CHECKSUM_KEY = CHECKSUM;

    const { prisma } = await import("@/lib/prisma");
    const findFirst = prisma.order.findFirst as ReturnType<typeof vi.fn>;
    findFirst.mockResolvedValue({
      id: "ord_payos_1",
      amountVnd: 3000,
      status: "awaiting_payment",
      paymentRef: "payos:123:124c33293c43417ab7879e14c8d9eb18",
    });

    confirmMock.mockResolvedValue({
      kind: "ok",
      order: { id: "ord_payos_1", status: "unlocked" },
      license: { id: "lic_1" },
      already: false,
    });

    const { POST } = await import("@/app/api/webhooks/payos/route");

    const badBody = {
      code: "00",
      success: true,
      data: sampleData,
      signature: "00".repeat(32),
    };
    const badRes = await POST(
      new Request("http://localhost/api/webhooks/payos", {
        method: "POST",
        body: JSON.stringify(badBody),
      }) as never,
    );
    expect(badRes.status).toBe(401);
    expect(confirmMock).not.toHaveBeenCalled();

    const goodSig = createSignatureFromObj(sampleData, CHECKSUM);
    const goodBody = {
      code: "00",
      success: true,
      data: sampleData,
      signature: goodSig,
    };
    const goodRes = await POST(
      new Request("http://localhost/api/webhooks/payos", {
        method: "POST",
        body: JSON.stringify(goodBody),
      }) as never,
    );
    expect(goodRes.status).toBe(200);
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord_payos_1",
        amountVnd: 3000,
        idempotencyKey: "payos:124c33293c43417ab7879e14c8d9eb18",
      }),
    );
  });
});


describe("payOS payment TTL CoS lock", () => {
  it("expires only awaiting_payment — not pending_ck or pending", () => {
    expect([...PAYOS_TTL_EXPIRE_STATUSES]).toEqual(["awaiting_payment"]);
    expect(PAYOS_TTL_EXPIRE_STATUSES).not.toContain("pending_ck");
    expect(PAYOS_TTL_EXPIRE_STATUSES).not.toContain("pending");
  });
});
