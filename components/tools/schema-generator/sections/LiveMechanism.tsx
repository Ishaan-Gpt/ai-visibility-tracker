"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { ProductIcon, CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const FIELDS = ["name", "image", "offers.price", "offers.availability", "aggregateRating"];
const STEP_DURATION = 1900;

export function LiveMechanism() {
  const [filledCount, setFilledCount] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (filledCount > FIELDS.length) {
      const reset = setTimeout(() => {
        setFilledCount(0);
        setCycle((c) => c + 1);
      }, STEP_DURATION * 1.6);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setFilledCount((n) => n + 1), STEP_DURATION);
    return () => clearTimeout(t);
  }, [filledCount]);

  const score = Math.min(100, Math.round((filledCount / FIELDS.length) * 98) + (filledCount > 0 ? 12 : 0));

  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Watch it work
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Every field maps to a real Google requirement." />
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_0.8fr]">
        <GlassCard className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2 text-foreground/40">
            <ProductIcon className="h-4 w-4" />
            <span className="font-body text-xs uppercase tracking-[0.1em]">Product entity</span>
          </div>
          <ul className="space-y-3">
            {FIELDS.map((field, i) => (
              <li key={`${field}-${cycle}`} className="flex items-center justify-between border-b border-foreground/5 pb-3">
                <span className="font-mono text-sm text-foreground/70">{field}</span>
                <AnimatePresence mode="wait">
                  {i < filledCount ? (
                    <motion.span
                      key="filled"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-primary"
                    >
                      <CheckRingIcon className="h-4 w-4" />
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
          <p className="font-body text-xs uppercase tracking-[0.15em] text-foreground/40">Completeness score</p>
          <motion.span
            key={score}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="font-display text-6xl text-foreground"
          >
            {score}
          </motion.span>
          <AnimatePresence>
            {filledCount >= FIELDS.length ? (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-body text-xs text-primary"
              >
                <CheckRingIcon className="h-3.5 w-3.5" /> Rich result eligible
              </motion.p>
            ) : (
              <p className="font-body text-xs text-foreground/40">Filling required fields…</p>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </SectionShell>
  );
}
