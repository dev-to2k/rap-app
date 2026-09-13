"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field, Icon, Input, Spinner } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

export function LoginForm({ next }: { next: string }) {
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("buyer@rap.app");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(t("login.dbError"));
        return;
      }
      if (!res.ok) {
        setError(data.error || t("login.failed"));
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card className="space-y-3 p-6">
        <Field label={t("login.email")}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label={t("login.password")}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> {t("login.submitting")}
            </span>
          ) : (
            <>
              <Icon name="login" size="sm" />
              {t("login.submit")}
            </>
          )}
        </Button>
      </Card>
    </form>
  );
}
