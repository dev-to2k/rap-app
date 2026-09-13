import type { ButtonHTMLAttributes } from "react";
import { Icon } from "./Icon";
import { cn } from "./cn";

const box = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-14 w-14",
} as const;

export function PlayButton({
  playing,
  onClick,
  className,
  overlay,
  label,
  size = "md",
  ...props
}: {
  playing: boolean;
  overlay?: boolean;
  label?: string;
  size?: keyof typeof box;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || (playing ? "Pause" : "Play")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90",
        overlay && "absolute inset-0 m-auto",
        box[size],
        className,
      )}
      {...props}
    >
      <Icon name={playing ? "pause" : "play"} size={size === "sm" ? "sm" : "md"} className={playing ? undefined : "translate-x-px"} />
    </button>
  );
}
