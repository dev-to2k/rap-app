"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PLATFORM_PAY_DISCLAIMER =
  "Trả ví nền tảng → PDF + file. Không CK riêng producer.";

export function CheckoutPay({
  orderId,
  amountLabel,
}: {
  orderId: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: "momo", simulateWebhook: true }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Thanh toán thất bại");
      return;
    }
    const licenseId = data.order?.license?.id || data.webhookResult?.licenseId;
    if (licenseId) {
      router.push(`/license/${licenseId}`);
      router.refresh();
      return;
    }
    setError("Đang xác nhận thanh toán…");
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
        Thanh toán MoMo
      </h2>
      <div className="w-full rounded-2xl border border-[color:var(--accent)] bg-[color:var(--surface)] p-4 text-left">
        <span className="text-[color:var(--foreground)]">MoMo Business</span>
        <p className="mt-1 text-xs text-[color:var(--muted)]">Merchant / ví nền tảng · IPN tự động</p>
      </div>
      <p className="text-xs leading-relaxed text-[color:var(--muted)]">{PLATFORM_PAY_DISCLAIMER}</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void pay()}
        className="w-full rounded-full bg-[color:var(--accent)] py-3 font-semibold text-[#0B0B0C] disabled:opacity-40"
      >
        {busy ? "Đang xác nhận thanh toán…" : `Thanh toán MoMo · ${amountLabel}`}
      </button>
      <p className="text-center text-[11px] text-[color:var(--muted)]">
        Unlock PDF/file chỉ sau webhook MoMo OK (mock đến khi có sandbox keys).
      </p>
    </div>
  );
}
