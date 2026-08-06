import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { GaugeIcon, CheckRingIcon, SparkIcon } from "@/components/tools/shared/icons/SchemaIcons";

const PILLARS = [
  {
    icon: GaugeIcon,
    title: "Readability",
    body: "A Flesch Reading Ease score — a standard, published formula — tells you if sentences are too dense.",
  },
  {
    icon: CheckRingIcon,
    title: "Natural repetition",
    body: "Stuffing risk is flagged when a term repeats far beyond natural-language norms, not a fixed target.",
  },
  {
    icon: SparkIcon,
    title: "Topical coverage",
    body: "Vocabulary diversity and phrase variety signal real depth — the direction search has actually moved.",
  },
];

export function WhyItMattersNow() {
  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Why this matters
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Three signals that actually mean something." />
        </h2>
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col gap-4">
            <IconTile>
              <pillar.icon />
            </IconTile>
            <h3 className="font-display text-xl text-foreground">{pillar.title}</h3>
            <p className="font-body text-sm text-foreground/60">{pillar.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
