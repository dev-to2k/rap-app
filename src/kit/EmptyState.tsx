import type { ReactNode } from "react";
import { cn } from "./cn";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
