"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import {
  currencyScale,
  currencySymbol,
  DEFAULT_CURRENCY,
  formatMoneyInput,
  parseMoneyInput,
} from "@/lib/config";
import { cn } from "./cn";
import { Input } from "./Input";

export function CurrencyInput({
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  className,
  id,
  currency = DEFAULT_CURRENCY,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { currency?: string }) {
  const autoId = useId();
  const inputId = id || autoId;
  const nativeRef = useRef<HTMLInputElement>(null);
  const code = currency.toUpperCase();
  const scale = currencyScale(code);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => parseMoneyInput(String(defaultValue ?? ""), code));
  const raw = controlled ? parseMoneyInput(String(value ?? ""), code) : inner;

  function emit(next: string, proto?: ChangeEvent<HTMLInputElement>) {
    const el = nativeRef.current;
    if (el) el.value = next;
    if (!controlled) setInner(next);
    onChange?.({
      ...proto,
      target: el ?? ({ value: next, name: name ?? "" } as HTMLInputElement),
      currentTarget: el ?? ({ value: next, name: name ?? "" } as HTMLInputElement),
    } as ChangeEvent<HTMLInputElement>);
  }

  return (
    <div className="relative">
      <input
        {...rest}
        ref={nativeRef}
        id={inputId}
        name={name}
        required={required}
        disabled={disabled}
        value={raw}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <Input
        id={`${inputId}-display`}
        inputMode={scale === 0 ? "numeric" : "decimal"}
        autoComplete="off"
        disabled={disabled}
        placeholder={scale === 0 ? "0" : "0.00"}
        value={formatMoneyInput(raw, code)}
        onChange={(e) => emit(parseMoneyInput(e.target.value, code), e)}
        className={cn("pr-10 tabular-nums", className)}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
        {currencySymbol(code)}
      </span>
    </div>
  );
}
