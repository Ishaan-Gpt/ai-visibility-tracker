"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RollupDoc } from "@/lib/types";

export default function TrendChart({ rollups }: { rollups: RollupDoc[] }) {
  if (rollups.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center gap-3 text-center">
        <svg viewBox="0 0 160 50" className="h-12 w-40" aria-hidden>
          <path d="M4 40 C 30 40, 40 22, 62 26 S 98 40, 118 18 S 150 10, 156 8" fill="none" stroke="#2b2927" strokeOpacity=".25" strokeWidth="1.4" strokeDasharray="3 5" strokeLinecap="round" />
          <circle cx="156" cy="8" r="3.5" fill="#f2a97f" />
        </svg>
        <p className="max-w-[300px] text-[13.5px] text-ds-ink-2">No checks yet. Your trend line starts after the next scheduled run.</p>
      </div>
    );
  }
  const data = rollups.map((r) => ({ date: r.date.slice(5), score: r.score }));
  return (
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
            formatter={(value) => [`${value}%`, "Visibility"]}
          />
          <Area type="monotone" dataKey="score" stroke="#d5855a" strokeWidth={2} fill="url(#vis-fill)" dot={{ r: 3, fill: "#faf8f2", stroke: "#d5855a", strokeWidth: 1.5 }} activeDot={{ r: 5, fill: "#f2a97f" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
