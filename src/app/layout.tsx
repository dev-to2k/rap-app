import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { AudioPlaybackProvider } from "@/components/AudioPlaybackProvider";
import { Container } from "@/kit";

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

export const metadata: Metadata = {
  title: "Rap App — Beat Marketplace VN",
  description: "Chợ beat Việt Nam: Lease MP3, WAV+stems, Exclusive",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AudioPlaybackProvider>
          <Nav />
          <main>
            <Container className="py-8">{children}</Container>
          </main>
        </AudioPlaybackProvider>
      </body>
    </html>
  );
}
