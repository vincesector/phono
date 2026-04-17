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
//   1. iOS/iPadOS → throw. ORT Web's WebGPU EP crashes WebKit's GPU/WASM
//      pipeline (microsoft/onnxruntime#26827, #22776) and COEP: credentialless
//      doesn't work on Safari (WebKit bug #230550), so WASM can't get SAB.
//      Fixes ship with iOS 26 / Safari 26.
//   2. WebGPU — fp16 if adapter exposes shader-f16, else fp32.
//              Works on Android Chrome 113+ and all modern desktop.
//   3. WASM   — requires crossOriginIsolated=true (SAB available).
//              Covers Chrome/Firefox/Edge where WebGPU is unavailable.
//   4. Throw  — nothing works; caller shows "unsupported" message.
export async function detectBackend(): Promise<BackendInfo> {
  if (detectedBackend) return detectedBackend;

  // iPadOS Safari reports as MacIntel — catch it via maxTouchPoints > 1.
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  if (isIOS) {
    throw new Error(
      "iOS / iPadOS not supported yet. In-browser TTS on iPhone and iPad needs Safari 26 (shipping later this year). For now, open Phono on desktop Chrome/Edge/Firefox or on Android Chrome."
    );
  }

  // WebGPU probe — requestAdapter() returns null when unavailable, throws on error.
  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        // shader-f16 is an optional WebGPU feature. Running fp16 shaders on an
        // adapter that doesn't support it can crash the GPU process mid-inference.
        const hasF16 = adapter.features.has("shader-f16");
        detectedBackend = hasF16
          ? { device: "webgpu", dtype: "fp16", modelSizeMB: 165 }
          : { device: "webgpu", dtype: "fp32", modelSizeMB: 330 };
        console.info(`[phono] backend: webgpu/${detectedBackend.dtype}`);
        return detectedBackend;
      }
    } catch {
      // GPU unavailable or context lost — fall through to WASM
    }
  }

  // WASM probe — pthreads WASM requires SharedArrayBuffer, which is only
  // exposed when crossOriginIsolated=true. credentialless COEP gives this
  // on Chromium/Firefox; Safari ignores credentialless (WebKit bug #230550).
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
