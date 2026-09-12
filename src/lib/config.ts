/** Platform config — take-rate defaults; promo flag optional */
export const DEFAULT_TAKE_RATE_BPS = 1500; // 15%
export const PROMO_TAKE_RATE_BPS = 1200; // optional 12% / 90d seed flag
export const DOWNLOAD_TTL_SECONDS = 300; // 5 min signed URLs
export const SKU_LABELS: Record<string, string> = {
  lease: "Lease MP3",
  wav: "WAV + Stems",
  exclusive: "Exclusive",
};

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "₫";
}
