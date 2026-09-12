"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  beatId: string;
  sampleFlag: string;
  status: string;
  prices: { lease: number; wav: number; exclusive: number };
  labels: Record<string, string>;
  formatVnd: (n: number) => string;
  action: (formData: FormData) => void | Promise<void>;
  loggedIn: boolean;
};

const SKUS = ["lease", "wav", "exclusive"] as const;

export function SkuPicker({
  sampleFlag,
  status,
  prices,
  labels,
  formatVnd,
  action,
  loggedIn,
}: Props) {
  const [sku, setSku] = useState<"lease" | "wav" | "exclusive">("lease");
  const exclusiveDisabled = sampleFlag === "uncleared" || status !== "available";
  const buyDisabled = status !== "available" || (sku === "exclusive" && exclusiveDisabled);

  return (
    <div className="space-y-3 pb-20">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Chọn license</h2>
      <div className="space-y-2">
        {SKUS.map((s) => {
          const disabled = s === "exclusive" && exclusiveDisabled;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => setSku(s)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                sku === s
                  ? "border-violet-500 bg-violet-950/40"
                  : "border-zinc-800 bg-zinc-900"
              } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{labels[s]}</span>
                <span className="font-semibold text-violet-300">{formatVnd(prices[s])}</span>
              </div>
              {s === "exclusive" && sampleFlag === "uncleared" && (
                <p className="mt-1 text-xs text-amber-400">Disabled — uncleared samples</p>
              )}
              {s === "lease" && <p className="mt-1 text-xs text-zinc-500">MP3 · non-exclusive</p>}
              {s === "wav" && <p className="mt-1 text-xs text-zinc-500">WAV + stems · non-exclusive</p>}
              {s === "exclusive" && !disabled && (
                <p className="mt-1 text-xs text-zinc-500">Unique sale · beat delisted</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          {!loggedIn ? (
            <Link
              href="/login"
              className="block w-full rounded-full bg-violet-600 py-3 text-center font-semibold text-white"
            >
              Login để mua · {formatVnd(prices[sku])}
            </Link>
          ) : (
            <form action={action}>
              <input type="hidden" name="sku" value={sku} />
              <button
                type="submit"
                disabled={buyDisabled}
                className="w-full rounded-full bg-violet-600 py-3 font-semibold text-white disabled:opacity-40"
              >
                Mua {labels[sku]} · {formatVnd(prices[sku])}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
