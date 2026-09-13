"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card, PageHeader, Price, Spinner } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

type Order = {
  id: string;
  status: string;
  amountVnd: number;
  sku: string;
  paymentMethod: string | null;
  license?: { id: string } | null;
};

export default function CheckoutPage() {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const orderId = useMemo(() => {
    const raw = params?.orderId;
    return Array.isArray(raw) ? raw[0] : raw || "";
  }, [params]);

  const [order, setOrder] = useState<Order | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMsg(t("checkout.chooseMomo"));
  }, [t]);

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
          if (data.order.status === "unlocked") setMsg(t("checkout.paid"));
          else if (data.order.status === "failed") {
            setMsg(t("checkout.unpaid"));
            setFailed(true);
          } else setMsg(t("checkout.waiting"));
        }
      } catch {
        if (!cancelled) setMsg(t("checkout.loadError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router, t]);

  async function mockPay(fail = false) {
    if (!orderId) return;
    setBusy(true);
    setFailed(false);
    setMsg(t("checkout.confirming"));
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
        setMsg(t("checkout.payError"));
        return;
      }
      if (res.status === 401) {
        router.push("/login?next=" + encodeURIComponent(`/checkout/${orderId}`));
        return;
      }
      if (res.status === 404) {
        setMsg(data.error || t("checkout.mockOff"));
        return;
      }
      if (!res.ok || data.paid === false || data.order?.status === "failed") {
        setMsg(data.error || t("checkout.unpaid"));
        setFailed(true);
        if (data.order) setOrder(data.order);
        return;
      }
      setMsg(t("checkout.paid"));
      if (data.order) setOrder(data.order);
      router.push(`/orders/${orderId}/success`);
    } catch {
      setMsg(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeader title={t("checkout.title")} description={t("checkout.description")} icon="wallet" />
      <Card className="space-y-4 p-6">
        <p className="font-mono text-xs text-muted">{t("checkout.order", { id: orderId })}</p>
        {order?.amountVnd ? <Price amount={order.amountVnd} className="text-2xl" /> : null}
        {failed ? <Alert variant="danger">{msg}</Alert> : <p className="text-sm text-muted">{msg}</p>}
        <div className="flex flex-col gap-2">
          <Button disabled={busy || !orderId} onClick={() => void mockPay(false)}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> {t("checkout.confirming")}
              </span>
            ) : (
              t("checkout.payMomo")
            )}
          </Button>
          <Button variant="secondary" disabled={busy || !orderId} onClick={() => void mockPay(true)}>
            {t("checkout.mockFail")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
