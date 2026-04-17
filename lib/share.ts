"use client";

import { withBase } from "./basePath";

export type ShareMeta = {
  voice: string;
  voiceLabel: string;
  speed: number;
  textPreview: string;
  createdAt: string;
};

export type ShareResult = {
  id: string;
  url: string;
  audioUrl: string;
  metaUrl: string;
};

export async function createShareLink(
  audioBlob: Blob,
  meta: ShareMeta
): Promise<ShareResult> {
  const form = new FormData();
  form.append("audio", audioBlob, "audio.mp3");
  form.append("meta", JSON.stringify(meta));

  const res = await fetch(withBase("/api/share"), { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `share failed (${res.status})`);
  }
  return { id: data.id, url: data.url, audioUrl: data.audioUrl, metaUrl: data.metaUrl };
}

export function buildTwitterIntent(shareUrl: string, voiceLabel: string): string {
  const text = `just made this with PHONO, a free TTS that runs in your browser. no more Eleven Labs. no more subscriptions. the voice I used was ${voiceLabel.toUpperCase()}

made by @0xEvinho`;
  const params = new URLSearchParams({
    text,
    url: shareUrl,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
