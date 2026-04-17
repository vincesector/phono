import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function shortId(): string {
  const alpha = "23456789abcdefghjkmnpqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 8; i++) out += alpha[Math.floor(Math.random() * alpha.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "share storage not configured" },
        { status: 503 }
      );
    }

    const form = await req.formData();
    const audio = form.get("audio");
    const metaStr = form.get("meta");
    if (!(audio instanceof Blob) || typeof metaStr !== "string") {
      return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ ok: false, error: "audio too large" }, { status: 413 });
    }

    const id = shortId();
    const [audioRes, metaRes] = await Promise.all([
      put(`s/${id}/audio.mp3`, audio, {
        access: "public",
        token,
        contentType: "audio/mpeg",
        addRandomSuffix: false,
      }),
      put(`s/${id}/meta.json`, metaStr, {
        access: "public",
        token,
        contentType: "application/json",
        addRandomSuffix: false,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      id,
      url: `/s/${id}`,
      audioUrl: audioRes.url,
      metaUrl: metaRes.url,
    });
  } catch (e) {
    console.error("[phono/share]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
