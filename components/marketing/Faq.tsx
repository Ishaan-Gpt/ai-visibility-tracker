"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ds/motion";

const FAQS = [
  {
    q: "What is GEO?",
    a: "Generative Engine Optimization is the practice of making your brand easy for AI answer engines (ChatGPT, Gemini, Perplexity and others) to find, understand and cite, in the same way SEO makes you visible in search results.",
  },
  {
    q: "Which AI engines do you track today?",
    a: "Gemini. ChatGPT and Perplexity are next on the roadmap. Every result shows which engine produced it, and checks that could not use live web search are labelled approximate.",
  },
  {
    q: "Where does keyword volume come from?",
    a: "Keyword ideas come from real Google autocomplete. Monthly volume, difficulty and CPC come from DataForSEO when connected, and are never estimated. If it is not connected, you see ideas without numbers.",
  },
  {
    q: "Is it really free?",
    a: "Yes. The Free plan includes all ten tools, one tracked brand with 3 prompts, and weekly checks. Pro raises the limits and checks daily.",
  },
  {
    q: "Can I replace Semrush or Ahrefs with this?",
    a: "For AI-visibility tracking, keyword ideas, page audits, schema, sitemaps and AI-crawler controls, yes. We do not offer backlink data yet, and we say so.",
  },
  {
    q: "Do you fetch my site?",
    a: "Only when you ask. Page Audit and AI Crawler Check fetch the public URL you enter, identify as OpenGEO-Bot, and never touch private or internal addresses.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-16 bg-ds-canvas py-24 md:py-32">
      <div className="mx-auto max-w-[820px] px-5 sm:px-6">
        <Reveal>
          <h2 className="text-center font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">Questions, answered.</h2>
        </Reveal>
        <div className="mt-12 divide-y divide-ds-line border-y border-ds-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-6 text-left text-[18px] font-medium tracking-[-0.01em] text-ds-ink"
                >
                  {f.q}
                  <ChevronDown className={`h-5 w-5 shrink-0 text-ds-ink-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && <p className="pb-6 pr-8 text-[16px] leading-7 text-ds-ink-2">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
