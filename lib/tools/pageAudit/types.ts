/*
 * Page Audit report shape. Client-safe (no Node imports): the workspace UI imports these types and the scoring helpers.
 *
 * Backward compatibility: reports saved to history before the v2 audit only have the fields that are NOT marked
 * optional here. Everything added in v2 is optional so old saved reports (and lib/samples.ts) keep type-checking and rendering.
 */

export type Severity = "error" | "warning" | "info" | "pass";

/** "Social & Sharing" keeps its v1 name so old saved reports group the same way. */
export type CheckCategory = "Indexability" | "Content" | "Technical" | "Performance" | "Structured data" | "Social & Sharing" | "Links";

export interface AuditCheck {
  id: string;
  category: CheckCategory;
  severity: Severity;
  title: string;
  detail: string;
  fix?: string;
  /** How much this check matters inside its category (0 = informational, not scored). v2+. */
  impact?: number;
  /** A few concrete offenders (URLs, tags, headings) so the fix is actionable. v2+. */
  items?: string[];
}

export interface AiCheck {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  fix?: string;
  weight: number;
  items?: string[];
}

export interface TopFix {
  title: string;
  fix: string;
  severity: Severity;
  lens: "seo" | "ai";
  /** Points the relevant score would gain if fixed, per our scoring model. v2+. */
  gain?: number;
}

export interface CategoryScore {
  id: CheckCategory;
  score: number;
  /** Share of the overall SEO score, in percent of the weights in play. */
  weight: number;
  issues: number;
  checks: number;
}

export type LinkState = "ok" | "redirect" | "broken" | "blocked" | "timeout" | "error";

export interface LinkResult {
  url: string;
  anchor: string;
  internal: boolean;
  nofollow: boolean;
  status: number | null;
  state: LinkState;
  /** Number of redirect hops before the final response. */
  hops: number;
  finalUrl?: string;
  note?: string;
}

export interface LinksReport {
  total: number;
  unique: number;
  internal: number;
  external: number;
  nofollow: { internal: number; external: number };
  sponsoredOrUgc: number;
  generic: { text: string; count: number }[];
  empty: number;
  checked: number;
  /** True when the time budget ran out before every sampled link was checked. */
  budgetHit: boolean;
  results: LinkResult[];
}

export interface SchemaChild {
  /** Property path from the parent item, e.g. "author" or "publisher.logo". */
  path: string;
  types: string[];
}

/** One top-level structured data item (a JSON-LD root or @graph node, a top-level microdata item, or RDFa typeof). */
export interface SchemaItem {
  types: string[];
  /** Parent family when the type is a subtype, e.g. BlogPosting → "Article". */
  family?: string;
  source: "json-ld" | "microdata" | "rdfa";
  name?: string;
  /** Set when this item was promoted from a WebPage's mainEntity. */
  nestedIn?: string;
  unknown: { type: string; suggestion: string | null }[];
  superseded: string[];
  /** Google rich result this item maps to, if any. */
  richResult?: string;
  missingRequired: string[];
  missingRecommended: string[];
  eligible?: boolean;
  notes?: string[];
  children: SchemaChild[];
}

export interface StructuredDataReport {
  jsonLdBlocks: number;
  invalidBlocks: number;
  parseErrors: string[];
  contextIssues: number;
  microdataItems: number;
  rdfaTypes: string[];
  items: SchemaItem[];
  /** Rich results whose required properties are all present. Eligibility is not a guarantee Google shows them. */
  eligible: string[];
}

export type ProbeVerdict = "ok" | "blocked" | "challenge" | "rate-limited" | "different" | "no-response" | "inconclusive";

export interface BotProbe {
  bot: string;
  operator: string;
  purpose: "search" | "user" | "training";
  robotsAllowed: boolean;
  status: number | null;
  verdict: ProbeVerdict;
  detail: string;
  words?: number;
  ms?: number;
}

export interface AiAccessReport {
  baseline: { status: number | null; words: number; challenged: boolean };
  probes: BotProbe[];
  note: string;
}

export interface HreflangEntry {
  lang: string;
  href: string;
  valid: boolean;
  problem?: string;
  /** null = not sampled; true/false = the alternate does/doesn't link back. */
  returnLink?: boolean | null;
}

export interface HreflangReport {
  entries: HreflangEntry[];
  selfReference: boolean;
  xDefault: boolean;
}

export interface SpeedMetric {
  id: "LCP" | "INP" | "CLS" | "FCP" | "TTFB" | "TBT" | "SI";
  label: string;
  value: number;
  display: string;
  rating: "good" | "ni" | "poor";
}

export interface SpeedOpportunity {
  id: string;
  title: string;
  display?: string;
  savingsMs?: number;
  savingsBytes?: number;
}

export interface SpeedReport {
  url: string;
  strategy: "mobile" | "desktop";
  fetchedAt: number;
  lighthouseVersion?: string;
  /** Real-user Chrome UX Report data for the last 28 days. null when Google has too little traffic data. */
  field: { scope: "url" | "origin"; overall?: "good" | "ni" | "poor"; metrics: SpeedMetric[] } | null;
  lab: {
    scores: { performance: number | null; accessibility: number | null; bestPractices: number | null; seo: number | null };
    metrics: SpeedMetric[];
    opportunities: SpeedOpportunity[];
    failedAudits: { category: "accessibility" | "best-practices" | "seo"; id: string; title: string }[];
  } | null;
  warnings?: string[];
}

export type AltState = "missing" | "empty-content" | "empty-decorative" | "filename" | "too-long" | "ok";

export interface ImageInfo {
  /** Resolved real image URL (lazy-load attributes, srcset and <picture> sources resolved; data: placeholders skipped). */
  src: string;
  /** null = no alt attribute at all. */
  alt: string | null;
  state: AltState;
  /** Why an empty alt was judged decorative or content. */
  reason?: string;
  linked: boolean;
  lazy: "native" | "js" | "none";
  width?: string;
  height?: string;
  hasDimensions: boolean;
}

export interface ImagesReport {
  total: number;
  missingAlt: number;
  emptyAltContent: number;
  emptyAltDecorative: number;
  filenameAlt: number;
  longAlt: number;
  noDimensions: number;
  /** Every <img> on the page (capped at 300), in document order. */
  items: ImageInfo[];
}

export interface SitemapCheck {
  /** Where we looked: robots.txt Sitemap: lines plus /sitemap.xml and /sitemap_index.xml. */
  declaredInRobots: string[];
  files: { url: string; status: number; kind: string; urls: number; error?: string }[];
  found: boolean;
  /** null = could not tell (no sitemap, or we stopped before reading every file). */
  listed: boolean | null;
  listedIn?: string;
  truncated: boolean;
  urlsRead: number;
}

export interface Resource {
  url: string;
  kind: string;
}

export interface PageAuditReport {
  url: string;
  finalUrl: string;
  status: number;
  redirects: string[];
  responseMs: number;
  htmlBytes: number;
  truncated: boolean;
  score: number;
  summary: { errors: number; warnings: number; passes: number };
  facts: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    h1: string[];
    lang: string | null;
    wordCount: number;
    images: { total: number; missingAlt: number };
    links: { internal: number; external: number };
    schemaTypes: string[];
    ogTags: Record<string, string>;
    /** v2+ */
    headings?: { level: number; text: string }[];
    titles?: string[];
    descriptions?: string[];
    canonicals?: string[];
    robotsDirectives?: { source: string; value: string }[];
    domElements?: number;
    serverHeaders?: Record<string, string>;
  };
  checks: AuditCheck[];
  /** Separate lens: can AI answer engines reach, read and quote this page? */
  ai: { score: number; checks: AiCheck[] };
  /** The highest-impact problems across both lenses, in order. */
  topFixes: TopFix[];
  checkedAt: number;

  // ---- v2 additions (all optional for old saved reports)
  version?: 2;
  categories?: CategoryScore[];
  links?: LinksReport;
  structuredData?: StructuredDataReport;
  aiAccess?: AiAccessReport;
  hreflang?: HreflangReport;
  images?: ImagesReport;
  sitemap?: SitemapCheck;
  /** Render-blocking scripts/styles in <head>, mixed content and similar resource lists. */
  resources?: { renderBlocking: Resource[]; mixedContent: Resource[] };
  /** Signed, short-lived token that unlocks the Core Web Vitals endpoint for this URL. */
  speedToken?: string;
  speedTokenExp?: number;
  /** Present when the client merged Core Web Vitals in before saving. */
  speed?: SpeedReport;
  durationMs?: number;
}
