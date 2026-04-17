"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTTS, isTTSReady, type ProgressInfo } from "@/lib/tts";
import { concatFloat32 } from "@/lib/wav";
import { encodeMp3 } from "@/lib/mp3";
import { createShareLink, buildTwitterIntent } from "@/lib/share";
import { withBase } from "@/lib/basePath";
import { DEFAULT_VOICE, VOICES, type VoiceId } from "@/lib/voices";
import { VoiceGrid } from "./VoiceGrid";
import { Waveform } from "./Waveform";

type Status = "idle" | "loading" | "generating" | "done" | "error";

const SAMPLE_TEXT =
  "Phono runs entirely in your browser. Your text never touches a server. No signup, no API key, no paywall.";

const MAX_CHARS = 2000;

export function TTSStudio() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [voice, setVoice] = useState<VoiceId>(DEFAULT_VOICE);
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [loadMsg, setLoadMsg] = useState("");
  const [loadPct, setLoadPct] = useState(0);
  const [loadFile, setLoadFile] = useState("");
  const [loadBytes, setLoadBytes] = useState<{ loaded: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [preloading, setPreloading] = useState(false);
  const [ready, setReady] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(24000);
  const preloadStartedRef = useRef(false);

  const charsLeft = MAX_CHARS - text.length;

  const startPreload = useCallback(() => {
    if (preloadStartedRef.current || isTTSReady()) return;
    preloadStartedRef.current = true;
    setPreloading(true);
    getTTS((info: ProgressInfo) => {
      if (typeof info.progress === "number") setLoadPct(info.progress);
      if (info.status === "ready") {
        setReady(true);
        setPreloading(false);
      }
    })
      .then(() => {
        setReady(true);
        setPreloading(false);
      })
      .catch(() => {
        preloadStartedRef.current = false;
        setPreloading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      analyserRef.current?.disconnect();
      ctxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (isTTSReady()) {
      setReady(true);
      return;
    }
    const id = window.setTimeout(startPreload, 2500);
    return () => window.clearTimeout(id);
  }, [startPreload]);

  const handleSpeak = useCallback(async () => {
    if (!text.trim() || status === "loading" || status === "generating") return;
    setError(null);
    setAudioBlob(null);
    setShareState("idle");
    setShareUrl(null);
    setShareError(null);
    chunksRef.current = [];

    try {
      setStatus("loading");
      setLoadMsg("booting model");
      setLoadFile("");
      setLoadBytes(null);
      const tts = await getTTS((info: ProgressInfo) => {
        setLoadMsg(info.status ?? "loading");
        if (typeof info.progress === "number") setLoadPct(info.progress);
        if (info.file || info.name) setLoadFile(info.file ?? info.name ?? "");
        if (typeof info.loaded === "number" && typeof info.total === "number") {
          setLoadBytes({ loaded: info.loaded, total: info.total });
        }
      });
      setReady(true);

      setStatus("generating");
      setLoadPct(0);
      setLoadMsg("synthesizing");
      setLoadFile("");
      setLoadBytes(null);

      const cleanText = text.trim().replace(/\s+/g, " ");
      const sentences = splitSentences(cleanText);
      console.info("[phono] generating", { chars: cleanText.length, sentences: sentences.length, voice, speed });

      const t0 = performance.now();
      let skippedCount = 0;

      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        setLoadMsg(`sentence ${i + 1}/${sentences.length}`);
        const raw = await tts.generate(s, { voice, speed });
        const { mean, nanRatio } = analyseAudio(raw.audio);
        const sec = raw.audio.length / raw.sampling_rate;
        const broken = nanRatio > 0.01 || mean < 0.015;
        console.info(
          `[phono] sentence ${i + 1}/${sentences.length}: ${sec.toFixed(2)}s mean=${mean.toFixed(4)} nan=${(nanRatio * 100).toFixed(0)}% ${broken ? "SKIPPED (voice cannot say this)" : "ok"} · "${s.slice(0, 50)}${s.length > 50 ? "…" : ""}"`
        );
        if (broken) {
          skippedCount++;
          continue;
        }
        sampleRateRef.current = raw.sampling_rate;
        chunksRef.current.push(raw.audio);
      }

      console.info(`[phono] total ${((performance.now() - t0) / 1000).toFixed(1)}s, ${skippedCount} skipped`);

      if (chunksRef.current.length === 0) {
        throw new Error(
          "this voice couldn't say any of the text — try another voice or different wording"
        );
      }

      const full = concatFloat32(chunksRef.current);
      setLoadMsg("encoding mp3");
      const blob = encodeMp3(full, sampleRateRef.current, 128);
      setAudioBlob(blob);

      await playBuffer(full, sampleRateRef.current);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "generation failed");
      setStatus("error");
    }
  }, [text, voice, speed, status]);

  const handleDownload = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phono-${voice}-${Date.now()}.mp3`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReplay = async () => {
    if (!chunksRef.current.length) return;
    await playBuffer(concatFloat32(chunksRef.current), sampleRateRef.current);
  };

  const handleShare = async () => {
    if (!audioBlob || shareState === "uploading") return;
    setShareState("uploading");
    setShareError(null);
    try {
      const voiceMeta = VOICES.find((v) => v.id === voice);
      const result = await createShareLink(audioBlob, {
        voice,
        voiceLabel: voiceMeta?.label ?? voice,
        speed,
        textPreview: text.slice(0, 280),
        createdAt: new Date().toISOString(),
      });
      const absoluteUrl = new URL(withBase(result.url), window.location.origin).toString();
      setShareUrl(absoluteUrl);
      setShareState("done");
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setShareState("error");
      setShareError(e instanceof Error ? e.message : "share failed");
    }
  };

  const handleTweet = () => {
    const voiceMeta = VOICES.find((v) => v.id === voice);
    const url = shareUrl ?? window.location.origin;
    window.open(
      buildTwitterIntent(url, voiceMeta?.label ?? voice),
      "_blank",
      "noopener"
    );
  };

  async function playBuffer(samples: Float32Array, sampleRate: number) {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    // Disconnect previous analyser before creating a new one to prevent accumulation.
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.smoothingTimeConstant = 0.75;
    analyserNode.connect(ctx.destination);
    analyserRef.current = analyserNode;
    setAnalyser(analyserNode);

    const buf = ctx.createBuffer(1, samples.length, sampleRate);
    buf.getChannelData(0).set(samples);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(analyserNode);
    src.start();
  }

  const busy = status === "loading" || status === "generating";

  return (
    <section
      id="studio"
      className="border-b-2 border-ink bg-paper"
    >
      <div className="px-4 py-12 md:px-8 md:py-20 xl:px-12 xl:py-28">
        <div className="mb-8 flex items-end justify-between border-b-2 border-ink pb-3 md:mb-10 md:pb-4">
          <h2 className="font-display text-4xl leading-none sm:text-5xl md:text-6xl xl:text-7xl">
            STUDIO
          </h2>
          <span className="text-[11px] uppercase text-smoke md:text-xs">
            {statusLabel(status)}
          </span>
        </div>

        <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.5fr_1fr] xl:gap-12">
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-end justify-between border-b-2 border-ink pb-2">
                <h3 className="text-xs uppercase tracking-widest">
                  [ INPUT ]
                </h3>
                <span
                  className={[
                    "text-xs",
                    charsLeft < 0 ? "text-signal" : "text-smoke",
                  ].join(" ")}
                >
                  {charsLeft} chars
                </span>
              </div>
              <div className="relative border-2 border-ink bg-paper">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  onFocus={startPreload}
                  disabled={busy}
                  rows={7}
                  placeholder="> type something and make it speak…"
                  className="block w-full resize-none bg-transparent p-4 font-mono text-base leading-relaxed placeholder:text-fog focus:outline-none md:text-lg"
                />
                <div className="flex items-center justify-between border-t-2 border-ink bg-dust/30 px-4 py-2 text-xs uppercase">
                  <span>→ plaintext only</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setText(SAMPLE_TEXT)}
                    className="hover:text-signal disabled:opacity-50"
                  >
                    [ reset ]
                  </button>
                </div>
              </div>
            </div>

            <VoiceGrid
              selected={voice}
              onSelect={(v) => {
                setVoice(v);
                startPreload();
              }}
              disabled={busy}
            />

            <div>
              <div className="mb-3 flex items-end justify-between border-b-2 border-ink pb-2">
                <h3 className="text-xs uppercase tracking-widest">
                  [ SPEED ]
                </h3>
                <span className="text-xs text-smoke">
                  {speed.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setSpeed(Math.max(0.5, +(speed - 0.1).toFixed(2)))}
                  className="border-2 border-ink px-3 py-1 hover:bg-ink hover:text-paper disabled:opacity-50"
                >
                  −
                </button>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={speed}
                  disabled={busy}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="flex-1 accent-signal disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setSpeed(Math.min(2, +(speed + 0.1).toFixed(2)))}
                  className="border-2 border-ink px-3 py-1 hover:bg-ink hover:text-paper disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-ink bg-ink p-6 text-paper">
              <div className="mb-4 flex items-center justify-between text-xs uppercase">
                <span>[ OUTPUT ]</span>
                <span className="text-fog">{statusLabel(status)}</span>
              </div>

              <div className="mb-6 h-20 overflow-hidden border border-smoke bg-smoke p-2">
                <Waveform
                  analyser={status === "done" ? analyser : null}
                  active={status === "generating"}
                />
              </div>

              {busy && (
                <div className="mb-4 border border-signal p-3 text-[11px] uppercase">
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="truncate text-signal">&gt; {loadMsg}</span>
                    <span className="shrink-0">{loadPct > 0 ? `${Math.round(loadPct)}%` : ""}</span>
                  </div>
                  {loadFile && (
                    <div className="mb-2 truncate text-fog">↳ {loadFile}</div>
                  )}
                  {loadBytes && (
                    <div className="mb-2 text-fog">
                      {formatMB(loadBytes.loaded)} / {formatMB(loadBytes.total)} MB
                    </div>
                  )}
                  <div className="h-1 w-full bg-smoke">
                    <div
                      className="h-full bg-signal transition-[width]"
                      style={{ width: `${Math.max(4, loadPct)}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 border border-signal p-3 text-xs uppercase text-signal">
                  ERR: {error}
                </div>
              )}

              {!busy && !ready && (
                <div className="mb-3 flex items-center justify-between gap-2 border border-fog px-3 py-2 text-[10px] uppercase text-fog">
                  <span className="truncate">
                    {preloading
                      ? `↓ preloading model ${loadPct ? Math.round(loadPct) + "%" : ""}`
                      : "~82MB downloads on first SPEAK"}
                  </span>
                  <span className="shrink-0">first run only</span>
                </div>
              )}
              {!busy && ready && (
                <div className="mb-3 flex items-center justify-between gap-2 border border-signal px-3 py-2 text-[10px] uppercase text-signal">
                  <span>● model cached · instant</span>
                  <span className="shrink-0">ready</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSpeak}
                disabled={busy || !text.trim()}
                className="w-full border-2 border-signal bg-signal py-5 font-display text-4xl leading-none tracking-wider text-ink transition-colors hover:bg-paper hover:text-signal disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "…WORKING" : "SPEAK."}
              </button>

              {status === "done" && audioBlob && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px] uppercase">
                    <button
                      type="button"
                      onClick={handleReplay}
                      className="border-2 border-paper py-3 hover:bg-paper hover:text-ink"
                    >
                      ▶ REPLAY
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="border-2 border-paper py-3 hover:bg-paper hover:text-ink"
                    >
                      ↓ MP3 ({formatMB(audioBlob.size)}MB)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] uppercase">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={shareState === "uploading"}
                      className="border-2 border-paper bg-paper py-3 text-ink hover:bg-signal hover:border-signal disabled:cursor-wait disabled:opacity-60"
                    >
                      {shareState === "uploading"
                        ? "↑ UPLOADING…"
                        : shareState === "done"
                        ? copied
                          ? "✓ LINK COPIED"
                          : "⌘ COPY LINK"
                        : "↗ CREATE SHARE LINK"}
                    </button>
                    <button
                      type="button"
                      onClick={handleTweet}
                      className="border-2 border-paper py-3 hover:bg-paper hover:text-ink"
                    >
                      𝕏 TWEET
                    </button>
                  </div>

                  {shareUrl && (
                    <div className="truncate border border-signal bg-smoke px-3 py-2 text-[10px] uppercase text-signal">
                      ↳ {shareUrl}
                    </div>
                  )}
                  {shareError && (
                    <div className="border border-signal px-3 py-2 text-[10px] uppercase text-signal">
                      share err: {shareError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {status === "done" && (
              <a
                href="https://x.com/0xEvinho"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between border-2 border-ink bg-signal px-4 py-4 text-ink hover:bg-ink hover:text-paper"
              >
                <div>
                  <div className="font-display text-xl leading-none md:text-2xl">
                    LIKE THIS?
                  </div>
                  <div className="mt-1 text-[10px] uppercase opacity-70">
                    get drops, new voices, new models
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg leading-none md:text-xl">
                    FOLLOW @0xEVINHO →
                  </div>
                  <div className="mt-1 text-[10px] uppercase opacity-70">on X</div>
                </div>
              </a>
            )}

            <div className="border-2 border-ink bg-dust/40 p-4 text-[11px] uppercase leading-relaxed md:text-xs">
              <div className="mb-2 font-bold">[ FIRST RUN ]</div>
              <p className="text-smoke">
                First generation downloads a ~82MB kokoro model (q8) to your device.
                Cached forever after. Every run after is near-instant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}

function analyseAudio(samples: Float32Array): { mean: number; nanRatio: number } {
  let sum = 0;
  let nanCount = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    if (Number.isNaN(v)) {
      nanCount++;
      continue;
    }
    sum += Math.abs(v);
  }
  const valid = samples.length - nanCount;
  return {
    mean: valid > 0 ? sum / valid : 0,
    nanRatio: nanCount / samples.length,
  };
}

function splitSentences(text: string): string[] {
  const MAX = 200;
  const out: string[] = [];
  const raw = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const s of raw) {
    if (s.length <= MAX) {
      out.push(s);
      continue;
    }
    const parts = s.split(/(?<=[,;:])\s+/);
    let buf = "";
    for (const p of parts) {
      if ((buf + " " + p).trim().length > MAX && buf) {
        out.push(buf.trim());
        buf = p;
      } else {
        buf = buf ? `${buf} ${p}` : p;
      }
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out.length ? out : [text];
}

function statusLabel(s: Status): string {
  switch (s) {
    case "idle":
      return "READY";
    case "loading":
      return "LOADING MODEL";
    case "generating":
      return "GENERATING";
    case "done":
      return "DONE";
    case "error":
      return "ERROR";
  }
}
