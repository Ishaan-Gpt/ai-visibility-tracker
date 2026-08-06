"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { GlassCard } from "@/components/tools/shared/ui/GlassCard";
import { LinkIcon, CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const ROWS = [
  { url: "/blog/post-1", section: "Blog" },
  { url: "/blog/post-2", section: "Blog" },
  { url: "/products/a", section: "Products" },
  { url: "/products/b", section: "Products" },
  { url: "/about", section: "Company" },
];
const STEP_DURATION = 900;

export function LiveMechanism() {
  const [addedCount, setAddedCount] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (addedCount > ROWS.length) {
      const reset = setTimeout(() => {
        setAddedCount(0);
        setCycle((c) => c + 1);
      }, STEP_DURATION * 2);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setAddedCount((n) => n + 1), STEP_DURATION);
    return () => clearTimeout(t);
  }, [addedCount]);

  const score = Math.min(100, Math.round((addedCount / ROWS.length) * 90) + (addedCount > 0 ? 10 : 0));

  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Watch it work
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Label a URL, watch it find its section." />
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_0.8fr]">
        <GlassCard className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2 text-foreground/40">
            <LinkIcon className="h-4 w-4" />
            <span className="font-body text-xs uppercase tracking-[0.1em]">Grouping in progress</span>
          </div>
          <ul className="space-y-3">
            {ROWS.map((row, i) => (
              <li key={`${row.url}-${cycle}`} className="flex items-center justify-between border-b border-foreground/5 pb-3">
                <span className="font-mono text-sm text-foreground/70">yoursite.com{row.url}</span>
                <AnimatePresence mode="wait">
                  {i < addedCount ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-full bg-primary/10 px-2 py-0.5 font-body text-[11px] text-primary"
                    >
                      {row.section}
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
          <p className="font-body text-xs uppercase tracking-[0.15em] text-foreground/40">Sitemap health</p>
          <motion.span key={score} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-display text-6xl text-foreground">
            {score}
          </motion.span>
          <AnimatePresence>
            {addedCount >= ROWS.length ? (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-body text-xs text-primary"
              >
                <CheckRingIcon className="h-3.5 w-3.5" /> Ready to publish
              </motion.p>
            ) : (
              <p className="font-body text-xs text-foreground/40">Grouping URLs…</p>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </SectionShell>
  );
}
