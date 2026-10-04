import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/tools/ai-visibility-tracker/dashboard", "/tools/ai-visibility-tracker/onboarding"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
