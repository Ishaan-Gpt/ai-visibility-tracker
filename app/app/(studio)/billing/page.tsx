import type { Metadata } from "next";
import { BillingView } from "@/components/studio/Billing";
import { getAccount } from "@/lib/app-context";
import { planRows } from "@/lib/plan-rows";

export const metadata: Metadata = { title: "Plan & billing" };

export default async function BillingPage() {
  const { isPaid, billingConfigured, billingStatus } = await getAccount();
  return <BillingView isPaid={isPaid} billingConfigured={billingConfigured} billingStatus={billingStatus} rows={planRows()} />;
}
