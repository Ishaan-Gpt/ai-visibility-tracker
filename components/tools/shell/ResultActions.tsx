"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBookmark, IconPdf as FileDown, IconRerun as RotateCcw, IconSpinner as Loader2 } from "@/components/icons/Icons";

const Bookmark = (p: { className?: string }) => <IconBookmark {...p} />;
const BookmarkCheck = (p: { className?: string }) => <IconBookmark filled {...p} />;
import { useViewer } from "@/components/viewer/useViewer";
import type { HistoryTool } from "@/lib/history";

/** Opens the browser's print dialog with the print stylesheet applied, i.e. "Save as PDF". */
export function exportPdf(filename?: string) {
  const prev = document.title;
  if (filename) document.title = filename;
  document.querySelectorAll("details").forEach((d) => d.setAttribute("data-was-open", d.open ? "1" : "0"));
  document.querySelectorAll("details").forEach((d) => (d.open = true));
  const restore = () => {
    document.title = prev;
    document.querySelectorAll<HTMLDetailsElement>("details[data-was-open]").forEach((d) => {
      d.open = d.getAttribute("data-was-open") === "1";
      d.removeAttribute("data-was-open");
    });
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

export function ResultActions({
  tool,
  title,
  subtitle,
  score,
  aiScore,
  report,
  pdfName,
  onRerun,
  dark = false,
  initialSavedId,
}: {
  tool?: HistoryTool;
  title: string;
  subtitle?: string;
  score?: number;
  aiScore?: number;
  report?: unknown;
  pdfName: string;
  onRerun?: () => void;
  dark?: boolean;
  initialSavedId?: string | null;
}) {
  const viewer = useViewer();
  const pathname = usePathname();
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(initialSavedId ?? null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!tool || !report || saving || savedId) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, title, subtitle, score, aiScore, report }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setSavedId(data.id);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const ghost = dark
    ? "inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/15 px-4 text-[14px] text-white/85 transition hover:bg-white/5"
    : "glass-inset inline-flex h-10 items-center gap-2 rounded-[12px] px-4 text-[14px] text-ds-ink transition hover:bg-white/80 active:translate-y-px";

  return (
    <div className="no-print flex flex-wrap items-center gap-2" data-print-hide>
      <button type="button" onClick={() => exportPdf(pdfName)} className={`inline-flex h-10 items-center gap-2 rounded-[12px] bg-ds-accent px-4 text-[14px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4)] transition hover:bg-[var(--ds-accent-hover)] active:translate-y-px ${dark ? "" : ""}`}>
        <FileDown className="h-4 w-4" /> Export PDF
      </button>

      {tool && report !== undefined && viewer?.signedIn && (
        savedId ? (
          <Link href="/app/history" className={ghost}>
            <BookmarkCheck className="h-4 w-4 text-ds-accent-ink" /> Saved · View history
          </Link>
        ) : (
          <button type="button" onClick={save} disabled={saving} className={ghost}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />} Save report
          </button>
        )
      )}
      {tool && report !== undefined && viewer && !viewer.signedIn && (
        <Link href={`/signup?next=${encodeURIComponent(pathname)}`} className={ghost}>
          <Bookmark className="h-4 w-4" /> Sign up to save
        </Link>
      )}

      {onRerun && (
        <button type="button" onClick={onRerun} className={ghost} aria-label="Run again">
          <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Run again</span>
        </button>
      )}
      {msg && (
        <p role="status" className={`w-full text-[13px] ${dark ? "text-[#ffb08a]" : "text-ds-danger"}`}>
          {msg}{" "}
          {/Pro/.test(msg) && (
            <Link href="/app/billing" className="underline underline-offset-2">
              See Pro
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
