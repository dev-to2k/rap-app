import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AudioPlaybackProvider } from "@/components/AudioPlaybackProvider";
import { AppShell } from "@/components/AppShell";
import { getLocale, getT } from "@/i18n/get-locale";
import { dictionaries } from "@/i18n/messages";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getSession } from "@/lib/auth";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <I18nProvider locale={locale} messages={dictionaries[locale]}>
          <AudioPlaybackProvider>
            <AppShell user={user ? { name: user.name, role: user.role } : null}>{children}</AppShell>
          </AudioPlaybackProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
