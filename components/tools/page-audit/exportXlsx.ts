import type { SiteAuditReport } from "@/lib/tools/pageAudit/siteTypes";

/*
 * Client-side Excel (.xlsx) and CSV export of a site audit. An .xlsx is a zip of SpreadsheetML parts; we write an
 * uncompressed ("stored") zip by hand so no library is needed. Inline strings avoid a shared-strings table.
 */

type Cell = string | number | boolean | null | undefined;
interface Sheet {
  name: string;
  rows: Cell[][];
  widths: number[];
}

/* ---------- zip (store only) ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; data: Uint8Array }[]): Blob {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint32(14, crc, true);
    local.setUint32(18, f.data.length, true);
    local.setUint32(22, f.data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, f.data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, f.data.length, true);
    cen.setUint32(24, f.data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const cenSize = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* ---------- SpreadsheetML ---------- */

// XML 1.0 forbids most control characters; Excel also caps a cell at 32,767 characters.
const xml = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .slice(0, 32_000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function colName(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function sheetXml(sheet: Sheet): string {
  const cols = sheet.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((v, c) => {
          const ref = `${colName(c)}${r + 1}`;
          const style = r === 0 ? ' s="1"' : "";
          if (v === null || v === undefined || v === "") return r === 0 ? `<c r="${ref}"${style}/>` : "";
          if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
          if (typeof v === "boolean") return `<c r="${ref}" t="b"${style}><v>${v ? 1 : 0}</v></c>`;
          return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xml(String(v))}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  const last = `${colName(Math.max(0, sheet.widths.length - 1))}${Math.max(1, sheet.rows.length)}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${rows}</sheetData>${sheet.rows.length > 1 ? `<autoFilter ref="A1:${last}"/>` : ""}</worksheet>`;
}

function workbook(sheets: Sheet[]): Blob {
  const enc = new TextEncoder();
  const names = sheets.map((s) => xml(s.name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31)));
  const files: { name: string; data: string }[] = [
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: "xl/styles.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFBE3D3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) })),
  ];
  return zip(files.map((f) => ({ name: f.name, data: enc.encode(f.data) })));
}

/* ---------- the site audit as sheets ---------- */

const groupById = (r: SiteAuditReport, id: string) => r.issues.find((g) => g.id === id);

export function siteAuditSheets(r: SiteAuditReport): Sheet[] {
  const t = r.totals;
  const summary: Sheet = {
    name: "Summary",
    widths: [32, 70],
    rows: [
      ["Metric", "Value"],
      ["Site", r.host],
      ["Start URL", r.resolvedUrl],
      ["Mode", r.mode ?? "site"],
      ["Audited", new Date(r.checkedAt).toISOString().replace("T", " ").slice(0, 16) + " UTC"],
      ["Site score (0-100)", r.score],
      ["AI-readiness score (0-100)", r.aiScore],
      ["Pages crawled", t.crawled],
      ["Pages audited", t.analysed],
      ["Indexable pages", t.indexable],
      ["Not indexable", t.excluded],
      ["Broken URLs", t.broken],
      ["Redirects", t.redirects],
      ["URLs in sitemaps", t.sitemapUrls],
      ["Stopped because", r.stoppedBy],
      ...r.categories.map((c) => [`Score: ${c.id}`, c.score] as Cell[]),
    ],
  };

  const issues: Sheet = {
    name: "Issues",
    widths: [10, 16, 60, 10, 70, 70],
    rows: [
      ["Severity", "Area", "Issue", "Affected", "Why it matters", "How to fix"],
      ...r.issues.map((g) => [g.severity, g.category, g.title, g.count, g.detail, g.fix] as Cell[]),
      ...r.crawlIssues.map((c) => [c.severity, "Site", c.title, c.count, c.detail, c.fix] as Cell[]),
    ],
  };

  const issueUrls: Sheet = {
    name: "Issue URLs",
    widths: [10, 50, 70, 50, 90],
    rows: [
      ["Severity", "Issue", "URL", "Note", "Evidence"],
      ...r.issues.flatMap((g) => g.pages.map((p) => [g.severity, g.title, p.url, p.note ?? "", (p.items ?? []).join(" | ")] as Cell[])),
      ...r.crawlIssues.flatMap((c) => c.examples.map((u) => [c.severity, c.title, u, "", ""] as Cell[])),
    ],
  };

  const pages: Sheet = {
    name: "Pages",
    widths: [70, 8, 30, 50, 40, 8, 8, 8, 10, 8, 8, 8, 8, 8, 40],
    rows: [
      ["URL", "Status", "Not indexable because", "Title", "H1", "Words", "Depth", "Inlinks", "In sitemap", "Response ms", "SEO score", "AI score", "Errors", "Warnings", "Schema types"],
      ...r.pages.map((p) => [p.url, p.status ?? "", p.excluded ?? "", p.title ?? "", p.h1 ?? "", p.words || "", p.depth ?? "", p.inlinks, p.inSitemap ? "yes" : "no", p.ms || "", p.score ?? "", p.aiScore ?? "", p.errors, p.warnings, p.schemaTypes.join(", ")] as Cell[]),
    ],
  };

  const pageIssues: Sheet = {
    name: "Page issues",
    widths: [70, 10, 60, 90],
    rows: [["URL", "Severity", "Issue", "Evidence"], ...r.pages.flatMap((p) => p.issues.map((i) => [p.url, i.severity, i.title, (i.items ?? []).join(" | ")] as Cell[]))],
  };

  const broken = groupById(r, "broken-internal");
  const brokenSheet: Sheet = {
    name: "Broken links",
    widths: [70, 30, 70, 40],
    rows: [
      ["Broken URL", "Status", "Linked from", "Anchor text"],
      ...(broken?.pages ?? []).flatMap((p) =>
        (p.items?.length ? p.items : [""]).map((src) => {
          const [from, anchor = ""] = src.split(" · ");
          return [p.url, p.note?.split(" · ")[0] ?? "", from, anchor.replace(/^"|"$/g, "")] as Cell[];
        }),
      ),
    ],
  };

  const redirects = groupById(r, "links-to-redirects");
  const redirectSheet: Sheet = {
    name: "Redirected links",
    widths: [70, 70, 70],
    rows: [["Linked URL", "Redirects to", "Linked from"], ...(redirects?.pages ?? []).flatMap((p) => (p.items?.length ? p.items : [""]).map((from) => [p.url, (p.note ?? "").replace(/^→\s*/, ""), from] as Cell[]))],
  };

  const alt = groupById(r, "site-alt");
  const imageSheet: Sheet = {
    name: "Images missing alt",
    widths: [80, 30, 70],
    rows: [["Image URL", "Problem", "Appears on"], ...(alt?.pages ?? []).flatMap((p) => (p.items?.length ? p.items : [""]).map((page) => [p.url, p.note ?? "", page] as Cell[]))],
  };

  const dupes: Sheet = {
    name: "Duplicates",
    widths: [16, 70, 70],
    rows: [
      ["Type", "Shared value", "URL"],
      ...["dup-title", "dup-description", "dup-h1"].flatMap((id) => {
        const g = groupById(r, id);
        const label = id === "dup-title" ? "Title" : id === "dup-description" ? "Meta description" : "H1";
        return (g?.pages ?? []).map((p) => [label, (p.note ?? "").replace(/\s—\sshared by.*$/, "").replace(/^"|"$/g, ""), p.url] as Cell[]);
      }),
    ],
  };

  return [summary, issues, issueUrls, pages, pageIssues, brokenSheet, redirectSheet, imageSheet, dupes];
}

function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2_000);
}

const fileBase = (r: SiteAuditReport) => `seowise-site-audit-${r.host}-${new Date(r.checkedAt).toISOString().slice(0, 10)}`;

/** The workbook as a Blob (used by the download button; exported for testing). */
export function siteAuditWorkbook(r: SiteAuditReport): Blob {
  return workbook(siteAuditSheets(r));
}

export function downloadSiteXlsx(r: SiteAuditReport) {
  download(workbook(siteAuditSheets(r)), `${fileBase(r)}.xlsx`);
}

/** One flat CSV of every page (with a BOM so Excel reads UTF-8). Cells that look like formulas are neutralised. */
export function downloadSiteCsv(r: SiteAuditReport) {
  const pages = siteAuditSheets(r)[3].rows;
  const cell = (v: Cell) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  download(new Blob([`﻿${pages.map((row) => row.map(cell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" }), `${fileBase(r)}.csv`);
}
