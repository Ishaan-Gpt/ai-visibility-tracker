"use client";

import { useState } from "react";
import { COMPARE_CAP, type CompareResult, type CompareTerm } from "@/lib/tools/keywordDensity/compare";
import { CopyButton, Tabs, TrackButton, downloadText, fmt } from "@/components/tools/keyword-density-checker/workspace/ui";
import { IconDownload } from "@/components/icons/Icons";

type Tab = "missing" | "underused" | "yoursOnly" | "shared";

const INTRO: Record<Tab, string> = {
  missing: "Topical terms the competitor uses repeatedly and your text never mentions. Not every one belongs on your page, but each is a question: does your reader need this?",
  underused: "Terms you both use, but they use at least twice as often per 1,000 words. Often a sign they cover that sub-topic in more depth.",
  yoursOnly: "Terms you use that they don't: your angle. Keep the ones that make your page different.",
  shared: "Topical terms you both use, side by side.",
};

/** Term gaps between your text and a competitor's, normalised per 1,000 words. */
export function ComparePanel({ result, tracked, onTrack, youLabel, themLabel }: { result: CompareResult; tracked: Set<string>; onTrack: (t: string) => void; youLabel: string; themLabel: string }) {
  const first: Tab = result.missing.length ? "missing" : result.underused.length ? "underused" : "shared";
  const [tab, setTab] = useState<Tab>(first);
  const [limit, setLimit] = useState(15);
  const items = result[tab];
  const max = Math.max(1, ...items.map((t) => Math.max(t.youPer1000, t.themPer1000)));

  const csv = () =>
    ["term,your_count,your_per_1000,their_count,their_per_1000", ...items.map((t) => [/[",]/.test(t.phrase) ? `"${t.phrase.replace(/"/g, '""')}"` : t.phrase, t.you, t.youPer1000.toFixed(2), t.them, t.themPer1000.toFixed(2)].join(","))].join("\n");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Tile n={result.missing.length} label="missing terms" accent={result.missing.length > 0} />
        <Tile n={result.underused.length} label="used less than them" />
        <Tile n={result.yoursOnly.length} label="only on yours" />
        <Tile n={result.shared.length} label="shared topical terms" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="Term gaps"
          value={tab}
          onChange={(v) => {
            setTab(v);
            setLimit(15);
          }}
          options={[
            { value: "missing", label: `Missing ${count(result.missing.length)}` },
            { value: "underused", label: `Underused ${count(result.underused.length)}` },
            { value: "yoursOnly", label: `Only yours ${count(result.yoursOnly.length)}` },
            { value: "shared", label: `Shared ${count(result.shared.length)}` },
          ]}
        />
        <div className="flex items-center gap-1">
          <CopyButton text={() => items.map((t) => t.phrase).join("\n")} label="Copy terms" />
          <button type="button" onClick={() => downloadText(`term-gaps-${tab}.csv`, csv())} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] text-ds-ink-2 transition hover:bg-white/60 hover:text-ds-ink">
            <IconDownload className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>
      <p className="max-w-[720px] text-[14px] leading-6 text-ds-ink-2">{INTRO[tab]}</p>

      {items.length === 0 ? (
        <p className="rounded-[14px] bg-white/40 px-4 py-6 text-center text-[14px] text-ds-ink-2">Nothing here.</p>
      ) : (
        <div className="glass-inset overflow-hidden rounded-[16px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead>
                <tr className="text-[12px] text-ds-ink-3">
                  <th className="px-4 py-2.5 font-normal">Term</th>
                  <th className="px-3 py-2.5 text-right font-normal" title={youLabel}>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-ds-accent align-middle" />
                    You · per 1k
                  </th>
                  <th className="px-3 py-2.5 text-right font-normal" title={themLabel}>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#7f98a3] align-middle" />
                    Them · per 1k
                  </th>
                  <th className="w-[30%] px-4 py-2.5 font-normal">
                    <span className="sr-only">Comparison</span>
                  </th>
                  <th className="w-[72px]" />
                </tr>
              </thead>
              <tbody>
                {items.slice(0, limit).map((t) => (
                  <Row key={t.key} t={t} max={max} tracked={tracked.has(t.phrase)} onTrack={() => onTrack(t.phrase)} />
                ))}
              </tbody>
            </table>
          </div>
          {items.length > limit && (
            <button type="button" onClick={() => setLimit(limit + 25)} className="w-full border-t border-white/70 py-2.5 text-[13.5px] text-ds-ink-2 transition hover:bg-white/50 hover:text-ds-ink">
              Show more ({items.length - limit} left)
            </button>
          )}
        </div>
      )}
      <p className="text-[12.5px] leading-5 text-ds-ink-3">
        Counts are per 1,000 words so a long and a short page compare fairly ({result.youWords.toLocaleString()} vs {result.themWords.toLocaleString()} words). Terms are 1–3 word phrases grouped with their variants, and very common English words are left out.
        Covering a topic matters; matching their counts doesn&apos;t.
      </p>
    </div>
  );
}

const count = (n: number) => (n >= COMPARE_CAP ? `${n}+` : String(n));

function Tile({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-[16px] px-3.5 py-3 ${accent ? "bg-ds-accent-soft/80" : "bg-white/45"}`}>
      <div className={`font-serif text-[32px] leading-8 tabular-nums ${accent ? "text-ds-accent-ink" : "text-ds-ink"}`}>{count(n)}</div>
      <div className="mt-1 text-[12.5px] text-ds-ink-2">{label}</div>
    </div>
  );
}

function Row({ t, max, tracked, onTrack }: { t: CompareTerm; max: number; tracked: boolean; onTrack: () => void }) {
  return (
    <tr className="border-t border-white/70 transition-colors hover:bg-white/40">
      <td className="max-w-[240px] break-words px-4 py-2.5 text-ds-ink">{t.phrase}</td>
      <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums">
        <span className={t.you ? "text-ds-ink" : "text-ds-ink-3"}>{t.you ? fmt(t.youPer1000) : "–"}</span>
        <span className="ml-1.5 text-[11.5px] text-ds-ink-3">({t.you})</span>
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums">
        <span className={t.them ? "text-ds-ink" : "text-ds-ink-3"}>{t.them ? fmt(t.themPer1000) : "–"}</span>
        <span className="ml-1.5 text-[11.5px] text-ds-ink-3">({t.them})</span>
      </td>
      <td className="px-4 py-2.5">
        <div className="space-y-1" aria-hidden>
          <div className="h-1.5 overflow-hidden rounded-full bg-ds-ink/[0.06]">
            <div className="h-full rounded-full bg-ds-accent" style={{ width: `${(t.youPer1000 / max) * 100}%` }} />
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ds-ink/[0.06]">
            <div className="h-full rounded-full bg-[#7f98a3]" style={{ width: `${(t.themPer1000 / max) * 100}%` }} />
          </div>
        </div>
      </td>
      <td className="px-2 py-2.5 text-right">
        <TrackButton onClick={onTrack} active={tracked} />
      </td>
    </tr>
  );
}
