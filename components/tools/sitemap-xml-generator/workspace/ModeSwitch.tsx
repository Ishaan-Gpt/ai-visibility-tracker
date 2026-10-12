"use client";

import { motion } from "framer-motion";

export type ModeKey = "crawl" | "validate" | "manual";

/** Spider-ish crawl glyph: a page sending out links. */
export function CrawlGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="6" height="7" rx="1.5" />
      <path d="M9 6.5h3.5a2 2 0 0 1 2 2V11M9 8.5l3 4.5" />
      <circle cx="14.5" cy="13" r="2" />
      <circle cx="11" cy="15.5" r="1.4" />
    </svg>
  );
}

export function ValidateGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 3.5h6.5L15 7v9.5H5z" />
      <path d="M11.5 3.5V7H15" />
      <path d="m7.6 11.6 1.7 1.7 3.2-3.4" />
    </svg>
  );
}

export function ManualGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 5.5h7M4 9.5h5M4 13.5h3" />
      <path d="m10.5 15.5.5-2.6 5-5a1.4 1.4 0 0 1 2 2l-5 5z" />
    </svg>
  );
}

const GLYPH = { crawl: CrawlGlyph, validate: ValidateGlyph, manual: ManualGlyph };

/** Segmented control: a frosted track with a sliding orange-tinted thumb. */
export function ModeSwitch({ mode, onChange, modes }: { mode: ModeKey; onChange: (m: ModeKey) => void; modes: { key: ModeKey; label: string; short?: string; hint: string }[] }) {
  return (
    <div role="tablist" aria-label="Mode" className="glass-inset inline-flex w-full max-w-full gap-1 overflow-x-auto rounded-[16px] p-1 sm:w-auto">
      {modes.map((m) => {
        const Icon = GLYPH[m.key];
        const active = m.key === mode;
        return (
          <button
            key={m.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(m.key)}
            title={m.hint}
            className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[12px] px-3 py-2 sm:gap-2 sm:px-3.5 text-[14px] transition-colors sm:flex-none ${active ? "text-ds-ink" : "text-ds-ink-2 hover:text-ds-ink"}`}
          >
            {active && (
              <motion.span
                layoutId="sitemap-mode-thumb"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-[12px] bg-white/90 shadow-[0_1px_0_rgba(255,255,255,.9)_inset,0_8px_20px_-12px_rgba(43,41,39,.45)]"
              />
            )}
            <Icon className={`relative h-4 w-4 shrink-0 ${active ? "text-ds-accent-ink" : ""}`} />
            <span className="relative sm:hidden">{m.short ?? m.label}</span>
            <span className="relative hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
