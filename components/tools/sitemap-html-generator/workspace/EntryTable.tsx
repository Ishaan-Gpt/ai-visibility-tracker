"use client";

import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";

type EntryTableProps = {
  entries: HtmlSitemapEntry[];
  onChange: (entries: HtmlSitemapEntry[]) => void;
};

const MAX_VISIBLE_ROWS = 500;

export function EntryTable({ entries, onChange }: EntryTableProps) {
  function updateRow(index: number, patch: Partial<HtmlSitemapEntry>) {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...entries, { url: "", label: "", section: "" }]);
  }

  const visible = entries.slice(0, MAX_VISIBLE_ROWS);

  return (
    <div className="space-y-4">
      <p className="font-body text-xs uppercase tracking-[0.1em] text-foreground/40">
        {entries.length} URL{entries.length === 1 ? "" : "s"}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-foreground/10">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/[0.03] font-body text-[11px] uppercase tracking-[0.06em] text-foreground/40">
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Section</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((entry, i) => (
              <tr key={i} className="border-b border-foreground/5 last:border-0">
                <td className="px-3 py-2">
                  <input
                    value={entry.url}
                    onChange={(e) => updateRow(i, { url: e.target.value })}
                    placeholder="https://yoursite.com/page"
                    className="w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 font-mono text-xs text-foreground/80"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={entry.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                    placeholder="(auto)"
                    className="w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 font-body text-xs text-foreground/80"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={entry.section}
                    onChange={(e) => updateRow(i, { section: e.target.value })}
                    placeholder="e.g. Blog"
                    className="w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 font-body text-xs text-foreground/80"
                  />
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
          Showing the first {MAX_VISIBLE_ROWS.toLocaleString()} of {entries.length.toLocaleString()} URLs for editing —
          the generated page includes every one.
        </p>
      ) : null}

      <button type="button" onClick={addRow} className="font-body text-xs text-primary hover:underline">
        + Add URL
      </button>
    </div>
  );
}
