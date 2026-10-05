import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ds/motion";
import { ButtonLink } from "@/components/ds/primitives";
import { APP_TOOLS } from "@/lib/nav";

/* ───────────── Statement ───────────── */
export function Statement() {
  return (
    <section className="bg-ds-canvas py-24 md:py-36">
      <div className="mx-auto max-w-[1000px] px-5 text-center sm:px-6">
        <Reveal>
          <p className="font-serif text-[34px] leading-[1.12] tracking-[-0.015em] text-ds-ink sm:text-[52px] lg:text-[64px]">
            People are asking AI instead of searching. The answer names a handful of brands.{" "}
            <span className="italic text-ds-accent">Are you one of them?</span>
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-8 max-w-[560px] text-[17px] leading-7 text-ds-ink-2">
            Classic rank trackers cannot see this. OpenGEO asks the answer engines your customers use and records who gets named, who gets cited, and why.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── How it works ───────────── */
const STEPS = [
  {
    n: "01",
    title: "Add your site and the questions that matter",
    body: "Tell us your brand, domain and one competitor, then write the prompts your customers actually ask AI assistants.",
  },
  {
    n: "02",
    title: "We ask the answer engines for you",
    body: "On a schedule, we run every prompt and record whether you are mentioned, which sources are cited and which competitors appear. Gemini today; ChatGPT and Perplexity are next.",
  },
  {
    n: "03",
    title: "Fix what holds you back",
    body: "Audit pages, check AI-crawler access, ship schema and llms.txt, and research the keywords behind the questions, without leaving the workspace.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 bg-ds-surface py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <Reveal>
          <p className="font-mono text-[13px] uppercase tracking-wider text-ds-accent">How it works</p>
          <h2 className="mt-3 max-w-[720px] font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
            From “are we visible?” to “here is the fix” in one place.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-ds-xl border border-ds-line bg-ds-line md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08} className="h-full bg-ds-surface">
              <div className="flex h-full flex-col p-7 sm:p-8">
                <span className="font-mono text-[14px] text-ds-ink-3">{s.n}</span>
                <h3 className="mt-10 text-[22px] font-medium leading-7 tracking-[-0.02em] text-ds-ink">{s.title}</h3>
                <p className="mt-3 text-[16px] leading-6 text-ds-ink-2">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Features ───────────── */
const FEATURE_COPY: Record<string, string> = {
  visibility: "Mentions, citations and competitor share on the prompts you choose, tracked over time.",
  keywords: "Hundreds of real Google autocomplete ideas per seed, clustered by topic with estimated intent.",
  density: "See phrase balance and stuffing risk without a fake “ideal density” target.",
  audit: "15+ on-page checks on any live URL, scored, each with the fix.",
  meta: "Pixel-accurate title measurement, Google and social previews, ready-to-paste tags.",
  schema: "21 JSON-LD types with Google rich-result rules and a live completeness score.",
  crawlers: "Which of 16 search and AI bots your robots.txt lets in or blocks.",
  "ai-files": "Generate robots.txt AI policies and an llms.txt without writing either by hand.",
  "sitemap-xml": "Spec-conformant sitemaps, auto-split past 50,000 URLs.",
  "sitemap-html": "A readable HTML sitemap, importable from your XML.",
};

export function Features() {
  const big = APP_TOOLS.find((t) => t.slug === "visibility")!;
  const rest = APP_TOOLS.filter((t) => t.slug !== "visibility");
  return (
    <section id="features" className="scroll-mt-16 bg-ds-canvas py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <Reveal>
          <p className="font-mono text-[13px] uppercase tracking-wider text-ds-accent">Features</p>
          <h2 className="mt-3 max-w-[760px] font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
            One workspace. Ten tools. No tab sprawl.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-ds-xl bg-ds-night p-8 text-white sm:p-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] text-ds-signal">
                  <big.icon className="h-3.5 w-3.5" /> The GEO core
                </span>
                <h3 className="mt-6 font-serif text-[34px] leading-[1.05] sm:text-[44px]">{big.name}</h3>
                <p className="mt-4 max-w-[480px] text-[17px] leading-7 text-white/65">{FEATURE_COPY[big.slug]}</p>
              </div>
              <ul className="mt-10 grid gap-3 text-[15px] text-white/80 sm:grid-cols-2">
                {["Weekly checks on Free, daily on Pro", "Competitor comparison", "Honest labels when a check is approximate", "Per-prompt history"].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-ds-signal" /> {x}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <FeatureCard tool={rest[0]} />
          </Reveal>

          {rest.slice(1).map((t, i) => (
            <Reveal key={t.slug} delay={(i % 3) * 0.06}>
              <FeatureCard tool={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ tool }: { tool: (typeof APP_TOOLS)[number] }) {
  return (
    <div className="flex h-full flex-col rounded-ds-xl border border-ds-line bg-ds-surface p-7 transition-colors hover:border-ds-ink/25">
      <span className="flex h-10 w-10 items-center justify-center rounded-ds-md bg-ds-accent-soft text-ds-accent">
        <tool.icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <h3 className="mt-6 text-[19px] font-medium tracking-[-0.015em] text-ds-ink">{tool.name}</h3>
      <p className="mt-2 text-[15px] leading-6 text-ds-ink-2">{FEATURE_COPY[tool.slug]}</p>
    </div>
  );
}

/* ───────────── Data transparency ───────────── */
const DATA_ROWS = [
  { feature: "AI visibility", source: "Gemini API (live). ChatGPT and Perplexity planned.", status: "Live", tone: "live" },
  { feature: "Keyword ideas", source: "Google autocomplete, expanded A–Z, questions and modifiers.", status: "Live", tone: "live" },
  { feature: "Search volume, difficulty, CPC", source: "DataForSEO, pay-as-you-go. Never estimated.", status: "Needs connection", tone: "opt" },
  { feature: "Search intent labels", source: "Heuristic from the wording of the query.", status: "Estimate", tone: "est" },
  { feature: "Page audit and crawler check", source: "Your live page and robots.txt, fetched by us.", status: "Live", tone: "live" },
  { feature: "Backlinks", source: "Not offered yet.", status: "Not yet", tone: "no" },
];

const TONE: Record<string, string> = {
  live: "bg-ds-signal/15 text-ds-signal",
  opt: "bg-white/10 text-white/70",
  est: "bg-white/10 text-white/70",
  no: "bg-white/5 text-white/40",
};

export function DataTransparency() {
  return (
    <section id="data" className="scroll-mt-16 bg-ds-night py-24 text-white md:py-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <Reveal>
          <p className="font-mono text-[13px] uppercase tracking-wider text-ds-signal">Open by design</p>
          <h2 className="mt-3 max-w-[760px] font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
            We tell you where every number comes from.
          </h2>
          <p className="mt-5 max-w-[560px] text-[17px] leading-7 text-white/60">
            Most SEO tools hide their sources and fill gaps with guesses. We label what is live, what is an estimate and what we do not have.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-ds-xl border border-ds-night-line">
            <div className="hidden grid-cols-[1.1fr_2fr_auto] gap-6 border-b border-ds-night-line bg-white/[0.03] px-6 py-3 font-mono text-[12px] uppercase tracking-wider text-white/40 md:grid">
              <span>Feature</span>
              <span>Data source</span>
              <span className="w-36 text-right">Status</span>
            </div>
            <ul className="divide-y divide-ds-night-line">
              {DATA_ROWS.map((r) => (
                <li key={r.feature} className="grid gap-2 px-6 py-5 md:grid-cols-[1.1fr_2fr_auto] md:items-center md:gap-6">
                  <span className="text-[16px] text-white">{r.feature}</span>
                  <span className="text-[15px] leading-6 text-white/55">{r.source}</span>
                  <span className="md:w-36 md:text-right">
                    <span className={`inline-block rounded-full px-3 py-1 font-mono text-[12px] ${TONE[r.tone]}`}>{r.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── Pricing ───────────── */
export function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      note: "forever",
      features: ["All ten tools", "1 brand, 3 tracked prompts", "1 competitor", "Weekly AI-visibility checks", "Generous daily tool limits"],
      cta: "Start free",
      href: "/signup",
      dark: false,
    },
    {
      name: "Pro",
      price: "Soon",
      note: "price announced at launch",
      features: ["Everything in Free", "10 tracked prompts, 2 competitors", "Daily AI-visibility checks", "Higher daily limits on every tool", "Priority support"],
      cta: "Get early access",
      href: "/signup",
      dark: true,
    },
  ];
  return (
    <section id="pricing" className="scroll-mt-16 bg-ds-surface py-24 md:py-32">
      <div className="mx-auto max-w-[1000px] px-5 sm:px-6">
        <Reveal>
          <div className="text-center">
            <p className="font-mono text-[13px] uppercase tracking-wider text-ds-accent">Pricing</p>
            <h2 className="mt-3 font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]">Start free. Pay when you outgrow it.</h2>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08} className="h-full">
              <div className={`flex h-full flex-col rounded-ds-xl p-8 sm:p-10 ${p.dark ? "bg-ds-night text-white" : "border border-ds-line bg-ds-canvas text-ds-ink"}`}>
                <h3 className="text-[18px] font-medium">{p.name}</h3>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-serif text-[56px] leading-none">{p.price}</span>
                  <span className={`text-[14px] ${p.dark ? "text-white/50" : "text-ds-ink-2"}`}>{p.note}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[15px]">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.dark ? "text-ds-signal" : "text-ds-accent"}`} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <ButtonLink href={p.href} variant={p.dark ? "signal" : "primary"} size="lg" className="mt-10 w-full">
                  {p.cta}
                </ButtonLink>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Final CTA + footer ───────────── */
export function FinalCta() {
  return (
    <section className="bg-ds-night py-24 text-white md:py-36">
      <div className="mx-auto max-w-[900px] px-5 text-center sm:px-6">
        <Reveal>
          <h2 className="font-serif text-[48px] leading-[1] tracking-[-0.02em] sm:text-[80px]">
            Be the <span className="italic text-ds-signal">answer.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[480px] text-[17px] leading-7 text-white/60">Create a free workspace and see how AI talks about your brand today.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" variant="signal" size="lg">
              Start free <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/login" variant="outline-dark" size="lg">
              Sign in
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ds-night-line bg-ds-night text-white/60">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-5 py-10 text-[14px] sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} OpenGEO. All rights reserved.</p>
        <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer">
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/#pricing" className="hover:text-white">Pricing</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/login" className="hover:text-white">Sign in</Link>
        </nav>
      </div>
    </footer>
  );
}
