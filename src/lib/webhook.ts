import crypto from "crypto";

/** Stub webhook verification — HMAC of body with WEBHOOK_SECRET */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.WEBHOOK_SECRET || "dev-webhook-secret-change-in-prod";
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function signWebhookBody(body: object): { raw: string; signature: string } {
  const raw = JSON.stringify(body);
  const secret = process.env.WEBHOOK_SECRET || "dev-webhook-secret-change-in-prod";
  const signature = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  return { raw, signature };
}
