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
    tagline: "Audit one page or crawl the whole site: a verdict, the top fixes with the exact URLs, and an AI-readiness score.",
    description:
      "Free SEO audit for a single page or a whole website: 70+ checks with the exact offending images, links and tags, Core Web Vitals, structured data validation, broken links, sitemap checks and an AI-readiness test for ChatGPT, Gemini and Perplexity. Export a client-ready PDF. No signup.",
    tier: "hero",
    kind: "fetch",
    aiLens: [
      "Checks robots.txt for AI search crawlers, then requests the page as OAI-SearchBot, PerplexityBot and Claude-SearchBot to catch firewalls that block them anyway.",
      "Looks for entity structured data, a clear summary, question-style headings and extractable lists and tables that AI answers can lift.",
      "Measures how much text is present in the raw HTML, since many AI crawlers do not run JavaScript.",
    ],
    explainer: [
      {
        title: "What it checks",
        body: "Indexability (status, noindex, canonical and its target, hreflang, sitemap listing), content (titles, descriptions, heading outline, word count, alt text on every image including lazy-loaded ones), links (broken, redirected, nofollow, empty anchors), structured data validated against schema.org and Google's rich result rules, performance (Core Web Vitals, render-blocking resources, image dimensions, caching, compression), social cards and security headers. Every issue lists the exact URLs or tags at fault.",
      },
      {
        title: "How the score works",
        body: "The SEO score starts at 100 and loses points for every error and warning. The AI-readiness score is separate and only counts signals that affect whether AI answer engines can reach, read and quote the page.",
      },
      {
        title: "Whole-site mode",
        body: "Switch to Whole site to crawl your sitemaps and internal links (robots.txt respected) and audit every page, up to 150 pages anonymously, 500 on a free account and 2,500 on Pro. Issues are grouped across the site with the affected URLs: duplicate titles, broken internal links and the pages linking to them, redirects, orphan and deep pages, thin content and images missing alt text. It does not report backlinks.",
      },
    ],
    faq: [
      { q: "Do I need an account?", a: "No. Anonymous visitors get a few audits and site crawls a day. A free account raises the limits and lets you save reports; Pro raises them again." },
      { q: "Where do the Core Web Vitals come from?", a: "Google PageSpeed Insights: real-user field data from the Chrome UX Report when the page has enough traffic, plus a Lighthouse lab run. Server response times elsewhere in the report are measured from our server." },
      { q: "Can I send the result to a client?", a: "Yes. Use Export PDF on the result. It produces a clean, branded report straight from your browser." },
      { q: "Why is my AI-readiness score different from my SEO score?", a: "They measure different things. A page can rank well in Google while blocking AI search crawlers or hiding its content behind JavaScript, which keeps it out of AI answers." },
    ],
  },
  {
    slug: "ai-crawler-check",
    name: "AI Crawler Check",
    headline: "Can {AI} actually reach your site?",
    tagline: "See which AI crawlers can actually reach your site: robots.txt rules plus a live request as each bot.",
    description:
      "Free AI crawler checker. Tests 30+ AI and search bots (OAI-SearchBot, ChatGPT-User, GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Meta, Amazon, Mistral and more) against your live robots.txt, then requests your site as each bot to catch firewall blocks such as Cloudflare's AI bot blocking. Path tester, robots.txt lint and llms.txt validation. No signup.",
    tier: "hero",
    kind: "fetch",
    aiLens: [
      "Live check: requests your site as each AI bot and flags when your firewall blocks crawlers your robots.txt allows.",
      "Separates AI search bots (which decide if you can be cited) from AI training bots (which only affect model training), and flags blocked Googlebot or Bingbot, which also removes you from AI Overviews and Copilot.",
      "Validates llms.txt against llmstxt.org and checks snippet directives that keep pages out of AI answers.",
    ],
    explainer: [
      {
        title: "Search bots vs training bots",
        body: "Blocking GPTBot or ClaudeBot opts you out of model training. Blocking OAI-SearchBot, Claude-SearchBot or PerplexityBot removes you from their AI search answers. Most sites want to allow the second group.",
      },
      {
        title: "Where the data comes from",
        body: "We fetch your live robots.txt, sitemap and llms.txt, evaluate every published AI user-agent with Google's matching rules, and request your homepage once per bot from our servers. Real crawlers use verified IP ranges, so firewall results can differ.",
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
    tagline: "Generate or update robots.txt for 30 AI crawlers and build a valid llms.txt, verified as you type.",
    description:
      "Free robots.txt and llms.txt generator. Allow AI search, block AI training, or tune each of 30 AI bots. Import your current robots.txt to merge the new rules without losing your own. Includes an llms.txt builder with llmstxt.org validation. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: [
      "Presets plus per-bot control across OpenAI, Anthropic, Google, Perplexity, Meta, Apple, Amazon, Mistral and more.",
      "Import from your site: merges AI rules into your existing robots.txt and checks the result with our parser.",
      "An llms.txt builder with live llmstxt.org format validation.",
    ],
    explainer: [
      { title: "robots.txt", body: "Choose a policy per crawler group, add disallowed paths and your sitemap. Copy or download the file and place it at the root of your domain." },
      { title: "llms.txt", body: "A plain Markdown file at /llms.txt that summarises your site and links to the pages you most want AI tools to read. Support varies by vendor, so treat it as a cheap addition, not a guarantee." },
    ],
    faq: [
      { q: "Is llms.txt an official standard?", a: "No. It is a community proposal (llmstxt.org). Some AI tools read it; many do not yet. It costs little to add." },
      { q: "Is anything sent to your servers?", a: "Both files are generated in your browser. Only the optional Import from my site button asks our server to fetch your live robots.txt and llms.txt." },
    ],
  },
  {
    slug: "schema-generator",
    name: "Schema Generator",
    headline: "Structured data, {without} the guesswork.",
    tagline: "Build, test and fix structured data: JSON-LD for 21 types, or validate any live URL or pasted code against Google's current rules.",
    description:
      "Free schema markup generator and validator. Generate JSON-LD for Organization, LocalBusiness, Article, Product, Event and more, or test any URL or pasted code (JSON-LD, microdata, RDFa) against schema.org and Google's current rich result rules, with errors pinned to the exact property. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: [
      "Structured data gives AI systems unambiguous facts (who, what, where, price) they can quote.",
      "The completeness score highlights recommended properties, not just required ones.",
    ],
    explainer: [
      { title: "Supported types", body: "Organization, LocalBusiness, Article, Product, FAQPage, Event, Person, Recipe and more, combined into one @graph when you need several." },
      { title: "Validation", body: "Checks required and recommended properties against Google's rich result rules as you type, so you ship markup that is eligible, not just valid JSON." },
      { title: "Test a URL or code", body: "Validates every item on a live page or in pasted code: JSON syntax errors with line and column, unknown or misspelt types and properties, value formats (dates, URLs, prices, currencies, GTINs), @id references, and which Google rich results each item is eligible for, including retired ones such as FAQ and HowTo." },
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
    tagline: "Crawl your site and get a spec-conformant sitemap.xml of every indexable page, or check the sitemap you already have.",
    description: "Free XML sitemap generator and checker. Crawls your site (robots.txt respected), keeps only indexable pages with real lastmod dates, and builds sitemap.xml, split with an index for large sites. Or validate an existing sitemap and find broken, redirected and noindexed URLs in it. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: ["Accurate lastmod dates help search and AI crawlers prioritise fresh content over stale pages."],
    explainer: [
      { title: "What you get", body: "A sitemap.xml that follows the sitemaps.org protocol, built from a real crawl: noindexed, redirected, broken and canonicalised pages are left out (and listed so you can see why), and lastmod comes from your existing sitemap, the page or its Last-Modified header." },
      { title: "Check an existing sitemap", body: "Validates the XML against the protocol and samples its URLs for errors, redirects, noindex and canonical mismatches, the same problems Search Console reports." },
      { title: "Where it goes", body: "Upload it to your site root and reference it in robots.txt with a Sitemap: line. Submit it in Google Search Console." },
    ],
    faq: [{ q: "Does Google use priority and changefreq?", a: "Google has said it largely ignores them; lastmod matters more when it is accurate. We include them because other engines may read them." }],
  },
  {
    slug: "sitemap-html-generator",
    name: "HTML Sitemap Generator",
    headline: "A sitemap {people} can read.",
    tagline: "Crawl your site and get a clean, sectioned HTML sitemap built from your real pages and titles.",
    description: "Free HTML sitemap generator. Crawl your site or add pages by hand to create a readable, sectioned sitemap page for visitors that also strengthens internal linking. No signup.",
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
    tagline: "See exactly how your page looks on Google and when shared, for any live URL or tags you write.",
    description: "Free SERP and meta tag preview. Load any live URL or write tags from scratch: desktop and mobile Google previews with pixel-width truncation, social cards for Facebook, LinkedIn, X, Slack, WhatsApp and Discord, tag issues and ready-to-paste head tags. No signup.",
    tier: "hero",
    kind: "client",
    aiLens: ["A specific, factual meta description is often what AI answers and link previews show as your summary."],
    explainer: [
      { title: "Pixel widths, not characters", body: "Google truncates titles by pixel width (about 600px on desktop). The preview measures your title in Arial 20px in your own browser. Widths are close estimates; Google can change its layout." },
      { title: "Social cards", body: "See how a shared link renders with your Open Graph image, title and description, then copy the full set of tags." },
    ],
    faq: [{ q: "Will Google use my exact title?", a: "Not always. Google rewrites titles and descriptions it considers unhelpful. A clear, accurate one is rewritten less often." }],
  },
  {
    slug: "keyword-research",
    name: "Keyword Research",
    headline: "Real keyword ideas, {honestly} labelled.",
    tagline: "Hundreds of real autocomplete ideas from Google, Bing, YouTube, Amazon and more, grouped into topics, questions and comparisons.",
    description: "Free keyword research tool. Expand a seed into 1,000+ real autocomplete ideas from Google, Bing, YouTube, DuckDuckGo, Amazon and eBay in 50 countries, grouped by topic, question and intent. Volume only when real data is connected.",
    tier: "more",
    kind: "fetch",
    aiLens: ["Question keywords are flagged: they map closely to the prompts people type into ChatGPT and Perplexity."],
    explainer: [
      { title: "Where ideas come from", body: "Real autocomplete from up to six sources, expanded across A to Z, numbers, question words, prepositions and comparisons, then a second pass on the strongest ideas." },
      { title: "Honest numbers", body: "The Signal score ranks ideas by how high and how often autocomplete suggests them. It is relative, not a search volume. Volume, difficulty, CPC and trend appear only when a data provider is connected." },
    ],
    faq: [
      { q: "Why no search volume?", a: "Volume needs a paid data provider. Until one is connected we show only what is real." },
      { q: "What is the Signal score?", a: "A 0 to 100 ranking within your research, based on autocomplete position, repetition and how many sources agree. Use it to prioritise ideas, not to forecast traffic." },
    ],
  },
  {
    slug: "keyword-density-checker",
    name: "Keyword Density",
    headline: "Read your copy like a {crawler}.",
    tagline: "Analyze pasted text or any live URL: phrases, keyword placement, readability and the terms a competitor covers that you don't.",
    description: "Free keyword density checker. Paste copy or load any URL to see 1-4 word phrases, target keyword placement, readability and over-optimisation, and compare against a competitor page for term gaps. No signup.",
    tier: "more",
    kind: "client",
    aiLens: ["Covering related terms and entities, not repeating one keyword, is what helps both search and AI understand a topic."],
    explainer: [{ title: "A diagnostic, not a target", body: "There is no ideal density. Use it to catch accidental stuffing and to see which related terms your copy never mentions." }],
    faq: [{ q: "Is my text uploaded?", a: "No. Pasted text is analysed entirely in your browser. Only Analyze URL asks our server to fetch the page for you." }],
  },
  {
    slug: "ai-visibility-tracker",
    name: "AI Visibility Tracker",
    headline: "Is your brand in the {answer}?",
    tagline: "See how often AI answers name your brand, where you rank, and which sources they cite.",
    description: "Track your brand in AI answers from Gemini, plus ChatGPT, Perplexity and Claude via their APIs when enabled. Mention rate, citations, average position, share of voice vs competitors, sentiment and the sources AI trusts. First results in about a minute.",
    tier: "more",
    kind: "account",
    aiLens: ["Runs your prompts on AI engines with live web search and records mentions, rank, citations and sentiment. Runs without web search are labelled."],
    explainer: [
      { title: "How it works", body: "Add your brand, a few prompts customers might ask and a competitor. We run them on a schedule and chart how often you are mentioned and cited." },
      { title: "Coverage today", body: "Gemini with Google Search grounding by default; OpenAI, Perplexity and Claude run when enabled. Every answer shows which engine and model produced it." },
    ],
    faq: [
      { q: "Why does this one need an account?", a: "Tracking runs on a schedule and stores history, so it needs somewhere to keep your brand and prompts." },
      { q: "How is a mention counted?", a: "Whole-word matches of your name, aliases or domain, ignoring accents, so 'Apple' never matches 'pineapple'. Citations count when your domain is among the answer's sources." },
    ],
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
