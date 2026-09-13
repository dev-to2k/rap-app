"use client";

import { useMemo, type InputHTMLAttributes } from "react";
import { cn } from "./cn";
import { controlClass } from "./control";
import { DEFAULT_CURRENCY_LOCALE } from "@/lib/config";

export function DateInput({
  className,
  value,
  defaultValue,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const raw = String(value ?? defaultValue ?? "");
  const display = useMemo(() => {
    if (!raw) return "";
    const d = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat(DEFAULT_CURRENCY_LOCALE, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }, [raw]);

  return (
    <div className={cn("relative", className)}>
      <div className={controlClass("pointer-events-none pr-10 text-left")}>
        {display || <span className="text-muted/45">dd/mm/yyyy</span>}
      </div>
      <input
        {...props}
        type="date"
        value={value}
        defaultValue={defaultValue}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </div>
  );
}
