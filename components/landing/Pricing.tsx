"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { IconCheckCircle } from "@/components/icons/Icons";
import { btnPrimary, btnSecondary, Lede } from "@/components/landing/ui";
import { DAILY_LIMITS as L } from "@/lib/limits";
import { HISTORY_LIMITS } from "@/lib/history";

const EASE = [0.22, 1, 0.36, 1] as const;

const PLANS = [
  {
    name: "No account",
    price: "Free",
    note: "Just open a tool",
    href: "/tools/page-audit",
    cta: "Audit a page",
    items: [`${L["page-audit"].anon} page audits a day`, `${L["ai-crawlers"].anon} AI crawler checks a day`, "Unlimited browser tools", "PDF export on every result"],
  },
  {
    name: "Free account",
    price: "Free",
    note: "Email or Google",
    href: "/signup",
    cta: "Create an account",
    featured: true,
    items: [`${L["page-audit"].free} page audits a day`, `${L["ai-crawlers"].free} AI crawler checks a day`, `Save up to ${HISTORY_LIMITS.free} reports`, "AI Visibility tracker, weekly"],
  },
  {
    name: "Pro",
    price: "Soon",
    note: "Pricing to be announced",
    href: "/app/billing",
    cta: "Get notified",
    items: [`${L["page-audit"].pro} page audits a day`, `${L["ai-crawlers"].pro} AI crawler checks a day`, "Full report history", "AI Visibility tracker, daily"],
  },
];

export function Pricing() {
  const reduce = useReducedMotion();
  return (
    <section id="pricing" className="scroll-mt-24 pb-28 sm:pb-36">
      <div className="mx-auto max-w-[1200px] px-4 text-center">
        <h2 className="font-serif text-[46px] leading-[1.02] tracking-[-0.025em] sm:text-[64px] lg:text-[76px]">
          <span className="block">Free to use,</span>
          <span className="block italic">Pro for volume</span>
        </h2>
        <Lede className="mt-6">Pay only when you need higher limits and the full history of every report you&apos;ve run</Lede>
      </div>
      <div className="mx-auto mt-14 grid max-w-[1080px] gap-4 px-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
            className={`flex flex-col rounded-[18px] p-7 ${p.featured ? "bg-[#faf8f2] shadow-[0_30px_60px_-36px_rgba(43,41,39,0.45)] ring-1 ring-ds-accent/60" : "bg-[#ece7da]/60"}`}
          >
            <p className="text-[14px] text-ds-ink-2">{p.name}</p>
            <p className={`mt-2 font-serif text-[56px] leading-none tracking-[-0.02em] ${p.price === "Soon" ? "italic" : ""}`}>{p.price}</p>
            <p className="mt-1 text-[13px] text-ds-ink-3">{p.note}</p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {p.items.map((it) => (
                <li key={it} className="flex items-start gap-2.5 text-[14.5px] text-ds-ink">
                  <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#5c7c68]" /> {it}
                </li>
              ))}
            </ul>
            <Link href={p.href} className={`${p.featured ? btnPrimary : btnSecondary} mt-8 w-full`}>
              {p.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
