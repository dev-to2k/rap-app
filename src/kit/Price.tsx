import { cn } from "./cn";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/config";

export function Price({
  amount,
  currency = DEFAULT_CURRENCY,
  className,
  tone = "buyer",
}: {
  amount: number;
  currency?: string;
  className?: string;
  // buyer: lime cho giá mua, seller: chữ thường cho giá bán
  tone?: "buyer" | "seller";
}) {
  return (
    <span
      aria-live="polite"
      className={cn(
        "whitespace-nowrap font-semibold tabular-nums",
        tone === "buyer" ? "text-accent" : "text-foreground",
        className,
      )}
    >
      {formatMoney(amount, currency)}
    </span>
  );
}
