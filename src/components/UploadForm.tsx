"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_TAKE_RATE_BPS } from "@/lib/config";
import { Button, Card, Checkbox, CurrencyInput, Field, Input, Radio, Select, Textarea } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

function sizeLabel(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function FileDrop({
  label,
  hint,
  accept,
  file,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const t = useT();
  return (
    <label className="flex min-h-[8.5rem] cursor-pointer flex-col rounded-lg border border-dashed border-white/15 bg-surface-2/50 p-4 transition hover:border-accent/50">
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-0.5 text-xs text-muted">{hint}</span>
      <span className="mt-auto pt-3 text-xs text-accent">
        {file ? `${file.name} · ${sizeLabel(file.size)}` : t("upload.drop")}
      </span>
      <input type="file" accept={accept} className="sr-only" onChange={(e) => onFile(e.target.files?.[0] || null)} />
    </label>
  );
}

export function UploadForm() {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [master, setMaster] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [stems, setStems] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [owned, setOwned] = useState(false);
  const [sellWav, setSellWav] = useState(true);
  const [sellStem, setSellStem] = useState(true);
  const [sellExclusive, setSellExclusive] = useState(true);
  const [meta, setMeta] = useState({
    title: "",
    bpm: "140",
    musicalKey: "Am",
    typeBeat: "trap",
    mood: "dark",
    description: "",
    vocal: "instrumental",
    sampleFlag: "clean" as "clean" | "uncleared",
    priceLease: "199000",
    priceWav: "599000",
    priceStem: "899000",
    priceExclusive: "3000000",
  });

  const masterIsWav = Boolean(master?.name.toLowerCase().endsWith(".wav"));
  const wavLocked = !masterIsWav;
  const stemLocked = !stems;
  const exclusiveLocked = meta.sampleFlag === "uncleared";
  const canPublish = Boolean(master) && meta.title.length >= 2 && owned && !busy;

  async function publish() {
    if (!canPublish || !master) return;
    const n = master.name.toLowerCase();
    if (!n.endsWith(".mp3") && !n.endsWith(".wav")) {
      setError(t("upload.badFile"));
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("file", master);
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
    router.push(`/studio/catalog`);
    router.refresh();
  }

  const takePct = DEFAULT_TAKE_RATE_BPS / 100;

  const licenses = [
    {
      key: "lease" as const,
      label: t("sku.lease"),
      rights: t("upload.rightsLease"),
      priceKey: "priceLease" as const,
      locked: false,
      checked: true,
      note: null as string | null,
    },
    {
      key: "wav" as const,
      label: t("upload.skuWavOnly"),
      rights: t("upload.rightsWav"),
      priceKey: "priceWav" as const,
      locked: wavLocked,
      checked: sellWav && !wavLocked,
      note: wavLocked ? t("upload.noWav") : null,
    },
    {
      key: "stem" as const,
      label: t("upload.skuStem"),
      rights: t("upload.rightsStem"),
      priceKey: "priceStem" as const,
      locked: stemLocked,
      checked: sellStem && !stemLocked,
      note: stemLocked ? t("upload.missingStems") : null,
    },
    {
      key: "exclusive" as const,
      label: t("sku.exclusive"),
      rights: t("upload.rightsExclusive"),
      priceKey: "priceExclusive" as const,
      locked: exclusiveLocked,
      checked: sellExclusive && !exclusiveLocked,
      note: exclusiveLocked ? t("buy.exclusiveUncleared") : t("upload.exclusiveWarn"),
    },
  ];

  return (
    <div className="space-y-8 pb-28">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{t("upload.audio")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FileDrop
            label={t("upload.master")}
            hint={t("upload.masterHint")}
            accept="audio/wav,audio/mpeg,.wav,.mp3"
            file={master}
            onFile={setMaster}
          />
          <FileDrop
            label={t("upload.preview")}
            hint={t("upload.previewHint")}
            accept="audio/mpeg,.mp3"
            file={preview}
            onFile={setPreview}
          />
          <FileDrop
            label={t("upload.stems")}
            hint={t("upload.stemsHint")}
            accept=".zip,application/zip"
            file={stems}
            onFile={setStems}
          />
          <FileDrop
            label={t("upload.cover")}
            hint={t("upload.coverHint")}
            accept="image/*"
            file={cover}
            onFile={setCover}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{t("upload.meta")}</h2>
        <Card className="grid gap-4 p-5 md:grid-cols-2">
          <Field label={t("upload.fieldTitle")}>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </Field>
          <Field label={t("upload.typeBeat")}>
            <Select value={meta.typeBeat} onChange={(e) => setMeta({ ...meta, typeBeat: e.target.value })}>
              <option value="trap">Trap</option>
              <option value="drill">Drill</option>
              <option value="melodic">Melodic</option>
              <option value="lofi">Lo-fi</option>
              <option value="boombap">Boom bap</option>
            </Select>
          </Field>
          <Field label={t("upload.bpm")}>
            <Input value={meta.bpm} onChange={(e) => setMeta({ ...meta, bpm: e.target.value })} />
          </Field>
          <Field label={t("upload.key")}>
            <Input value={meta.musicalKey} onChange={(e) => setMeta({ ...meta, musicalKey: e.target.value })} />
          </Field>
          <Field label={t("upload.mood")}>
            <Select value={meta.mood} onChange={(e) => setMeta({ ...meta, mood: e.target.value })}>
              <option value="dark">Dark</option>
              <option value="melodic">Melodic</option>
              <option value="aggressive">Aggressive</option>
              <option value="chill">Chill</option>
            </Select>
          </Field>
          <fieldset className="space-y-2 text-sm">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted">Vocal</legend>
            <Radio
              name="vocal"
              value="instrumental"
              checked={meta.vocal === "instrumental"}
              onChange={() => setMeta({ ...meta, vocal: "instrumental" })}
            >
              {t("upload.instrumental")}
            </Radio>
            <Radio
              name="vocal"
              value="vocal"
              checked={meta.vocal === "vocal"}
              onChange={() => setMeta({ ...meta, vocal: "vocal" })}
            >
              {t("upload.vocal")}
            </Radio>
          </fieldset>
          <div className="grid gap-2 md:col-span-2 sm:grid-cols-2">
            {(["clean", "uncleared"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setMeta({ ...meta, sampleFlag: f })}
                className={`rounded-md border p-3 text-left text-sm ${
                  meta.sampleFlag === f ? "border-accent bg-accent/10" : "border-border"
                }`}
              >
                {f === "clean" ? t("upload.cleanHint") : t("upload.unclearedHint")}
              </button>
            ))}
          </div>
          <details className="md:col-span-2">
            <summary className="cursor-pointer text-sm text-muted">{t("upload.descriptionField")}</summary>
            <div className="mt-2">
              <Textarea rows={3} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
            </div>
          </details>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{t("upload.sample")}</h2>
        <div className="grid gap-3">
          {licenses.map((row) => (
            <Card key={row.key} className={`p-4 ${row.locked ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Checkbox
                  name={row.key}
                  checked={row.checked}
                  disabled={row.key === "lease" || row.locked}
                  className="font-medium"
                  onChange={(e) => {
                    if (row.key === "wav") setSellWav(e.target.checked);
                    if (row.key === "stem") setSellStem(e.target.checked);
                    if (row.key === "exclusive") setSellExclusive(e.target.checked);
                  }}
                >
                  {row.label}
                </Checkbox>
                <CurrencyInput
                  name={row.priceKey}
                  value={meta[row.priceKey]}
                  disabled={row.locked}
                  onChange={(e) => setMeta({ ...meta, [row.priceKey]: e.target.value })}
                  className="w-40"
                />
              </div>
              <p className="mt-1 text-xs text-muted">{row.rights}</p>
              {row.note ? <p className="mt-1 text-xs text-warning">{row.note}</p> : null}
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted">{t("upload.takeRate", { pct: takePct })}</p>
        <Checkbox name="ownership" checked={owned} required onChange={(e) => setOwned(e.target.checked)}>
          {t("upload.ownership")}
        </Checkbox>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </section>

      <div className="sticky bottom-4 z-20 flex flex-wrap justify-end gap-2 rounded-lg border border-border bg-background/95 p-3 backdrop-blur">
        <Button variant="ghost" onClick={() => router.push("/studio/catalog")}>
          {t("upload.cancel")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setError("");
            alert(t("upload.draftSaved"));
          }}
        >
          {t("upload.saveDraft")}
        </Button>
        <Button disabled={!canPublish} onClick={() => void publish()}>
          {busy ? t("upload.publishing") : t("upload.publish")}
        </Button>
      </div>
    </div>
  );
}
