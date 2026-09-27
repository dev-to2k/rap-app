"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type NowPlaying = {
  id: string;
  title: string;
  producer: string;
  coverUrl: string | null;
  href: string;
  audioSrc: string;
};

type AudioPlaybackContextValue = {
  nowPlaying: NowPlaying | null;
  playing: boolean;
  play: (track: NowPlaying) => void;
  pause: () => void;
  toggle: (track: NowPlaying) => void;
};

const AudioPlaybackContext = createContext<AudioPlaybackContextValue | null>(null);

/**
 * Single shared preview player. Audio element is created only on first play
 * (preload=none) so the home catalog never fetches preview bytes up front.
 */
export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [playing, setPlaying] = useState(false);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = "none";
      el.addEventListener("ended", () => setPlaying(false));
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (!el) return;
      el.pause();
      el.removeAttribute("src");
      el.load();
      audioRef.current = null;
    };
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const play = useCallback(
    (track: NowPlaying) => {
      if (!track.audioSrc) return;
      const el = getAudio();
      if (nowPlaying?.id !== track.id) {
        el.src = track.audioSrc;
        setNowPlaying(track);
      }
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    },
    [getAudio, nowPlaying?.id],
  );

  const toggle = useCallback(
    (track: NowPlaying) => {
      if (nowPlaying?.id === track.id && playing) pause();
      else play(track);
    },
    [nowPlaying?.id, playing, pause, play],
  );

  const value = useMemo(
    () => ({ nowPlaying, playing, play, pause, toggle }),
    [nowPlaying, playing, play, pause, toggle],
  );

  return <AudioPlaybackContext.Provider value={value}>{children}</AudioPlaybackContext.Provider>;
}

export function useAudioPlayback() {
  const ctx = useContext(AudioPlaybackContext);
  if (!ctx) throw new Error("useAudioPlayback requires AudioPlaybackProvider");
  return ctx;
}
