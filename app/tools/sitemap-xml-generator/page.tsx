import type { Metadata } from "next";
import { ComingSoon } from "@/components/tools/shared/ComingSoon";
import { WebsiteIcon } from "@/components/tools/shared/icons/SchemaIcons";

export const metadata: Metadata = {
  title: "Sitemap.xml Generator",
  description: "Generate a clean, crawler-ready sitemap.xml for your site.",
};

export default function SitemapXmlComingSoonPage() {
  return (
    <ComingSoon
      toolName="Sitemap.xml Generator"
      tagline="For search engine crawlers"
      description="Generate a properly prioritized, crawl-ready sitemap.xml — no manual XML editing required."
      icon={WebsiteIcon}
    />
  );
}
