import type { Metadata } from "next";
import { ComingSoon } from "@/components/tools/shared/ComingSoon";
import { GraphIcon } from "@/components/tools/shared/icons/SchemaIcons";

export const metadata: Metadata = {
  title: "OpenGeo — AI Visibility Tracker",
  description: "Track whether your brand shows up in ChatGPT, Gemini, and AI search answers.",
};

export default function OpenGeoComingSoonPage() {
  return (
    <ComingSoon
      toolName="OpenGeo"
      tagline="The AI visibility tracker"
      description="See whether Gemini, ChatGPT, and Perplexity actually mention your brand — and how you compare to a named competitor. Launching to the OpenSeo suite soon."
      icon={GraphIcon}
    />
  );
}
