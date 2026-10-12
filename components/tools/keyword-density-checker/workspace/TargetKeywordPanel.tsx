"use client";

import { SeverityIcon } from "@/components/ds/extras";
import type { TargetAnalysis } from "@/lib/tools/keywordDensity/target";
import { StatusMark, fmt } from "@/components/tools/keyword-density-checker/workspace/ui";

/**
 * Placement checklist, distribution strip and repetition notes for each target keyword.
 * With `them`, every check also shows the competitor's result.
 */
export function TargetKeywordPanel({ results, them, onRemove }: { results: TargetAnalysis[]; them?: TargetAnalysis[] | null; onRemove?: (k: string) => void }) {
  if (results.length === 0) return null;
  return (
    <div className="space-y-5">
      {results.map((r, i) => (
        <TargetCard key={r.keyword} r={r} them={them?.[i] ?? null} onRemove={onRemove} />
      ))}
    </div>
  );
}

function TargetCard({ r, them, onRemove }: { r: TargetAnalysis; them: TargetAnalysis | null; onRemove?: (k: string) => void }) {
  const needsUrl = r.checks.filter((c) => c.status === "na").length;
  return (
    <article className="glass-inset rounded-[20px] p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="break-words font-serif text-[28px] leading-[1.05] text-ds-ink">{r.keyword}</h4>
          <p className="mt-1 text-[13.5px] text-ds-ink-2">
            {r.total === 0 ? (
              "Not used in the content yet."
            ) : (
              <>
                <span className="font-medium text-ds-ink">{r.total}</span> use{r.total === 1 ? "" : "s"}
                {r.variants > 0 && (
                  <span title={r.variantForms.map((v) => `${v.form} (${v.count})`).join(", ")}>
                    {" "}
                    ({r.exact} exact, {r.variants} as {r.variantForms.slice(0, 2).map((v) => `“${v.form}”`).join(", ")}
                    {r.variantForms.length > 2 ? "…" : ""})
                  </span>
                )}{" "}
                · {fmt(r.per1000)} per 1,000 words · {fmt(r.density, 2)}%
              </>
            )}
          </p>
        </div>
        {onRemove && (
          <button type="button" onClick={() => onRemove(r.keyword)} className="rounded-[8px] px-2 py-1 text-[12.5px] text-ds-ink-3 transition hover:bg-white/70 hover:text-ds-ink">
            Remove
          </button>
        )}
      </header>

      <Distribution r={r} />

      {r.flags.length > 0 && (
        <ul className="mt-4 space-y-2">
          {r.flags.map((f) => (
            <li key={f.id} className={`flex gap-3 rounded-[14px] p-3 ${f.severity === "warning" ? "bg-[#f7e2c4]/55" : "bg-white/45"}`}>
              <SeverityIcon severity={f.severity === "warning" ? "warning" : "info"} />
              <div className="min-w-0">
                <p className="text-[14.5px] font-medium text-ds-ink">{f.title}</p>
                <p className="text-[13.5px] leading-5 text-ds-ink-2">{f.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        {them && (
          <div className="mb-1 flex justify-end gap-4 pr-1 text-[11.5px] text-ds-ink-3">
            <span className="w-7 text-center">You</span>
            <span className="w-7 text-center">Them</span>
          </div>
        )}
        <ul className="divide-y divide-white/70">
          {r.checks.map((c) => {
            const t = them?.checks.find((x) => x.id === c.id);
            return (
              <li key={c.id} className={`grid items-start gap-3 py-3 ${them ? "grid-cols-[1fr_auto]" : "grid-cols-[auto_1fr]"}`}>
                {!them && <StatusMark status={c.status} />}
                <div className="min-w-0">
                  <p className="text-[14.5px] font-medium text-ds-ink">{c.label}</p>
                  <p className="text-[13.5px] leading-5 text-ds-ink-2">{c.detail}</p>
                  {c.evidence && <p className="mt-1 line-clamp-2 break-words text-[12.5px] italic leading-5 text-ds-ink-3">“{c.evidence}”</p>}
                  {t && t.status !== "na" && <p className="mt-1 text-[12.5px] leading-5 text-ds-ink-3">Competitor: {t.detail}</p>}
                </div>
                {them && (
                  <div className="flex gap-4 pr-1 pt-0.5">
                    <span className="flex w-7 justify-center">
                      <StatusMark status={c.status} small />
                    </span>
                    <span className="flex w-7 justify-center">{t ? <StatusMark status={t.status} small /> : null}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {needsUrl > 0 && <p className="mt-2 text-[12.5px] text-ds-ink-3">Dashed checks need a live page: switch to Analyze URL to run them.</p>}
      </div>
    </article>
  );
}

/** Where in the text the keyword appears: one cell per equal slice, darker = more uses. */
function Distribution({ r }: { r: TargetAnalysis }) {
  const max = Math.max(1, ...r.distribution);
  const hit = r.distribution.filter((d) => d > 0).length;
  return (
    <div className="mt-4">
      <div className="flex items-end gap-[3px]" role="img" aria-label={`Used in ${hit} of ${r.distribution.length} slices of the text`}>
        {r.distribution.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-10 w-full items-end overflow-hidden rounded-[5px] bg-ds-ink/[0.06]" title={`Slice ${i + 1}: ${d} use${d === 1 ? "" : "s"}`}>
              <div className="w-full rounded-[5px] bg-ds-accent transition-[height] duration-500" style={{ height: d ? `${18 + (d / max) * 82}%` : "0%", opacity: d ? 0.45 + (d / max) * 0.55 : 0 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11.5px] text-ds-ink-3">
        <span>Start of text</span>
        <span>End</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-3">
        <div className="rounded-[12px] bg-white/45 px-3 py-2">
          <dt className="text-ds-ink-3">First use</dt>
          <dd className="text-ds-ink">{r.firstWordIndex === null ? "Never" : `Word ${r.firstWordIndex + 1} (${Math.round((r.firstAt ?? 0) * 100)}% in)`}</dd>
        </div>
        <div className="rounded-[12px] bg-white/45 px-3 py-2">
          <dt className="text-ds-ink-3">Coverage</dt>
          <dd className="text-ds-ink">
            {r.coverage.covered} of {r.coverage.total} {r.coverage.kind === "headings" ? "sections" : "paragraphs"}
          </dd>
        </div>
        <div className="col-span-2 rounded-[12px] bg-white/45 px-3 py-2 sm:col-span-1">
          <dt className="text-ds-ink-3">Sentences with it</dt>
          <dd className="text-ds-ink">{Math.round(r.sentenceShare * 100)}%</dd>
        </div>
      </dl>
    </div>
  );
}
