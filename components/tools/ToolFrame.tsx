"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ToolGlyph } from "@/components/icons/ToolGlyphs";
import { IconChevron } from "@/components/icons/Icons";
import { PaintedFoliage, PaintedSky } from "@/components/landing/Painted";
import { splitHeadline, type ToolKind } from "@/lib/tools/registry";

const EASE = [0.22, 1, 0.36, 1] as const;

const CHIPS: Record<ToolKind, string[]> = {
  fetch: ["Free", "No signup", "Fetches the live page"],
  client: ["Free", "No signup", "Runs in your browser"],
  account: ["Free plan", "Scheduled checks", "Account required"],
};

/** Centered serif hero: the tool's own glyph sits in a glass medallion above the headline. */
export function ToolHero({ slug, name, headline, tagline, kind }: { slug: string; name: string; headline: string; tagline: string; kind: ToolKind }) {
  const reduce = useReducedMotion();
  const fade = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay: d, ease: EASE },
  });
  return (
    <section className="no-print relative pt-12 sm:pt-16" data-print-hide>
      <div className="mx-auto max-w-[1000px] px-4 text-center">
        <motion.div {...fade(0)} className="flex items-center justify-center gap-3">
          <Link href="/tools" className="rounded-md bg-[#e9e3d5] px-2.5 py-1 text-[12.5px] text-ds-ink-2 transition-colors hover:text-ds-ink">
            Tools
          </Link>
          <span className="text-ds-ink-3">/</span>
          <span className="rounded-md bg-[#e9e3d5] px-2.5 py-1 text-[12.5px] text-ds-ink">{name}</span>
        </motion.div>
        <motion.div {...fade(0.1)} className="mx-auto mt-8 flex h-[76px] w-[76px] items-center justify-center rounded-full">
          <span className="glass-strong relative flex h-[76px] w-[76px] items-center justify-center rounded-full">
            <svg viewBox="0 0 76 76" className="absolute inset-0 h-full w-full animate-[spin_40s_linear_infinite]" aria-hidden>
              {Array.from({ length: 36 }, (_, i) => (
                <line key={i} x1="38" y1="3" x2="38" y2={i % 3 === 0 ? 8 : 6} stroke="rgba(43,41,39,.22)" strokeWidth=".8" transform={`rotate(${i * 10} 38 38)`} />
              ))}
            </svg>
            <ToolGlyph slug={slug} className="h-8 w-8" />
          </span>
        </motion.div>
        <motion.h1 {...fade(0.2)} className="mt-7 text-balance font-serif text-[46px] leading-[1] tracking-[-0.025em] text-ds-ink sm:text-[68px] lg:text-[80px]">
          {splitHeadline(headline).map((p, i) => (
            <span key={i} className={p.accent ? "italic" : undefined}>
              {p.text}
            </span>
          ))}
        </motion.h1>
        <motion.p {...fade(0.35)} className="mx-auto mt-6 max-w-[560px] text-pretty text-[17px] leading-[1.55] text-ds-ink-2">
          {tagline}
        </motion.p>
        <motion.ul {...fade(0.45)} className="mt-6 flex flex-wrap justify-center gap-2">
          {CHIPS[kind].map((c) => (
            <li key={c} className="glass-inset inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-[12.5px] text-ds-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ds-accent" /> {c}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/** The painted panel the tool lives in: sky behind, branches drifting at the edges, glass on top. */
export function ToolStage({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const leaf = useTransform(scrollY, [0, 1200], [0, reduce ? 0 : -120]);
  return (
    <section className="relative mt-14 px-2 sm:px-5 print:mt-0 print:px-0">
      <motion.div style={{ y: leaf }} className="no-print pointer-events-none absolute -left-10 -top-36 z-0 hidden h-[640px] w-[260px] overflow-hidden [mask-image:linear-gradient(#000_70%,transparent)] sm:block lg:w-[320px]" data-print-hide>
        <PaintedFoliage variant="a" side="left" priority />
      </motion.div>
      <motion.div style={{ y: leaf }} className="no-print pointer-events-none absolute -right-14 top-24 z-0 hidden h-[560px] w-[240px] overflow-hidden [mask-image:linear-gradient(#000_65%,transparent)] lg:block" data-print-hide>
        <PaintedFoliage variant="b" side="right" />
      </motion.div>
      <div className="relative z-[1] mx-auto max-w-[1440px] overflow-hidden rounded-[24px] sm:rounded-[30px] print:overflow-visible print:rounded-none">
        <div className="no-print" data-print-hide>
          <PaintedSky name="hero" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(242,239,229,0)_60%,rgba(242,239,229,0.5))]" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1140px] px-3 py-8 sm:px-8 sm:py-14 print:p-0">{children}</div>
      </div>
    </section>
  );
}

export function ToolFaq({ faq }: { faq: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-24 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <h2 className="font-serif text-[44px] leading-[1.02] tracking-[-0.025em] sm:text-[56px]">
        Questions, <span className="italic">answered</span>
      </h2>
      <div className="glass overflow-hidden rounded-[24px]">
        {faq.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-b border-white/60 last:border-b-0">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[17px] font-medium tracking-[-0.015em]">
                {f.q}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-all duration-300 ${isOpen ? "rotate-180 bg-ds-accent" : "glass-inset"}`}>
                  <IconChevron className="h-4 w-4" />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                    <p className="px-6 pb-6 text-[15.5px] leading-7 text-ds-ink-2">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
