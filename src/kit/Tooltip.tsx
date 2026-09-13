"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn, radius } from "./cn";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

const placeClass: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-1.5 -translate-y-1/2",
};

export function Tooltip({
  title,
  children,
  placement = "top",
  delay = 120,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "title"> & {
  title?: string;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
}) {
  const id = useId();
  const timer = useRef<number>();
  const [open, setOpen] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!title) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    );
  }

  function show() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  }
  function hide() {
    window.clearTimeout(timer.current);
    setOpen(false);
  }

  return (
    <span
      className={cn("relative block min-w-0 max-w-full", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open ? id : undefined}
      {...props}
    >
      {children}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 max-w-xs px-2.5 py-1.5 text-left text-xs font-normal leading-snug text-foreground",
            "border border-white/10 bg-surface-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
            radius,
            placeClass[placement],
          )}
        >
          {title}
        </span>
      ) : null}
    </span>
  );
}
