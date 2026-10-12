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
import { BOT_CATALOGUE, PURPOSES, PURPOSE_LABEL, type BotPurpose } from "@/lib/tools/aiCrawlers/bots";
import type { AiCrawlerReport, BotResult, Finding } from "@/lib/tools/aiCrawlers/check";
import { CrawlerGroup, LiveSummary, PURPOSE_BLURB } from "./CrawlerTable";
import { PathTester } from "./PathTester";
import { LlmsReport, RobotsReport, SignalsReport } from "./FileReports";
import { CodeBlock } from "./parts";

const STAGES = ["Fetching robots.txt and checking it line by line", `Requesting your site as ${BOT_CATALOGUE.filter((b) => b.ua).length} AI and search crawlers`, "Sampling URLs from your sitemap", "Validating llms.txt", "Scoring AI access"];
const EASE = [0.22, 1, 0.36, 1] as const;

const ACCESS = {
  allowed: { cls: "bg-[#dbe6dc]/80 text-[#4c6b57]", icon: Check },
  partial: { cls: "bg-[#f7e2c4]/80 text-[#a56312]", icon: Minus },
  blocked: { cls: "bg-[#f6d5cc]/80 text-[#b23a2a]", icon: X },
} as const;

const SEVERITY = { good: "pass", warn: "warning", bad: "error", info: "info" } as const;

export function AiCrawlerWorkspace({ initialDomain = "" }: { initialDomain?: string } = {}) {
  const [domain, setDomain] = useState(initialDomain);
  const { data: report, loading, step, error, quota, run, boot, savedId } = useToolRun<AiCrawlerReport>("/api/tools/ai-crawlers", STAGES.length);
  const reduce = useReducedMotion();
  useEffect(() => boot(setDomain), [boot]);

  // When live-tested, count only agents we could actually test so "can reach" never includes guesses.
  const aiBots = report?.bots.filter((b) => (b.purpose === "ai-search" || b.purpose === "ai-user") && !b.controlOnly && (!report.live || b.ua)) ?? [];
  const reachable = aiBots.filter((b) => b.access !== "blocked" && !b.conflict).length;
  const conflicts = aiBots.filter((b) => b.conflict).length;
  const headline = !report ? "" : report.score >= 85 ? "AI can reach you." : report.score >= 55 ? "Mostly reachable." : "AI is locked out.";

  const rerun = (url: string) => {
    setDomain(url);
    run(url);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <ToolInputBar
          value={domain}
          onChange={setDomain}
          onSubmit={() => run(domain)}
          loading={loading}
          placeholder="yourdomain.com or a page URL"
          label="Domain or page URL"
          cta="Check AI access"
          slug="ai-crawler-check"
          examples={report ? undefined : ["nytimes.com", "vercel.com", "github.com"]}
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
                <h2 className="font-serif text-[44px] leading-[0.98] sm:text-[56px]">
                  {headline.replace(/\.$/, "").split(" ").slice(0, -1).join(" ")} <span className="italic">{headline.replace(/\.$/, "").split(" ").slice(-1)}.</span>
                </h2>
                <p className="mt-3 text-[16px] leading-7 text-ds-ink-2">
                  <span className="font-medium text-ds-ink">{report.domain}</span> · {reachable} of {aiBots.length} AI search and assistant crawlers can reach the site
                  {report.live && report.live.pattern !== "not-run" ? " (robots.txt and a live request)" : ""}.
                  {conflicts > 0 && (
                    <span className="text-[#b23a2a]">
                      {" "}
                      {conflicts} {conflicts === 1 ? "is" : "are"} allowed by robots.txt but refused by your server.
                    </span>
                  )}
                  {report.llmsTxt.found ? " llms.txt is published." : " No llms.txt yet."}
                </p>
                {report.scoreParts && (
                  <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {report.scoreParts.map((p) => (
                      <li key={p.label} className="text-[12.5px] text-ds-ink-2">
                        <div className="flex justify-between gap-2">
                          <span>{p.label}</span>
                          <span className="tabular-nums text-ds-ink">
                            {p.earned}/{p.max}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ds-ink/10">
                          <div className={`h-full rounded-full ${p.earned / p.max >= 0.8 ? "bg-[#7fa48a]" : p.earned / p.max >= 0.5 ? "bg-ds-accent" : "bg-[#d9785f]"}`} style={{ width: `${Math.round((p.earned / p.max) * 100)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6">
                  <ResultActions
                    tool="ai-crawlers"
                    title={report.domain}
                    subtitle={report.robots.url}
                    score={report.score}
                    report={report}
                    pdfName={`seowise AI crawler report - ${report.domain}`}
                    onRerun={() => run(report.testPath && report.origin ? `${report.origin}${report.testPath}` : report.domain)}
                    initialSavedId={savedId}
                  />
                </div>
              </div>
            </div>
          </section>

          <Findings findings={report.findings} />

          <LiveSummary report={report} />

          <div className="grid gap-4 2xl:grid-cols-2">
            {PURPOSES.map((p) => {
              const bots = report.bots.filter((b) => b.purpose === p);
              return bots.length ? <CrawlerGroup key={p} purpose={p} bots={bots} report={report} /> : null;
            })}
          </div>

          <PathTester report={report} onLiveTest={rerun} />

          <div className="space-y-3">
            <RobotsReport report={report} />
            <LlmsReport report={report} />
            <SignalsReport report={report} />
          </div>

          <p className="text-[13px] leading-5 text-ds-ink-3">
            Based on {report.robots.found ? report.robots.url : "no robots.txt (everything allowed by default)"}
            {report.robots.sitemaps.length > 0 && ` · ${report.robots.sitemaps.length} sitemap${report.robots.sitemaps.length === 1 ? "" : "s"} declared`}. robots.txt is a voluntary standard:
            it records what you have declared, not whether every crawler obeys it.
            {report.live && " Live requests were sent from our servers with each crawler's user-agent; real crawlers use their own verified IP ranges, so firewall results can differ."}
          </p>
          <PrintFooter />
        </motion.div>
      )}
    </div>
  );
}

function Findings({ findings }: { findings: Finding[] }) {
  return (
    <section data-print-card className="glass rounded-[24px] p-5 sm:p-7">
      <h3 className="font-serif text-[34px] leading-none">
        What this <span className="italic">means</span>
      </h3>
      <ul className="mt-4 space-y-4">
        {findings.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] leading-6 text-ds-ink">
            <SeverityIcon severity={SEVERITY[f.level] ?? "info"} />
            <div className="min-w-0 flex-1 pt-0.5">
              <p>{f.text}</p>
              {f.fix && (
                <p className="mt-1 text-[14px] leading-5 text-ds-ink-2">
                  <span className="font-medium text-ds-accent-ink">Fix · </span>
                  {f.fix}
                </p>
              )}
              {f.code && <CodeBlock code={f.code} />}
            </div>
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
  );
}

/** Compact purpose group with access pills, used by the landing demos. `onToggle` makes pills clickable. */
export function BotGroup({ purpose, bots, onToggle }: { purpose: BotPurpose; bots: BotResult[]; onToggle?: (agent: string) => void }) {
  return (
    <section data-print-card className="glass rounded-[20px]">
      <div className="border-b border-white/60 px-5 py-4">
        <h4 className="font-serif text-[24px] leading-none">{PURPOSE_LABEL[purpose]}</h4>
        <p className="mt-0.5 text-[13px] leading-5 text-ds-ink-2">{PURPOSE_BLURB[purpose]}</p>
      </div>
      <ul className="divide-y divide-white/60">
        {bots.map((b) => {
          const A = ACCESS[b.access];
          const pill = (
            <motion.span
              key={b.access}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className={`inline-flex shrink-0 items-center gap-1 rounded-[9px] px-2.5 py-1 text-[12px] font-medium capitalize ${A.cls}`}
            >
              <A.icon className="h-3 w-3" /> {b.access}
            </motion.span>
          );
          return (
            <li key={b.agent} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-[14px] text-ds-ink">{b.agent}</span>
                  <span className="text-[12px] text-ds-ink-3">{b.owner}</span>
                </div>
                <p className="text-[12px] leading-4 text-ds-ink-3">{b.detail}</p>
              </div>
              {onToggle ? (
                <button type="button" onClick={() => onToggle(b.agent)} aria-label={`Toggle ${b.agent}`} className="rounded-[10px] transition-transform active:scale-95">
                  {pill}
                </button>
              ) : (
                pill
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
