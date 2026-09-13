"use client";

import Link from "next/link";
import { Badge, Card, CoverArt, PlayButton, Price } from "@/kit";
import { usePreviewAudio } from "./AudioPlaybackProvider";

type Props = {
  id: string;
  title: string;
  coverUrl: string | null;
  producer: string;
  bpm: number;
  musicalKey: string;
  price: number;
  audioUrl: string;
  sampleFlag: string;
};

export function BeatCard(props: Props) {
  const audioSrc = props.audioUrl
    ? `/api/preview?path=${encodeURIComponent(props.audioUrl)}`
    : "";
  const { audioRef, playing, toggle } = usePreviewAudio(props.id, audioSrc);

  return (
    <li>
      <Card className="flex items-center gap-3 p-3 transition hover:border-accent/50">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          <CoverArt
            src={props.coverUrl || "/covers/beat1.svg"}
            className="h-full w-full"
          />
          <PlayButton playing={playing} onClick={toggle} overlay />
        </div>
        <audio ref={audioRef} src={audioSrc || undefined} preload="none" />
        <Link href={`/beats/${props.id}`} className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">{props.title}</div>
          <div className="truncate text-xs text-muted">
            {props.producer} · {props.bpm} BPM · {props.musicalKey}
          </div>
        </Link>
        <div className="shrink-0 text-right">
          <Price amount={props.price} className="text-sm" />
          <div className="text-[10px] text-muted">Lease</div>
          {props.sampleFlag === "uncleared" ? (
            <Badge variant="warning" className="mt-1">
              uncleared
            </Badge>
          ) : null}
        </div>
      </Card>
    </li>
  );
}
