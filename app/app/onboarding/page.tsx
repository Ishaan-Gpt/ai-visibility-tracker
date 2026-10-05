import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getUser, planLimits } from "@/lib/data";
import OnboardingWizard from "@/components/OnboardingWizard";
import { Logo } from "@/components/brand/Logo";
import { Backdrop } from "@/components/studio/Backdrop";
import { ArchWindow } from "@/components/studio/Pieces";

export const metadata: Metadata = { title: "Set up AI Visibility" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ domain?: string }> }) {
  const { domain } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app/onboarding");

  const existingBrand = await getBrandForUser(user.uid);
  if (existingBrand) redirect("/app/visibility");

  const userDoc = await getUser(user.uid);
  const limits = planLimits(userDoc?.plan);

  return (
    <div className="relative flex min-h-screen flex-col font-sans text-ds-ink">
      <Backdrop />
      <header className="relative z-10 flex h-16 items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="seowise home">
          <Logo />
        </Link>
        <Link href="/app" className="glass rounded-[12px] px-4 py-2 text-[14px] text-ds-ink-2 hover:text-ds-ink">
          Skip for now
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="glass-strong grid w-full max-w-[960px] gap-3 rounded-[28px] p-3 md:grid-cols-[0.8fr_1fr]">
          <ArchWindow className="hidden min-h-[560px] md:block">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/85">AI Visibility</p>
            <p className="mt-2 font-serif text-[38px] leading-[1]">
              Be the <span className="italic">answer</span>
            </p>
            <p className="mt-2 max-w-[260px] text-[13.5px] leading-5 text-white/85">We ask Gemini, with live Google Search grounding, whether it names you, on a schedule.</p>
          </ArchWindow>
          <div className="p-5 sm:p-8">
            <OnboardingWizard maxPrompts={limits.maxPrompts} defaultDomain={domain?.slice(0, 253)} />
          </div>
        </div>
      </main>
    </div>
  );
}
