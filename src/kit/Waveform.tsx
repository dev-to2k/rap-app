import { cn } from "./cn";

const BARS = [4, 10, 16, 8, 14, 6, 18, 11, 7, 15, 9, 13, 5, 17, 8, 12, 6, 14, 10, 16, 7, 12, 18, 9];

export function Waveform({ active, className }: { active?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 w-full items-end gap-0.5", className)} aria-hidden>
      {BARS.map((h, i) => (
        <span
          key={i}
          className={cn(
            "min-w-[3px] flex-1 rounded-full bg-white/35",
            active && "bg-accent",
          )}
          style={{ height: `${20 + h * 4}%` }}
        />
      ))}
    </span>
  );
}
