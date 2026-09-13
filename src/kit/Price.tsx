import { cn } from "./cn";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/config";

export function Price({
  amount,
  currency = DEFAULT_CURRENCY,
  className,
}: {
  amount: number;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={cn("whitespace-nowrap font-semibold tabular-nums text-accent", className)}>
      {formatMoney(amount, currency)}
    </span>
  );
}
