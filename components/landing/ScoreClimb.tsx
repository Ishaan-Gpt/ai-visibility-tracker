"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { TopFixes, Verdict } from "@/components/tools/page-audit/PageAuditWorkspace";
import { SAMPLE_AUDIT, scoresWith } from "@/lib/samples";

/*
 * Scroll-driven: as the section passes, the real Top Fixes list ticks off one fix at a time and the real
 * Verdict re-scores live. Clicking any fix takes over manual control.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export function ScoreClimb() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [auto, setAuto] = useState(0);
  const [manual, setManual] = useState<Set<number> | null>(null);
  useMotionValueEvent(scrollYProgress, "change", (p) => setAuto(Math.max(0, Math.min(5, Math.floor((p - 0.08) * 6.4)))));

  const fixed = useMemo(() => manual ?? new Set(Array.from({ length: reduce ? 0 : auto }, (_, i) => i)), [manual, auto, reduce]);
  const { seo, ai } = scoresWith(fixed);
  const report = useMemo(() => ({ ...SAMPLE_AUDIT, score: seo, ai: { ...SAMPLE_AUDIT.ai, score: ai } }), [seo, ai]);

  const toggle = (i: number) =>
    setManual((prev) => {
      const n = new Set(prev ?? fixed);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <section ref={ref} className="relative lg:h-[300vh]">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:items-center">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:py-0">
          <div className="lg:pt-6">
            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE }}
              className="font-serif text-[46px] leading-[1.02] tracking-[-0.025em] sm:text-[60px] lg:text-[68px]"
            >
              <span className="block">Fix a few things,</span>
              <span className="block italic">watch it climb</span>
            </motion.h2>
            <p className="mt-5 max-w-[460px] text-[16.5px] leading-7 text-ds-ink-2">
              The fixes are ordered by impact, so the first ones move the score most. Scroll to apply them, or tap any fix to try your own order.
            </p>
            <div className="mt-8">
              <Verdict report={report} demo compact />
            </div>
            {manual && (
              <button type="button" onClick={() => setManual(null)} className="mt-4 text-[13px] text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline">
                Back to scroll mode
              </button>
            )}
          </div>
          <div className="lg:max-h-[86svh] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:none]">
            <TopFixes report={SAMPLE_AUDIT} fixed={fixed} onToggle={toggle} />
          </div>
        </div>
      </div>
    </section>
  );
}
