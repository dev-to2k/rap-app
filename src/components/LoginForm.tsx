"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, Field, Icon, Input, Spinner } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

// Chỉ prefill tài khoản demo khi chạy development
const isDev = process.env.NODE_ENV === "development";

export function LoginForm({ next }: { next: string }) {
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState(isDev ? "buyer@rap.app" : "");
  const [password, setPassword] = useState(isDev ? "password123" : "");
  const [showPw, setShowPw] = useState(false);
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
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-pressed={showPw}
              className="tap-target absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 text-xs text-muted hover:text-foreground"
            >
              {showPw ? t("login.hidePassword") : t("login.showPassword")}
            </button>
          </div>
        </Field>
        {error ? (
          <Alert variant="danger" role="alert">
            {error}
          </Alert>
        ) : null}
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
