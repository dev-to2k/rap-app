"use client";

import {
  createContext,
  useCallback,
  useContext,
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

export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [playing, setPlaying] = useState(false);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const play = useCallback((track: NowPlaying) => {
    const el = audioRef.current;
    if (!el || !track.audioSrc) return;
    if (nowPlaying?.id !== track.id) {
      el.src = track.audioSrc;
      setNowPlaying(track);
    }
    void el
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [nowPlaying?.id]);

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

  return (
    <AudioPlaybackContext.Provider value={value}>
      <audio ref={audioRef} preload="none" onEnded={() => setPlaying(false)} />
      {children}
    </AudioPlaybackContext.Provider>
  );
}

export function useAudioPlayback() {
  const ctx = useContext(AudioPlaybackContext);
  if (!ctx) throw new Error("useAudioPlayback requires AudioPlaybackProvider");
  return ctx;
}
