import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getPrompts, getRecentRuns, getRollups, getUser, planLimits } from "@/lib/data";
import { StudioShell } from "@/components/studio/StudioShell";
import ScoreCard from "@/components/dashboard/ScoreCard";
import TrendChart from "@/components/dashboard/TrendChart";
import PromptList from "@/components/dashboard/PromptList";
import CompetitorCompare from "@/components/dashboard/CompetitorCompare";
import { Card } from "@/components/ds/primitives";
import { UpgradeCard } from "@/components/studio/UpgradeCard";
import { billingConfigured } from "@/lib/billing/razorpay";

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="text-[14px] text-ds-ink-2">{label}</p>
      <p className="mt-2 text-[28px] font-normal leading-8 tracking-[-0.02em] text-ds-ink">{value}</p>
      {hint && <p className="mt-2 text-[14px] text-ds-ink-2">{hint}</p>}
    </Card>
  );
}

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
  const planLabel = userDoc?.plan === "paid" ? "Pro plan" : "Free plan";
  const refresh = limits.refreshDays === 1 ? "daily" : `every ${limits.refreshDays} days`;

  const overviewContent = (
    <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ScoreCard score={latestRollup?.score ?? null} checkedPrompts={latestRollup?.totalPrompts ?? 0} />
      <MiniStat label="Tracked prompts" value={`${prompts.length} / ${limits.maxPrompts}`} hint="On your current plan" />
      <MiniStat
        label="Competitors"
        value={`${brand.competitors.length} / ${limits.maxCompetitors}`}
        hint={brand.competitors.map((c) => c.name).join(", ") || "None added yet"}
      />
      <MiniStat
        label="Last check"
        value={latestRollup?.date ?? "—"}
        hint={`Refreshes ${refresh} on ${planLabel}`}
      />
    </div>
    <UpgradeCard isPaid={userDoc?.plan === "paid"} billingConfigured={billingConfigured()} />
    </div>
  );

  const trackerContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ScoreCard score={latestRollup?.score ?? null} checkedPrompts={latestRollup?.totalPrompts ?? 0} />
        <Card className="lg:col-span-2">
          <p className="mb-2 text-[14px] text-ds-ink-2">Visibility trend</p>
          <TrendChart rollups={rollups} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PromptList prompts={prompts} runs={runs} maxPrompts={limits.maxPrompts} />
        <CompetitorCompare brand={brand} latestRollup={latestRollup} />
      </div>
    </div>
  );

  return (
    <StudioShell
      userEmail={user.email ?? ""}
      brandName={brand.name}
      brandDomain={brand.domain}
      planLabel={planLabel}
      initialTab={tool}
      overviewContent={overviewContent}
      trackerContent={trackerContent}
    />
  );
}
