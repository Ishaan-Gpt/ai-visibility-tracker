"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconAlert as AlertCircle,
  IconBin as Trash2,
  IconBookmark as Bookmark,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconCopy as Copy,
  IconDownload as Download,
  IconLoupe as Search,
  IconSpinner as Loader2,
} from "@/components/icons/Icons";

const ArrowUp = (p: { className?: string }) => <IconCaret {...p} />;
const ArrowDown = (p: { className?: string }) => <IconCaret {...p} style={{ transform: "rotate(180deg)" }} />;
import { Card, StatTile, buttonClass } from "@/components/ds/primitives";
import { IconCaret } from "@/components/icons/Icons";
import { COUNTRIES, type Intent, type KeywordRow, type ResearchResponse } from "@/lib/keywords/types";

type SortKey = "keyword" | "intent" | "words" | "volume" | "kd" | "cpc";
type SavedList = { id: string; name: string; seed: string; country: string; count: number; createdAt: number };

const PAGE_SIZE = 50;
const INTENTS: Intent[] = ["informational", "commercial", "transactional", "navigational"];
const INTENT_STYLE: Record<Intent, string> = {
  informational: "bg-white/40 text-ds-ink-2",
  commercial: "bg-ds-accent-soft text-ds-accent",
  transactional: "bg-ds-success/10 text-ds-success",
  navigational: "bg-ds-warning/10 text-ds-warning",
};

function kdTone(kd: number) {
  return kd >= 70 ? "text-ds-danger" : kd >= 40 ? "text-ds-warning" : "text-ds-success";
}

function toCsv(rows: KeywordRow[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["keyword", "intent_est", "cluster", "words", "volume", "keyword_difficulty", "cpc"];
  const lines = rows.map((r) =>
    [r.keyword, r.intent, r.cluster, r.words, r.volume ?? "", r.kd ?? "", r.cpc ?? ""].map(esc).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

function SortHead({
  k,
  label,
  right,
  sort,
  onSort,
}: {
  k: SortKey;
  label: string;
  right?: boolean;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
}) {
  return (
    <th className={`px-3 py-2.5 font-medium ${right ? "text-right" : "text-left"}`}>
      <button type="button" onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-ds-ink">
        {label}
        {sort.key === k && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

export function KeywordResearchWorkspace() {
  const [seed, setSeed] = useState("");
  const [country, setCountry] = useState("us");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const [query, setQuery] = useState("");
  const [intents, setIntents] = useState<Set<Intent>>(new Set());
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "words", dir: "asc" });
  const [view, setView] = useState<"table" | "clusters">("table");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  const [lists, setLists] = useState<SavedList[]>([]);

  const loadLists = useCallback(async () => {
    try {
      const res = await fetch("/api/keywords/lists");
      if (res.ok) setLists(((await res.json()) as { lists: SavedList[] }).lists);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/keywords/lists")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { lists: SavedList[] } | null) => {
        if (!cancelled && data) setLists(data.lists);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (seed.trim().length < 2 || loading) return;
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, country, language: "en" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Research failed.");
      setResult(data as ResearchResponse);
      setSelected(new Set());
      setPage(0);
      setQuery("");
      setIntents(new Set());
      setSort({ key: (data as ResearchResponse).provider.volume ? "volume" : "words", dir: (data as ResearchResponse).provider.volume ? "desc" : "asc" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!result) return [];
    const q = query.trim().toLowerCase();
    const rows = result.keywords.filter(
      (r) => (!q || r.keyword.includes(q)) && (intents.size === 0 || intents.has(r.intent)),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sort.key] ?? (typeof a[sort.key] === "string" ? "" : -1);
      const bv = b[sort.key] ?? (typeof b[sort.key] === "string" ? "" : -1);
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir || a.keyword.localeCompare(b.keyword);
    });
  }, [result, query, intents, sort]);

  const clusters = useMemo(() => {
    const map = new Map<string, KeywordRow[]>();
    for (const r of filtered) map.set(r.cluster, [...(map.get(r.cluster) ?? []), r]);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasVolume = result?.provider.volume ?? false;

  const stats = useMemo(() => {
    if (!result) return null;
    const withKd = result.keywords.filter((k) => typeof k.kd === "number");
    const totalVol = result.keywords.reduce((s, k) => s + (k.volume ?? 0), 0);
    return {
      total: result.keywords.length,
      clusters: new Set(result.keywords.map((k) => k.cluster)).size,
      questions: result.keywords.filter((k) => k.source === "question").length,
      avgKd: withKd.length ? Math.round(withKd.reduce((s, k) => s + (k.kd as number), 0) / withKd.length) : null,
      totalVol,
    };
  }, [result]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "keyword" || key === "words" ? "asc" : "desc" }));
    setPage(0);
  }

  function toggleSelect(k: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const activeRows = () => (selected.size ? filtered.filter((r) => selected.has(r.keyword)) : filtered);

  async function copy() {
    await navigator.clipboard.writeText(activeRows().map((r) => r.keyword).join("\n"));
    setNote(`Copied ${activeRows().length} keywords`);
  }

  function exportCsv() {
    const blob = new Blob([toCsv(activeRows())], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `keywords-${result?.seed.replace(/\s+/g, "-") ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function save() {
    if (!result) return;
    const name = window.prompt("Name this list", result.seed);
    if (!name) return;
    const res = await fetch("/api/keywords/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, seed: result.seed, country: result.country, keywords: activeRows() }),
    });
    const data = await res.json();
    setNote(res.ok ? `Saved “${name}”` : (data.error ?? "Could not save."));
    if (res.ok) loadLists();
  }

  async function openList(id: string) {
    const res = await fetch(`/api/keywords/lists?id=${id}`);
    const data = await res.json();
    if (!res.ok) return setNote(data.error ?? "Could not open list.");
    const keywords: KeywordRow[] = (data.keywords as KeywordRow[]).map((k) => ({
      ...k,
      source: "autocomplete",
      words: k.keyword.split(" ").length,
    }));
    const anyVol = keywords.some((k) => typeof k.volume === "number");
    setResult({
      seed: data.seed,
      country: data.country,
      language: "en",
      keywords,
      provider: { volume: anyVol, name: anyVol ? "saved data" : null },
      stats: { suggestRequests: 0, elapsedMs: 0 },
    });
    setSeed(data.seed);
    setSelected(new Set());
    setPage(0);
  }

  async function removeList(id: string) {
    if (!window.confirm("Delete this saved list?")) return;
    await fetch(`/api/keywords/lists?id=${id}`, { method: "DELETE" });
    loadLists();
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5">
        <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-ink-3" />
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter a seed keyword, e.g. project management software"
              className="h-12 w-full rounded-[12px] border border-white/70 bg-white/55 pl-11 pr-4 text-[16px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-accent/60"
              maxLength={80}
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Country"
            className="h-12 rounded-[12px] border border-white/70 bg-white/55 px-3 text-[16px] text-ds-ink outline-none focus:ring-2 focus:ring-ds-accent/60"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading || seed.trim().length < 2} className={buttonClass("primary", "lg")}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Researching…" : "Research"}
          </button>
        </form>
        <p className="mt-3 text-[13px] text-ds-ink-2">
          Pulls real Google autocomplete suggestions (A–Z, questions, modifiers), groups them into topics and estimates
          intent. Volume and difficulty come from a connected data provider and are never estimated.
        </p>
      </Card>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-[18px] border border-ds-danger/30 bg-ds-danger/5 p-4 text-[14px] text-ds-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <Card className="flex items-center gap-3 p-6 text-ds-ink-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Expanding “{seed}” across ~80 queries. This takes 10–20 seconds…
        </Card>
      )}

      {result && stats && !loading && (
        <>
          {!hasVolume && (
            <div className="flex items-start gap-3 rounded-[18px] border border-white/70 bg-white/55 p-4 text-[14px] text-ds-ink-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ds-warning" />
              <div>
                <p className="font-medium text-ds-ink">
                  {result.provider.error ? "Volume data provider returned an error" : "Search volume and difficulty are not connected"}
                </p>
                <p className="mt-1">
                  {result.provider.error
                    ? `${result.provider.error}. Keyword ideas below are still real.`
                    : "Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to the environment to unlock monthly volume, keyword difficulty and CPC. Until then we show only what is real: the suggestions, topics and estimated intent."}
                </p>
              </div>
            </div>
          )}

          <div className={`grid gap-3 ${hasVolume ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-3"}`}>
            <StatTile value={stats.total} label="keywords found" />
            <StatTile value={stats.clusters} label="topic clusters" />
            <StatTile value={stats.questions} label="question keywords" />
            {hasVolume && <StatTile value={stats.totalVol.toLocaleString()} label="total monthly volume" />}
            {hasVolume && <StatTile value={stats.avgKd ?? "—"} label="avg. difficulty" />}
          </div>

          <Card className="p-0">
            <div className="flex flex-col gap-3 border-b border-white/70 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Filter keywords…"
                  className="h-9 w-48 rounded-[12px] border border-white/70 bg-white/55 px-3 text-[14px] outline-none focus:ring-2 focus:ring-ds-accent/60"
                />
                {INTENTS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={intents.has(i)}
                    onClick={() => {
                      setIntents((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      });
                      setPage(0);
                    }}
                    className={`h-8 rounded-full px-3 text-[13px] capitalize transition-colors ${
                      intents.has(i) ? "bg-ds-accent text-ds-ink" : "bg-white/40 text-ds-ink-2 hover:text-ds-ink"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-[12px] bg-white/40 p-0.5 text-[13px]">
                  {(["table", "clusters"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={`rounded-[9px] px-3 py-1 capitalize ${view === v ? "bg-white/55 text-ds-ink" : "text-ds-ink-2"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={copy} className={buttonClass("secondary")}>
                  <Copy className="h-4 w-4" /> Copy
                </button>
                <button type="button" onClick={exportCsv} className={buttonClass("secondary")}>
                  <Download className="h-4 w-4" /> CSV
                </button>
                <button type="button" onClick={save} className={buttonClass("primary")}>
                  <Bookmark className="h-4 w-4" /> Save list
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2 text-[13px] text-ds-ink-2">
              <span>
                {filtered.length} keyword{filtered.length === 1 ? "" : "s"}
                {selected.size > 0 && ` · ${selected.size} selected (actions apply to selection)`}
              </span>
              {note && <span className="text-ds-success">{note}</span>}
            </div>

            {view === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-[14px]">
                  <thead className="bg-white/40 text-[12px] text-ds-ink-2">
                    <tr>
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          aria-label="Select page"
                          checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.keyword))}
                          onChange={(e) =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              pageRows.forEach((r) => (e.target.checked ? next.add(r.keyword) : next.delete(r.keyword)));
                              return next;
                            })
                          }
                        />
                      </th>
                      <SortHead k="keyword" label="Keyword" sort={sort} onSort={toggleSort} />
                      <SortHead k="intent" label="Intent (est.)" sort={sort} onSort={toggleSort} />
                      <SortHead k="words" label="Words" right sort={sort} onSort={toggleSort} />
                      {hasVolume && <SortHead k="volume" label="Volume" right sort={sort} onSort={toggleSort} />}
                      {hasVolume && <SortHead k="kd" label="Difficulty" right sort={sort} onSort={toggleSort} />}
                      {hasVolume && <SortHead k="cpc" label="CPC" right sort={sort} onSort={toggleSort} />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {pageRows.map((r) => (
                      <tr key={r.keyword} className="h-12 hover:bg-white/75">
                        <td className="px-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${r.keyword}`}
                            checked={selected.has(r.keyword)}
                            onChange={() => toggleSelect(r.keyword)}
                          />
                        </td>
                        <td className="px-3 text-ds-ink">{r.keyword}</td>
                        <td className="px-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[12px] capitalize ${INTENT_STYLE[r.intent]}`}>{r.intent}</span>
                        </td>
                        <td className="px-3 text-right font-mono text-ds-ink-2">{r.words}</td>
                        {hasVolume && (
                          <td className="px-3 text-right font-mono">{typeof r.volume === "number" ? r.volume.toLocaleString() : "—"}</td>
                        )}
                        {hasVolume && (
                          <td className={`px-3 text-right font-mono ${typeof r.kd === "number" ? kdTone(r.kd) : "text-ds-ink-3"}`}>
                            {typeof r.kd === "number" ? r.kd : "—"}
                          </td>
                        )}
                        {hasVolume && (
                          <td className="px-3 text-right font-mono text-ds-ink-2">{typeof r.cpc === "number" ? `$${r.cpc.toFixed(2)}` : "—"}</td>
                        )}
                      </tr>
                    ))}
                    {pageRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-10 text-center text-ds-ink-2">
                          No keywords match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {pageCount > 1 && (
                  <div className="flex items-center justify-between border-t border-white/70 px-4 py-3 text-[13px] text-ds-ink-2">
                    <span>
                      Page {page + 1} of {pageCount}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={buttonClass("secondary")} aria-label="Previous page">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className={buttonClass("secondary")} aria-label="Next page">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {clusters.slice(0, 40).map(([name, rows]) => (
                  <div key={name} className="rounded-[18px] border border-white/70 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-medium text-ds-ink">{name}</h3>
                      <span className="rounded-full bg-white/40 px-2 py-0.5 text-[12px] text-ds-ink-2">{rows.length}</span>
                    </div>
                    <ul className="mt-3 space-y-1 text-[14px] text-ds-ink-2">
                      {rows.slice(0, 6).map((r) => (
                        <li key={r.keyword} className="truncate">
                          {r.keyword}
                        </li>
                      ))}
                      {rows.length > 6 && <li className="text-ds-ink-3">+{rows.length - 6} more</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {lists.length > 0 && (
        <Card>
          <h2 className="mb-3 text-[18px] font-medium text-ds-ink">Saved lists</h2>
          <ul className="divide-y divide-white/60">
            {lists.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <button type="button" onClick={() => openList(l.id)} className="min-w-0 text-left">
                  <span className="block truncate text-[16px] text-ds-ink">{l.name}</span>
                  <span className="text-[13px] text-ds-ink-2">
                    {l.count} keywords · seed “{l.seed}” · {new Date(l.createdAt).toLocaleDateString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeList(l.id)}
                  aria-label={`Delete ${l.name}`}
                  className="rounded-ds-sm p-2 text-ds-ink-3 transition-colors hover:bg-white/40 hover:text-ds-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
