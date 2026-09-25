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

type PaymentInfo = {
  momoPhone: string;
  amountVnd: number;
  transferContent: string;
};

const AWAITING = new Set(["pending", "pending_ck", "awaiting_payment"]);

export default function CheckoutPage() {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const orderId = useMemo(() => {
    const raw = params?.orderId;
    return Array.isArray(raw) ? raw[0] : raw || "";
  }, [params]);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
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

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError(t("checkout.copyFail"));
    }
  }

  async function markTransferred() {
    if (!orderId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/transferred`, { method: "POST" });
      const text = await res.text();
      let data: { order?: Order; error?: string } = {};
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
      if (!res.ok) {
        setError(data.error || t("checkout.payError"));
        return;
      }
      if (data.order) setOrder(data.order);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

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

  const phone = payment?.momoPhone || "";
  const amount = payment?.amountVnd ?? order?.amountVnd ?? 0;
  const content = payment?.transferContent || orderId;
  const pendingConfirm = order?.status === "pending_confirm";
  const unlocked = order?.status === "unlocked" || order?.status === "paid";
  const awaiting = order ? AWAITING.has(order.status) || pendingConfirm : true;
  // Tách trạng thái đơn thất bại khỏi lỗi mạng/hiển thị
  const isFailed = order?.status === "failed";

  useEffect(() => {
    if (unlocked && orderId) {
      router.push(`/orders/${orderId}/success`);
    }
  }, [unlocked, orderId, router]);

  // Tự poll 5s khi đang chờ, dừng khi đã mở khóa
  useEffect(() => {
    if (!awaiting || unlocked || !orderId) return;
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [awaiting, unlocked, orderId, load]);

  async function copyAll() {
    const all = `${phone} · ${amount} · ${content}`;
    await copyText("all", all);
  }

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
      {/* Bước 2/3 trong luồng mua */}
      <Stepper current={2} labels={[t("steps.choose"), t("steps.pay"), t("steps.done")]} />
      <Alert variant="info">{t("checkout.reserveNote")}</Alert>
      <Card className="space-y-4 p-6" aria-busy={busy}>
        <p className="font-mono text-xs text-muted">{t("checkout.order", { id: orderId })}</p>
        {order?.sku ? <p className="text-sm">{t(`sku.${order.sku}`)}</p> : null}

        <div>
          <p className="text-xs text-muted">{t("checkout.amountDue")}</p>
          {amount ? <Price amount={amount} className="text-2xl" /> : null}
        </div>

        <Alert variant="info">{t("checkout.ckDisclaimer")}</Alert>

        <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-4 text-sm">
          <p className="font-medium">{t("checkout.ckTitle")}</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted">{t("checkout.ckPhone")}</p>
              <p className="font-mono text-base">{phone || t("checkout.ckPhoneMissing")}</p>
            </div>
            {phone ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => void copyText("phone", phone)}>
                {copied === "phone" ? t("checkout.copied") : t("checkout.copy")}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted">{t("checkout.ckAmount")}</p>
              <Price amount={amount} className="text-base" />
            </div>
            {amount ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copyText("amount", String(amount))}
              >
                {copied === "amount" ? t("checkout.copied") : t("checkout.copy")}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted">{t("checkout.ckContent")}</p>
              <p className="truncate font-mono text-base">{content}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => void copyText("content", content)}>
              {copied === "content" ? t("checkout.copied") : t("checkout.copy")}
            </Button>
          </div>
          <p className="text-xs text-muted">
            {t("checkout.ckGuide", {
              phone: phone || "—",
              amount: String(amount || 0),
              content,
            })}
          </p>
          <p className="text-xs text-warning">{t("checkout.ckWrongCode")}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="tap-target w-full"
            onClick={() => void copyAll()}
          >
            {copied === "all" ? t("checkout.copied") : t("checkout.copyAll")}
          </Button>
        </div>

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

        {awaiting ? (
          <Button className="w-full" disabled={busy || !orderId || !phone} onClick={() => void markTransferred()}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> {t("checkout.confirming")}
              </span>
            ) : (
              t("checkout.iTransferred")
            )}
          </Button>
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
