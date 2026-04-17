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
  // WebGPU uses fp16 (~165MB); WASM uses q8 (~82MB)
  dtype: "fp16" | "q8";
  modelSizeMB: number;
};

let detectedBackend: BackendInfo | null = null;

// Detect the best available inference backend.
//
// Priority:
//   1. WebGPU — no SharedArrayBuffer or COEP headers needed.
//              Works on iOS 18+ Safari, Android Chrome 113+, all desktop.
//   2. WASM   — requires crossOriginIsolated=true (SAB available).
//              COEP: credentialless works on Chrome/Firefox/Edge but NOT on
//              Safari (WebKit bug #230550, still unshipped as of 2025).
//   3. Throw  — nothing works; caller shows "unsupported" message.
export async function detectBackend(): Promise<BackendInfo> {
  if (detectedBackend) return detectedBackend;

  // WebGPU probe — requestAdapter() returns null when unavailable, throws on error.
  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        detectedBackend = { device: "webgpu", dtype: "fp16", modelSizeMB: 165 };
        console.info("[phono] backend: webgpu/fp16");
        return detectedBackend;
      }
    } catch {
      // GPU unavailable or context lost — fall through to WASM
    }
  }

  // WASM probe — pthreads WASM requires SharedArrayBuffer, which is only
  // exposed when crossOriginIsolated=true. credentialless COEP gives this
  // on Chrome/Firefox; Safari ignores credentialless (WebKit bug #230550).
  if (typeof self !== "undefined" && self.crossOriginIsolated) {
    detectedBackend = { device: "wasm", dtype: "q8", modelSizeMB: 82 };
    console.info("[phono] backend: wasm/q8");
    return detectedBackend;
  }

  throw new Error(
    "browser not supported — open in Chrome, Firefox, or iOS 18+ Safari"
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
