"use client";

import type { ReactNode } from "react";
import { IconChevron as ChevronDown } from "@/components/icons/Icons";
import { PURPOSE_LABEL, type BotPurpose } from "@/lib/tools/aiCrawlers/bots";
import type { AiCrawlerReport, BotResult } from "@/lib/tools/aiCrawlers/check";
import { AccessPill, Facts, LivePill, kb } from "./parts";

export const PURPOSE_BLURB: Record<BotPurpose, string> = {
  "ai-search": "Decide whether AI search can cite you. You almost always want these allowed.",
  "ai-user": "Fetch a page live when someone asks an assistant about it.",
  "ai-training": "Collect content for model training. Blocking them does not affect AI search.",
  search: "Classic search. Also feeds Google AI Overviews and Bing Copilot.",
};

const BASIS: Record<string, string> = {
  specific: "its own User-agent group",
  fallback: "another crawler's group (documented fallback)",
  wildcard: "the User-agent: * group",
  none: "no group (no rules apply)",
};

function ruleText(r: NonNullable<BotResult["root"]>["rule"]) {
  if (!r) return "No rule matched, so it is allowed";
  return `${r.allow ? "Allow" : "Disallow"}: ${r.pattern}${r.line ? ` (line ${r.line})` : ""}`;
}

function botRows(b: BotResult, report: AiCrawlerReport): [string, ReactNode][] {
  const rows: [string, ReactNode][] = [["robots token", <span key="t" className="font-mono">{b.agent}</span>]];
  if (b.root) {
    rows.push(["Rules from", BASIS[b.root.basis] + (b.root.groupLine ? `, line ${b.root.groupLine}` : "")]);
    rows.push(["Homepage (/)", ruleText(b.root.rule)]);
  }
  if (b.pathTest && report.testPath) rows.push([report.testPath, `${b.pathTest.allowed ? "Allowed" : "Blocked"} · ${ruleText(b.pathTest.rule)}`]);
  if (b.disallowed?.length) rows.push(["Disallowed paths", b.disallowed.slice(0, 12).join("  ") + (b.disallowed.length > 12 ? `  +${b.disallowed.length - 12} more` : "")]);
  const n = report.samples?.paths.length ?? 0;
  if (b.blockedSamples && n) {
    rows.push(["Sitemap sample", b.blockedSamples.length ? `${b.blockedSamples.length} of ${n} blocked: ${b.blockedSamples.slice(0, 3).join(", ")}` : `All ${n} sampled URLs allowed`]);
  }
  if (b.live) rows.push(["Live result", `${b.live.reason}${b.live.ms ? ` · ${b.live.ms} ms` : ""}`]);
  if (b.livePath && report.testPath) rows.push([`Live ${report.testPath}`, b.livePath.reason]);
  if (b.ua) {
    rows.push([
      "User-agent sent",
      <span key="ua" className="break-all font-mono text-[12px]">
        {b.ua}
        <span className="ml-1 font-sans text-ds-ink-3">({b.uaSource === "published" ? "as published by the vendor" : "token documented; full string as seen in server logs"})</span>
      </span>,
    ]);
  }
  if (b.docsUrl) {
    rows.push([
      "Docs",
      <a key="d" href={b.docsUrl} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2 hover:text-ds-accent-ink">
        {b.docsUrl.replace(/^https?:\/\//, "")}
      </a>,
    ]);
  }
  return rows;
}

/**
 * "Partial" for a bot that is allowed at / and can fetch every sampled sitemap URL is technically true but alarming
 * (most sites disallow /cart or /admin). Show it as allowed; the detail line still lists the disallowed paths.
 */
function displayAccess(b: BotResult, report: AiCrawlerReport) {
  if (b.access === "partial" && b.root?.allowed && (report.samples?.paths.length ?? 0) > 0 && b.blockedSamples?.length === 0) return "allowed" as const;
  return b.access;
}

/** One purpose group of crawlers: robots.txt verdict + live server verdict, each row expandable for detail. */
export function CrawlerGroup({ purpose, bots, report }: { purpose: BotPurpose; bots: BotResult[]; report: AiCrawlerReport }) {
  const hasLive = bots.some((b) => b.live);
  return (
    <section data-print-card className="glass rounded-[20px]">
      <div className="flex items-end justify-between gap-3 border-b border-white/60 px-5 py-4">
        <div className="min-w-0">
          <h4 className="font-serif text-[24px] leading-none">{PURPOSE_LABEL[purpose]}</h4>
          <p className="mt-1 text-[13px] leading-5 text-ds-ink-2">{PURPOSE_BLURB[purpose]}</p>
        </div>
        {hasLive && (
          <div className="hidden shrink-0 gap-2 text-[11px] uppercase tracking-[0.12em] text-ds-ink-3 sm:flex">
            <span className="w-[86px] text-center">robots.txt</span>
            <span className="w-[112px] text-center">Live server</span>
            <span className="w-4" />
          </div>
        )}
      </div>
      <ul className="divide-y divide-white/60">
        {bots.map((b) => (
          <li key={b.agent}>
            <details className="group/r [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-white/30">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-[14px] text-ds-ink">{b.agent}</span>
                    <span className="text-[12px] text-ds-ink-3">{b.owner}</span>
                    {b.conflict && <span className="rounded-full bg-[#f6d5cc]/80 px-2 py-px text-[11px] font-medium text-[#b23a2a]">Firewall overrides robots.txt</span>}
                  </div>
                  <p className="truncate text-[12px] leading-4 text-ds-ink-3 sm:whitespace-normal">{b.detail}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span className="flex justify-center sm:w-[86px]">
                    <AccessPill access={displayAccess(b, report)} small />
                  </span>
                  {hasLive && <span className="flex justify-center sm:w-[112px]">{b.live ? <LivePill live={b.live} small /> : <span className="text-[12px] text-ds-ink-3">—</span>}</span>}
                  <ChevronDown className="h-4 w-4 text-ds-ink-3 transition-transform duration-300 group-open/r:rotate-180" />
                </div>
              </summary>
              <div className="space-y-3 bg-white/25 px-5 pb-4 pt-2">
                <p className="text-[13px] leading-5 text-ds-ink-2">{b.note}</p>
                <Facts rows={botRows(b, report)} />
                {b.mayIgnoreRobots && <p className="text-[12.5px] leading-5 text-ds-ink-3">{b.owner} says this agent acts on a person&apos;s request and may not follow robots.txt.</p>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Live probe summary: what we compared and how to read it. */
export function LiveSummary({ report }: { report: AiCrawlerReport }) {
  const live = report.live;
  if (!live) return null;
  const tone =
    live.pattern === "ai-targeted" || live.pattern === "selective"
      ? "border-[#b23a2a]/25"
      : live.pattern === "all-bots" || live.pattern === "inconclusive"
        ? "border-[#a56312]/25"
        : "border-white/70";
  return (
    <section data-print-card className={`glass rounded-[20px] border p-5 sm:p-6 ${tone}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-[26px] leading-none">
          Live <span className="italic">server</span> check
        </h3>
        <span className="text-[12.5px] text-ds-ink-3">
          {live.probed} user-agents · baseline {live.baseline ? `${live.baseline.status ?? "—"}, ${kb(live.baseline.bytes)}` : "—"}
          {live.vendor ? ` · served by ${live.vendor}` : ""} · {(live.ms / 1000).toFixed(1)} s
        </span>
      </div>
      <p className="mt-2 text-[14.5px] leading-6 text-ds-ink">{live.note}</p>
      <details className="mt-3 text-[13px] text-ds-ink-2 [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none underline decoration-dotted underline-offset-4 hover:text-ds-ink">How this test works</summary>
        <p className="mt-2 leading-5">
          We requested {live.url} once with a normal Chrome user-agent, then once with each crawler&apos;s published user-agent, and compared status codes, block and
          challenge pages (Cloudflare, Akamai, DataDome, HUMAN, Imperva, Sucuri, AWS WAF, Vercel and others) and page size. The requests come from our servers, not from
          each vendor&apos;s verified IP ranges, so a firewall that checks IPs can treat the real crawler differently. If the site starts refusing our server mid-test,
          we stop and mark those results as unreliable.
        </p>
      </details>
    </section>
  );
}
