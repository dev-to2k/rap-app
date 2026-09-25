"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, Field, Icon, Input, Radio, Spinner } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

type SignupRole = "buyer" | "producer";

export function SignupForm({ next }: { next: string }) {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("buyer");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, password, role }),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(t("signup.dbError"));
        return;
      }
      if (!res.ok) {
        setError(data.error || t("signup.failed"));
        return;
      }
      // Hard navigation so rap_session cookie is sent on the next document request
      window.location.assign(next);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card className="space-y-3 p-6">
        <Field label={t("signup.name")}>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            maxLength={80}
          />
        </Field>
        <Field label={t("signup.email")}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label={t("signup.password")} hint={t("signup.passwordHint")}>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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
        <Field label={t("signup.role")}>
          <div className="flex flex-wrap gap-4 pt-1">
            <Radio
              name="role"
              value="buyer"
              checked={role === "buyer"}
              onChange={() => setRole("buyer")}
            >
              {t("signup.roleBuyer")}
            </Radio>
            <Radio
              name="role"
              value="producer"
              checked={role === "producer"}
              onChange={() => setRole("producer")}
            >
              {t("signup.roleProducer")}
            </Radio>
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
              <Spinner /> {t("signup.submitting")}
            </span>
          ) : (
            <>
              <Icon name="login" size="sm" />
              {t("signup.submit")}
            </>
          )}
        </Button>
        <p className="text-center text-sm text-muted">
          {t("signup.haveAccount")}{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-accent hover:underline"
          >
            {t("nav.login")}
          </Link>
        </p>
      </Card>
    </form>
  );
}
