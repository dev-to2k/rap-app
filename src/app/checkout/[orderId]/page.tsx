"use client";

import { useEffect, useMemo, useState } from "react";
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
  const params = useParams();
  const router = useRouter();
  const orderId = useMemo(() => {
    const raw = params?.orderId;
    return Array.isArray(raw) ? raw[0] : raw || "";
  }, [params]);

  const [order, setOrder] = useState<Order | null>(null);
  const [msg, setMsg] = useState("Chọn Thanh toán MoMo để tiếp tục");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (cancelled) return;
        if (res.status === 401) {
          router.push("/login?next=" + encodeURIComponent(`/checkout/${orderId}`));
          return;
        }
        if (res.ok && data.order) {
          setOrder(data.order);
          if (data.order.status === "unlocked") setMsg("Thanh toán OK");
          else if (data.order.status === "failed") setMsg("Chưa thanh toán — file chưa mở.");
          else setMsg("Đang chờ thanh toán…");
        }
      } catch {
        if (!cancelled) setMsg("Không tải được đơn — thử lại");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  async function mockPay(fail = false) {
    if (!orderId) return;
    setBusy(true);
    setMsg("Đang xác nhận thanh toán…");
    try {
      const res = await fetch("/api/pay/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, fail }),
      });
      const text = await res.text();
      let data: {
        paid?: boolean;
        order?: Order;
        error?: string;
      } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setMsg("Lỗi thanh toán — thử lại");
        return;
      }
      if (res.status === 401) {
        router.push("/login?next=" + encodeURIComponent(`/checkout/${orderId}`));
        return;
      }
      if (res.status === 404) {
        setMsg(data.error || "Mock pay tắt trên môi trường này");
        return;
      }
      if (!res.ok || data.paid === false || data.order?.status === "failed") {
        setMsg(data.error || "Chưa thanh toán — file chưa mở.");
        if (data.order) setOrder(data.order);
        return;
      }
      setMsg("Thanh toán OK");
      if (data.order) setOrder(data.order);
      router.push(`/orders/${orderId}/success`);
    } catch {
      setMsg("Mạng lỗi — thử lại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-zinc-400">Order: {orderId}</p>
        {order?.amountVnd ? <p className="mt-2 text-lg">{formatVnd(order.amountVnd)}</p> : null}
        <p className="mt-4 text-sm">{msg}</p>
        <p className="mt-4 text-xs leading-relaxed text-zinc-400">
          Trả ví nền tảng → PDF + file. Không CK riêng producer.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy || !orderId}
            onClick={() => void mockPay(false)}
            className="rounded-lg bg-[color:var(--accent)] py-2 font-medium text-[#0B0B0C] hover:opacity-90 disabled:opacity-50"
          >
            Thanh toán MoMo
          </button>
          <button
            type="button"
            disabled={busy || !orderId}
            onClick={() => void mockPay(true)}
            className="rounded-lg bg-zinc-800 py-2 text-sm hover:bg-zinc-700 disabled:opacity-50"
          >
            Mock fail
          </button>
        </div>
      </div>
    </div>
  );
}
