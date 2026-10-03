import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getUser, planLimits } from "@/lib/data";
import OnboardingWizard from "@/components/OnboardingWizard";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ domain?: string }> }) {
  const { domain } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/tools/ai-visibility-tracker/login");

  const existingBrand = await getBrandForUser(user.uid);
  if (existingBrand) redirect("/tools/ai-visibility-tracker/dashboard");

  const userDoc = await getUser(user.uid);
  const limits = planLimits(userDoc?.plan);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-[28px] border border-black/5 bg-white p-8 shadow-2xl md:p-10">
        <OnboardingWizard maxPrompts={limits.maxPrompts} defaultDomain={domain?.slice(0, 253)} />
      </div>
    </div>
  );
}
