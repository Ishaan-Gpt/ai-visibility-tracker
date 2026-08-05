import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const CHECKS = [
  "Every tool validates its own output against real, cited requirements",
  "No tool ships until it beats the free incumbent in its category",
  "Shared design system — one codebase, five products, no drift",
  "Built to still be useful in two years, not obsolete after one prompt",
];

export function UnderTheHood() {
  return (
    <SectionShell height="full" className="items-center border-t border-foreground/10">
      <div className="grid gap-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
            Under the hood
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="Held to the same bar, every time." />
          </h2>
          <p className="mt-6 max-w-md font-body text-sm text-foreground/60">
            Schema Markup Generator is the first tool live in the suite — the standard it sets is the standard the
            next four have to clear before they ship.
          </p>
        </div>

        <ul className="space-y-4">
          {CHECKS.map((check) => (
            <li key={check} className="flex items-start gap-3 rounded-xl border border-foreground/10 p-4">
              <CheckRingIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="font-body text-sm text-foreground/80">{check}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
