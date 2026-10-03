"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, ScanSearch } from "lucide-react";
import { Card, StatTile, buttonClass } from "@/components/ds/primitives";
import { ScoreRing, SeverityIcon } from "@/components/ds/extras";
import type { AuditCheck, PageAuditReport, Severity } from "@/lib/tools/pageAudit/audit";

const FILTERS: { id: "all" | Severity; label: string }[] = [
  { id: "all", label: "All" },
  { id: "error", label: "Errors" },
  { id: "warning", label: "Warnings" },
  { id: "pass", label: "Passed" },
];

export function PageAuditWorkspace({ initialUrl = "" }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PageAuditReport | null>(null);
  const [filter, setFilter] = useState<"all" | Severity>("all");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/page-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Audit failed.");
      setReport(data as PageAuditReport);
      setFilter("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    if (!report) return [];
    const shown = report.checks.filter((c) => filter === "all" || c.severity === filter || (filter === "warning" && c.severity === "info"));
    const order: AuditCheck["category"][] = ["Indexability", "Content", "Structured data", "Social & Sharing", "Technical"];
    const sevRank: Record<Severity, number> = { error: 0, warning: 1, info: 2, pass: 3 };
    return order
      .map((cat) => ({ cat, items: shown.filter((c) => c.category === cat).sort((a, b) => sevRank[a.severity] - sevRank[b.severity]) }))
      .filter((g) => g.items.length > 0);
  }, [report, filter]);

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5">
        <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <ScanSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-ink-3" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              aria-label="Page URL"
              className="h-12 w-full rounded-ds-md border border-ds-line bg-ds-surface pl-11 pr-4 text-[16px] outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-ink"
            />
          </div>
          <button type="submit" disabled={loading || !url.trim()} className={buttonClass("primary", "lg")}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Auditing…" : "Audit page"}
          </button>
        </form>
        <p className="mt-3 text-[13px] text-ds-ink-2">
          Fetches the live page and checks 15+ on-page SEO signals: indexability, title and description, headings,
          images, links, structured data and social tags. Speed is measured from our server, not a lab test.
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
            <ScoreRing score={report.score} label="SEO score" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[18px] font-medium text-ds-ink">{report.facts.title ?? "No title"}</h2>
              <p className="truncate text-[14px] text-ds-ink-2">{report.finalUrl}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile value={report.summary.errors} label="errors" />
                <StatTile value={report.summary.warnings} label="warnings" />
                <StatTile value={report.facts.wordCount.toLocaleString()} label="words" />
                <StatTile value={`${report.responseMs} ms`} label="response" />
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`h-8 rounded-full px-4 text-[14px] transition-colors ${filter === f.id ? "bg-ds-btn text-white" : "bg-ds-muted text-ds-ink-2 hover:text-ds-ink"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {grouped.map(({ cat, items }) => (
            <Card key={cat} className="p-0">
              <div className="border-b border-ds-line px-5 py-3 text-[14px] font-medium text-ds-ink">{cat}</div>
              <ul className="divide-y divide-ds-line">
                {items.map((c) => (
                  <li key={c.id} className="flex gap-3 px-5 py-4">
                    <SeverityIcon severity={c.severity} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-ds-ink">{c.title}</p>
                      <p className="mt-0.5 break-words text-[14px] text-ds-ink-2">{c.detail}</p>
                      {c.fix && <p className="mt-1.5 text-[14px] text-ds-ink"><span className="text-ds-accent">Fix:</span> {c.fix}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
