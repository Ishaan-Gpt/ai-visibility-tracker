"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type PageLoaderProps = {
  label?: string;
};

/**
 * Entry-point loader: locks scroll, runs a GSAP counter + wordmark reveal
 * timeline, then wipes away. Time-based sequencing (not scroll-driven), so
 * GSAP's timeline API is the right tool even though nothing here scrolls.
 */
export function PageLoader({ label = "SCHEMA" }: PageLoaderProps) {
  const [done, setDone] = useState(false);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const wipeRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const counter = { value: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = prevOverflow;
        setDone(true);
      },
    });

    tl.to(counter, {
      value: 100,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.round(counter.value));
        }
      },
    })
      .to(rootRef.current, { opacity: 0, duration: 0.4, ease: "power1.out" }, "+=0.1")
      .fromTo(
        wipeRef.current,
        { yPercent: 0 },
        { yPercent: -100, duration: 0.6, ease: "power4.inOut" },
        "<",
      );

    return () => {
      tl.kill();
      document.documentElement.style.overflow = prevOverflow;
    };
  }, []);

  if (done) return null;

  return (
    <div ref={wipeRef} className="fixed inset-0 z-[100] bg-foreground">
      <div ref={rootRef} className="flex h-full w-full flex-col items-center justify-center gap-6 text-background">
        <p className="font-display text-sm uppercase tracking-[0.35em] text-background/60">{label}</p>
        <span ref={counterRef} className="font-display text-6xl tabular-nums md:text-8xl">
          0
        </span>
      </div>
    </div>
  );
}
