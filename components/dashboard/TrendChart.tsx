"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RollupDoc } from "@/lib/types";

const SERIES = [
  { key: "score", label: "Visibility", stroke: "#d5855a" },
  { key: "cited", label: "Cited", stroke: "#5c7c68" },
  { key: "sov", label: "Share of voice", stroke: "#8a7f73" },
] as const;

export default function TrendChart({ rollups }: { rollups: RollupDoc[] }) {
  if (rollups.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center gap-3 text-center">
        <svg viewBox="0 0 160 50" className="h-12 w-40" aria-hidden>
          <path d="M4 40 C 30 40, 40 22, 62 26 S 98 40, 118 18 S 150 10, 156 8" fill="none" stroke="#2b2927" strokeOpacity=".25" strokeWidth="1.4" strokeDasharray="3 5" strokeLinecap="round" />
          <circle cx="156" cy="8" r="3.5" fill="#f2a97f" />
        </svg>
        <p className="max-w-[300px] text-[13.5px] text-ds-ink-2">No checks yet. The trend line starts with your first check.</p>
      </div>
    );
  }
  const data = rollups.map((r) => ({ date: r.date.slice(5), score: r.score, cited: r.citationRate ?? null, sov: r.shareOfVoice ?? null }));
  const hasCited = data.some((d) => d.cited !== null);
  const hasSov = data.some((d) => d.sov !== null);
  const shown = SERIES.filter((s) => s.key === "score" || (s.key === "cited" && hasCited) || (s.key === "sov" && hasSov));
  return (
    <div>
      {shown.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-4 text-[12.5px] text-ds-ink-2">
          {shown.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden>
                <line x1="0" y1="2" x2="16" y2="2" stroke={s.stroke} strokeWidth="2.4" strokeLinecap="round" strokeDasharray={s.key === "score" ? undefined : "3 3"} />
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="vis-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f2a97f" stopOpacity={0.55} />
                <stop offset="1" stopColor="#f2a97f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(43,41,39,0.07)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#736e6a" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#736e6a" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ stroke: "rgba(43,41,39,0.2)", strokeDasharray: "3 4" }}
              contentStyle={{ background: "rgba(250,248,242,0.92)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: 12, fontSize: 12, boxShadow: "0 12px 30px -18px rgba(43,41,39,.4)" }}
              formatter={(value, name) => [`${value}%`, SERIES.find((s) => s.key === name)?.label ?? String(name)]}
            />
            {hasSov && <Area type="monotone" dataKey="sov" stroke="#8a7f73" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} connectNulls />}
            {hasCited && <Area type="monotone" dataKey="cited" stroke="#5c7c68" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} connectNulls />}
            <Area type="monotone" dataKey="score" stroke="#d5855a" strokeWidth={2} fill="url(#vis-fill)" dot={{ r: 3, fill: "#faf8f2", stroke: "#d5855a", strokeWidth: 1.5 }} activeDot={{ r: 5, fill: "#f2a97f" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
