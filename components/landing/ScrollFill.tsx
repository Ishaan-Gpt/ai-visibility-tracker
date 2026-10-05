"use client";

import { useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

/** Letters ink in one by one as the line scrolls into place (pale → ink), like the reference's italic lines. */
export function ScrollFill({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "start 45%"] });
  const [p, setP] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", setP);
  const chars = [...text];
  return (
    <span ref={ref} className={className} aria-label={text}>
      {chars.map((ch, i) => {
        const t = reduce ? 1 : Math.min(1, Math.max(0, p * (chars.length + 6) - i) / 6);
        return (
          <span key={i} aria-hidden style={{ color: `color-mix(in srgb, var(--ds-ink) ${Math.round(t * 100)}%, #cdc6b9)`, transition: "color 120ms linear" }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}
