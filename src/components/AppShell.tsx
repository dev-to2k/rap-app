"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MarketTopBar } from "./MarketTopBar";
import { MobileTabBar } from "./MobileTabBar";
import { MiniPlayer } from "./MiniPlayer";
import { StudioSidebar } from "./StudioSidebar";
import { SiteFooter } from "./SiteFooter";
import { LocaleSwitch } from "./LocaleSwitch";
import Link from "next/link";
import { Icon } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

type User = { name: string; role: string } | null;

export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const path = usePathname();
  const studio =
    path.startsWith("/studio") || path.startsWith("/producer") || path === "/upload";
  const t = useT();

  if (studio) {
    return (
      <div className="flex min-h-screen">
        <StudioSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-2 lg:hidden">
            <Link href="/studio" className="inline-flex items-center gap-1 font-bold text-accent">
              <Icon name="flame" size="sm" />
              {t("shell.studio")}
            </Link>
            <div className="flex items-center gap-2">
              <LocaleSwitch />
              <Link href="/" className="text-xs text-muted">
                {t("shell.explore")}
              </Link>
            </div>
          </header>
          <div className="flex-1 pb-24">{children}</div>
        </div>
        <MiniPlayer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketTopBar user={user} />
      <div className="flex-1 pb-28 lg:pb-20">{children}</div>
      <SiteFooter />
      <MiniPlayer />
      <MobileTabBar isProducer={user?.role === "producer"} />
    </div>
  );
}
