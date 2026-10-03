"use client";

import { useState } from "react";
import { AlertCircle, Bot, Loader2 } from "lucide-react";
import { Card, buttonClass } from "@/components/ds/primitives";
import { ScoreRing, SeverityIcon } from "@/components/ds/extras";
import { PURPOSE_LABEL } from "@/lib/tools/aiCrawlers/bots";
import type { AiCrawlerReport } from "@/lib/tools/aiCrawlers/check";

const ACCESS_STYLE = {
  allowed: "bg-ds-success/10 text-ds-success",
  partial: "bg-ds-warning/10 text-ds-warning",
  blocked: "bg-ds-danger/10 text-ds-danger",
} as const;

export function AiCrawlerWorkspace({ initialDomain = "" }: { initialDomain?: string }) {
  const [domain, setDomain] = useState(initialDomain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AiCrawlerReport | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/ai-crawlers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed.");
      setReport(data as AiCrawlerReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed.");
    } finally {
      setLoading(false);
    }
  }

  const groups = report
    ? (["ai-search", "ai-user", "ai-training", "search"] as const).map((p) => ({
        purpose: p,
        bots: report.bots.filter((b) => b.purpose === p),
      }))
    : [];

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5">
        <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Bot className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-ink-3" />
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              aria-label="Domain"
              className="h-12 w-full rounded-ds-md border border-ds-line bg-ds-surface pl-11 pr-4 text-[16px] outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-ink"
            />
          </div>
          <button type="submit" disabled={loading || !domain.trim()} className={buttonClass("primary", "lg")}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Checking…" : "Check AI access"}
          </button>
        </form>
        <p className="mt-3 text-[13px] text-ds-ink-2">
          Reads your live robots.txt and llms.txt and tells you which AI crawlers (ChatGPT, Claude, Perplexity, Gemini
          and more) can reach your site. Blocking AI <em>search</em> bots removes you from AI answers; blocking
          <em> training</em> bots only opts out of model training.
        </p>
      </Card>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-ds-lg border border-ds-danger/30 bg-ds-danger/5 p-4 text-[14px] text-ds-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {report && (
        <>
          <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ScoreRing score={report.score} label="AI readiness" />
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-[20px] font-medium text-ds-ink">{report.domain}</h2>
              <ul className="space-y-2">
                {report.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] text-ds-ink-2">
                    <SeverityIcon severity={f.level === "good" ? "pass" : f.level === "warn" ? "warning" : "error"} />
                    <span className="pt-0.5">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {groups.map(({ purpose, bots }) => (
            <Card key={purpose} className="p-0">
              <div className="border-b border-ds-line px-5 py-3 text-[14px] font-medium text-ds-ink">{PURPOSE_LABEL[purpose]}</div>
              <ul className="divide-y divide-ds-line">
                {bots.map((b) => (
                  <li key={b.agent} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[14px] text-ds-ink">{b.agent}</span>
                        <span className="text-[13px] text-ds-ink-3">{b.owner}</span>
                      </div>
                      <p className="text-[13px] text-ds-ink-2">{b.note}</p>
                      <p className="text-[12px] text-ds-ink-3">{b.detail}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] capitalize ${ACCESS_STYLE[b.access]}`}>{b.access}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <p className="text-[13px] text-ds-ink-3">
            Based on {report.robots.url}
            {report.robots.sitemaps.length > 0 && ` · ${report.robots.sitemaps.length} sitemap declared`}. robots.txt is a
            voluntary standard; this checks what you have <em>declared</em>, not whether a crawler obeys it.
          </p>
        </>
      )}
    </div>
  );
}
