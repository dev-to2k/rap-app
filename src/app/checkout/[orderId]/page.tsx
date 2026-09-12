"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatVnd } from "@/lib/config";

type Order = {
  id: string;
  status: string;
  amountVnd: number;
  sku: string;
  paymentMethod: string | null;
  license?: { id: string } | null;
};

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [msg, setMsg] = useState("Đang xác nhận thanh toán…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // lightweight poll via license endpoint for status
    fetch(`/api/license/${orderId}`)
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) {
          setOrder(d.order);
          setMsg("Thanh toán OK");
        } else if (d.status === "pending" || d.status === "failed" || d.error) {
          // fetch order via checkout recreate not available — keep pending UI
          setOrder({ id: orderId, status: d.status || "pending", amountVnd: 0, sku: "", paymentMethod: null });
          if (d.status === "failed") setMsg("Chưa thanh toán — file chưa mở.");
        }
      })
      .catch(() => {});
  }, [orderId]);

  async function mockPay(fail = false) {
    setBusy(true);
    setMsg("Đang xác nhận thanh toán…");
    const res = await fetch("/api/pay/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, fail }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok || data.paid === false || data.order?.status === "failed") {
      setMsg("Chưa thanh toán — file chưa mở.");
      setOrder(data.order || null);
      return;
    }
    setMsg("Thanh toán OK");
    setOrder(data.order);
    router.push(`/orders/${orderId}/success`);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-zinc-400">Order: {orderId}</p>
        {order?.amountVnd ? <p className="mt-2 text-lg">{formatVnd(order.amountVnd)}</p> : null}
        <p className="mt-4 text-sm">{msg}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => mockPay(false)}
            className="rounded-lg bg-emerald-600 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            Mock pay (MoMo/VNPay/CK OK)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => mockPay(true)}
            className="rounded-lg bg-zinc-800 py-2 text-sm hover:bg-zinc-700 disabled:opacity-50"
          >
            Mock fail
          </button>
        </div>
      </div>
    </div>
  );
}
