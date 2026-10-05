"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { IconCheckCircle } from "@/components/icons/Icons";
import { PaintedSky } from "@/components/landing/Painted";
import { ScrollFill } from "@/components/landing/ScrollFill";
import { Lede } from "@/components/landing/ui";

const EASE = [0.22, 1, 0.36, 1] as const;
const CYCLE_MS = 6500;

const STEPS = [
  {
    title: "Paste a URL, nothing else",
    body: "No account, no crawl setup, no waiting on a queue.",
    points: ["Any public page or domain", "Results in about five seconds"],
    chip: "Fetching page · robots.txt · llms.txt",
    card: { k: "Fetched", v: "northside-dental.example", s: "HTTP 200 · 640 ms" },


  },
  {
    title: "The verdict comes first, the detail second",
    body: "No forty-page export. A plain-English verdict, then fixes ranked by impact.",
    points: ["Top five fixes across SEO and AI", "Exact change to make for each"],
    chip: "3 fixes · ordered by impact",
    card: { k: "Verdict", v: "Needs work.", s: "SEO 72 · AI ready 58" },


  },
  {
    title: "See the page the way AI search does",
    body: "Every tool also answers: can ChatGPT, Gemini and Perplexity reach, read and cite this?",
    points: ["AI crawler access, path by path", "Text readable without JavaScript"],
    chip: "OAI-SearchBot · blocked",
    card: { k: "AI lens", v: "1 crawler blocked", s: "Fix: one line in robots.txt" },


  },
  {
    title: "Hand the client a report in one click",
    body: "A clean, branded PDF that explains itself, so the call is about the work, not the jargon.",
    points: ["Export from any result", "Save reports to your account"],
    chip: "seowise-audit.pdf · ready",
    card: { k: "Report", v: "Ready to send", s: "2 pages · A4" },


  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || paused || reduce) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), CYCLE_MS);
    return () => clearTimeout(t);
  }, [active, inView, paused, reduce]);

  const s = STEPS[active];

  return (
    <section id="how" className="scroll-mt-24 py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6">
        <h2 className="font-serif text-[46px] leading-[1.02] tracking-[-0.025em] sm:text-[64px] lg:text-[76px]">
          <span className="block">Hours of auditing,</span>
          <ScrollFill text="done in seconds" className="block italic" />
        </h2>
        <Lede className="mt-6">Every finding says where it came from. seowise does the checking, you keep the judgement and the client relationship</Lede>
      </div>

      <div ref={ref} className="mx-auto mt-16 grid max-w-[1200px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <ol className="lg:pr-6">
          {STEPS.map((step, i) => {
            const on = i === active;
            return (
              <li key={step.title} className="relative border-t border-ds-line">
                {on && !reduce && !paused && (
                  <motion.span key={`bar-${active}`} className="absolute -top-px left-0 h-px bg-ds-ink" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: CYCLE_MS / 1000, ease: "linear" }} />
                )}
                <button type="button" onClick={() => setActive(i)} aria-expanded={on} className="grid w-full grid-cols-[36px_1fr] gap-x-2 py-5 text-left">
                  <span className="pt-1 font-mono text-[11.5px] text-[#5c7c68]">0{i + 1}</span>
                  <span className={`text-[18px] font-medium leading-6 tracking-[-0.015em] transition-colors duration-300 ${on ? "text-ds-ink" : "text-ds-ink/75 hover:text-ds-ink"}`}>{step.title}</span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden">
                      <div className="pb-6 pl-[44px]">
                        <p className="text-[14.5px] leading-6 text-ds-ink-2">{step.body}</p>
                        <ul className="mt-4 space-y-2">
                          {step.points.map((pt) => (
                            <li key={pt} className="flex items-center gap-2.5 text-[14px] text-ds-ink">
                              <IconCheckCircle className="h-4 w-4 text-[#5c7c68]" /> {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>

        <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] sm:aspect-[16/11]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={active} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: EASE }}>
              <PaintedSky name={`step-${active + 1}` as "step-1"} />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-0 top-5 z-10 flex items-center justify-between px-5">
            <AnimatePresence mode="wait">
              <motion.span key={`chip-${active}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }} className="rounded-md bg-[#faf8f2]/70 px-2.5 py-1 text-[11.5px] text-ds-ink-2 backdrop-blur">
                {s.chip}
              </motion.span>
            </AnimatePresence>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#faf8f2]/70 px-2 py-1 text-[11.5px] text-ds-ink-2 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#5c7c68]/60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#5c7c68]" />
              </span>
              Live
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${active}`}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="absolute bottom-6 left-1/2 z-10 w-[78%] max-w-[360px] -translate-x-1/2 rounded-[14px] bg-[#faf8f2]/90 p-5 text-left shadow-[0_30px_60px_-30px_rgba(43,41,39,0.5)] backdrop-blur"
            >
              <p className="text-[11.5px] text-ds-ink-3">{s.card.k}</p>
              <p className="mt-1 font-serif text-[28px] leading-none text-ds-ink">{s.card.v}</p>
              <p className="mt-2 text-[12.5px] text-ds-ink-2">{s.card.s}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
