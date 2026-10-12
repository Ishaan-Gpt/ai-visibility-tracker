import type { ReactNode } from "react";
import type { RollupDoc } from "@/lib/types";
import { Glass } from "@/components/studio/Glass";
import { Dial } from "@/components/studio/Pieces";

/** Small up/down note vs the previous check. `invert` for metrics where lower is better (position). */
function Delta({ now, before, invert, unit = "" }: { now: number | null | undefined; before: number | null | undefined; invert?: boolean; unit?: string }) {
  if (now === null || now === undefined || before === null || before === undefined) return null;
  const d = Math.round((now - before) * 10) / 10;
  if (d === 0) return <span className="text-[12.5px] text-ds-ink-3">no change</span>;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[12.5px] ${good ? "text-ds-success" : "text-ds-danger"}`}>
      <svg viewBox="0 0 10 10" className={`h-2.5 w-2.5 ${d > 0 ? "" : "rotate-180"}`} aria-hidden>
        <path d="M5 1.5 8.6 7.6H1.4z" fill="currentColor" />
      </svg>
      {Math.abs(d)}
      {unit} vs last check
    </span>
  );
}

function Tile({ title, italic, value, unit, foot, children }: { title: string; italic: string; value: ReactNode; unit?: string; foot: ReactNode; children?: ReactNode }) {
  return (
    <Glass className="flex h-full flex-col justify-between gap-4 p-5">
      <h2 className="font-serif text-[22px] leading-none">
        {title} <span className="italic">{italic}</span>
      </h2>
      <div className="flex items-end justify-between gap-3">
        <p className="font-serif text-[54px] leading-[0.85] tabular-nums">
          {value}
          {unit && <span className="text-[22px] text-ds-ink-3">{unit}</span>}
        </p>
        {children}
      </div>
      <div className="min-h-[18px] text-[12.5px] text-ds-ink-2">{foot}</div>
    </Glass>
  );
}

const dash = <span className="italic text-ds-ink-3">–</span>;

/** Mention rate with the bezel dial. Kept as the default export for older imports. */
export default function ScoreCard({ score, checkedPrompts, previous }: { score: number | null; checkedPrompts: number; previous?: number | null }) {
  return (
    <Tile
      title="Visibility"
      italic="rate"
      value={score === null ? dash : score}
      unit={score === null ? undefined : "%"}
      foot={score === null ? "Waiting on the first check" : (previous !== undefined && previous !== null ? <Delta now={score} before={previous} unit=" pts" /> : `Mentioned in ${checkedPrompts ? Math.round((score / 100) * checkedPrompts) : 0} of ${checkedPrompts} answers`)}
    >
      <Dial value={score} size={60} />
    </Tile>
  );
}

/** Four headline numbers, Peec/Otterly style: visibility, citations, position, share of voice. */
export function MetricCards({ latest, previous }: { latest: RollupDoc | null; previous: RollupDoc | null }) {
  const answers = latest?.totalAnswers ?? latest?.totalPrompts ?? 0;
  const hasV2 = latest?.citationRate !== undefined;
  const sent = latest?.sentiment;
  const sentTotal = sent ? sent.positive + sent.neutral + sent.negative : 0;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <ScoreCard score={latest?.score ?? null} checkedPrompts={answers} previous={previous?.score ?? null} />
      <Tile
        title="Cited as"
        italic="source"
        value={hasV2 ? latest!.citationRate : dash}
        unit={hasV2 ? "%" : undefined}
        foot={hasV2 ? (previous?.citationRate !== undefined ? <Delta now={latest!.citationRate} before={previous.citationRate} unit=" pts" /> : `${latest!.citedCount ?? 0} of ${answers} answers link your site`) : "Shows after the next check"}
      />
      <Tile
        title="Average"
        italic="position"
        value={latest?.avgPosition != null ? `#${latest.avgPosition}` : dash}
        foot={
          latest?.avgPosition != null ? (
            previous?.avgPosition != null ? <Delta now={latest.avgPosition} before={previous.avgPosition} invert /> : "Rank among brands named, when you're named"
          ) : hasV2 ? (
            "Not named in any answer yet"
          ) : (
            "Shows after the next check"
          )
        }
      />
      <Tile
        title="Share of"
        italic="voice"
        value={latest?.shareOfVoice !== undefined ? latest.shareOfVoice : dash}
        unit={latest?.shareOfVoice !== undefined ? "%" : undefined}
        foot={
          sentTotal > 0 ? (
            <span className="flex items-center gap-2">
              <span className="flex h-1.5 w-20 overflow-hidden rounded-full bg-white/50">
                <span className="bg-ds-success" style={{ width: `${(sent!.positive / sentTotal) * 100}%` }} />
                <span className="bg-[#c2b9a9]" style={{ width: `${(sent!.neutral / sentTotal) * 100}%` }} />
                <span className="bg-ds-danger" style={{ width: `${(sent!.negative / sentTotal) * 100}%` }} />
              </span>
              {sent!.positive} positive · {sent!.neutral} neutral · {sent!.negative} negative
            </span>
          ) : latest?.shareOfVoice !== undefined ? (
            "Your mentions vs tracked competitors"
          ) : (
            "Shows after the next check"
          )
        }
      />
    </div>
  );
}
