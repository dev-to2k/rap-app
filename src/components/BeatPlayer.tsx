"use client";

import { CoverArt, PlayButton } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { useAudioPlayback } from "./AudioPlaybackProvider";

export function BeatPlayer({
  id,
  title,
  producer,
  coverUrl,
  audioUrl,
}: {
  id: string;
  title: string;
  producer: string;
  coverUrl: string | null;
  audioUrl: string;
}) {
  const t = useT();
  const audioSrc = audioUrl ? `/api/preview?path=${encodeURIComponent(audioUrl)}` : "";
  const { toggle, nowPlaying, playing } = useAudioPlayback();
  const isThis = nowPlaying?.id === id && playing;

  return (
    <div className="relative mb-4 aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-surface-2">
      <CoverArt src={coverUrl || "/covers/beat1.svg"} className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
        <PlayButton
          playing={isThis}
          onClick={() =>
            toggle({
              id,
              title,
              producer,
              coverUrl,
              href: `/beats/${id}`,
              audioSrc,
            })
          }
          className="h-16 w-16 text-2xl"
          label={isThis ? t("common.pause") : t("common.play")}
        />
      </div>
    </div>
  );
}
