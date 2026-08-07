"use client";

import { motion } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { PageLoader } from "@/components/tools/shared/motion/PageLoader";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const SURFACES = [
  "Google rich results & SERPs",
  "Gemini & ChatGPT Search answers",
  "Automated XML & HTML sitemaps",
  "Schema markup graphs",
  "Real-time keyword density audits",
];

export function Hero({ onStart }: { onStart?: () => void }) {
  return (
    <>
      <PageLoader label="OMNI SEO" />
      <SectionShell height="full" className="items-center">
        <div className="grid items-center gap-16 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#FFD209]/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">
              ⚡ All 5 AI Search &amp; Visibility Tools in One Suite
            </div>

            <h1 className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
              <RevealText text="Search stopped being" className="block" />
              <RevealText text="one thing." delay={0.1} className="block" />
              <RevealText text="Your tooling should too." delay={0.2} className="block text-[#E86A00]" />
            </h1>

            <p className="mt-8 max-w-md font-body text-base text-foreground/70 md:text-lg leading-relaxed">
              OMNI SEO is the all-in-one platform covering structured data, sitemap generation, keyword density, and AI answer-engine visibility.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onStart}
                className="rounded-full bg-[#FFD209] px-7 py-3.5 text-sm font-bold text-black hover:bg-[#e0b800] transition shadow-md cursor-pointer"
              >
                Start OMNI SEO ↗
              </button>
              <button
                type="button"
                onClick={onStart}
                className="rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
              >
                Log In
              </button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.7 }}>
            <GlassCard className="p-6 md:p-8 border border-black/10 bg-white/90 backdrop-blur-md shadow-xl rounded-[24px]">
              <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.1em] text-foreground/50">Covers Every Search Surface</p>
              <ul className="space-y-3.5">
                {SURFACES.map((s) => (
                  <li key={s} className="flex items-center gap-3 font-body text-sm font-medium text-neutral-900">
                    <CheckRingIcon className="h-4 w-4 shrink-0 text-[#E86A00]" />
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
