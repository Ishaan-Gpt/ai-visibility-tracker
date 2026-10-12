"use client";

import { useRef, useState, useTransition } from "react";
import type { Competitor } from "@/lib/types";
import { updateBrandSettings } from "@/app/app/onboarding/actions";
import { Glass } from "@/components/studio/Glass";
import { IcBin, IcPlus } from "@/components/icons/Studio";
import { IconSpinner } from "@/components/icons/Icons";

const field =
  "glass-inset h-10 w-full rounded-[11px] px-3 text-[14px] text-ds-ink outline-none transition-[box-shadow,background-color] placeholder:text-ds-ink-3 focus:bg-white/70 focus:shadow-[0_0_0_3px_rgba(242,169,127,0.35)]";

interface Props {
  name: string;
  domain: string;
  aliases: string[];
  category: string;
  competitors: Competitor[];
  maxCompetitors: number;
  maxAliases: number;
  /** Untracked brands AI named most, offered as one-click competitor rows. */
  discovered: { name: string; count: number }[];
  isPaid: boolean;
}

export default function BrandSettings({ name, domain, aliases, category, competitors, maxCompetitors, maxAliases, discovered, isPaid }: Props) {
  const [aliasText, setAliasText] = useState(aliases.join(", "));
  const [cat, setCat] = useState(category);
  const [rows, setRows] = useState<Competitor[]>(competitors.length ? competitors : []);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const domainRefs = useRef<(HTMLInputElement | null)[]>([]);
  const tracked = new Set(rows.map((r) => r.name.toLowerCase()));
  const suggestions = discovered.filter((d) => !tracked.has(d.name.toLowerCase()) && d.name.toLowerCase() !== name.toLowerCase()).slice(0, 6);
  const full = rows.length >= maxCompetitors;

  const addRow = (prefill = "") => {
    if (full) return;
    setRows((r) => [...r, { name: prefill, domain: "" }]);
    // Focus the domain when the name is prefilled, otherwise the name.
    setTimeout(() => domainRefs.current[rows.length]?.focus(), 30);
  };

  return (
    <Glass className="p-6" id="brand-settings">
      <h2 className="font-serif text-[28px] leading-none">
        Brand <span className="italic">settings</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setMsg(null);
            const res = await updateBrandSettings({ competitors: rows, aliases: aliasText.split(","), category: cat });
            setMsg(res.ok ? { ok: true, text: "Saved. Changes apply from the next check." } : { ok: false, text: res.error });
          });
        }}
        className="mt-5 grid gap-6 lg:grid-cols-2"
      >
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-medium text-ds-ink-2">Tracked brand</p>
            <p className="mt-1 text-[15px] text-ds-ink">
              {name} <span className="font-mono text-[13px] text-ds-ink-2">{domain}</span>
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ds-ink-2">Other names AI might use (up to {maxAliases}, comma separated)</span>
            <input value={aliasText} onChange={(e) => setAliasText(e.target.value)} placeholder="e.g. Acme, Acme Dental Clinic" className={field} />
            <span className="mt-1 block text-[12px] text-ds-ink-3">Matched on whole words, accents ignored. A single word typed with a capital (Apple) skips lowercase uses (apple pie).</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ds-ink-2">What you do, in a few words</span>
            <input value={cat} onChange={(e) => setCat(e.target.value)} maxLength={80} placeholder="e.g. family dental clinic in Austin" className={field} />
            <span className="mt-1 block text-[12px] text-ds-ink-3">Used to draft better prompt suggestions.</span>
          </label>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-ds-ink-2">Competitors</span>
            <span className="text-[12px] text-ds-ink-3">
              {rows.length}/{maxCompetitors}
              {!isPaid && maxCompetitors < 2 ? " · Pro compares more" : ""}
            </span>
          </div>
          <ul className="space-y-2">
            {rows.map((row, i) => (
              <li key={i} className="flex items-center gap-2">
                <input aria-label={`Competitor ${i + 1} name`} value={row.name} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" className={field} />
                <input
                  ref={(el) => {
                    domainRefs.current[i] = el;
                  }}
                  aria-label={`Competitor ${i + 1} domain`}
                  value={row.domain}
                  onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, domain: e.target.value } : x)))}
                  placeholder="competitor.com"
                  className={`${field} font-mono text-[13.5px]`}
                />
                <button type="button" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-ds-ink-2 hover:bg-white/70 hover:text-ds-ink" aria-label={`Remove ${row.name || "competitor"}`}>
                  <IcBin className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {!full && (
            <button type="button" onClick={() => addRow()} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2 text-[13.5px] text-ds-ink-2 hover:bg-white/60 hover:text-ds-ink">
              <IcPlus className="h-4 w-4" /> Add competitor
            </button>
          )}
          {suggestions.length > 0 && !full && (
            <div className="mt-3">
              <p className="text-[12.5px] text-ds-ink-2">Named by AI in your answers:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button key={s.name} type="button" onClick={() => addRow(s.name)} className="glass-inset inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12.5px] text-ds-ink-2 transition hover:bg-white/70 hover:text-ds-ink">
                    <IcPlus className="h-3 w-3" /> {s.name}
                    <span className="text-ds-ink-3">×{s.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 lg:col-span-2">
          {msg && <p className={`text-[13px] ${msg.ok ? "text-ds-success" : "text-ds-danger"}`}>{msg.text}</p>}
          <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-ds-ink px-5 text-[14px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633] disabled:opacity-60">
            {pending && <IconSpinner className="h-4 w-4 animate-spin" />} Save settings
          </button>
        </div>
      </form>
    </Glass>
  );
}
