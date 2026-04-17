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

let instancePromise: Promise<KokoroInstance> | null = null;
let isReady = false;

export async function getTTS(onProgress?: ProgressCb): Promise<KokoroInstance> {
  if (instancePromise) {
    if (isReady) onProgress?.({ status: "ready", progress: 100 });
    return instancePromise;
  }

  instancePromise = (async () => {
    console.info("[phono] loading kokoro-js (wasm/q8 ~82MB)");

    // Preflight: the pthreads WASM build unconditionally requires SharedArrayBuffer
    // at instantiation time. iOS 16 and older can't expose it (no COEP: credentialless
    // support). Check by actually constructing one — some browsers (Brave) expose SAB
    // without crossOriginIsolated=true, so testing that flag directly is too strict.
    let sabAvailable = false;
    try {
      void new SharedArrayBuffer(4);
      sabAvailable = true;
    } catch { /* unavailable */ }
    if (!sabAvailable) {
      instancePromise = null;
      throw new Error(
        "requires iOS 17+ or Safari 17+ — your browser cannot run the on-device model"
      );
    }

    // Configure ORT for iOS Safari / Brave (WebKit) compatibility.
    //
    // Problem 1 — WebKit JIT crash (WebKit bug #304810):
    //   The default JSEP wasm uses ASYNCIFY, which causes WebKit's OMG JIT to
    //   spin infinitely during compilation, killing the tab.
    //   Fix: use non-JSEP threaded build (no ASYNCIFY) served from /public.
    //
    // Problem 2 — inference hangs after model loads:
    //   The "threaded" wasm build spawns a proxy Web Worker by default and uses
    //   Atomics on SharedArrayBuffer to signal results back to the main thread.
    //   Without crossOriginIsolated (Safari ignores COEP: credentialless),
    //   SharedArrayBuffer is unavailable, so Atomics.wait() never resolves.
    //   Fix: proxy=false forces inference onto the main thread; numThreads=1
    //   prevents any worker-thread spawning.
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

    const { KokoroTTS } = await import("kokoro-js");

    try {
      const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: "q8",
        device: "wasm",
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
