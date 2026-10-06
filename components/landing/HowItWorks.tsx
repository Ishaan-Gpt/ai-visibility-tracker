"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { IconCheckCircle } from "@/components/icons/Icons";
import { PaintedSky } from "@/components/landing/Painted";
import { Verdict } from "@/components/tools/page-audit/PageAuditWorkspace";
import { LiveBots, LiveStages } from "@/components/landing/Live";
import { SAMPLE_AUDIT } from "@/lib/samples";
import { ScrollFill } from "@/components/landing/ScrollFill";
import { Lede } from "@/components/landing/ui";

const EASE = [0.22, 1, 0.36, 1] as const;
const CYCLE_MS = 6500;

const STEPS = [
  {
    title: "Paste a URL, nothing else",
    body: "No account, no crawl setup, no waiting on a queue.",
    points: ["Any public page or domain", "Results in about five seconds"],


  },
  {
    title: "The verdict comes first, the detail second",
    body: "No forty-page export. A plain-English verdict, then fixes ranked by impact.",
    points: ["Top five fixes across SEO and AI", "Exact change to make for each"],


  },
  {
    title: "See the page the way AI search does",
    body: "Every tool also answers: can ChatGPT, Gemini and Perplexity reach, read and cite this?",
    points: ["AI crawler access, path by path", "Text readable without JavaScript"],


  },
  {
    title: "Hand the client a report in one click",
    body: "A clean, branded PDF that explains itself, so the call is about the work, not the jargon.",
    points: ["Export from any result", "Save reports to your account"],


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

        <div className="relative min-h-[460px] overflow-hidden rounded-[20px] sm:min-h-[500px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={active} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: EASE }}>
              <PaintedSky name={`step-${active + 1}` as "step-1"} />
            </motion.div>
          </AnimatePresence>
          <div className="relative z-10 flex h-full min-h-[460px] items-center justify-center p-4 sm:min-h-[500px] sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`ui-${active}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="w-full max-w-[600px]"
              >
                <StepUI step={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The real seowise components for each step, fed with sample data. */
function StepUI({ step }: { step: number }) {
  if (step === 0) return <LiveStages />;
  if (step === 1) return <Verdict report={SAMPLE_AUDIT} demo />;
  if (step === 2) return <LiveBots />;
  return (
    <div className="relative mx-auto max-w-[520px] rotate-[-2deg] rounded-[6px] bg-white p-5 shadow-[0_40px_80px_-36px_rgba(43,41,39,0.6)] transition-transform duration-700 ease-[var(--ds-ease)] hover:rotate-0">
      <div className="mb-3 flex items-center justify-between border-b border-black/10 pb-2">
        <span className="font-serif text-[18px] italic">seowise</span>
        <span className="text-[10px] text-black/45">Page audit · northside-dental.example</span>
      </div>
      <div className="origin-top-left scale-[0.78] [width:128%]">
        <Verdict report={SAMPLE_AUDIT} demo />
      </div>
    </div>
  );
}

