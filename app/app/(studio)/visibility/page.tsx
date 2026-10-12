import type { Metadata } from "next";
import Link from "next/link";
import TrendChart from "@/components/dashboard/TrendChart";
import PromptList from "@/components/dashboard/PromptList";
import CompetitorCompare from "@/components/dashboard/CompetitorCompare";
import { MetricCards } from "@/components/dashboard/ScoreCard";
import RunBar from "@/components/dashboard/RunBar";
import SourcesTable from "@/components/dashboard/SourcesTable";
import EnginePanel from "@/components/dashboard/EnginePanel";
import BrandSettings from "@/components/dashboard/BrandSettings";
import type { FullRun, PromptView } from "@/components/dashboard/format";
import { Glass, Masthead } from "@/components/studio/Glass";
import { ArchWindow } from "@/components/studio/Pieces";
import { Rise } from "@/components/studio/Views";
import { IconArrow } from "@/components/icons/Icons";
import { getAccount } from "@/lib/app-context";
import { getPrompts, getRecentRuns, getRollups } from "@/lib/data";
import { adminDb } from "@/lib/firebase/admin";
import { DAILY_LIMITS } from "@/lib/limits";
import { engineStatus } from "@/lib/providers";
import type { Provider, RunDoc } from "@/lib/types";

export const metadata: Metadata = { title: "AI Visibility" };
// Server actions on this page (prompt suggestions) call Gemini.
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

/** On-demand checks left today (same counter the run route consumes). Never throws. */
async function visibilityQuota(uid: string, tier: "free" | "pro") {
  const limit = DAILY_LIMITS.visibility[tier];
  try {
    const day = new Date().toISOString().slice(0, 10);
    const snap = await adminDb().collection("quota").doc(`u_${uid}_visibility_${day}`).get();
    const used = (snap.data()?.count as number | undefined) ?? 0;
    return { remaining: Math.max(0, limit - used), limit };
  } catch {
    return { remaining: limit, limit };
  }
}

/** True while a check holds the brand's run lock. */
function isRunning(lockUntil: number | undefined): boolean {
  return (lockUntil ?? 0) > Date.now();
}

function toFull(r: RunDoc): FullRun {
  return {
    id: r.id,
    provider: r.provider,
    model: r.model,
    timestamp: r.timestamp,
    mentioned: r.mentioned,
    position: r.position ?? null,
    cited: r.cited,
    citations: r.citations,
    citedUrls: r.citedUrls ?? [],
    sentiment: r.sentiment ?? null,
    sentimentReason: r.sentimentReason,
    rawExcerpt: r.rawExcerpt ?? "",
    mentionSpans: r.mentionSpans,
    grounded: r.grounded,
    brandOrder: r.brandOrder,
    competitorMentions: r.competitorMentions,
  };
}

export default async function VisibilityPage({ searchParams }: { searchParams: Promise<{ first?: string }> }) {
  const { brand, limits, user, tier, isPaid } = await getAccount();

  if (!brand) {
    return (
      <>
        <Masthead crumb="AI Visibility" title="Is your brand in the" italic="answer?" lede="Add your brand, a few prompts customers might ask an AI and a competitor. Your first check runs straight away, then on a schedule." />
        <Rise>
          <Link href="/app/onboarding" className="group block">
            <ArchWindow className="h-[420px] max-w-[520px]">
              <p className="font-serif text-[36px] leading-[1.02]">
                Three prompts, <span className="italic">one minute</span>
              </p>
              <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-[13.5px] font-medium text-ds-ink transition-transform duration-500 group-hover:translate-x-1">
                Set up tracking <IconArrow className="h-4 w-4" />
              </span>
            </ArchWindow>
          </Link>
        </Rise>
      </>
    );
  }

  const { first } = await searchParams;
  const [prompts, runs, rollups, quota] = await Promise.all([getPrompts(brand.id), getRecentRuns(brand.id, 400), getRollups(brand.id), visibilityQuota(user.uid, tier)]);
  const engines = engineStatus();
  const activeEngines = engines.filter((e) => e.active);
  const latest = rollups.length > 0 ? rollups[rollups.length - 1] : null;
  const previous = rollups.length > 1 ? rollups[rollups.length - 2] : null;

  // Latest answer per prompt x engine (full), plus a slim history for the beads.
  const promptViews: PromptView[] = prompts.map((p) => {
    const mine = runs.filter((r) => r.promptId === p.id);
    const latestBy: Partial<Record<Provider, FullRun>> = {};
    for (const r of mine) if (!latestBy[r.provider]) latestBy[r.provider] = toFull(r);
    return {
      id: p.id,
      text: p.text,
      active: p.active,
      latest: latestBy,
      history: mine.slice(0, 24).map((r) => ({ provider: r.provider, timestamp: r.timestamp, mentioned: r.mentioned, position: r.position ?? null, cited: r.cited ?? false, grounded: r.grounded })),
    };
  });

  const activePrompts = prompts.filter((p) => p.active).length;
  const lastCheckedAt = brand.lastCheckedAt || (runs[0]?.timestamp ?? null);
  const neverChecked = !brand.lastCheckedAt && runs.length === 0;
  const nextCheckAt = brand.lastCheckedAt ? brand.lastCheckedAt + limits.refreshDays * DAY_MS : null;
  const engineNames = activeEngines.map((e) => e.label);

  return (
    <>
      <Masthead
        crumb={brand.domain}
        title="AI"
        italic="Visibility"
        lede={`How often AI answers name ${brand.name}, where you rank, which sources they cite, and how you compare. Engines: ${engineNames.join(", ") || "none configured"}. Checks run ${limits.refreshDays === 1 ? "daily" : `every ${limits.refreshDays} days`}, or on demand.`}
      />
      <Rise>
        <RunBar
          autoStart={first === "1" && neverChecked}
          running={isRunning(brand.runLockUntil)}
          lastCheckedAt={lastCheckedAt}
          nextCheckAt={nextCheckAt}
          lastRunError={brand.lastRunError ?? null}
          activePrompts={activePrompts}
          engines={engineNames}
          quota={quota}
          neverChecked={neverChecked}
        />
      </Rise>
      <div className="space-y-5">
        <Rise i={1}>
          <MetricCards latest={latest} previous={previous} />
        </Rise>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Rise i={2} className="lg:col-span-2">
            <Glass className="h-full p-6">
              <h2 className="mb-3 font-serif text-[28px] leading-none">
                Visibility <span className="italic">over time</span>
              </h2>
              <TrendChart rollups={rollups} />
            </Glass>
          </Rise>
          <Rise i={3}>
            <EnginePanel engines={engines} rollup={latest} />
          </Rise>
        </div>
        <Rise i={4}>
          <PromptList prompts={promptViews} brandName={brand.name} maxPrompts={limits.maxPrompts} />
        </Rise>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Rise i={5}>
            <CompetitorCompare brand={brand} latestRollup={latest} />
          </Rise>
          <Rise i={6}>
            <SourcesTable rollup={latest} brandDomain={brand.domain} />
          </Rise>
        </div>
        <Rise i={7}>
          <BrandSettings
            name={brand.name}
            domain={brand.domain}
            aliases={brand.aliases ?? []}
            category={brand.category ?? ""}
            competitors={brand.competitors}
            maxCompetitors={limits.maxCompetitors}
            maxAliases={limits.maxAliases}
            discovered={latest?.otherBrands ?? []}
            isPaid={isPaid}
          />
        </Rise>
      </div>
    </>
  );
}
