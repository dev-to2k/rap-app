import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
