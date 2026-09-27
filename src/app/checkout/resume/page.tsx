"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Container, Spinner, buttonClass } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { clearPendingBuy, getPendingBuy, setPendingBuy, type PendingBuy } from "@/lib/pending-buy";

export default function CheckoutResumePage() {
  const t = useT();
  const router = useRouter();
  const [msg, setMsg] = useState(t("buy.creating"));
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noIntent, setNoIntent] = useState(false);

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
      setNoIntent(true);
      setLoading(false);
      setMsg(t("buy.noPendingBuy"));
      return;
    }
    void runCheckout(intent);
  }, [runCheckout, t]);

  function onRetry() {
    const intent = getPendingBuy();
    if (!intent) {
      setNoIntent(true);
      setLoading(false);
      setFailed(false);
      setMsg(t("buy.noPendingBuy"));
      return;
    }
    void runCheckout(intent);
  }

  return (
    <Container className="flex flex-col items-center gap-3 py-20 text-sm text-muted">
      {loading ? <Spinner /> : null}
      <p role={failed || noIntent ? "alert" : undefined}>{msg}</p>
      {failed ? (
        <Button className="rounded-full" onClick={onRetry}>
          {t("buy.retry")}
        </Button>
      ) : null}
      {noIntent ? (
        <Link href="/" className={buttonClass({ className: "rounded-full" })}>
          {t("buy.backHome")}
        </Link>
      ) : null}
    </Container>
  );
}
