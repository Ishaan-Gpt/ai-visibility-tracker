"use client";

import { useEffect, useState } from "react";
import type { PageAuditReport, SpeedMetric, SpeedReport } from "@/lib/tools/pageAudit/types";
import { CountPill, EvidenceList } from "./Evidence";

const RATING: Record<SpeedMetric["rating"], { label: string; cls: string }> = {
  good: { label: "Good", cls: "text-[#3f5d4a]" },
  ni: { label: "Needs work", cls: "text-ds-warning" },
  poor: { label: "Poor", cls: "text-[#a32121]" },
};

/**
 * Core Web Vitals, loaded after the audit (PageSpeed Insights takes 10–40 s). Uses the signed token from the audit.
 * Saved reports carry `speed` already, so nothing is fetched for them.
 */
export function SpeedPanel({ report, onLoaded }: { report: PageAuditReport; onLoaded?: (s: SpeedReport) => void }) {
  // One result (or error) per device; a saved report arrives with its result already in place.
  const [results, setResults] = useState<Partial<Record<"mobile" | "desktop", { speed?: SpeedReport; error?: string }>>>(() =>
    report.speed ? { [report.speed.strategy]: { speed: report.speed } } : {},
  );
  const [strategy, setStrategy] = useState<"mobile" | "desktop">(report.speed?.strategy ?? "mobile");
  // The token expires 15 minutes after the audit; decided once per mounted report.
  const [canFetch] = useState(() => !!report.speedToken && (report.speedTokenExp ?? 0) > Date.now());
  const entry = results[strategy];
  const loading = canFetch && !entry;
  const speed = entry?.speed ?? null;
  const error = entry?.error ?? null;

  useEffect(() => {
    if (entry || !canFetch) return;
    const ac = new AbortController();
    fetch("/api/tools/page-audit/speed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: report.finalUrl, token: report.speedToken, exp: report.speedTokenExp, strategy }),
      signal: ac.signal,
    })
      .then(async (r) => {
        const body = await r.json().catch(() => ({ error: "Unexpected response." }));
        if (!r.ok) throw new Error(body.error ?? "Couldn't load Core Web Vitals.");
        setResults((x) => ({ ...x, [strategy]: { speed: body as SpeedReport } }));
        onLoaded?.(body as SpeedReport);
      })
      .catch((e) => {
        if (!ac.signal.aborted) setResults((x) => ({ ...x, [strategy]: { error: e instanceof Error ? e.message : "Couldn't load Core Web Vitals." } }));
      });
    return () => ac.abort();
  }, [entry, canFetch, strategy, report.finalUrl, report.speedToken, report.speedTokenExp, onLoaded]);

  if (!speed && !loading && !error && !canFetch) return null;

  return (
    <section data-print-card className="glass rounded-[24px] p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-serif text-[28px] leading-none">
          Core Web <span className="italic">Vitals</span>
        </h3>
        <div className="no-print glass inline-flex rounded-[14px] p-1 text-[13px]" role="group" aria-label="Device" data-print-hide>
          {(["mobile", "desktop"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={strategy === s}
              disabled={loading || (!canFetch && !results[s])}
              onClick={() => setStrategy(s)}
              className={`rounded-[10px] px-3 py-1.5 capitalize transition-colors disabled:opacity-50 ${strategy === s ? "bg-white/85 text-ds-ink shadow-[0_4px_12px_-6px_rgba(43,41,39,.3)]" : "text-ds-ink-2 hover:text-ds-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mt-5 space-y-3" aria-live="polite">
          <p className="text-[14px] text-ds-ink-2">Running Google PageSpeed Insights on the live page. This takes 10–40 seconds.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-20 rounded-ds-md" />
            ))}
          </div>
        </div>
      )}
      {error && !loading && <p className="mt-4 text-[14px] text-ds-ink-2">{error}</p>}

      {speed && !loading && (
        <div className="mt-5 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-medium text-ds-ink">Real users, last 28 days</p>
              {speed.field ? (
                <CountPill tone={speed.field.overall === "good" ? "good" : speed.field.overall === "poor" ? "bad" : "accent"}>
                  {speed.field.overall ? `${RATING[speed.field.overall].label} overall` : "Partial data"} · {speed.field.scope === "url" ? "this URL" : "whole origin"}
                </CountPill>
              ) : (
                <CountPill>Not enough Chrome traffic for field data</CountPill>
              )}
            </div>
            {speed.field && <Metrics metrics={speed.field.metrics} />}
          </div>
          {speed.lab && (
            <div>
              <p className="text-[15px] font-medium text-ds-ink">Lighthouse lab test ({speed.strategy})</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[12.5px]">
                {(
                  [
                    ["Performance", speed.lab.scores.performance],
                    ["Accessibility", speed.lab.scores.accessibility],
                    ["Best practices", speed.lab.scores.bestPractices],
                    ["SEO", speed.lab.scores.seo],
                  ] as const
                ).map(([k, v]) => (
                  <span key={k} className="glass-inset rounded-[10px] px-2.5 py-1 tabular-nums text-ds-ink-2">
                    {k} <span className={`font-medium ${v === null ? "" : v >= 90 ? "text-[#3f5d4a]" : v >= 50 ? "text-ds-warning" : "text-[#a32121]"}`}>{v ?? "—"}</span>
                  </span>
                ))}
              </div>
              <Metrics metrics={speed.lab.metrics} />
              {speed.lab.opportunities.length > 0 && (
                <>
                  <p className="mt-4 text-[14px] font-medium text-ds-ink">Biggest savings</p>
                  <EvidenceList items={speed.lab.opportunities.map((o) => `${o.title}${o.savingsMs ? ` · save ~${(o.savingsMs / 1000).toFixed(1)} s` : ""}${o.savingsBytes ? ` · ${Math.round(o.savingsBytes / 1024)} KB` : ""}`)} label="opportunities" />
                </>
              )}
              {speed.lab.failedAudits.length > 0 && (
                <>
                  <p className="mt-4 text-[14px] font-medium text-ds-ink">Failed Lighthouse audits</p>
                  <EvidenceList items={speed.lab.failedAudits.map((a) => `${a.title} · ${a.category}`)} label="audits" />
                </>
              )}
            </div>
          )}
          <p className="text-[12px] text-ds-ink-3">Source: Google PageSpeed Insights{speed.lighthouseVersion ? ` (Lighthouse ${speed.lighthouseVersion})` : ""}. Field data comes from the Chrome UX Report.</p>
        </div>
      )}
    </section>
  );
}

function Metrics({ metrics }: { metrics: SpeedMetric[] }) {
  return (
    <ul className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((m) => (
        <li key={m.id} className="glass-inset rounded-[14px] px-3.5 py-3">
          <p className="text-[12px] text-ds-ink-3" title={m.label}>{m.id}</p>
          <p className="font-serif text-[26px] leading-tight tabular-nums">{m.display}</p>
          <p className={`text-[12px] ${RATING[m.rating].cls}`}>{RATING[m.rating].label}</p>
        </li>
      ))}
    </ul>
  );
}
