"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Glass } from "@/components/studio/Glass";
import { BUCKETS, moveOf, summarize, visibilitySeries, type Bucket } from "@/lib/rank-tracker/metrics";
import { ALERT_LABEL, type RtAlert, type RtKeyword } from "@/lib/rank-tracker/types";
import { Delta, DeltaFrom, EmptyMark } from "./bits";
import { shortDay } from "./format";

const BUCKET_LABEL: Record<Bucket, string> = { "1-3": "1–3", "4-10": "4–10", "11-20": "11–20", "21-50": "21–50", "51-100": "51–100", none: "Not in top 100" };
const BUCKET_COLOR: Record<Bucket, string> = { "1-3": "#d5855a", "4-10": "#f2a97f", "11-20": "#e9c3a4", "21-50": "#cfc4b3", "51-100": "#ddd5c7", none: "rgba(43,41,39,0.12)" };

function Tile({ title, italic, value, unit, foot }: { title: string; italic: string; value: React.ReactNode; unit?: string; foot: React.ReactNode }) {
  return (
    <Glass className="flex h-full flex-col justify-between gap-3 p-5">
      <h3 className="font-serif text-[21px] leading-none">
        {title} <span className="italic">{italic}</span>
      </h3>
      <p className="font-serif text-[46px] leading-[0.9] tabular-nums">
        {value}
        {unit && <span className="text-[20px] text-ds-ink-3">{unit}</span>}
      </p>
      <div className="min-h-[18px] text-[12.5px] text-ds-ink-2">{foot}</div>
    </Glass>
  );
}

const dash = <span className="italic text-ds-ink-3">–</span>;

function PointsDelta({ v, label }: { v: number | null; label: string }) {
  if (v === null) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Delta value={Math.round(v * 10) / 10} small /> <span className="text-ds-ink-3">{label}</span>
    </span>
  );
}

export function Overview({ keywords, alerts, cadenceDays, today, onOpen }: { keywords: RtKeyword[]; alerts: RtAlert[]; cadenceDays: number; today: string; onOpen: (id: string) => void }) {
  const histories = useMemo(() => keywords.map((k) => k.history ?? []), [keywords]);
  const s = useMemo(() => summarize(histories, today, cadenceDays), [histories, today, cadenceDays]);
  const series = useMemo(() => visibilitySeries(histories, 90, today, cadenceDays), [histories, today, cadenceDays]);
  const [moverWindow, setMoverWindow] = useState<"d1" | "d7" | "d30">("d1");

  const movers = useMemo(() => {
    const list = keywords
      .map((k) => ({ k, m: moveOf(k.history ?? [], today) }))
      .filter((x): x is { k: RtKeyword; m: NonNullable<ReturnType<typeof moveOf>> } => Boolean(x.m && x.m[moverWindow] !== null && x.m[moverWindow] !== 0));
    const up = list.filter((x) => (x.m[moverWindow] ?? 0) > 0).sort((a, b) => (b.m[moverWindow] ?? 0) - (a.m[moverWindow] ?? 0)).slice(0, 5);
    const down = list.filter((x) => (x.m[moverWindow] ?? 0) < 0).sort((a, b) => (a.m[moverWindow] ?? 0) - (b.m[moverWindow] ?? 0)).slice(0, 5);
    return { up, down };
  }, [keywords, today, moverWindow]);

  const checked = s.checked > 0;
  const chartData = series.map((p) => ({ ...p, label: shortDay(p.date) }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          title="Visibility"
          italic="score"
          value={checked && s.visibility !== null ? s.visibility : dash}
          unit={checked ? "%" : undefined}
          foot={
            checked ? (
              <span className="flex flex-wrap gap-x-3">
                <PointsDelta v={s.visibilityDelta.d1} label="last check" />
                <PointsDelta v={s.visibilityDelta.d7} label="7 days" />
                {s.visibilityDelta.d1 === null && s.visibilityDelta.d7 === null && "Click share at your positions vs #1 everywhere"}
              </span>
            ) : (
              "Waiting on the first check"
            )
          }
        />
        <Tile title="Average" italic="position" value={s.avgPosition !== null ? s.avgPosition : dash} foot={checked ? (s.ranking ? `Across ${s.ranking} keyword${s.ranking === 1 ? "" : "s"} in the top 100` : "No keyword in the top 100 yet") : "Waiting on the first check"} />
        <Tile
          title="In the"
          italic="top 10"
          value={checked ? s.top10 : dash}
          unit={checked ? `/${s.checked}` : undefined}
          foot={checked ? `${s.top3} in the top 3 · ${s.top100} in the top 100` : "Waiting on the first check"}
        />
        <Tile
          title="Since last"
          italic="check"
          value={checked ? <span className="text-ds-success">{s.improved}</span> : dash}
          unit={checked ? ` up` : undefined}
          foot={checked ? <span className="text-ds-danger">{s.declined} down</span> : "Waiting on the first check"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Glass className="min-w-0 p-5 sm:p-6 lg:col-span-2">
          <h3 className="font-serif text-[26px] leading-none">
            Visibility <span className="italic">over time</span>
          </h3>
          {chartData.length < 2 ? (
            <div className="flex h-52 flex-col items-center justify-center gap-3 text-center">
              <EmptyMark className="h-14 w-24" />
              <p className="max-w-[300px] text-[13.5px] text-ds-ink-2">{checked ? "The trend line starts with your second check." : "No checks yet. The trend starts with your first check."}</p>
            </div>
          ) : (
            <div className="mt-3 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(43,41,39,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#736e6a" }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis yAxisId="v" domain={[0, (max: number) => Math.min(100, Math.max(10, Math.ceil(max / 10) * 10))]} tick={{ fontSize: 11, fill: "#736e6a" }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis yAxisId="p" orientation="right" reversed domain={[1, "dataMax"]} allowDecimals={false} tick={{ fontSize: 11, fill: "#a8a29b" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    cursor={{ stroke: "rgba(43,41,39,0.2)", strokeDasharray: "3 4" }}
                    contentStyle={{ background: "rgba(250,248,242,0.95)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: 12, fontSize: 12 }}
                    formatter={(value, name) => (name === "visibility" ? [`${value}%`, "Visibility"] : name === "avgPosition" ? [value, "Avg position"] : [value, String(name)])}
                  />
                  <Line yAxisId="v" type="monotone" dataKey="visibility" stroke="#d5855a" strokeWidth={2} dot={{ r: 2.5, fill: "#faf8f2", stroke: "#d5855a" }} connectNulls />
                  <Line yAxisId="p" type="monotone" dataKey="avgPosition" stroke="#8a7f73" strokeWidth={1.4} strokeDasharray="4 4" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-2 flex flex-wrap gap-x-4 text-[12px] text-ds-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden>
                <line x1="0" y1="2" x2="16" y2="2" stroke="#d5855a" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              Visibility (left)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden>
                <line x1="0" y1="2" x2="16" y2="2" stroke="#8a7f73" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
              Average position (right, #1 at top)
            </span>
          </p>
        </Glass>

        <Glass className="p-5 sm:p-6">
          <h3 className="font-serif text-[26px] leading-none">
            Where you <span className="italic">rank</span>
          </h3>
          {checked ? (
            <>
              <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-white/50">
                {BUCKETS.map((b) => (s.distribution[b] ? <span key={b} title={`${BUCKET_LABEL[b]}: ${s.distribution[b]}`} style={{ width: `${(s.distribution[b] / s.checked) * 100}%`, background: BUCKET_COLOR[b] }} /> : null))}
              </div>
              <ul className="mt-4 space-y-2">
                {BUCKETS.map((b) => (
                  <li key={b} className="flex items-center justify-between text-[13.5px]">
                    <span className="inline-flex items-center gap-2 text-ds-ink-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUCKET_COLOR[b] }} />
                      {BUCKET_LABEL[b]}
                    </span>
                    <span className="tabular-nums text-ds-ink">{s.distribution[b]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-[13.5px] text-ds-ink-2">Positions are grouped here after the first check.</p>
          )}
        </Glass>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Glass className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-[26px] leading-none">
              Biggest <span className="italic">movers</span>
            </h3>
            <div className="inline-flex gap-1 rounded-[11px] bg-white/40 p-1 text-[12.5px]">
              {(
                [
                  ["d1", "Last check"],
                  ["d7", "7 days"],
                  ["d30", "30 days"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setMoverWindow(k)} className={`rounded-[8px] px-2.5 py-1 ${moverWindow === k ? "bg-white text-ds-ink shadow-sm" : "text-ds-ink-2"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {!movers.up.length && !movers.down.length ? (
            <p className="mt-4 text-[13.5px] text-ds-ink-2">No position changes in this window yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(["up", "down"] as const).map((dir) => (
                <ul key={dir} className="min-w-0 space-y-1">
                  {movers[dir].map(({ k, m }) => (
                    <li key={k.id}>
                      <button type="button" onClick={() => onOpen(k.id)} className="flex w-full items-center justify-between gap-2 rounded-[10px] px-2 py-1.5 text-left text-[13.5px] hover:bg-white/60">
                        <span className="min-w-0 truncate">{k.keyword}</span>
                        <span className="flex shrink-0 items-center gap-2 tabular-nums text-ds-ink-2">
                          {m.current ?? ">100"}
                          <Delta value={m[moverWindow]} small entered={m[moverWindow] !== null && m.current !== null && (m[moverWindow] ?? 0) > 0 && (m[moverWindow] ?? 0) === 101 - m.current} lost={m.current === null} />
                        </span>
                      </button>
                    </li>
                  ))}
                  {!movers[dir].length && <li className="px-2 py-1.5 text-[13px] text-ds-ink-3">{dir === "up" ? "Nothing climbed" : "Nothing fell"}</li>}
                </ul>
              ))}
            </div>
          )}
        </Glass>

        <Glass className="min-w-0 p-5 sm:p-6">
          <h3 className="font-serif text-[26px] leading-none">
            Notable <span className="italic">changes</span>
          </h3>
          {alerts.length === 0 ? (
            <p className="mt-4 text-[13.5px] text-ds-ink-2">Drops out of the top 10, new top-3 positions and big jumps show up here after your second check.</p>
          ) : (
            <ul className="mt-3 max-h-[260px] space-y-1 overflow-y-auto pr-1">
              {alerts.slice(0, 30).map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => onOpen(a.keywordId)} className="flex w-full items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 text-left text-[13.5px] hover:bg-white/60">
                    <span className="min-w-0">
                      <span className="block truncate">{a.keyword}</span>
                      <span className={`block text-[12px] ${a.kind === "top3_new" || a.kind === "moved_up" || a.kind === "top100_new" ? "text-ds-success" : "text-ds-danger"}`}>
                        {ALERT_LABEL[a.kind]} · {shortDay(a.date)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] tabular-nums text-ds-ink-2">
                      {a.from ?? ">100"} → {a.to ?? ">100"}
                      <DeltaFrom before={a.from} after={a.to} small />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Glass>
      </div>
    </div>
  );
}
