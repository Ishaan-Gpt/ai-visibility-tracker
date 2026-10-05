import {
  Bot,
  Code2,
  FileCode2,
  FileText,
  Gauge,
  Network,
  ScanSearch,
  Search,
  Sparkles,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "Monitor" | "Research" | "Optimize" | "Technical";

export interface AppTool {
  slug: string;
  href: string;
  name: string;
  description: string;
  icon: LucideIcon;
  group: NavGroup;
}

/** Single registry for the app: sidebar, overview launcher and page headers all read from here. */
export const APP_TOOLS: AppTool[] = [
  { slug: "visibility", href: "/app/visibility", name: "AI Visibility", description: "Track whether AI answers mention and cite your brand.", icon: Sparkles, group: "Monitor" },
  { slug: "keywords", href: "/app/keywords", name: "Keyword Research", description: "Expand a seed into real search ideas grouped by topic and intent.", icon: Search, group: "Research" },
  { slug: "density", href: "/app/density", name: "Keyword Density", description: "Spot over-optimisation and topical gaps in your copy.", icon: Gauge, group: "Research" },
  { slug: "audit", href: "/app/audit", name: "Page Audit", description: "Check 15+ on-page SEO signals on any live URL.", icon: ScanSearch, group: "Optimize" },
  { slug: "meta", href: "/app/meta", name: "SERP & Meta Preview", description: "Preview titles, snippets and social cards before you publish.", icon: TextCursorInput, group: "Optimize" },
  { slug: "schema", href: "/app/schema", name: "Schema Generator", description: "Google-eligible JSON-LD with live completeness scoring.", icon: Code2, group: "Optimize" },
  { slug: "crawlers", href: "/app/crawlers", name: "AI Crawler Check", description: "See which AI bots can reach your site.", icon: Bot, group: "Technical" },
  { slug: "ai-files", href: "/app/ai-files", name: "robots.txt & llms.txt", description: "Control AI crawlers and guide AI assistants.", icon: FileText, group: "Technical" },
  { slug: "sitemap-xml", href: "/app/sitemap-xml", name: "Sitemap.xml", description: "Spec-conformant sitemaps for crawlers.", icon: Network, group: "Technical" },
  { slug: "sitemap-html", href: "/app/sitemap-html", name: "Sitemap.html", description: "A readable sitemap page for visitors.", icon: FileCode2, group: "Technical" },
];

export const NAV_GROUPS: NavGroup[] = ["Monitor", "Research", "Optimize", "Technical"];

export function toolBySlug(slug: string): AppTool {
  const t = APP_TOOLS.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown tool ${slug}`);
  return t;
}
