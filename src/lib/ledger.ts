/** Order ledger math + payable timing (Finance: unlockedAt + 5d = 48h dispute + T+3). */

/** 5 days after unlock (48h dispute window + T+3 settlement). */
export const PAYABLE_DELAY_MS = 5 * 24 * 60 * 60 * 1000;

/** First 48h after exclusive unlock = dispute/refund window — not yet payable. */
export const EXCLUSIVE_DISPUTE_MS = 48 * 60 * 60 * 1000;

/** Internal platform accounting: bps of takeVnd held as ops fund reserve (2000 = 20%). */
export const PLATFORM_TAKE_FUND_BPS = 2000;

export type OrderLedgerAmounts = {
  gmvVnd: number;
  momoFeeVnd: number;
  takeVnd: number;
  payableVnd: number;
};

export type TakeFundSplit = {
  fundWithheldFromTake: number;
  platformTakeWithdrawable: number;
};

/** takeVnd = round(gmv * bps / 10000); payable = max(0, gmv - momoFee - take) */
export function computeOrderLedger(input: {
  gmvVnd: number;
  takeRateBps: number;
  momoFeeVnd?: number;
}): OrderLedgerAmounts {
  const gmvVnd = Math.max(0, Math.trunc(input.gmvVnd));
  const momoFeeVnd = Math.max(0, Math.trunc(input.momoFeeVnd ?? 0));
  const takeVnd = Math.round((gmvVnd * input.takeRateBps) / 10_000);
  const payableVnd = Math.max(0, gmvVnd - momoFeeVnd - takeVnd);
  return { gmvVnd, momoFeeVnd, takeVnd, payableVnd };
}

/**
 * Internal split of platform take after take is calculated (not buyer-facing).
 * 20% → fund reserve, 80% → platform ops-withdrawable.
 * Does NOT change takeRateBps or producer payableVnd.
 */
export function computeTakeFundSplit(takeVnd: number): TakeFundSplit {
  const take = Math.max(0, Math.trunc(takeVnd));
  const fundWithheldFromTake = Math.round((take * PLATFORM_TAKE_FUND_BPS) / 10_000);
  return {
    fundWithheldFromTake,
    platformTakeWithdrawable: take - fundWithheldFromTake,
  };
}

/** payable_at = unlocked_at + 5 days (NOT paid_at + 7d). */
export function payableAtFromUnlockedAt(unlockedAt: Date): Date {
  return new Date(unlockedAt.getTime() + PAYABLE_DELAY_MS);
}

/** Money fields at order create / pay (payableAt set only after successful unlock). */
export function ledgerAmountsForOrder(
  order: { amountVnd: number; takeRateBps: number; momoFeeVnd?: number | null },
  momoFeeVnd?: number,
): OrderLedgerAmounts {
  const fee = momoFeeVnd ?? order.momoFeeVnd ?? 0;
  return computeOrderLedger({
    gmvVnd: order.amountVnd,
    takeRateBps: order.takeRateBps,
    momoFeeVnd: fee,
  });
}

/** Full ledger + payableAt + internal take-fund split on successful unlock. */
export function unlockedLedgerUpdate(
  order: { amountVnd: number; takeRateBps: number; momoFeeVnd?: number | null },
  unlockedAt: Date,
  momoFeeVnd?: number,
) {
  const amounts = ledgerAmountsForOrder(order, momoFeeVnd);
  const fund = computeTakeFundSplit(amounts.takeVnd);
  return {
    ...amounts,
    ...fund,
    unlockedAt,
    payableAt: payableAtFromUnlockedAt(unlockedAt),
  };
}
