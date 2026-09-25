"use client";

import { useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

/**
 * Viewport-fixed buyer CTA bar.
 * Portaled to document.body so ancestors cannot break `position:fixed`
 * (CTA stayed in-flow and only appeared after scrolling).
 * Visible on mobile (~480) and desktop.
 */
export function StickyBar({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bar = (
    <div
      className={cn(
        // Above mobile tab bar; flush on lg. z-50 keeps MoMo CTA above MiniPlayer.
        "pointer-events-none fixed inset-x-0 bottom-14 z-50 lg:bottom-0",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-auto border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto w-full max-w-content px-4">{children}</div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(bar, document.body);
}

/** Spacer matching StickyBar height so content is not hidden behind the bar. */
export function StickyBarSpacer({ className }: { className?: string }) {
  return <div className={cn("h-20 shrink-0 md:h-24", className)} aria-hidden />;
}

export function StickyBarShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <StickyBar className={className}>{children}</StickyBar>
      <StickyBarSpacer />
    </>
  );
}
