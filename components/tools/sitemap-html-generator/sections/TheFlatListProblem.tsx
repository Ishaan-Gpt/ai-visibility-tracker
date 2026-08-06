"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FLAT_LINKS = ["/", "/about", "/blog/post-1", "/blog/post-2", "/pricing", "/contact", "/products/a", "/products/b"];

export function TheFlatListProblem() {
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
            The flat-list problem
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="Eight links in a row" className="block" />
            <RevealText text="tells a visitor nothing." delay={0.1} className="block text-primary" />
          </h2>
          <p className="mt-6 max-w-md font-body text-foreground/60">
            Every free HTML sitemap generator outputs the same thing: one long, unstyled bullet list. Group
            related pages instead — scroll to see the difference.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-white shadow-xl">
          <div className="border-b border-foreground/10 bg-foreground/[0.03] px-5 py-3 font-mono text-xs text-foreground/40">
            sitemap.html
          </div>
          <ul className="space-y-1.5 p-6">
            {FLAT_LINKS.map((link) => (
              <li key={link} className="font-body text-sm text-[#1a0dab]">
                yoursite.com{link}
              </li>
            ))}
          </ul>

          <div ref={overlayRef} className="absolute inset-0 space-y-4 bg-white p-6" style={{ clipPath: "inset(0 100% 0 0)" }}>
            <div>
              <p className="mb-1 font-body text-[10px] uppercase tracking-[0.08em] text-foreground/40">Company</p>
              <p className="font-body text-sm text-[#1a0dab]">yoursite.com/about</p>
              <p className="font-body text-sm text-[#1a0dab]">yoursite.com/contact</p>
            </div>
            <div>
              <p className="mb-1 font-body text-[10px] uppercase tracking-[0.08em] text-foreground/40">Blog</p>
              <p className="font-body text-sm text-[#1a0dab]">yoursite.com/blog/post-1</p>
              <p className="font-body text-sm text-[#1a0dab]">yoursite.com/blog/post-2</p>
            </div>
            <div>
              <p className="mb-1 font-body text-[10px] uppercase tracking-[0.08em] text-foreground/40">Products</p>
              <p className="font-body text-sm text-[#1a0dab]">yoursite.com/products/a</p>
              <p className="font-body text-sm text-[#1a0dab]">yoursite.com/products/b</p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
