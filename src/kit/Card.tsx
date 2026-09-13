import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    />
  );
}
