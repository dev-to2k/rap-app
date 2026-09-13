import { cn } from "./cn";

export function Stepper({
  steps,
  current,
  labels,
}: {
  steps?: number;
  current: number;
  labels?: string[];
}) {
  const items = labels?.length ? labels : Array.from({ length: steps || 0 }, (_, i) => String(i + 1));
  return (
    <ol className="flex flex-wrap gap-2">
      {items.map((label, i) => {
        const n = i + 1;
        return (
          <li
            key={label}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
              n === current
                ? "bg-accent text-accent-fg"
                : n < current
                  ? "bg-accent/20 text-accent"
                  : "bg-surface-2 text-muted",
            )}
          >
            <span className="tabular-nums">{n}</span>
            {labels ? <span>{label}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
