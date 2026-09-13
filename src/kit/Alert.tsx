import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type AlertVariant = "info" | "warning" | "danger" | "success";

const variantClass: Record<AlertVariant, string> = {
  info: "border-border bg-surface text-muted",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
  success: "border-accent/40 bg-accent/10 text-accent",
};

export function Alert({
  variant = "info",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      className={cn("rounded-xl border p-4 text-sm", variantClass[variant], className)}
      {...props}
    />
  );
}
