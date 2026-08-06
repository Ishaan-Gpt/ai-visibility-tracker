"use client";

import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";

type UrlTableProps = {
  entries: SitemapUrlEntry[];
  onChange: (entries: SitemapUrlEntry[]) => void;
};

const CHANGEFREQ_OPTIONS = ["", "always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
const PRIORITY_OPTIONS = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"];

/** Rendering every row of a multi-thousand-URL paste would choke the DOM — bulk actions still apply to the full array regardless of how many rows are visible for hand-editing. */
const MAX_VISIBLE_ROWS = 500;

export function UrlTable({ entries, onChange }: UrlTableProps) {
  function updateRow(index: number, patch: Partial<SitemapUrlEntry>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...entries, { loc: "", lastmod: "", changefreq: "", priority: "" }]);
  }

  function setAllLastmodToday() {
    const today = new Date().toISOString().slice(0, 10);
    onChange(entries.map((e) => ({ ...e, lastmod: today })));
  }

  function clearAllPriority() {
    onChange(entries.map((e) => ({ ...e, priority: "" })));
  }

  const visible = entries.slice(0, MAX_VISIBLE_ROWS);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-xs uppercase tracking-[0.1em] text-foreground/40">
          {entries.length} URL{entries.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={setAllLastmodToday} className="font-body text-xs text-primary hover:underline">
            Set lastmod to today (all)
          </button>
          <button type="button" onClick={clearAllPriority} className="font-body text-xs text-foreground/40 hover:text-foreground">
            Clear priority (all)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-foreground/10">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/[0.03] font-body text-[11px] uppercase tracking-[0.06em] text-foreground/40">
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Last modified</th>
              <th className="px-3 py-2">Change frequency</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((entry, i) => (
              <tr key={i} className="border-b border-foreground/5 last:border-0">
                <td className="px-3 py-2">
                  <input
                    value={entry.loc}
                    onChange={(e) => updateRow(i, { loc: e.target.value })}
                    placeholder="https://yoursite.com/page"
                    className="w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 font-mono text-xs text-foreground/80"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="date"
                    value={entry.lastmod}
                    onChange={(e) => updateRow(i, { lastmod: e.target.value })}
                    className="rounded-md border border-foreground/15 bg-background px-2 py-1.5 font-body text-xs text-foreground/80"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={entry.changefreq}
                    onChange={(e) => updateRow(i, { changefreq: e.target.value as SitemapUrlEntry["changefreq"] })}
                    className="rounded-md border border-foreground/15 bg-background px-2 py-1.5 font-body text-xs text-foreground/80"
                  >
                    {CHANGEFREQ_OPTIONS.map((opt) => (
                      <option key={opt || "none"} value={opt}>
                        {opt || "—"}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={entry.priority}
                    onChange={(e) => updateRow(i, { priority: e.target.value })}
                    className="rounded-md border border-foreground/15 bg-background px-2 py-1.5 font-body text-xs text-foreground/80"
                  >
                    <option value="">—</option>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => removeRow(i)} className="text-foreground/30 hover:text-foreground/60">
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length > MAX_VISIBLE_ROWS ? (
        <p className="font-body text-xs text-foreground/40">
          Showing the first {MAX_VISIBLE_ROWS.toLocaleString()} of {entries.length.toLocaleString()} URLs for editing — bulk actions above still apply to all of them, and the generated XML includes every one.
        </p>
      ) : null}

      <button type="button" onClick={addRow} className="font-body text-xs text-primary hover:underline">
        + Add URL
      </button>

      <p className="font-body text-[11px] text-foreground/35">
        changefreq and priority are part of the sitemap protocol, but Google has publicly stated it ignores both for
        ranking purposes — set them for other crawlers if you like, or leave blank.
      </p>
    </div>
  );
}
