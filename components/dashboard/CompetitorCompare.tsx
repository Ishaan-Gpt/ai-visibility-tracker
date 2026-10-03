import type { BrandDoc, RollupDoc } from "@/lib/types";
import { Card } from "@/components/ds/primitives";

function Bar({ label, value, total, highlight }: { label: string; value: number; total: number; highlight?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[14px]">
        <span className="text-ds-ink">{label}</span>
        <span className="font-mono text-ds-ink-2">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ds-muted">
        <div
          className={`h-full rounded-full ${highlight ? "bg-ds-accent" : "bg-ds-ink-3"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CompetitorCompare({ brand, latestRollup }: { brand: BrandDoc; latestRollup: RollupDoc | null }) {
  if (brand.competitors.length === 0) {
    return (
      <Card>
        <h2 className="mb-1 text-[18px] font-medium text-ds-ink">Competitor comparison</h2>
        <p className="text-[14px] text-ds-ink-2">Add a competitor to see a side-by-side comparison.</p>
      </Card>
    );
  }

  const total = latestRollup?.totalPrompts ?? 0;

  return (
    <Card>
      <h2 className="mb-5 text-[18px] font-medium text-ds-ink">Competitor comparison</h2>
      <div className="flex flex-col gap-5">
        <Bar label={brand.name} value={latestRollup?.mentionedCount ?? 0} total={total} highlight />
        {brand.competitors.map((c) => (
          <Bar key={c.domain} label={c.name} value={latestRollup?.competitorMentionCounts[c.domain] ?? 0} total={total} />
        ))}
      </div>
    </Card>
  );
}
