import { describe, expect, it } from "vitest";
import { buildMomoCkQrPayload } from "@/lib/momo-ck-qr";

describe("buildMomoCkQrPayload", () => {
  it("encodes phone|amountVnd|transferContent as one line", () => {
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: 150_000,
        transferContent: "RAP-ORD123",
      }),
    ).toBe("0901234567|150000|RAP-ORD123");
  });

  it("trims phone and transferContent", () => {
    expect(
      buildMomoCkQrPayload({
        phone: "  0901234567  ",
        amountVnd: 99_000,
        transferContent: "  CK-1  ",
      }),
    ).toBe("0901234567|99000|CK-1");
  });

  it("rounds amount to integer VND", () => {
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: 100_000.6,
        transferContent: "X",
      }),
    ).toBe("0901234567|100001|X");
  });

  it("returns null when phone missing", () => {
    expect(
      buildMomoCkQrPayload({
        phone: "  ",
        amountVnd: 10_000,
        transferContent: "X",
      }),
    ).toBeNull();
  });

  it("returns null when amount missing or non-positive", () => {
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: 0,
        transferContent: "X",
      }),
    ).toBeNull();
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: -1,
        transferContent: "X",
      }),
    ).toBeNull();
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: null,
        transferContent: "X",
      }),
    ).toBeNull();
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: Number.NaN,
        transferContent: "X",
      }),
    ).toBeNull();
  });

  it("returns null when transferContent missing", () => {
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: 10_000,
        transferContent: "",
      }),
    ).toBeNull();
    expect(
      buildMomoCkQrPayload({
        phone: "0901234567",
        amountVnd: 10_000,
        transferContent: null,
      }),
    ).toBeNull();
  });
});
