"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Card, Container, PageHeader, Price, Skeleton, Spinner, Stepper } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

type Order = {
  id: string;
  status: string;
  amountVnd: number;
  sku: string;
  paymentMethod: string | null;
  license?: { id: string } | null;
};

type PayosInfo = {
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode?: string;
};

type PaymentInfo = {
  amountVnd: number;
  ttlMinutes?: number;
  expiresAt?: string;
  payosConfigured?: boolean;
  payos?: PayosInfo | null;
};

const AWAITING = new Set(["pending", "pending_ck", "awaiting_payment"]);

type CheckoutClientProps = {
  showPayosNotConfigured: boolean;
};

export default function CheckoutPage({ showPayosNotConfigured }: CheckoutClientProps) {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const orderId = useMemo(() => {
    const raw = params?.orderId;
    return Array.isArray(raw) ? raw[0] : raw || "";
  }, [params]);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [payosLive, setPayosLive] = useState<PayosInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [payosBusy, setPayosBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payosTried, setPayosTried] = useState(false);
  const [payosKeysMissing, setPayosKeysMissing] = useState(false);
  const dev = process.env.NODE_ENV === "development";

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.status === 401) {
        router.push("/login?next=" + encodeURIComponent(`/checkout/${orderId}`));
        return;
      }
      if (res.ok && data.order) {
        setOrder(data.order);
        if (data.payment) setPayment(data.payment);
        if (data.payment?.payos) setPayosLive(data.payment.payos);
      } else setError(t("checkout.loadError"));
    } catch {
      setError(t("checkout.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orderId, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const createPayos = useCallback(
    async (retry = false) => {
      if (!orderId) return;
      setPayosBusy(true);
      setError("");
      try {
        const res = await fetch(`/api/orders/${orderId}/payos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ retry }),
        });
        const text = await res.text();
        let data: {
          payos?: PayosInfo;
          order?: Order;
          error?: string;
          code?: string;
          fallback?: string;
        } = {};
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
        if (res.status === 503 || data.code === "PAYOS_KEYS_MISSING") {
          // Never fall back to manual MoMo CK — show not-configured state.
          setPayosKeysMissing(true);
          setPayosTried(true);
          setPayment((prev) => (prev ? { ...prev, payosConfigured: false } : prev));
          return;
        }
        if (!res.ok) {
          setError(data.error || t("checkout.payosFallback"));
          setPayosTried(true);
          return;
        }
        if (data.order) setOrder(data.order);
        if (data.payos) {
          setPayosLive(data.payos);
          setPayment((prev) =>
            prev
              ? { ...prev, payosConfigured: true, payos: data.payos! }
              : prev,
          );
        }
        setPayosTried(true);
      } catch {
        setError(t("common.networkError"));
        setPayosTried(true);
      } finally {
        setPayosBusy(false);
      }
    },
    [orderId, router, t],
  );

  // Auto-create payOS link when configured and awaiting
  useEffect(() => {
    if (!order || !payment || payosTried || payosBusy) return;
    if (!payment.payosConfigured) return;
    if (!AWAITING.has(order.status) && order.status !== "pending_confirm") return;
    if (payment.payos?.checkoutUrl || payosLive?.checkoutUrl) {
      setPayosTried(true);
      return;
    }
    void createPayos(false);
  }, [order, payment, payosTried, payosBusy, payosLive, createPayos]);

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

  const amount = payment?.amountVnd ?? order?.amountVnd ?? 0;
  const ttlMinutes = payment?.ttlMinutes ?? 60;
  const pendingConfirm = order?.status === "pending_confirm";
  const unlocked = order?.status === "unlocked" || order?.status === "paid";
  const awaiting = order ? AWAITING.has(order.status) || pendingConfirm : true;
  const isFailed = order?.status === "failed";
  const payosConfigured = Boolean(payment?.payosConfigured) && !payosKeysMissing;
  const payos = payosLive || payment?.payos || null;

  useEffect(() => {
    if (unlocked && orderId) {
      router.push(`/orders/${orderId}/success`);
    }
  }, [unlocked, orderId, router]);

  useEffect(() => {
    if (!awaiting || unlocked || !orderId) return;
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [awaiting, unlocked, orderId, load]);

  if (loading && !order) {
    return (
      <Container className="mx-auto max-w-md space-y-4 py-8" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-11 w-full" />
      </Container>
    );
  }

  return (
    <Container className="mx-auto max-w-md space-y-4 py-8">
      <PageHeader title={t("checkout.title")} description={t("checkout.description")} icon="wallet" />
      <Stepper current={2} labels={[t("steps.choose"), t("steps.pay"), t("steps.done")]} />
      <Alert variant="info">{t("checkout.reserveNote")}</Alert>
      <Alert variant="info">{t("checkout.ttlNote", { minutes: String(ttlMinutes) })}</Alert>
      <Card className="space-y-4 p-6" aria-busy={busy || payosBusy}>
        <p className="font-mono text-xs text-muted">{t("checkout.order", { id: orderId })}</p>
        {order?.sku ? <p className="text-sm">{t(`sku.${order.sku}`)}</p> : null}

        <div>
          <p className="text-xs text-muted">{t("checkout.amountDue")}</p>
          {amount ? <Price amount={amount} className="text-2xl" /> : null}
        </div>

        {/* payOS-only buyer checkout — manual MoMo CK UI removed */}
        {payosConfigured ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-4 text-sm">
            <p className="font-medium">{t("checkout.payosTitle")}</p>
            <p className="text-xs text-muted">
              {t("checkout.payosHint", { minutes: String(ttlMinutes) })}
            </p>
            {payosBusy && !payos ? (
              <p className="inline-flex items-center gap-2 text-xs text-muted">
                <Spinner /> {t("checkout.payosCreating")}
              </p>
            ) : null}
            {payos?.checkoutUrl ? (
              <>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => window.open(payos.checkoutUrl, "_blank", "noopener,noreferrer")}
                >
                  {t("checkout.payosOpen")}
                </Button>
                <p className="text-xs text-muted">{t("checkout.payosWaiting")}</p>
                {payos.qrCode ? (
                  <p className="break-all font-mono text-[10px] text-muted">{payos.qrCode}</p>
                ) : null}
                {awaiting && !isFailed ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={payosBusy}
                    onClick={() => void createPayos(true)}
                  >
                    {payosBusy ? t("checkout.payosCreating") : t("checkout.payosRetry")}
                  </Button>
                ) : null}
              </>
            ) : payosTried && !payosBusy ? (
              <Alert variant="warning">{t("checkout.payosFallback")}</Alert>
            ) : null}
          </div>
        ) : showPayosNotConfigured ? (
          <Alert variant="warning">{t("checkout.payosNotConfigured")}</Alert>
        ) : null}

        <p className="text-xs text-muted">{t("checkout.platformNote")}</p>
        <p className="text-xs text-muted">{t("checkout.buyerTrust")}</p>
        <p className="text-[11px] leading-relaxed text-muted">{t("checkout.legalNotice")}</p>

        {pendingConfirm ? (
          <Alert variant="info">{t("checkout.pendingConfirmBanner")}</Alert>
        ) : null}

        {isFailed ? (
          <Alert variant="danger" role="alert">
            {t("checkout.unpaid")}
          </Alert>
        ) : error ? (
          <Alert variant="danger" role="alert">
            {error}
          </Alert>
        ) : null}

        {dev ? (
          <Button variant="secondary" disabled={busy || !orderId} onClick={() => void mockPay(false)}>
            {t("checkout.mockPayDev")}
          </Button>
        ) : null}
        {dev ? (
          <Button variant="secondary" disabled={busy || !orderId} onClick={() => void mockPay(true)}>
            {t("checkout.mockFail")}
          </Button>
        ) : null}
      </Card>
    </Container>
  );
}
