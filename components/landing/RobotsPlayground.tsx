"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { BotGroup } from "@/components/tools/ai-crawlers/AiCrawlerWorkspace";
import { Dial } from "@/components/studio/Pieces";
import { SAMPLE_ROBOTS_LINES, botsFor } from "@/lib/samples";

/*
 * Scroll types out a robots.txt line by line; the real parser re-evaluates every AI crawler as each line lands.
 * Any line can be clicked off and on. The score uses the same weights as AI Crawler Check.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function readiness(robots: string) {
  const bots = botsFor(robots);
  const blockedSearch = bots.filter((b) => (b.purpose === "ai-search" || b.purpose === "ai-user") && b.access === "blocked").length;
  const google = bots.find((b) => b.agent === "Googlebot")?.access === "blocked";
  let score = 100 - blockedSearch * 18 - (google ? 30 : 0) - 5; // -5: no llms.txt in this sample
  score = Math.max(0, Math.min(100, score));
  return { bots, score, blockedSearch };
}

function caption(visible: string[], blockedSearch: number) {
  const has = (agent: string) => visible.some((l) => l === `User-agent: ${agent}`);
  if (blockedSearch > 0) return "That line removed you from ChatGPT and Perplexity answers. Training bots and search bots are not the same thing.";
  if (has("GPTBot")) return "Blocking GPTBot only opts you out of model training. You are still visible in AI search.";
  return "Every crawler is welcome, apart from your admin pages.";
}

export function RobotsPlayground() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [shown, setShown] = useState(reduce ? SAMPLE_ROBOTS_LINES.length : 2);
  const [off, setOff] = useState<Set<number>>(new Set());
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (reduce) return;
    setShown(Math.max(2, Math.min(SAMPLE_ROBOTS_LINES.length, Math.ceil(p * 1.25 * SAMPLE_ROBOTS_LINES.length))));
  });

  const visibleLines = SAMPLE_ROBOTS_LINES.slice(0, shown);
  const active = visibleLines.filter((_, i) => !off.has(i));
  const { bots, score, blockedSearch } = readiness(active.join("\n"));

  const toggle = (i: number) =>
    setOff((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <section ref={ref} className="relative lg:h-[320vh]">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:items-center">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-24 sm:px-6 lg:py-0">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-serif text-[46px] leading-[1.02] tracking-[-0.025em] sm:text-[60px] lg:text-[68px]">
              <span className="block">One file decides</span>
              <span className="block italic">who reads you</span>
            </h2>
            <div className="flex items-center gap-4">
              <Dial value={score} size={96} />
              <p className="max-w-[230px] text-[14px] leading-5 text-ds-ink-2">
                AI-ready score for this robots.txt, recalculated as you go
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            {/* the file */}
            <div className="glass-strong overflow-hidden rounded-[22px]">
              <div className="flex items-center justify-between border-b border-white/60 px-5 py-3">
                <span className="font-mono text-[12.5px] text-ds-ink-2">northside-dental.example/robots.txt</span>
                <span className="text-[12px] text-ds-ink-3">tap a line to switch it off</span>
              </div>
              <ol className="max-h-[52svh] overflow-y-auto py-3 font-mono text-[13.5px] leading-7 [scrollbar-width:none]">
                <AnimatePresence initial={false}>
                  {visibleLines.map((line, i) => {
                    const isOff = off.has(i);
                    const isNew = i === shown - 1 && !reduce;
                    return (
                      <motion.li
                        key={i}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="grid grid-cols-[36px_1fr]"
                      >
                        <span className="select-none pr-3 text-right text-ds-ink-3">{i + 1}</span>
                        {line ? (
                          <button
                            type="button"
                            onClick={() => toggle(i)}
                            aria-pressed={!isOff}
                            className={`mr-3 rounded-[6px] px-2 text-left transition-colors hover:bg-white/60 ${isOff ? "text-ds-ink-3 line-through decoration-ds-accent" : /^Disallow: \/$/.test(line) ? "text-[#b23a2a]" : "text-ds-ink"}`}
                          >
                            {isOff ? `# ${line}` : line}
                            {isNew && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-pulse bg-ds-ink" />}
                          </button>
                        ) : (
                          <span>&nbsp;</span>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ol>
              <AnimatePresence mode="wait">
                <motion.p
                  key={caption(active, blockedSearch)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="border-t border-white/60 px-5 py-4 font-serif text-[20px] leading-6 text-ds-ink"
                >
                  {caption(active, blockedSearch)}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* the readers */}
            <div className="grid gap-4 sm:grid-cols-2 lg:max-h-[66svh] lg:overflow-y-auto lg:[scrollbar-width:none]">
              <BotGroup purpose="ai-search" bots={bots.filter((b) => b.purpose === "ai-search")} />
              <BotGroup purpose="ai-training" bots={bots.filter((b) => b.purpose === "ai-training").slice(0, 4)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
