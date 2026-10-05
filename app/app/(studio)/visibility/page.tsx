import type { Metadata } from "next";
import Link from "next/link";
import ScoreCard from "@/components/dashboard/ScoreCard";
import TrendChart from "@/components/dashboard/TrendChart";
import PromptList from "@/components/dashboard/PromptList";
import CompetitorCompare from "@/components/dashboard/CompetitorCompare";
import { Glass, Kicker, Masthead } from "@/components/studio/Glass";
import { ArchWindow } from "@/components/studio/Pieces";
import { Rise } from "@/components/studio/Views";
import { IconArrow } from "@/components/icons/Icons";
import { getAccount } from "@/lib/app-context";
import { getPrompts, getRecentRuns, getRollups } from "@/lib/data";

export const metadata: Metadata = { title: "AI Visibility" };

export default async function VisibilityPage() {
  const { brand, limits } = await getAccount();

  if (!brand) {
    return (
      <>
        <Masthead crumb="AI Visibility" title="Is your brand in the" italic="answer?" lede="Add your brand, a few prompts customers might ask an AI and one competitor. We run them with Gemini and live web grounding on a schedule." />
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

  const [prompts, runs, rollups] = await Promise.all([getPrompts(brand.id), getRecentRuns(brand.id), getRollups(brand.id)]);
  const latest = rollups.length > 0 ? rollups[rollups.length - 1] : null;

  return (
    <>
      <Masthead crumb={brand.domain} title="AI" italic="Visibility" lede="Whether AI answers mention and cite your brand for the prompts you track. Engine: Gemini with Google Search grounding." />
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Rise i={1}>
            <ScoreCard score={latest?.score ?? null} checkedPrompts={latest?.totalPrompts ?? 0} />
          </Rise>
          <Rise i={2} className="lg:col-span-2">
            <Glass className="h-full p-6">
              <Kicker>Trend</Kicker>
              <h2 className="mb-3 mt-2 font-serif text-[28px] leading-none">
                Over <span className="italic">time</span>
              </h2>
              <TrendChart rollups={rollups} />
            </Glass>
          </Rise>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Rise i={3}>
            <PromptList prompts={prompts} runs={runs} maxPrompts={limits.maxPrompts} />
          </Rise>
          <Rise i={4}>
            <CompetitorCompare brand={brand} latestRollup={latest} />
          </Rise>
        </div>
      </div>
    </>
  );
}
