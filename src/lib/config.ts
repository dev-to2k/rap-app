/** Platform config — take-rate defaults; promo flag optional */
export const DEFAULT_TAKE_RATE_BPS = 1500; // 15%
export const PROMO_TAKE_RATE_BPS = 1200; // optional 12% / 90d seed flag
export const DOWNLOAD_TTL_SECONDS = 900; // 15 min signed URLs (R2 + HMAC)
export const SKU_LABELS: Record<string, string> = {
  lease: "Lease MP3",
  wav: "WAV + Stems",
  exclusive: "Exclusive",
};

export const DEFAULT_CURRENCY = "VND";
export const DEFAULT_CURRENCY_LOCALE = "vi-VN";

const ZERO_DECIMAL_CURRENCIES = new Set([DEFAULT_CURRENCY]);

export function currencyScale(currency = DEFAULT_CURRENCY): 0 | 2 {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

export function currencyLocale(currency = DEFAULT_CURRENCY): string {
  return currency.toUpperCase() === DEFAULT_CURRENCY ? DEFAULT_CURRENCY_LOCALE : "en-US";
}

export function currencySymbol(currency = DEFAULT_CURRENCY): string {
  const code = currency.toUpperCase();
  try {
    const part = new Intl.NumberFormat(currencyLocale(code), {
      style: "currency",
      currency: code,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value ?? code;
  } catch {
    return code;
  }
}

export function currencyDigits(raw: string | number | null | undefined): string {
  return String(raw ?? "").replace(/[^\d]/g, "");
}

export function parseMoneyInput(raw: string, currency = DEFAULT_CURRENCY): string {
  const scale = currencyScale(currency);
  if (scale === 0) return currencyDigits(raw);
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const sep = Math.max(lastComma, lastDot);
  if (sep === -1) return currencyDigits(raw);
  const intPart = currencyDigits(raw.slice(0, sep));
  const frac = currencyDigits(raw.slice(sep + 1)).slice(0, scale);
  const keepSep = /[.,]$/.test(raw) || frac.length > 0;
  if (!intPart && !frac) return keepSep ? "0." : "";
  return keepSep ? `${intPart || "0"}.${frac}` : intPart;
}

export function formatMoneyInput(raw: string, currency = DEFAULT_CURRENCY): string {
  if (!raw) return "";
  const scale = currencyScale(currency);
  const locale = currencyLocale(currency);
  if (scale === 0) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(raw));
  }
  const [intPart, frac] = raw.split(".");
  const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(intPart || "0"));
  if (raw.includes(".")) return `${grouped}.${frac ?? ""}`;
  return grouped;
}

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY): string {
  const code = currency.toUpperCase();
  const scale = currencyScale(code);
  if (!Number.isFinite(amount)) amount = 0;
  try {
    return new Intl.NumberFormat(currencyLocale(code), {
      style: "currency",
      currency: code,
      minimumFractionDigits: scale,
      maximumFractionDigits: scale,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(currencyLocale(code), {
      minimumFractionDigits: scale,
      maximumFractionDigits: scale,
    }).format(amount)} ${code}`;
  }
}

export function formatVnd(amount: number): string {
  return formatMoney(amount, DEFAULT_CURRENCY);
}

export function formatVndInput(digits: string): string {
  return formatMoneyInput(digits, DEFAULT_CURRENCY);
}
