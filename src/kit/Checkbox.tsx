import type { InputHTMLAttributes, ReactNode } from "react";
import { cn, radius } from "./cn";

export function Checkbox({
  className,
  children,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { children?: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-start gap-2.5 text-sm", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center border border-white/15 bg-surface-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition",
          radius,
          "peer-checked:border-accent peer-checked:bg-accent peer-checked:[&>svg]:opacity-100",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
        )}
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3 text-accent-fg opacity-0" fill="none" aria-hidden>
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children ? <span>{children}</span> : null}
    </label>
  );
}
