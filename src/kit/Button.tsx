import type { ButtonHTMLAttributes } from "react";
import { cn, radius } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "bg-surface-2 text-foreground border border-border hover:bg-surface",
  ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-tap px-3 py-2 text-sm",
  md: "min-h-tap px-4 py-2.5 text-sm",
  lg: "min-h-tap px-5 py-3 text-base",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-fade disabled:opacity-40 disabled:pointer-events-none",
    radius,
    variantClass[variant],
    sizeClass[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
