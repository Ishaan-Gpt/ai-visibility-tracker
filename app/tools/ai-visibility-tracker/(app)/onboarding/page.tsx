import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getUser, planLimits } from "@/lib/data";
import { createBrand } from "./actions";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/tools/ai-visibility-tracker/login");

  const existingBrand = await getBrandForUser(user.uid);
  if (existingBrand) redirect("/tools/ai-visibility-tracker/dashboard");

  const userDoc = await getUser(user.uid);
  const limits = planLimits(userDoc?.plan);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Set up your brand</h1>
      <p className="mb-8 text-sm text-muted">
        We&apos;ll ask Gemini (with Google Search grounding) whether your brand shows up for the
        prompts you care about, on a {limits.refreshDays === 1 ? "daily" : "weekly"} schedule on
        your plan.
      </p>

      <form action={createBrand} className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Your brand</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Brand name</label>
              <input
                name="name"
                required
                placeholder="Eegnite"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Domain</label>
              <input
                name="domain"
                required
                placeholder="eegnite.com"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Competitor (optional)</h2>
          <p className="mb-4 text-xs text-muted">
            Your plan allows tracking {limits.maxCompetitors} competitor{limits.maxCompetitors > 1 ? "s" : ""}.
          </p>
          <div className="flex flex-col gap-4">
            <input
              name="competitorName"
              placeholder="Competitor name"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
            />
            <input
              name="competitorDomain"
              placeholder="competitor.com"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Prompts to track</h2>
          <p className="mb-4 text-xs text-muted">
            Up to {limits.maxPrompts} on your plan. What would a customer actually type into
            ChatGPT/Gemini when looking for a business like yours?
          </p>
          <div className="flex flex-col gap-3">
            {Array.from({ length: limits.maxPrompts }).map((_, i) => (
              <input
                key={i}
                name="prompts"
                placeholder={`e.g. "best ${i === 0 ? "SEO agency" : "digital marketing agency"} in India"`}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Start tracking
        </button>
      </form>
    </div>
  );
}
