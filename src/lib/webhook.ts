import crypto from "crypto";
import { getWebhookSecret, timingSafeEqualStr } from "./security";

/** Stub webhook verification — HMAC of body with WEBHOOK_SECRET. Fail-closed in production. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = getWebhookSecret();
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualStr(expected, signature);
}

export function signWebhookBody(body: object): { raw: string; signature: string } {
  const raw = JSON.stringify(body);
  const secret = getWebhookSecret();
  if (!secret) {
    throw new Error("WEBHOOK_SECRET missing/default — refuse signing in production");
  }
  const signature = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  return { raw, signature };
}

export { getWebhookSecret };
