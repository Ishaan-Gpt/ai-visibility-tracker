"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { PageLoader } from "@/components/tools/shared/motion/PageLoader";

export function OpeningMark() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= 7) return;
    const t = setTimeout(() => setCount((n) => n + 1), 1900 + count * 350);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <>
      <PageLoader label="KEYWORD DENSITY" />
      <SectionShell height="full" className="items-center">
        <div className="grid items-center gap-16 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-6 font-body text-xs uppercase tracking-[0.25em] text-primary md:whitespace-nowrap">
              There's no magic percentage
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
              <RevealText as="span" text="Density isn't the metric." className="block" />
              <br />
              <RevealText as="span" text="Natural writing is." delay={0.15} className="block text-foreground/40" />
            </h1>
            <p className="mt-8 max-w-md font-body text-base text-foreground/60 md:text-lg">
              Google has said there's no ideal keyword density. What actually matters: readability,
              vocabulary diversity, and whether you're accidentally repeating a phrase too often.
            </p>
            <div className="mt-10">
              <MagneticButton href="/tools/keyword-density-checker/build">Analyze my content — free</MagneticButton>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.7, ease: "easeOut" }}>
            <GlassCard className="p-6 font-mono text-[13px] leading-relaxed text-foreground/80 md:p-8">
              <p className="mb-3 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">Top phrases</p>
              {["ai visibility", "schema markup", "search engines", "structured data", "ai search", "sitemap file", "content quality"]
                .slice(0, count)
                .map((phrase, i) => (
                  <p key={phrase} className="flex items-center justify-between border-b border-foreground/5 py-1.5 last:border-0">
                    <span>{phrase}</span>
                    <span className="text-foreground/40">{(7 - i) * 0.6}%</span>
                  </p>
                ))}
            </GlassCard>
          </motion.div>
        </div>
      </SectionShell>
    </>
  );
}
