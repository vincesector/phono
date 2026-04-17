"use client";

import { useEffect, useRef } from "react";

const W = 320;
const H = 72;
const BARS = 48;
const GAP = 2;
const BAR_W = Math.floor((W - GAP * (BARS - 1)) / BARS);

type Props = {
  analyser: AnalyserNode | null;
  active: boolean;
};

export function Waveform({ analyser }: Props) {
  const cvRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let t = 0;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const midY = Math.floor(H / 2);

    const render = () => {
      ctx.clearRect(0, 0, W, H);

      // Center baseline
      ctx.fillStyle = "rgba(255,90,31,0.25)";
      ctx.fillRect(0, midY, W, 1);

      ctx.fillStyle = "#ff5a1f";

      for (let i = 0; i < BARS; i++) {
        let amp: number;
        if (data && analyser) {
          analyser.getByteFrequencyData(data);
          const step = Math.max(1, Math.floor(data.length / BARS));
          let sum = 0;
          for (let j = 0; j < step; j++) sum += data[i * step + j] ?? 0;
          amp = sum / step / 255;
        } else {
          const v1 = Math.sin((i / BARS) * Math.PI * 3 + t);
          const v2 = Math.sin((i / BARS) * Math.PI * 7 + t * 1.3);
          amp = ((v1 + v2 * 0.4) / 1.4 + 1) * 0.5 * 0.45;
        }
        const h = Math.max(1, Math.floor(amp * (midY - 2)));
        const x = i * (BAR_W + GAP);
        ctx.fillRect(x, midY - h, BAR_W, h);
        ctx.fillRect(x, midY + 1, BAR_W, h);
      }

      t += 0.05;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return (
    <canvas
      ref={cvRef}
      width={W}
      height={H}
      className="block h-full w-full"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
