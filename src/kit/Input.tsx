import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";
import { controlClass } from "./control";

export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={controlClass(
        cn(
          type === "file" &&
            "cursor-pointer py-2 file:mr-3 file:rounded-full file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/25",
          className,
        ),
      )}
      {...props}
    />
  );
}
