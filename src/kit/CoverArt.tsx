import type { ImgHTMLAttributes } from "react";
import { cn } from "./cn";

export function CoverArt({
  className,
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={cn("object-cover bg-surface-2", className)} {...props} />
  );
}
