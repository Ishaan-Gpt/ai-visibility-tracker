"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LazyMotion, domAnimation } from "framer-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const AUTHED_APP_SEGMENT = /\/(dashboard|onboarding|login|signup)(\/|$)/;

/**
 * Smooth scroll is scoped to the marketing/tool surfaces (`/`, `/tools/*`).
 * The authenticated OpenGeo app (dashboard, onboarding, auth — now nested at
 * `/tools/ai-visibility-tracker/...`) keeps native scroll — those views are
 * data-dense and benefit from predictable, non-inertial scrolling.
 */
function smoothScrollEnabledFor(pathname: string) {
  if (AUTHED_APP_SEGMENT.test(pathname)) return false;
  return pathname === "/" || pathname.startsWith("/tools");
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const enabled = smoothScrollEnabledFor(pathname ?? "/");

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
