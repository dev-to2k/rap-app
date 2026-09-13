import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";
import { controlClass } from "./control";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={controlClass(cn("min-h-[7.5rem] resize-y leading-relaxed", className))}
      {...props}
    />
  );
}
