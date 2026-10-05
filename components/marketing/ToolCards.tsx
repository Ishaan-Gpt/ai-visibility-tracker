"use client";

import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { ToolGlyph } from "@/components/icons/ToolGlyphs";
import { IcOpen } from "@/components/icons/Studio";
import { toolBySlug, toolHref, type ToolDef } from "@/lib/tools/registry";

const EASE = [0.22, 1, 0.36, 1] as const;
const KIND_LABEL = { fetch: "Live fetch", client: "In your browser", account: "Account" } as const;

/** Glass card with a warm light that follows the cursor and a medallion that tilts on hover. */
export function ToolCard({ slug, index = 0, large = false }: { slug: string; index?: number; large?: boolean }) {
  const tool = toolBySlug(slug) as ToolDef;
  const reduce = useReducedMotion();
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const bg = useMotionTemplate`radial-gradient(320px circle at ${mx}px ${my}px, rgba(242,169,127,0.28), transparent 70%)`;
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.8, delay: index * 0.06, ease: EASE }} className="h-full">
      <Link
        href={toolHref(tool.slug)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(e.clientX - r.left);
          my.set(e.clientY - r.top);
        }}
        onMouseLeave={() => {
          mx.set(-400);
          my.set(-400);
        }}
        className={`glass group relative flex h-full flex-col overflow-hidden rounded-[24px] p-6 transition-transform duration-500 ease-[var(--ds-ease)] hover:-translate-y-1 ${large ? "sm:p-8" : ""}`}
      >
        <motion.span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: bg }} />
        <span className="relative flex items-start justify-between">
          <span className="glass-inset flex h-14 w-14 items-center justify-center rounded-[16px] transition-transform duration-500 ease-[var(--ds-spring)] group-hover:rotate-[-8deg] group-hover:scale-110">
            <ToolGlyph slug={tool.slug} className="h-7 w-7" />
          </span>
          <IcOpen className="h-4 w-4 text-ds-ink-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ds-ink" />
        </span>
        <span className="relative mt-auto pt-12">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ds-ink-2">{KIND_LABEL[tool.kind]}</span>
          <span className={`mt-2 block font-serif leading-[1] text-ds-ink ${large ? "text-[40px]" : "text-[30px]"}`}>{tool.name}</span>
          <span className="mt-2 block text-[14.5px] leading-6 text-ds-ink-2">{tool.tagline}</span>
        </span>
      </Link>
    </motion.div>
  );
}

export function ToolRow({ slug, index = 0 }: { slug: string; index?: number }) {
  const tool = toolBySlug(slug) as ToolDef;
  const reduce = useReducedMotion();
  return (
    <motion.li initial={reduce ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.05, ease: EASE }} className="border-b border-white/60 last:border-b-0">
      <Link href={toolHref(tool.slug)} className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-white/35 sm:gap-6 sm:px-7">
        <span className="glass-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] transition-transform duration-500 ease-[var(--ds-spring)] group-hover:rotate-[-8deg]">
          <ToolGlyph slug={tool.slug} className="h-[22px] w-[22px]" />
        </span>
        <span className="w-44 shrink-0 font-serif text-[24px] leading-none sm:w-64 sm:text-[28px]">{tool.name}</span>
        <span className="hidden min-w-0 flex-1 text-[14.5px] text-ds-ink-2 md:block">{tool.tagline}</span>
        <IcOpen className="ml-auto h-4 w-4 shrink-0 text-ds-ink-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ds-ink" />
      </Link>
    </motion.li>
  );
}
