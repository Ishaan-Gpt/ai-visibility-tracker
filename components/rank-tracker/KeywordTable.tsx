"use client";

import { useMemo, useState } from "react";
import { IconCaret, IconDownload, IconSpinner } from "@/components/icons/Icons";
import { IcBin, IcPlus } from "@/components/icons/Studio";
import { Glass } from "@/components/studio/Glass";
import { readKeywordFile, type ImportResult } from "@/lib/rank-tracker/importFile";
import { bucketOf, moveOf, type Bucket } from "@/lib/rank-tracker/metrics";
import { featureLabel, type RtKeyword, type RtProject } from "@/lib/rank-tracker/types";
import { Chip, Delta, FeatureTag, Position, PositionSpark, smallField, softButton } from "./bits";
import { downloadRankCsv, downloadRankXlsx } from "./export";
import { fmtCompact, pathOf, timeAgo } from "./format";

type SortKey = "keyword" | "position" | "d1" | "d7" | "d30" | "best" | "volume";
type Filter = "all" | "top3" | "top10" | "top100" | "none" | "up" | "down" | "pending";

const PAGE = 50;

export function KeywordTable({
  project,
  keywords,
  today,
  keywordLimit,
  keywordsUsed,
  stopOnOwn,
  onChanged,
  onOpen,
}: {
  project: RtProject;
  keywords: RtKeyword[];
  today: string;
  keywordLimit: number;
  keywordsUsed: number;
  stopOnOwn: boolean;
  onChanged: (message?: string) => void;
  onOpen: (id: string) => void;
}) {
  const [adding, setAdding] = useState(keywords.length === 0);
  const [text, setText] = useState("");
  const [tagText, setTagText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [imported, setImported] = useState<(ImportResult & { file: string }) | null>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "position", dir: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const rows = useMemo(
    () =>
      keywords.map((k) => {
        const m = moveOf(k.history ?? [], today);
        return { k, m, pos: k.last ? k.last.position : undefined };
      }),
    [keywords, today],
  );
  const tags = useMemo(() => [...new Set(keywords.flatMap((k) => k.tags))].sort(), [keywords]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inBucket = (pos: number | null | undefined, ok: Bucket[]) => pos !== undefined && ok.includes(bucketOf(pos));
    const list = rows.filter(({ k, m, pos }) => {
      if (q && !k.keyword.includes(q) && !(k.last?.url ?? "").toLowerCase().includes(q)) return false;
      if (tag && !k.tags.includes(tag)) return false;
      switch (filter) {
        case "top3":
          return inBucket(pos, ["1-3"]);
        case "top10":
          return inBucket(pos, ["1-3", "4-10"]);
        case "top100":
          return pos !== undefined && pos !== null;
        case "none":
          return pos === null;
        case "up":
          return (m?.d1 ?? 0) > 0;
        case "down":
          return (m?.d1 ?? 0) < 0;
        case "pending":
          return !k.last || Boolean(k.pendingTaskId);
        default:
          return true;
      }
    });
    const val = (r: (typeof rows)[number]): number | string => {
      switch (sort.key) {
        case "keyword":
          return r.k.keyword;
        case "position":
          return r.pos === undefined ? 1e9 : r.pos === null ? 1e6 : r.pos;
        case "best":
          return r.k.best ?? 1e6;
        case "volume":
          return -(r.k.volume ?? -1);
        default:
          return -(r.m?.[sort.key] ?? -1e6);
      }
    };
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, query, tag, filter, sort]);

  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(r.k.id));

  async function call(method: "POST" | "PATCH" | "DELETE", body: unknown, label: string) {
    setBusy(label);
    setNote(null);
    try {
      const res = await fetch(`/api/rank-tracker/projects/${project.id}/keywords`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string; removed?: number; updated?: number };
      if (!res.ok) {
        setNote({ ok: false, text: data.error ?? "That didn't work. Try again." });
        return false;
      }
      const msg = data.message ?? (data.removed !== undefined ? `Removed ${data.removed}.` : data.updated !== undefined ? `Updated ${data.updated}.` : "Done.");
      setNote({ ok: true, text: msg });
      onChanged(msg);
      return true;
    } catch {
      setNote({ ok: false, text: "Network error. Try again." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setNote(null);
    try {
      const parsed = await readKeywordFile(file);
      if (!parsed.rows.length) setNote({ ok: false, text: "No keywords found in that file." });
      else setImported({ ...parsed, file: file.name });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Couldn't read that file." });
    }
  }

  /** Sends the parsed file in request-sized chunks and reports one combined result. */
  async function runImport() {
    if (!imported) return;
    setBusy("import");
    setNote(null);
    const extra = tagText.split(",").map((t) => t.trim()).filter(Boolean);
    const totals = { added: 0, duplicates: 0, invalid: 0, overLimit: 0 };
    try {
      for (let i = 0; i < imported.rows.length; i += 500) {
        const chunk = imported.rows.slice(i, i + 500);
        const res = await fetch(`/api/rank-tracker/projects/${project.id}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: chunk, tags: extra }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; added?: string[]; duplicates?: string[]; invalid?: unknown[]; overLimit?: string[] };
        if (!res.ok) {
          setNote({ ok: false, text: data.error ?? "The import stopped part way. Try again; keywords already added are skipped." });
          break;
        }
        totals.added += data.added?.length ?? 0;
        totals.duplicates += data.duplicates?.length ?? 0;
        totals.invalid += data.invalid?.length ?? 0;
        totals.overLimit += data.overLimit?.length ?? 0;
        // Once the plan is full every later chunk would be over the limit too.
        if ((data.overLimit?.length ?? 0) > 0) {
          totals.overLimit += Math.max(0, imported.rows.length - (i + chunk.length));
          break;
        }
      }
      const msg = [
        `Imported ${totals.added} keyword${totals.added === 1 ? "" : "s"}.`,
        totals.duplicates ? `${totals.duplicates} already tracked.` : "",
        totals.invalid ? `${totals.invalid} skipped as invalid.` : "",
        totals.overLimit ? `${totals.overLimit} over your plan's ${keywordLimit}-keyword limit.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      setNote((n) => n ?? { ok: totals.added > 0, text: msg });
      setImported(null);
      onChanged(msg);
    } catch {
      setNote({ ok: false, text: "Network error. Try again; keywords already added are skipped." });
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const tagsList = tagText.split(",").map((t) => t.trim()).filter(Boolean);
    if (await call("POST", { text, tags: tagsList }, "add")) {
      setText("");
    }
  }

  const sel = [...selected].filter((id) => keywords.some((k) => k.id === id));
  const room = Math.max(0, keywordLimit - keywordsUsed);
  const lines = text.split(/[\n,;\t]+/).map((l) => l.trim()).filter(Boolean).length;

  const head = (key: SortKey, label: string, className = "") => (
    <th className={`px-3 py-2.5 font-normal ${className}`}>
      <button type="button" onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))} className="inline-flex items-center gap-1 hover:text-ds-ink">
        {label}
        {sort.key === key && <IconCaret className={`h-3 w-3 ${sort.dir === -1 ? "rotate-180" : ""}`} />}
      </button>
    </th>
  );

  return (
    <Glass className="min-w-0 p-0">
      <div className="flex flex-col gap-3 border-b border-white/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-[26px] leading-none">
            Keywords <span className="text-[16px] text-ds-ink-3">{keywords.length}</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setAdding((v) => !v)} className={softButton} aria-expanded={adding}>
              <IcPlus className="h-4 w-4" /> Add keywords
            </button>
            <button type="button" disabled={!keywords.length} onClick={() => downloadRankCsv(project, filtered.map((r) => r.k), today)} className={softButton}>
              <IconDownload className="h-4 w-4" /> CSV
            </button>
            <button type="button" disabled={!keywords.length} onClick={() => downloadRankXlsx(project, filtered.map((r) => r.k), today)} className={softButton}>
              <IconDownload className="h-4 w-4" /> Excel
            </button>
          </div>
        </div>

        {adding && (
          <form onSubmit={add} className="grid gap-3 rounded-[16px] bg-white/35 p-3 sm:grid-cols-[1fr_220px]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={"One keyword per line\nbest running shoes\nrunning shoes for flat feet"}
              className="glass-inset min-h-[110px] w-full rounded-[12px] p-3 text-[14px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:bg-white/70"
            />
            <div className="flex flex-col gap-2">
              <input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Tags (optional, comma separated)" className={`${smallField} w-full`} />
              <p className="text-[12.5px] leading-5 text-ds-ink-2">
                {room} of {keywordLimit} keyword slots left on your plan. Duplicates are skipped. New keywords are checked at the next scheduled run, or now with Check now.
              </p>
              <button type="submit" disabled={!lines || busy === "add"} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-ds-ink px-4 text-[14px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633] disabled:opacity-40">
                {busy === "add" && <IconSpinner className="h-4 w-4 animate-spin" />}
                Add {lines ? lines : ""} keyword{lines === 1 ? "" : "s"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/60 pt-3 sm:col-span-2">
              <label className={`${softButton} cursor-pointer`}>
                <IconDownload className="h-4 w-4 rotate-180" /> Import a file
                <input type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={pickFile} className="sr-only" />
              </label>
              {imported ? (
                <>
                  <p className="min-w-0 flex-1 text-[13px] leading-5 text-ds-ink-2">
                    <span className="text-ds-ink">{imported.rows.length.toLocaleString()} keywords</span> in {imported.file}
                    {imported.source ? ` (${imported.source} export)` : ""}. Keyword column: {imported.columns.keyword}
                    {imported.columns.tags ? `; ${imported.columns.tags} becomes tags` : ""}
                    {imported.columns.volume ? `; ${imported.columns.volume} kept as volume` : ""}.
                    {imported.rows.length > room ? ` Only ${room} fit on your plan.` : ""}
                  </p>
                  <button type="button" onClick={() => setImported(null)} className={softButton} disabled={busy === "import"}>
                    Cancel
                  </button>
                  <button type="button" onClick={runImport} disabled={busy === "import" || room === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-ds-ink px-4 text-[14px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633] disabled:opacity-40">
                    {busy === "import" && <IconSpinner className="h-4 w-4 animate-spin" />}
                    Import {Math.min(imported.rows.length, room).toLocaleString()}
                  </button>
                </>
              ) : (
                <p className="min-w-0 flex-1 text-[12.5px] leading-5 text-ds-ink-2">
                  Moving from SE Ranking, Semrush, Ahrefs, AccuRanker or Search Console? Drop in their CSV or Excel export. Groups and tags come across as tags.
                </p>
              )}
            </div>
          </form>
        )}
        {note && <p className={`text-[13px] ${note.ok ? "text-ds-success" : "text-ds-danger"}`}>{note.text}</p>}

        {keywords.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search keywords or URLs…"
                aria-label="Search keywords"
                className={`${smallField} min-w-0 flex-1 sm:max-w-[260px]`}
              />
              {tags.length > 0 && (
                <select value={tag ?? ""} onChange={(e) => setTag(e.target.value || null)} aria-label="Filter by tag" className={smallField}>
                  <option value="">All tags</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(
                [
                  ["all", "All"],
                  ["top3", "Top 3"],
                  ["top10", "Top 10"],
                  ["top100", "Top 100"],
                  ["none", "Not ranking"],
                  ["up", "Moved up"],
                  ["down", "Moved down"],
                  ["pending", "Pending"],
                ] as const
              ).map(([f, l]) => (
                <Chip
                  key={f}
                  active={filter === f}
                  onClick={() => {
                    setFilter(f);
                    setPage(0);
                  }}
                >
                  {l}
                </Chip>
              ))}
            </div>
          </>
        )}

        {sel.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-ds-accent-soft/70 px-3 py-2 text-[13px]">
            <span className="font-medium">{sel.length} selected</span>
            <button
              type="button"
              className={softButton}
              disabled={busy !== null}
              onClick={async () => {
                const t = window.prompt("Add tag to the selected keywords");
                if (t?.trim()) await call("PATCH", { ids: sel, add: [t.trim()] }, "tag");
              }}
            >
              Add tag
            </button>
            {tag && (
              <button type="button" className={softButton} disabled={busy !== null} onClick={() => call("PATCH", { ids: sel, remove: [tag] }, "untag")}>
                Remove “{tag}”
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-[11px] px-3 text-ds-danger hover:bg-white/50 disabled:opacity-40"
              disabled={busy !== null}
              onClick={async () => {
                if (!window.confirm(`Stop tracking ${sel.length} keyword${sel.length === 1 ? "" : "s"}? Their history is deleted.`)) return;
                if (await call("DELETE", { ids: sel }, "remove")) setSelected(new Set());
              }}
            >
              {busy === "remove" ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IcBin className="h-4 w-4" />} Remove
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-ds-ink-2 hover:text-ds-ink">
              Clear
            </button>
          </div>
        )}
      </div>

      {keywords.length === 0 ? (
        <p className="p-6 text-[14px] text-ds-ink-2">No keywords yet. Paste the searches you want to rank for above, or use Track in Keyword Research and Domain keywords.</p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-[13.5px]">
            <thead className="text-[12px] text-ds-ink-2">
              <tr className="border-b border-white/60">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPage}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        for (const r of pageRows) {
                          if (allOnPage) n.delete(r.k.id);
                          else n.add(r.k.id);
                        }
                        return n;
                      })
                    }
                    className="h-4 w-4 accent-[#d5855a]"
                  />
                </th>
                {head("keyword", "Keyword", "min-w-[200px]")}
                {head("position", "Position")}
                {head("d1", "Change")}
                {head("d7", "7d")}
                {head("d30", "30d")}
                <th className="px-3 py-2.5 font-normal">Trend</th>
                {head("best", "Best")}
                <th className="px-3 py-2.5 font-normal">Ranking URL</th>
                <th className="px-3 py-2.5 font-normal">SERP features</th>
                {project.competitors.map((c) => (
                  <th key={c} className="max-w-[110px] truncate px-3 py-2.5 font-normal" title={c}>
                    {c}
                  </th>
                ))}
                {head("volume", "Volume")}
                <th className="px-3 py-2.5 font-normal">Checked</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ k, m, pos }) => {
                const last = k.last;
                const pending = Boolean(k.pendingTaskId) && !k.pendingTaskId?.startsWith("claim:");
                return (
                  <tr key={k.id} className="border-b border-white/45 align-middle transition-colors hover:bg-white/45">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${k.keyword}`}
                        checked={selected.has(k.id)}
                        onChange={() =>
                          setSelected((s) => {
                            const n = new Set(s);
                            if (n.has(k.id)) n.delete(k.id);
                            else n.add(k.id);
                            return n;
                          })
                        }
                        className="h-4 w-4 accent-[#d5855a]"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <button type="button" onClick={() => onOpen(k.id)} className="text-left font-medium text-ds-ink underline-offset-4 hover:underline">
                        {k.keyword}
                      </button>
                      {(k.tags.length > 0 || k.lastError) && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {k.tags.map((t) => (
                            <button key={t} type="button" onClick={() => setTag(t)} className="rounded-full bg-white/60 px-1.5 text-[11px] text-ds-ink-2 hover:text-ds-ink">
                              {t}
                            </button>
                          ))}
                          {k.lastError && !pending && (
                            <span className="text-[11px] text-ds-danger" title={k.lastError}>
                              last attempt failed, retrying
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Position value={pos} scanned={last?.scanned} noResults={last?.noResults} pending={pending} />
                        {last?.source === "featured_snippet" && <span className="text-[10.5px] text-ds-accent-ink" title="Featured snippet, no organic listing">FS</span>}
                        {pending && last && <IconSpinner className="h-3 w-3 animate-spin text-ds-ink-3" aria-label="Checking" />}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{m ? <Delta value={m.d1 === null || m.prev === undefined ? null : m.d1} entered={m.prev === null && m.current !== null} lost={m.prev !== null && m.prev !== undefined && m.current === null} /> : <Delta value={null} />}</td>
                    <td className="px-3 py-2.5">
                      <Delta value={m?.d7 ?? null} small />
                    </td>
                    <td className="px-3 py-2.5">
                      <Delta value={m?.d30 ?? null} small />
                    </td>
                    <td className="px-3 py-2.5">
                      <PositionSpark history={k.history ?? []} />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-ds-ink-2">{k.best ?? "–"}</td>
                    <td className="max-w-[220px] px-3 py-2.5">
                      {last?.url ? (
                        <a href={last.url} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-ds-ink-2 hover:text-ds-ink" title={last.url}>
                          {pathOf(last.url)}
                        </a>
                      ) : (
                        <span className="text-ds-ink-3">–</span>
                      )}
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {(last?.ourFeatures ?? []).map((f) => (
                          <FeatureTag key={`m-${f}`} mine>
                            {featureLabel(f)}
                          </FeatureTag>
                        ))}
                        {(last?.features ?? [])
                          .filter((f) => !(last?.ourFeatures ?? []).includes(f) && f !== "related_searches" && f !== "people_also_search")
                          .slice(0, 3)
                          .map((f) => (
                            <FeatureTag key={f}>{featureLabel(f)}</FeatureTag>
                          ))}
                        {!last && <span className="text-ds-ink-3">–</span>}
                      </span>
                    </td>
                    {project.competitors.map((c) => {
                      const cp = last?.competitors.find((x) => x.domain === c);
                      return (
                        <td key={c} className="px-3 py-2.5 tabular-nums text-ds-ink-2">
                          {!last ? "–" : cp?.position ?? <span className="text-[12px] text-ds-ink-3" title={`Not found in the first ${last.scanned || 100} results scanned`}>&gt;{last.scanned && last.scanned < 100 ? last.scanned : 100}</span>}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 tabular-nums text-ds-ink-2">{fmtCompact(k.volume)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] text-ds-ink-2">{pending ? "checking…" : last ? timeAgo(last.checkedAt) : "pending"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > PAGE && (
        <div className="flex items-center justify-between gap-3 p-4 text-[13px] text-ds-ink-2">
          <span>
            {page * PAGE + 1}–{Math.min(filtered.length, (page + 1) * PAGE)} of {filtered.length}
          </span>
          <span className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className={softButton}>
              Previous
            </button>
            <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className={softButton}>
              Next
            </button>
          </span>
        </div>
      )}
      {keywords.length > 0 && filtered.length === 0 && <p className="p-5 text-[13.5px] text-ds-ink-2">No keyword matches these filters.</p>}
      {keywords.length > 0 && project.competitors.length > 0 && stopOnOwn && (
        <p className="px-5 pb-4 text-[12px] leading-5 text-ds-ink-3">
          Competitor positions come from the same search. A check stops once your domain is found, so “&gt;N” means a competitor wasn&apos;t in the first N results scanned.
        </p>
      )}
    </Glass>
  );
}
