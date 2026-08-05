"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";

const FAQ = [
  {
    q: "What's the difference between rich results and AI citations?",
    a: "Rich results are the visual snippets (stars, FAQs) Google shows in classic search. AI citations are when an answer engine like Gemini references your brand directly in a generated answer — schema markup feeds both.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. Pick a schema type, fill in the guided fields, and copy the generated script tag into your site's <head>.",
  },
  {
    q: "Is this really free forever?",
    a: "Yes — no login, no email, no output limits. It's how we introduce people to OpenGeo, our AI visibility tracker.",
  },
];

export function StartBuilding() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SectionShell className="min-h-[60dvh] flex flex-col justify-center border-t border-foreground/10 py-24">
      <div className="grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="No login. No email. No limits." />
          </h2>
          <div className="mt-10">
            <MagneticButton href="/tools/schema-generator/build">Start building</MagneticButton>
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
