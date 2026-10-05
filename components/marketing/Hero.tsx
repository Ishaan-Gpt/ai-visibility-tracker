"use client";

import { ToolGlyph } from "@/components/icons/ToolGlyphs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ScanSearch } from "lucide-react";
import { EASE, Magnetic, SplitReveal } from "@/components/ds/motion";
import { TOOLS } from "@/lib/tools/registry";

export function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const lift = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -60]);
  const fade = useTransform(scrollY, [0, 500], [1, reduce ? 1 : 0.3]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = url.trim();
    router.push(clean ? `/tools/page-audit?url=${encodeURIComponent(clean)}&run=1` : "/tools/page-audit");
  }

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,90,31,0.22),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(22,17,13,0.06) 1px, transparent 1px)",
            backgroundSize: "calc(100% / 12) 100%",
            maskImage: "linear-gradient(to bottom, #000, transparent 85%)",
          }}
        />
      </div>

      <motion.div style={{ y: lift, opacity: fade }} className="relative mx-auto w-full max-w-[1200px] px-4 pb-16 pt-14 sm:px-6 sm:pt-20 md:pb-24 lg:px-8 lg:pt-28">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-ds-line bg-ds-surface/70 py-1 pl-1 pr-3 text-[13px] text-ds-ink-2 backdrop-blur"
        >
          <span className="rounded-full bg-ds-ink px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#fffcf6]">Free</span>
          SEO tools for agencies &amp; freelancers
        </motion.p>

        <SplitReveal
          text="Paste a URL. Get the {fixes.} Send the {report.}"
          delay={0.1}
          className="mt-7 max-w-[1100px] text-balance text-[48px] font-medium leading-[0.94] tracking-[-0.055em] text-ds-ink sm:text-[76px] lg:text-[112px]"
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
          className="mt-8 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div className="max-w-[640px]">
            <p className="text-pretty text-[18px] leading-7 text-ds-ink-2 sm:text-[20px] sm:leading-8">
              Every result leads with a verdict and the top fixes, checks whether ChatGPT, Gemini and Perplexity can use the page, and exports to a PDF your client
              will actually read. No signup.
            </p>
            <form
              onSubmit={submit}
              className="group mt-8 flex flex-col gap-2 rounded-[24px] border border-ds-line-strong bg-ds-surface p-2 shadow-ds-pop transition-[border-color,box-shadow] duration-300 focus-within:border-ds-ink focus-within:shadow-[0_0_0_6px_rgba(255,90,31,0.18),var(--ds-shadow-pop)] sm:flex-row sm:items-center sm:rounded-full"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 pl-3 sm:pl-4">
                <ScanSearch className="h-5 w-5 shrink-0 text-ds-ink-3 transition-colors group-focus-within:text-ds-accent" strokeWidth={1.75} />
                <span className="sr-only">Website or page URL</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yourclient.com/services"
                  inputMode="url"
                  autoComplete="url"
                  spellCheck={false}
                  className="h-12 min-w-0 flex-1 bg-transparent text-[17px] text-ds-ink outline-none placeholder:text-ds-ink-3"
                />
              </label>
              <Magnetic strength={0.18}>
                <button
                  type="submit"
                  className="group/b inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ds-accent pl-6 pr-2 text-[15px] font-medium text-ds-night transition-[background-color,transform] duration-200 hover:bg-[var(--ds-accent-hover)] active:scale-[0.97] sm:w-auto"
                >
                  Run free audit
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ds-night text-ds-accent transition-transform duration-300 group-hover/b:rotate-[-45deg]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </Magnetic>
            </form>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 pl-2 text-[13px] text-ds-ink-3">
              <span>✓ No account needed</span>
              <span>✓ SEO + AI-readiness score</span>
              <span>✓ PDF export</span>
            </p>
          </div>

          <div className="hidden lg:block">
            <div className="flex flex-col items-end gap-1 text-right font-mono text-[12px] uppercase tracking-[0.14em] text-ds-ink-3">
              <span>{TOOLS.length} tools</span>
              <span>0 signups required</span>
              <span>1 lens for AI search</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <Marquee />
    </section>
  );
}

function Marquee() {
  const items = [...TOOLS, ...TOOLS];
  return (
    <div className="relative border-y border-ds-line bg-ds-surface/60 py-4" aria-hidden>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ds-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ds-canvas to-transparent" />
      <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-3 whitespace-nowrap text-[18px] font-medium tracking-[-0.03em] text-ds-ink-2">
            <ToolGlyph slug={t.slug} className="h-4 w-4" />
            {t.name}
            <span className="ml-7 h-1 w-1 rounded-full bg-ds-ink-3" />
          </span>
        ))}
      </div>
    </div>
  );
}
