"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass, Button, Icon, Truncate, type IconName } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

type User = { name: string; role: string } | null;

function useNavLinks(): { href: string; label: string; icon: IconName }[] {
  const t = useT();
  return [
    { href: "/", label: t("nav.beats"), icon: "waveform" },
    { href: "/waitlist", label: t("nav.waitlist"), icon: "flame" },
    { href: "/upload", label: t("nav.upload"), icon: "upload" },
    { href: "/library", label: t("nav.library"), icon: "library" },
    { href: "/support", label: t("nav.support"), icon: "support" },
  ];
}

export function NavLinks() {
  const links = useNavLinks();
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
        >
          <Icon name={l.icon} size="sm" />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function NavAuth({ user }: { user: User }) {
  const t = useT();
  if (user) {
    return (
      <div className="hidden items-center gap-2 text-sm text-muted lg:flex">
        <Truncate className="max-w-[9rem]">{user.name}</Truncate>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-white/5 hover:text-foreground"
          >
            <Icon name="logout" size="sm" />
            {t("nav.logout")}
          </button>
        </form>
      </div>
    );
  }
  return (
    <Link href="/login" className={buttonClass({ size: "sm", className: "hidden lg:inline-flex" })}>
      <Icon name="login" size="sm" />
      {t("nav.login")}
    </Link>
  );
}

export function MobileNav({ user }: { user: User }) {
  const t = useT();
  const links = useNavLinks();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-label={t("common.menu")}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? "close" : "menu"} size="sm" />
      </Button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <Icon name={l.icon} size="sm" />
                {l.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              {user ? (
                <form action="/api/auth/logout" method="post">
                  <Button variant="secondary" size="sm" type="submit" className="w-full">
                    <Icon name="logout" size="sm" />
                    {t("nav.logout")}
                  </Button>
                </form>
              ) : (
                <Link href="/login" className={buttonClass({ size: "sm", className: "w-full" })} onClick={() => setOpen(false)}>
                  <Icon name="login" size="sm" />
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
