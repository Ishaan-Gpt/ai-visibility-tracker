"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toolBySlug } from "@/lib/tools/registry";

/*
 * "The scan": on an internal link click a cream sheet rises with a curved leading edge, names the destination
 * in serif italic while a small loupe glides along a hairline, then lifts away once the new page has rendered.
 */

const EASE = [0.76, 0, 0.24, 1] as const;
const COVER_MS = 420;

function titleFor(path: string): string {
  if (path === "/") return "seowise";
  if (path === "/tools") return "Every tool";
  if (path.startsWith("/tools/")) return toolBySlug(path.split("/")[2])?.name ?? "Tools";
  const map: Record<string, string> = {
    "/app": "Your studio",
    "/app/history": "Saved reports",
    "/app/visibility": "AI Visibility",
    "/app/billing": "Plan & billing",
    "/app/onboarding": "Set up tracking",
    "/login": "Welcome back",
    "/signup": "Join seowise",
    "/privacy": "Privacy",
    "/terms": "Terms",
  };
  return map[path] ?? "seowise";
}

export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const [title, setTitle] = useState("");
  const [slow, setSlow] = useState(false);
  const started = useRef(0);
  const target = useRef<string | null>(null);
  const from = useRef<string | null>(null);

  useEffect(() => {
    const internal = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href");
      if (!a || !href || !href.startsWith("/") || href.startsWith("//") || a.target === "_blank" || a.hasAttribute("download")) return null;
      return new URL(href, location.href);
    };
    // Warm the route before the click lands.
    const warm = (e: Event) => {
      const url = internal(e);
      if (url && url.pathname !== location.pathname) router.prefetch(url.pathname + url.search);
    };
    // Navigate immediately; the sheet only dresses the wait, it never adds to it.
    const onClick = (e: MouseEvent) => {
      if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = internal(e);
      if (!url || url.pathname === location.pathname) return;
      e.preventDefault();
      target.current = url.pathname;
      from.current = location.pathname;
      started.current = performance.now();
      setTitle(titleFor(url.pathname));
      setSlow(false);
      setPhase("cover");
      router.push(url.pathname + url.search + url.hash);
    };
    document.addEventListener("pointerenter", warm, true);
    document.addEventListener("touchstart", warm, { capture: true, passive: true });
    document.addEventListener("focusin", warm, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerenter", warm, true);
      document.removeEventListener("touchstart", warm, true);
      document.removeEventListener("focusin", warm, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [router, reduce]);

  // Lift as soon as the new route has rendered and the sheet has fully risen. Mark "slow" if it takes a while.
  useEffect(() => {
    if (phase !== "cover") return;
    // Arrived = the route changed away from where the click happened (covers redirects too).
    if (from.current !== null && pathname !== from.current) {
      const wait = Math.max(0, COVER_MS + 60 - (performance.now() - started.current));
      const t = setTimeout(() => setPhase("reveal"), wait);
      return () => clearTimeout(t);
    }
    const slowT = setTimeout(() => setSlow(true), COVER_MS + 500);
    const giveUp = setTimeout(() => setPhase("reveal"), 12000);
    return () => {
      clearTimeout(slowT);
      clearTimeout(giveUp);
    };
  }, [pathname, phase]);

  useEffect(() => {
    if (phase !== "reveal") return;
    target.current = null;
    const t = setTimeout(() => setPhase("idle"), 600);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key="sheet"
          aria-hidden
          className="pointer-events-auto fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-ds-canvas"
          initial={{ y: "100%", borderTopLeftRadius: "50% 140px", borderTopRightRadius: "50% 140px" }}
          animate={
            phase === "cover"
              ? { y: "0%", borderTopLeftRadius: "0% 0px", borderTopRightRadius: "0% 0px", borderBottomLeftRadius: "0% 0px", borderBottomRightRadius: "0% 0px" }
              : { y: "-100%", borderBottomLeftRadius: "50% 140px", borderBottomRightRadius: "50% 140px" }
          }
          transition={{ duration: phase === "cover" ? COVER_MS / 1000 : 0.55, ease: EASE }}
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(242,169,127,0.28),transparent)]" />
          <div className="relative w-[min(560px,80vw)] text-center">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-[56px] italic leading-none text-ds-ink sm:text-[80px]"
            >
              {title}
            </motion.p>
            <div className="relative mt-8 h-6">
              <motion.span
                className="absolute left-0 top-1/2 h-px bg-ds-ink/25"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
              {slow && <p className="absolute left-0 right-0 top-9 text-center text-[13px] text-ds-ink-2">Loading…</p>}
              <motion.svg
                viewBox="0 0 24 24"
                className="absolute top-0 h-6 w-6 -translate-x-1/2 text-ds-ink"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ left: "0%" }}
                animate={slow ? { left: ["100%", "0%", "100%"] } : { left: "100%" }}
                transition={slow ? { duration: 1.8, ease: "easeInOut", repeat: Infinity } : { delay: 0.15, duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
              >
                <circle cx="10.5" cy="10.5" r="6" fill="#f2a97f" fillOpacity=".35" />
                <path d="m15 15 4.6 4.6" strokeWidth="2.2" />
              </motion.svg>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
