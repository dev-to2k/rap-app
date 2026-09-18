import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** Centered content column: 480px mobile, widens via --content-max on md/lg. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-content px-4", className)} {...props} />;
}
