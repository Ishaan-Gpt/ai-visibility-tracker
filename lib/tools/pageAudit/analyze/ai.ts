import { evaluatePath } from "@/lib/tools/aiCrawlers/robots";
import type { StructuredDataReport } from "../types";
import { addAi, clip, plural, type Ctx } from "./context";
import type { ContentFacts } from "./content";
import type { IndexFacts } from "./indexability";

const AI_SEARCH_AGENTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "PerplexityBot", "Googlebot", "Bingbot"];
const GENERIC = /^(WebSite|WebPage|BreadcrumbList|SiteNavigationElement|ListItem|ImageObject|SearchAction|EntryPoint|ReadAction|WPHeader|WPFooter|WPSideBar)$/;
const QUESTION = /\?$|^(how|what|why|when|where|which|who|can|does|do|is|are|should|will)\b/i;

interface Facts {
  content: ContentFacts;
  index: IndexFacts;
  sd: StructuredDataReport;
  headings: { level: number; text: string }[];
}

/**
 * AI-readiness lens: can AI answer engines reach, read and quote this page? Pure; the live user-agent probe is added
 * by the single-page enricher.
 */
export function aiLens(ctx: Ctx, f: Facts) {
  const { $, input, wordCount } = ctx;

  if (input.robots !== undefined) {
    const blocked = input.robots ? AI_SEARCH_AGENTS.filter((a) => !evaluatePath(input.robots!, a, ctx.pagePath)) : [];
    addAi(ctx, blocked.length
      ? { id: "ai-bots", severity: "error", weight: 30, title: `robots.txt blocks ${blocked.join(", ")}`, detail: "These crawlers may not fetch this URL, so their AI answers cannot cite it.", fix: "Allow AI search crawlers in robots.txt. The robots.txt & llms.txt generator has a safe preset.", items: blocked }
      : { id: "ai-bots", severity: "pass", weight: 30, title: "robots.txt lets AI search crawlers in", detail: input.robots ? `${AI_SEARCH_AGENTS.join(", ")} may fetch this URL.` : "No robots.txt, so every crawler is allowed by default." });
  }

  // Raw-HTML text: most AI crawlers don't execute JavaScript.
  const appShell = $("#root, #app, #__next, [data-reactroot], #___gatsby").filter((_, el) => $(el).text().trim().length < 40).length > 0;
  const shellNote = appShell ? " The page looks like a client-rendered app shell." : "";
  addAi(ctx, wordCount >= 300
    ? { id: "ai-text", severity: "pass", weight: 20, title: `${wordCount.toLocaleString("en-US")} words readable without JavaScript`, detail: "The content is in the HTML response, which is what most AI crawlers read." }
    : wordCount >= 80
      ? { id: "ai-text", severity: "warning", weight: 20, title: `Only ${wordCount} words in the raw HTML`, detail: `Many AI crawlers do not run JavaScript, so they see little to quote.${shellNote}`, fix: "Server-render the main content, or add a substantive text summary to the HTML." }
      : { id: "ai-text", severity: "error", weight: 20, title: `Almost no text in the raw HTML (${wordCount} words)`, detail: `If the content is rendered by JavaScript, most AI crawlers see an empty page.${shellNote}`, fix: "Server-render or pre-render the page so its content is present in the HTML response." });

  const entities = f.sd.items.filter((i) => !i.types.every((t) => GENERIC.test(t)));
  addAi(ctx, entities.length
    ? { id: "ai-schema", severity: "pass", weight: 15, title: `Entity markup: ${entities.map((i) => i.types[0]).join(", ")}`, detail: "Structured facts AI systems can extract without guessing.", items: entities.map((i) => `${i.types.join(" + ")}${i.family ? ` (${i.family})` : ""}`) }
    : { id: "ai-schema", severity: "warning", weight: 15, title: "No entity-level structured data", detail: f.sd.items.length ? "Only generic page or site markup was found." : "No structured data found.", fix: "Add Organization, Product, Article, FAQPage or LocalBusiness JSON-LD with the Schema Generator." });

  const desc = f.content.description;
  const lead = f.content.leadParagraph;
  addAi(ctx, desc && desc.length >= 50
    ? { id: "ai-summary", severity: "pass", weight: 10, title: "Has a concise summary", detail: `Meta description: "${clip(desc, 160)}"` }
    : lead
      ? { id: "ai-summary", severity: "info", weight: 10, title: "No meta description, but a clear opening paragraph", detail: `AI tools will likely lift: "${clip(lead, 160)}"`, fix: "Add a factual 70–160 character meta description stating what the page offers." }
      : { id: "ai-summary", severity: "warning", weight: 10, title: "No usable one-line summary", detail: "Neither a meta description nor a clear opening paragraph, so AI tools have to guess what the page is about.", fix: "Write a factual meta description and open the page with a one-paragraph answer." });

  const subheads = f.headings.filter((h) => h.level === 2 || h.level === 3).map((h) => h.text);
  const questions = subheads.filter((h) => QUESTION.test(h));
  const hasFaq = f.sd.items.some((i) => i.types.some((t) => /FAQPage|QAPage/.test(t)));
  addAi(ctx, questions.length >= 2 || hasFaq
    ? { id: "ai-questions", severity: "pass", weight: 10, title: hasFaq ? "FAQ or Q&A markup present" : `${questions.length} question-style headings`, detail: "Question-and-answer structure maps directly onto the prompts people ask AI.", items: questions.slice(0, 20) }
    : { id: "ai-questions", severity: "info", weight: 10, title: "Few question-style headings", detail: `${plural(subheads.length, "H2/H3 heading")}, ${questions.length} phrased as questions.`, fix: "Add a short FAQ that answers what customers actually ask, with FAQPage markup." });

  const extractable = $("main table, article table, main ol, main ul, article ol, article ul").length;
  if (wordCount >= 300) addAi(ctx, extractable
    ? { id: "ai-structure", severity: "pass", weight: 5, title: `${plural(extractable, "list or table", "lists and tables")} in the content`, detail: "Lists and tables are the easiest content for AI answers to quote accurately." }
    : { id: "ai-structure", severity: "info", weight: 5, title: "No lists or tables in the main content", detail: "Answer engines favour steps, comparisons and specs they can lift as-is.", fix: "Present steps, comparisons or key facts as a list or table." });

  const dated = $('meta[property="article:published_time"], meta[property="article:modified_time"], meta[itemprop="dateModified"], meta[itemprop="datePublished"], time[datetime]').length > 0 || /"date(Published|Modified)"/.test(input.html);
  const authored = $('meta[name="author"], [rel="author"], [itemprop="author"]').length > 0 || /"author"\s*:/.test(input.html);
  addAi(ctx, dated || authored
    ? { id: "ai-trust", severity: "pass", weight: 10, title: `${[dated && "Dates", authored && (dated ? "author" : "Author")].filter(Boolean).join(" and ")} declared`, detail: "Freshness and authorship signals help AI systems judge how current and credible a source is." }
    : { id: "ai-trust", severity: "info", weight: 10, title: "No date or author signals", detail: "Nothing tells a machine when this was written or by whom.", fix: "Show an updated date and author, and add datePublished, dateModified and author to the JSON-LD." });

  const snippetOff = f.index.nosnippet || f.index.maxSnippetZero;
  if (snippetOff || f.index.noai.length) addAi(ctx, { id: "ai-snippet", severity: snippetOff ? "error" : "warning", weight: 15, title: snippetOff ? "Snippets disabled (nosnippet / max-snippet:0)" : `AI opt-out directives: ${f.index.noai.join(", ")}`, detail: "nosnippet and max-snippet:0 also keep the page out of Google's AI Overviews and AI Mode. noai/noimageai are non-standard and honoured by few crawlers.", fix: "Remove nosnippet / max-snippet:0 unless you deliberately want to stay out of AI answers.", items: f.index.directives.map((d) => `${d.source}: ${d.value}`) });

  if (input.llmsTxt !== undefined) addAi(ctx, input.llmsTxt
    ? { id: "ai-llms", severity: "pass", weight: 5, title: "llms.txt found", detail: "/llms.txt gives AI assistants a curated map of the site." }
    : { id: "ai-llms", severity: "info", weight: 5, title: "No llms.txt", detail: "An emerging, optional convention. Adoption by AI vendors varies.", fix: "Publish a short /llms.txt with the llms.txt generator." });
}
