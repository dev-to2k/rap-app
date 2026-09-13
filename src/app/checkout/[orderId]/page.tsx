"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card, Container, PageHeader, Price, Spinner } from "@/kit";
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dev = process.env.NODE_ENV === "development";

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
        if (res.ok && data.order) setOrder(data.order);
        else setError(t("checkout.loadError"));
      } catch {
        if (!cancelled) setError(t("checkout.loadError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router, t]);

  async function mockPay(fail = false) {
    if (!orderId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/pay/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, fail }),
      });
      const text = await res.text();
      let data: { paid?: boolean; order?: Order; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(t("checkout.payError"));
        return;
      }
      if (res.status === 401) {
        router.push("/login?next=" + encodeURIComponent(`/checkout/${orderId}`));
        return;
      }
      if (res.status === 404) {
        setError(data.error || t("checkout.mockOff"));
        return;
      }
      if (data.order) setOrder(data.order);
      if (!res.ok || data.paid === false || data.order?.status === "failed") {
        setError(data.error || t("checkout.unpaid"));
        return;
      }
      router.push(`/orders/${orderId}/success`);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  const failed = Boolean(error) || order?.status === "failed";
  const statusText = error
    ? error
    : order?.status === "unlocked"
      ? t("checkout.paid")
      : t("checkout.waiting");

  return (
    <Container className="mx-auto max-w-md space-y-4 py-8">
      <PageHeader title={t("checkout.title")} description={t("checkout.description")} icon="wallet" />
      <Card className="space-y-4 p-6">
        <p className="font-mono text-xs text-muted">{t("checkout.order", { id: orderId })}</p>
        {order?.sku ? <p className="text-sm">{t(`sku.${order.sku}`)}</p> : null}
        <div>
          <p className="text-xs text-muted">{t("checkout.amountDue")}</p>
          {order?.amountVnd ? <Price amount={order.amountVnd} className="text-2xl" /> : null}
        </div>
        <Alert variant="info">{t("checkout.platformNote")}</Alert>
        {failed ? <Alert variant="danger">{statusText}</Alert> : <p className="text-sm text-muted">{statusText}</p>}
        <Button className="w-full" disabled={busy || !orderId} onClick={() => void mockPay(false)}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> {t("checkout.confirming")}
            </span>
          ) : (
            t("checkout.payMomo")
          )}
        </Button>
        {dev ? (
          <Button variant="secondary" disabled={busy || !orderId} onClick={() => void mockPay(true)}>
            {t("checkout.mockFail")}
          </Button>
        ) : null}
      </Card>
    </Container>
  );
}
