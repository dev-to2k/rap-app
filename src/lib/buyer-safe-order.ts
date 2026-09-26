/** Strip take/fund ledger fields from buyer-facing order JSON (never leak take rate). */
export function buyerSafeOrder<T extends Record<string, unknown>>(order: T): Omit<
  T,
  | "takeRateBps"
  | "takeVnd"
  | "fundWithheldFromTake"
  | "platformTakeWithdrawable"
  | "payableVnd"
  | "momoFeeVnd"
  | "gmvVnd"
> {
  const {
    takeRateBps: _1,
    takeVnd: _2,
    fundWithheldFromTake: _3,
    platformTakeWithdrawable: _4,
    payableVnd: _5,
    momoFeeVnd: _6,
    gmvVnd: _7,
    ...safe
  } = order;
  void _1;
  void _2;
  void _3;
  void _4;
  void _5;
  void _6;
  void _7;
  return safe;
}
