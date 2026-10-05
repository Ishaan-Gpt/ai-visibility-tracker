export type ToolKind = "fetch" | "client" | "account";
export type ToolTier = "hero" | "more";

export interface ToolDef {
  slug: string;
  name: string;
  /** Headline used as the page H1, with one calligraphic accent word in {braces}. */
  headline: string;
  /** One-line value statement under the H1 and on cards. */
  tagline: string;
  /** Meta description for search. */
  description: string;
  tier: ToolTier;
  kind: ToolKind;
  /** How this tool answers "is this ready for ChatGPT / Gemini / AI answers?". */
  aiLens: string[];
  explainer: { title: string; body: string }[];
  faq: { q: string; a: string }[];
}

/** Single registry: landing grid, tools hub, tool pages, nav, sitemap and JSON-LD all read from here. */
export const TOOLS: ToolDef[] = [
  {
    slug: "page-audit",
    name: "Page Audit",
    headline: "Audit any page. Get the {fixes} first.",
    tagline: "A verdict, the top fixes and an AI-readiness score for any live URL, in seconds.",
    description:
      "Free on-page SEO audit: paste a URL and get a score, the top fixes, and an AI-readiness check for ChatGPT, Gemini and Perplexity. Export a client-ready PDF. No signup.",
    tier: "hero",
    kind: "fetch",
    aiLens: [
      "Checks whether AI search crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot) are allowed by robots.txt.",
      "Looks for structured data, a clear summary and question-style headings that AI answers can lift.",
      "Measures how much text is present in the raw HTML, since many AI crawlers do not run JavaScript.",
    ],
    explainer: [
      {
        title: "What it checks",
        body: "Indexability (status, noindex, canonical), content (title, meta description, headings, word count, image alt text, internal links), structured data, social cards and technical basics like HTTPS, viewport and response time.",
      },
      {
        title: "How the score works",
        body: "The SEO score starts at 100 and loses points for every error and warning. The AI-readiness score is separate and only counts signals that affect whether AI answer engines can reach, read and quote the page.",
      },
      {
        title: "What it does not do",
        body: "It audits one page, as served to a crawler, at one moment. Speed is measured from our server, not a lab test. It does not crawl your whole site or report backlinks.",
      },
    ],
    faq: [
      { q: "Do I need an account?", a: "No. Anonymous visitors get a few audits a day. A free account raises the limit and lets you save reports; Pro raises it again." },
      { q: "Can I send the result to a client?", a: "Yes. Use Export PDF on the result. It produces a clean, branded report straight from your browser." },
      { q: "Why is my AI-readiness score different from my SEO score?", a: "They measure different things. A page can rank well in Google while blocking AI search crawlers or hiding its content behind JavaScript, which keeps it out of AI answers." },
    ],
  },
  {
    slug: "ai-crawler-check",
    name: "AI Crawler Check",
    headline: "Can {AI} actually reach your site?",
    tagline: "See which AI crawlers your robots.txt allows, which it blocks, and whether you have an llms.txt.",
    description:
      "Free AI crawler checker: see if GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and more can access your site, based on your live robots.txt. No signup.",
    tier: "hero",
    kind: "fetch",
    aiLens: [
      "Separates AI search bots (which decide if you can be cited) from AI training bots (which only affect model training).",
      "Flags when Googlebot or Bingbot are blocked, which also removes you from AI Overviews and Copilot.",
      "Checks for an llms.txt file, an emerging convention for guiding AI assistants.",
    ],
    explainer: [
      {
        title: "Search bots vs training bots",
        body: "Blocking GPTBot or ClaudeBot opts you out of model training. Blocking OAI-SearchBot, Claude-SearchBot or PerplexityBot removes you from their AI search answers. Most sites want to allow the second group.",
      },
      {
        title: "Where the data comes from",
        body: "We fetch your live /robots.txt and /llms.txt and evaluate each published AI user-agent against your rules, using the same longest-match logic crawlers use.",
      },
      {
        title: "A voluntary standard",
        body: "robots.txt declares your intent. Reputable crawlers follow it, but it is not access control. This tool reports what you have declared.",
      },
    ],
    faq: [
      { q: "Should I block GPTBot?", a: "That is a business decision about training. It does not affect ChatGPT search citations, which use OAI-SearchBot." },
      { q: "How do I fix a blocked bot?", a: "Use the robots.txt & llms.txt generator to build a file that allows AI search while opting out of training, then replace your current robots.txt." },
    ],
  },
  {
    slug: "llms-txt-generator",
    name: "robots.txt & llms.txt",
    headline: "Write the files {AI} reads first.",
    tagline: "Generate a robots.txt that keeps you in AI search, and an llms.txt that points AI to your best pages.",
    description:
      "Free robots.txt and llms.txt generator. Allow AI search crawlers, opt out of AI training, and publish a curated llms.txt map of your site. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: [
      "Presets that allow AI search and assistant crawlers while opting out of training.",
      "An llms.txt builder following the llmstxt.org proposal, with sections and descriptions.",
    ],
    explainer: [
      { title: "robots.txt", body: "Choose a policy per crawler group, add disallowed paths and your sitemap. Copy or download the file and place it at the root of your domain." },
      { title: "llms.txt", body: "A plain Markdown file at /llms.txt that summarises your site and links to the pages you most want AI tools to read. Support varies by vendor, so treat it as a cheap addition, not a guarantee." },
    ],
    faq: [
      { q: "Is llms.txt an official standard?", a: "No. It is a community proposal (llmstxt.org). Some AI tools read it; many do not yet. It costs little to add." },
      { q: "Is anything sent to your servers?", a: "No. Both files are generated in your browser." },
    ],
  },
  {
    slug: "schema-generator",
    name: "Schema Generator",
    headline: "Structured data, {without} the guesswork.",
    tagline: "Build Google-eligible JSON-LD with live validation, a rich-result preview and a completeness score.",
    description:
      "Free schema markup generator for Organization, LocalBusiness, Article, Product, FAQ, Event and more. Live JSON-LD validation and rich result preview. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: [
      "Structured data gives AI systems unambiguous facts (who, what, where, price) they can quote.",
      "The completeness score highlights recommended properties, not just required ones.",
    ],
    explainer: [
      { title: "Supported types", body: "Organization, LocalBusiness, Article, Product, FAQPage, Event, Person, Recipe and more, combined into one @graph when you need several." },
      { title: "Validation", body: "Checks required and recommended properties against Google's rich result rules as you type, so you ship markup that is eligible, not just valid JSON." },
    ],
    faq: [
      { q: "Where do I paste the output?", a: "Inside a <script type=\"application/ld+json\"> tag in the page <head> or body. Most CMSs have a field or plugin for it." },
      { q: "Does schema guarantee rich results?", a: "No. It makes a page eligible. Google decides whether to show them." },
    ],
  },
  {
    slug: "sitemap-xml-generator",
    name: "XML Sitemap Generator",
    headline: "A sitemap crawlers {trust}.",
    tagline: "Spec-conformant sitemap.xml with lastmod, priority and validation, built in your browser.",
    description: "Free XML sitemap generator. Build, validate and download a spec-conformant sitemap.xml with lastmod, changefreq and priority. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: ["Accurate lastmod dates help search and AI crawlers prioritise fresh content over stale pages."],
    explainer: [
      { title: "What you get", body: "A sitemap.xml that follows the sitemaps.org protocol, with validation for duplicate, malformed and off-domain URLs." },
      { title: "Where it goes", body: "Upload it to your site root and reference it in robots.txt with a Sitemap: line. Submit it in Google Search Console." },
    ],
    faq: [{ q: "Does Google use priority and changefreq?", a: "Google has said it largely ignores them; lastmod matters more when it is accurate. We include them because other engines may read them." }],
  },
  {
    slug: "sitemap-html-generator",
    name: "HTML Sitemap Generator",
    headline: "A sitemap {people} can read.",
    tagline: "A clean, sectioned HTML sitemap page for visitors and internal linking.",
    description: "Free HTML sitemap generator. Create a readable, sectioned sitemap page for visitors that also strengthens internal linking. No signup.",
    tier: "more",
    kind: "client",
    aiLens: ["A plain HTML link map is easy for any crawler, including ones that do not render JavaScript, to follow."],
    explainer: [{ title: "Why bother", body: "An HTML sitemap gives visitors and crawlers a single page that links to every important section, which helps discovery on large or deep sites." }],
    faq: [{ q: "Do I still need sitemap.xml?", a: "Yes. They do different jobs: XML for crawlers, HTML for people." }],
  },
  {
    slug: "meta-tag-preview",
    name: "Meta & SERP Preview",
    headline: "See your snippet {before} Google does.",
    tagline: "Pixel-accurate title and description preview, social card preview and ready-to-paste tags.",
    description: "Free SERP and meta tag preview. Check title pixel width, meta description length and Open Graph cards, then copy ready-to-paste head tags. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: ["A specific, factual meta description is often what AI answers and link previews show as your summary."],
    explainer: [
      { title: "Pixel widths, not characters", body: "Google truncates titles by pixel width (about 600px on desktop). The preview measures your title in Arial 20px in your own browser." },
      { title: "Social cards", body: "See how a shared link renders with your Open Graph image, title and description, then copy the full set of tags." },
    ],
    faq: [{ q: "Will Google use my exact title?", a: "Not always. Google rewrites titles and descriptions it considers unhelpful. A clear, accurate one is rewritten less often." }],
  },
  {
    slug: "keyword-research",
    name: "Keyword Research",
    headline: "Real keyword ideas, {honestly} labelled.",
    tagline: "Hundreds of real Google autocomplete ideas, grouped into topics with estimated intent.",
    description: "Free keyword research tool. Expand a seed into hundreds of real Google autocomplete ideas grouped by topic and intent. Volume only when real data is connected.",
    tier: "more",
    kind: "fetch",
    aiLens: ["Question keywords are flagged: they map closely to the prompts people type into ChatGPT and Perplexity."],
    explainer: [
      { title: "Where ideas come from", body: "Real Google autocomplete, expanded across A to Z, question words and modifiers, then grouped into topic clusters." },
      { title: "Honest numbers", body: "Search volume, difficulty and CPC appear only when a data provider is connected. We never estimate or invent them." },
    ],
    faq: [{ q: "Why no search volume?", a: "Volume needs a paid data provider. Until one is connected we show only what is real." }],
  },
  {
    slug: "keyword-density-checker",
    name: "Keyword Density",
    headline: "Read your copy like a {crawler}.",
    tagline: "Spot over-optimisation, topical gaps and readability issues in any text.",
    description: "Free keyword density checker. Paste copy to see term frequency, n-grams, target keyword coverage and readability. Runs in your browser. No signup.",
    tier: "more",
    kind: "client",
    aiLens: ["Covering related terms and entities, not repeating one keyword, is what helps both search and AI understand a topic."],
    explainer: [{ title: "A diagnostic, not a target", body: "There is no ideal density. Use it to catch accidental stuffing and to see which related terms your copy never mentions." }],
    faq: [{ q: "Is my text uploaded?", a: "No. Analysis runs entirely in your browser." }],
  },
  {
    slug: "ai-visibility-tracker",
    name: "AI Visibility Tracker",
    headline: "Is your brand in the {answer}?",
    tagline: "Track whether AI answers mention and cite your brand for the prompts that matter.",
    description: "Track whether AI answer engines mention and cite your brand. Add prompts and a competitor; we check them on a schedule with Gemini and live web grounding.",
    tier: "more",
    kind: "account",
    aiLens: ["Runs your prompts through Gemini with Google Search grounding and records mentions, citations and competitor mentions over time."],
    explainer: [
      { title: "How it works", body: "Add your brand, a few prompts customers might ask and a competitor. We run them on a schedule and chart how often you are mentioned and cited." },
      { title: "Coverage today", body: "Gemini with live web grounding. ChatGPT and Perplexity are on the roadmap. Results always show which engine produced them." },
    ],
    faq: [{ q: "Why does this one need an account?", a: "Tracking runs on a schedule and stores history, so it needs somewhere to keep your brand and prompts." }],
  },
];

export const HERO_TOOLS = TOOLS.filter((t) => t.tier === "hero");
export const MORE_TOOLS = TOOLS.filter((t) => t.tier === "more");

export function toolBySlug(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolHref(slug: string) {
  return `/tools/${slug}`;
}

/** Splits "Audit any page. Get the {fixes} first." into plain and accent parts. */
export function splitHeadline(h: string): { text: string; accent: boolean }[] {
  return h.split(/(\{[^}]+\})/).filter(Boolean).map((part) => (part.startsWith("{") ? { text: part.slice(1, -1), accent: true } : { text: part, accent: false }));
}
