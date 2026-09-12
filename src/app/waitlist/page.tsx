"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function WaitlistForm() {
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<"producer" | "rapper">("rapper");
  const [catalogUrl, setCatalogUrl] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});

  useEffect(() => {
    const keys = ["src", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const next: Record<string, string> = {};
    for (const k of keys) {
      const v = sp.get(k);
      if (v) next[k] = v;
    }
    setUtm(next);
  }, [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, handle, role, catalogUrl: catalogUrl || undefined, ...utm }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Không lưu được");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <h1 className="text-xl font-bold text-white">Đã nhận early access</h1>
        <p className="text-sm text-zinc-300">Cam on ban  minh se lien he qua email khi mo them slot.</p>
        <Link href="/" className="inline-block text-sm text-emerald-400 hover:underline">
          ← Về chợ beat
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Xin early access</h1>
        <p className="text-sm text-zinc-400">
          Cho beat VN-first  lease / WAV+stems / exclusive, checkout VND. Khong can thanh toan de vao waitlist.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Email *</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">IG / handle</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@yourhandle"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>
        <fieldset className="space-y-2 text-sm">
          <legend className="text-zinc-400">Bạn là</legend>
          <div className="flex gap-3">
            {(["producer", "rapper"] as const).map((r) => (
              <label
                key={r}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center capitalize ${
                  role === r ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700"
                }`}
              >
                <input type="radio" className="sr-only" checked={role === r} onChange={() => setRole(r)} />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1 text-sm">
          <span className="text-zinc-400">Catalog URL (optional)</span>
          <input
            type="url"
            value={catalogUrl}
            onChange={(e) => setCatalogUrl(e.target.value)}
            placeholder="https://"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Đang gửi…" : "Xin early access"}
        </button>
      </form>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<p className="text-zinc-400">Loading...</p>}>
      <WaitlistForm />
    </Suspense>
  );
}
