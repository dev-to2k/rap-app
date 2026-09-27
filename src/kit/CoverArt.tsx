import Image from "next/image";
import { cn } from "./cn";

type CoverArtProps = {
  src: string;
  alt?: string;
  className?: string;
  /** Eager-load for LCP (first catalog row / beat detail hero). */
  priority?: boolean;
  /** Responsive sizes hint for next/image. */
  sizes?: string;
};

const DEFAULT_SIZES = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw";

/**
 * Cover thumbnail via next/image: lazy by default, optional priority for LCP,
 * and sizes so the browser picks a sensible resolution on catalog grids.
 */
export function CoverArt({
  src,
  alt = "",
  className,
  priority = false,
  sizes = DEFAULT_SIZES,
}: CoverArtProps) {
  const safeSrc = src || "/covers/beat1.svg";
  // SVG / data URLs skip the optimizer; still get lazy + priority + sizes.
  const unoptimized = safeSrc.endsWith(".svg") || safeSrc.startsWith("data:");

  return (
    <span className={cn("relative block overflow-hidden bg-surface-2", className)}>
      <Image
        src={safeSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="object-cover"
        unoptimized={unoptimized}
      />
    </span>
  );
}
