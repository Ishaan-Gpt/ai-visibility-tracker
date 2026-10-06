import type { BrandDoc, RollupDoc } from "@/lib/types";
import { Glass } from "@/components/studio/Glass";

/** Side-by-side share of prompts that mention each brand, drawn as glass tubes lying on their side. */
function Lane({ label, value, total, ours }: { label: string; value: number; total: number; ours?: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className={`text-[14.5px] ${ours ? "font-medium text-ds-ink" : "text-ds-ink-2"}`}>{label}</span>
        <span className="font-serif text-[22px] tabular-nums leading-none">
          {pct}
          <span className="text-[13px] text-ds-ink-3">%</span>
        </span>
      </div>
      <div className="relative h-3.5 overflow-hidden rounded-full border border-white/80 bg-white/40 shadow-[inset_0_1px_3px_rgba(43,41,39,.08)]">
        <div className={`h-full rounded-full ${ours ? "bg-[linear-gradient(90deg,#f6c3a2,#f2a97f)]" : "bg-[linear-gradient(90deg,#d9d2c4,#c2b9a9)]"}`} style={{ width: `${Math.max(pct, 2)}%` }} />
        <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/60" />
      </div>
    </div>
  );
}

export default function CompetitorCompare({ brand, latestRollup }: { brand: BrandDoc; latestRollup: RollupDoc | null }) {
  const total = latestRollup?.totalPrompts ?? 0;
  return (
    <Glass className="h-full p-6">
      <h2 className="font-serif text-[28px] leading-none">
        You vs <span className="italic">them</span>
      </h2>
      {brand.competitors.length === 0 ? (
        <p className="mt-4 text-[14px] text-ds-ink-2">Add a competitor to see a side-by-side comparison.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <Lane label={brand.name} value={latestRollup?.mentionedCount ?? 0} total={total} ours />
          {brand.competitors.map((c) => (
            <Lane key={c.domain} label={c.name} value={latestRollup?.competitorMentionCounts[c.domain] ?? 0} total={total} />
          ))}
        </div>
      )}
    </Glass>
  );
}
