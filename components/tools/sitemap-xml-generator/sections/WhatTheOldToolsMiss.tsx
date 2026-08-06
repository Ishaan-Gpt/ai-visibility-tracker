import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { LayersIcon, GaugeIcon, CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const GAPS = [
  {
    icon: GaugeIcon,
    old: "Capped at 500 pages on every free tier.",
    new: "No cap — there's no crawl cost, so there's nothing to limit.",
  },
  {
    icon: LayersIcon,
    old: "Requires crawling a live, public URL.",
    new: "Paste a URL list or build it by hand — works for staging and JS-heavy sites too.",
  },
  {
    icon: CheckRingIcon,
    old: "Silently lets you fill in priority and changefreq.",
    new: "Tells you upfront: Google ignores both for ranking — set them for other crawlers, or skip them.",
  },
];

export function WhatTheOldToolsMiss() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
          Every free tool hits the same wall
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="We built around it instead." />
        </h2>
      </div>

      <div className="space-y-6">
        {GAPS.map((gap, i) => (
          <div
            key={gap.old}
            className={`flex flex-col gap-6 rounded-2xl border border-foreground/10 p-8 md:flex-row md:items-center ${
              i % 2 === 1 ? "md:flex-row-reverse" : ""
            }`}
          >
            <IconTile size="sm" className="shrink-0">
              <gap.icon />
            </IconTile>
            <div className="grid gap-4 md:grid-cols-2 md:gap-10">
              <p className="font-body text-sm text-foreground/40 line-through decoration-foreground/20">{gap.old}</p>
              <p className="font-body text-base text-foreground">{gap.new}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
