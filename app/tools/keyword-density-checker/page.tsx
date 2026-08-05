import type { Metadata } from "next";
import { ComingSoon } from "@/components/tools/shared/ComingSoon";
import { GaugeIcon } from "@/components/tools/shared/icons/SchemaIcons";

export const metadata: Metadata = {
  title: "Keyword Density Checker",
  description: "Analyze keyword density and content balance on any page.",
};

export default function KeywordDensityComingSoonPage() {
  return (
    <ComingSoon
      toolName="Keyword Density Checker"
      tagline="For content balance"
      description="Paste a URL or text and see keyword density, over-optimization risk, and topical coverage at a glance."
      icon={GaugeIcon}
    />
  );
}
