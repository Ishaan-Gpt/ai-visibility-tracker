import { Glass, Kicker } from "@/components/studio/Glass";
import { Dial } from "@/components/studio/Pieces";

export default function ScoreCard({ score, checkedPrompts }: { score: number | null; checkedPrompts: number }) {
  return (
    <Glass className="flex h-full flex-col justify-between p-6">
      <Kicker>Visibility score</Kicker>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="font-serif text-[72px] leading-[0.85] tabular-nums">
          {score === null ? <span className="italic text-ds-ink-3">–</span> : score}
          {score !== null && <span className="text-[28px] text-ds-ink-3">%</span>}
        </p>
        <Dial value={score} size={68} />
      </div>
      <p className="mt-4 text-[13.5px] text-ds-ink-2">
        {score === null ? "Waiting on the first scheduled check" : `Latest check across ${checkedPrompts} prompt${checkedPrompts === 1 ? "" : "s"}`}
      </p>
    </Glass>
  );
}
