"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card, PageHeader, Price, Spinner } from "@/kit";

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
  const [failed, setFailed] = useState(false);

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
          else if (data.order.status === "failed") {
            setMsg("Chưa thanh toán — file chưa mở.");
            setFailed(true);
          } else setMsg("Đang chờ thanh toán…");
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
    setFailed(false);
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
        setFailed(true);
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
      <PageHeader title="Checkout" description="Trả ví nền tảng → PDF + file. Không CK riêng producer." />
      <Card className="space-y-4 p-6">
        <p className="font-mono text-xs text-muted">Đơn: {orderId}</p>
        {order?.amountVnd ? <Price amount={order.amountVnd} className="text-2xl" /> : null}
        {failed ? <Alert variant="danger">{msg}</Alert> : <p className="text-sm text-muted">{msg}</p>}
        <div className="flex flex-col gap-2">
          <Button disabled={busy || !orderId} onClick={() => void mockPay(false)}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Đang xác nhận…
              </span>
            ) : (
              "Thanh toán MoMo"
            )}
          </Button>
          <Button variant="secondary" disabled={busy || !orderId} onClick={() => void mockPay(true)}>
            Mock fail
          </Button>
        </div>
      </Card>
    </div>
  );
}
