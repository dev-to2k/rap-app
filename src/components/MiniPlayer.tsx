"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClass, CoverArt, Icon, PlayButton, Truncate, cn } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { useAudioPlayback } from "./AudioPlaybackProvider";

export function MiniPlayer() {
  const t = useT();
  const path = usePathname();
  const studio = path.startsWith("/studio");
  const { nowPlaying, playing, pause, play } = useAudioPlayback();
  if (!nowPlaying) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur",
        !studio && "bottom-14 lg:bottom-0",
      )}
    >
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2">
        <PlayButton
          playing={playing}
          size="sm"
          onClick={() => (playing ? pause() : play(nowPlaying))}
          label={playing ? t("common.pause") : t("common.play")}
        />
        <CoverArt src={nowPlaying.coverUrl || "/covers/beat1.svg"} className="h-10 w-10 rounded-md" />
        <Link href={nowPlaying.href} className="min-w-0 flex-1">
          <Truncate as="p" className="text-sm font-medium">{nowPlaying.title}</Truncate>
          <Truncate as="p" className="text-xs text-muted">{nowPlaying.producer}</Truncate>
        </Link>
        <Link href={nowPlaying.href} className={buttonClass({ size: "sm" })}>
          <Icon name="cart" size="sm" />
          {t("shell.buy")}
        </Link>
      </div>
    </div>
  );
}
