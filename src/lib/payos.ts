import crypto from "crypto";
import { timingSafeEqualStr } from "./security";

/** Unpaid payOS / awaiting-payment TTL (CoS LOCK). */
export const PAYOS_PAYMENT_TTL_MINUTES = 60;

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

function envStr(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export type PayosConfig = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
};

/** True when all three PAYOS_* keys are set (sandbox or prod). */
export function isPayosConfigured(): boolean {
  return Boolean(envStr("PAYOS_CLIENT_ID") && envStr("PAYOS_API_KEY") && envStr("PAYOS_CHECKSUM_KEY"));
}

/** Returns config or null when keys missing — callers must fall back to CK rail. */
export function getPayosConfig(): PayosConfig | null {
  const clientId = envStr("PAYOS_CLIENT_ID");
  const apiKey = envStr("PAYOS_API_KEY");
  const checksumKey = envStr("PAYOS_CHECKSUM_KEY");
  if (!clientId || !apiKey || !checksumKey) return null;
  return { clientId, apiKey, checksumKey };
}

function sortObjDataByKey(object: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(object)
    .sort()
    .reduce<Record<string, unknown>>((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
}

function convertObjToQueryStr(object: Record<string, unknown>): string {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      let value: unknown = object[key];
      if (value && Array.isArray(value)) {
        value = JSON.stringify(
          value.map((val) =>
            val && typeof val === "object" && !Array.isArray(val)
              ? sortObjDataByKey(val as Record<string, unknown>)
              : val,
          ),
        );
      }
      if (value === null || value === undefined || value === "undefined" || value === "null") {
        value = "";
      }
      return `${key}=${value}`;
    })
    .join("&");
}

/** HMAC-SHA256 over alphabetically sorted key=value&... (webhook + generic obj). */
export function createSignatureFromObj(data: Record<string, unknown>, checksumKey: string): string {
  const sorted = sortObjDataByKey(data);
  const qs = convertObjToQueryStr(sorted);
  return crypto.createHmac("sha256", checksumKey).update(qs).digest("hex");
}

/**
 * Signature for POST /v2/payment-requests:
 * amount=&cancelUrl=&description=&orderCode=&returnUrl= (alphabet order).
 */
export function createPaymentRequestSignature(
  fields: {
    amount: number;
    cancelUrl: string;
    description: string;
    orderCode: number;
    returnUrl: string;
  },
  checksumKey: string,
): string {
  const raw = `amount=${fields.amount}&cancelUrl=${fields.cancelUrl}&description=${fields.description}&orderCode=${fields.orderCode}&returnUrl=${fields.returnUrl}`;
  return crypto.createHmac("sha256", checksumKey).update(raw).digest("hex");
}

export function verifyPayosWebhookData(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string,
): boolean {
  if (!signature || !checksumKey) return false;
  const expected = createSignatureFromObj(data, checksumKey);
  return timingSafeEqualStr(expected, signature);
}

export type PayosWebhookPayload = {
  code?: string;
  desc?: string;
  success?: boolean;
  data?: Record<string, unknown>;
  signature?: string;
};

export function verifyPayosWebhook(body: PayosWebhookPayload): {
  ok: boolean;
  reason?: string;
  data?: Record<string, unknown>;
} {
  const cfg = getPayosConfig();
  if (!cfg) return { ok: false, reason: "PAYOS_KEYS_MISSING" };
  if (!body || typeof body !== "object") return { ok: false, reason: "INVALID_BODY" };
  const data = body.data;
  const signature = body.signature;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, reason: "DATA_MISSING" };
  }
  if (typeof signature !== "string" || !signature) {
    return { ok: false, reason: "SIGNATURE_MISSING" };
  }
  if (!verifyPayosWebhookData(data, signature, cfg.checksumKey)) {
    return { ok: false, reason: "SIGNATURE_INVALID" };
  }
  return { ok: true, data };
}

/** Unique numeric orderCode for payOS (≤ JS safe integer). */
export function generatePayosOrderCode(): number {
  // 13-digit ms + 3-digit random → fits Number.MAX_SAFE_INTEGER
  const ms = Date.now() % 1_000_000_000_000; // 12 digits
  const rnd = Math.floor(Math.random() * 900) + 100; // 3 digits
  return ms * 1000 + rnd;
}

export function formatPayosPaymentRef(orderCode: number, paymentLinkId: string): string {
  return `payos:${orderCode}:${paymentLinkId}`;
}

export function parsePayosPaymentRef(
  paymentRef: string | null | undefined,
): { orderCode: number; paymentLinkId: string } | null {
  if (!paymentRef) return null;
  const m = /^payos:(\d+):([A-Za-z0-9_-]+)$/.exec(paymentRef.trim());
  if (!m) return null;
  const orderCode = Number(m[1]);
  if (!Number.isFinite(orderCode)) return null;
  return { orderCode, paymentLinkId: m[2]! };
}

export function payosCheckoutUrl(paymentLinkId: string): string {
  return `https://pay.payos.vn/web/${paymentLinkId}`;
}

export type CreatePayosPaymentInput = {
  orderCode: number;
  amountVnd: number;
  /** Short desc — payOS non-linked banks limit ~9 chars */
  description: string;
  returnUrl: string;
  cancelUrl: string;
  /** Unix seconds; defaults to now + PAYOS_PAYMENT_TTL_MINUTES */
  expiredAt?: number;
};

export type CreatePayosPaymentResult =
  | {
      ok: true;
      orderCode: number;
      amount: number;
      paymentLinkId: string;
      checkoutUrl: string;
      qrCode: string;
      status: string;
      accountNumber?: string;
      accountName?: string;
      bin?: string;
    }
  | { ok: false; error: string; code?: string };

/**
 * Create payOS payment link (sandbox/prod same API host).
 * Missing keys → graceful { ok:false } — never throw for config gaps.
 */
export async function createPayosPaymentLink(
  input: CreatePayosPaymentInput,
): Promise<CreatePayosPaymentResult> {
  const cfg = getPayosConfig();
  if (!cfg) {
    return { ok: false, error: "PAYOS_KEYS_MISSING", code: "PAYOS_KEYS_MISSING" };
  }

  const expiredAt =
    input.expiredAt ??
    Math.floor(Date.now() / 1000) + PAYOS_PAYMENT_TTL_MINUTES * 60;

  const description = input.description.slice(0, 25);
  const signature = createPaymentRequestSignature(
    {
      amount: input.amountVnd,
      cancelUrl: input.cancelUrl,
      description,
      orderCode: input.orderCode,
      returnUrl: input.returnUrl,
    },
    cfg.checksumKey,
  );

  const body = {
    orderCode: input.orderCode,
    amount: input.amountVnd,
    description,
    cancelUrl: input.cancelUrl,
    returnUrl: input.returnUrl,
    expiredAt,
    signature,
  };

  try {
    const res = await fetch(`${PAYOS_API_BASE}/v2/payment-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": cfg.clientId,
        "x-api-key": cfg.apiKey,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as {
      code?: string;
      desc?: string;
      data?: {
        orderCode?: number;
        amount?: number;
        paymentLinkId?: string;
        checkoutUrl?: string;
        qrCode?: string;
        status?: string;
        accountNumber?: string;
        accountName?: string;
        bin?: string;
      };
    } | null;

    if (!res.ok || !json || json.code !== "00" || !json.data?.paymentLinkId) {
      const msg = json?.desc || `PAYOS_HTTP_${res.status}`;
      console.error("createPayosPaymentLink failed", msg, json?.code);
      return { ok: false, error: msg, code: json?.code || "PAYOS_CREATE_FAILED" };
    }

    const d = json.data;
    const paymentLinkId = String(d.paymentLinkId);
    return {
      ok: true,
      orderCode: Number(d.orderCode ?? input.orderCode),
      amount: Number(d.amount ?? input.amountVnd),
      paymentLinkId,
      checkoutUrl: d.checkoutUrl || payosCheckoutUrl(paymentLinkId),
      qrCode: d.qrCode || "",
      status: d.status || "PENDING",
      accountNumber: d.accountNumber,
      accountName: d.accountName,
      bin: d.bin,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("createPayosPaymentLink error", msg);
    return { ok: false, error: msg, code: "PAYOS_NETWORK_ERROR" };
  }
}

/** Short VN-safe description from order id (payOS bank desc length limits). */
export function payosDescriptionForOrder(orderId: string): string {
  const tail = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "RAP";
  return `RAP${tail}`.slice(0, 9);
}
