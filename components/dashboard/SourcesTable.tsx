import type { RollupDoc } from "@/lib/types";
import { Glass } from "@/components/studio/Glass";
import { IcOpen } from "@/components/icons/Studio";

/** Which sites the engines lean on when answering your prompts (source analysis). */
export default function SourcesTable({ rollup, brandDomain }: { rollup: RollupDoc | null; brandDomain: string }) {
  const domains = rollup?.topDomains ?? [];
  const total = rollup?.totalAnswers ?? rollup?.totalPrompts ?? 0;
  const max = Math.max(1, ...domains.map((d) => d.count));
  const groundedAll = rollup?.groundedCount !== undefined && rollup.groundedCount === 0;

  return (
    <Glass className="h-full p-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-[28px] leading-none">
          Sources AI <span className="italic">trusts</span>
        </h2>
        {domains.length > 0 && <span className="text-[12.5px] text-ds-ink-2">share of {total} answers</span>}
      </div>
      {domains.length === 0 ? (
        <p className="mt-4 text-[14px] leading-6 text-ds-ink-2">
          {!rollup
            ? "After a check, this lists the websites the engines cite, so you know where to earn coverage."
            : groundedAll
              ? "The last check ran without live web search, so there were no sources to collect."
              : rollup.topDomains === undefined
                ? "Run a check to collect sources."
                : "No sources were cited in the last check."}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[13.5px]">
            <thead>
              <tr className="text-[12px] text-ds-ink-3">
                <th className="pb-2 font-normal">Domain</th>
                <th className="pb-2 font-normal">Cited in</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => {
                const share = total ? Math.round((d.count / total) * 100) : 0;
                return (
                  <tr key={d.domain} className="border-t border-white/60">
                    <td className="py-2.5 pr-3">
                      <span className={`font-mono text-[13px] ${d.kind === "own" ? "font-medium text-ds-accent-ink" : "text-ds-ink"}`}>{d.domain}</span>
                      {d.kind === "own" && <span className="ml-2 rounded-full bg-ds-accent-soft px-2 py-0.5 text-[11px] text-ds-accent-ink">you</span>}
                      {d.kind === "competitor" && <span className="ml-2 rounded-full bg-white/60 px-2 py-0.5 text-[11px] text-ds-ink-2">competitor</span>}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/50">
                          <div className={`h-full rounded-full ${d.kind === "own" ? "bg-ds-accent" : "bg-[#c2b9a9]"}`} style={{ width: `${(d.count / max) * 100}%` }} />
                        </div>
                        <span className="tabular-nums text-ds-ink-2">
                          {d.count} · {share}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      {d.sampleUrl && (
                        <a href={d.sampleUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label={`Open a cited page on ${d.domain}`} className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-ds-ink-2 hover:bg-white/70 hover:text-ds-ink">
                          <IcOpen className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!domains.some((d) => d.kind === "own") && (
            <p className="mt-3 text-[12.5px] text-ds-ink-2">
              <span className="font-mono">{brandDomain}</span> wasn&apos;t cited in this check. Pages on the sites above are where coverage would most likely reach these answers.
            </p>
          )}
        </div>
      )}
    </Glass>
  );
}
