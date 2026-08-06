import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";
import { RULES_SOURCE_VERSION } from "@/lib/tools/validation/googleRichResultRules";

const CHECKS = [
  "Every URL checked for absolute http(s) format, per the sitemaps.org protocol",
  "Automatic splitting past 50,000 URLs or 50MB per file — Google's documented limits",
  "Duplicate detection and protocol/host consistency, before you submit",
  "lastmod validated against W3C Datetime format",
];

export function TrustAndProof() {
  return (
    <SectionShell className="border-t border-foreground/10 py-28 md:py-36">
      <div className="grid gap-16 md:grid-cols-2">
        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-foreground/40 md:whitespace-nowrap">
            Built on the spec, not a guess
          </p>
          <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            <RevealText text="Validated against the actual protocol." />
          </h2>
          <p className="mt-6 max-w-md font-body text-sm text-foreground/60">
            Checked against the sitemaps.org protocol and Google Search Central's sitemap guidelines —
            last audited {RULES_SOURCE_VERSION.googleDocsCheckedOn}.
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
