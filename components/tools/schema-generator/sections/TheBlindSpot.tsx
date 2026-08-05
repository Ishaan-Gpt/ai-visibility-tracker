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

export function TheBlindSpot() {
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
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "bottom 40%",
            scrub: 0.6,
          },
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
            The blind spot
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="Same page. Same content." className="block" />
            <RevealText text="Completely different result." delay={0.1} className="block text-primary" />
          </h2>
          <p className="mt-6 max-w-md font-body text-foreground/60">
            Without structured data, Google sees a plain blue link. With it, the same page earns stars, an FAQ
            dropdown, and a breadcrumb trail — scroll to watch it happen.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-xl">
          <div className="border-b border-foreground/10 bg-foreground/[0.03] px-5 py-3 font-mono text-xs text-foreground/40">
            google.com/search?q=your+brand
          </div>
          <div className="space-y-1 p-6">
            <p className="font-body text-sm text-foreground/40">yourbrand.com</p>
            <p className="font-body text-lg text-[#1a0dab] underline-offset-2 hover:underline">
              Your Brand — Homepage
            </p>
            <p className="font-body text-sm text-foreground/50">
              Your Brand offers services and products for customers worldwide.
            </p>
          </div>

          <div
            ref={overlayRef}
            className="absolute inset-0 space-y-3 bg-white p-6"
            style={{ clipPath: "inset(0 100% 0 0)" }}
          >
            <p className="font-body text-sm text-foreground/40">yourbrand.com</p>
            <p className="font-body text-lg text-[#1a0dab]">Your Brand — Homepage</p>
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <CheckRingIcon key={i} className="h-3.5 w-3.5" />
              ))}
              <span className="ml-1 font-body text-xs text-foreground/50">4.9 · 1,204 reviews</span>
            </div>
            <p className="font-body text-sm text-foreground/50">
              Your Brand offers services and products for customers worldwide.
            </p>
            <div className="space-y-1 border-t border-foreground/10 pt-3">
              <p className="font-body text-sm font-medium text-foreground">Do you offer free shipping?</p>
              <p className="font-body text-xs text-foreground/50">Yes, on all orders over $50 — ›</p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
