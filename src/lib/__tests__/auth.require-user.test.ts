import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

import { createSessionToken, requireUser, type SessionUser } from "@/lib/auth";

const buyerSession: SessionUser = {
  id: "user_buyer",
  email: "buyer@example.com",
  name: "Buyer",
  role: "buyer",
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SESSION_SECRET = "ci-session-secret-change-me-min-32chars";
});

describe("requireUser admin gate", () => {
  it("returns null when non-admin session requests admin role", async () => {
    const token = createSessionToken(buyerSession);
    cookiesMock.mockReturnValue({
      get: (name: string) => (name === "rap_session" ? { value: token } : undefined),
    });
    findUniqueMock.mockResolvedValue({
      id: buyerSession.id,
      email: buyerSession.email,
      name: buyerSession.name,
      role: "buyer",
    });

    const result = await requireUser(["admin"]);
    expect(result).toBeNull();
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: buyerSession.id } });
  });

  it("returns admin user when role matches", async () => {
    const adminSession: SessionUser = {
      id: "user_admin",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
    };
    const token = createSessionToken(adminSession);
    cookiesMock.mockReturnValue({
      get: (name: string) => (name === "rap_session" ? { value: token } : undefined),
    });
    findUniqueMock.mockResolvedValue({
      id: adminSession.id,
      email: adminSession.email,
      name: adminSession.name,
      role: "admin",
    });

    const result = await requireUser(["admin"]);
    expect(result).toEqual(adminSession);
  });

  it("returns null when no session cookie", async () => {
    cookiesMock.mockReturnValue({
      get: () => undefined,
    });
    const result = await requireUser(["admin"]);
    expect(result).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
