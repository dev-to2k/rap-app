import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
