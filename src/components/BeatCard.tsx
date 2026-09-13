"use client";

import Link from "next/link";
import { Badge, Card, CoverArt, Icon, PlayButton, Price, Truncate, Waveform } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { mockPlays, tagForTitle } from "@/lib/beat-tags";
import { useAudioPlayback } from "./AudioPlaybackProvider";

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
  const t = useT();
  const { toggle, nowPlaying, playing } = useAudioPlayback();
  const isThis = nowPlaying?.id === props.id && playing;
  const tag = tagForTitle(props.title);
  const tagLabel = t(`home.tag${tag[0].toUpperCase()}${tag.slice(1)}`);

  return (
    <li>
      <Card className="flex items-center gap-4 p-3 transition hover:border-accent/40">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <CoverArt src={props.coverUrl || "/covers/beat1.svg"} className="h-full w-full" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <PlayButton
              playing={isThis}
              size="sm"
              onClick={() =>
                toggle({
                  id: props.id,
                  title: props.title,
                  producer: props.producer,
                  coverUrl: props.coverUrl,
                  href: `/beats/${props.id}`,
                  audioSrc,
                })
              }
              label={isThis ? t("common.pause") : t("common.play")}
            />
          </div>
        </div>
        <Link href={`/beats/${props.id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Truncate className="font-medium text-foreground">{props.title}</Truncate>
            <Badge variant="default">{tagLabel}</Badge>
            {props.sampleFlag === "uncleared" ? <Badge variant="warning">uncleared</Badge> : null}
          </div>
          <Truncate as="div" className="mt-1 text-xs text-muted">
            {props.producer} · {props.bpm} BPM · {props.musicalKey}
          </Truncate>
          <Waveform active={isThis} className="mt-2" />
        </Link>
        <div className="hidden shrink-0 text-xs text-muted sm:block">{t("home.plays", { n: mockPlays(props.id) })}</div>
        <button type="button" className="hidden text-muted hover:text-accent sm:block" aria-label="like">
          <Icon name="heart" size="sm" />
        </button>
        <div className="shrink-0 text-right">
          <Price amount={props.price} className="text-sm" />
          <div className="text-[10px] text-muted">{t("common.lease")}</div>
        </div>
      </Card>
    </li>
  );
}
