"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Messages } from "./messages";
import { createT, type Translator } from "./translate";

const I18nContext = createContext<{ locale: Locale; t: Translator } | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: createT(messages) }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): Translator {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT requires I18nProvider");
  return ctx.t;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale requires I18nProvider");
  return ctx.locale;
}
