"use client";

import { useEffect, useRef, useState } from "react";

type Meta = {
  voice: string;
  voiceLabel: string;
  speed: number;
  textPreview: string;
  createdAt: string;
};

type Props = {
  audioUrl: string;
  meta: Meta;
  id: string;
};

export function SharePlayer({ audioUrl, meta, id }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setElapsed(a.currentTime);
    const onDur = () => setDuration(a.duration);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `phono-${meta.voice}-${id}.mp3`;
    a.click();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tweet = () => {
    const text = `just made this with PHONO, a free TTS that runs in your browser. no more Eleven Labs. no more subscriptions. the voice I used was ${meta.voiceLabel.toUpperCase()}

made by @0xEvinho`;
    const url = window.location.href;
    const params = new URLSearchParams({ text, url });
    window.open(`https://twitter.com/intent/tweet?${params}`, "_blank", "noopener");
  };

  const progress = duration ? (elapsed / duration) * 100 : 0;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="border-b-2 border-ink px-4 py-4 md:px-8 xl:px-12">
        <div className="flex items-center justify-between">
          <a href="/phono" className="font-display text-2xl leading-none tracking-wider md:text-3xl">
            PHONO<span className="text-signal">.</span>
          </a>
          <a
            href="/phono"
            className="border-2 border-ink bg-ink px-4 py-2 text-xs font-bold uppercase text-paper hover:bg-signal hover:border-signal hover:text-ink"
          >
            MAKE YOUR OWN →
          </a>
        </div>
      </div>

      <div className="px-4 py-12 md:px-8 md:py-20 xl:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 border-2 border-ink px-3 py-1 text-[11px] uppercase">
            <span className="h-2 w-2 bg-signal" aria-hidden />
            shared clip / {id}
          </div>

          <h1 className="font-display text-5xl leading-[0.9] md:text-7xl xl:text-8xl">
            SPOKEN BY{" "}
            <span className="text-signal">{meta.voiceLabel}</span>
          </h1>

          <div className="mt-6 border-2 border-ink bg-dust/40 p-5 md:p-6">
            <p className="text-sm leading-relaxed md:text-base">{meta.textPreview}</p>
          </div>

          <div className="mt-6 border-2 border-ink bg-ink p-5 text-paper md:p-6">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase text-fog">
              <span>[ AUDIO / {meta.voice} · {meta.speed}x ]</span>
              <span>{formatTime(elapsed)} / {formatTime(duration)}</span>
            </div>

            <button
              type="button"
              onClick={toggle}
              className="w-full border-2 border-signal bg-signal py-6 font-display text-4xl leading-none tracking-wider text-ink hover:bg-paper hover:text-signal md:text-5xl"
            >
              {playing ? "■ PAUSE" : "▶ PLAY"}
            </button>

            <div className="mt-4 h-1.5 w-full bg-smoke">
              <div
                className="h-full bg-signal"
                style={{ width: `${progress}%`, transition: "width 100ms linear" }}
              />
            </div>

            <audio ref={audioRef} src={audioUrl} preload="auto" />

            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] uppercase">
              <button
                type="button"
                onClick={download}
                className="border-2 border-paper py-3 hover:bg-paper hover:text-ink"
              >
                ↓ MP3
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="border-2 border-paper py-3 hover:bg-paper hover:text-ink"
              >
                {copied ? "✓ COPIED" : "⌘ COPY LINK"}
              </button>
              <button
                type="button"
                onClick={tweet}
                className="border-2 border-paper py-3 hover:bg-paper hover:text-ink"
              >
                𝕏 TWEET
              </button>
            </div>
          </div>

          <div className="mt-10 border-2 border-ink bg-paper p-5 md:p-6">
            <div className="text-[11px] uppercase text-smoke">[ MADE WITH ]</div>
            <div className="mt-2 font-display text-3xl leading-none md:text-4xl">
              PHONO<span className="text-signal">.</span>
            </div>
            <p className="mt-3 text-xs uppercase leading-relaxed text-smoke md:text-sm">
              Free text-to-speech that runs in your browser. No signup.
              No upload. No paywall.
            </p>
            <a
              href="/phono"
              className="mt-4 inline-block border-2 border-ink bg-ink px-5 py-3 text-xs font-bold uppercase text-paper hover:bg-signal hover:border-signal hover:text-ink"
            >
              &gt; MAKE A CLIP
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatTime(s: number): string {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
