"use client";

import { useEffect, useRef } from "react";

const CSS_W = 560;
const CSS_H = 400;

export function HeroArt() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = CSS_W * dpr;
    cv.height = CSS_H * dpr;
    cv.style.width = `${CSS_W}px`;
    cv.style.height = `${CSS_H}px`;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;

    const startMs = performance.now();
    let t = 0;
    let raf = 0;
    let alive = true;

    const render = () => {
      if (!alive) return;

      ctx.fillStyle = "#f5f3ed";
      ctx.fillRect(0, 0, CSS_W, CSS_H);

      // Top control bar
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CSS_W, 28);

      const seconds = Math.floor((performance.now() - startMs) / 1000) % 60;

      // Rec blinking dot
      ctx.fillStyle = seconds % 2 === 0 ? "#ff5a1f" : "#5a1f0a";
      ctx.fillRect(12, 10, 10, 10);

      ctx.fillStyle = "#f5f3ed";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("REC / AF_HEART", 30, 14);
      ctx.textAlign = "right";
      ctx.fillText(`-00:00:${String(seconds).padStart(2, "0")}`, CSS_W - 12, 14);

      // Waveform area
      const areaTop = 40;
      const areaBot = CSS_H - 36;
      const midY = Math.floor((areaTop + areaBot) / 2);

      // Baseline
      ctx.fillStyle = "rgba(10,10,10,0.18)";
      ctx.fillRect(0, midY, CSS_W, 1);

      // Bars — mirrored, thick and crisp
      const BARS = 72;
      const GAP = 2;
      const barW = (CSS_W - GAP * (BARS - 1)) / BARS;
      const maxH = (areaBot - areaTop) / 2 - 4;

      ctx.fillStyle = "#0a0a0a";
      for (let i = 0; i < BARS; i++) {
        const x = i * (barW + GAP);
        const p = i / BARS;
        const v1 = Math.sin(p * Math.PI * 2.3 + t);
        const v2 = Math.sin(p * Math.PI * 5.8 + t * 1.7) * 0.55;
        const v3 = Math.sin(p * Math.PI * 11 + t * 0.8) * 0.35;
        const v4 = Math.sin(p * Math.PI * 17 - t * 2.1) * 0.2;
        const env = Math.sin(p * Math.PI) * 0.9 + 0.15;
        const amp = (v1 + v2 + v3 + v4) / 2.1;
        const h = Math.max(2, Math.abs(amp) * env * maxH);
        ctx.fillRect(x, midY - h, barW, h);
        ctx.fillRect(x, midY + 1, barW, h);
      }

      // Playhead
      const headX = ((Math.sin(t * 0.22) + 1) / 2) * (CSS_W - 6) + 3;
      ctx.fillStyle = "#ff5a1f";
      ctx.fillRect(headX - 1.5, areaTop - 4, 3, areaBot - areaTop + 8);

      // Bottom status bar
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, CSS_H - 24, CSS_W, 24);
      ctx.fillStyle = "#f5f3ed";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`PHONO :: REC ${String(seconds).padStart(2, "0")}s`, 12, CSS_H - 12);
      ctx.textAlign = "right";
      ctx.fillText("24000HZ · MONO · FP16", CSS_W - 12, CSS_H - 12);

      t += 0.05;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[640px]">
      <div className="border-2 border-ink bg-ink p-1">
        <canvas
          ref={ref}
          className="block h-auto w-full"
          aria-hidden
        />
      </div>
      <div className="absolute -bottom-3 -right-3 rotate-3 border-2 border-ink bg-signal px-3 py-1 font-display text-xl leading-none md:text-2xl">
        LIVE
      </div>
    </div>
  );
}
