"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { IconChevron as ChevronDown, IconSpark as Sparkles } from "@/components/icons/Icons";
import { IcOpen as ArrowUpRight } from "@/components/icons/Studio";
import { Dial } from "@/components/studio/Pieces";
import { SeverityIcon, verdictFor } from "@/components/ds/extras";
import { ErrorNote, PrintFooter, PrintHeader, QuotaNote, RunningStages } from "@/components/tools/shell/Bits";
import { ResultActions } from "@/components/tools/shell/ResultActions";
import { ToolInputBar } from "@/components/tools/shell/ToolInputBar";
import { useToolRun } from "@/components/tools/shell/useToolRun";
import type { AuditCheck, PageAuditReport, Severity } from "@/lib/tools/pageAudit/audit";

const STAGES = ["Fetching the live page", "Reading robots.txt and llms.txt", "Checking 20+ on-page signals", "Scoring AI readiness"];
const CATEGORY_ORDER: AuditCheck["category"][] = ["Indexability", "Content", "Structured data", "Social & Sharing", "Technical"];
const SEV_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2, pass: 3 };
const EASE = [0.22, 1, 0.36, 1] as const;

function hostOf(u: string) {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
}

export function PageAuditWorkspace({ initialUrl = "" }: { initialUrl?: string } = {}) {
  const [url, setUrl] = useState(initialUrl);
  const { data: report, loading, step, error, quota, run, boot, savedId } = useToolRun<PageAuditReport>("/api/tools/page-audit", STAGES.length);
  const reduce = useReducedMotion();

  useEffect(() => boot(setUrl), [boot]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <ToolInputBar
          value={url}
          onChange={setUrl}
          onSubmit={() => run(url)}
          loading={loading}
          placeholder="https://yoursite.com/page"
          label="Page URL"
          cta="Audit page"
          slug="page-audit"
          examples={report ? undefined : ["stripe.com", "linear.app/pricing", "en.wikipedia.org/wiki/SEO"]}
        />
        <QuotaNote quota={quota} noun="audits" />
      </div>

      {error && <ErrorNote message={error.message} limited={error.limited} />}

      {loading && (
        <div className="glass grid gap-6 rounded-[24px] p-6 sm:p-8 md:grid-cols-[1fr_1.2fr]">
          <RunningStages stages={STAGES} step={step} />
          <div className="hidden space-y-3 md:block" aria-hidden>
            <div className="skeleton h-28 rounded-ds-lg" />
            <div className="skeleton h-14 rounded-ds-md" />
            <div className="skeleton h-14 rounded-ds-md" />
          </div>
        </div>
      )}

      {report && !loading && (
        <motion.div
          key={report.checkedAt}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="space-y-6"
        >
          <PrintHeader title="Page audit" subject={report.finalUrl} when={report.checkedAt} />
          <Verdict report={report} savedId={savedId} onRerun={() => run(report.finalUrl)} />
          <TopFixes report={report} />
          <AiLens report={report} />
          <FullAudit report={report} />
          <Facts report={report} />
          <PrintFooter />
        </motion.div>
      )}
    </div>
  );
}

/** Verdict as a glass certificate: two bezel dials, a serif verdict, the facts as small engraved chips. */
function Verdict({ report, savedId, onRerun }: { report: PageAuditReport; savedId: string | null; onRerun: () => void }) {
  const v = verdictFor(report.score, report.ai.score);
  return (
    <section data-print-card className="glass-strong relative overflow-hidden rounded-[28px] p-6 sm:p-9">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.5),transparent)] print:hidden" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(201,214,219,.6),transparent)] print:hidden" />
      <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex gap-4 sm:gap-6">
          <div className="text-center">
            <Dial value={report.score} size={128} />
            <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ds-ink-2">SEO score</p>
          </div>
          <div className="text-center">
            <Dial value={report.ai.score} size={128} />
            <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ds-ink-2">AI ready</p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ds-ink-2">Verdict</p>
          <h2 className="mt-2 font-serif text-[44px] leading-[0.98] sm:text-[56px]">
            {v.head.replace(/\.$/, "").split(" ").slice(0, -1).join(" ")} <span className="italic">{v.head.replace(/\.$/, "").split(" ").slice(-1)}.</span>
          </h2>
          <p className="mt-3 max-w-[560px] text-[16px] leading-6 text-ds-ink-2">{v.body}</p>
          <p className="mt-4 truncate text-[14px] text-ds-ink-2">
            <span className="text-ds-ink">{report.facts.title ?? "Untitled page"}</span> · {hostOf(report.finalUrl)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
            {[
              `HTTP ${report.status}`,
              `${report.responseMs} ms`,
              `${report.facts.wordCount.toLocaleString()} words`,
              `${report.summary.errors} errors`,
              `${report.summary.warnings} warnings`,
            ].map((p) => (
              <span key={p} className="glass-inset rounded-[10px] px-2.5 py-1 tabular-nums text-ds-ink-2">
                {p}
              </span>
            ))}
          </div>
          <div className="mt-6">
            <ResultActions
              tool="page-audit"
              title={report.facts.title ?? hostOf(report.finalUrl)}
              subtitle={report.finalUrl}
              score={report.score}
              aiScore={report.ai.score}
              report={report}
              pdfName={`seowise audit - ${hostOf(report.finalUrl)}`}
              onRerun={onRerun}
              initialSavedId={savedId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TopFixes({ report }: { report: PageAuditReport }) {
  if (report.topFixes.length === 0) {
    return (
      <section data-print-card className="glass rounded-[24px] p-6">
        <h3 className="text-[20px] font-medium tracking-[-0.03em]">Nothing urgent to fix.</h3>
        <p className="mt-1 text-ds-ink-2">Every check that matters passed. The full audit below has the detail.</p>
      </section>
    );
  }
  return (
    <section data-print-card>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h3 className="font-serif text-[34px] leading-none">
          Top fixes, <span className="italic">in order</span>
        </h3>
        <span className="hidden text-[13px] text-ds-ink-3 sm:block">Ranked by impact across SEO and AI</span>
      </div>
      <ol className="grid gap-3">
        {report.topFixes.map((f, i) => (
          <motion.li
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: EASE }}
            className="group grid grid-cols-[auto_1fr] gap-4 glass rounded-[20px] p-4 transition-transform duration-500 ease-[var(--ds-ease)] hover:-translate-y-0.5 sm:p-5"
          >
            <span className="font-serif text-[40px] italic leading-none text-ds-ink-3 transition-colors group-hover:text-ds-accent-ink">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${f.lens === "ai" ? "bg-ds-accent-soft text-ds-accent-ink" : "bg-ds-muted text-ds-ink-2"}`}>
                  {f.lens === "ai" ? "AI" : "SEO"}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${f.severity === "error" ? "bg-ds-danger" : f.severity === "warning" ? "bg-ds-warning" : "bg-ds-ink-3"}`} />
                <span className="text-[13px] capitalize text-ds-ink-3">{f.severity === "info" ? "opportunity" : f.severity}</span>
              </div>
              <p className="mt-1.5 text-[16px] font-medium leading-6 text-ds-ink">{f.title}</p>
              <p className="mt-1 text-[15px] leading-6 text-ds-ink-2">{f.fix}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

function AiLens({ report }: { report: PageAuditReport }) {
  const max = report.ai.checks.reduce((s, c) => s + c.weight, 0);
  return (
    <section data-print-card className="glass rounded-[24px] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ds-accent-ink">
            <Sparkles className="h-3.5 w-3.5" /> AI-search lens
          </p>
          <h3 className="mt-2 font-serif text-[34px] leading-[1.02]">
            Can ChatGPT, Gemini and Perplexity <span className="italic">use</span> this page?
          </h3>
        </div>
        <Link href="/tools/ai-crawler-check" className="no-print inline-flex items-center gap-1 text-[14px] text-ds-ink-2 hover:text-ds-ink" data-print-hide>
          Check the whole site <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <ul className="mt-5 divide-y divide-white/60">
        {report.ai.checks.map((c) => (
          <li key={c.id} className="grid grid-cols-[auto_1fr] gap-3 py-3.5 sm:grid-cols-[auto_1fr_120px] sm:items-center">
            <SeverityIcon severity={c.severity} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-ds-ink">{c.title}</p>
              <p className="text-[14px] leading-5 text-ds-ink-2">{c.detail}</p>
            </div>
            <div className="col-span-2 flex items-center gap-2 sm:col-span-1" title={`Worth ${c.weight} of ${max} points`}>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ds-muted">
                <div
                  className={`h-full rounded-full ${c.severity === "pass" ? "bg-ds-success" : c.severity === "error" ? "bg-ds-danger" : c.severity === "warning" ? "bg-ds-warning" : "bg-ds-ink-3"}`}
                  style={{ width: `${(c.weight / 30) * 100}%` }}
                />
              </div>
              <span className="w-7 text-right font-mono text-[11px] text-ds-ink-3">{c.weight}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FullAudit({ report }: { report: PageAuditReport }) {
  const [filter, setFilter] = useState<"all" | "issues" | "pass">("all");
  const groups = useMemo(() => {
    const shown = report.checks.filter((c) => filter === "all" || (filter === "pass" ? c.severity === "pass" : c.severity !== "pass"));
    return CATEGORY_ORDER.map((cat) => ({ cat, items: shown.filter((c) => c.category === cat).sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]) })).filter((g) => g.items.length);
  }, [report, filter]);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-serif text-[34px] leading-none">Full <span className="italic">audit</span></h3>
        <div className="no-print glass inline-flex rounded-[14px] p-1 text-[13px]" data-print-hide role="group" aria-label="Filter checks">
          {(
            [
              ["all", `All ${report.checks.length}`],
              ["issues", `Issues ${report.checks.filter((c) => c.severity !== "pass").length}`],
              ["pass", `Passed ${report.summary.passes}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-[10px] px-3 py-1.5 transition-colors ${filter === id ? "bg-white/85 text-ds-ink shadow-[0_4px_12px_-6px_rgba(43,41,39,.3)]" : "text-ds-ink-2 hover:text-ds-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {groups.map(({ cat, items }) => {
          const issues = items.filter((i) => i.severity === "error" || i.severity === "warning").length;
          return (
            <details key={cat} open={issues > 0} data-print-card className="group/d glass rounded-[20px] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <span className="font-serif text-[22px]">{cat}</span>
                <span className="flex items-center gap-3 text-[13px] text-ds-ink-2">
                  {issues > 0 ? <span className="rounded-full bg-ds-accent-soft px-2 py-0.5 text-ds-accent-ink">{issues} to fix</span> : <span className="text-ds-success">All clear</span>}
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open/d:rotate-180" />
                </span>
              </summary>
              <ul className="divide-y divide-white/60 border-t border-white/60">
                {items.map((c) => (
                  <li key={c.id} className="flex gap-3 px-5 py-4">
                    <SeverityIcon severity={c.severity} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-ds-ink">{c.title}</p>
                      <p className="mt-0.5 break-words text-[14px] leading-5 text-ds-ink-2">{c.detail}</p>
                      {c.fix && c.severity !== "pass" && (
                        <p className="mt-2 text-[14px] leading-5 text-ds-ink">
                          <span className="font-medium text-ds-accent-ink">Fix · </span>
                          {c.fix}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function Facts({ report }: { report: PageAuditReport }) {
  const f = report.facts;
  const rows: [string, React.ReactNode][] = [
    ["Final URL", report.finalUrl],
    ["Title", f.title ?? "—"],
    ["Meta description", f.description ?? "—"],
    ["Canonical", f.canonical ?? "—"],
    ["H1", f.h1.length ? f.h1.join(" | ") : "—"],
    ["Language", f.lang ?? "—"],
    ["Images", `${f.images.total} total, ${f.images.missingAlt} missing alt`],
    ["Links", `${f.links.internal} internal, ${f.links.external} external`],
    ["Schema types", f.schemaTypes.length ? f.schemaTypes.join(", ") : "—"],
    ["Redirects", report.redirects.length ? report.redirects.join(" → ") : "None"],
    ["HTML size", `${Math.round(report.htmlBytes / 1024)} KB${report.truncated ? " (truncated)" : ""}`],
  ];
  return (
    <details data-print-card className="group/d glass rounded-[20px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <span className="font-serif text-[22px]">Page <span className="italic">facts</span></span>
        <ChevronDown className="h-4 w-4 text-ds-ink-2 transition-transform duration-300 group-open/d:rotate-180" />
      </summary>
      <dl className="grid border-t border-white/60 sm:grid-cols-[180px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="px-5 pt-3 text-[13px] text-ds-ink-3 sm:border-b sm:border-white/60 sm:py-3">{k}</dt>
            <dd className="break-words border-b border-white/60 px-5 pb-3 text-[14px] text-ds-ink sm:py-3">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
