"use client";

import { useState } from "react";
import type { NgramEntry } from "@/lib/tools/keywordDensity/analyzer";

type NgramTableProps = {
  ngrams: { 1: NgramEntry[]; 2: NgramEntry[]; 3: NgramEntry[] };
};

const TABS: { key: 1 | 2 | 3; label: string }[] = [
  { key: 1, label: "1-word" },
  { key: 2, label: "2-word" },
  { key: 3, label: "3-word" },
];

export function NgramTable({ ngrams }: NgramTableProps) {
  const [active, setActive] = useState<1 | 2 | 3>(1);
  const rows = ngrams[active];

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10">
      <div className="flex items-center gap-1 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`rounded-md px-2.5 py-1 font-body text-xs transition-colors ${
              active === tab.key ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="max-h-[320px] overflow-auto">
        {rows.length === 0 ? (
          <p className="p-4 font-body text-sm text-foreground/40">Not enough content yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-foreground/10 font-body text-[11px] uppercase tracking-[0.06em] text-foreground/40">
                <th className="px-4 py-2">Phrase</th>
                <th className="px-4 py-2">Count</th>
                <th className="px-4 py-2">Density</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.phrase} className="border-b border-foreground/5 last:border-0">
                  <td className="px-4 py-2 font-body text-sm text-foreground">{row.phrase}</td>
                  <td className="px-4 py-2 font-mono text-xs text-foreground/60">{row.count}</td>
                  <td className="px-4 py-2 font-mono text-xs text-foreground/60">{row.density.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
