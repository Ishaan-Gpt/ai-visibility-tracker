"use client";

import { useEffect, useState } from "react";
import { RunningStages } from "@/components/tools/shell/Bits";
import { BotGroup } from "@/components/tools/ai-crawlers/AiCrawlerWorkspace";
import { SAMPLE_ROBOTS_LINES, botsFor } from "@/lib/samples";

/* Live, looping versions of real tool components, for marketing sections. */

const STAGES = ["Fetching the live page", "Reading robots.txt and llms.txt", "Checking 20+ on-page signals", "Scoring AI readiness"];

export function LiveStages({ bare = false }: { bare?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((v) => (v >= STAGES.length ? 0 : v + 1)), i >= STAGES.length ? 2200 : 1100);
    return () => clearTimeout(t);
  }, [i]);
  if (bare) return <RunningStages stages={STAGES} step={i} />;
  return (
    <div className="glass-strong rounded-[22px] p-5 sm:p-6">
      <RunningStages stages={STAGES} step={i} />
    </div>
  );
}

export function LiveBots() {
  const [off, setOff] = useState<Set<number>>(new Set());
  const robots = SAMPLE_ROBOTS_LINES.filter((_, i) => !off.has(i)).join("\n");
  const bots = botsFor(robots).filter((b) => b.purpose === "ai-search");
  // Clicking a pill removes (or restores) the robots.txt block for that bot, re-evaluated with the real parser.
  const toggle = (agent: string) => {
    const at = SAMPLE_ROBOTS_LINES.findIndex((l) => l === `User-agent: ${agent}`);
    if (at < 0) return;
    setOff((prev) => {
      const n = new Set(prev);
      const rule = at + 1;
      if (n.has(rule)) n.delete(rule);
      else n.add(rule);
      return n;
    });
  };
  return (
    <div>
      <BotGroup purpose="ai-search" bots={bots} onToggle={toggle} />
      <p className="mt-3 text-center text-[12.5px] text-ds-ink-2">Tap a pill to edit the sample robots.txt and re-check it live.</p>
    </div>
  );
}
