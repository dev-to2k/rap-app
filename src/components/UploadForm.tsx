"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_CURRENCY } from "@/lib/config";
import { Button, Card, CurrencyInput, Field, Input, Stepper } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

export function UploadForm() {
  const t = useT();
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
      setError(t("upload.pickAudio"));
      return;
    }
    const n = file.name.toLowerCase();
    if (!n.endsWith(".mp3") && !n.endsWith(".wav")) {
      setError(t("upload.badFile"));
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
    fd.set("priceLease", meta.priceLease.replace(/\D/g, ""));
    fd.set("priceWav", meta.priceWav.replace(/\D/g, ""));
    fd.set("priceExclusive", meta.priceExclusive.replace(/\D/g, ""));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : t("upload.failed"));
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
          <h2 className="font-medium text-foreground">{t("upload.audio")}</h2>
          <Input
            type="file"
            accept="audio/*,.mp3,.wav"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file ? <p className="text-xs text-muted">{file.name}</p> : null}
          <Button className="w-full" disabled={!file} onClick={() => setStep(2)}>
            {t("common.next")}
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-3 p-6">
          <h2 className="font-medium text-foreground">{t("upload.meta")}</h2>
          <Field label={t("upload.fieldTitle")}>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("upload.bpm")}>
              <Input value={meta.bpm} onChange={(e) => setMeta({ ...meta, bpm: e.target.value })} />
            </Field>
            <Field label={t("upload.key")}>
              <Input
                value={meta.musicalKey}
                onChange={(e) => setMeta({ ...meta, musicalKey: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              {t("common.back")}
            </Button>
            <Button className="flex-1" disabled={meta.title.length < 2} onClick={() => setStep(3)}>
              {t("common.next")}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-3 p-6">
          <h2 className="font-medium text-foreground">{t("upload.sample")}</h2>
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
                {f === "clean" ? t("upload.cleanHint") : t("upload.unclearedHint")}
              </div>
            </button>
          ))}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              {t("common.back")}
            </Button>
            <Button className="flex-1" onClick={() => setStep(4)}>
              {t("common.next")}
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-3 p-6">
          <h2 className="font-medium text-foreground">{t("upload.prices", { currency: DEFAULT_CURRENCY })}</h2>
          {(
            [
              ["priceLease", "sku.lease"],
              ["priceWav", "sku.wav"],
              ["priceExclusive", "sku.exclusive"],
            ] as const
          ).map(([key, labelKey]) => (
            <Field key={key} label={t(labelKey)} hint={DEFAULT_CURRENCY}>
              <CurrencyInput
                name={key}
                required
                value={meta[key]}
                onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
              />
            </Field>
          ))}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(3)}>
              {t("common.back")}
            </Button>
            <Button className="flex-1" disabled={busy} onClick={() => void publish()}>
              {busy ? t("upload.publishing") : t("upload.publish")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
