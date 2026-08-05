"use client";

import { useEffect, useRef, type ElementType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RevealTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  /** "words" for headlines, "lines" for longer paragraphs. */
  splitBy?: "words" | "lines";
  delay?: number;
};

/**
 * Scroll-triggered word/line stagger reveal. GSAP owns this because it's a
 * scroll-position-gated timeline, not a state-driven interaction.
 */
export function RevealText({ text, as: Tag = "span", className = "", splitBy = "words", delay = 0 }: RevealTextProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  const segments = splitBy === "words" ? text.split(" ") : text.split("\n");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>("[data-reveal-segment]");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: 115, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.045,
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay]);

  return (
    <Tag ref={containerRef} className={className}>
      {segments.map((segment, i) => (
        <span key={i} className="inline-block overflow-hidden align-top pb-[0.1em]">
          <span data-reveal-segment className="inline-block will-change-transform">
            {segment}
            {splitBy === "words" && i < segments.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}
