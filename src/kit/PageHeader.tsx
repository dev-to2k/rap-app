import type { ReactNode } from "react";
import { cn } from "./cn";
import { Icon, type IconName } from "./Icon";

export function PageHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: IconName;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-4", className)}>
      <div>
        <h1 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight text-foreground">
          {icon ? <Icon name={icon} size="lg" className="text-accent" /> : null}
          {title}
        </h1>
        {description ? <p className="mt-1 max-w-xl text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
