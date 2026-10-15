# seowise vs OpenSEO: feature parity

The OpenSEO side comes from reverse engineering its source: every-app/open-seo @ d7ea785, 2026-10-13. REA parsed all 1,157 modules (evidence `ev_f1b59a36…`), and each feature was traced from its route through its server feature and DataForSEO calls.

## Launch rule

A feature goes live only when two things hold: its code is finished, and the API behind it is configured on that deployment. Everything else shows as **coming soon** in the dock, on the overview and on the page itself. The gating lives in `lib/features.ts`.

| Feature | Goes live when |
|---|---|
| AI Visibility | `GEMINI_API_KEY` is set. OpenAI, Perplexity and Anthropic each turn on with their own key. |
| Rank Tracker and Domain keywords | `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` are set |
| Backlinks | DataForSEO is configured **and** `DATAFORSEO_BACKLINKS=on`. Backlinks is a separate DataForSEO subscription. |
| Pro plan | Razorpay keys are set. The flow has not yet been tested against a live Razorpay account. |
| Search Console & GA4, Client reports, Team seats, API & MCP, Local SEO | Not built. These are always coming soon. |

## Side by side

| Area | OpenSEO | seowise | Verdict |
|---|---|---|---|
| Keyword research | Labs related/suggestions/ideas with volume, KD, CPC, intent and trend; SERP card; saved keywords with tags | Autocomplete from 6 engines plus Gemini topic grouping plus DataForSEO volume/KD/CPC, capped per plan; saved lists; one click to track | Parity. OpenSEO goes deeper on SERP analysis. |
| Rank tracking | Up to 1,000 keywords per tracker; daily/weekly/monthly; desktop and mobile; SERP features; **no competitor tracking**; no alerts | Top 100, competitors per keyword, SERP features including AI Overview ownership, email alerts, a spend guard, CSV/XLSX export, **import from SE Ranking / Semrush / Ahrefs / AccuRanker / GSC** | **seowise ahead.** It has competitors, alerts and imports, none of which OpenSEO has. |
| Domain overview | Domain rank overview, ranked keywords, top pages, SERP competitors | Domain keywords: ranked keywords with traffic, positions and AI Overview references | Partial. We have no top pages or SERP competitors yet. |
| Backlinks | Summary, history, backlinks, referring domains, top pages; spam hidden | Summary, 12-month gained/lost trend, referring domains, backlinks, anchors, **lost domains**. Spam scores are kept on every row and toggled in the UI, so the same lookup also serves a disavow review. Excel export with all tabs. | Parity or better once enabled (anchors and lost domains). OpenSEO has top pages; we don't. |
| Site audit | Workflow crawler up to 10k pages, 31 issue types, Lighthouse via DataForSEO, JS rendering | Single page or whole site (2,500 on Pro), 70+ checks, PSI Core Web Vitals, an AI-readiness score, XLSX/CSV/PDF export | Parity on checks. OpenSEO crawls bigger and renders JavaScript. |
| AI visibility | DataForSEO LLM scraper for ChatGPT, Gemini, AIO, Claude, Perplexity; topics; citations; prompt explorer; brand lookup | Gemini, OpenAI, Perplexity and Claude through their own APIs with grounding; prompts; competitors; sources; trend | Parity on tracking. We lack prompt explorer and brand lookup, and AI Overviews as an engine. |
| AI crawler check, robots/llms.txt, schema, meta, density, sitemaps | none | live | **seowise only** |
| Search Console / GA4 | Full OAuth, striking-distance report, GA4 tools | none | Coming soon |
| Reports | Agent-written HTML, share tokens, no white-label, no schedule | Saved reports plus PDF export | Coming soon: white-label, share links, scheduled email |
| Teams | Org with owner/admin/member roles | Single user | Coming soon |
| MCP / API / chat agent | 70+ MCP tools, 12 skills, SAM agent | none | Coming soon |
| Local SEO | MCP-only: maps grid, GBP, reviews | none | Coming soon |
| Billing | Autumn credits; DataForSEO cost plus 28% | Razorpay subscription with daily quotas | Different model |

## Moving an agency off SE Ranking (or Semrush / Ahrefs)

1. Create a Rank Tracker project for each client domain, with its country, city, device and competitors.
2. In SE Ranking, export the keyword list (CSV or XLSX).
3. In Rank Tracker, go to **Add keywords → Import a file**. The importer:
   - finds the keyword column by its header name;
   - turns SE Ranking groups and Semrush/Ahrefs tags into tags;
   - keeps search volume;
   - merges rows that repeat per engine or per date;
   - reads semicolon CSV, UTF-16 Excel CSV and `.xlsx`;
   - imports in 500-keyword batches up to the plan limit.

Blockers before the agency tier is ready:

- **Plan size.** Pro tracks 200 keywords across 5 projects. SE Ranking's entry plan tracks 500, and agencies run thousands. We need an Agency tier, with limits and a price.
- **White-label client reports and scheduled email.** This is the agency feature SE Ranking customers expect.
- **Team and client seats.**
- **Search Console connection.**

## Worth adopting from OpenSEO

- Use the cheaper queued DataForSEO tasks with `stop_crawl_on_match` for scheduled checks. We already do this.
- Show a cost estimate with an approved maximum before any paid bulk run.
- Never retry after a transport error, because a timeout can hide a charge. Retry only failures DataForSEO itself reports.
- Make caches depth-aware: one depth-100 SERP snapshot can answer a depth-20 request.
