import type { BrandDoc, RollupDoc } from "@/lib/types";

function Bar({ label, value, total, highlight }: { label: string; value: number; total: number; highlight?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-orange-50">
        <div
          className={`h-full rounded-full ${highlight ? "bg-primary" : "bg-orange-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CompetitorCompare({ brand, latestRollup }: { brand: BrandDoc; latestRollup: RollupDoc | null }) {
  if (brand.competitors.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Competitor comparison</h2>
        <p className="text-sm text-muted">Add a competitor from settings to see a side-by-side comparison.</p>
      </div>
    );
  }

  const total = latestRollup?.totalPrompts ?? 0;

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Competitor comparison</h2>
      <div className="flex flex-col gap-4">
        <Bar label={brand.name} value={latestRollup?.mentionedCount ?? 0} total={total} highlight />
        {brand.competitors.map((c) => (
          <Bar key={c.domain} label={c.name} value={latestRollup?.competitorMentionCounts[c.domain] ?? 0} total={total} />
        ))}
      </div>
    </div>
  );
}
