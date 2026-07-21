"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { RollupDoc } from "@/lib/types";

export default function TrendChart({ rollups }: { rollups: RollupDoc[] }) {
  if (rollups.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        No checks have run yet — your first score will appear after the next scheduled check.
      </div>
    );
  }

  const data = rollups.map((r) => ({ date: r.date.slice(5), score: r.score }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderColor: "var(--border)", borderRadius: 8, fontSize: 12 }}
            formatter={(value) => [`${value}%`, "Visibility score"]}
          />
          <Line type="monotone" dataKey="score" stroke="var(--orange-500)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
