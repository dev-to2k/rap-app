"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Container, Spinner } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { clearPendingBuy, getPendingBuy, setPendingBuy, type PendingBuy } from "@/lib/pending-buy";

export default function CheckoutResumePage() {
  const t = useT();
  const router = useRouter();
  const [msg, setMsg] = useState(t("buy.creating"));
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const runCheckout = useCallback(
    async (intent: PendingBuy) => {
      setFailed(false);
      setLoading(true);
      setMsg(t("buy.creating"));
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beatId: intent.beatId, sku: intent.sku, paymentMethod: "momo" }),
        });
        if (res.status === 401) {
          setPendingBuy(intent);
          router.replace("/login?next=" + encodeURIComponent("/checkout/resume"));
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.order?.id) {
          // Keep pendingBuy until 200 — intent stays in sessionStorage.
          setPendingBuy(intent);
          setMsg(data.error || t("buy.checkoutFailed"));
          setFailed(true);
          setLoading(false);
          return;
        }
        clearPendingBuy();
        router.replace(`/checkout/${data.order.id}`);
      } catch {
        setPendingBuy(intent);
        setMsg(t("common.networkError"));
        setFailed(true);
        setLoading(false);
      }
    },
    [router, t],
  );

  useEffect(() => {
    const intent = getPendingBuy();
    if (!intent) {
      router.replace("/");
      return;
    }
    void runCheckout(intent);
  }, [router, runCheckout]);

  function onRetry() {
    const intent = getPendingBuy();
    if (!intent) {
      router.replace("/");
      return;
    }
    void runCheckout(intent);
  }

  return (
    <Container className="flex flex-col items-center gap-3 py-20 text-sm text-muted">
      {loading ? <Spinner /> : null}
      <p role={failed ? "alert" : undefined}>{msg}</p>
      {failed ? (
        <Button className="rounded-full" onClick={onRetry}>
          {t("buy.retry")}
        </Button>
      ) : null}
    </Container>
  );
}
