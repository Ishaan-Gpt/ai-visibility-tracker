"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { MagneticButton } from "@/components/tools/shared/motion/MagneticButton";

const FAQ = [
  {
    q: "Do I need this if I already have a sitemap.xml?",
    a: "They serve different audiences — sitemap.xml is for crawlers, this page is for your actual visitors. If you already built one with our Sitemap.xml Generator, this tool can import it directly.",
  },
  {
    q: "Standalone page or embed snippet — which do I want?",
    a: "Standalone if you want a ready-to-host page as-is. Embed snippet if you want to drop the markup into an existing page and have it inherit your site's own styling.",
  },
  {
    q: "Is this free forever?",
    a: "Yes — no login, no email, no URL limit. It's how we introduce people to OpenGeo, our AI visibility tracker.",
  },
];

export function StartBuilding() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SectionShell className="min-h-[60dvh] flex flex-col justify-center border-t border-foreground/10 py-24">
      <div className="grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="No flat lists. No login." />
          </h2>
          <div className="mt-10">
            <MagneticButton href="/tools/sitemap-html-generator/build">Start building</MagneticButton>
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
