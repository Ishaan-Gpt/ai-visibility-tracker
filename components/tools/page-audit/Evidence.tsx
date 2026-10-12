"use client";

import { useState } from "react";

const URLISH = /^https?:\/\/\S+$/;

/** A concrete-offenders list: first few visible, the rest behind "Show all", every URL clickable. Prints in full. */
export function EvidenceList({ items, initial = 5, label = "affected" }: { items?: string[]; initial?: number; label?: string }) {
  const [open, setOpen] = useState(false);
  if (!items?.length) return null;
  const shown = open ? items : items.slice(0, initial);
  return (
    <div className="mt-2.5">
      <ul className="glass-inset max-h-[420px] space-y-1 overflow-auto rounded-[12px] px-3 py-2.5 font-mono text-[12px] leading-[18px] text-ds-ink-2 print:max-h-none print:overflow-visible">
        {shown.map((it, i) => (
          <li key={`${i}-${it.slice(0, 40)}`} className="break-all">
            <EvidenceLine text={it} />
          </li>
        ))}
      </ul>
      {items.length > initial && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="no-print mt-1.5 text-[12.5px] text-ds-ink-2 underline-offset-4 hover:text-ds-ink hover:underline" data-print-hide>
          {open ? "Show fewer" : `Show all ${items.length} ${label}`}
        </button>
      )}
    </div>
  );
}

/** Links the leading URL of an evidence line ("https://… · note") without making the whole line a link. */
function EvidenceLine({ text }: { text: string }) {
  const m = text.match(/^(\S+)(\s[\s\S]*)?$/);
  const head = m?.[1] ?? text;
  if (URLISH.test(head)) {
    return (
      <>
        <a href={head} target="_blank" rel="noreferrer nofollow" className="text-ds-ink hover:underline">
          {head}
        </a>
        {m?.[2]}
      </>
    );
  }
  return <>{text}</>;
}

/** Small "n / total" pill used in panel headers. */
export function CountPill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "good" | "bad" }) {
  const cls = {
    muted: "bg-ds-muted text-ds-ink-2",
    accent: "bg-ds-accent-soft text-ds-accent-ink",
    good: "bg-[#5c7c68]/15 text-[#3f5d4a]",
    bad: "bg-[#c92a2a]/10 text-[#a32121]",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-[12px] tabular-nums ${cls}`}>{children}</span>;
}
