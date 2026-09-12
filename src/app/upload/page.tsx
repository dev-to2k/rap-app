"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const file = form.get("file");
    if (file instanceof File) {
      const n = file.name.toLowerCase();
      if (!n.endsWith(".mp3") && !n.endsWith(".wav")) {
        setLoading(false);
        setError("File không hỗ trợ. Thử MP3 hoặc WAV.");
        return;
      }
    }
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    router.push(`/beats/${data.beat.id}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">Đăng beat</h1>
      <p className="mb-6 text-sm text-zinc-400">Up beat · set 3 giá VND · tự khai sample · bán có PDF.</p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <label className="block text-sm">
          Tiêu đề
          <input name="title" required className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            BPM
            <input name="bpm" type="number" defaultValue={140} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
          <label className="block text-sm">
            Key
            <input name="musicalKey" defaultValue="Am" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
        </div>
        <label className="block text-sm">
          Sample
          <select name="sampleFlag" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2">
            <option value="clean">clean</option>
            <option value="uncleared">uncleared</option>
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-xs">
            Lease VND
            <input name="priceLease" type="number" defaultValue={199000} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2" />
          </label>
          <label className="block text-xs">
            WAV VND
            <input name="priceWav" type="number" defaultValue={599000} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2" />
          </label>
          <label className="block text-xs">
            Exclusive VND
            <input name="priceExclusive" type="number" defaultValue={3000000} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2" />
          </label>
        </div>
        <label className="block text-sm">
          File MP3/WAV
          <input name="file" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" required className="mt-1 w-full text-sm" />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50">
          {loading ? "Đang tải…" : "Đăng bán"}
        </button>
      </form>
    </div>
  );
}
