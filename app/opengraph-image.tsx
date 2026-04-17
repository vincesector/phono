import { ImageResponse } from "next/og";
import { VOICES } from "@/lib/voices";

export const runtime = "edge";
export const alt = "PHONO — Browser-native text-to-speech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f5f3ed";
const INK = "#0a0a0a";
const SIGNAL = "#ff5a1f";
const FOG = "#a8a298";

function waveformBars(seed = 1, count = 56, midY = 90, maxH = 80): string {
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = i * 14 + 8;
    const p = i / count;
    const v1 = Math.sin(p * Math.PI * 2.3 + seed);
    const v2 = Math.sin(p * Math.PI * 5.8 + seed * 1.7) * 0.55;
    const v3 = Math.sin(p * Math.PI * 11 + seed * 0.8) * 0.35;
    const env = Math.sin(p * Math.PI) * 0.9 + 0.15;
    const amp = (v1 + v2 + v3) / 1.9;
    const h = Math.max(3, Math.abs(amp) * env * maxH);
    d += `<rect x="${x}" y="${midY - h}" width="10" height="${h * 2}" fill="${INK}"/>`;
  }
  return d;
}

export default async function OG() {
  const waveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 810 180" width="810" height="180"><rect width="810" height="1" y="90" fill="${INK}" opacity="0.2"/>${waveformBars(1.3)}</svg>`;
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
            background: INK,
            color: PAPER,
            padding: "14px 48px",
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
            height: 52,
          }}
        >
          <div style={{ display: "flex", gap: 22 }}>
            <div style={{ display: "flex" }}>FREE FOREVER</div>
            <div style={{ display: "flex", color: SIGNAL }}>///</div>
            <div style={{ display: "flex" }}>NO SIGNUP</div>
            <div style={{ display: "flex", color: SIGNAL }}>///</div>
            <div style={{ display: "flex" }}>NO API KEY</div>
            <div style={{ display: "flex", color: SIGNAL }}>///</div>
            <div style={{ display: "flex" }}>RUNS LOCAL</div>
          </div>
          <div style={{ display: "flex", color: SIGNAL }}>MIT LICENSED</div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            padding: "36px 64px 16px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: `3px solid ${INK}`,
              padding: "8px 14px",
              fontSize: 18,
              letterSpacing: 2,
              textTransform: "uppercase",
              alignSelf: "flex-start",
            }}
          >
            <div style={{ display: "flex", width: 10, height: 10, background: SIGNAL }} />
            <div style={{ display: "flex" }}>v0.1 / OPEN SOURCE / MIT</div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 10,
              fontSize: 180,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 1,
              height: 180,
            }}
          >
            <div style={{ display: "flex" }}>PHONO</div>
            <div style={{ display: "flex", color: SIGNAL }}>.</div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 18,
              fontSize: 24,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            <div style={{ display: "flex" }}>Browser-native text to speech.</div>
            <div style={{ display: "flex" }}>Zero cost. Zero upload. Zero signup.</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            padding: "0 64px",
            height: 90,
            overflow: "hidden",
          }}
        >
          <img src={waveDataUrl} width={1070} height={160} alt="" />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: INK,
            color: PAPER,
            padding: "16px 48px",
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
            height: 56,
          }}
        >
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ display: "flex" }}>{VOICES.length} VOICES</div>
            <div style={{ display: "flex", color: FOG }}>·</div>
            <div style={{ display: "flex" }}>82M PARAMS</div>
            <div style={{ display: "flex", color: FOG }}>·</div>
            <div style={{ display: "flex" }}>MIT</div>
          </div>
          <div style={{ display: "flex", color: SIGNAL }}>phonoapp.vercel.app</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
