"use client";

import type { DistinctiveResult, DistinctiveTerm } from "@/lib/tools/keywordDensity/distinctive";
import { englishListSize } from "@/lib/tools/keywordDensity/englishFrequency";
import { TrackButton } from "@/components/tools/keyword-density-checker/workspace/ui";

/** The words and phrases this text leans on far more than ordinary English does: its real topic, as a reader sees it. */
export function DistinctiveTerms({ result, tracked, onTrack }: { result: DistinctiveResult; tracked: Set<string>; onTrack: (t: string) => void }) {
  if (!result.words.length && !result.phrases.length) {
    return <p className="text-[14px] text-ds-ink-2">Not enough repeated content yet. Distinctive terms appear once a word is used at least twice.</p>;
  }
  const maxLog = Math.log10(Math.max(10, ...result.words.map((w) => w.ratio), ...result.phrases.map((w) => w.ratio)));
  return (
    <div className="space-y-4">
      <div className="grid gap-5 lg:grid-cols-2">
        <TermList title="Words" items={result.words.slice(0, 18)} maxLog={maxLog} tracked={tracked} onTrack={onTrack} />
        <TermList title="Phrases" items={result.phrases.slice(0, 18)} maxLog={maxLog} tracked={tracked} onTrack={onTrack} />
      </div>
      <p className="text-[12.5px] leading-5 text-ds-ink-3">
        An estimate. Each term&apos;s rate here is compared with how often it shows up in typical English, using a built-in list of about {Math.round(englishListSize() / 100) * 100} common words
        (words outside the list count as rare). Score = uses × ln(rate here ÷ typical rate). Use it to check the page is about what you think it&apos;s about, and to spot related terms worth covering.
      </p>
    </div>
  );
}

function TermList({ title, items, maxLog, tracked, onTrack }: { title: string; items: DistinctiveTerm[]; maxLog: number; tracked: Set<string>; onTrack: (t: string) => void }) {
  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-[15px] font-medium text-ds-ink">{title}</h4>
      {items.length === 0 ? (
        <p className="rounded-[14px] bg-white/40 px-4 py-4 text-[13.5px] text-ds-ink-2">None stand out yet.</p>
      ) : (
        <ol className="space-y-1">
          {items.map((t, i) => (
            <li key={t.key} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2 rounded-[12px] px-2 py-1.5 transition-colors hover:bg-white/45">
              <span className="font-serif text-[15px] italic text-ds-ink-3">{i + 1}</span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[14.5px] text-ds-ink">{t.phrase}</span>
                  <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-ds-ink-3">{t.count}×</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-ds-ink/[0.06]">
                    <div className="h-full rounded-full bg-[#9fb4bd]" style={{ width: `${Math.min(100, (Math.log10(Math.max(1, t.ratio)) / maxLog) * 100)}%` }} />
                  </div>
                  <span className="w-[86px] shrink-0 text-right text-[11.5px] text-ds-ink-3" title="How much more often than in typical English (estimate)">
                    {t.rare ? "rare word" : `${t.ratio >= 1000 ? "1000+" : Math.round(t.ratio)}× typical`}
                  </span>
                </div>
              </div>
              <TrackButton onClick={() => onTrack(t.phrase)} active={tracked.has(t.phrase)} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
