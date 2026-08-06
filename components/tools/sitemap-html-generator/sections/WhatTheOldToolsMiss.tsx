import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { LayersIcon, CheckRingIcon, GaugeIcon } from "@/components/tools/shared/icons/SchemaIcons";

const GAPS = [
  {
    icon: LayersIcon,
    old: "One flat, unstyled list — every URL, no structure.",
    new: "Group URLs into labeled sections that read like real navigation.",
  },
  {
    icon: CheckRingIcon,
    old: "Standalone tool — start from scratch every time.",
    new: "Already have a sitemap.xml? Import it directly and just add labels.",
  },
  {
    icon: GaugeIcon,
    old: "Code output only — you find out how it looks after publishing.",
    new: "A live rendered preview of the actual page, before you copy anything.",
  },
];

export function WhatTheOldToolsMiss() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
          Every free tool outputs the same list
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="We built a page instead." />
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
