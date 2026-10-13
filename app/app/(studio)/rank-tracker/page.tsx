import type { Metadata } from "next";
import { Masthead } from "@/components/studio/Glass";
import { Rise } from "@/components/studio/Views";
import { RankTrackerApp } from "@/components/rank-tracker/RankTrackerApp";
import { getAccount } from "@/lib/app-context";
import { DOMAIN_ROWS } from "@/lib/limits";
import { dashboardData } from "@/lib/rank-tracker/view";

export const metadata: Metadata = { title: "Rank Tracker" };
// The location search used by project settings can take a few seconds on a cold instance.
export const maxDuration = 60;

export default async function RankTrackerPage({ searchParams }: { searchParams: Promise<{ project?: string; tab?: string }> }) {
  const { user, tier } = await getAccount();
  const { project, tab } = await searchParams;
  const data = await dashboardData(user.uid, tier, typeof project === "string" ? project : null);
  const cadence = data.plan.cadenceDays === 1 ? "daily" : "weekly";

  return (
    <>
      <Masthead
        title="Rank"
        italic="Tracker"
        lede={`Your Google positions in the top 100, ${cadence} on the ${tier === "pro" ? "Pro" : "Free"} plan, with competitors, SERP features and alerts. Domain keywords shows what any site ranks for.`}
      />
      <Rise>
        <RankTrackerApp initial={data} initialTab={tab === "domains" ? "domains" : "rankings"} domainRows={DOMAIN_ROWS[tier]} />
      </Rise>
    </>
  );
}
