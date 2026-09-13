"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Spinner } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { setPendingBuy, takePendingBuy } from "@/lib/pending-buy";

export default function CheckoutResumePage() {
  const t = useT();
  const router = useRouter();
  const [msg, setMsg] = useState(t("buy.creating"));

  useEffect(() => {
    const intent = takePendingBuy();
    if (!intent) {
      router.replace("/");
      return;
    }
    (async () => {
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
        setMsg(data.error || t("buy.checkoutFailed"));
        return;
      }
      router.replace(`/checkout/${data.order.id}`);
    })();
  }, [router, t]);

  return (
    <Container className="flex flex-col items-center gap-3 py-20 text-sm text-muted">
      <Spinner />
      {msg}
    </Container>
  );
}
