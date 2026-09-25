"use client";

import { cn, Price } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

const SKUS = ["lease", "wav", "exclusive"] as const;

export function SkuSelector({
  sku,
  onChange,
  prices,
  sampleFlag,
  status,
}: {
  sku: "lease" | "wav" | "exclusive";
  onChange: (sku: "lease" | "wav" | "exclusive") => void;
  prices: { lease: number; wav: number; exclusive: number };
  sampleFlag: string;
  status: string;
}) {
  const t = useT();
  const exclusiveDisabled = sampleFlag === "uncleared" || status !== "available";
  const hints = {
    lease: t("buy.hintLease"),
    wav: t("buy.hintWav"),
    exclusive: t("buy.hintExclusive"),
  };

  return (
    <div role="radiogroup" aria-label={t("buy.chooseLicense")} className="grid grid-cols-1 gap-2">
      {SKUS.map((s) => {
        const disabled = s === "exclusive" && exclusiveDisabled;
        const selected = sku === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            onClick={() => onChange(s)}
            className={cn(
              "tap-target w-full rounded-lg border p-4 text-left transition-fade",
              selected ? "border-accent bg-accent/10" : "border-border bg-surface",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-[15px] font-semibold text-foreground">
                {t(`sku.${s}`)}
              </span>
              <Price
                amount={prices[s]}
                tone={s === "exclusive" ? "seller" : "buyer"}
                className={s === "exclusive" ? "text-exclusive" : undefined}
              />
            </div>
            {s === "exclusive" && sampleFlag === "uncleared" ? (
              <p className="mt-1 text-xs text-warning">{t("buy.exclusiveUncleared")}</p>
            ) : (
              <p className="mt-1 text-xs text-muted">{hints[s]}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
