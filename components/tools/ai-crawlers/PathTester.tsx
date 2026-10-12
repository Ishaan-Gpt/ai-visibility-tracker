"use client";

import { useMemo, useState } from "react";
import { IconArrow } from "@/components/icons/Icons";
import { BOT_CATALOGUE, PURPOSES, PURPOSE_LABEL } from "@/lib/tools/aiCrawlers/bots";
import { explainPath, parseRobots, toTestPath } from "@/lib/tools/aiCrawlers/robots";
import type { AiCrawlerReport } from "@/lib/tools/aiCrawlers/check";
import { AccessPill } from "./parts";

/**
 * Google-style robots.txt tester that runs in the browser against the fetched file: instant, no quota.
 * "Live-test" re-runs the full check with the path so the server is probed too.
 */
export function PathTester({ report, onLiveTest }: { report: AiCrawlerReport; onLiveTest?: (url: string) => void }) {
  const [path, setPath] = useState(report.testPath ?? "/");
  const text = report.robots.text;
  const sem = report.robots.semantics;
  const parsed = useMemo(() => (typeof text === "string" ? parseRobots(text) : null), [text]);
  const p = toTestPath(path);
  const rows = useMemo(() => (parsed && sem === "parsed" ? BOT_CATALOGUE.map((b) => ({ bot: b, x: explainPath(parsed, b.agent, p) })) : []), [parsed, sem, p]);

  if (typeof text !== "string" || !sem) return null; // report saved before the tester existed
  const blocked = rows.filter((r) => !r.x.allowed).length;

  return (
    <section data-print-card className="glass rounded-[20px] p-5 sm:p-6">
      <h3 className="font-serif text-[26px] leading-none">
        Test a <span className="italic">path</span>
      </h3>
      <p className="mt-1 text-[13.5px] leading-5 text-ds-ink-2">Checks any URL path against the fetched robots.txt for every crawler, with the exact rule and line that decides it.</p>
      <form
        className="no-print mt-4 flex flex-col gap-2 sm:flex-row"
        data-print-hide
        onSubmit={(e) => {
          e.preventDefault();
          if (onLiveTest && report.origin) onLiveTest(`${report.origin}${p}`);
        }}
      >
        <label className="glass-inset flex min-w-0 flex-1 items-center rounded-[12px] px-3">
          <span className="sr-only">Path to test</span>
          <span className="font-mono text-[13px] text-ds-ink-3">{report.origin?.replace(/^https?:\/\//, "") ?? report.domain}</span>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/blog/my-post"
            spellCheck={false}
            className="h-10 min-w-0 flex-1 bg-transparent font-mono text-[14px] text-ds-ink outline-none placeholder:text-ds-ink-3"
          />
        </label>
        {onLiveTest && report.origin && (
          <button type="submit" className="glass-inset inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[13.5px] text-ds-ink transition hover:bg-white/80" title="Runs a full check (uses one daily check) including live requests to this path">
            Live-test this path <IconArrow className="h-4 w-4" />
          </button>
        )}
      </form>

      {sem !== "parsed" ? (
        <p className="mt-4 text-[14px] text-ds-ink">
          {sem === "disallow-all"
            ? "robots.txt could not be read successfully, so compliant crawlers treat every path as disallowed."
            : "There are no robots.txt rules, so every path is allowed for every crawler."}
        </p>
      ) : (
        <>
          <p className="mt-4 text-[14px] text-ds-ink">
            <span className="font-mono">{p}</span> is {blocked === 0 ? "allowed for every crawler." : `blocked for ${blocked} of ${rows.length} crawlers.`}
            {report.robots.textCapped && <span className="text-ds-ink-3"> (Tested against the first 120 KB of the file.)</span>}
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {PURPOSES.map((purpose) => (
              <div key={purpose} className="rounded-[14px] bg-white/35 p-3">
                <p className="mb-1.5 text-[12px] uppercase tracking-[0.12em] text-ds-ink-3">{PURPOSE_LABEL[purpose]}</p>
                <ul className="space-y-1">
                  {rows
                    .filter((r) => r.bot.purpose === purpose)
                    .map(({ bot, x }) => (
                      <li key={bot.agent} className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="min-w-0">
                          <span className="font-mono text-ds-ink">{bot.agent}</span>
                          <span className="ml-2 text-[12px] text-ds-ink-3">
                            {x.rule ? `${x.rule.allow ? "Allow" : "Disallow"}: ${x.rule.pattern}${x.rule.line ? ` · line ${x.rule.line}` : ""}` : x.basis === "none" ? "no rules" : "no rule matched"}
                          </span>
                        </span>
                        <AccessPill access={x.allowed ? "allowed" : "blocked"} small />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
