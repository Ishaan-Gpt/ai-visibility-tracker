import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    "",
    "/tools/schema-generator",
    "/tools/sitemap-xml-generator",
    "/tools/sitemap-html-generator",
    "/tools/keyword-density-checker",
    "/tools/opengeo",
    "/privacy",
    "/terms",
  ];
  return paths.map((p) => ({ url: `${base}${p}`, lastModified: new Date(), changeFrequency: p === "" ? "weekly" : "monthly", priority: p === "" ? 1 : 0.7 }));
}
