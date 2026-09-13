"use client";

import { useRouter } from "next/navigation";
import { LOCALES } from "@/i18n/config";
import { useLocale } from "@/i18n/I18nProvider";
import { cn } from "@/kit";

export function LocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();

  async function setLocale(next: string) {
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center rounded-xl border border-white/10 bg-surface-2 p-0.5 text-xs font-semibold">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => void setLocale(code)}
          className={cn(
            "rounded-[10px] px-2 py-1 uppercase",
            code === locale ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
