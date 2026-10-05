"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, FileDown, MousePointerClick, ScanSearch, Sparkles, X } from "lucide-react";
import { EASE, Magnetic, Reveal } from "@/components/ds/motion";
import { ToolCard, ToolRow } from "@/components/marketing/ToolCards";
import { HERO_TOOLS, MORE_TOOLS } from "@/lib/tools/registry";
import { DAILY_LIMITS } from "@/lib/limits";
import { HISTORY_LIMITS } from "@/lib/history";

function Heading({ eyebrow, children, className = "" }: { eyebrow: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ds-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-ds-accent" /> {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-[36px] font-medium leading-[1] tracking-[-0.05em] sm:text-[52px] lg:text-[64px]">{children}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ Moats */

const MOATS = [
  {
    n: "01",
    title: "Zero friction",
    accent: "seconds",
    body: "Paste a URL, get a useful answer in seconds. No account, no trial, no demo call. The tool is the landing page.",
    detail: "Browser-only tools are unlimited. Fetch-based tools give a few free runs a day, more with a free account.",
  },
  {
    n: "02",
    title: "Client-ready output",
    accent: "send",
    body: "Every result leads with a verdict and ranked fixes, then the detail. Export a clean PDF and send it as is.",
    detail: "Built for agencies and freelancers who scope, pitch and report on SEO work every week.",
  },
  {
    n: "03",
    title: "An AI-search lens",
    accent: "cited",
    body: "Each tool also answers the new question: can ChatGPT, Gemini and Perplexity reach, read and cite this?",
    detail: "Crawler access, raw-HTML text, entity schema, summaries and question structure, measured, not guessed.",
  },
];

export function Moats() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <Heading eyebrow="Why seowise" className="max-w-[860px]">
            Three promises, <span className="accent-word">kept</span> on every tool.
          </Heading>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-ds-xl border border-ds-line bg-ds-line md:grid-cols-3">
          {MOATS.map((m, i) => (
            <Reveal key={m.n} delay={i * 0.08} className="h-full">
              <article className="group relative flex h-full flex-col bg-ds-surface p-7 transition-colors duration-500 hover:bg-ds-night sm:p-9">
                <span className="font-mono text-[12px] text-ds-ink-3 transition-colors duration-500 group-hover:text-white/40">{m.n}</span>
                <h3 className="mt-16 text-[28px] font-medium leading-[1.05] tracking-[-0.04em] text-ds-ink transition-colors duration-500 group-hover:text-[#fffcf6] sm:text-[32px]">{m.title}</h3>
                <p className="mt-3 text-[16px] leading-7 text-ds-ink-2 transition-colors duration-500 group-hover:text-white/65">{m.body}</p>
                <p className="mt-4 border-t border-ds-line pt-4 text-[14px] leading-6 text-ds-ink-3 transition-colors duration-500 group-hover:border-white/10 group-hover:text-white/45">{m.detail}</p>
                <span aria-hidden className="accent-word pointer-events-none absolute right-6 top-5 text-[44px] text-ds-accent opacity-0 transition-all duration-500 ease-[var(--ds-ease)] group-hover:translate-y-1 group-hover:opacity-100">
                  {m.accent}
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Tools */

const BENTO = [4, 2, 2, 4, 3, 3];

export function ToolsShowcase() {
  return (
    <section id="tools" className="scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Heading eyebrow="The kit" className="max-w-[760px]">
              The tools you <span className="accent-word">actually</span> reach for.
            </Heading>
          </Reveal>
          <Link href="/tools" className="group inline-flex items-center gap-2 text-[15px] font-medium text-ds-ink">
            See all tools
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ds-line-strong transition-all duration-300 group-hover:rotate-[-45deg] group-hover:bg-ds-ink group-hover:text-[#fffcf6]">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {HERO_TOOLS.map((t, i) => {
            const span = BENTO[i % BENTO.length];
            return (
              <div key={t.slug} className={`${span === 4 ? "md:col-span-4" : span === 3 ? "md:col-span-3" : "md:col-span-2"} min-h-[250px]`}>
                <ToolCard slug={t.slug} index={i} large={span >= 3} />
              </div>
            );
          })}
        </div>
        <ul className="mt-10 divide-y divide-ds-line border-y border-ds-line">
          {MORE_TOOLS.map((t, i) => (
            <ToolRow key={t.slug} slug={t.slug} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ AI lens (interactive) */

const DEMO_BOTS = [
  { agent: "OAI-SearchBot", owner: "ChatGPT search", search: true },
  { agent: "PerplexityBot", owner: "Perplexity", search: true },
  { agent: "Claude-SearchBot", owner: "Claude search", search: true },
  { agent: "GPTBot", owner: "OpenAI training", search: false },
  { agent: "ClaudeBot", owner: "Anthropic training", search: false },
  { agent: "Google-Extended", owner: "Gemini training", search: false },
];

export function AiLensSection() {
  const [blocked, setBlocked] = useState<Set<string>>(new Set(["GPTBot"]));
  const reduce = useReducedMotion();
  const { visibility, optOut, verdict } = useMemo(() => {
    const s = DEMO_BOTS.filter((b) => b.search);
    const t = DEMO_BOTS.filter((b) => !b.search);
    const visibility = Math.round((s.filter((b) => !blocked.has(b.agent)).length / s.length) * 100);
    const optOut = Math.round((t.filter((b) => blocked.has(b.agent)).length / t.length) * 100);
    const verdict =
      visibility === 100 && optOut === 100
        ? "The sweet spot: cited in AI answers, opted out of training."
        : visibility === 100
          ? "Fully visible in AI search. Training bots can still read you."
          : visibility === 0
            ? "Invisible to AI search. You cannot be cited."
            : "Partly visible. Blocked search bots cannot cite you.";
    return { visibility, optOut, verdict };
  }, [blocked]);

  const toggle = (a: string) =>
    setBlocked((prev) => {
      const n = new Set(prev);
      if (n.has(a)) n.delete(a);
      else n.add(a);
      return n;
    });

  return (
    <section className="grain relative overflow-hidden bg-ds-night py-24 text-[#fffcf6] md:py-32">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-ds-accent/20 blur-[120px]" />
      <div className="relative mx-auto grid max-w-[1200px] gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8">
        <Reveal>
          <p className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-ds-accent" /> The AI-search lens
          </p>
          <h2 className="mt-4 text-balance text-[36px] font-medium leading-[1] tracking-[-0.05em] sm:text-[52px] lg:text-[60px]">
            Search has a second audience <span className="accent-word text-ds-accent">now</span>.
          </h2>
          <p className="mt-6 max-w-[520px] text-[17px] leading-7 text-white/65">
            Blocking the wrong bot quietly removes a site from ChatGPT and Perplexity answers. Blocking the right one only opts out of training. Most robots.txt files
            get this backwards. Try it.
          </p>
          <Link
            href="/tools/ai-crawler-check"
            className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#fffcf6] pl-6 pr-2 text-[15px] font-medium text-ds-night transition hover:bg-white active:scale-[0.97]"
          >
            Check a real site
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ds-accent transition-transform duration-300 group-hover:rotate-[-45deg]">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="inline-flex items-center gap-2 text-[13px] text-white/55">
                <MousePointerClick className="h-4 w-4" /> Tap a crawler to block it
              </p>
              <span className="font-mono text-[11px] text-white/35">robots.txt</span>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {DEMO_BOTS.map((b) => {
                const isBlocked = blocked.has(b.agent);
                return (
                  <li key={b.agent}>
                    <button
                      type="button"
                      onClick={() => toggle(b.agent)}
                      aria-pressed={isBlocked}
                      className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 active:scale-[0.98] ${
                        isBlocked ? "border-ds-danger/40 bg-ds-danger/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-[13px]">{b.agent}</span>
                        <span className="block text-[12px] text-white/45">
                          {b.owner} · {b.search ? "search" : "training"}
                        </span>
                      </span>
                      <span
                        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${isBlocked ? "bg-ds-danger/70" : "bg-ds-success/80"}`}
                      >
                        <motion.span
                          layout={!reduce}
                          transition={{ type: "spring", stiffness: 600, damping: 30 }}
                          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-ds-night shadow ${isBlocked ? "ml-[22px]" : "ml-0.5"}`}
                        >
                          {isBlocked ? <X className="h-3 w-3" strokeWidth={3} /> : <Check className="h-3 w-3" strokeWidth={3} />}
                        </motion.span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Visible in AI search", visibility, visibility === 100 ? "bg-ds-success" : visibility === 0 ? "bg-ds-danger" : "bg-ds-warning"],
                ["Opted out of training", optOut, "bg-ds-accent"],
              ].map(([label, v, cls]) => (
                <div key={label as string} className="rounded-2xl bg-white/[0.05] p-4">
                  <p className="text-[12px] text-white/50">{label}</p>
                  <p className="mt-1 text-[32px] font-medium tabular-nums tracking-[-0.04em]">{v}%</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div className={`h-full rounded-full ${cls}`} animate={{ width: `${v}%` }} transition={{ duration: 0.6, ease: EASE }} />
                  </div>
                </div>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={verdict}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="mt-4 px-1 text-[15px] text-white/80"
              >
                {verdict}
              </motion.p>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Honest data */

const HONESTY = [
  { label: "Measured", tone: "bg-ds-success", items: ["Live page fetch, status and response time", "Your real robots.txt and llms.txt rules", "Real Google autocomplete keyword ideas"] },
  { label: "Estimated, and labelled", tone: "bg-ds-warning", items: ["Search intent from the wording of a query", "SEO and AI-readiness scores (the formula is shown)"] },
  { label: "Never invented", tone: "bg-ds-danger", items: ["Search volume or difficulty without a data provider", "Testimonials, client logos or traffic claims"] },
];

export function HonestData() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <Reveal>
          <Heading eyebrow="Honest data">
            Real where it&apos;s real. <span className="accent-word">Labelled</span> where it isn&apos;t.
          </Heading>
          <p className="mt-6 max-w-[460px] text-[17px] leading-7 text-ds-ink-2">
            You put your name on the report you send a client. So every number says where it came from, and we leave a gap rather than fill it with a guess.
          </p>
        </Reveal>
        <div className="space-y-3">
          {HONESTY.map((h, i) => (
            <Reveal key={h.label} delay={i * 0.08}>
              <div className="rounded-ds-lg border border-ds-line bg-ds-surface p-6 shadow-ds-card">
                <p className="inline-flex items-center gap-2 text-[14px] font-medium">
                  <span className={`h-2 w-2 rounded-full ${h.tone}`} /> {h.label}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {h.items.map((it) => (
                    <li key={it} className="text-[16px] leading-7 text-ds-ink-2">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Pricing */

const L = DAILY_LIMITS;
const PLANS = [
  {
    name: "No account",
    price: "Free",
    note: "Just open a tool",
    cta: { href: "/tools/page-audit", label: "Audit a page" },
    features: [
      `${L["page-audit"].anon} page audits a day`,
      `${L["ai-crawlers"].anon} AI crawler checks a day`,
      `${L.keywords.anon} keyword research runs a day`,
      "Unlimited browser tools (schema, sitemaps, meta, llms.txt, density)",
      "PDF export on every result",
    ],
  },
  {
    name: "Free account",
    price: "Free",
    note: "Email or Google sign-in",
    featured: true,
    cta: { href: "/signup", label: "Create free account" },
    features: [
      `${L["page-audit"].free} page audits a day`,
      `${L["ai-crawlers"].free} AI crawler checks a day`,
      `${L.keywords.free} keyword research runs a day`,
      `Save up to ${HISTORY_LIMITS.free} reports`,
      "AI Visibility tracker: 3 prompts, weekly",
    ],
  },
  {
    name: "Pro",
    price: "Soon",
    note: "Pricing to be announced",
    cta: { href: "/app/billing", label: "Get Pro" },
    features: [
      `${L["page-audit"].pro} page audits a day`,
      `${L["ai-crawlers"].pro} AI crawler checks a day`,
      `${L.keywords.pro} keyword research runs a day`,
      "Full saved history across every tool",
      "AI Visibility tracker: 10 prompts, daily",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-ds-line bg-ds-surface-2/60 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <Heading eyebrow="Pricing">
            Free to use. Pro for <span className="accent-word">volume</span>.
          </Heading>
          <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-7 text-ds-ink-2">Pay only when you need higher limits and the full history of every report you&apos;ve run.</p>
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-ds-xl border p-7 transition-transform duration-500 ease-[var(--ds-ease)] hover:-translate-y-1 ${
                  p.featured ? "grain overflow-hidden border-transparent bg-ds-night text-[#fffcf6] shadow-ds-pop" : "border-ds-line bg-ds-surface shadow-ds-card"
                }`}
              >
                {p.featured && <span className="absolute right-6 top-6 rounded-full bg-ds-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ds-night">Most useful</span>}
                <p className={`text-[15px] font-medium ${p.featured ? "text-white/70" : "text-ds-ink-2"}`}>{p.name}</p>
                <p className="mt-3 text-[52px] font-medium leading-none tracking-[-0.05em]">
                  {p.price === "Soon" ? <span className="accent-word">Soon</span> : p.price}
                </p>
                <p className={`mt-2 text-[14px] ${p.featured ? "text-white/50" : "text-ds-ink-3"}`}>{p.note}</p>
                <ul className="mt-7 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className={`flex gap-3 text-[15px] leading-6 ${p.featured ? "text-white/80" : "text-ds-ink-2"}`}>
                      <Check className={`mt-1 h-4 w-4 shrink-0 ${p.featured ? "text-ds-accent" : "text-ds-ink"}`} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.cta.href}
                  className={`mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-medium transition active:scale-[0.97] ${
                    p.featured ? "bg-ds-accent text-ds-night hover:bg-[var(--ds-accent-hover)]" : "border border-ds-line-strong bg-ds-surface text-ds-ink hover:border-ds-ink"
                  }`}
                >
                  {p.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ */

const FAQS = [
  { q: "Is it really free without signing up?", a: "Yes. Every tool works without an account. Tools that fetch a live site have a small daily allowance per visitor to keep things fair; browser-only tools are unlimited." },
  { q: "Who is seowise for?", a: "Agencies and freelancers who audit, pitch and report on SEO for clients, and anyone who wants a straight answer about a page without a 40-page crawl export." },
  { q: "What does the AI-search lens check?", a: "Whether AI search crawlers are allowed, how much text is readable without JavaScript, entity-level structured data, a usable summary, question-style structure, date and author signals, and llms.txt." },
  { q: "Can I put my own branding on the PDF?", a: "Not yet. Reports are cleanly branded seowise for now. White-label is on the list." },
  { q: "Do you store the sites I check?", a: "Not unless you save a report to your account. Anonymous usage is counted against a hashed IP so limits work; the raw IP is never stored." },
  { q: "Where does keyword volume come from?", a: "Ideas come from real Google autocomplete. Volume and difficulty appear only when a data provider is connected, and are never estimated." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <Reveal>
          <Heading eyebrow="FAQ">
            Questions, <span className="accent-word">answered</span>.
          </Heading>
        </Reveal>
        <div className="divide-y divide-ds-line border-y border-ds-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-4 py-6 text-left text-[18px] font-medium tracking-[-0.02em] text-ds-ink"
                >
                  <span className="transition-transform duration-300 ease-[var(--ds-ease)] group-hover:translate-x-1">{f.q}</span>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? "rotate-180 border-ds-ink bg-ds-ink text-[#fffcf6]" : "border-ds-line-strong text-ds-ink-2"}`}>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                      <p className="pb-6 pr-10 text-[16px] leading-7 text-ds-ink-2">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Final CTA */

export function FinalCta() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="grain relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-ds-accent px-6 py-16 text-ds-night sm:px-12 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-[#ffd0b3] opacity-60 blur-[90px]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Reveal>
            <h2 className="text-balance text-[44px] font-medium leading-[0.95] tracking-[-0.055em] sm:text-[72px] lg:text-[88px]">
              Your next client report, in <span className="accent-word">one</span> minute.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(url.trim() ? `/tools/page-audit?url=${encodeURIComponent(url.trim())}&run=1` : "/tools/page-audit");
              }}
              className="flex flex-col gap-2 rounded-[22px] bg-ds-night p-2 sm:flex-row sm:rounded-full"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 pl-3">
                <ScanSearch className="h-5 w-5 shrink-0 text-white/40" strokeWidth={1.75} />
                <span className="sr-only">Website URL</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="clientsite.com"
                  inputMode="url"
                  spellCheck={false}
                  className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-[#fffcf6] outline-none placeholder:text-white/35"
                />
              </label>
              <Magnetic strength={0.15}>
                <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fffcf6] px-6 text-[15px] font-medium text-ds-night transition hover:bg-white active:scale-[0.97] sm:w-auto">
                  Audit <ArrowUpRight className="h-4 w-4" />
                </button>
              </Magnetic>
            </form>
            <p className="mt-4 inline-flex items-center gap-2 pl-2 text-[14px] text-ds-night/70">
              <FileDown className="h-4 w-4" /> Free, no signup, PDF included.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
