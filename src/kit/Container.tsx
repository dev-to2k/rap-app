import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** Default content width 480px (mobile-web). Override with className for studio. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-content px-4", className)} {...props} />;
}
