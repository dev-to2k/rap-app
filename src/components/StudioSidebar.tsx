"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Icon, type IconName } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

// Danh mục dùng chung cho sidebar desktop và nav ngang mobile
export const STUDIO_ITEMS: { href: string; key: string; icon: IconName }[] = [
  { href: "/studio", key: "studio.overview", icon: "dashboard" },
  { href: "/studio/catalog", key: "studio.catalog", icon: "disc" },
  { href: "/studio/upload", key: "studio.upload", icon: "upload" },
  { href: "/studio/orders", key: "studio.orders", icon: "ticket" },
  { href: "/studio/wallet", key: "studio.wallet", icon: "wallet" },
  { href: "/", key: "studio.storefront", icon: "store" },
];

export function StudioSidebar() {
  const t = useT();
  const path = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-surface/40 lg:block">
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent">
          <Icon name="flame" size="sm" />
          Rap App
        </Link>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{t("shell.studio")}</p>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {STUDIO_ITEMS.map((item) => {
          const active = item.href === "/studio" ? path === "/studio" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                active ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon name={item.icon} size="sm" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
