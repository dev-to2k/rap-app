"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({
    title: "",
    bpm: "140",
    musicalKey: "Am",
    sampleFlag: "clean",
    priceLease: "199000",
    priceWav: "599000",
    priceExclusive: "3000000",
  });

  async function publish() {
    if (!file) {
      setError("Chọn file audio");
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("audio", file);
    Object.entries(meta).forEach(([k, v]) => fd.set(k, v));
    const res = await fetch("/api/beats", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Upload failed");
      return;
    }
    router.push(`/beats/${data.beat.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs text-zinc-500">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={`rounded-full px-2 py-1 ${step === s ? "bg-violet-600 text-white" : "bg-zinc-800"}`}
          >
            {s}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-medium text-white">1. Audio</h2>
          <input
            type="file"
            accept="audio/*,.mp3,.wav"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-zinc-300"
          />
          {file && <p className="text-xs text-zinc-400">{file.name}</p>}
          <button
            type="button"
            disabled={!file}
            onClick={() => setStep(2)}
            className="w-full rounded-full bg-violet-600 py-2 text-white disabled:opacity-40"
          >
            Tiếp
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-medium text-white">2. Meta</h2>
          <label className="block text-xs text-zinc-400">
            Title
            <input
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-zinc-400">
              BPM
              <input
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={meta.bpm}
                onChange={(e) => setMeta({ ...meta, bpm: e.target.value })}
              />
            </label>
            <label className="block text-xs text-zinc-400">
              Key
              <input
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={meta.musicalKey}
                onChange={(e) => setMeta({ ...meta, musicalKey: e.target.value })}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-full bg-zinc-800 py-2 text-white">
              Back
            </button>
            <button
              type="button"
              disabled={meta.title.length < 2}
              onClick={() => setStep(3)}
              className="flex-1 rounded-full bg-violet-600 py-2 text-white disabled:opacity-40"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-medium text-white">3. Sample flag</h2>
          {(["clean", "uncleared"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setMeta({ ...meta, sampleFlag: f })}
              className={`w-full rounded-xl border p-3 text-left ${
                meta.sampleFlag === f ? "border-violet-500 bg-violet-950/40" : "border-zinc-700"
              }`}
            >
              <div className="font-medium text-white">{f}</div>
              <div className="text-xs text-zinc-400">
                {f === "clean"
                  ? "Có thể bán Exclusive"
                  : "Cấm Exclusive + disclaimer PDF khi mua"}
              </div>
            </button>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-full bg-zinc-800 py-2 text-white">
              Back
            </button>
            <button type="button" onClick={() => setStep(4)} className="flex-1 rounded-full bg-violet-600 py-2 text-white">
              Tiếp
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-medium text-white">4. Giá (VND) → Publish</h2>
          {(
            [
              ["priceLease", "Lease MP3"],
              ["priceWav", "WAV + Stems"],
              ["priceExclusive", "Exclusive"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-zinc-400">
              {label}
              <input
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={meta[key]}
                onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
              />
            </label>
          ))}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-full bg-zinc-800 py-2 text-white">
              Back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void publish()}
              className="flex-1 rounded-full bg-violet-600 py-2 font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
