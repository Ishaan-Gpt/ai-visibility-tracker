"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { RollupDoc } from "@/lib/types";

export default function TrendChart({ rollups }: { rollups: RollupDoc[] }) {
  if (rollups.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-[14px] text-ds-ink-2">
        No checks have run yet. Your first score appears after the next scheduled check.
      </div>
    );
  }

  const data = rollups.map((r) => ({ date: r.date.slice(5), score: r.score }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--ds-line)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--ds-ink-2)" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--ds-ink-2)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ border: "1px solid var(--ds-line)", borderRadius: 10, fontSize: 12, boxShadow: "none" }}
            formatter={(value) => [`${value}%`, "Visibility score"]}
          />
          <Line type="monotone" dataKey="score" stroke="var(--ds-accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--ds-accent)" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
