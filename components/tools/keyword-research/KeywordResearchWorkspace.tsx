"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconAlert as AlertCircle,
  IconBin as Trash2,
  IconBookmark as Bookmark,
  IconCaret,
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
  IconClose,
  IconCopy as Copy,
  IconDownload as Download,
  IconInfo,
  IconLoupe as Search,
  IconRerun,
  IconSpinner as Loader2,
} from "@/components/icons/Icons";
import { Card, StatTile, buttonClass } from "@/components/ds/primitives";
import {
  COUNTRIES,
  DEFAULT_SOURCES,
  LANGUAGES,
  SOURCES,
  type ClusterInfo,
  type GroupType,
  type Intent,
  type KeywordRow,
  type ResearchResponse,
  type SuggestSource,
} from "@/lib/keywords/types";
import { downloadCsv } from "./csv";
import { AiMark, Chip, ClusterGrid, GroupBoard, INTENT_STYLE, SignalBar, SourceBadges, SourceMark, Sparkline } from "./parts";
import { PROVIDER_KEYWORDS } from "@/lib/limits";

const ArrowUp = (p: { className?: string }) => <IconCaret {...p} />;
const ArrowDown = (p: { className?: string }) => <IconCaret {...p} style={{ transform: "rotate(180deg)" }} />;

type SortKey = "keyword" | "signal" | "sources" | "intent" | "cluster" | "words" | "volume" | "kd" | "cpc";
type View = "table" | "topics" | "question" | "preposition" | "comparison";
type SavedList = { id: string; name: string; seed: string; country: string; count: number; createdAt: number };

const PAGE_SIZE = 50;
const INTENTS: Intent[] = ["informational", "commercial", "transactional", "navigational"];
const GROUP_LABEL: Record<GroupType, string> = { question: "Questions", comparison: "Comparisons", preposition: "Prepositions", other: "Other" };
const SOURCES_KEY = "seowise.kw.sources";

const selectClass =
  "h-12 rounded-[12px] border border-white/70 bg-white/55 px-3 text-[16px] text-ds-ink outline-none focus:ring-2 focus:ring-ds-accent/60";
const smallInput =
  "h-9 rounded-[12px] border border-white/70 bg-white/55 px-3 text-[14px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-accent/60";

function kdTone(kd: number) {
  return kd >= 70 ? "text-ds-danger" : kd >= 40 ? "text-ds-warning" : "text-ds-success";
}

const terms = (s: string) =>
  s
    .toLowerCase()
    .split(/[,\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

function timeAgo(ms: number) {
  const m = Math.round((Date.now() - ms) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

function SortHead({
  k,
  label,
  right,
  sort,
  onSort,
  title,
}: {
  k: SortKey;
  label: string;
  right?: boolean;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  title?: string;
}) {
  return (
    <th className={`px-3 py-2.5 font-medium ${right ? "text-right" : "text-left"}`} title={title}>
      <button type="button" onClick={() => onSort(k)} className="inline-flex items-center gap-1 hover:text-ds-ink">
        {label}
        {sort.key === k && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

/** Rebuild what a saved list does not store (older lists predate most fields). */
function hydrateRow(k: Partial<KeywordRow> & { keyword: string }): KeywordRow {
  return {
    keyword: k.keyword,
    sources: Array.isArray(k.sources) ? k.sources : [],
    rank: typeof k.rank === "number" ? k.rank : null,
    hits: typeof k.hits === "number" ? k.hits : 0,
    signal: typeof k.signal === "number" ? k.signal : 0,
    depth: k.depth === 0 || k.depth === 2 ? k.depth : 1,
    intent: k.intent ?? "informational",
    intentBy: k.intentBy === "ai" ? "ai" : "rules",
    cluster: k.cluster || k.keyword,
    group: k.group ?? "other",
    groupWord: k.groupWord ?? null,
    words: typeof k.words === "number" ? k.words : k.keyword.split(" ").length,
    volume: k.volume ?? null,
    kd: k.kd ?? null,
    cpc: k.cpc ?? null,
    competition: k.competition ?? null,
    trend: k.trend ?? null,
  };
}

export function KeywordResearchWorkspace() {
  const [seed, setSeed] = useState("");
  const [country, setCountry] = useState("us");
  const [language, setLanguage] = useState("en");
  const [sources, setSources] = useState<SuggestSource[]>(DEFAULT_SOURCES);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const [query, setQuery] = useState("");
  const [exclude, setExclude] = useState("");
  const [intents, setIntents] = useState<Set<Intent>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<Set<SuggestSource>>(new Set());
  const [groupFilter, setGroupFilter] = useState<GroupType | "all">("all");
  const [minWords, setMinWords] = useState(0);
  const [maxWords, setMaxWords] = useState(0);
  const [clusterFilter, setClusterFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "signal", dir: "desc" });
  const [view, setView] = useState<View>("table");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

  const [lists, setLists] = useState<SavedList[]>([]);

  // Remembered source picks are a per-browser convenience only.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SOURCES_KEY) ?? "null") as unknown;
      if (Array.isArray(saved)) {
        const valid = saved.filter((s): s is SuggestSource => SOURCES.some((x) => x.id === s));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
        if (valid.length) setSources(valid);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

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

  useEffect(() => {
    if (!loading) return;
    const started = Date.now();
    const t = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    return () => clearInterval(t);
  }, [loading]);

  function toggleSource(id: SuggestSource) {
    setSources((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      const final = next.length ? next : prev;
      try {
        localStorage.setItem(SOURCES_KEY, JSON.stringify(final));
      } catch {
        /* storage unavailable */
      }
      return final;
    });
  }

  function resetFilters() {
    setQuery("");
    setExclude("");
    setIntents(new Set());
    setSourceFilter(new Set());
    setGroupFilter("all");
    setMinWords(0);
    setMaxWords(0);
    setClusterFilter(null);
    setPage(0);
  }

  async function run(e?: React.FormEvent, fresh = false) {
    e?.preventDefault();
    const s = fresh && result ? result.seed : seed;
    if (s.trim().length < 2 || loading) return;
    setLoading(true);
    setElapsed(0);
    setError(null);
    setNote(null);
    try {
      const body = fresh && result ? { seed: result.seed, country: result.country, language: result.language, sources: result.sources, fresh: true } : { seed, country, language, sources };
      const res = await fetch("/api/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Research failed.");
      const r = data as ResearchResponse;
      setResult(r);
      setSelected(new Set());
      resetFilters();
      setView("table");
      setSort(r.provider.volume ? { key: "volume", dir: "desc" } : { key: "signal", dir: "desc" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed.");
    } finally {
      setLoading(false);
    }
  }

  const clusterInfo = useMemo(() => new Map<string, ClusterInfo>((result?.clusters ?? []).map((c) => [c.name, c])), [result]);

  const filtered = useMemo(() => {
    if (!result) return [];
    const include = terms(query);
    const excl = terms(exclude);
    const rows = result.keywords.filter(
      (r) =>
        include.every((t) => r.keyword.includes(t)) &&
        !excl.some((t) => r.keyword.includes(t)) &&
        (intents.size === 0 || intents.has(r.intent)) &&
        (sourceFilter.size === 0 || r.sources.some((s) => sourceFilter.has(s))) &&
        (groupFilter === "all" || r.group === groupFilter) &&
        (minWords === 0 || r.words >= minWords) &&
        (maxWords === 0 || r.words <= maxWords) &&
        (!clusterFilter || r.cluster === clusterFilter),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    const val = (r: KeywordRow): string | number => {
      if (sort.key === "sources") return r.sources.length;
      const v = r[sort.key];
      return v ?? (sort.key === "keyword" || sort.key === "intent" || sort.key === "cluster" ? "" : -1);
    };
    return [...rows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir || b.signal - a.signal;
      return ((av as number) - (bv as number)) * dir || b.signal - a.signal || a.keyword.localeCompare(b.keyword);
    });
  }, [result, query, exclude, intents, sourceFilter, groupFilter, minWords, maxWords, clusterFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasVolume = result?.provider.volume ?? false;
  const hasTrend = hasVolume && (result?.keywords.some((k) => (k.trend?.length ?? 0) > 1) ?? false);
  const filtersActive =
    query || exclude || intents.size || sourceFilter.size || groupFilter !== "all" || minWords || maxWords || clusterFilter;

  const summary = useMemo(() => {
    if (!result) return null;
    const kw = result.keywords;
    const withKd = kw.filter((k) => typeof k.kd === "number");
    const perSource = new Map<SuggestSource, number>();
    for (const k of kw) for (const s of k.sources) perSource.set(s, (perSource.get(s) ?? 0) + 1);
    const topics = result.clusters.filter((c) => c.kind === "topic").slice(0, 6);
    return {
      total: kw.length,
      clusters: result.clusters.filter((c) => c.kind !== "longtail").length,
      questions: kw.filter((k) => k.group === "question").length,
      comparisons: kw.filter((k) => k.group === "comparison").length,
      multiSource: kw.filter((k) => k.sources.length >= 2).length,
      avgKd: withKd.length ? Math.round(withKd.reduce((s, k) => s + (k.kd as number), 0) / withKd.length) : null,
      totalVol: kw.reduce((s, k) => s + (k.volume ?? 0), 0),
      perSource,
      topics,
      maxTopic: Math.max(1, ...topics.map((t) => t.size)),
      topQuestions: kw
        .filter((k) => k.group === "question")
        .sort((a, b) => b.signal - a.signal)
        .slice(0, 8),
      aiIntents: kw.some((k) => k.intentBy === "ai"),
    };
  }, [result]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "keyword" || key === "words" || key === "intent" || key === "cluster" ? "asc" : "desc" },
    );
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

  async function copyText(keywords: string[], label: string) {
    try {
      await navigator.clipboard.writeText(keywords.join("\n"));
      setNote(`Copied ${keywords.length} ${label}`);
    } catch {
      setNote("Copy failed: clipboard not available");
    }
  }

  async function save() {
    if (!result) return;
    const name = window.prompt("Name this list", result.seed);
    if (!name) return;
    const res = await fetch("/api/keywords/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, seed: result.seed, country: result.country, language: result.language, sources: result.sources, keywords: activeRows() }),
    });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok ? `Saved “${name}”` : res.status === 401 ? "Sign in to save lists." : (data.error ?? "Could not save."));
    if (res.ok) loadLists();
  }

  async function openList(id: string) {
    const res = await fetch(`/api/keywords/lists?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) return setNote(data.error ?? "Could not open list.");
    const keywords = (data.keywords as (Partial<KeywordRow> & { keyword: string })[]).map(hydrateRow);
    const anyVol = keywords.some((k) => typeof k.volume === "number");
    setResult({
      seed: data.seed,
      country: data.country,
      language: data.language ?? "en",
      sources: data.sources ?? [],
      keywords,
      clusters: [],
      provider: { volume: anyVol, name: anyVol ? "saved data" : null },
      ai: { used: false },
      stats: { suggestRequests: 0, elapsedMs: 0, perSource: {}, budgetHit: false, secondLevel: 0 },
      notes: ["Opened from a saved list."],
    });
    setSeed(data.seed);
    setSelected(new Set());
    resetFilters();
    setView("table");
  }

  async function removeList(id: string) {
    if (!window.confirm("Delete this saved list?")) return;
    await fetch(`/api/keywords/lists?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    loadLists();
  }

  function openCluster(name: string) {
    resetFilters();
    setClusterFilter(name);
    setView("table");
  }

  const viewTabs: { id: View; label: string; count?: number }[] = result
    ? [
        { id: "table", label: "All keywords" },
        { id: "topics", label: "Topics", count: summary?.clusters },
        { id: "question", label: "Questions", count: summary?.questions },
        { id: "preposition", label: "Prepositions", count: result.keywords.filter((k) => k.group === "preposition").length },
        { id: "comparison", label: "Comparisons", count: summary?.comparisons },
      ]
    : [];

  const expected = sources.length <= 3 ? 20 : 28;

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5">
        <form onSubmit={run} className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-ink-3" />
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter a seed keyword, e.g. project management software"
              aria-label="Seed keyword"
              className="h-12 w-full rounded-[12px] border border-white/70 bg-white/55 pl-11 pr-4 text-[16px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-accent/60"
              maxLength={80}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                const c = COUNTRIES.find((x) => x.code === e.target.value);
                if (c) setLanguage(c.lang);
              }}
              aria-label="Country"
              className={`${selectClass} min-w-0 sm:w-44`}
            >
              {[...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language" className={`${selectClass} min-w-0 sm:w-36`}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading || seed.trim().length < 2} className={buttonClass("primary", "lg")}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Researching…" : "Research"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-[13px] text-ds-ink-2 sm:w-16">Sources</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggestion sources">
            {SOURCES.map((s) => (
              <Chip key={s.id} active={sources.includes(s.id)} onClick={() => toggleSource(s.id)} title={s.hint}>
                <SourceMark id={s.id} />
                {s.name}
              </Chip>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-5 text-ds-ink-2">
          Pulls real autocomplete suggestions from each source (A–Z, 0–9, question words, prepositions, comparisons and modifiers,
          then a second pass on the strongest ideas), groups them into topics and estimates intent. Volume and difficulty come
          only from a connected data provider and are never estimated.
        </p>
      </Card>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-[18px] border border-ds-danger/30 bg-ds-danger/5 p-4 text-[14px] text-ds-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <Card className="p-5">
          <div className="flex items-center gap-3 text-[15px] text-ds-ink">
            <Loader2 className="h-4 w-4 animate-spin" />
            Expanding “{result && !seed ? result.seed : seed}” across {sources.length} source{sources.length === 1 ? "" : "s"}
            <span className="ml-auto font-mono text-[13px] tabular-nums text-ds-ink-2">{elapsed}s</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/50">
            <div
              className="h-full rounded-full bg-ds-accent transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(95, (elapsed / expected) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sources.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-white/40 px-2.5 py-1 text-[12px] text-ds-ink-2">
                <SourceMark id={s} /> querying
              </span>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-ds-ink-2">
            {elapsed < 4
              ? "Checking the cache first: repeat searches come back instantly."
              : elapsed < expected - 6
                ? "Running a few hundred autocomplete queries with polite pacing."
                : "Expanding the strongest ideas, then grouping and labelling topics."}
          </p>
        </Card>
      )}

      {result && summary && !loading && (
        <>
          {!hasVolume && (
            <div className="flex items-start gap-3 rounded-[18px] border border-white/70 bg-white/55 p-4 text-[14px] text-ds-ink-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ds-warning" />
              <div>
                <p className="font-medium text-ds-ink">
                  {result.provider.error ? "Volume data provider returned an error" : result.provider.locked ? "Sign in for search volume and difficulty" : "Search volume and difficulty are not connected"}
                </p>
                <p className="mt-1">
                  {result.provider.error
                    ? `${result.provider.error}. Keyword ideas below are still real.`
                    : result.provider.locked
                      ? `A free account adds real monthly volume, trend, difficulty and CPC for your top ${PROVIDER_KEYWORDS.free} ideas (Pro: top ${PROVIDER_KEYWORDS.pro}). The Signal column below ranks ideas by how prominently autocomplete suggests them; it is not a search volume.`
                      : "Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to unlock monthly volume, trend, keyword difficulty and CPC. Until then the Signal column ranks ideas by how prominently and how often autocomplete suggests them. It is relative to this research, not a search volume."}
                </p>
              </div>
            </div>
          )}
          {hasVolume && !result.provider.error && result.provider.limit !== undefined && result.provider.limit < result.keywords.length && (
            <p className="text-[13px] text-ds-ink-3">
              Volume, difficulty and CPC are shown for the {result.provider.limit} strongest ideas on your plan; the rest are ranked by Signal.
            </p>
          )}
          {hasVolume && result.provider.error && (
            <div className="flex items-start gap-3 rounded-[18px] border border-white/70 bg-white/55 p-4 text-[14px] text-ds-ink-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ds-warning" />
              {result.provider.error}
            </div>
          )}

          <div className={`grid gap-3 grid-cols-2 ${hasVolume ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}>
            <StatTile value={summary.total.toLocaleString()} label="keyword ideas" />
            <StatTile value={summary.clusters} label="topic clusters" />
            <StatTile value={summary.questions} label="questions" />
            <StatTile value={summary.comparisons} label="comparisons" />
            {hasVolume && <StatTile value={summary.totalVol.toLocaleString()} label="total monthly volume" />}
            {hasVolume && <StatTile value={summary.avgKd ?? "—"} label="avg. difficulty" />}
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ds-ink-2">
              {SOURCES.filter((s) => result.sources.includes(s.id)).map((s) => {
                const st = result.stats.perSource[s.id];
                return (
                  <span key={s.id} className="inline-flex items-center gap-1.5" title={st?.error ?? st?.market ?? s.hint}>
                    <SourceMark id={s.id} />
                    <span className="text-ds-ink">{(summary.perSource.get(s.id) ?? 0).toLocaleString()}</span> {s.name}
                    {st?.error && <span className="text-ds-warning">· partial</span>}
                    {st?.market && <span className="text-ds-ink-3">· {st.market.split(" ")[0]}</span>}
                  </span>
                );
              })}
              <span className="text-ds-ink-3">·</span>
              <span>{summary.multiSource.toLocaleString()} suggested by 2+ sources</span>
              <span className="ml-auto inline-flex items-center gap-2">
                {result.cachedAt ? (
                  <>
                    <span>Saved result from {timeAgo(result.cachedAt)}</span>
                    <button type="button" onClick={() => run(undefined, true)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-ds-ink transition-colors hover:bg-white/50">
                      <IconRerun className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </>
                ) : result.stats.suggestRequests > 0 ? (
                  <span>
                    {result.stats.suggestRequests} queries in {(result.stats.elapsedMs / 1000).toFixed(1)}s
                  </span>
                ) : null}
              </span>
            </div>
            {result.notes.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-white/60 pt-3 text-[12px] text-ds-ink-3">
                {result.notes.map((n) => (
                  <li key={n} className="flex gap-1.5">
                    <IconInfo className="mt-px h-3.5 w-3.5 shrink-0" /> {n}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {(summary.topics.length > 0 || summary.topQuestions.length > 0) && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {summary.topics.length > 0 && (
                <Card className="min-w-0 p-4 sm:p-5">
                  <h2 className="text-[18px] font-medium text-ds-ink">Biggest topics</h2>
                  <ul className="mt-3 space-y-2.5">
                    {summary.topics.map((t) => (
                      <li key={t.name}>
                        <button type="button" onClick={() => openCluster(t.name)} className="group block w-full text-left">
                          <span className="flex items-baseline justify-between gap-3 text-[14px]">
                            <span className="min-w-0 truncate text-ds-ink group-hover:underline">
                              {t.name}
                              {t.nameBy === "ai" && <AiMark />}
                            </span>
                            <span className="shrink-0 font-mono text-[12px] text-ds-ink-2">{t.size}</span>
                          </span>
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/50">
                            <span className="block h-full rounded-full bg-ds-accent/80" style={{ width: `${(t.size / summary.maxTopic) * 100}%` }} />
                          </span>
                          <span className="mt-1 block truncate text-[12px] text-ds-ink-3">{t.top.slice(0, 3).join(" · ")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {summary.topQuestions.length > 0 && (
                <Card className="min-w-0 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[18px] font-medium text-ds-ink">Top questions</h2>
                    <button type="button" onClick={() => setView("question")} className="rounded-full px-2 py-1 text-[13px] text-ds-ink-2 transition-colors hover:bg-white/50 hover:text-ds-ink">
                      All {summary.questions}
                    </button>
                  </div>
                  <ul className="mt-3 divide-y divide-white/60">
                    {summary.topQuestions.map((q) => (
                      <li key={q.keyword} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                        <span className="min-w-0 truncate text-ds-ink" title={q.keyword}>
                          {q.keyword}
                        </span>
                        <SourceBadges sources={q.sources} />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[12px] text-ds-ink-3">Questions map closely to the prompts people type into AI assistants.</p>
                </Card>
              )}
            </div>
          )}

          <Card className="p-0">
            <div className="flex flex-col gap-3 border-b border-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className="-mx-1 flex min-w-0 max-w-full gap-1 overflow-x-auto px-1 text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="tablist"
                  aria-label="Views"
                >
                  {viewTabs.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      aria-selected={view === v.id}
                      onClick={() => {
                        setView(v.id);
                        setPage(0);
                      }}
                      className={`shrink-0 rounded-[10px] px-3 py-1.5 transition-colors ${view === v.id ? "bg-white/70 text-ds-ink" : "text-ds-ink-2 hover:text-ds-ink"}`}
                    >
                      {v.label}
                      {typeof v.count === "number" && <span className="ml-1.5 text-ds-ink-3">{v.count}</span>}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => copyText(activeRows().map((r) => r.keyword), "keywords")} className={buttonClass("secondary", "sm")}>
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                  <button type="button" onClick={() => downloadCsv(activeRows(), result.seed)} className={buttonClass("secondary", "sm")}>
                    <Download className="h-4 w-4" /> CSV
                  </button>
                  <button type="button" onClick={save} className={buttonClass("primary", "sm")}>
                    <Bookmark className="h-4 w-4" /> Save list
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Include words…"
                  aria-label="Include keywords containing (comma separated)"
                  title="Comma-separate several words: a keyword must contain all of them"
                  className={`${smallInput} min-w-0 flex-1 sm:w-40 sm:flex-none`}
                />
                <input
                  value={exclude}
                  onChange={(e) => {
                    setExclude(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Exclude words…"
                  aria-label="Exclude keywords containing (comma separated)"
                  title="Comma-separate several words: keywords containing any of them are hidden"
                  className={`${smallInput} min-w-0 flex-1 sm:w-40 sm:flex-none`}
                />
                <select
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value as GroupType | "all");
                    setPage(0);
                  }}
                  aria-label="Group type"
                  className={smallInput}
                >
                  <option value="all">All groups</option>
                  {(Object.keys(GROUP_LABEL) as GroupType[]).map((g) => (
                    <option key={g} value={g}>
                      {GROUP_LABEL[g]}
                    </option>
                  ))}
                </select>
                <select
                  value={`${minWords}-${maxWords}`}
                  onChange={(e) => {
                    const [a, b] = e.target.value.split("-").map(Number);
                    setMinWords(a);
                    setMaxWords(b);
                    setPage(0);
                  }}
                  aria-label="Word count"
                  className={smallInput}
                >
                  <option value="0-0">Any length</option>
                  <option value="1-2">1–2 words</option>
                  <option value="3-4">3–4 words</option>
                  <option value="5-0">5+ words (long tail)</option>
                </select>
                {clusterFilter && (
                  <span className="inline-flex h-8 items-center gap-1 rounded-full bg-ds-accent-soft pl-3 pr-1 text-[13px] text-ds-ink">
                    Topic: {clusterFilter}
                    <button type="button" onClick={() => setClusterFilter(null)} aria-label="Clear topic filter" className="rounded-full p-1 hover:bg-white/60">
                      <IconClose className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filtersActive ? (
                  <button type="button" onClick={resetFilters} className="h-8 rounded-full px-3 text-[13px] text-ds-ink-2 hover:text-ds-ink">
                    Clear filters
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {INTENTS.map((i) => (
                  <Chip
                    key={i}
                    active={intents.has(i)}
                    onClick={() => {
                      setIntents((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      });
                      setPage(0);
                    }}
                  >
                    <span className="capitalize">{i}</span>
                  </Chip>
                ))}
                {result.sources.length > 1 && <span className="mx-1 h-5 w-px bg-white/70" aria-hidden />}
                {result.sources.length > 1 &&
                  SOURCES.filter((s) => result.sources.includes(s.id)).map((s) => (
                    <Chip
                      key={s.id}
                      active={sourceFilter.has(s.id)}
                      title={`Only keywords suggested by ${s.name}`}
                      onClick={() => {
                        setSourceFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        });
                        setPage(0);
                      }}
                    >
                      <SourceMark id={s.id} />
                      {s.name}
                    </Chip>
                  ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[13px] text-ds-ink-2">
              <span>
                {filtered.length.toLocaleString()} keyword{filtered.length === 1 ? "" : "s"}
                {selected.size > 0 && (
                  <>
                    {` · ${selected.size} selected (actions apply to selection) `}
                    <button type="button" onClick={() => setSelected(new Set())} className="underline hover:text-ds-ink">
                      clear
                    </button>
                  </>
                )}
              </span>
              {note && <span className="text-ds-success">{note}</span>}
            </div>

            {view === "table" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-[14px]">
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
                      <SortHead
                        k="signal"
                        label="Signal (rel.)"
                        sort={sort}
                        onSort={toggleSort}
                        title="Relative autocomplete signal 0–100: how high and how often this phrase is suggested across sources in this research. Not search volume."
                      />
                      <SortHead k="sources" label="Sources" sort={sort} onSort={toggleSort} title="Autocomplete sources that suggested this exact phrase" />
                      <SortHead k="intent" label={summary.aiIntents ? "Intent (est./AI)" : "Intent (est.)"} sort={sort} onSort={toggleSort} />
                      <SortHead k="cluster" label="Topic" sort={sort} onSort={toggleSort} />
                      <SortHead k="words" label="Words" right sort={sort} onSort={toggleSort} />
                      {hasVolume && <SortHead k="volume" label="Volume" right sort={sort} onSort={toggleSort} />}
                      {hasTrend && <th className="px-3 py-2.5 text-left font-medium">Trend</th>}
                      {hasVolume && <SortHead k="kd" label="Difficulty" right sort={sort} onSort={toggleSort} />}
                      {hasVolume && <SortHead k="cpc" label="CPC" right sort={sort} onSort={toggleSort} />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {pageRows.map((r) => (
                      <tr key={r.keyword} className="h-12 hover:bg-white/75">
                        <td className="px-3">
                          <input type="checkbox" aria-label={`Select ${r.keyword}`} checked={selected.has(r.keyword)} onChange={() => toggleSelect(r.keyword)} />
                        </td>
                        <td className="max-w-[340px] px-3 text-ds-ink">
                          <span className="block truncate" title={r.keyword}>
                            {r.keyword}
                            {r.depth === 0 && <span className="ml-2 rounded-full bg-white/50 px-1.5 py-0.5 text-[11px] text-ds-ink-2">seed</span>}
                          </span>
                        </td>
                        <td className="px-3">
                          <SignalBar value={r.signal} rank={r.rank} />
                        </td>
                        <td className="px-3">
                          <SourceBadges sources={r.sources} />
                        </td>
                        <td className="whitespace-nowrap px-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[12px] capitalize ${INTENT_STYLE[r.intent]}`}>{r.intent}</span>
                          {r.intentBy === "ai" && <AiMark />}
                        </td>
                        <td className="max-w-[180px] px-3">
                          <button type="button" onClick={() => setClusterFilter(r.cluster)} className="block max-w-full truncate text-left text-[13px] text-ds-ink-2 hover:text-ds-ink hover:underline" title={`Show topic “${r.cluster}”`}>
                            {r.cluster}
                          </button>
                        </td>
                        <td className="px-3 text-right font-mono text-ds-ink-2">{r.words}</td>
                        {hasVolume && <td className="px-3 text-right font-mono">{typeof r.volume === "number" ? r.volume.toLocaleString() : "—"}</td>}
                        {hasTrend && (
                          <td className="px-3">
                            <Sparkline values={r.trend ?? []} />
                          </td>
                        )}
                        {hasVolume && (
                          <td className={`px-3 text-right font-mono ${typeof r.kd === "number" ? kdTone(r.kd) : "text-ds-ink-3"}`}>{typeof r.kd === "number" ? r.kd : "—"}</td>
                        )}
                        {hasVolume && <td className="px-3 text-right font-mono text-ds-ink-2">{typeof r.cpc === "number" ? `$${r.cpc.toFixed(2)}` : "—"}</td>}
                      </tr>
                    ))}
                    {pageRows.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-3 py-10 text-center text-ds-ink-2">
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
                      <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={buttonClass("secondary", "sm")} aria-label="Previous page">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className={buttonClass("secondary", "sm")} aria-label="Next page">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {view === "topics" && <ClusterGrid rows={filtered} info={clusterInfo} onOpen={openCluster} />}
            {(view === "question" || view === "preposition" || view === "comparison") && (
              <GroupBoard type={view} rows={filtered} onCopy={(k, label) => copyText(k, `${label} keywords`)} />
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
