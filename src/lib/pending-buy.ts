export type PendingBuy = {
  beatId: string;
  sku: "lease" | "wav" | "exclusive";
};

const KEY = "rap_pending_buy";

export function setPendingBuy(intent: PendingBuy) {
  sessionStorage.setItem(KEY, JSON.stringify(intent));
}

export function takePendingBuy(): PendingBuy | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingBuy;
    if (!parsed.beatId || !parsed.sku) return null;
    return parsed;
  } catch {
    return null;
  }
}
