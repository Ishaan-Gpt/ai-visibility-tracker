"use client";

import { useState, type ReactNode } from "react";
import { LONG_PARAGRAPH, LONG_SENTENCE, VERY_LONG_SENTENCE, type ReadabilityReport } from "@/lib/tools/keywordDensity/readability";
import { Tabs, fmt } from "@/components/tools/keyword-density-checker/workspace/ui";

type ListKey = "very" | "long" | "para" | "passive";

/** Hemingway-style readability: scores, a sentence-length histogram and the sentences worth rewriting. */
export function ReadabilityPanel({ r, onLocate }: { r: ReadabilityReport; onLocate?: (text: string) => void }) {
  const passiveShare = r.sentences ? r.passiveSentences.length / r.sentences : 0;
  const lists: { key: ListKey; label: string; items: { text: string; meta: string }[]; empty: string }[] = [
    { key: "very", label: `Very long ${r.veryLongSentences.length}`, items: r.veryLongSentences.map((s) => ({ text: s.text, meta: `${s.words} words` })), empty: `No sentence runs past ${VERY_LONG_SENTENCE} words.` },
    { key: "long", label: `Long ${r.longSentences.length}`, items: r.longSentences.map((s) => ({ text: s.text, meta: `${s.words} words` })), empty: `No sentences between ${LONG_SENTENCE} and ${VERY_LONG_SENTENCE} words.` },
    { key: "para", label: `Long paragraphs ${r.longParagraphs.length}`, items: r.longParagraphs.map((p) => ({ text: p.text, meta: `${p.words} words` })), empty: `No paragraph is longer than ${LONG_PARAGRAPH} words.` },
    { key: "passive", label: `Passive ${r.passiveSentences.length}`, items: r.passiveSentences.map((s) => ({ text: s.text, meta: "passive (est.)" })), empty: "No passive constructions spotted." },
  ];
  const firstWithItems = lists.find((l) => l.items.length)?.key ?? "very";
  const [tab, setTab] = useState<ListKey>(firstWithItems);
  const active = lists.find((l) => l.key === tab) ?? lists[0];
  const maxBucket = Math.max(1, ...r.histogram.map((h) => h.count));

  if (r.words === 0) return <p className="text-[14px] text-ds-ink-2">Readability needs a few full sentences of body text.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat value={fmt(r.fleschReadingEase)} label="Flesch reading ease" hint={r.fleschLabel} />
        <Stat value={fmt(r.fleschKincaidGrade)} label="Flesch–Kincaid grade" hint="US school grade" />
        <Stat value={fmt(r.avgSentenceLength)} label="Words per sentence" hint={r.avgSentenceLength > 20 ? "on the long side" : "comfortable"} />
        <Stat value={`${Math.round(passiveShare * 100)}%`} label="Passive (estimate)" hint={`${r.passiveSentences.length} of ${r.sentences} sentences`} />
        <Stat value={String(r.adverbCount)} label="Adverbs (-ly)" hint={r.words ? `${fmt((r.adverbCount / r.words) * 100)}% of words` : ""} />
        <Stat value={`${Math.round(r.complexWordShare * 100)}%`} label="Complex words" hint="3+ syllables (est.)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div>
          <h4 className="text-[15px] font-medium text-ds-ink">Sentence length</h4>
          <p className="text-[13px] text-ds-ink-2">Words per sentence across {r.sentences} sentences. Variety reads well; a tall right side doesn&apos;t.</p>
          <div className="mt-4 flex h-[150px] items-end gap-2" role="img" aria-label={r.histogram.map((h) => `${h.label} words: ${h.count}`).join(", ")}>
            {r.histogram.map((h) => {
              const warn = h.min > LONG_SENTENCE;
              return (
                <div key={h.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="font-mono text-[11.5px] tabular-nums text-ds-ink-2">{h.count}</span>
                  <div
                    className={`w-full rounded-t-[8px] rounded-b-[3px] transition-[height] duration-700 ease-[var(--ds-ease)] ${warn ? "bg-[#e7b27a]" : "bg-[#c9d6db]"}`}
                    style={{ height: `${Math.max(h.count ? 6 : 2, (h.count / maxBucket) * 100)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-2">
            {r.histogram.map((h) => (
              <span key={h.label} className="flex-1 text-center text-[11px] text-ds-ink-3">
                {h.label}
              </span>
            ))}
          </div>
          {r.adverbExamples.length > 0 && (
            <div className="mt-5">
              <h4 className="text-[15px] font-medium text-ds-ink">Most used adverbs</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.adverbExamples.map((a) => (
                  <span key={a.word} className="rounded-[8px] bg-white/55 px-2 py-1 text-[12.5px] text-ds-ink-2">
                    {a.word} <span className="font-mono text-ds-ink-3">{a.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <Tabs label="Sentences to look at" value={tab} onChange={setTab} options={lists.map((l) => ({ value: l.key, label: l.label }))} />
          <ul className="mt-3 max-h-[340px] space-y-2 overflow-auto pr-1">
            {active.items.length === 0 && <li className="rounded-[14px] bg-white/40 px-4 py-5 text-[14px] text-ds-ink-2">{active.empty}</li>}
            {active.items.slice(0, 60).map((it, i) => (
              <li key={i} className="group rounded-[14px] bg-white/45 px-3.5 py-3">
                <p className="line-clamp-4 text-[14px] leading-6 text-ds-ink">{it.text}</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-ds-ink-3">
                  <span>{it.meta}</span>
                  {onLocate && (
                    <button type="button" onClick={() => onLocate(it.text)} className="rounded-[8px] px-2 py-0.5 text-ds-ink-2 transition hover:bg-white/80 hover:text-ds-accent-ink">
                      Show in editor
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[12.5px] leading-5 text-ds-ink-3">
        Flesch reading ease = 206.835 − 1.015 × words per sentence − 84.6 × syllables per word. Flesch–Kincaid grade = 0.39 × words per sentence + 11.8 × syllables per word − 15.59. Syllables are counted with a heuristic and passive voice is spotted with a
        “be/get + past participle” pattern, so treat both as estimates. Headings, table cells and code are left out. About {Math.max(1, Math.round(r.readingMinutes))} min to read at 238 words a minute.
      </p>
    </div>
  );
}

function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  return (
    <div className="rounded-[16px] bg-white/45 px-3.5 py-3">
      <div className="font-serif text-[30px] leading-8 tabular-nums text-ds-ink">{value}</div>
      <div className="mt-1 text-[12.5px] leading-4 text-ds-ink">{label}</div>
      {hint && <div className="mt-0.5 text-[12px] leading-4 text-ds-ink-3">{hint}</div>}
    </div>
  );
}
