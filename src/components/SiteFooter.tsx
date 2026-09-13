"use client";

import Link from "next/link";
import { Container, Icon } from "@/kit";
import { useT } from "@/i18n/I18nProvider";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="mt-auto hidden border-t border-border bg-surface/60 lg:block">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="inline-flex items-center gap-1.5 font-bold text-accent">
            <Icon name="flame" size="sm" />
            Rap App
          </p>
          <p className="mt-2 max-w-xs text-sm text-muted">{t("footer.blurb")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("footer.buyers")}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/" className="text-foreground/80 hover:text-accent">
                {t("footer.browse")}
              </Link>
            </li>
            <li>
              <Link href="/charts" className="text-foreground/80 hover:text-accent">
                {t("shell.charts")}
              </Link>
            </li>
            <li>
              <Link href="/support" className="text-foreground/80 hover:text-accent">
                {t("footer.support")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("footer.sellers")}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/upload" className="text-foreground/80 hover:text-accent">
                {t("footer.upload")}
              </Link>
            </li>
            <li>
              <Link href="/studio" className="text-foreground/80 hover:text-accent">
                {t("shell.studio")}
              </Link>
            </li>
          </ul>
        </div>
        <p className="text-xs text-muted sm:col-span-2 lg:col-span-1 lg:self-end">{t("footer.copy")}</p>
      </Container>
    </footer>
  );
}
