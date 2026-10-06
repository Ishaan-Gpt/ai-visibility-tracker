"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";
import { IcCompass, IcDoor, IcDossier, IcSeer, IcTicket, IcWindow } from "@/components/icons/Studio";
import { ToolGlyph } from "@/components/icons/ToolGlyphs";
import { IconSpinner } from "@/components/icons/Icons";
import { Backdrop } from "@/components/studio/Backdrop";
import { signOutEverywhere } from "@/components/viewer/signOut";
import { TOOLS, toolHref } from "@/lib/tools/registry";

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 520, damping: 38 } as const;

const NAV = [
  { href: "/app", label: "Overview", Icon: IcWindow },
  { href: "/app/history", label: "Saved reports", Icon: IcDossier },
  { href: "/app/visibility", label: "AI Visibility", Icon: IcSeer },
  { href: "/app/billing", label: "Plan & billing", Icon: IcTicket },
];

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/** A dock button: soft bead behind the active item, a glass name-tag that springs out on hover. */
function DockItem({ href, label, Icon, active, vertical }: { href: string; label: string; Icon: typeof IcWindow; active: boolean; vertical: boolean }) {
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className="group relative flex h-12 w-12 items-center justify-center rounded-[16px] text-ds-ink outline-none">
      {active && <motion.span layoutId="dock-bead" transition={SPRING} className="absolute inset-0 rounded-[16px] bg-white/85 shadow-[0_6px_16px_-8px_rgba(43,41,39,0.35),inset_0_1px_0_#fff]" />}
      <span className="absolute inset-0 rounded-[16px] bg-white/0 transition-colors duration-300 group-hover:bg-white/45 group-focus-visible:ring-2 group-focus-visible:ring-ds-accent-ink" />
      <Icon active={active} className="relative h-[22px] w-[22px] transition-transform duration-500 ease-[var(--ds-spring)] group-hover:-translate-y-[1px] group-hover:scale-110" />
      {vertical && (
        <span className="glass-strong pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 translate-x-[-6px] whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[13px] text-ds-ink opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ds-ease)] group-hover:translate-x-0 group-hover:opacity-100">
          {label}
        </span>
      )}
    </Link>
  );
}

function ToolsPopover({ vertical }: { vertical: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Tools" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="group relative flex h-12 w-12 items-center justify-center rounded-[16px] text-ds-ink">
        <span className={`absolute inset-0 rounded-[16px] transition-colors duration-300 ${open ? "bg-white/70" : "group-hover:bg-white/45"}`} />
        <IcCompass active={open} className={`relative h-[22px] w-[22px] transition-transform duration-500 ease-[var(--ds-spring)] ${open ? "rotate-[25deg]" : "group-hover:rotate-12"}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            transition={{ duration: 0.28, ease: EASE }}
            className={`glass-strong absolute z-50 w-[300px] rounded-[20px] p-2 ${vertical ? "left-[calc(100%+18px)] top-1/2 -translate-y-1/2 origin-left" : "bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 origin-bottom"}`}
          >
            <p className="px-3 pb-1 pt-2 font-serif text-[18px] italic text-ds-ink-2">Open a tool</p>
            <div className="grid max-h-[60vh] overflow-y-auto">
              {TOOLS.filter((t) => t.kind !== "account").map((t) => (
                <Link key={t.slug} href={toolHref(t.slug)} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] text-ds-ink transition-colors hover:bg-white/60">
                  <ToolGlyph slug={t.slug} className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  {t.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Account({ email, planLabel, vertical, onSignOut, signingOut }: { email: string; planLabel: string; vertical: boolean; onSignOut: () => void; signingOut: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#fde3d1,#f2a97f_70%)] font-serif text-[20px] italic text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_6px_14px_-8px_rgba(165,85,45,.6)] transition-transform duration-300 hover:scale-105"
      >
        {email ? email[0].toLowerCase() : "?"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 6, filter: "blur(6px)" }}
            transition={{ duration: 0.25, ease: EASE }}
            className={`glass-strong absolute z-50 w-[250px] rounded-[18px] p-2 ${vertical ? "bottom-0 left-[calc(100%+18px)]" : "right-0 top-[calc(100%+12px)]"}`}
          >
            <div className="px-3 py-2">
              <p className="truncate text-[14px] text-ds-ink">{email}</p>
              <p className="text-[12.5px] text-ds-ink-2">{planLabel} plan</p>
            </div>
            <div className="my-1 h-px bg-ds-line" />
            <Link href="/" onClick={() => setOpen(false)} className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-[14px] text-ds-ink transition-colors hover:bg-white/60">
              <LogoMark className="h-[18px] w-[18px]" /> seowise home
            </Link>
            <Link href="/tools" onClick={() => setOpen(false)} className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-[14px] text-ds-ink transition-colors hover:bg-white/60">
              <IcCompass className="h-[18px] w-[18px]" /> All tools
            </Link>
            <button type="button" onClick={onSignOut} disabled={signingOut} className="group flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-left text-[14px] text-ds-ink transition-colors hover:bg-white/60 disabled:opacity-60">
              {signingOut ? <IconSpinner className="h-[18px] w-[18px] animate-spin" /> : <IcDoor className="h-[18px] w-[18px]" />} {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ email, planLabel, children, previewPath }: { email: string; planLabel: string; isPaid?: boolean; children: ReactNode; previewPath?: string }) {
  const realPath = usePathname();
  const pathname = previewPath ?? realPath;
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  const [signingOut, setSigningOut] = useState(false);
  async function logout() {
    setSigningOut(true);
    await signOutEverywhere("/");
  }

  return (
    <div className="relative min-h-screen font-sans text-ds-ink">
      <Backdrop />

      {/* desktop dock */}
      <motion.nav
        aria-label="Studio"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="no-print glass fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1.5 rounded-[26px] p-2.5 lg:flex"
        data-print-hide
      >
        <Link href="/" aria-label="seowise home" className="group relative mb-2 flex h-12 w-12 items-center justify-center text-ds-ink">
          <LogoMark className="h-6 w-6 transition-transform duration-500 group-hover:rotate-[-12deg]" />
          <span className="glass-strong pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 translate-x-[-6px] whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[13px] opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Back to home
          </span>
        </Link>
        {NAV.map((n) => (
          <DockItem key={n.href} {...n} active={isActive(n.href)} vertical />
        ))}
        <span className="my-1.5 h-px w-7 bg-ds-ink/10" />
        <ToolsPopover vertical />
        <div className="mt-2">
          <Account email={email} planLabel={planLabel} vertical onSignOut={logout} signingOut={signingOut} />
        </div>
      </motion.nav>

      {/* mobile top bar + bottom dock */}
      <div className="no-print fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 pt-3 lg:hidden" data-print-hide>
        <Link href="/" aria-label="seowise home" className="glass flex h-11 items-center gap-2 rounded-full px-4">
          <LogoMark className="h-5 w-5" />
          <span className="font-serif text-[20px] italic leading-none">seowise</span>
        </Link>
        <Account email={email} planLabel={planLabel} vertical={false} onSignOut={logout} signingOut={signingOut} />
      </div>
      <nav aria-label="Studio" className="no-print glass fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-[24px] p-2 lg:hidden" data-print-hide>
        {NAV.map((n) => (
          <DockItem key={n.href} {...n} active={isActive(n.href)} vertical={false} />
        ))}
        <span className="mx-0.5 h-7 w-px bg-ds-ink/10" />
        <ToolsPopover vertical={false} />
      </nav>

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative z-10 mx-auto w-full max-w-[1180px] px-4 pb-32 pt-24 sm:px-8 lg:pb-16 lg:pl-[132px] lg:pr-10 lg:pt-14"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
