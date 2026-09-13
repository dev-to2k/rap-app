"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field, Input, Stepper } from "@/kit";

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
    const n = file.name.toLowerCase();
    if (!n.endsWith(".mp3") && !n.endsWith(".wav")) {
      setError("File không hỗ trợ. Thử MP3 hoặc WAV.");
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    fd.set("title", meta.title);
    fd.set("bpm", meta.bpm);
    fd.set("musicalKey", meta.musicalKey);
    fd.set("sampleFlag", meta.sampleFlag);
    fd.set("priceLease", meta.priceLease);
    fd.set("priceWav", meta.priceWav);
    fd.set("priceExclusive", meta.priceExclusive);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
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
    <div className="mx-auto max-w-lg space-y-4">
      <Stepper steps={4} current={step} />

      {step === 1 && (
        <Card className="space-y-3 p-6">
          <h2 className="font-medium text-foreground">1. Audio</h2>
          <Input
            type="file"
            accept="audio/*,.mp3,.wav"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? <p className="text-xs text-muted">{file.name}</p> : null}
          <Button className="w-full" disabled={!file} onClick={() => setStep(2)}>
            Tiếp
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-3 p-6">
          <h2 className="font-medium text-foreground">2. Meta</h2>
          <Field label="Tiêu đề">
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="BPM">
              <Input value={meta.bpm} onChange={(e) => setMeta({ ...meta, bpm: e.target.value })} />
            </Field>
            <Field label="Key">
              <Input
                value={meta.musicalKey}
                onChange={(e) => setMeta({ ...meta, musicalKey: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Quay lại
            </Button>
            <Button className="flex-1" disabled={meta.title.length < 2} onClick={() => setStep(3)}>
              Tiếp
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-3 p-6">
          <h2 className="font-medium text-foreground">3. Sample flag</h2>
          {(["clean", "uncleared"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setMeta({ ...meta, sampleFlag: f })}
              className={`w-full rounded-xl border p-3 text-left ${
                meta.sampleFlag === f ? "border-accent bg-accent/10" : "border-border"
              }`}
            >
              <div className="font-medium text-foreground">{f}</div>
              <div className="text-xs text-muted">
                {f === "clean" ? "Có thể bán Exclusive" : "Cấm Exclusive + disclaimer PDF khi mua"}
              </div>
            </button>
          ))}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              Quay lại
            </Button>
            <Button className="flex-1" onClick={() => setStep(4)}>
              Tiếp
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-3 p-6">
          <h2 className="font-medium text-foreground">4. Giá (VND) → Đăng bán</h2>
          {(
            [
              ["priceLease", "Lease MP3"],
              ["priceWav", "WAV + Stems"],
              ["priceExclusive", "Exclusive"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input value={meta[key]} onChange={(e) => setMeta({ ...meta, [key]: e.target.value })} />
            </Field>
          ))}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(3)}>
              Quay lại
            </Button>
            <Button className="flex-1" disabled={busy} onClick={() => void publish()}>
              {busy ? "Đang đăng…" : "Đăng bán"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
