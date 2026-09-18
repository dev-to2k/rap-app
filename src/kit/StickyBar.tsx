import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function StickyBar({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur",
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-content">{children}</div>
    </div>
  );
}
