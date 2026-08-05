"use client";

import { motion } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { PageLoader } from "@/components/tools/shared/motion/PageLoader";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const SURFACES = ["Google rich results", "Gemini & ChatGPT answers", "Site crawlers", "Human visitors"];

export function Hero() {
  return (
    <>
      <PageLoader label="OPENSEO" />
      <SectionShell height="full" className="items-center">
        <div className="grid items-center gap-16 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-6 font-body text-xs uppercase tracking-[0.25em] text-primary md:whitespace-nowrap">
              One suite for the whole search surface
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
              <RevealText text="Search stopped being" className="block" />
              <RevealText text="one thing." delay={0.1} className="block" />
              <RevealText text="Your tooling should too." delay={0.2} className="block text-foreground/40" />
            </h1>
            <p className="mt-8 max-w-md font-body text-base text-foreground/60 md:text-lg">
              OpenSeo is a suite of tools covering structured data, discoverability, content quality, and AI
              answer-engine visibility — built with the same rigor as the software you'd pay for.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton href="/tools/schema-generator">Try a tool free</MagneticButton>
              <MagneticButton href="/tools/opengeo" tone="ghost">
                Explore OpenGeo
              </MagneticButton>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.7 }}>
            <GlassCard className="p-6 md:p-8">
              <p className="mb-4 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">Covers every surface</p>
              <ul className="space-y-3">
                {SURFACES.map((s) => (
                  <li key={s} className="flex items-center gap-2.5 font-body text-sm text-foreground/80">
                    <CheckRingIcon className="h-4 w-4 shrink-0 text-primary" />
                    {s}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        </div>
      </SectionShell>
    </>
  );
}
