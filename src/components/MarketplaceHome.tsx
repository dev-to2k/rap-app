"use client";

import { useMemo, useState } from "react";
import { Checkbox, Chip, Container, EmptyState } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { BEAT_TAGS, mockPlays, tagForTitle, type BeatTag } from "@/lib/beat-tags";
import { BeatCard } from "./BeatCard";

export type CatalogBeat = {
  id: string;
  title: string;
  coverUrl: string | null;
  audioUrl: string;
  bpm: number;
  musicalKey: string;
  priceLease: number;
  priceWav?: number;
  priceExclusive?: number;
  sampleFlag: string;
  status?: string;
  producer: { name: string };
};

export function MarketplaceHome({
  beats,
  initialQuery = "",
}: {
  beats: CatalogBeat[];
  initialQuery?: string;
}) {
  const t = useT();
  const [tag, setTag] = useState<BeatTag | "all">("all");
  const [sort, setSort] = useState<"new" | "plays" | "price">("new");
  const [exclusiveOnly, setExclusiveOnly] = useState(false);
  const q = initialQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = beats.filter((b) => {
      const hitTag = tag === "all" || tagForTitle(b.title) === tag;
      const hitQ =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.producer.name.toLowerCase().includes(q) ||
        String(b.bpm).includes(q);
      const hitEx = !exclusiveOnly || b.sampleFlag !== "uncleared";
      return hitTag && hitQ && hitEx;
    });
    if (sort === "price") list = [...list].sort((a, b) => a.priceLease - b.priceLease);
    if (sort === "plays") list = [...list].sort((a, b) => mockPlays(b.id) - mockPlays(a.id));
    return list;
  }, [beats, tag, q, sort, exclusiveOnly]);

  const keys = Array.from(new Set(beats.map((b) => b.musicalKey)));

  return (
    <Container className="py-5">
      <header className="mb-5 space-y-2 fade-in">
        <p className="text-[13px] font-medium uppercase tracking-wider text-accent">{t("home.heroEyebrow")}</p>
        <h1 className="font-display text-[28px] font-extrabold leading-[34px] tracking-tight">
          {t("home.heroTitle")}
        </h1>
        <p className="text-[15px] leading-[22px] text-muted">{t("home.heroBody")}</p>
      </header>

      <div className="sticky top-[104px] z-20 -mx-4 mb-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:top-14">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[22px] font-bold leading-7">{t("home.catalogTitle")}</h2>
          <div className="flex gap-2 text-sm">
            {(["new", "plays", "price"] as const).map((s) => (
              <Chip key={s} selected={sort === s} onClick={() => setSort(s)} className="tap-target">
                {s === "new" ? t("home.sortNew") : s === "plays" ? t("home.sortPlays") : t("home.sortPrice")}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip selected={tag === "all"} onClick={() => setTag("all")} className="tap-target shrink-0">
            {t("home.filterAll")}
          </Chip>
          {BEAT_TAGS.map((key) => (
            <Chip key={key} selected={tag === key} onClick={() => setTag(key)} className="tap-target shrink-0">
              {t(`home.tag${key[0].toUpperCase()}${key.slice(1)}`)}
            </Chip>
          ))}
        </div>
      </div>

      <details className="mb-4 rounded-md border border-border bg-surface p-3 text-sm">
        <summary className="tap-target cursor-pointer list-none font-medium text-muted">{t("home.filters")}</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">
            {t("home.key")}: {keys.join(" · ") || "—"}
          </p>
          <p className="text-xs text-muted">
            {t("home.bpm")}:{" "}
            {beats.length ? `${Math.min(...beats.map((b) => b.bpm))}–${Math.max(...beats.map((b) => b.bpm))}` : "—"}
          </p>
          <Checkbox
            className="text-muted"
            name="exclusiveOpen"
            checked={exclusiveOnly}
            onChange={(e) => setExclusiveOnly(e.target.checked)}
          >
            {t("home.exclusiveOpen")}
          </Checkbox>
        </div>
      </details>

      {filtered.length === 0 ? (
        <EmptyState icon="music" title={t("home.emptyTitle")} description={t("home.emptyDescription")} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
          {filtered.map((b) => (
            <BeatCard
              key={b.id}
              id={b.id}
              title={b.title}
              coverUrl={b.coverUrl}
              producer={b.producer.name}
              bpm={b.bpm}
              musicalKey={b.musicalKey}
              price={b.priceLease}
              priceWav={b.priceWav}
              priceExclusive={b.priceExclusive}
              status={b.status}
              audioUrl={b.audioUrl}
              sampleFlag={b.sampleFlag}
            />
          ))}
        </ul>
      )}
    </Container>
  );
}
