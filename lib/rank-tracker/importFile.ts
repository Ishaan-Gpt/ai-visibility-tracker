/*
 * Reads a keyword export from another rank tracker so an agency can move its projects here in one step.
 * Client-safe (no server imports): runs in the browser on the file the user picked.
 *
 * Accepts CSV / TSV / semicolon CSV (UTF-8, UTF-8 BOM or UTF-16 as Excel writes it) and .xlsx. Columns are found by
 * header name, so exports from SE Ranking, Semrush Position Tracking, Ahrefs Rank Tracker, AccuRanker, Moz,
 * Wincher, SERPWatcher, Serpstat and Google Search Console (Queries) all work without mapping. A file with no
 * recognisable header is read as one keyword per row from the first column.
 */

export interface ImportRow {
  keyword: string;
  tags: string[];
  volume: number | null;
}

export interface ImportResult {
  rows: ImportRow[];
  /** Best guess at the tool that produced the file, for the confirmation line. */
  source: string | null;
  columns: { keyword: string; tags: string | null; volume: string | null };
  /** Rows skipped because the keyword cell was empty. */
  skipped: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[​﻿"]/g, "").replace(/[^a-z0-9#.]+/g, " ").trim();

const KEYWORD = ["keyword", "keywords", "query", "queries", "top queries", "search query", "search term", "search terms", "phrase", "key phrase", "kw", "term"];
const TAGS = ["tag", "tags", "group", "groups", "keyword group", "folder", "label", "labels", "category", "categories", "segment"];
const VOLUME = ["search volume", "volume", "sv", "avg. monthly searches", "avg monthly searches", "monthly searches", "global volume", "local volume", "msv", "search vol", "searches"];

function findCol(header: string[], aliases: string[]): number {
  for (const a of aliases) {
    const i = header.indexOf(a);
    if (i >= 0) return i;
  }
  // "Search Volume (US)", "Volume, US" and similar.
  for (const a of aliases) {
    const i = header.findIndex((h) => h.startsWith(`${a} `));
    if (i >= 0) return i;
  }
  return -1;
}

function guessSource(header: string[]): string | null {
  const has = (h: string) => header.includes(h);
  if (has("top queries") || (has("clicks") && has("impressions"))) return "Google Search Console";
  if (has("group") && (has("target url") || has("google") || header.some((h) => h.startsWith("google ")))) return "SE Ranking";
  if (header.some((h) => /_\d{8}$/.test(h) || /\d{8}$/.test(h)) && has("keyword")) return "Semrush";
  if (has("serp features") && has("kd")) return "Ahrefs";
  if (has("share of voice") || has("accuranker")) return "AccuRanker";
  if (has("difficulty") && has("organic ctr")) return "Moz";
  return null;
}

/** RFC 4180 CSV with a sniffed delimiter (comma, semicolon or tab). */
export function parseDelimited(text: string): string[][] {
  const sample = text.slice(0, 4000).split(/\r?\n/).slice(0, 5).join("\n");
  const count = (d: string) => sample.split(d).length;
  const delim = [",", ";", "\t"].reduce((best, d) => (count(d) > count(best) ? d : best), ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function decodeText(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(b.subarray(2));
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(b.subarray(2));
  // UTF-16 without a BOM: every other byte of ASCII text is zero.
  if (b.length > 4 && b[1] === 0 && b[3] === 0 && b[0] !== 0) return new TextDecoder("utf-16le").decode(b);
  return new TextDecoder("utf-8").decode(b).replace(/^﻿/, "");
}

/* ---------- .xlsx (zip of SpreadsheetML), read with the browser's DecompressionStream ---------- */

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzip(buf: ArrayBuffer, wanted: (name: string) => boolean): Promise<Map<string, string>> {
  const v = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66_000); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("This doesn't look like an Excel file.");
  const entries = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out = new Map<string, string>();
  const dec = new TextDecoder();
  for (let n = 0; n < entries; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true);
    const compSize = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const localOff = v.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!wanted(name)) continue;
    const lNameLen = v.getUint16(localOff + 26, true);
    const lExtraLen = v.getUint16(localOff + 28, true);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = bytes.subarray(start, start + compSize);
    const data = method === 0 ? raw : method === 8 ? await inflateRaw(raw) : null;
    if (data) out.set(name, dec.decode(data));
  }
  return out;
}

const unescapeXml = (s: string) =>
  s.replace(/&(lt|gt|quot|apos|amp|#\d+|#x[0-9a-f]+);/gi, (_, e: string) => {
    const k = e.toLowerCase();
    if (k === "lt") return "<";
    if (k === "gt") return ">";
    if (k === "quot") return '"';
    if (k === "apos") return "'";
    if (k === "amp") return "&";
    return String.fromCodePoint(k.startsWith("#x") ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
  });

const textOf = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unescapeXml(m[1])).join("");

function colIndex(ref: string): number {
  const letters = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export async function parseXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const files = await unzip(buf, (n) => n === "xl/sharedStrings.xml" || n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const shared = [...(files.get("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
  // First sheet in workbook order (falls back to the lowest-numbered sheet file).
  let sheetPath: string | undefined;
  const firstRid = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(files.get("xl/workbook.xml") ?? "")?.[1];
  if (firstRid) {
    const target = new RegExp(`<Relationship\\b[^>]*Id="${firstRid}"[^>]*Target="([^"]+)"`).exec(files.get("xl/_rels/workbook.xml.rels") ?? "")?.[1]
      ?? new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${firstRid}"`).exec(files.get("xl/_rels/workbook.xml.rels") ?? "")?.[1];
    if (target) sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
  }
  const sheetXml = (sheetPath && files.get(sheetPath)) || [...files.entries()].filter(([n]) => n.startsWith("xl/worksheets/")).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))[0]?.[1];
  if (!sheetXml) throw new Error("The workbook has no sheets.");
  const rows: string[][] = [];
  for (const r of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const body = c[2] ?? "";
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1];
      let val = "";
      if (type === "inlineStr") val = textOf(body);
      else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
        val = type === "s" ? (shared[Number(v)] ?? "") : unescapeXml(v);
      }
      const idx = ref ? colIndex(ref) : row.length;
      while (row.length < idx) row.push("");
      row[idx] = val;
    }
    if (row.some((x) => x.trim() !== "")) rows.push(row);
  }
  return rows;
}

/* ---------- rows -> keywords ---------- */

function toNumber(s: string | undefined): number | null {
  if (!s) return null;
  const t = s.replace(/[\s, ]/g, "").replace(/^[<>~]/, "");
  if (!t || t === "-" || t === "n/a") return null;
  const m = /^(\d+(?:\.\d+)?)([kKmM])?$/.exec(t);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] ? (m[2].toLowerCase() === "k" ? 1e3 : 1e6) : 1);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function rowsToKeywords(table: string[][]): ImportResult {
  // The header is the first row (within the first 15, after any title lines) that names a keyword column.
  let headerAt = -1;
  let header: string[] = [];
  for (let i = 0; i < Math.min(15, table.length); i++) {
    const h = table[i].map(norm);
    if (findCol(h, KEYWORD) >= 0) {
      headerAt = i;
      header = h;
      break;
    }
  }
  const kCol = headerAt >= 0 ? findCol(header, KEYWORD) : 0;
  const tCol = headerAt >= 0 ? findCol(header, TAGS) : -1;
  const vCol = headerAt >= 0 ? findCol(header, VOLUME) : -1;
  const raw = headerAt >= 0 ? table[headerAt] : [];
  const byKeyword = new Map<string, ImportRow>();
  let skipped = 0;
  for (const r of table.slice(headerAt + 1)) {
    const keyword = (r[kCol] ?? "").replace(/\s+/g, " ").trim();
    if (!keyword) {
      skipped++;
      continue;
    }
    const tags = tCol >= 0 ? (r[tCol] ?? "").split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [];
    const volume = vCol >= 0 ? toNumber(r[vCol]) : null;
    const key = keyword.toLowerCase();
    const prev = byKeyword.get(key);
    // Exports with one row per search engine or date repeat the keyword; merge them.
    byKeyword.set(key, { keyword, tags: [...new Set([...(prev?.tags ?? []), ...tags])].slice(0, 8), volume: prev?.volume ?? volume });
  }
  return {
    rows: [...byKeyword.values()],
    source: headerAt >= 0 ? guessSource(header) : null,
    columns: { keyword: headerAt >= 0 ? raw[kCol]?.trim() || "Keyword" : "first column", tags: tCol >= 0 ? raw[tCol]?.trim() || null : null, volume: vCol >= 0 ? raw[vCol]?.trim() || null : null },
    skipped,
  };
}

export async function readKeywordFile(file: File): Promise<ImportResult> {
  if (file.size > 20 * 1024 * 1024) throw new Error("That file is over 20 MB. Export just the keyword list and try again.");
  const buf = await file.arrayBuffer();
  const head = new Uint8Array(buf.slice(0, 4));
  const isZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if (/\.xls$/i.test(file.name) && !isZip) throw new Error("Old .xls files aren't supported. Save it as .xlsx or CSV and try again.");
  const table = isZip ? await parseXlsx(buf) : parseDelimited(decodeText(buf));
  if (!table.length) throw new Error("That file is empty.");
  return rowsToKeywords(table);
}
