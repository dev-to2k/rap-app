export type PendingBuy = {
  beatId: string;
  sku: "lease" | "wav" | "exclusive";
};

const KEY = "rap_pending_buy";

function parse(raw: string | null): PendingBuy | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingBuy;
    if (!parsed.beatId || !parsed.sku) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setPendingBuy(intent: PendingBuy) {
  sessionStorage.setItem(KEY, JSON.stringify(intent));
}

/** Read intent without clearing — keep until checkout succeeds. */
export function getPendingBuy(): PendingBuy | null {
  if (typeof sessionStorage === "undefined") return null;
  return parse(sessionStorage.getItem(KEY));
}

export function clearPendingBuy() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(KEY);
}

/** Clear then return (legacy). Prefer getPendingBuy + clearPendingBuy on 200. */
export function takePendingBuy(): PendingBuy | null {
  const intent = getPendingBuy();
  clearPendingBuy();
  return intent;
}
