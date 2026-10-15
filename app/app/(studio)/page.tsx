import type { Metadata } from "next";
import { OverviewView } from "@/components/studio/Views";
import { getAccount } from "@/lib/app-context";
import { listReports, usageToday } from "@/lib/account-data";
import { featureStates, isLive, type FeatureKey } from "@/lib/features";
import { HISTORY_LIMITS } from "@/lib/history";
import type { QuotaTool } from "@/lib/limits";

export const metadata: Metadata = { title: "Overview" };

/** Metered tools that belong to a gated feature; their quota is hidden until that feature is live. */
const QUOTA_FEATURE: Partial<Record<QuotaTool, FeatureKey>> = {
  visibility: "visibility",
  "rank-check": "rank-tracker",
  "domain-keywords": "domain-keywords",
  backlinks: "backlinks",
};

export default async function OverviewPage() {
  const { user, tier, brand } = await getAccount();
  const [reports, usage] = await Promise.all([listReports(user.uid).catch(() => []), usageToday(user.uid, tier).catch(() => [])]);
  const upcoming = featureStates()
    .filter((f) => !f.live && f.key !== "billing")
    .map((f) => ({ ...f, reason: null }));
  return (
    <OverviewView
      name={user.email.split("@")[0] || "there"}
      usage={usage.filter((u) => !QUOTA_FEATURE[u.tool] || isLive(QUOTA_FEATURE[u.tool]!))}
      reports={reports}
      reportLimit={HISTORY_LIMITS[tier]}
      brand={brand ? { name: brand.name, domain: brand.domain } : null}
      upcoming={upcoming}
    />
  );
}
