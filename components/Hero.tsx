import { HeroArt } from "./HeroArt";

export function Hero() {
  return (
    <section id="top" className="relative border-b-2 border-ink">
      <div className="grid grid-cols-1 items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_1fr] md:gap-8 md:px-8 md:py-20 xl:grid-cols-[1.25fr_1fr] xl:gap-16 xl:px-12 xl:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 border-2 border-ink px-3 py-1 text-[11px] uppercase md:text-xs">
            <span className="h-2 w-2 animate-pulse bg-signal" aria-hidden />
            v0.1 / open source / MIT
          </div>
          <h1 className="font-display leading-[0.85] tracking-tight text-[22vw] sm:text-[20vw] md:text-[14vw] xl:text-[12vw]">
            PHONO<span className="text-signal">.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm uppercase leading-relaxed md:mt-8 md:text-base xl:text-lg">
            Browser-native text to speech.
            <br />
            Zero cost. Zero upload. Zero signup.
            <br />
            Your text never leaves your machine.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
            <a
              href="#studio"
              className="border-2 border-ink bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-paper hover:bg-signal hover:border-signal hover:text-ink md:px-6 md:py-4 md:text-sm"
            >
              &gt; START TALKING
            </a>
            <a
              href="#how"
              className="border-2 border-ink px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper md:px-6 md:py-4 md:text-sm"
            >
              HOW IT WORKS
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase text-smoke md:mt-10 md:gap-x-6 md:text-xs">
            <span>↳ runs on device</span>
            <span>↳ 27 voices</span>
            <span>↳ 82M params</span>
            <span>↳ WebGPU / WASM</span>
          </div>
          <p className="mt-4 max-w-md text-[10px] uppercase leading-relaxed text-fog md:text-[11px]">
            ⓘ first run downloads a ~165MB model to your device.
            Every run after is instant.
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-end">
          <HeroArt />
        </div>
      </div>

      <div className="overflow-hidden border-t-2 border-ink bg-ink py-3 text-paper">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap text-sm uppercase">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              <span>FREE FOREVER</span>
              <span className="text-signal">///</span>
              <span>NO SIGNUP</span>
              <span className="text-signal">///</span>
              <span>NO API KEY</span>
              <span className="text-signal">///</span>
              <span>RUNS LOCAL</span>
              <span className="text-signal">///</span>
              <span>MIT LICENSED</span>
              <span className="text-signal">///</span>
              <span>KOKORO 82M</span>
              <span className="text-signal">///</span>
              <span>BUILT BY @0xEVINHO</span>
              <span className="text-signal">///</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
