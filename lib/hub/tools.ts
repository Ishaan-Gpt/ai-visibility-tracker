export type HubTool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  status: "live" | "coming-soon";
};

export const HUB_TOOLS: HubTool[] = [
  {
    slug: "opengeo",
    name: "OpenGeo",
    tagline: "AI Visibility Tracker",
    description: "See whether Gemini, ChatGPT, and Perplexity actually mention your brand.",
    href: "/tools/opengeo",
    status: "coming-soon",
  },
  {
    slug: "schema-generator",
    name: "Schema Markup Generator",
    tagline: "Structured data",
    description: "Google-eligible JSON-LD with live completeness scoring — free, no login.",
    href: "/tools/schema-generator",
    status: "live",
  },
  {
    slug: "sitemap-xml-generator",
    name: "Sitemap.xml Generator",
    tagline: "Crawler discovery",
    description: "Clean, prioritized sitemap.xml files, ready to submit to Search Console.",
    href: "/tools/sitemap-xml-generator",
    status: "live",
  },
  {
    slug: "sitemap-html-generator",
    name: "Sitemap.html Generator",
    tagline: "Human navigation",
    description: "A readable HTML sitemap page for the visitors who never see your XML.",
    href: "/tools/sitemap-html-generator",
    status: "coming-soon",
  },
  {
    slug: "keyword-density-checker",
    name: "Keyword Density Checker",
    tagline: "Content balance",
    description: "Spot over-optimization and topical gaps before search engines do.",
    href: "/tools/keyword-density-checker",
    status: "coming-soon",
  },
];
