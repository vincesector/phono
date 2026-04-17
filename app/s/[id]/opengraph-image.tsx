import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PHONO — Shared voice clip";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f5f3ed";
const INK = "#0a0a0a";
const SIGNAL = "#ff5a1f";
const FOG = "#a8a298";

type Meta = {
  voice: string;
  voiceLabel: string;
  speed: number;
  textPreview: string;
  createdAt: string;
};

async function getMeta(id: string): Promise<Meta | null> {
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/s/${id}/meta.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Meta;
  } catch {
    return null;
  }
}

function waveformBars(seed = 1, count = 64, midY = 90, maxH = 80): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = i * 12 + 6;
    const p = i / count;
    const v1 = Math.sin(p * Math.PI * 2.3 + seed);
    const v2 = Math.sin(p * Math.PI * 5.8 + seed * 1.7) * 0.55;
    const v3 = Math.sin(p * Math.PI * 11 + seed * 0.8) * 0.35;
    const env = Math.sin(p * Math.PI) * 0.9 + 0.15;
    const amp = (v1 + v2 + v3) / 1.9;
    const h = Math.max(3, Math.abs(amp) * env * maxH);
    d += `<rect x="${x}" y="${midY - h}" width="8" height="${h * 2}" fill="${INK}"/>`;
  }
  return d;
}

export default async function OG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getMeta(id);

  const voiceLabel = meta?.voiceLabel ?? "PHONO";
  const preview = (meta?.textPreview ?? "Free text-to-speech that runs in your browser.").slice(0, 220);
  const truncated = (meta?.textPreview ?? "").length > 220;

  const waveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 810 180" width="810" height="180"><rect width="810" height="1" y="90" fill="${INK}" opacity="0.2"/>${waveformBars(id.charCodeAt(0) / 10)}</svg>`;
  const waveDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(waveSvg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          color: INK,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 48px",
            background: INK,
            color: PAPER,
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>
            <div style={{ display: "flex" }}>PHONO</div>
            <div style={{ display: "flex", color: SIGNAL }}>.</div>
          </div>
          <div style={{ display: "flex", color: FOG }}>SHARED CLIP / {id}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "44px 64px 20px 64px",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, color: FOG }}>
            [ SPOKEN BY ]
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 150,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            <div style={{ display: "flex" }}>{voiceLabel}</div>
            <div style={{ display: "flex", color: SIGNAL }}>.</div>
          </div>

          <div
            style={{
              display: "flex",
              border: `3px solid ${INK}`,
              background: "rgba(216,212,199,0.4)",
              padding: "22px 28px",
              fontSize: 26,
              lineHeight: 1.35,
              marginTop: 12,
            }}
          >
            &ldquo;{preview}{truncated ? "…" : ""}&rdquo;
          </div>
        </div>

        <div
          style={{
            display: "flex",
            padding: "0 48px",
            height: 100,
          }}
        >
          <img src={waveDataUrl} width={1104} height={140} alt="" />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 48px",
            background: INK,
            color: PAPER,
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>▶ LISTEN ON PHONO</div>
          <div style={{ display: "flex", color: SIGNAL }}>phonoapp.vercel.app/s/{id}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
