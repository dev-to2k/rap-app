"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Props = {
  id: string;
  title: string;
  coverUrl: string | null;
  producer: string;
  bpm: number;
  musicalKey: string;
  price: number;
  priceLabel: string;
  audioSrc: string;
  sampleFlag: string;
};

export function BeatRow(props: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
      <button
        type="button"
        onClick={toggle}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800"
        aria-label={playing ? "Pause" : "Play"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={props.coverUrl || "/covers/beat1.svg"}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white text-lg">
          {playing ? "❚❚" : "▶"}
        </span>
      </button>
      <audio
        ref={audioRef}
        src={props.audioSrc}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <Link href={`/beats/${props.id}`} className="min-w-0 flex-1">
        <div className="truncate font-medium text-white">{props.title}</div>
        <div className="truncate text-xs text-zinc-400">
          {props.producer} · {props.bpm} BPM · {props.musicalKey}
          {props.sampleFlag === "uncleared" && (
            <span className="ml-1 text-amber-400">· uncleared</span>
          )}
        </div>
      </Link>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-violet-300">{props.priceLabel}</div>
        <div className="text-[10px] text-zinc-500">Lease</div>
      </div>
    </li>
  );
}
