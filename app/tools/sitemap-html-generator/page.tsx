import type { Metadata } from "next";
import { ComingSoon } from "@/components/tools/shared/ComingSoon";
import { BreadcrumbIcon } from "@/components/tools/shared/icons/SchemaIcons";

export const metadata: Metadata = {
  title: "Sitemap.html Generator",
  description: "Generate a human-friendly HTML sitemap page for your visitors.",
};

export default function SitemapHtmlComingSoonPage() {
  return (
    <ComingSoon
      toolName="Sitemap.html Generator"
      tagline="For your human visitors"
      description="A clean, navigable HTML sitemap page — the human-readable counterpart to your sitemap.xml."
      icon={BreadcrumbIcon}
    />
  );
}
