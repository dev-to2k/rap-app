/**
 * MoMo personal CK display phone — from PAYMENT_MOMO_PHONE only.
 * Never hardcode alternate digits in UI; callers read this helper / API.
 */
export function getPaymentMomoPhone(): string {
  return process.env.PAYMENT_MOMO_PHONE?.trim() || "";
}
