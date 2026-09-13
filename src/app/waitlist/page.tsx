"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, Button, Chip, Field, Icon, Input, PageHeader, Spinner } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

function WaitlistForm() {
  const t = useT();
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
      setError(data.error || t("waitlist.saveError"));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <Alert variant="success">
          <p className="text-base font-bold text-foreground">{t("waitlist.doneTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("waitlist.doneBody")}</p>
        </Alert>
        <Link href="/" className="inline-block text-sm text-accent hover:underline">
          {t("waitlist.backHome")}
        </Link>
        <p className="pt-4 text-left text-[11px] leading-relaxed text-muted">{t("waitlist.privacy")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <PageHeader title={t("waitlist.title")} description={t("waitlist.description")} icon="flame" />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("waitlist.email")}>
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t("waitlist.handle")}>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle" />
        </Field>
        <fieldset className="space-y-2 text-sm">
          <legend className="text-xs font-medium uppercase tracking-wider text-muted">{t("waitlist.youAre")}</legend>
          <div className="flex gap-3">
            {(["producer", "rapper"] as const).map((r) => (
              <Chip key={r} selected={role === r} className="flex-1" onClick={() => setRole(r)}>
                {t(`waitlist.${r}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field label={t("waitlist.catalog")}>
          <Input
            type="url"
            value={catalogUrl}
            onChange={(e) => setCatalogUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> {t("waitlist.sending")}
            </span>
          ) : (
            <>
              <Icon name="sparkles" size="sm" />
              {t("waitlist.submit")}
            </>
          )}
        </Button>
      </form>

      <p className="text-[11px] leading-relaxed text-muted">{t("waitlist.privacy")}</p>
    </div>
  );
}

export default function WaitlistPage() {
  const t = useT();
  return (
    <Suspense fallback={<p className="text-muted">{t("common.loading")}</p>}>
      <WaitlistForm />
    </Suspense>
  );
}
