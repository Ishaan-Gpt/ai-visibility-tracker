"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { AppMock } from "@/components/landing/AppMock";
import { PaintedFoliage, PaintedSky } from "@/components/landing/Painted";
import { btnPrimary, btnSecondary, Lede } from "@/components/landing/ui";
import { IconLoupe } from "@/components/icons/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const { scrollY } = useScroll();
  const leafL = useTransform(scrollY, [0, 900], [0, reduce ? 0 : -90]);
  const leafR = useTransform(scrollY, [0, 900], [0, reduce ? 0 : -140]);
  const mockY = useTransform(scrollY, [0, 900], [0, reduce ? 0 : -40]);

  const go = (target: string) => router.push(`/tools/page-audit?url=${encodeURIComponent(target)}&run=1`);

  const fade = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 1, delay: d, ease: EASE },
  });

  return (
    <section className="relative pt-12 sm:pt-16">
      <div className="mx-auto max-w-[1200px] px-4 text-center">
        <motion.span {...fade(0)} className="inline-flex items-center gap-2 rounded-md bg-[#e9e3d5] px-2.5 py-1 text-[12.5px] text-ds-ink-2">
          Built for:
          <span className="inline-flex items-center gap-1 text-ds-ink">
            <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-ds-accent text-[10px] font-semibold text-ds-ink">S</span>
            Agencies &amp; freelancers
          </span>
        </motion.span>

        <h1 className="relative mx-auto mt-7 flex items-center justify-center gap-[0.18em] font-serif text-[40px] leading-none tracking-[-0.03em] text-ds-ink sm:text-[84px] lg:text-[104px]">
          <motion.span
            aria-hidden
            initial={reduce ? false : { x: "1.6em", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.3, delay: 0.15, ease: EASE }}
            className="font-light text-ds-ink/85 sm:mr-[0.35em]"
          >
            (
          </motion.span>
          <motion.span {...fade(0.35)} className="whitespace-nowrap">
            See what <span className="italic">AI sees</span>
          </motion.span>
          <motion.span
            aria-hidden
            initial={reduce ? false : { x: "-1.6em", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.3, delay: 0.15, ease: EASE }}
            className="font-light text-ds-ink/85 sm:ml-[0.35em]"
          >
            )
          </motion.span>
        </h1>

        <motion.div {...fade(0.55)}>
          <Lede className="mt-6">
            Free SEO tools that audit any page in seconds, check whether ChatGPT, Gemini and Perplexity can cite it, and hand you a report your client will actually read
          </Lede>
          <Link href="/tools/page-audit" className={`${btnPrimary} mt-8 h-12 px-6`}>
            Run a free audit
          </Link>
        </motion.div>
      </div>

      {/* painted panel */}
      <motion.div {...fade(0.8)} className="relative mx-auto mt-16 max-w-[1440px] px-3 sm:px-5">
        <motion.div style={{ y: leafL }} className="pointer-events-none absolute -left-16 -top-32 z-20 w-[130px] sm:-left-10 sm:-top-40 sm:w-[300px] lg:-left-4 lg:w-[360px]">
          <PaintedFoliage variant="a" side="left" priority />
        </motion.div>
        <motion.div style={{ y: leafR }} className="pointer-events-none absolute -right-12 top-24 z-20 hidden w-[180px] sm:block sm:w-[260px] lg:-right-4 lg:w-[320px]">
          <PaintedFoliage variant="b" side="right" priority />
        </motion.div>

        <div className="relative overflow-hidden rounded-[22px] sm:rounded-[28px]">
          <PaintedSky name="hero" priority />
          <div className="relative z-10 mx-auto max-w-[960px] px-3 pt-10 sm:px-8 sm:pt-16">
            <motion.div style={{ y: mockY }}>
              <AppMock />
            </motion.div>
          </div>
          <div className="relative z-10 mx-auto flex max-w-[960px] flex-col gap-4 px-4 pb-8 pt-8 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="text-left">
              <p className="text-[16px] font-medium text-ds-ink">Want to check your own site?</p>
              <p className="max-w-[360px] text-[13.5px] leading-5 text-ds-ink-2">Paste any URL and watch seowise score it, find the fixes and check AI access, instantly.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (url.trim()) go(url.trim());
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <label className="flex h-11 items-center gap-2 rounded-[10px] bg-[#faf8f2]/85 px-3 backdrop-blur focus-within:ring-2 focus-within:ring-ds-accent">
                <IconLoupe className="h-4 w-4 text-ds-ink-2" />
                <span className="sr-only">Website URL</span>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourclient.com" inputMode="url" spellCheck={false} className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ds-ink-3 sm:w-[170px]" />
              </label>
              <button type="submit" className={btnPrimary}>
                Audit it
              </button>
              <button type="button" onClick={() => go("en.wikipedia.org/wiki/Search_engine_optimization")} className={btnSecondary}>
                Try a sample
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
