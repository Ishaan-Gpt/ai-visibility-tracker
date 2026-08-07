import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getPrompts, getRecentRuns, getRollups, getUser, planLimits } from "@/lib/data";
import { StudioShell } from "@/components/studio/StudioShell";
import ScoreCard from "@/components/dashboard/ScoreCard";
import TrendChart from "@/components/dashboard/TrendChart";
import PromptList from "@/components/dashboard/PromptList";
import CompetitorCompare from "@/components/dashboard/CompetitorCompare";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/tools/ai-visibility-tracker/login");

  const brand = await getBrandForUser(user.uid);
  if (!brand) redirect("/tools/ai-visibility-tracker/onboarding");

  const [userDoc, prompts, runs, rollups] = await Promise.all([
    getUser(user.uid),
    getPrompts(brand.id),
    getRecentRuns(brand.id),
    getRollups(brand.id),
  ]);

  const limits = planLimits(userDoc?.plan);
  const latestRollup = rollups.length > 0 ? rollups[rollups.length - 1] : null;

  return (
    <StudioShell
      userEmail={user.email ?? ""}
      brandName={brand.name}
      brandDomain={brand.domain}
      initialTab={tool}
      dashboardContent={
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ScoreCard score={latestRollup?.score ?? null} checkedPrompts={latestRollup?.totalPrompts ?? 0} />
            <div className="rounded-xl border border-border bg-white p-6 sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-muted">Trend</p>
              <TrendChart rollups={rollups} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PromptList prompts={prompts} runs={runs} maxPrompts={limits.maxPrompts} />
            <CompetitorCompare brand={brand} latestRollup={latestRollup} />
          </div>
        </div>
      }
    />
  );
}
