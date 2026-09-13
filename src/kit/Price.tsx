import { cn } from "./cn";
import { formatVnd } from "@/lib/config";

export function Price({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={cn("font-semibold tabular-nums text-accent", className)}>
      {formatVnd(amount)}
    </span>
  );
}
