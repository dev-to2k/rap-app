"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const METHODS = [
  { id: "momo", label: "MoMo (stub)" },
  { id: "vnpay", label: "VNPay (stub)" },
  { id: "ck", label: "Chuyển khoản (stub)" },
] as const;

export function CheckoutPay({
  orderId,
  amountLabel,
}: {
  orderId: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"momo" | "vnpay" | "ck">("momo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: method, simulateWebhook: true }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Pay failed");
      return;
    }
    const licenseId = data.order?.license?.id || data.webhookResult?.licenseId;
    if (licenseId) {
      router.push(`/license/${licenseId}`);
      router.refresh();
      return;
    }
    setError("Webhook chưa unlock — thử lại");
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Thanh toán VND
      </h2>
      {METHODS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMethod(m.id)}
          className={`w-full rounded-2xl border p-4 text-left ${
            method === m.id ? "border-violet-500 bg-violet-950/40" : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <span className="text-white">{m.label}</span>
        </button>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void pay()}
        className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white disabled:opacity-40"
      >
        {busy ? "Đang giả lập webhook…" : `Pay ${amountLabel} (mock webhook)`}
      </button>
      <p className="text-center text-[11px] text-zinc-500">
        Unlock chỉ sau webhook OK (verify signature + amount match + idempotent).
      </p>
    </div>
  );
}
