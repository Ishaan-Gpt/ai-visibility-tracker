import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { IconTile } from "@/components/tools/shared/ui/IconTile";
import { CheckRingIcon, GaugeIcon, GraphIcon } from "@/components/tools/shared/icons/SchemaIcons";

const PRINCIPLES = [
  {
    icon: CheckRingIcon,
    title: "Free tools, real depth",
    body: "No login walls, no output limits — but not shallow either. Each tool is built to the same bar as paid software.",
  },
  {
    icon: GaugeIcon,
    title: "Scored, not just generated",
    body: "Where it matters, output is validated against real requirements — Google's, schema.org's, or our own rules — live as you work.",
  },
  {
    icon: GraphIcon,
    title: "One suite, one account",
    body: "Every tool shares the same design system and, eventually, the same account — start free, upgrade to OpenGeo when you need tracking.",
  },
];

export function HowWeBuild() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="mb-16 max-w-2xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
          How we build these
        </p>
        <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="Free doesn't mean unfinished." />
        </h2>
      </div>

      <div className="space-y-6">
        {PRINCIPLES.map((p, i) => (
          <div
            key={p.title}
            className={`flex flex-col gap-6 rounded-2xl border border-foreground/10 p-8 md:flex-row md:items-center ${
              i % 2 === 1 ? "md:flex-row-reverse" : ""
            }`}
          >
            <IconTile size="sm" className="shrink-0">
              <p.icon />
            </IconTile>
            <div>
              <h3 className="mb-1 font-display text-lg text-foreground">{p.title}</h3>
              <p className="font-body text-sm text-foreground/60">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
