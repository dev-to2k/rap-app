"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type OptionHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn, radius } from "./cn";
import { Truncate } from "./Truncate";
import { controlClass } from "./control";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function Option(props: OptionHTMLAttributes<HTMLOptionElement>) {
  return <option {...props} />;
}

function optionLabel(child: ReactNode): string {
  if (child == null || child === false) return "";
  if (typeof child === "string" || typeof child === "number") return String(child);
  if (Array.isArray(child)) return child.map(optionLabel).join("");
  if (isValidElement<{ children?: ReactNode }>(child)) return optionLabel(child.props.children);
  return "";
}

function parseOptions(children: ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return;
    if (child.type !== "option" && child.type !== Option) return;
    const value = child.props.value != null ? String(child.props.value) : optionLabel(child.props.children);
    out.push({
      value,
      label: optionLabel(child.props.children) || value,
      disabled: Boolean(child.props.disabled),
    });
  });
  return out;
}

export function Select({
  value,
  defaultValue,
  onChange,
  children,
  className,
  disabled,
  name,
  required,
  id,
  placeholder = "Chọn…",
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  const autoId = useId();
  const selectId = id || autoId;
  const nativeRef = useRef<HTMLSelectElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => parseOptions(children), [children]);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const [open, setOpen] = useState(false);
  const current = controlled ? String(value) : inner;
  const selected = options.find((o) => o.value === current);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(next: string) {
    const el = nativeRef.current;
    if (el) el.value = next;
    if (!controlled) setInner(next);
    onChange?.({
      target: el ?? ({ value: next, name: name ?? "" } as HTMLSelectElement),
      currentTarget: el ?? ({ value: next, name: name ?? "" } as HTMLSelectElement),
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <select
        {...rest}
        ref={nativeRef}
        id={selectId}
        name={name}
        required={required}
        disabled={disabled}
        value={current}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      >
        {children}
      </select>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${selectId}-list`}
        onClick={() => setOpen((v) => !v)}
        className={controlClass("flex items-center justify-between gap-3 pr-3 text-left")}
      >
        <Truncate className={cn("flex-1", !selected && "text-muted/45")}>
          {selected?.label ?? placeholder}
        </Truncate>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul
          id={`${selectId}-list`}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 w-full overflow-hidden border border-white/10 bg-surface-2 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]",
            radius,
          )}
        >
          {options.map((o) => {
            const active = o.value === current;
            return (
              <li key={o.value} role="option" aria-selected={active} aria-disabled={o.disabled}>
                <button
                  type="button"
                  disabled={o.disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o.value)}
                  className={cn(
                    "flex w-full px-3.5 py-2.5 text-left text-sm transition disabled:opacity-40",
                    active ? "bg-accent/15 font-medium text-accent" : "text-foreground hover:bg-white/5",
                  )}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
