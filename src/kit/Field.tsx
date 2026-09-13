import type { ReactNode } from "react";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </label>
  );
}
