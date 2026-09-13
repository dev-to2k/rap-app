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

type AudioPlaybackContextValue = {
  register: (id: string, el: HTMLAudioElement) => void;
  unregister: (id: string) => void;
  play: (id: string) => void;
  pause: (id: string) => void;
  playingId: string | null;
};

const AudioPlaybackContext = createContext<AudioPlaybackContextValue | null>(null);

export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const map = useRef(new Map<string, HTMLAudioElement>());
  const [playingId, setPlayingId] = useState<string | null>(null);

  const register = useCallback((id: string, el: HTMLAudioElement) => {
    map.current.set(id, el);
  }, []);

  const unregister = useCallback((id: string) => {
    const el = map.current.get(id);
    if (el) el.pause();
    map.current.delete(id);
    setPlayingId((cur) => (cur === id ? null : cur));
  }, []);

  const pause = useCallback((id: string) => {
    map.current.get(id)?.pause();
    setPlayingId((cur) => (cur === id ? null : cur));
  }, []);

  const play = useCallback((id: string) => {
    map.current.forEach((el, key) => {
      if (key !== id) el.pause();
    });
    const el = map.current.get(id);
    if (!el || !el.src) return;
    void el
      .play()
      .then(() => setPlayingId(id))
      .catch(() => setPlayingId(null));
  }, []);

  const value = useMemo(
    () => ({ register, unregister, play, pause, playingId }),
    [register, unregister, play, pause, playingId],
  );

  return <AudioPlaybackContext.Provider value={value}>{children}</AudioPlaybackContext.Provider>;
}

export function useAudioPlayback() {
  const ctx = useContext(AudioPlaybackContext);
  if (!ctx) throw new Error("useAudioPlayback requires AudioPlaybackProvider");
  return ctx;
}

export function usePreviewAudio(id: string, src: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { register, unregister, play, pause, playingId } = useAudioPlayback();

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => pause(id);
    el.addEventListener("ended", onEnded);
    register(id, el);
    return () => {
      el.removeEventListener("ended", onEnded);
      unregister(id);
    };
  }, [id, register, unregister, pause]);

  const playing = playingId === id;

  return {
    audioRef,
    playing,
    toggle: () => {
      if (!src) return;
      if (playing) pause(id);
      else play(id);
    },
  };
}
