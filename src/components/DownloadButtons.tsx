"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Skeleton, buttonClass } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

type LinkItem = { fileKind: string; url: string; expiresAt: number };

function minutesLeft(expiresAt: number, nowMs: number): number {
  return Math.max(0, Math.ceil((expiresAt * 1000 - nowMs) / 60_000));
}

export function DownloadButtons({ licenseId }: { licenseId: string }) {
  const t = useT();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(
    async (renew = false) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/licenses/${licenseId}/download-links`, {
          method: renew ? "POST" : "GET",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t("download.failed"));
          setLinks([]);
          setExpiresAt(null);
          return;
        }
        setLinks(data.links || []);
        setExpiresAt(
          typeof data.expiresAt === "number"
            ? data.expiresAt
            : data.links?.[0]?.expiresAt ?? null,
        );
      } catch {
        setError(t("download.failed"));
      } finally {
        setLoading(false);
      }
    },
    [licenseId, t],
  );

  useEffect(() => {
    void load(false);
    const timer = setInterval(() => void load(false), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(tick);
  }, []);

  const labels: Record<string, string> = {
    mp3: t("download.mp3"),
    wav: t("download.wav"),
    stems: t("download.stems"),
    pdf: t("download.pdf"),
  };

  const mins = useMemo(
    () => (expiresAt ? minutesLeft(expiresAt, now) : null),
    [expiresAt, now],
  );
  const expired = mins !== null && mins <= 0;

  const showSkeleton = loading && links.length === 0 && !error;

  return (
    <div className="space-y-2" aria-busy={loading}>
      <h2 className="text-sm font-semibold text-muted">{t("download.heading")}</h2>
      {showSkeleton ? (
        <div className="space-y-2" aria-hidden="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : null}
      {mins !== null && !showSkeleton ? (
        <p className={`text-xs ${expired ? "text-danger" : "text-muted"}`}>
          {expired ? t("download.expired") : t("download.expiresIn", { m: String(mins) })}
        </p>
      ) : null}
      {error ? (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      ) : null}
      {links.map((l) => (
        <a
          key={l.fileKind}
          href={expired ? undefined : l.url}
          onClick={(e) => {
            if (expired) {
              e.preventDefault();
              void load(true);
            }
          }}
          className={buttonClass({ className: "w-full", variant: expired ? "secondary" : "primary" })}
          aria-disabled={expired}
        >
          {labels[l.fileKind] || l.fileKind}
        </a>
      ))}
      <button
        type="button"
        disabled={loading}
        onClick={() => void load(true)}
        className="w-full text-center text-xs font-medium text-accent hover:underline disabled:opacity-50"
      >
        {loading ? t("common.loading") : t("download.renew")}
      </button>
    </div>
  );
}
