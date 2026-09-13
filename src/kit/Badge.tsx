import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type BadgeVariant = "default" | "accent" | "warning" | "danger" | "exclusive";

const variantClass: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-muted",
  accent: "bg-accent/15 text-accent",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  exclusive: "bg-exclusive/15 text-exclusive",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
