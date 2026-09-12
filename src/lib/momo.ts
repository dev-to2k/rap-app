import crypto from "crypto";
import { timingSafeEqualStr } from "./security";

/** MoMo AIOv2 IPN field order for raw signature (accessKey from env, never from body). */
const IPN_SIG_FIELDS = [
  "accessKey",
  "amount",
  "extraData",
  "message",
  "orderId",
  "orderInfo",
  "orderType",
  "partnerCode",
  "payType",
  "requestId",
  "responseTime",
  "resultCode",
  "transId",
] as const;

function envStr(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function fieldValue(body: Record<string, unknown>, key: string): string {
  if (key === "accessKey") return envStr("MOMO_ACCESS_KEY");
  const v = body[key];
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Build MoMo AIOv2 IPN raw signature string then HMAC-SHA256 hex. Never logs secrets. */
export function buildIpnRawSignature(body: Record<string, unknown>): string {
  const secretKey = envStr("MOMO_SECRET_KEY");
  const raw = IPN_SIG_FIELDS.map((k) => `${k}=${fieldValue(body, k)}`).join("&");
  return crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
}

export function isMomoIpnPayload(body: unknown): body is Record<string, unknown> {
  return (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    "signature" in body &&
    (body as Record<string, unknown>).signature !== undefined &&
    (body as Record<string, unknown>).signature !== null
  );
}

export function verifyMomoIpn(body: Record<string, unknown>): { ok: boolean; reason?: string } {
  const secretKey = envStr("MOMO_SECRET_KEY");
  const accessKey = envStr("MOMO_ACCESS_KEY");
  if (!secretKey || !accessKey) {
    return { ok: false, reason: "MOMO_KEYS_MISSING" };
  }

  const partnerCodeEnv = envStr("MOMO_PARTNER_CODE");
  if (partnerCodeEnv) {
    const bodyPartner = body.partnerCode != null ? String(body.partnerCode) : "";
    if (bodyPartner !== partnerCodeEnv) {
      return { ok: false, reason: "PARTNER_CODE_MISMATCH" };
    }
  }

  const sig = body.signature;
  if (typeof sig !== "string" || !sig) {
    return { ok: false, reason: "SIGNATURE_MISSING" };
  }

  const expected = buildIpnRawSignature(body);
  if (!timingSafeEqualStr(expected, sig)) {
    return { ok: false, reason: "SIGNATURE_INVALID" };
  }

  return { ok: true };
}
