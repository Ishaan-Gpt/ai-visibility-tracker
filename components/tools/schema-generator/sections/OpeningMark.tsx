"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { PageLoader } from "@/components/tools/shared/motion/PageLoader";

const SNIPPET_LINES = [
  '"@context": "https://schema.org",',
  '"@type": "Organization",',
  '"name": "Your Brand",',
  '"knowsAbout": "AI Search Visibility"',
];

export function OpeningMark() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= SNIPPET_LINES.length) return;
    const t = setTimeout(() => setVisibleLines((n) => n + 1), 1800 + visibleLines * 420);
    return () => clearTimeout(t);
  }, [visibleLines]);

  return (
    <>
      <PageLoader label="SCHEMA GENERATOR" />
      <SectionShell height="full" className="items-center">
        <div className="grid items-center gap-16 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-6 font-body text-xs uppercase tracking-[0.25em] text-primary md:whitespace-nowrap">
              Structured data, understood by Google &amp; Gemini
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
              <RevealText as="span" text="Your site has a story." className="block" />
              <br />
              <RevealText as="span" text="Search engines can't read it." delay={0.15} className="block text-foreground/40" />
            </h1>
            <p className="mt-8 max-w-md font-body text-base text-foreground/60 md:text-lg">
              Structured data is the difference between a blue link and a rich result — and between being invisible
              to AI answer engines or being the source they cite.
            </p>
            <div className="mt-10">
              <MagneticButton href="/tools/schema-generator/build">Build my schema — free</MagneticButton>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.7, ease: "easeOut" }}
          >
            <GlassCard className="p-6 font-mono text-[13px] leading-relaxed text-foreground/80 md:p-8">
              <div className="mb-3 flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              </div>
              <p className="text-foreground/40">{"<script type=\"application/ld+json\">"}</p>
              <p>{"{"}</p>
              {SNIPPET_LINES.map((line, i) => (
                <p key={line} className={`pl-4 transition-opacity duration-300 ${i < visibleLines ? "opacity-100" : "opacity-0"}`}>
                  {line}
                </p>
              ))}
              <p>{"}"}</p>
              <p className="text-foreground/40">{"</script>"}</p>
            </GlassCard>
          </motion.div>
        </div>
      </SectionShell>
    </>
  );
}
