export function Nav() {
  return (
    <nav className="border-b-2 border-ink">
      <div className="flex items-center justify-between px-4 py-4 md:px-8 xl:px-12">
        <a
          href="/phono"
          className="font-display text-2xl leading-none tracking-wider md:text-3xl"
          aria-label="PHONO"
        >
          PHONO<span className="text-signal">.</span>
        </a>
        <div className="flex items-center gap-3 text-[11px] uppercase md:gap-6 md:text-sm">
          <a href="#studio" className="hidden hover:text-signal sm:inline">
            [ STUDIO ]
          </a>
          <a href="#how" className="hidden hover:text-signal md:inline">
            [ HOW ]
          </a>
          <a
            href="https://github.com/vincesector/phono"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden hover:text-signal md:inline"
          >
            [ GITHUB ]
          </a>
          <a
            href="https://x.com/0xEvinho"
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-ink bg-ink px-3 py-1.5 text-paper hover:bg-signal hover:border-signal hover:text-ink"
          >
            <span className="hidden sm:inline">FOLLOW </span>@0xEVINHO
          </a>
        </div>
      </div>
    </nav>
  );
}
