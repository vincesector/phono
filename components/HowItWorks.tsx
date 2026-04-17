import { VOICES } from "@/lib/voices";

const STEPS = [
  {
    n: "01",
    title: "TYPE",
    body: "Write anything. Up to 2000 characters per run. Plaintext only, no markdown shenanigans.",
  },
  {
    n: "02",
    title: "PICK A VOICE",
    body: `${VOICES.length} voices curated from Kokoro. US and UK accents. Male, female, warm, sharp, deep, intimate.`,
  },
  {
    n: "03",
    title: "HIT SPEAK",
    body: "Kokoro 82M runs in your browser via transformers.js. No server, no API, no latency tax.",
  },
];

const FACTS = [
  { k: "MODEL", v: "Kokoro 82M v1.0" },
  { k: "ENGINE", v: "transformers.js / ONNX" },
  { k: "BACKEND", v: "WASM (all devices)" },
  { k: "SIZE", v: "~82MB q8" },
  { k: "SAMPLE RATE", v: "24kHz mono" },
  { k: "LICENSE", v: "MIT + Apache 2.0" },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b-2 border-ink bg-dust/30">
      <div className="px-4 py-12 md:px-8 md:py-20 xl:px-12 xl:py-28">
        <div className="mb-8 flex items-end justify-between border-b-2 border-ink pb-3 md:mb-10 md:pb-4">
          <h2 className="font-display text-4xl leading-none sm:text-5xl md:text-6xl xl:text-7xl">
            HOW IT WORKS
          </h2>
          <span className="hidden text-xs uppercase text-smoke md:inline">
            three clicks, zero servers
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-2 border-ink bg-paper p-5 md:p-6">
              <div className="font-display text-4xl leading-none text-signal md:text-5xl">
                {s.n}
              </div>
              <h3 className="mt-3 font-display text-2xl leading-none md:mt-4 md:text-3xl">
                {s.title}
              </h3>
              <p className="mt-3 text-[11px] uppercase leading-relaxed text-smoke md:text-sm">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 border-2 border-ink md:mt-12">
          <div className="border-b-2 border-ink bg-ink px-4 py-2 text-[11px] uppercase tracking-widest text-paper md:text-xs">
            [ SPECS ]
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {FACTS.map((f, i) => (
              <div
                key={f.k}
                className={[
                  "border-ink p-4",
                  "border-b-2 last:border-b-0",
                  (i + 1) % 2 !== 0 ? "sm:border-r-2" : "",
                  "lg:border-b-2",
                  (i + 1) % 3 !== 0 ? "lg:border-r-2" : "lg:border-r-0",
                  i >= FACTS.length - 3 ? "lg:border-b-0" : "",
                ].join(" ")}
              >
                <dt className="text-[11px] uppercase text-smoke md:text-xs">{f.k}</dt>
                <dd className="mt-1 font-display text-xl leading-none md:text-2xl">
                  {f.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
