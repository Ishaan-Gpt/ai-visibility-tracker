import { SOURCES, type KeywordRow } from "@/lib/keywords/types";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  // Neutralise spreadsheet formula injection from scraped text.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

const sourceName = (id: string) => SOURCES.find((s) => s.id === id)?.name ?? id;

/** Every column we have. Provider columns are blank (never estimated) when no provider is connected. */
export function toCsv(rows: KeywordRow[]): string {
  const head = [
    "keyword",
    "autocomplete_signal_relative_0_100",
    "best_autocomplete_rank",
    "lists_seen_in",
    "sources",
    "source_count",
    "expansion_level",
    "intent_estimate",
    "intent_method",
    "topic_cluster",
    "group",
    "group_word",
    "words",
    "search_volume",
    "keyword_difficulty",
    "cpc_usd",
    "ads_competition",
    "monthly_trend_oldest_first",
  ];
  const lines = rows.map((r) =>
    [
      r.keyword,
      r.signal,
      r.rank ?? "",
      r.hits,
      r.sources.map(sourceName).join("|"),
      r.sources.length,
      r.depth === 0 ? "seed" : r.depth,
      r.intent,
      r.intentBy === "ai" ? "ai-estimated" : "rule-estimated",
      r.cluster,
      r.group,
      r.groupWord ?? "",
      r.words,
      r.volume ?? "",
      r.kd ?? "",
      typeof r.cpc === "number" ? r.cpc.toFixed(2) : "",
      r.competition ?? "",
      r.trend?.join("|") ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

export function downloadCsv(rows: KeywordRow[], seed: string) {
  // BOM so Excel opens non-ASCII keywords correctly.
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `keywords-${seed.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60) || "export"}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
