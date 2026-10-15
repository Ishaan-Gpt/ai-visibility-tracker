import Link from "next/link";
import { Glass, Masthead } from "@/components/studio/Glass";
import { Rise } from "@/components/studio/Views";
import type { FeatureState } from "@/lib/features-shared";
import { SoonMark } from "@/components/studio/SoonMark";

/** Full-page stand-in for a feature that isn't live on this deployment yet. */
export function ComingSoonPage({ feature, title, italic }: { feature: FeatureState; title: string; italic?: string }) {
  return (
    <>
      <Masthead title={title} italic={italic} lede={feature.summary} />
      <Rise>
        <Glass className="flex flex-col items-start gap-4 p-6 sm:p-8">
          <SoonMark />
          <h2 className="font-serif text-[30px] leading-[1.05]">
            Opening <span className="italic">soon</span>
          </h2>
          <p className="max-w-[520px] text-[14.5px] leading-6 text-ds-ink-2">
            We only switch a feature on once it is finished and running on live data. This one isn&apos;t there yet, so nothing here will charge you or show estimates.
          </p>
          <Link href="/app" className="inline-flex h-10 items-center rounded-[12px] bg-ds-ink px-4 text-[14px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633]">
            Back to overview
          </Link>
        </Glass>
      </Rise>
    </>
  );
}
