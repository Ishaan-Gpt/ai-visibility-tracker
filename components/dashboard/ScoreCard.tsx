export default function ScoreCard({ score, checkedPrompts }: { score: number | null; checkedPrompts: number }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <p className="mb-1 text-sm font-medium text-muted">Visibility score</p>
      <p className="text-4xl font-bold text-primary">{score === null ? "—" : `${score}%`}</p>
      <p className="mt-1 text-xs text-muted">
        {score === null ? "Waiting on first check" : `Based on the latest check across ${checkedPrompts} prompt${checkedPrompts === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}
