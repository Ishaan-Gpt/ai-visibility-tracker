"use client";

import { Fragment, useMemo, useState } from "react";
import { IconDownload, IconLoupe } from "@/components/icons/Icons";
import { ngramsFor, type DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import { ngramsToCsv, ungroup, type NgramRow } from "@/lib/tools/keywordDensity/ngrams";
import { CopyButton, Tabs, Toggle, TrackButton, downloadText, fmt } from "@/components/tools/keyword-density-checker/workspace/ui";

const PAGE = 60;

export function NgramTable({ analysis, tracked, onTrack }: { analysis: DocAnalysis; tracked: Set<string>; onTrack: (term: string) => void }) {
  const [n, setN] = useState<1 | 2 | 3 | 4>(1);
  const [stop, setStop] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const base = ngramsFor(analysis, n, stop);
    const r = grouped ? base : ungroup(base, analysis.wordCount);
    const needle = q.trim().toLowerCase();
    return needle ? r.filter((x) => x.phrase.includes(needle) || x.variants.some((v) => v.form.includes(needle))) : r;
  }, [analysis, n, stop, grouped, q]);

  const max = rows[0]?.count ?? 1;
  const shown = rows.slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          label="Phrase length"
          value={n}
          onChange={(v) => {
            setN(v);
            setLimit(PAGE);
          }}
          options={[
            { value: 1, label: "1 word" },
            { value: 2, label: "2 words" },
            { value: 3, label: "3 words" },
            { value: 4, label: "4 words" },
          ]}
        />
        <Toggle checked={stop} onChange={setStop} label="Stop words" />
        <Toggle checked={grouped} onChange={setGrouped} label="Group variants" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="glass-inset flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[12px] px-3 sm:max-w-[320px]">
          <IconLoupe className="h-4 w-4 shrink-0 text-ds-ink-3" />
          <span className="sr-only">Filter phrases</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter phrases"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ds-ink outline-none placeholder:text-ds-ink-3 shadow-none!"
          />
        </label>
        <div className="ml-auto flex items-center gap-1">
          <CopyButton text={() => ngramsToCsv(rows, grouped)} label="Copy CSV" />
          <button
            type="button"
            onClick={() => downloadText(`keywords-${n}-word.csv`, ngramsToCsv(rows, grouped))}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] text-ds-ink-2 transition hover:bg-white/60 hover:text-ds-ink"
          >
            <IconDownload className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[14px] bg-white/35 px-4 py-6 text-center text-[14px] text-ds-ink-2">
          {q ? "Nothing matches that filter." : n > 1 ? "No phrase repeats yet. Phrases show up here once they are used twice." : "Not enough content yet."}
        </p>
      ) : (
        <div className="glass-inset overflow-hidden rounded-[16px]">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[540px] text-left text-[14px]">
              <thead className="sticky top-0 z-[1] bg-[#f6f3ec]/95 backdrop-blur">
                <tr className="text-[12px] text-ds-ink-3">
                  <th className="px-4 py-2.5 font-normal">Phrase</th>
                  <th className="px-3 py-2.5 text-right font-normal">Count</th>
                  <th className="px-3 py-2.5 text-right font-normal" title="Count ÷ total words × 100">
                    Density
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal">Per 1,000</th>
                  <th className="w-[26%] px-4 py-2.5 font-normal">
                    <span className="sr-only">Relative frequency</span>
                  </th>
                  <th className="w-[72px] px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <Row key={r.key + r.phrase} r={r} max={max} open={open === r.key} onToggle={() => setOpen(open === r.key ? null : r.key)} tracked={tracked.has(r.phrase)} onTrack={() => onTrack(r.phrase)} grouped={grouped} />
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > limit && (
            <button type="button" onClick={() => setLimit(limit + PAGE * 2)} className="w-full border-t border-white/70 py-2.5 text-[13.5px] text-ds-ink-2 transition hover:bg-white/50 hover:text-ds-ink">
              Show more ({rows.length - limit} left)
            </button>
          )}
        </div>
      )}
      <p className="text-[12.5px] leading-5 text-ds-ink-3">
        Density = uses ÷ total words. It is shown because people ask for it; it is not a ranking factor and there is no ideal number. Phrases never cross a sentence and never start or end on a stop word unless you switch stop words on.
      </p>
    </div>
  );
}

function Row({ r, max, open, onToggle, tracked, onTrack, grouped }: { r: NgramRow; max: number; open: boolean; onToggle: () => void; tracked: boolean; onTrack: () => void; grouped: boolean }) {
  const extra = grouped ? r.variants.length - 1 : 0;
  return (
    <Fragment>
      <tr className="border-t border-white/70 transition-colors hover:bg-white/40">
        <td className="max-w-[260px] px-4 py-2">
          <span className="break-words text-ds-ink">{r.phrase}</span>
          {extra > 0 && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              title={r.variants.map((v) => `${v.form} (${v.count})`).join(", ")}
              className="ml-2 rounded-full bg-ds-accent-soft/80 px-2 py-0.5 text-[11.5px] text-ds-accent-ink transition hover:bg-ds-accent-soft"
            >
              +{extra} form{extra === 1 ? "" : "s"}
            </button>
          )}
        </td>
        <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums text-ds-ink">{r.count}</td>
        <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums text-ds-ink-2">{fmt(r.density, 2)}%</td>
        <td className="px-3 py-2 text-right font-mono text-[13px] tabular-nums text-ds-ink-2">{fmt(r.per1000, 1)}</td>
        <td className="px-4 py-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-ds-ink/[0.07]">
            <div className="h-full rounded-full bg-ds-accent" style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }} />
          </div>
        </td>
        <td className="px-2 py-2 text-right">
          <TrackButton onClick={onTrack} active={tracked} />
        </td>
      </tr>
      {open && extra > 0 && (
        <tr className="bg-white/30">
          <td colSpan={6} className="px-4 pb-3 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {r.variants.map((v) => (
                <span key={v.form} className="rounded-[8px] bg-white/70 px-2 py-1 text-[12.5px] text-ds-ink-2">
                  {v.form} <span className="font-mono tabular-nums text-ds-ink-3">{v.count}</span>
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
