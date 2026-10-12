import type { BrandDoc, RollupDoc } from "@/lib/types";
import { Glass } from "@/components/studio/Glass";

/** One brand's share drawn as a glass tube lying on its side. */
function Tube({ pct, ours }: { pct: number; ours?: boolean }) {
  return (
    <div className="relative h-3 overflow-hidden rounded-full border border-white/80 bg-white/40 shadow-[inset_0_1px_3px_rgba(43,41,39,.08)]">
      <div className={`h-full rounded-full ${ours ? "bg-[linear-gradient(90deg,#f6c3a2,#f2a97f)]" : "bg-[linear-gradient(90deg,#d9d2c4,#c2b9a9)]"}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      <span className="absolute inset-x-2 top-[3px] h-[2px] rounded-full bg-white/60" />
    </div>
  );
}

interface Row {
  key: string;
  label: string;
  ours?: boolean;
  sov: number | null;
  mentionRate: number;
  cited: number | null;
  position: number | null | undefined;
}

export default function CompetitorCompare({ brand, latestRollup }: { brand: BrandDoc; latestRollup: RollupDoc | null }) {
  const r = latestRollup;
  const total = r?.totalAnswers ?? r?.totalPrompts ?? 0;
  const pct = (n: number | undefined) => (total > 0 ? Math.round(((n ?? 0) / total) * 100) : 0);
  const v2 = r?.shareOfVoice !== undefined;
  const rows: Row[] = [
    { key: "__you", label: brand.name, ours: true, sov: v2 ? r!.shareOfVoice! : null, mentionRate: r?.score ?? 0, cited: v2 ? (r!.citationRate ?? 0) : null, position: r?.avgPosition },
    ...brand.competitors.map((c) => ({
      key: c.domain,
      label: c.name,
      sov: v2 ? (r!.competitorShareOfVoice?.[c.domain] ?? 0) : null,
      mentionRate: pct(r?.competitorMentionCounts?.[c.domain]),
      cited: v2 ? pct(r!.competitorCitedCounts?.[c.domain]) : null,
      position: r?.competitorAvgPosition?.[c.domain],
    })),
  ];
  const others = r?.otherBrands ?? [];

  return (
    <Glass className="h-full p-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-[28px] leading-none">
          Share of <span className="italic">voice</span>
        </h2>
        {total > 0 && <span className="text-[12.5px] text-ds-ink-2">{total} answers</span>}
      </div>

      {brand.competitors.length === 0 ? (
        <p className="mt-4 text-[14px] text-ds-ink-2">Add a competitor in brand settings to see how often AI names you against them.</p>
      ) : !r ? (
        <p className="mt-4 text-[14px] text-ds-ink-2">Comparison appears after the first check.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-5">
            {rows.map((row) => (
              <div key={row.key}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className={`truncate text-[14.5px] ${row.ours ? "font-medium text-ds-ink" : "text-ds-ink-2"}`}>{row.label}</span>
                  <span className="font-serif text-[22px] tabular-nums leading-none">
                    {row.sov ?? row.mentionRate}
                    <span className="text-[13px] text-ds-ink-3">%</span>
                  </span>
                </div>
                <Tube pct={row.sov ?? row.mentionRate} ours={row.ours} />
                <p className="mt-1.5 text-[12px] text-ds-ink-2">
                  Named in {row.mentionRate}% of answers
                  {row.cited !== null && <> · cited in {row.cited}%</>}
                  {row.position != null && <> · avg #{row.position}</>}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-ds-ink-3">{v2 ? "Share of voice = a brand's mentions ÷ all tracked brands' mentions." : "Older check: bars show mention rate. Run a check for share of voice."}</p>
        </>
      )}

      {others.length > 0 && (
        <div className="mt-6 border-t border-white/60 pt-4">
          <h3 className="text-[13.5px] font-medium text-ds-ink">Other brands AI names alongside you</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {others.slice(0, 10).map((o) => (
              <li key={o.name} className="glass-inset rounded-full px-3 py-1 text-[12.5px] text-ds-ink-2">
                {o.name} <span className="tabular-nums text-ds-ink-3">×{o.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Glass>
  );
}
