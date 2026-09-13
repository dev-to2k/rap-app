"use client";

import { CoverArt, PlayButton } from "@/kit";
import { usePreviewAudio } from "./AudioPlaybackProvider";

export function BeatPlayer({
  id,
  coverUrl,
  audioUrl,
}: {
  id: string;
  coverUrl: string | null;
  audioUrl: string;
}) {
  const audioSrc = audioUrl ? `/api/preview?path=${encodeURIComponent(audioUrl)}` : "";
  const { audioRef, playing, toggle } = usePreviewAudio(`detail-${id}`, audioSrc);

  return (
    <div className="relative mb-4 aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-surface-2">
      <CoverArt src={coverUrl || "/covers/beat1.svg"} className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
        <PlayButton playing={playing} onClick={toggle} className="h-16 w-16 text-2xl" />
      </div>
      <audio ref={audioRef} src={audioSrc || undefined} preload="none" />
    </div>
  );
}
