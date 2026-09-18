import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export function Chip({
  selected,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        "tap-target rounded-md border px-3 py-2 text-sm capitalize transition-fade",
        selected ? "border-accent bg-accent/10 text-foreground" : "border-border bg-surface text-muted",
        className,
      )}
      {...props}
    />
  );
}
