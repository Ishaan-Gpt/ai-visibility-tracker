"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { IconArrow as ArrowRight, IconClose as X, IconMinus as Minus, IconTick as Check } from "@/components/icons/Icons";
import { Dial } from "@/components/studio/Pieces";
import { SeverityIcon } from "@/components/ds/extras";
import { ErrorNote, PrintFooter, PrintHeader, QuotaNote, RunningStages } from "@/components/tools/shell/Bits";
import { ResultActions } from "@/components/tools/shell/ResultActions";
import { ToolInputBar } from "@/components/tools/shell/ToolInputBar";
import { useToolRun } from "@/components/tools/shell/useToolRun";
import { PURPOSE_LABEL, type BotPurpose } from "@/lib/tools/aiCrawlers/bots";
import type { AiCrawlerReport } from "@/lib/tools/aiCrawlers/check";

const STAGES = ["Fetching robots.txt", "Looking for llms.txt", "Evaluating 16 crawlers"];
const EASE = [0.22, 1, 0.36, 1] as const;

const ACCESS = {
  allowed: { cls: "bg-[#dbe6dc]/80 text-[#4c6b57]", icon: Check },
  partial: { cls: "bg-[#f7e2c4]/80 text-[#a56312]", icon: Minus },
  blocked: { cls: "bg-[#f6d5cc]/80 text-[#b23a2a]", icon: X },
} as const;

const PURPOSE_BLURB: Record<BotPurpose, string> = {
  "ai-search": "Decide whether AI search can cite you. You almost always want these allowed.",
  "ai-user": "Fetch a page live when someone asks an assistant about it.",
  "ai-training": "Collect content for model training. Blocking them does not affect AI search.",
  search: "Classic search. Also feeds Google AI Overviews and Bing Copilot.",
};

export function AiCrawlerWorkspace({ initialDomain = "" }: { initialDomain?: string } = {}) {
  const [domain, setDomain] = useState(initialDomain);
  const { data: report, loading, step, error, quota, run, boot, savedId } = useToolRun<AiCrawlerReport>("/api/tools/ai-crawlers", STAGES.length);
  const reduce = useReducedMotion();
  useEffect(() => boot(setDomain), [boot]);

  const searchBots = report?.bots.filter((b) => b.purpose === "ai-search" || b.purpose === "ai-user") ?? [];
  const openSearch = searchBots.filter((b) => b.access !== "blocked").length;
  const headline = !report
    ? ""
    : report.score >= 85
      ? "AI can reach you."
      : report.score >= 55
        ? "Mostly reachable."
        : "AI is locked out.";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <ToolInputBar
          value={domain}
          onChange={setDomain}
          onSubmit={() => run(domain)}
          loading={loading}
          placeholder="yourdomain.com"
          label="Domain"
          cta="Check AI access"
          slug="ai-crawler-check"
          examples={report ? undefined : ["nytimes.com", "github.com", "shopify.com"]}
        />
        <QuotaNote quota={quota} noun="checks" />
      </div>

      {error && <ErrorNote message={error.message} limited={error.limited} />}

      {loading && (
        <div className="glass rounded-[24px] p-6 sm:p-8">
          <RunningStages stages={STAGES} step={step} />
        </div>
      )}

      {report && !loading && (
        <motion.div key={report.checkedAt} initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="space-y-6">
          <PrintHeader title="AI crawler access report" subject={report.domain} when={report.checkedAt} />

          <section data-print-card className="glass-strong relative overflow-hidden rounded-[28px] p-6 sm:p-9">
            <div aria-hidden className="pointer-events-none absolute -left-20 -bottom-28 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.5),transparent)] print:hidden" />
            <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="text-center">
                <Dial value={report.score} size={136} />
                <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ds-ink-2">AI ready</p>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ds-ink-2">{report.domain}</p>
                <h2 className="mt-2 font-serif text-[44px] leading-[0.98] sm:text-[56px]">
                  {headline.replace(/\.$/, "").split(" ").slice(0, -1).join(" ")} <span className="italic">{headline.replace(/\.$/, "").split(" ").slice(-1)}.</span>
                </h2>
                <p className="mt-3 text-[16px] text-ds-ink-2">
                  {openSearch} of {searchBots.length} AI search and assistant crawlers can reach the site.
                  {report.llmsTxt.found ? " llms.txt is published." : " No llms.txt yet."}
                </p>
                <div className="mt-6">
                  <ResultActions
                    tool="ai-crawlers"
                    title={report.domain}
                    subtitle={report.robots.url}
                    score={report.score}
                    report={report}
                    pdfName={`seowise AI crawler report - ${report.domain}`}
                    onRerun={() => run(report.domain)}
                    initialSavedId={savedId}
                  />
                </div>
              </div>
            </div>
          </section>

          <section data-print-card className="glass rounded-[24px] p-5 sm:p-7">
            <h3 className="font-serif text-[34px] leading-none">
              What this <span className="italic">means</span>
            </h3>
            <ul className="mt-4 space-y-3">
              {report.findings.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-6 text-ds-ink">
                  <SeverityIcon severity={f.level === "good" ? "pass" : f.level === "warn" ? "warning" : "error"} />
                  <span className="pt-0.5">{f.text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/tools/llms-txt-generator"
              className="no-print mt-5 inline-flex items-center gap-2 rounded-[12px] bg-ds-accent px-4 py-2.5 text-[14px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)]"
              data-print-hide
            >
              Generate a fixed robots.txt and llms.txt <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            {(["ai-search", "ai-user", "ai-training", "search"] as const).map((p) => {
              const bots = report.bots.filter((b) => b.purpose === p);
              return (
                <section key={p} data-print-card className="glass rounded-[20px]">
                  <div className="border-b border-white/60 px-5 py-4">
                    <h4 className="font-serif text-[24px] leading-none">{PURPOSE_LABEL[p]}</h4>
                    <p className="mt-0.5 text-[13px] leading-5 text-ds-ink-2">{PURPOSE_BLURB[p]}</p>
                  </div>
                  <ul className="divide-y divide-white/60">
                    {bots.map((b) => {
                      const A = ACCESS[b.access];
                      return (
                        <li key={b.agent} className="flex items-center justify-between gap-4 px-5 py-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="font-mono text-[14px] text-ds-ink">{b.agent}</span>
                              <span className="text-[12px] text-ds-ink-3">{b.owner}</span>
                            </div>
                            <p className="text-[12px] leading-4 text-ds-ink-3">{b.detail}</p>
                          </div>
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-[9px] px-2.5 py-1 text-[12px] font-medium capitalize ${A.cls}`}>
                            <A.icon className="h-3 w-3" /> {b.access}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          <p className="text-[13px] leading-5 text-ds-ink-3">
            Based on {report.robots.found ? report.robots.url : "no robots.txt (everything allowed by default)"}
            {report.robots.sitemaps.length > 0 && ` · ${report.robots.sitemaps.length} sitemap declared`}. robots.txt is a voluntary standard: this
            reports what you have declared, not whether every crawler obeys it.
          </p>
          <PrintFooter />
        </motion.div>
      )}
    </div>
  );
}
