"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { GaugeIcon, CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const PHRASES = [
  { phrase: "ai visibility", count: 6 },
  { phrase: "search engines", count: 4 },
  { phrase: "schema markup", count: 3 },
  { phrase: "seo seo seo", count: 9 },
];
const STEP_DURATION = 900;

export function LiveMechanism() {
  const [revealed, setRevealed] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (revealed > PHRASES.length) {
      const reset = setTimeout(() => {
        setRevealed(0);
        setCycle((c) => c + 1);
      }, STEP_DURATION * 2);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setRevealed((n) => n + 1), STEP_DURATION);
    return () => clearTimeout(t);
  }, [revealed]);

  const flagged = revealed > PHRASES.length;

  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Watch it work
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Paste your draft, see what you're repeating." />
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_0.8fr]">
        <GlassCard className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2 text-foreground/40">
            <GaugeIcon className="h-4 w-4" />
            <span className="font-body text-xs uppercase tracking-[0.1em]">Top phrases</span>
          </div>
          <ul className="space-y-3">
            {PHRASES.map((row, i) => (
              <li key={`${row.phrase}-${cycle}`} className="flex items-center justify-between border-b border-foreground/5 pb-3">
                <span className="font-mono text-sm text-foreground/70">{row.phrase}</span>
                <AnimatePresence mode="wait">
                  {i < revealed ? (
                    <motion.span
                      key="revealed"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-full px-2 py-0.5 font-body text-[11px] ${
                        row.phrase === "seo seo seo" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {row.count}×
                    </motion.span>
                  ) : (
                    <span className="h-1.5 w-10 rounded-full bg-foreground/10" />
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="font-body text-xs uppercase tracking-[0.15em] text-foreground/40">Content health</p>
          <motion.span key={flagged ? "flagged" : "ok"} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-display text-6xl text-foreground">
            {flagged ? 62 : 91}
          </motion.span>
          <AnimatePresence mode="wait">
            {flagged ? (
              <motion.p
                key="flag"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-full bg-red-500/10 px-3 py-1 font-body text-xs text-red-500"
              >
                Stuffing risk: "seo"
              </motion.p>
            ) : (
              <motion.p
                key="ok"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-body text-xs text-primary"
              >
                <CheckRingIcon className="h-3.5 w-3.5" /> Reads naturally
              </motion.p>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </SectionShell>
  );
}
