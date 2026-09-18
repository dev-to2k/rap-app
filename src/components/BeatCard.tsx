"use client";

import Link from "next/link";
import { Badge, Card, CoverArt, PlayButton, Price, Truncate } from "@/kit";
import { useT } from "@/i18n/I18nProvider";
import { tagForTitle } from "@/lib/beat-tags";
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

/** Cover-first catalog card. */
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
    <li className="fade-in">
      <Card className="overflow-hidden p-0 transition-fade hover:border-accent/40">
        <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-surface-2">
          <CoverArt src={props.coverUrl || "/covers/beat1.svg"} alt="" className="h-full w-full" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <PlayButton
              playing={isThis}
              size="md"
              className="tap-target"
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
          {props.sampleFlag === "uncleared" ? (
            <Badge variant="warning" className="absolute left-2 top-2">
              uncleared
            </Badge>
          ) : (
            <Badge variant="accent" className="absolute left-2 top-2">
              {t("common.lease")}
            </Badge>
          )}
        </div>
        <Link href={`/beats/${props.id}`} className="block space-y-1.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <Truncate
              lines={2}
              className="min-w-[7rem] flex-1 font-display text-base font-semibold leading-5 text-foreground sm:text-lg sm:leading-6"
            >
              {props.title}
            </Truncate>
            <Badge variant="default" className="shrink-0 capitalize">
              {tagLabel}
            </Badge>
          </div>
          <Truncate as="div" className="text-xs leading-4 text-muted">
            {props.producer} · {props.bpm} BPM · {props.musicalKey}
          </Truncate>
          <div className="flex items-end justify-between pt-1">
            <span className="text-[12px] leading-4 text-muted">{t("common.from")}</span>
            <Price amount={props.price} className="text-[16px] font-medium leading-5" />
          </div>
        </Link>
      </Card>
    </li>
  );
}
