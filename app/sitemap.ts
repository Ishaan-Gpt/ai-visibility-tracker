import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { TOOLS, toolHref } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...TOOLS.map((t) => ({
      url: `${base}${toolHref(t.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: t.tier === "hero" ? 0.9 : 0.7,
    })),
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
