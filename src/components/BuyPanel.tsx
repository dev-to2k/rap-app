"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatVnd } from "@/lib/config";
import { Alert, Button, Icon, Price, Spinner, Stepper, StickyBar } from "@/kit";
import { SkuSelector } from "./SkuSelector";
import { useT } from "@/i18n/I18nProvider";

type Beat = {
  id: string;
  priceLease: number;
  priceWav: number;
  priceExclusive: number;
  sampleFlag: string;
  status: string;
};

export function BuyPanel({ beat }: { beat: Beat }) {
  const t = useT();
  const router = useRouter();
  const [sku, setSku] = useState<"lease" | "wav" | "exclusive">("lease");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const exclusiveDisabled = beat.sampleFlag === "uncleared" || beat.status !== "available";
  const soldExclusive = beat.status === "sold_exclusive";
  const price =
    sku === "lease" ? beat.priceLease : sku === "wav" ? beat.priceWav : beat.priceExclusive;
  const buyDisabled =
    loading || beat.status !== "available" || (sku === "exclusive" && exclusiveDisabled);

  async function checkout() {
    setError("");
    if (sku === "exclusive" && beat.sampleFlag === "uncleared") {
      setError(t("buy.unclearedAlert"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId: beat.id, sku, paymentMethod: "momo" }),
      });
      const text = await res.text();
      let data: { error?: string; order?: { id: string } } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(t("buy.checkoutError"));
        return;
      }
      if (res.status === 401) {
        const { setPendingBuy } = await import("@/lib/pending-buy");
        setPendingBuy({ beatId: beat.id, sku });
        router.push("/login?next=" + encodeURIComponent("/checkout/resume"));
        return;
      }
      if (!res.ok) {
        setError(data.error || t("buy.checkoutFailed"));
        return;
      }
      if (!data.order?.id) {
        setError(t("buy.noOrder"));
        return;
      }
      router.push(`/checkout/${data.order.id}`);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  if (soldExclusive) {
    return <Alert variant="info">{t("buy.soldExclusive")}</Alert>;
  }

  const ctaInner = loading ? (
    <span className="inline-flex items-center gap-2">
      <Spinner /> {t("buy.creating")}
    </span>
  ) : (
    <>
      <Icon name="wallet" size="sm" />
      {t("buy.ctaMomo")}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Bước 1/3 trong luồng mua */}
      <Stepper current={1} labels={[t("steps.choose"), t("steps.pay"), t("steps.done")]} />
      <div>
        <h3 className="font-display text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t("buy.chooseLicense")}
        </h3>
        <p className="mt-1 text-xs text-muted">{t("buy.chooseHint")}</p>
      </div>
      <SkuSelector
        sku={sku}
        onChange={setSku}
        prices={{ lease: beat.priceLease, wav: beat.priceWav, exclusive: beat.priceExclusive }}
        sampleFlag={beat.sampleFlag}
        status={beat.status}
      />
      {sku === "exclusive" && beat.sampleFlag !== "uncleared" ? (
        <p className="text-xs text-muted">{t("buy.exclusiveNote")}</p>
      ) : null}
      {beat.sampleFlag === "uncleared" ? (
        <Alert variant="warning">{t("buy.unclearedAlert")}</Alert>
      ) : null}
      {error ? (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      ) : null}

      <div className="hidden space-y-3 md:block">
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
          <span className="text-sm text-muted">{t("buy.subtotal")}</span>
          <Price amount={price} className="text-lg" />
        </div>
        <Button className="tap-target w-full rounded-full" disabled={buyDisabled} onClick={() => void checkout()}>
          {ctaInner}
        </Button>
        <p className="text-center text-xs text-muted">{t("buy.ctaHint", { price: formatVnd(price) })}</p>
      </div>

      <StickyBar className="md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted">{t("buy.subtotal")}</p>
            <Price amount={price} className="text-base" />
          </div>
          <Button
            className="tap-target shrink-0 rounded-full px-4"
            disabled={buyDisabled}
            onClick={() => void checkout()}
          >
            {ctaInner}
          </Button>
        </div>
      </StickyBar>
    </div>
  );
}
