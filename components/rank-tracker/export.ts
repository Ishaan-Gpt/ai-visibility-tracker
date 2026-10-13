import { download, workbook, type Cell, type Sheet } from "@/components/tools/page-audit/exportXlsx";
import { moveOf } from "@/lib/rank-tracker/metrics";
import { featureLabel, type DomainKeywordsResult, type RtKeyword, type RtProject } from "@/lib/rank-tracker/types";

const pos = (p: number | null | undefined) => (p === null || p === undefined ? "" : p);

function keywordRows(project: RtProject, keywords: RtKeyword[], today: string): Cell[][] {
  const head: Cell[] = ["Keyword", "Tags", "Position", "Not in top", "Change (last check)", "Change (7 days)", "Change (30 days)", "Best", "Ranking URL", "Source", "In SERP features", "SERP features on page", ...project.competitors.map((c) => `${c} position`), "Results scanned", "Search volume", "Checked (UTC)"];
  const rows: Cell[][] = [head];
  for (const k of keywords) {
    const m = moveOf(k.history ?? [], today);
    const last = k.last;
    rows.push([
      k.keyword,
      k.tags.join(", "),
      last ? pos(last.position) : "",
      last && last.position === null ? (last.noResults ? "no results" : `not in top ${last.scanned || 100}`) : "",
      m?.d1 ?? "",
      m?.d7 ?? "",
      m?.d30 ?? "",
      k.best ?? "",
      last?.url ?? "",
      last?.source ?? "",
      (last?.ourFeatures ?? []).map(featureLabel).join(", "),
      (last?.features ?? []).map(featureLabel).join(", "),
      ...project.competitors.map((c) => pos(last?.competitors.find((x) => x.domain === c)?.position)),
      last?.scanned ?? "",
      k.volume ?? "",
      last ? new Date(last.checkedAt).toISOString().replace("T", " ").slice(0, 16) : "not checked yet",
    ]);
  }
  return rows;
}

function historyRows(keywords: RtKeyword[]): Cell[][] {
  const dates = [...new Set(keywords.flatMap((k) => (k.history ?? []).map((h) => h.d)))].sort();
  const rows: Cell[][] = [["Keyword", ...dates]];
  for (const k of keywords) {
    const by = new Map((k.history ?? []).map((h) => [h.d, h.p]));
    rows.push([k.keyword, ...dates.map((d) => (by.has(d) ? (by.get(d) === null ? ">100" : by.get(d)) : ""))]);
  }
  return rows;
}

const base = (p: RtProject, today: string) => `seowise-rank-tracker-${p.domain}-${today}`;

const csvCell = (v: Cell) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: Cell[][]) => new Blob([`﻿${rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });

export function downloadRankCsv(project: RtProject, keywords: RtKeyword[], today: string) {
  download(csv(keywordRows(project, keywords, today)), `${base(project, today)}.csv`);
}

export function downloadRankXlsx(project: RtProject, keywords: RtKeyword[], today: string) {
  const kw = keywordRows(project, keywords, today);
  const hist = historyRows(keywords);
  const sheets: Sheet[] = [
    { name: "Rankings", rows: kw, widths: kw[0].map((_, i) => (i === 0 ? 36 : i === 8 ? 50 : 16)) },
    { name: "History", rows: hist, widths: hist[0].map((_, i) => (i === 0 ? 36 : 11)) },
  ];
  download(workbook(sheets), `${base(project, today)}.xlsx`);
}

export function downloadDomainCsv(r: DomainKeywordsResult) {
  const rows: Cell[][] = [["Keyword", "Position", "Absolute position", "Result type", "URL", "Search volume", "Est. traffic", "CPC", "Difficulty", "Intent", "SERP features", "Data updated"]];
  for (const x of r.rows) rows.push([x.keyword, x.position ?? "", x.rankAbsolute ?? "", x.type, x.url ?? "", x.volume ?? "", x.traffic === null ? "" : Math.round(x.traffic * 10) / 10, x.cpc ?? "", x.kd ?? "", x.intent ?? "", x.serpFeatures.map(featureLabel).join(", "), x.updatedAt ?? ""]);
  download(csv(rows), `seowise-domain-keywords-${r.domain}-${new Date(r.fetchedAt).toISOString().slice(0, 10)}.csv`);
}
