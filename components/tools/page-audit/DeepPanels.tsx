"use client";

import { IconChevron as ChevronDown } from "@/components/icons/Icons";
import type { AltState, CategoryScore, LinksReport, PageAuditReport, ProbeVerdict, StructuredDataReport } from "@/lib/tools/pageAudit/types";
import { CountPill, EvidenceList } from "./Evidence";

/** Collapsible glass panel, same language as the "Page facts" drawer. */
export function Panel({ title, italic, badge, open = false, children }: { title: string; italic?: string; badge?: React.ReactNode; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} data-print-card className="group/d glass rounded-[20px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="font-serif text-[22px]">
          {title} {italic && <span className="italic">{italic}</span>}
        </span>
        <span className="flex items-center gap-3 text-[13px] text-ds-ink-2">
          {badge}
          <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open/d:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-white/60 px-5 py-4">{children}</div>
    </details>
  );
}

function tone(score: number) {
  return score >= 85 ? "bg-ds-success" : score >= 60 ? "bg-ds-warning" : "bg-ds-danger";
}

export function CategoryBars({ categories }: { categories?: { id: string; score: number; weight?: number; issues?: number }[] }) {
  if (!categories?.length) return null;
  return (
    <section data-print-card className="glass rounded-[24px] p-5 sm:p-7">
      <h3 className="font-serif text-[28px] leading-none">
        Score <span className="italic">by area</span>
      </h3>
      <ul className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
        {categories.map((c) => (
          <li key={c.id} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-[14px]">
            <span className="text-ds-ink-2">{c.id}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-ds-muted">
              <div className={`h-full rounded-full ${tone(c.score)}`} style={{ width: `${c.score}%` }} />
            </div>
            <span className="text-right font-mono text-[12.5px] tabular-nums text-ds-ink">{c.score}</span>
          </li>
        ))}
      </ul>
      {(categories as CategoryScore[])[0]?.weight !== undefined && (
        <p className="mt-4 text-[12.5px] text-ds-ink-3">
          Weighted into the SEO score: {(categories as CategoryScore[]).map((c) => `${c.id} ${c.weight}%`).join(" · ")}
        </p>
      )}
    </section>
  );
}

export function StructuredDataPanel({ sd }: { sd?: StructuredDataReport }) {
  if (!sd) return null;
  const problems = sd.items.filter((i) => i.missingRequired.length || i.unknown.length).length + sd.invalidBlocks;
  return (
    <Panel title="Structured" italic="data" open={problems > 0} badge={<CountPill tone={problems ? "accent" : "muted"}>{sd.items.length} item{sd.items.length === 1 ? "" : "s"}</CountPill>}>
      {!sd.items.length && !sd.invalidBlocks && <p className="text-[14px] text-ds-ink-2">No JSON-LD, microdata or RDFa found on this page.</p>}
      <p className="text-[13px] text-ds-ink-3">
        {sd.jsonLdBlocks} JSON-LD block{sd.jsonLdBlocks === 1 ? "" : "s"}
        {sd.invalidBlocks ? `, ${sd.invalidBlocks} invalid` : ""} · {sd.microdataItems} microdata item{sd.microdataItems === 1 ? "" : "s"}
        {sd.rdfaTypes.length ? ` · RDFa: ${sd.rdfaTypes.join(", ")}` : ""}
        {sd.eligible.length ? ` · Rich results in reach: ${sd.eligible.join(", ")}` : ""}
      </p>
      {sd.parseErrors.length > 0 && <EvidenceList items={sd.parseErrors} label="errors" />}
      <ul className="mt-3 grid gap-3">
        {sd.items.map((it, i) => (
          <li key={i} className="glass-inset rounded-[14px] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15.5px] font-medium text-ds-ink">{it.types.join(" + ")}</span>
              {it.family && <span className="text-[13px] text-ds-ink-3">({it.family})</span>}
              <CountPill>{it.source}</CountPill>
              {it.richResult && <CountPill tone={it.missingRequired.length ? "bad" : "good"}>{it.richResult}{it.missingRequired.length ? ": not eligible" : ": eligible"}</CountPill>}
              {it.nestedIn && <span className="text-[12.5px] text-ds-ink-3">main entity of {it.nestedIn}</span>}
            </div>
            {it.name && <p className="mt-1 text-[13.5px] text-ds-ink-2">{it.name}</p>}
            {it.missingRequired.length > 0 && <p className="mt-1.5 text-[13.5px] text-[#a32121]">Missing required: {it.missingRequired.join(", ")}</p>}
            {it.missingRecommended.length > 0 && <p className="mt-1 text-[13.5px] text-ds-ink-2">Missing recommended: {it.missingRecommended.join(", ")}</p>}
            {it.unknown.map((u) => (
              <p key={u.type} className="mt-1 text-[13.5px] text-[#a32121]">
                “{u.type}” is not a schema.org type{u.suggestion ? `. Did you mean ${u.suggestion}?` : "."}
              </p>
            ))}
            {it.superseded.length > 0 && <p className="mt-1 text-[13.5px] text-ds-ink-2">Superseded type: {it.superseded.join(", ")}</p>}
            {it.notes?.map((n) => (
              <p key={n} className="mt-1 text-[13px] text-ds-ink-3">{n}</p>
            ))}
            {it.children.length > 0 && (
              <p className="mt-2 text-[13px] leading-5 text-ds-ink-3">
                Nested: {it.children.map((c) => `${c.path} → ${c.types.join(" + ")}`).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const ALT_LABEL: Record<AltState, string> = {
  missing: "No alt attribute",
  "empty-content": 'Empty alt=""',
  "empty-decorative": "Decorative (empty alt OK)",
  filename: "Alt is a file name",
  "too-long": "Alt over 125 chars",
  ok: "OK",
};

export function ImagesPanel({ images }: { images?: PageAuditReport["images"] }) {
  if (!images || !images.total) return null;
  const bad = images.items.filter((x) => x.state === "missing" || x.state === "empty-content" || x.state === "filename" || x.state === "too-long");
  return (
    <Panel title="Images" italic="& alt text" open={bad.length > 0} badge={<CountPill tone={bad.length ? "accent" : "good"}>{bad.length ? `${bad.length} to fix` : "All good"}</CountPill>}>
      <div className="flex flex-wrap gap-2 text-[12.5px]">
        {[
          `${images.total} images`,
          `${images.missingAlt} no alt`,
          `${images.emptyAltContent} empty alt on content`,
          `${images.emptyAltDecorative} decorative`,
          `${images.noDimensions} without width/height`,
        ].map((t) => (
          <span key={t} className="glass-inset rounded-[10px] px-2.5 py-1 tabular-nums text-ds-ink-2">{t}</span>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="text-[12px] text-ds-ink-3">
            <tr>
              <th className="py-2 pr-3 font-normal">Image</th>
              <th className="py-2 pr-3 font-normal">Alt text</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {[...bad, ...images.items.filter((x) => !bad.includes(x))].map((x, i) => (
              <tr key={`${x.src}-${i}`} className="align-top">
                <td className="max-w-[340px] py-2 pr-3">
                  {x.src.startsWith("http") ? (
                    <a href={x.src} target="_blank" rel="noreferrer nofollow" className="break-all font-mono text-[12px] text-ds-ink hover:underline">{x.src}</a>
                  ) : (
                    <span className="font-mono text-[12px] text-ds-ink-3">{x.src}</span>
                  )}
                  {x.lazy !== "none" && <span className="ml-1.5 text-[11.5px] text-ds-ink-3">{x.lazy === "js" ? "JS lazy" : "lazy"}</span>}
                </td>
                <td className="max-w-[220px] break-words py-2 pr-3 text-ds-ink-2">{x.alt === null ? <em className="text-ds-ink-3">none</em> : x.alt === "" ? <em className="text-ds-ink-3">empty</em> : x.alt}</td>
                <td className="py-2">
                  <span className={x.state === "ok" || x.state === "empty-decorative" ? "text-ds-ink-3" : "text-[#a32121]"}>{ALT_LABEL[x.state]}</span>
                  {x.reason && <span className="block text-[11.5px] text-ds-ink-3">{x.reason}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {images.total > images.items.length && <p className="mt-2 text-[12.5px] text-ds-ink-3">Showing the first {images.items.length} of {images.total} images.</p>}
    </Panel>
  );
}

const LINK_TONE: Record<string, string> = { broken: "text-[#a32121]", error: "text-[#a32121]", redirect: "text-ds-warning", timeout: "text-ds-ink-3", blocked: "text-ds-ink-3", ok: "text-ds-ink-3" };

export function LinksPanel({ links }: { links?: LinksReport }) {
  if (!links) return null;
  const broken = links.results.filter((r) => r.state === "broken" || r.state === "error").length;
  return (
    <Panel title="Links" badge={<CountPill tone={broken ? "bad" : "muted"}>{broken ? `${broken} broken` : `${links.checked} checked`}</CountPill>} open={broken > 0}>
      <div className="flex flex-wrap gap-2 text-[12.5px]">
        {[
          `${links.internal} internal`,
          `${links.external} external`,
          `${links.unique} unique`,
          `${links.nofollow.internal + links.nofollow.external} nofollow`,
          `${links.empty} without text`,
          `${links.checked} checked live${links.budgetHit ? " (time limit hit)" : ""}`,
        ].map((t) => (
          <span key={t} className="glass-inset rounded-[10px] px-2.5 py-1 tabular-nums text-ds-ink-2">{t}</span>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="text-[12px] text-ds-ink-3">
            <tr>
              <th className="py-2 pr-3 font-normal">URL</th>
              <th className="py-2 pr-3 font-normal">Anchor</th>
              <th className="py-2 font-normal">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {links.results.map((r) => (
              <tr key={r.url} className="align-top">
                <td className="max-w-[360px] py-2 pr-3">
                  <a href={r.url} target="_blank" rel="noreferrer nofollow" className="break-all font-mono text-[12px] text-ds-ink hover:underline">{r.url}</a>
                  <span className="ml-1.5 text-[11.5px] text-ds-ink-3">{r.internal ? "internal" : "external"}{r.nofollow ? " · nofollow" : ""}</span>
                </td>
                <td className="max-w-[200px] break-words py-2 pr-3 text-ds-ink-2">{r.anchor || <em className="text-ds-ink-3">no text</em>}</td>
                <td className={`py-2 ${LINK_TONE[r.state]}`}>
                  {r.status ?? "—"} {r.state}
                  {r.finalUrl && <span className="block break-all text-[11.5px] text-ds-ink-3">→ {r.finalUrl}</span>}
                  {r.note && <span className="block text-[11.5px] text-ds-ink-3">{r.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const VERDICT_LABEL: Record<ProbeVerdict, string> = {
  ok: "Gets the page",
  blocked: "Blocked",
  challenge: "Challenge page",
  "rate-limited": "Rate-limited",
  different: "Different content",
  "no-response": "No response",
  inconclusive: "Inconclusive",
};

export function AiAccessPanel({ access }: { access?: PageAuditReport["aiAccess"] }) {
  if (!access) return null;
  const bad = access.probes.filter((p) => p.verdict === "blocked" || p.verdict === "challenge" || p.verdict === "different" || p.verdict === "no-response").length;
  return (
    <Panel title="AI crawlers," italic="live test" open={bad > 0} badge={<CountPill tone={bad ? "bad" : "good"}>{bad ? `${bad} refused` : "All get the page"}</CountPill>}>
      <p className="text-[13px] leading-5 text-ds-ink-3">
        Browser baseline: HTTP {access.baseline.status ?? "—"}, {access.baseline.words.toLocaleString()} words{access.baseline.challenged ? ", challenged" : ""}. {access.note}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="text-[12px] text-ds-ink-3">
            <tr>
              <th className="py-2 pr-3 font-normal">Crawler</th>
              <th className="py-2 pr-3 font-normal">robots.txt</th>
              <th className="py-2 pr-3 font-normal">Server response</th>
              <th className="py-2 font-normal">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {access.probes.map((p) => (
              <tr key={p.bot} className="align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium text-ds-ink">{p.bot}</span>
                  <span className="block text-[11.5px] text-ds-ink-3">{p.operator} · {p.purpose === "training" ? "training" : p.purpose === "user" ? "user fetch" : "AI search"}</span>
                </td>
                <td className={`py-2 pr-3 ${p.robotsAllowed ? "text-ds-ink-2" : "text-[#a32121]"}`}>{p.robotsAllowed ? "Allowed" : "Disallowed"}</td>
                <td className={`py-2 pr-3 ${p.verdict === "ok" ? "text-[#3f5d4a]" : p.verdict === "inconclusive" || p.verdict === "rate-limited" ? "text-ds-ink-3" : "text-[#a32121]"}`}>
                  {VERDICT_LABEL[p.verdict]}
                  {p.status ? ` · ${p.status}` : ""}
                </td>
                <td className="py-2 text-ds-ink-2">{p.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function SitemapPanel({ sitemap }: { sitemap?: PageAuditReport["sitemap"] }) {
  if (!sitemap) return null;
  const listed = sitemap.listed === true ? "Listed" : sitemap.listed === false ? "Not listed" : "Unknown";
  return (
    <Panel title="Sitemap" badge={<CountPill tone={!sitemap.found || sitemap.listed === false ? "accent" : "good"}>{sitemap.found ? listed : "None found"}</CountPill>}>
      <dl className="grid gap-y-2 text-[14px] sm:grid-cols-[200px_1fr]">
        <dt className="text-ds-ink-3">This page</dt>
        <dd className="text-ds-ink">{sitemap.found ? `${listed}${sitemap.listedIn ? ` in ${sitemap.listedIn}` : ""}` : "No readable sitemap"}</dd>
        <dt className="text-ds-ink-3">Declared in robots.txt</dt>
        <dd className="break-all text-ds-ink">{sitemap.declaredInRobots.length ? sitemap.declaredInRobots.join(", ") : "No Sitemap: line"}</dd>
        <dt className="text-ds-ink-3">URLs read</dt>
        <dd className="text-ds-ink">{sitemap.urlsRead.toLocaleString()}{sitemap.truncated ? " (stopped early: large sitemap)" : ""}</dd>
      </dl>
      {sitemap.files.length > 0 && (
        <EvidenceList items={sitemap.files.map((f) => `${f.url} · ${f.error ?? `HTTP ${f.status}`} · ${f.kind} · ${f.urls.toLocaleString()} URLs`)} label="files" />
      )}
    </Panel>
  );
}

export function HeadingsPanel({ headings }: { headings?: { level: number; text: string }[] }) {
  if (!headings?.length) return null;
  return (
    <Panel title="Heading" italic="outline" badge={<CountPill>{headings.length}</CountPill>}>
      <ol className="space-y-1 text-[13.5px]">
        {headings.map((h, i) => (
          <li key={i} className="flex gap-2" style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
            <span className="w-7 shrink-0 font-mono text-[11.5px] leading-5 text-ds-ink-3">H{h.level}</span>
            <span className={h.text ? "text-ds-ink" : "italic text-[#a32121]"}>{h.text || "(empty heading)"}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
