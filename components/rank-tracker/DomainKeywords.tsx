"use client";

import { useMemo, useState } from "react";
import { IconCaret, IconDownload, IconInfo, IconSpinner } from "@/components/icons/Icons";
import { Glass } from "@/components/studio/Glass";
import { COUNTRIES, LANGUAGES } from "@/lib/keywords/types";
import { featureLabel, type DomainKeywordsResult } from "@/lib/rank-tracker/types";
import { Chip, FeatureTag, field, darkButton, smallField, softButton } from "./bits";
import { downloadDomainCsv } from "./export";
import { fmtCompact, fmtInt, pathOf, timeAgo } from "./format";
import { TrackButton } from "./TrackButton";

type SortKey = "position" | "volume" | "traffic" | "kd" | "keyword";

const INTENT_TONE: Record<string, string> = {
  informational: "bg-[#e6ede8] text-[#46604f]",
  commercial: "bg-ds-accent-soft text-ds-accent-ink",
  transactional: "bg-[#efe3f0] text-[#7a4f7f]",
  navigational: "bg-[#e5eaf2] text-[#4a5f80]",
};

/** "What does this domain rank for?" from the DataForSEO Labs database. Estimates, labelled as such. */
export function DomainKeywords({ defaultDomain, defaultCountry, lookupsLeft, lookupsLimit, rowLimit }: { defaultDomain: string; defaultCountry: string; lookupsLeft: number; lookupsLimit: number; rowLimit: number }) {
  const [domain, setDomain] = useState(defaultDomain);
  const [country, setCountry] = useState(defaultCountry);
  const [language, setLanguage] = useState(COUNTRIES.find((c) => c.code === defaultCountry)?.lang ?? "en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DomainKeywordsResult | null>(null);
  const [left, setLeft] = useState(lookupsLeft);
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<"all" | "top3" | "top10" | "top20" | "aio">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "traffic", dir: -1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rank-tracker/domain-keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain, country, language }) });
      const d = (await res.json().catch(() => ({}))) as DomainKeywordsResult & { error?: string; quota?: { remaining: number } };
      if (!res.ok) {
        setError(d.error ?? "The lookup failed.");
        if (d.quota) setLeft(d.quota.remaining);
        return;
      }
      setData(d);
      setSelected(new Set());
      if (d.quota) setLeft(d.quota.remaining);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = data.rows.filter((r) => {
      if (q && !r.keyword.includes(q) && !(r.url ?? "").toLowerCase().includes(q)) return false;
      if (bucket === "aio") return r.type === "ai_overview_reference";
      const p = r.type === "ai_overview_reference" ? null : r.position;
      if (bucket === "top3") return p !== null && p <= 3;
      if (bucket === "top10") return p !== null && p <= 10;
      if (bucket === "top20") return p !== null && p <= 20;
      return true;
    });
    const v = (r: (typeof list)[number]): number | string => (sort.key === "keyword" ? r.keyword : sort.key === "position" ? (r.position ?? 1e6) : sort.key === "volume" ? (r.volume ?? -1) : sort.key === "traffic" ? (r.traffic ?? -1) : (r.kd ?? -1));
    return [...list].sort((a, b) => {
      const x = v(a);
      const y = v(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [data, query, bucket, sort]);

  const head = (key: SortKey, label: string, title?: string) => (
    <th className="px-3 py-2.5 font-normal" title={title}>
      <button type="button" onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : key === "keyword" || key === "position" ? 1 : -1 }))} className="inline-flex items-center gap-1 hover:text-ds-ink">
        {label}
        {sort.key === key && <IconCaret className={`h-3 w-3 ${sort.dir === -1 ? "rotate-180" : ""}`} />}
      </button>
    </th>
  );

  const o = data?.organic;
  const trackRows = data ? data.rows.filter((r) => selected.has(r.keyword)).map((r) => ({ keyword: r.keyword, volume: r.volume })) : [];

  return (
    <div className="space-y-5">
      <Glass className="p-5 sm:p-6">
        <form onSubmit={run} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ds-ink-2">Any domain, yours or a competitor&apos;s</span>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="competitor.com" className={field} required autoComplete="off" spellCheck={false} inputMode="url" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ds-ink-2">Country</span>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setLanguage(COUNTRIES.find((c) => c.code === e.target.value)?.lang ?? "en");
              }}
              className={field}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ds-ink-2">Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={field}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.dfs}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={loading || !domain.trim()} className={`${darkButton} self-end`}>
            {loading && <IconSpinner className="h-4 w-4 animate-spin" />}
            {loading ? "Looking up…" : "Find keywords"}
          </button>
        </form>
        <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-5 text-ds-ink-2">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            From the DataForSEO Labs database, refreshed about weekly: positions and traffic are estimates, not a live Google check. Up to {rowLimit} keywords, highest estimated traffic first. {left} of {lookupsLimit} lookups left today; a lookup repeated within 7 days is free.
          </span>
        </p>
        {error && <p className="mt-3 text-[13.5px] text-ds-danger">{error}</p>}
      </Glass>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              ["Ranking keywords", fmtInt(o?.count ?? data.totalCount)],
              ["Est. monthly traffic", o?.etv !== null && o?.etv !== undefined ? fmtCompact(o.etv) : "–"],
              ["Position 1", fmtInt(o?.pos1)],
              ["Positions 2–3", fmtInt(o?.pos2_3)],
              ["Positions 4–10", fmtInt(o?.pos4_10)],
              ["In AI Overviews", fmtInt(data.aiOverviewCount)],
            ].map(([l, v]) => (
              <div key={l} className="glass-inset rounded-[16px] px-4 py-3">
                <p className="font-serif text-[28px] leading-none tabular-nums">{v}</p>
                <p className="mt-1 text-[12.5px] text-ds-ink-2">{l}</p>
              </div>
            ))}
          </div>

          <Glass className="min-w-0 p-0">
            <div className="flex flex-col gap-3 border-b border-white/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="min-w-0 font-serif text-[24px] leading-none">
                  <span className="break-all">{data.domain}</span> <span className="text-[15px] text-ds-ink-3">{data.rows.length} of {fmtInt(data.totalCount)}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <TrackButton keywords={trackRows} country={data.country} label={selected.size ? `Track ${selected.size}` : "Track (select rows)"} />
                  <button type="button" onClick={() => downloadDomainCsv(data)} className={softButton}>
                    <IconDownload className="h-4 w-4" /> CSV
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter keywords or URLs…" className={`${smallField} min-w-0 flex-1 sm:max-w-[260px]`} aria-label="Filter keywords" />
                <div className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {(
                    [
                      ["all", "All"],
                      ["top3", "Top 3"],
                      ["top10", "Top 10"],
                      ["top20", "Top 20"],
                      ["aio", "AI Overview"],
                    ] as const
                  ).map(([b, l]) => (
                    <Chip key={b} active={bucket === b} onClick={() => setBucket(b)}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-ds-ink-3">
                {data.cachedAt ? `Saved lookup from ${timeAgo(data.cachedAt)}.` : "Fresh lookup."} Database positions can lag the live results by days.
              </p>
            </div>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[13.5px]">
                <thead className="text-[12px] text-ds-ink-2">
                  <tr className="border-b border-white/60">
                    <th className="w-10 px-3 py-2.5">
                      <span className="sr-only">Select</span>
                    </th>
                    {head("keyword", "Keyword")}
                    {head("position", "Position")}
                    <th className="px-3 py-2.5 font-normal">URL</th>
                    {head("volume", "Volume", "Average monthly searches (Google Ads)")}
                    {head("traffic", "Est. traffic", "Estimated monthly visits from this keyword (DataForSEO etv)")}
                    {head("kd", "KD", "Keyword difficulty 0–100")}
                    <th className="px-3 py-2.5 font-normal">Intent</th>
                    <th className="px-3 py-2.5 font-normal">SERP features</th>
                    <th className="px-3 py-2.5 font-normal">
                      <span className="sr-only">Track</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.keyword}-${r.type}`} className="border-b border-white/45 hover:bg-white/45">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.keyword}`}
                          checked={selected.has(r.keyword)}
                          onChange={() =>
                            setSelected((s) => {
                              const n = new Set(s);
                              if (n.has(r.keyword)) n.delete(r.keyword);
                              else n.add(r.keyword);
                              return n;
                            })
                          }
                          className="h-4 w-4 accent-[#d5855a]"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{r.keyword}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {r.position ?? "–"}
                        {r.type !== "organic" && <span className="ml-1.5 text-[11px] text-ds-accent-ink">{featureLabel(r.type)}</span>}
                        {r.isNew ? (
                          <span className="ml-1.5 text-[11px] text-ds-success">new</span>
                        ) : r.previous !== null && r.rankAbsolute !== null && r.previous !== r.rankAbsolute ? (
                          <span className={`ml-1.5 text-[11px] ${r.previous > r.rankAbsolute ? "text-ds-success" : "text-ds-danger"}`} title="Change in absolute rank since the database's previous update">
                            {r.previous > r.rankAbsolute ? "▲" : "▼"}
                            {Math.abs(r.previous - r.rankAbsolute)}
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[220px] px-3 py-2">
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-ds-ink-2 hover:text-ds-ink" title={r.url}>
                            {pathOf(r.url)}
                          </a>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-ds-ink-2">{fmtCompact(r.volume)}</td>
                      <td className="px-3 py-2 tabular-nums text-ds-ink-2">{r.traffic === null ? "–" : r.traffic < 1 ? "<1" : fmtCompact(r.traffic)}</td>
                      <td className="px-3 py-2 tabular-nums text-ds-ink-2">{r.kd ?? "–"}</td>
                      <td className="px-3 py-2">{r.intent ? <span className={`rounded-full px-2 py-0.5 text-[11.5px] ${INTENT_TONE[r.intent] ?? "bg-white/60"}`}>{r.intent}</span> : "–"}</td>
                      <td className="max-w-[200px] px-3 py-2">
                        <span className="flex flex-wrap gap-1">
                          {r.serpFeatures
                            .filter((f) => f !== "related_searches" && f !== "people_also_search")
                            .slice(0, 3)
                            .map((f) => (
                              <FeatureTag key={f}>{featureLabel(f)}</FeatureTag>
                            ))}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <TrackButton keywords={[{ keyword: r.keyword, volume: r.volume }]} country={data.country} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && <p className="p-5 text-[13.5px] text-ds-ink-2">{data.rows.length ? "No keyword matches these filters." : "The database has no ranking keywords for this domain in this market."}</p>}
            </div>
          </Glass>
        </>
      )}
    </div>
  );
}
