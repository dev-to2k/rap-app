"use client";

import { useEffect, useState } from "react";

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
    // refresh tokens periodically
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseId]);

  const labels: Record<string, string> = {
    mp3: "Download MP3",
    wav: "Download WAV",
    stems: "Download Stems",
    pdf: "Download License PDF",
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-400">Downloads (signed URL · short TTL)</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {links.map((l) => (
        <a
          key={l.fileKind}
          href={l.url}
          className="block w-full rounded-full bg-violet-600 py-3 text-center font-medium text-white hover:bg-violet-500"
        >
          {labels[l.fileKind] || l.fileKind}
        </a>
      ))}
      <button
        type="button"
        onClick={() => void load()}
        className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
      >
        Refresh signed links
      </button>
    </div>
  );
}
