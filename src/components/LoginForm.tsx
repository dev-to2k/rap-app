"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field, Input, Spinner } from "@/kit";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("buyer@rap.app");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Đăng nhập thất bại");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <Card className="space-y-3 p-6">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Mật khẩu">
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
              <Spinner /> Đang vào…
            </span>
          ) : (
            "Đăng nhập"
          )}
        </Button>
      </Card>
    </form>
  );
}
