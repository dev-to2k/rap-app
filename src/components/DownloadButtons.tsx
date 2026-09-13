"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/kit";

type LinkItem = { fileKind: string; url: string; expiresAt: number };

export function DownloadButtons({ licenseId }: { licenseId: string }) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/licenses/${licenseId}/download-links`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setLinks(data.links);
  }

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseId]);

  const labels: Record<string, string> = {
    mp3: "Tải MP3",
    wav: "Tải WAV",
    stems: "Tải Stems",
    pdf: "Tải License PDF",
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted">Tải file (signed URL · hạn ngắn)</h2>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {links.map((l) => (
        <a key={l.fileKind} href={l.url} className={buttonClass({ className: "w-full" })}>
          {labels[l.fileKind] || l.fileKind}
        </a>
      ))}
      <button
        type="button"
        onClick={() => void load()}
        className="w-full text-center text-xs text-muted hover:text-foreground"
      >
        Làm mới link tải
      </button>
    </div>
  );
}
