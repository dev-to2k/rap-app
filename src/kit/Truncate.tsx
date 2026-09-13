"use client";

import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";
import { Tooltip, type TooltipPlacement } from "./Tooltip";

type TruncateTag = "span" | "p" | "div";

export function Truncate({
  as: Tag = "span",
  lines = 1,
  children,
  className,
  title,
  placement = "top",
  ...props
}: {
  as?: TruncateTag;
  lines?: number;
  children: ReactNode;
  title?: string;
  placement?: TooltipPlacement;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "title">) {
  const ref = useRef<HTMLElement | null>(null);
  const [overflow, setOverflow] = useState(false);
  const tip = title ?? (typeof children === "string" ? children : undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    function measure() {
      if (!el) return;
      setOverflow(lines <= 1 ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1);
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, lines]);

  const text = (
    <Tag
      ref={ref as never}
      className={cn(
        "min-w-0 max-w-full",
        lines <= 1 ? "block truncate" : "overflow-hidden break-words",
        className,
      )}
      style={
        lines > 1
          ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines }
          : undefined
      }
      {...props}
    >
      {children}
    </Tag>
  );

  if (!tip || !overflow) return text;
  return (
    <Tooltip title={tip} placement={placement} className="max-w-full">
      {text}
    </Tooltip>
  );
}
