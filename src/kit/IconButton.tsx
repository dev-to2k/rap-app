import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export function IconButton({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60 disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
