"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";

const FAQ = [
  {
    q: "Is there an ideal keyword density?",
    a: "No — Google has publicly said there isn't one. This tool checks readability, natural repetition, and vocabulary diversity instead of chasing a percentage.",
  },
  {
    q: "What is \"stuffing risk\" based on?",
    a: "A statistical threshold: a term repeating far more than natural English prose typically would, combined with how many times it appears. It's a heuristic flag, not a Google ranking signal.",
  },
  {
    q: "Is this free forever?",
    a: "Yes — no login, no email, no word limit. It's how we introduce people to OpenGeo, our AI visibility tracker.",
  },
];

export function StartBuilding() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SectionShell className="min-h-[60dvh] flex flex-col justify-center border-t border-foreground/10 py-24">
      <div className="grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="No fake targets. No login." />
          </h2>
          <div className="mt-10">
            <MagneticButton href="/tools/keyword-density-checker/build">Analyze my content</MagneticButton>
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
