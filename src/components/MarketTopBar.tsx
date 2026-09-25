"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass, Icon, Input } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { LocaleSwitch } from "./LocaleSwitch";

type User = { name: string; role: string } | null;

export function MarketTopBar({ user }: { user: User }) {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2.5">
        <Link href="/" className="inline-flex shrink-0 items-center gap-1.5 font-display text-lg font-bold tracking-tight text-accent">
          <Icon name="flame" size="md" />
          Rap App
        </Link>
        <form className="hidden min-w-0 flex-1 md:block" onSubmit={onSearch}>
          <div className="relative">
            <Icon name="search" size="sm" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </form>
        <nav className="hidden items-center gap-1 text-sm text-muted lg:flex">
          <Link href="/" className="rounded-xl px-2.5 py-1.5 hover:bg-white/5 hover:text-foreground">
            {t("shell.explore")}
          </Link>
          <Link href="/charts" className="rounded-xl px-2.5 py-1.5 hover:bg-white/5 hover:text-foreground">
            {t("shell.charts")}
          </Link>
          {user ? (
            <Link href="/library" className="rounded-xl px-2.5 py-1.5 hover:bg-white/5 hover:text-foreground">
              {t("shell.library")}
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitch />
          <Link href="/studio/upload" className={buttonClass({ variant: "secondary", size: "sm", className: "hidden sm:inline-flex" })}>
            <Icon name="upload" size="sm" />
            {t("shell.sell")}
          </Link>
          <Link href="/favorites" className="hidden rounded-xl p-2 text-muted hover:bg-white/5 hover:text-foreground sm:inline-flex" aria-label={t("shell.likes")}>
            <Icon name="heart" size="sm" />
          </Link>
          <span className="hidden rounded-xl p-2 text-muted sm:inline-flex" aria-label={t("shell.cart")}>
            <Icon name="cart" size="sm" />
          </span>
          {user ? (
            <Link
              href={user.role === "producer" ? "/studio" : "/library"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold"
              title={user.name}
            >
              {user.name.slice(0, 1)}
            </Link>
          ) : (
            <Link href="/login" className={buttonClass({ size: "sm" })}>
              <Icon name="login" size="sm" />
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>
      {/* Hàng tìm kiếm riêng cho mobile, tái dùng state q */}
      <div className="px-4 pb-2.5 md:hidden">
        <form onSubmit={onSearch}>
          <div className="relative">
            <Icon name="search" size="sm" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              aria-label={t("home.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
