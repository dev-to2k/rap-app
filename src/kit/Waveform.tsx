import { cn } from "./cn";

const BARS = [4, 10, 16, 8, 14, 6, 18, 11, 7, 15, 9, 13, 5, 17, 8, 12, 6, 14, 10, 16];

export function Waveform({ active, className }: { active?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-end gap-px", className)} aria-hidden>
      {BARS.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 rounded-full bg-accent/40",
            active && "animate-pulse bg-accent",
          )}
          style={{ height: `${h * 5}%`, animationDelay: `${i * 40}ms` }}
        />
      ))}
    </span>
  );
}
