"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, cn, type IconName } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

export function MobileTabBar({ isProducer }: { isProducer: boolean }) {
  const t = useT();
  const path = usePathname();
  const tabs: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: t("shell.explore"), icon: "waveform" },
    { href: "/charts", label: t("shell.charts"), icon: "chart" },
    { href: "/library", label: t("shell.library"), icon: "library" },
    isProducer
      ? { href: "/studio", label: t("shell.studio"), icon: "dashboard" }
      : { href: "/favorites", label: t("shell.likes"), icon: "heart" },
    { href: "/login", label: t("shell.me"), icon: "user" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = path === tab.href || (tab.href !== "/" && path.startsWith(tab.href));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon name={tab.icon} size="sm" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
