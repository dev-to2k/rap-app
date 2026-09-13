import { SKU_LABELS } from "@/lib/config";
import { cn, Price } from "@/kit";

const SKUS = ["lease", "wav", "exclusive"] as const;

const HINTS: Record<(typeof SKUS)[number], string> = {
  lease: "MP3 · non-exclusive",
  wav: "WAV + stems · non-exclusive",
  exclusive: "Bán độc quyền · beat gỡ khỏi chợ",
};

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
  const exclusiveDisabled = sampleFlag === "uncleared" || status !== "available";

  return (
    <div className="space-y-2">
      {SKUS.map((s) => {
        const disabled = s === "exclusive" && exclusiveDisabled;
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition",
              sku === s ? "border-accent bg-accent/10" : "border-border bg-surface",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">{SKU_LABELS[s]}</span>
              <Price amount={prices[s]} className={s === "exclusive" ? "text-exclusive" : undefined} />
            </div>
            {s === "exclusive" && sampleFlag === "uncleared" ? (
              <p className="mt-1 text-xs text-warning">Không bán Exclusive — sample uncleared</p>
            ) : (
              <p className="mt-1 text-xs text-muted">{HINTS[s]}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
