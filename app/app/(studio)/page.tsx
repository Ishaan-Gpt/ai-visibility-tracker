import type { Metadata } from "next";
import { OverviewView } from "@/components/studio/Views";
import { getAccount } from "@/lib/app-context";
import { listReports, usageToday } from "@/lib/account-data";
import { HISTORY_LIMITS } from "@/lib/history";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { user, tier, brand } = await getAccount();
  const [reports, usage] = await Promise.all([listReports(user.uid).catch(() => []), usageToday(user.uid, tier).catch(() => [])]);
  return (
    <OverviewView
      name={user.email.split("@")[0] || "there"}
      usage={usage}
      reports={reports}
      reportLimit={HISTORY_LIMITS[tier]}
      brand={brand ? { name: brand.name, domain: brand.domain } : null}
    />
  );
}
