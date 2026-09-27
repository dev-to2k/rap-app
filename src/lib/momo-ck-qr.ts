/**
 * MoMo personal CK QR — free client-side payload (no MoMo Business / paid API).
 *
 * Payload format (plain text, ONE line):
 *   `{phone}|{amountVnd}|{transferContent}`
 *
 * Example: `0901234567|150000|RAP-ORD123`
 *
 * MoMo app does NOT auto-fill from this QR; buyer must cross-check the 3 fields on screen.
 */
export type MomoCkQrInput = {
  phone?: string | null;
  amountVnd?: number | null;
  transferContent?: string | null;
};

/**
 * Build CK QR payload, or `null` when any required field is missing / invalid
 * (so the UI can hide the QR instead of rendering a broken code).
 */
export function buildMomoCkQrPayload(input: MomoCkQrInput): string | null {
  const phone = (input.phone ?? "").trim();
  const transferContent = (input.transferContent ?? "").trim();
  const amount = input.amountVnd;

  if (!phone || !transferContent) return null;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;

  const amountVnd = Math.round(amount);
  if (amountVnd <= 0) return null;

  return `${phone}|${amountVnd}|${transferContent}`;
}
