"use client";

import type { VoiceId } from "./voices";

export type ProgressInfo = {
  status: string;
  progress?: number;
  name?: string;
  file?: string;
  loaded?: number;
  total?: number;
};

type ProgressCb = (info: ProgressInfo) => void;

type KokoroInstance = {
  generate: (
    text: string,
    opts: { voice: VoiceId; speed: number }
  ) => Promise<{ audio: Float32Array; sampling_rate: number }>;
  stream: (
    text: string,
    opts: { voice: VoiceId; speed: number }
  ) => AsyncGenerator<{
    text: string;
    phonemes: string;
    audio: { audio: Float32Array; sampling_rate: number };
  }>;
};

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

export type BackendInfo = {
  device: "webgpu" | "wasm";
  // WebGPU: fp16 (~165MB) if shader-f16 is available, else fp32 (~330MB). WASM: q8 (~82MB).
  dtype: "fp16" | "fp32" | "q8";
  modelSizeMB: number;
};

let detectedBackend: BackendInfo | null = null;

// Detect the best available inference backend.
//
// Priority:
//   1. iOS/iPadOS → throw immediately. ORT WebGPU crashes WebKit (microsoft/
//      onnxruntime#26827, #22776) and COEP:credentialless is ignored by Safari
//      (WebKit bug #230550), so neither path works on iOS/iPadOS today.
//   2. WASM + q8 — the known-good path. Requires crossOriginIsolated=true
//      (SharedArrayBuffer). Provided by COEP:credentialless on Chrome/Firefox/
//      Edge desktop and Android Chrome.
//   3. Throw — nothing works; caller shows "unsupported" message.
//
// WebGPU is intentionally skipped: ORT WebGPU EP produces broken/NaN audio
// with the Kokoro StyleTextToSpeech2 architecture on every tested platform
// (hexgrad/kokoro#98, #193). Revisit when the upstream bug is fixed.
// When re-enabling, prefer dtype:"q4f16" (155MB, shader-f16) or "q4" (305MB).
export async function detectBackend(): Promise<BackendInfo> {
  if (detectedBackend) return detectedBackend;

  // iPadOS reports as MacIntel — also catch it via maxTouchPoints > 1.
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  if (isIOS) {
    throw new Error(
      "iOS / iPadOS not supported yet. In-browser TTS on iPhone and iPad needs Safari 26 (shipping later this year). For now, open Phono on desktop Chrome/Edge/Firefox or on Android Chrome."
    );
  }

  // WASM — requires crossOriginIsolated=true for SharedArrayBuffer.
  // COEP:credentialless in next.config.ts provides this on Chromium and Firefox.
  if (typeof self !== "undefined" && self.crossOriginIsolated) {
    detectedBackend = { device: "wasm", dtype: "q8", modelSizeMB: 82 };
    console.info("[phono] backend: wasm/q8");
    return detectedBackend;
  }

  throw new Error(
    "Browser not supported. Open Phono on desktop Chrome/Edge/Firefox or on Android Chrome."
  );
}

export function getBackend(): BackendInfo | null {
  return detectedBackend;
}

let instancePromise: Promise<KokoroInstance> | null = null;
let isReady = false;

export async function getTTS(onProgress?: ProgressCb): Promise<KokoroInstance> {
  if (instancePromise) {
    if (isReady) onProgress?.({ status: "ready", progress: 100 });
    return instancePromise;
  }

  instancePromise = (async () => {
    const backend = await detectBackend();
    console.info(`[phono] loading kokoro-js (${backend.device}/${backend.dtype} ~${backend.modelSizeMB}MB)`);

    if (backend.device === "wasm") {
      // Configure ORT for Chrome/Firefox WASM path.
      //
      // Problem 1 — WebKit JIT crash (WebKit bug #304810):
      //   Default JSEP wasm uses ASYNCIFY → WebKit OMG JIT spins infinitely.
      //   Fix: use non-JSEP threaded build served from /public.
      //
      // Problem 2 — inference hang without SAB:
      //   Default proxy worker uses Atomics.wait on SAB to signal results.
      //   Fix: proxy=false runs inference on main thread; numThreads=1
      //   prevents worker spawning.
      const { env } = await import("@huggingface/transformers");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onnxWasm = (env.backends.onnx as any).wasm;
      if (onnxWasm) {
        onnxWasm.proxy = false;
        onnxWasm.numThreads = 1;
        onnxWasm.wasmPaths = {
          wasm: "/phono/ort-wasm-simd-threaded.wasm",
          mjs: "/phono/ort-wasm-simd-threaded.mjs",
        };
      }
    }

    const { KokoroTTS } = await import("kokoro-js");

    try {
      const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: backend.dtype,
        device: backend.device,
        progress_callback: (info: ProgressInfo) => {
          onProgress?.({
            status: info.status ?? "loading",
            progress: info.progress,
            name: info.name,
            file: info.file,
            loaded: info.loaded,
            total: info.total,
          });
        },
      });
      isReady = true;
      console.info("[phono] model ready");
      return tts as unknown as KokoroInstance;
    } catch (e) {
      console.error("[phono] model load failed", e);
      instancePromise = null;
      isReady = false;
      throw e;
    }
  })();

  return instancePromise;
}

export function isTTSReady(): boolean {
  return isReady;
}

export function resetTTS() {
  instancePromise = null;
  isReady = false;
}
