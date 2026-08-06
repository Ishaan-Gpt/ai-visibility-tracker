import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

const CHECKS = [
  "Flesch Reading Ease — a published, standard readability formula, not a proprietary black box",
  "Stuffing risk based on statistical repetition, not a made-up percentage target",
  "Google's own public statements on keyword density are cited, not ignored",
  "Every calculation runs in your browser — nothing is sent anywhere",
];

export function TrustAndProof() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="grid gap-16 md:grid-cols-2">
        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
            Built on the evidence, not a myth
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="We'd rather be right than reassuring." />
          </h2>
          <p className="mt-6 max-w-md font-body text-sm text-foreground/60">
            Most keyword density tools exist to give you a number to chase. This one exists to tell you
            whether your writing actually reads well — which is what search engines have shifted toward
            rewarding anyway.
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
