import { Card } from "@/components/ds/primitives";

export default function ScoreCard({ score, checkedPrompts }: { score: number | null; checkedPrompts: number }) {
  return (
    <Card>
      <p className="text-[14px] text-ds-ink-2">Visibility score</p>
      <p className="mt-2 text-[44px] font-normal leading-[48px] tracking-[-0.03em] text-ds-ink">
        {score === null ? "—" : `${score}%`}
      </p>
      <p className="mt-2 text-[14px] text-ds-ink-2">
        {score === null
          ? "Waiting on first check"
          : `Latest check across ${checkedPrompts} prompt${checkedPrompts === 1 ? "" : "s"}`}
      </p>
    </Card>
  );
}
