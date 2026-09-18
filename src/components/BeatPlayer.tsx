"use client";

import { CoverArt, PlayButton, Waveform } from "@/kit";
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

  function onPlay() {
    toggle({
      id,
      title,
      producer,
      coverUrl,
      href: `/beats/${id}`,
      audioSrc,
    });
  }

  return (
    <div className="relative mb-5 aspect-square w-full w-full overflow-hidden rounded-lg bg-surface-2">
      <CoverArt src={coverUrl || "/covers/beat1.svg"} className="h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent p-4 pt-20">
        <div className="flex items-center gap-3">
          <PlayButton
            playing={isThis}
            onClick={onPlay}
            size="lg"
            className="tap-target"
            label={isThis ? t("common.pause") : t("common.play")}
          />
          <Waveform active={isThis} className="h-8 flex-1" />
        </div>
      </div>
    </div>
  );
}
