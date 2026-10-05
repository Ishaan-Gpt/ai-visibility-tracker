import type { Metadata } from "next";
import { HistoryView } from "@/components/studio/Views";
import { getAccount } from "@/lib/app-context";
import { listReports } from "@/lib/account-data";
import { HISTORY_LIMITS } from "@/lib/history";

export const metadata: Metadata = { title: "Saved reports" };

export default async function HistoryPage() {
  const { user, tier } = await getAccount();
  const reports = await listReports(user.uid).catch(() => []);
  return <HistoryView reports={reports} limit={HISTORY_LIMITS[tier]} isPro={tier === "pro"} />;
}
