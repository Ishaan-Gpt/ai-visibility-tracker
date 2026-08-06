"use client";

import { motion } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { PageLoader } from "@/components/tools/shared/motion/PageLoader";

export function OpeningMark() {
  return (
    <>
      <PageLoader label="SITEMAP.HTML" />
      <SectionShell height="full" className="items-center">
        <div className="grid items-center gap-16 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-6 font-body text-xs uppercase tracking-[0.25em] text-primary md:whitespace-nowrap">
              For the visitors who never see your XML
            </p>
            <h1 className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
              <RevealText as="span" text="A sitemap for" className="block" />
              <br />
              <RevealText as="span" text="humans, not just crawlers." delay={0.15} className="block text-foreground/40" />
            </h1>
            <p className="mt-8 max-w-md font-body text-base text-foreground/60 md:text-lg">
              Free HTML sitemap tools dump every URL into one flat, unstyled list. Group yours into real
              sections, preview the actual page, and publish something worth linking from your footer.
            </p>
            <div className="mt-10">
              <MagneticButton href="/tools/sitemap-html-generator/build">Build my page — free</MagneticButton>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.7, ease: "easeOut" }}>
            <GlassCard className="p-6 md:p-8">
              <p className="mb-4 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">Sitemap</p>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 font-body text-[10px] uppercase tracking-[0.08em] text-foreground/40">Blog</p>
                  <p className="font-body text-sm text-primary">How AI Search Changes SEO</p>
                  <p className="font-body text-sm text-primary">Structured Data 101</p>
                </div>
                <div>
                  <p className="mb-1 font-body text-[10px] uppercase tracking-[0.08em] text-foreground/40">Products</p>
                  <p className="font-body text-sm text-primary">OpenGeo</p>
                  <p className="font-body text-sm text-primary">Schema Markup Generator</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </SectionShell>
    </>
  );
}
