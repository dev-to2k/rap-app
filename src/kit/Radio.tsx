import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Radio({
  className,
  children,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { children?: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm", className)}>
      <input type="radio" className="peer sr-only" {...props} />
      <span
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-surface-2 transition",
          "peer-checked:border-accent peer-checked:[&>span]:scale-100",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
        )}
      >
        <span className="h-2.5 w-2.5 scale-0 rounded-full bg-accent transition-transform" />
      </span>
      {children ? <span>{children}</span> : null}
    </label>
  );
}
