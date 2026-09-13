"use client";

import { useMemo, useState } from "react";
import { Chip, Container, EmptyState } from "@/kit";
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
    <Container className="py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">{t("home.catalogTitle")}</h1>
        <div className="flex gap-2 text-sm">
          {(["new", "plays", "price"] as const).map((s) => (
            <Chip key={s} selected={sort === s} onClick={() => setSort(s)}>
              {s === "new" ? t("home.sortNew") : s === "plays" ? t("home.sortPlays") : t("home.sortPrice")}
            </Chip>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t("home.filters")}</p>
          <div className="flex flex-col gap-2">
            <Chip selected={tag === "all"} onClick={() => setTag("all")}>
              {t("home.filterAll")}
            </Chip>
            {BEAT_TAGS.map((key) => (
              <Chip key={key} selected={tag === key} onClick={() => setTag(key)}>
                {t(`home.tag${key[0].toUpperCase()}${key.slice(1)}`)}
              </Chip>
            ))}
          </div>
          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">{t("home.key")}</p>
          <p className="text-sm text-muted">{keys.join(" · ") || "—"}</p>
          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">{t("home.bpm")}</p>
          <p className="text-sm text-muted">
            {beats.length ? `${Math.min(...beats.map((b) => b.bpm))}–${Math.max(...beats.map((b) => b.bpm))}` : "—"}
          </p>
          <label className="mt-6 flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={exclusiveOnly}
              onChange={(e) => setExclusiveOnly(e.target.checked)}
              className="accent-accent"
            />
            {t("home.exclusiveOpen")}
          </label>
        </aside>
        <div>
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            <Chip selected={tag === "all"} onClick={() => setTag("all")}>
              {t("home.filterAll")}
            </Chip>
            {BEAT_TAGS.map((key) => (
              <Chip key={key} selected={tag === key} onClick={() => setTag(key)} className="shrink-0">
                {t(`home.tag${key[0].toUpperCase()}${key.slice(1)}`)}
              </Chip>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon="music" title={t("home.emptyTitle")} description={t("home.emptyDescription")} />
          ) : (
            <ul className="grid gap-3">
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
                  audioUrl={b.audioUrl}
                  sampleFlag={b.sampleFlag}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Container>
  );
}
