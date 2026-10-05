"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EmptyDossier, IcBin, IcOpen } from "@/components/icons/Studio";
import { IconSpinner } from "@/components/icons/Icons";
import { ToolGlyph } from "@/components/icons/ToolGlyphs";
import { Dial } from "@/components/studio/Pieces";
import { HISTORY_TOOL_META, type HistoryItem, type HistoryTool } from "@/lib/history";

const SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

/** Relative label once mounted; a stable UTC date during SSR so hydration matches. */
function when(ts: number, now: number | null) {
  if (now === null) return new Date(ts).toISOString().slice(0, 10);
  const d = Math.round((now - ts) / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function ReportList({ items, compact = false }: { items: HistoryItem[]; compact?: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [filter, setFilter] = useState<"all" | HistoryTool>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);
  const shown = useMemo(() => rows.filter((r) => filter === "all" || r.tool === filter), [rows, filter]);

  async function remove(id: string) {
    if (!window.confirm("Delete this saved report? This can't be undone.")) return;
    setBusy(id);
    const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== id));
      router.refresh();
    }
  }

  if (rows.length === 0) {
    return (
      <div className="glass flex flex-col items-center rounded-[24px] px-6 py-14 text-center">
        <EmptyDossier className="h-[110px] w-[150px]" />
        <p className="mt-4 font-serif text-[28px] leading-none">
          Nothing filed <span className="italic">yet</span>
        </p>
        <p className="mt-2 max-w-[360px] text-[14px] leading-6 text-ds-ink-2">Run a Page Audit or AI Crawler Check and press “Save report”. It lands here, ready to reopen or export.</p>
        <Link href="/tools/page-audit" className="mt-6 inline-flex h-11 items-center rounded-[12px] bg-ds-accent px-5 text-[14.5px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)]">
          Run an audit
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div className="glass mb-4 inline-flex rounded-[16px] p-1 text-[13.5px]" role="group" aria-label="Filter by tool">
          {(["all", "page-audit", "ai-crawlers"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className="relative rounded-[12px] px-4 py-2 text-ds-ink-2 transition-colors aria-pressed:text-ds-ink">
              {filter === f && <motion.span layoutId="report-filter" transition={SPRING} className="absolute inset-0 rounded-[12px] bg-white/85 shadow-[0_4px_12px_-6px_rgba(43,41,39,.3)]" />}
              <span className="relative">{f === "all" ? `All · ${rows.length}` : HISTORY_TOOL_META[f].label}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="glass overflow-hidden rounded-[24px]">
        <AnimatePresence initial={false}>
          {shown.map((r, i) => {
            const meta = HISTORY_TOOL_META[r.tool];
            return (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.25 } }}
                className="group relative flex items-center gap-3 border-b border-white/60 px-4 py-4 last:border-b-0 sm:gap-5 sm:px-6"
              >
                <span className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/35" />
                <Link href={`/tools/${meta.slug}?report=${r.id}`} className="relative flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
                  <span className="glass-inset hidden h-11 w-11 shrink-0 items-center justify-center rounded-[14px] sm:flex">
                    <ToolGlyph slug={meta.slug} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[21px] leading-tight">{r.title}</span>
                    <span className="block truncate text-[12.5px] text-ds-ink-3">
                      {meta.label} · {r.subtitle}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Dial value={r.score} size={44} label={r.tool === "page-audit" ? "SEO" : "AI"} />
                    {r.tool === "page-audit" && <Dial value={r.aiScore} size={44} label="AI" />}
                  </span>
                  <span className="hidden w-[84px] shrink-0 text-right text-[12.5px] text-ds-ink-2 md:block">{when(r.createdAt, now)}</span>
                  <IcOpen className="hidden h-4 w-4 shrink-0 text-ds-ink-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ds-ink sm:block" />
                </Link>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={busy === r.id}
                  aria-label={`Delete ${r.title}`}
                  className="group/bin relative rounded-[12px] p-2 text-ds-ink-3 transition-colors hover:bg-[#c92a2a]/10 hover:text-[#c92a2a]"
                >
                  {busy === r.id ? <IconSpinner className="h-[18px] w-[18px] animate-spin" /> : <IcBin className="h-[18px] w-[18px]" />}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
