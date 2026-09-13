import type { ReactNode } from "react";
import { cn } from "./cn";

export function PageHeader({
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
    <div className={cn("mb-8 flex items-end justify-between gap-4", className)}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 max-w-xl text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
