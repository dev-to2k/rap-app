import { beforeAll, describe, expect, it } from "vitest";
import {
  SESSION_COOKIE,
  createSessionToken,
  parseSessionToken,
  type SessionUser,
} from "@/lib/auth";

const sampleUser: SessionUser = {
  id: "user_1",
  email: "buyer@example.com",
  name: "Buyer One",
  role: "buyer",
};

beforeAll(() => {
  process.env.SESSION_SECRET = "ci-session-secret-change-me-min-32chars";
});

describe("session cookie + sign/verify", () => {
  it("exports SESSION_COOKIE as rap_session", () => {
    expect(SESSION_COOKIE).toBe("rap_session");
  });

  it("createSessionToken + parseSessionToken round-trip", () => {
    const token = createSessionToken(sampleUser);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(parseSessionToken(token)).toEqual(sampleUser);
  });

  it("rejects tampered signature", () => {
    const token = createSessionToken(sampleUser);
    const [body] = token.split(".");
    expect(parseSessionToken(`${body}.deadbeef`)).toBeNull();
  });

  it("rejects malformed token", () => {
    expect(parseSessionToken("")).toBeNull();
    expect(parseSessionToken("no-dot")).toBeNull();
  });
});
