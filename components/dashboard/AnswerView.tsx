"use client";

import { useState } from "react";
import type { Sentiment } from "@/lib/types";
import { ENGINE_LABELS } from "@/lib/providers/labels";
import type { FullRun } from "./format";
import { timeAgo } from "./format";

/** Light markdown clean-up for display only (bold markers, heading hashes, list bullets). */
function tidy(s: string): string {
  return s
    .replace(/\*\*|__/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*-]\s+/gm, "• ");
}

function Highlighted({ text, spans }: { text: string; spans: [number, number][] }) {
  const parts: { s: string; hit: boolean }[] = [];
  let at = 0;
  for (const [start, end] of [...spans].sort((a, b) => a[0] - b[0])) {
    if (start < at || end > text.length) continue;
    if (start > at) parts.push({ s: text.slice(at, start), hit: false });
    parts.push({ s: text.slice(start, end), hit: true });
    at = end;
  }
  if (at < text.length) parts.push({ s: text.slice(at), hit: false });
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded-[4px] bg-ds-accent-soft px-0.5 text-ds-ink shadow-[inset_0_-2px_0_#f2a97f]">
            {p.s}
          </mark>
        ) : (
          <span key={i}>{tidy(p.s)}</span>
        ),
      )}
    </>
  );
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const SENTIMENT_STYLE: Record<Sentiment, string> = {
  positive: "bg-[#5c7c68]/12 text-ds-success",
  neutral: "bg-white/60 text-ds-ink-2",
  negative: "bg-ds-danger/10 text-ds-danger",
};

export default function AnswerView({ run, brandName }: { run: FullRun; brandName: string }) {
  const [open, setOpen] = useState(false);
  const citations: { url: string; domain: string; title?: string }[] = run.citations ?? run.citedUrls.map((url) => ({ url, domain: hostLabel(url) }));
  const order = run.brandOrder ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className={`rounded-full px-2.5 py-1 ${run.mentioned ? "bg-ds-accent-soft text-ds-accent-ink" : "bg-white/60 text-ds-ink-2"}`}>
          {run.mentioned ? (run.position ? `Named #${run.position}${order.length > 1 ? ` of ${order.length}` : ""}` : "Named") : `${brandName} not named`}
        </span>
        <span className={`rounded-full px-2.5 py-1 ${run.cited ? "bg-[#5c7c68]/12 text-ds-success" : "bg-white/60 text-ds-ink-2"}`}>{run.cited ? "Your site cited" : "Your site not cited"}</span>
        {run.sentiment && <span className={`rounded-full px-2.5 py-1 capitalize ${SENTIMENT_STYLE[run.sentiment]}`}>{run.sentiment}</span>}
        {!run.grounded && <span className="rounded-full bg-[#b7660a]/10 px-2.5 py-1 text-[#b7660a]">No live web search</span>}
        <span className="ml-auto text-ds-ink-3">
          {ENGINE_LABELS[run.provider]}
          {run.model ? ` · ${run.model}` : ""} · {timeAgo(run.timestamp)}
        </span>
      </div>

      {run.sentimentReason && <p className="text-[13px] italic text-ds-ink-2">“{run.sentimentReason}”</p>}

      {order.length > 1 && (
        <p className="text-[12.5px] text-ds-ink-2">
          Order named:{" "}
          {order.slice(0, 10).map((b, i) => (
            <span key={`${b}-${i}`} className={b === brandName ? "font-medium text-ds-accent-ink" : ""}>
              {i > 0 && " → "}
              {b}
            </span>
          ))}
          {order.length > 10 && " …"}
        </p>
      )}

      <div className="relative">
        <div className={`whitespace-pre-line rounded-[12px] bg-white/45 p-4 text-[13.5px] leading-6 text-ds-ink ${open ? "" : "max-h-56 overflow-hidden"}`}>
          <Highlighted text={run.rawExcerpt} spans={run.mentionSpans ?? []} />
        </div>
        {!open && run.rawExcerpt.length > 600 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-[12px] bg-[linear-gradient(transparent,rgba(250,248,242,0.95))]" />
        )}
      </div>
      {run.rawExcerpt.length > 600 && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-[12.5px] font-medium text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline">
          {open ? "Show less" : "Show full answer"}
        </button>
      )}

      {citations.length > 0 && (
        <div>
          <p className="mb-1.5 text-[12px] text-ds-ink-3">Sources ({citations.length})</p>
          <ul className="flex flex-wrap gap-1.5">
            {citations.slice(0, 16).map((c) => (
              <li key={c.url}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  title={c.title || c.url}
                  className="glass-inset inline-flex max-w-[220px] items-center rounded-full px-2.5 py-1 font-mono text-[11.5px] text-ds-ink-2 hover:text-ds-ink"
                >
                  <span className="truncate">{c.domain}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
