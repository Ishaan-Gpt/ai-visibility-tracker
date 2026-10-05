"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { IconChevron, IconClose, IconMenu } from "@/components/icons/Icons";
import { btnPrimary, btnSecondary } from "@/components/landing/ui";
import { useViewer } from "@/components/viewer/useViewer";
import { HERO_TOOLS, MORE_TOOLS, toolHref } from "@/lib/tools/registry";

const EASE = [0.22, 1, 0.36, 1] as const;
const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const viewer = useViewer();
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setMenu(false);
  }

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50 px-3 pt-2.5 sm:px-4" data-print-hide>
      <motion.div
        initial={false}
        animate={{ maxWidth: scrolled ? 1000 : 1320 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`relative mx-auto flex h-14 items-center justify-between rounded-[14px] pl-4 pr-2 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled || open ? "bg-[#f2efe5]/75 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_30px_-12px_rgba(43,41,39,0.18)] backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <Link href="/" aria-label="seowise home" className="transition-opacity hover:opacity-75">
          <Logo />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" aria-label="Primary">
          <div className="relative" onMouseEnter={() => setMenu(true)} onMouseLeave={() => setMenu(false)}>
            <button type="button" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className="inline-flex items-center gap-1 px-3.5 py-2 text-[15px] text-ds-ink/80 transition-colors hover:text-ds-ink">
              Tools <IconChevron className={`h-3.5 w-3.5 transition-transform duration-300 ${menu ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-3"
                >
                  <div className="grid grid-cols-2 gap-x-6 rounded-[16px] border border-ds-line bg-[#faf8f2] p-5 shadow-[0_24px_60px_-28px_rgba(43,41,39,0.35)]">
                    <div>
                      <p className="mb-2 font-serif text-[19px] italic text-ds-ink-2">Core</p>
                      {HERO_TOOLS.map((t) => (
                        <Link key={t.slug} href={toolHref(t.slug)} className="group block rounded-lg py-1.5 text-[14.5px] text-ds-ink">
                          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">{t.name}</span>
                        </Link>
                      ))}
                    </div>
                    <div>
                      <p className="mb-2 font-serif text-[19px] italic text-ds-ink-2">More</p>
                      {MORE_TOOLS.map((t) => (
                        <Link key={t.slug} href={toolHref(t.slug)} className="group block rounded-lg py-1.5 text-[14.5px] text-ds-ink">
                          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">{t.name}</span>
                        </Link>
                      ))}
                      <Link href="/tools" className="mt-3 inline-block font-serif text-[17px] italic text-ds-accent-ink hover:underline">
                        All tools →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="px-3.5 py-2 text-[15px] text-ds-ink/80 transition-colors hover:text-ds-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href={viewer?.signedIn ? "/app" : "/login"} className={`${btnSecondary} h-10 px-4 text-[14.5px]`}>
            {viewer?.signedIn ? "Dashboard" : "Sign in"}
          </Link>
          <Link href="/tools/page-audit" className={`${btnPrimary} h-10 px-4 text-[14.5px]`}>
            Audit a page
          </Link>
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="rounded-lg p-2 text-ds-ink md:hidden">
          {open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mx-auto mt-2 max-h-[80vh] overflow-y-auto rounded-[16px] border border-ds-line bg-[#faf8f2] p-5 shadow-[0_24px_60px_-28px_rgba(43,41,39,0.35)] md:hidden"
          >
            {[...HERO_TOOLS, ...MORE_TOOLS].map((t) => (
              <Link key={t.slug} href={toolHref(t.slug)} className="block border-b border-ds-line py-3 font-serif text-[22px] text-ds-ink last:border-0">
                {t.name}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={viewer?.signedIn ? "/app" : "/login"} className={btnSecondary}>
                {viewer?.signedIn ? "Dashboard" : "Sign in"}
              </Link>
              <Link href="/tools/page-audit" className={btnPrimary}>
                Audit a page
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
