"use client";

import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setErr("invalid email");
      setState("error");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setState("done");
      setEmail("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
      setState("error");
    }
  }

  return (
    <footer className="bg-ink text-paper">
      <div className="px-4 py-12 md:px-8 md:py-16 xl:px-12 xl:py-20">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:gap-16">
          <div>
            <div className="font-display text-5xl leading-none sm:text-6xl md:text-7xl xl:text-8xl">
              PHONO<span className="text-signal">.</span>
            </div>
            <p className="mt-5 max-w-lg text-xs uppercase leading-relaxed text-fog md:mt-6 md:text-sm">
              Heads up when new voices ship, new features drop,
              or a model upgrade happens. No spam. No funnel.
              One email every other week, max.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                placeholder="you@domain.com"
                disabled={state === "loading" || state === "done"}
                className="flex-1 border-2 border-paper bg-ink px-3 py-3 font-mono text-sm text-paper placeholder:text-fog focus:border-signal focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={state === "loading" || state === "done"}
                className="border-2 border-l-0 border-paper bg-paper px-5 font-bold uppercase text-ink hover:bg-signal hover:border-signal disabled:opacity-50"
              >
                {state === "done" ? "✓ IN" : state === "loading" ? "..." : "JOIN"}
              </button>
            </form>
            {state === "error" && (
              <div className="mt-2 text-xs uppercase text-signal">&gt; {err}</div>
            )}
            {state === "done" && (
              <div className="mt-2 text-xs uppercase text-signal">
                &gt; you&apos;re on the list.
              </div>
            )}
          </div>

          <div className="grid gap-6 text-sm uppercase md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs text-fog">[ FOLLOW ]</div>
              <ul className="space-y-1">
                <li>
                  <a
                    href="https://x.com/0xEvinho"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-signal"
                  >
                    → @0xEvinho / X
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/vincesector/phono"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-signal"
                  >
                    → github / src
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-2 text-xs text-fog">[ BUILT WITH ]</div>
              <ul className="space-y-1 text-fog">
                <li>next 16</li>
                <li>tailwind v4</li>
                <li>kokoro-js 1.2</li>
                <li>transformers.js</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-2 border-t-2 border-paper/20 pt-6 text-xs uppercase text-fog md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} PHONO · MIT LICENSED · NO TRACKING</span>
          <span>BUILT BY @0xEVINHO · EVINHO.XYZ</span>
        </div>
      </div>
    </footer>
  );
}
