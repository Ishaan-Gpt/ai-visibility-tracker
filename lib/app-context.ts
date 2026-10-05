import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getUser, planLimits } from "@/lib/data";
import { billingConfigured } from "@/lib/billing/razorpay";

/**
 * Signed-in account for the /app area. Redirects to /login when signed out. A brand (project) is optional:
 * only the AI Visibility tracker needs one.
 */
export const getAccount = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app");
  const [userDoc, brand] = await Promise.all([getUser(user.uid), getBrandForUser(user.uid)]);
  const isPaid = userDoc?.plan === "paid";
  return {
    user: { uid: user.uid, email: user.email ?? "" },
    brand,
    isPaid,
    tier: isPaid ? ("pro" as const) : ("free" as const),
    planLabel: isPaid ? "Pro" : "Free",
    limits: planLimits(userDoc?.plan),
    billingConfigured: billingConfigured(),
    billingStatus: userDoc?.billingStatus ?? null,
  };
});

/** For pages that need a brand: sends the user to onboarding first. */
export const getAppContext = cache(async () => {
  const account = await getAccount();
  if (!account.brand) redirect("/app/onboarding");
  return { ...account, brand: account.brand };
});
