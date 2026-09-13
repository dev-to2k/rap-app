"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, Button, Chip, Field, Input, PageHeader, Spinner } from "@/kit";

function WaitlistForm() {
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
      setError(data.error || "Không lưu được");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <Alert variant="success">
          <p className="text-base font-bold text-foreground">Đã nhận early access</p>
          <p className="mt-1 text-sm text-muted">Cảm ơn bạn — mình sẽ liên hệ qua email khi mở thêm slot.</p>
        </Alert>
        <Link href="/" className="inline-block text-sm text-accent hover:underline">
          ← Về chợ beat
        </Link>
        <p className="pt-4 text-left text-[11px] leading-relaxed text-muted">
          Rap App chỉ thu email, IG/handle, vai trò (producer/rapper), link catalog (tuỳ chọn) và mã nguồn invite (`src`/`utm`) để early access và đo kênh. Không lấy mật khẩu, SĐT hay thẻ. Không bán dữ liệu. Muốn xóa khỏi waitlist: liên hệ Support kèm email đã đăng ký.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeader
        title="Xin early access"
        description="Chợ beat VN-first — lease / WAV+stems / exclusive, checkout VND. Không cần thanh toán để vào waitlist."
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email *">
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="IG / handle">
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle" />
        </Field>
        <fieldset className="space-y-2 text-sm">
          <legend className="text-muted">Bạn là</legend>
          <div className="flex gap-3">
            {(["producer", "rapper"] as const).map((r) => (
              <Chip key={r} selected={role === r} className="flex-1" onClick={() => setRole(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field label="Catalog URL (tuỳ chọn)">
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
              <Spinner /> Đang gửi…
            </span>
          ) : (
            "Xin early access"
          )}
        </Button>
      </form>

      <p className="text-[11px] leading-relaxed text-muted">
        Rap App chỉ thu email, IG/handle, vai trò (producer/rapper), link catalog (tuỳ chọn) và mã nguồn invite (`src`/`utm`) để early access và đo kênh. Không lấy mật khẩu, SĐT hay thẻ. Không bán dữ liệu. Muốn xóa khỏi waitlist: liên hệ Support kèm email đã đăng ký.
      </p>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
      <WaitlistForm />
    </Suspense>
  );
}
