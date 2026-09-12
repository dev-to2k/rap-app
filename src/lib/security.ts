import crypto from "crypto";

const DEFAULT_SESSION = "dev-session-secret-change-in-prod-min-32chars";
const DEFAULT_WEBHOOK = "dev-webhook-secret-change-in-prod";
const DEFAULT_DOWNLOAD = "change-me-download-hmac-secret!!!!";
const EXAMPLE_SESSION = "change-me-session-secret-min-32-chars!!";
const EXAMPLE_WEBHOOK = "change-me-webhook-secret!!!!!!!!!!!!";

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/** Mocks only when NODE_ENV!==production AND ALLOW_PAYMENT_MOCKS==="true". */
export function allowPaymentMocks(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_PAYMENT_MOCKS === "true";
}

function isWeakSecret(s: string | undefined, defaults: string[]): boolean {
  const v = s?.trim() ?? "";
  if (!v) return true;
  return defaults.some((d) => v === d || v.includes("change-me"));
}

export function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET?.trim() ?? "";
  if (isProductionRuntime()) {
    if (isWeakSecret(s, [DEFAULT_SESSION, EXAMPLE_SESSION]) || s.length < 32) {
      throw new Error("SESSION_SECRET missing/default — refuse auth secrets in production");
    }
    return s;
  }
  return s || DEFAULT_SESSION;
}

export function assertSessionSecret(): string {
  return getSessionSecret();
}

/** Returns null when secret is missing/default in production (fail closed, no throw). */
export function getWebhookSecret(): string | null {
  const s = process.env.WEBHOOK_SECRET?.trim() ?? "";
  if (isProductionRuntime()) {
    if (isWeakSecret(s, [DEFAULT_WEBHOOK, EXAMPLE_WEBHOOK]) || s.includes("dev-webhook")) {
      return null;
    }
    return s;
  }
  return s || DEFAULT_WEBHOOK;
}

export function assertWebhookSecret(): string {
  const s = getWebhookSecret();
  if (!s) throw new Error("WEBHOOK_SECRET missing/default — refuse webhooks in production");
  return s;
}

export function getDownloadSecret(): string {
  const s = process.env.DOWNLOAD_HMAC_SECRET?.trim() ?? "";
  if (isProductionRuntime()) {
    if (isWeakSecret(s, [DEFAULT_DOWNLOAD]) || s.includes("change-me")) {
      throw new Error("DOWNLOAD_HMAC_SECRET missing/default");
    }
    return s;
  }
  return s || DEFAULT_DOWNLOAD;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

const hits = new Map<string, { n: number; t: number }>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now - cur.t > windowMs) {
    hits.set(key, { n: 1, t: now });
    return true;
  }
  if (cur.n >= limit) return false;
  cur.n += 1;
  return true;
}

export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim() || "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function sessionCookieSecure(): boolean {
  if (isProductionRuntime()) return true;
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return appUrl.startsWith("https://");
}
