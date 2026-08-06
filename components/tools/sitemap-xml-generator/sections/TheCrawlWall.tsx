"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function TheCrawlWall() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    if (!section || !overlay) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlay,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          ease: "none",
          scrollTrigger: { trigger: section, start: "top 70%", end: "bottom 40%", scrub: 0.6 },
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <SectionShell height="auto" className="min-h-[85dvh] flex flex-col justify-center border-t border-foreground/10">
      <div ref={sectionRef} className="grid gap-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
            The crawl wall
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="Staging sites. JS-heavy SPAs." className="block" />
            <RevealText text="Crawlers get stuck. You don't have to." delay={0.1} className="block text-primary" />
          </h2>
          <p className="mt-6 max-w-md font-body text-foreground/60">
            Every free sitemap tool works the same way: point it at a live, public URL and hope the crawler
            renders your JavaScript and finds every page. Skip that entirely — scroll to see the difference.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-xl">
          <div className="border-b border-foreground/10 bg-foreground/[0.03] px-5 py-3 font-mono text-xs text-foreground/40">
            crawler://scanning yoursite.com
          </div>
          <div className="space-y-2 p-6">
            <p className="font-body text-sm text-foreground/50">Crawling homepage… ✓</p>
            <p className="font-body text-sm text-foreground/50">Following links… </p>
            <p className="font-body text-sm text-red-500/70">Stuck — client-rendered content not visible ✕</p>
            <p className="font-body text-sm text-foreground/30">247 of ~600 pages found</p>
          </div>

          <div ref={overlayRef} className="absolute inset-0 space-y-2 bg-white p-6" style={{ clipPath: "inset(0 100% 0 0)" }}>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <CheckRingIcon className="h-4 w-4" />
              <span className="font-body text-sm">600 URLs — instant, no crawl</span>
            </div>
            <p className="font-mono text-xs text-foreground/50">sitemap.xml generated in 0.02s</p>
            <p className="font-mono text-xs text-foreground/50">0 pages missed — you supplied the list</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
