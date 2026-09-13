import { cn } from "./cn";

export function Stepper({
  steps,
  current,
}: {
  steps: number;
  current: number;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: steps }, (_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
              n === current
                ? "bg-accent text-accent-fg"
                : n < current
                  ? "bg-accent/20 text-accent"
                  : "bg-surface-2 text-muted",
            )}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}
