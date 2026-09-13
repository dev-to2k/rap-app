import { cn, radius } from "./cn";

export function controlClass(className?: string) {
  return cn(
    "w-full border border-white/[0.08] bg-surface-2 px-3.5 py-2.5 text-sm text-foreground",
    radius,
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    "placeholder:text-muted/40",
    "transition-[border-color,box-shadow,background-color] duration-150",
    "hover:border-white/20",
    "focus:border-accent/80 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25",
    "disabled:cursor-not-allowed disabled:opacity-40",
    className,
  );
}
