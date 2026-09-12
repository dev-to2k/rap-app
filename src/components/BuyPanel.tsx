"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatVnd, SKU_LABELS } from "@/lib/config";

type Beat = {
  id: string;
  priceLease: number;
  priceWav: number;
  priceExclusive: number;
  sampleFlag: string;
  status: string;
};

export function BuyPanel({ beat }: { beat: Beat }) {
  const router = useRouter();
  const [sku, setSku] = useState<"lease" | "wav" | "exclusive">("lease");
  const [method, setMethod] = useState<"momo" | "vnpay" | "ck">("momo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const exclusiveDisabled = beat.sampleFlag === "uncleared" || beat.status !== "available";
  const soldExclusive = beat.status === "sold_exclusive";

  const price =
    sku === "lease" ? beat.priceLease : sku === "wav" ? beat.priceWav : beat.priceExclusive;

  async function checkout() {
    setError("");
    if (sku === "exclusive" && beat.sampleFlag === "uncleared") {
      setError("Không bán Exclusive khi sample chưa clear");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId: beat.id, sku, paymentMethod: method }),
      });
      const text = await res.text();
      let data: { error?: string; order?: { id: string }; code?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError("Checkout lỗi — thử lại");
        return;
      }
      if (res.status === 401) {
        router.push("/login?next=" + encodeURIComponent(`/beats/${beat.id}`));
        return;
      }
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        return;
      }
      if (!data.order?.id) {
        setError("Không tạo được đơn");
        return;
      }
      router.push(`/checkout/${data.order.id}`);
    } catch {
      setError("Mạng lỗi — thử lại");
    } finally {
      setLoading(false);
    }
  }

  if (soldExclusive) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-400">
        Beat đã bán Exclusive — lease/WAV đã ẩn.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="font-semibold">Chọn SKU</h3>
      {(
        [
          ["lease", beat.priceLease],
          ["wav", beat.priceWav],
          ["exclusive", beat.priceExclusive],
        ] as const
      ).map(([key, p]) => {
        const disabled = key === "exclusive" && exclusiveDisabled;
        return (
          <label
            key={key}
            className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${
              sku === key ? "border-emerald-500 bg-emerald-950/40" : "border-zinc-700"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="sku"
                disabled={disabled}
                checked={sku === key}
                onChange={() => setSku(key)}
              />
              {SKU_LABELS[key]}
            </span>
            <span>{formatVnd(p)}</span>
          </label>
        );
      })}
      {beat.sampleFlag === "uncleared" && (
        <p className="text-sm text-amber-300">Không bán Exclusive khi sample chưa clear</p>
      )}

      <div>
        <p className="mb-2 text-sm text-zinc-400">Thanh toán MoMo</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod("momo")}
            className={`rounded-lg px-3 py-1.5 text-sm uppercase ${
              method === "momo" ? "bg-emerald-600" : "bg-zinc-800"
            }`}
          >
            momo
          </button>
        </div>
      </div>

      <p className="text-lg font-semibold text-emerald-400">{formatVnd(price)}</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="button"
        disabled={loading || beat.status !== "available"}
        onClick={() => void checkout()}
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "…" : "Thanh toán"}
      </button>
    </div>
  );
}
