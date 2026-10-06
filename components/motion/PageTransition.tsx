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
const COVER_MS = 620;

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
  const pending = useRef<string | null>(null);

  // Intercept internal navigations so the sheet can cover first.
  useEffect(() => {
    if (reduce) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      const url = new URL(href, location.href);
      if (url.pathname === location.pathname) return; // same page (hash links etc.)
      e.preventDefault();
      setTitle(titleFor(url.pathname));
      setPhase("cover");
      pending.current = url.pathname;
      setTimeout(() => router.push(url.pathname + url.search + url.hash), COVER_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, reduce]);

  // Once the destination is on screen, lift the sheet. A fallback lifts it even if navigation is redirected.
  useEffect(() => {
    if (phase !== "cover") return;
    const arrived = pending.current !== null && pathname !== null && pathname !== "" && (pathname === pending.current || pathname !== location.pathname);
    const t = setTimeout(() => setPhase("reveal"), arrived ? 220 : 4000);
    return () => clearTimeout(t);
  }, [pathname, phase]);

  useEffect(() => {
    if (phase !== "reveal") return;
    pending.current = null;
    const t = setTimeout(() => setPhase("idle"), 900);
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
          transition={{ duration: phase === "cover" ? COVER_MS / 1000 : 0.85, ease: EASE }}
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(242,169,127,0.28),transparent)]" />
          <div className="relative w-[min(560px,80vw)] text-center">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-[56px] italic leading-none text-ds-ink sm:text-[80px]"
            >
              {title}
            </motion.p>
            <div className="relative mt-8 h-6">
              <motion.span
                className="absolute left-0 top-1/2 h-px bg-ds-ink/25"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.svg
                viewBox="0 0 24 24"
                className="absolute top-0 h-6 w-6 -translate-x-1/2 text-ds-ink"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                transition={{ delay: 0.2, duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
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
