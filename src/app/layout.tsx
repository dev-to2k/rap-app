import type { Metadata } from "next";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import "./globals.css";
import { AudioPlaybackProvider } from "@/components/AudioPlaybackProvider";
import { AppShell } from "@/components/AppShell";
import { getLocale, getT } from "@/i18n/get-locale";
import { dictionaries } from "@/i18n/messages";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getSession } from "@/lib/auth";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["600", "700", "800"],
  subsets: ["vietnamese", "latin"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500"],
  subsets: ["vietnamese", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = getLocale();
  const user = await getSession();
  return (
    <html lang={locale}>
      <body
        className={`${beVietnamPro.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <I18nProvider locale={locale} messages={dictionaries[locale]}>
          <AudioPlaybackProvider>
            <AppShell user={user ? { name: user.name, role: user.role } : null}>{children}</AppShell>
          </AudioPlaybackProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
