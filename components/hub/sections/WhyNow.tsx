"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";

const QUERIES = [
  "best project management tool 2026",
  "is [your brand] worth it",
  "alternatives to [competitor]",
  "how does [your product] compare",
];

export function WhyNow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % QUERIES.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <SectionShell className="min-h-[85dvh] flex flex-col justify-center border-t border-foreground/10">
      <div className="grid gap-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
            Why this suite exists now
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="People stopped clicking ten blue links." />
          </h2>
          <p className="mt-6 max-w-md font-body text-foreground/60">
            They ask an AI model and take the first answer. That answer is built from the same structured signals
            SEO has always cared about — just read by a model instead of a ranking algorithm.
          </p>
        </div>

        <GlassCard className="p-8">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">Someone is asking, right now</p>
          <div className="flex h-20 items-center rounded-xl border border-foreground/10 bg-white px-5">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-sm text-foreground/70"
              >
                &ldquo;{QUERIES[index]}&rdquo;
              </motion.p>
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>
    </SectionShell>
  );
}
