import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { GaugeIcon, ListIcon, CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const GAPS = [
  {
    icon: GaugeIcon,
    old: "A fake \"ideal density\" gauge with a made-up target range.",
    new: "Honest signals: stuffing risk, readability, and vocabulary diversity.",
  },
  {
    icon: ListIcon,
    old: "Single-word counts only.",
    new: "1, 2, and 3-word phrase tables — most real terms are multi-word.",
  },
  {
    icon: CheckRingIcon,
    old: "No readability check at all.",
    new: "A standard Flesch Reading Ease score, computed the same way published tools do.",
  },
];

export function WhatTheOldToolsMiss() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
          Every free tool repeats the same myth
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
