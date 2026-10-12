/** Rollup maths. Pure, so the dashboard, run-now route and cron all agree on the numbers. */
import type { BrandDoc, DomainStat, EngineStat, Provider, RollupDoc, RunDoc, Sentiment } from "@/lib/types";
import { citationMatchesDomain } from "./analyze";
import { registrableDomain } from "./domains";

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

type RunLike = Pick<
  RunDoc,
  "provider" | "mentioned" | "citedUrls" | "competitorMentions" | "grounded" | "position" | "cited" | "citations" | "sentiment" | "competitorPositions" | "competitorCited" | "otherBrands"
>;

/** Builds the day's rollup from one complete check (every active prompt x engine). */
export function computeRollup(brand: Pick<BrandDoc, "id" | "domain" | "competitors">, date: string, runs: RunLike[]): RollupDoc {
  const total = runs.length;
  let mentioned = 0;
  let cited = 0;
  let grounded = 0;
  const positions: number[] = [];
  const sentiment: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  const competitorMentionCounts: Record<string, number> = {};
  const competitorCitedCounts: Record<string, number> = {};
  const compPositions: Record<string, number[]> = {};
  for (const c of brand.competitors) {
    competitorMentionCounts[c.domain] = 0;
    competitorCitedCounts[c.domain] = 0;
    compPositions[c.domain] = [];
  }
  const byProvider: Partial<Record<Provider, EngineStat>> = {};
  const domains = new Map<string, DomainStat>();
  const others = new Map<string, { name: string; count: number }>();

  for (const r of runs) {
    const isCited = r.cited ?? r.citedUrls.some((u) => citationMatchesDomain(u, brand.domain));
    if (r.mentioned) mentioned++;
    if (isCited) cited++;
    if (r.grounded) grounded++;
    if (r.mentioned && typeof r.position === "number") positions.push(r.position);
    if (r.mentioned && r.sentiment) sentiment[r.sentiment]++;

    const e = (byProvider[r.provider] ??= { total: 0, mentioned: 0, cited: 0, grounded: 0 });
    e.total++;
    if (r.mentioned) e.mentioned++;
    if (isCited) e.cited++;
    if (r.grounded) e.grounded++;

    for (const c of brand.competitors) {
      if (r.competitorMentions[c.domain]) competitorMentionCounts[c.domain]++;
      if (r.competitorCited?.[c.domain]) competitorCitedCounts[c.domain]++;
      const p = r.competitorPositions?.[c.domain];
      if (typeof p === "number") compPositions[c.domain].push(p);
    }

    // Source analysis: count each domain once per answer.
    const seenInAnswer = new Set<string>();
    const cites = r.citations ?? r.citedUrls.map((url) => ({ url, domain: registrableDomain(url) }));
    for (const c of cites) {
      if (!c.domain || seenInAnswer.has(c.domain)) continue;
      seenInAnswer.add(c.domain);
      const d = domains.get(c.domain) ?? { domain: c.domain, count: 0, sampleUrl: c.url };
      d.count++;
      domains.set(c.domain, d);
    }

    for (const name of r.otherBrands ?? []) {
      const key = name.toLowerCase();
      const o = others.get(key) ?? { name, count: 0 };
      o.count++;
      others.set(key, o);
    }
  }

  const compTotal = Object.values(competitorMentionCounts).reduce((a, b) => a + b, 0);
  const sovDen = mentioned + compTotal;
  const competitorShareOfVoice: Record<string, number> = {};
  const competitorAvgPosition: Record<string, number | null> = {};
  for (const c of brand.competitors) {
    competitorShareOfVoice[c.domain] = pct(competitorMentionCounts[c.domain], sovDen);
    const ps = compPositions[c.domain];
    competitorAvgPosition[c.domain] = ps.length ? round1(ps.reduce((a, b) => a + b, 0) / ps.length) : null;
  }

  const topDomains = [...domains.values()]
    .map((d) => {
      const kind: DomainStat["kind"] = citationMatchesDomain(d.domain, brand.domain)
        ? "own"
        : brand.competitors.some((c) => citationMatchesDomain(d.domain, c.domain))
          ? "competitor"
          : undefined;
      return kind ? { ...d, kind } : d;
    })
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain))
    .slice(0, 20);

  return {
    brandId: brand.id,
    date,
    totalPrompts: total,
    mentionedCount: mentioned,
    score: pct(mentioned, total),
    competitorMentionCounts,
    totalAnswers: total,
    citedCount: cited,
    citationRate: pct(cited, total),
    avgPosition: positions.length ? round1(positions.reduce((a, b) => a + b, 0) / positions.length) : null,
    shareOfVoice: pct(mentioned, sovDen),
    competitorShareOfVoice,
    competitorCitedCounts,
    competitorAvgPosition,
    sentiment,
    topDomains,
    byProvider,
    groundedCount: grounded,
    otherBrands: [...others.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    updatedAt: Date.now(),
  };
}
