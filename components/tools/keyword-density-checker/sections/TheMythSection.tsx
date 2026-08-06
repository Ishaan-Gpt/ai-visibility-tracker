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

export function TheMythSection() {
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
            The myth every other tool sells
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="“Aim for 1-3%”" className="block" />
            <RevealText text="is a number nobody can justify." delay={0.1} className="block text-primary" />
          </h2>
          <p className="mt-6 max-w-md font-body text-foreground/60">
            Matt Cutts said it himself: there's no ideal keyword density. Scroll to see what we check instead.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-xl">
          <div className="border-b border-foreground/10 bg-foreground/[0.03] px-5 py-3 font-mono text-xs text-foreground/40">
            other-tool.com
          </div>
          <div className="space-y-3 p-6">
            <p className="font-body text-sm text-foreground/50">Keyword density</p>
            <p className="font-display text-4xl text-red-500/70">2.3%</p>
            <p className="font-body text-xs text-foreground/40">⚠ Aim for 1–3% (recommended range)</p>
          </div>

          <div ref={overlayRef} className="absolute inset-0 space-y-3 bg-white p-6" style={{ clipPath: "inset(0 100% 0 0)" }}>
            <div className="flex items-center gap-2 text-primary">
              <CheckRingIcon className="h-4 w-4" />
              <span className="font-body text-sm">No stuffing detected</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <CheckRingIcon className="h-4 w-4" />
              <span className="font-body text-sm">Readability: Standard</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <CheckRingIcon className="h-4 w-4" />
              <span className="font-body text-sm">68% unique vocabulary</span>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
