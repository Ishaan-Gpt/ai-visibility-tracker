"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TABS = [
  "schema-generator.io",
  "sitemap-tool.net",
  "keyword-density-checker.com",
  "ai-search-tracker.ai",
  "seo-suite-premium.com",
];

export function TheFragmentation() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const tabs = el.querySelectorAll<HTMLElement>("[data-tab]");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        tabs,
        { opacity: 1, x: 0 },
        {
          opacity: 0.15,
          x: (i) => (i % 2 === 0 ? -40 : 40),
          stagger: 0.08,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 40%", scrub: 0.6 },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <SectionShell height="auto" className="min-h-[85dvh] flex flex-col justify-center border-t border-foreground/10">
      <div ref={containerRef} className="grid gap-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
            The current state of SEO tooling
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="Five tabs open." className="block" />
            <RevealText text="Five different logins." delay={0.1} className="block text-primary" />
          </h2>
          <p className="mt-6 max-w-md font-body text-foreground/60">
            Structured data, sitemaps, content checks, and AI visibility all live in different corners of the
            internet — each with its own account, its own paywall, its own half-finished free tier.
          </p>
        </div>

        <div className="space-y-3">
          {TABS.map((tab, i) => (
            <div
              key={tab}
              data-tab
              className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-white px-4 py-3"
            >
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-foreground/15" />
                <span className="h-2 w-2 rounded-full bg-foreground/15" />
                <span className="h-2 w-2 rounded-full bg-foreground/15" />
              </span>
              <span className="font-mono text-xs text-foreground/50">{tab}</span>
              {i === TABS.length - 1 ? <span className="ml-auto text-[10px] text-primary">+ more</span> : null}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
