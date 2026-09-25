import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function StickyBar({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Nằm trên tabbar mobile, sát đáy khi không còn tabbar desktop
        "fixed bottom-14 left-0 right-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:bottom-0",
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-[480px]">{children}</div>
    </div>
  );
}
