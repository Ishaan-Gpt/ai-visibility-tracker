"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";

const FAQ = [
  {
    q: "Do I need an account to use the tools?",
    a: "No — Schema Markup Generator and the rest of the free suite work with no login. Only OpenGeo, the AI visibility tracker, requires an account.",
  },
  {
    q: "Why is OpenGeo the only paid product?",
    a: "Tracking AI answer engines over time requires ongoing compute — scheduled checks, storage, and comparison. The generators are one-shot and free forever.",
  },
  {
    q: "Which tool should I start with?",
    a: "Schema Markup Generator — it's the only one live today, and it feeds directly into what OpenGeo measures.",
  },
];

export function StartExploring() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SectionShell className="min-h-[60dvh] flex flex-col justify-center border-t border-foreground/10 py-24">
      <div className="grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="Start with the one tool that's live." />
          </h2>
          <div className="mt-10">
            <MagneticButton href="/tools/ai-visibility-tracker/signup">Start OMNI SEO</MagneticButton>
          </div>
        </div>

        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={item.q} className="border-b border-foreground/10 py-4">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between text-left font-body text-sm text-foreground"
              >
                {item.q}
                <span className="ml-4 text-foreground/40">{open === i ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {open === i ? (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden font-body text-sm text-foreground/60"
                  >
                    <span className="block pt-3">{item.a}</span>
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
