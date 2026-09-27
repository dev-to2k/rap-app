import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security", () => ({
  allowPaymentMocks: vi.fn(() => false),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findUnique: vi.fn(), update: vi.fn() } },
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/webhook", () => ({
  signWebhookBody: vi.fn(),
}));

vi.mock("@/lib/orders", () => ({
  releaseExclusiveReserve: vi.fn(),
}));

describe("POST /api/pay/mock when mocks disabled", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("GET/OPTIONS/POST all return 404 Not found", async () => {
    const mod = await import("@/app/api/pay/mock/route");
    for (const fn of [mod.GET, mod.OPTIONS, mod.HEAD, mod.PUT, mod.PATCH, mod.DELETE]) {
      const res = await fn();
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not found" });
    }
    const postRes = await mod.POST(new Request("http://localhost/api/pay/mock", { method: "POST" }) as never);
    expect(postRes.status).toBe(404);
    expect(await postRes.json()).toEqual({ error: "Not found" });
  });
});
