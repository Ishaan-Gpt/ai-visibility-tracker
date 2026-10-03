# OMNI SEO — Brutal Review (2026-10-04)

Basis: read of repo structure, routes, cron, provider code, funnel code. Competitor facts are from memory (not live-checked) — verify pricing before quoting.

## 1. Current architecture (as built)

```
Next.js 16 App Router (Vercel)
├─ /                      Marketing home (client component, 602 lines; duplicated verbatim in src/routes/index.tsx — dead copy)
├─ /tools                 Hub (lib/hub/tools.ts: 5 entries, 4 live)
│   ├─ /tools/<tool>              Long scroll-story landing page (9 sections each, ~700 lines of marketing per tool)
│   └─ /tools/<tool>/build        server redirect -> login-gated Studio dashboard  <-- THE FUNNEL KILLER
├─ /tools/ai-visibility-tracker   Auth (Firebase), onboarding, dashboard (brand + 3/10 prompts + 1 competitor)
├─ /api/cron/check-prompts        Daily Vercel cron -> loops ALL brands sequentially -> Gemini flash-lite (+ google search grounding)
├─ lib/tools/*                    Pure client-side logic: schema, sitemap xml/html, keyword density (small, ~1.2k LOC total)
├─ lib/providers                  Gemini only; substring match for "mentioned"
└─ Firebase Auth + Firestore (users, brands, prompts, runs, rollups); billing = stub
```

Facts that matter:
- Tool logic is ~1.2k LOC; tool *marketing* is ~10x that. Effort is inverted.
- 4 tools, all commodity. "OpenGeo" (the only differentiated product, and the only one that can charge) is `coming-soon` on the hub while its backend already exists under a different URL (`/tools/ai-visibility-tracker`).
- Brand identity is fractured: repo = ai-visibility-tracker, commits = "OpenSeo", hub = OpenGeo, site = OMNI SEO.

## 2. Brutal rating (out of 10)

| Area | Score | Why |
|---|---|---|
| Visual design / polish | 8 | Genuinely good. Motion, typography, scroll storytelling. Wasted on the wrong things. |
| Strategy / positioning | 3 | "Unite everything in one studio" is the pitch of every dead SEO suite. You have 4 free utilities, not a suite. |
| Funnel for tool-led SEO traffic | **2** | Landing pages say "No login" (keyword-density page literally says "No fake targets. No login.") but `/build` redirects to login. Bounce + trust hit. Core growth idea is broken. |
| Technical SEO of *your own* site | 3 | No `sitemap.ts`, no `robots.ts`, no per-tool OG images/JSON-LD, no internal-link strategy, SEO tools whose own site has no sitemap. Landing pages are scroll-jacked story pages (Lenis + GSAP/framer) = heavy JS, poor INP/LCP, thin extractable text. Google wants the tool above the fold, not after 8 sections. |
| Monetization | 1 | No payments, no pricing page, no upgrade path, no email capture. Plan limits exist in code; nothing charges. |
| Moat / defensibility | 2 | Sitemap/schema/keyword-density tools exist free from hundreds of sites. Nothing is proprietary. |
| Backend / product depth | 4 | Gemini-only, single model, substring matching ("mentioned" = name substring or domain root >2 chars → false positives), no sentiment/position/citation-share, no prompt discovery. Cron is a sequential loop that will hit the 300s cap at ~tens of brands. |
| Credibility / trust | 3 | Homepage leftovers: `DeFiArchitectureSection`, "Trusted by" with Intel/Oracle logos, testimonials — template residue or fabricated social proof. This will get screenshotted and mocked; remove or replace with real. |
| Code hygiene | 5 | Duplicate `src/routes/index.tsx`, README says Next 15 (it's 16), 5 fonts loaded globally, big uncommitted diff (19 files), commit message "1:37". |
| **Overall as a business** | **3 / 10** | Beautiful brochure, no engine. |

## 3. Brutal competitor analysis

Honest note: I don't know which project you mean by "OpenSEO". I assume the open-source, self-hostable SEO toolkit positioning (DataForSEO-style backend, keyword/audit tools). Adjust if wrong.

**Free-tool traffic incumbents (your 4 tools directly compete):**
- Schema: Merkle/TechnicalSEO schema generator, Rank Math & Yoast (built into WP), Google's own Structured Data Markup Helper. Free, entrenched, high DR.
- Sitemap: XML-Sitemaps.com (decades, DR ~80), Screaming Frog (free 500 URLs), every CMS auto-generates one. Honestly, sitemap generators are a dying keyword: most users have a plugin.
- Keyword density: SEOBook, Small SEO Tools, Yoast/RankMath on-page. Density is a discredited metric; you even say so on your own page.
You will not outrank DR 70-90 domains with a brand-new domain and 4 fancy scroll pages. Realistic timeline to meaningful organic traffic: 6-12 months with zero links, and the traffic you get is low-intent (students, one-time users) who never pay.

**AI-visibility (GEO) — where the money is, and it's crowded fast:**
- Profound (well funded, enterprise, ~$500+/mo), Peec AI, Otterly.AI (~€29-189/mo), AthenaHQ, Scrunch, Rankscale, Goodie, plus Semrush AI Toolkit and Ahrefs Brand Radar (incumbents bolting it on with giant distribution).
- They query ChatGPT, Perplexity, Gemini, Claude, AI Overviews, Copilot via real UI/API scraping. You query **Gemini flash-lite only**. A GEO tracker that doesn't cover ChatGPT is a non-product — ChatGPT is the market.
- Their edge: multi-model, prompt volume data, citation/source analysis, sentiment, share-of-voice, agency white-label, integrations. Yours: a pretty landing page.

**Open-source / DIY (what "OpenSEO" implies):** the pitch there is "own your data, no $199/mo". That audience wants self-hosting and API keys — they will not pay a SaaS, and they won't tolerate login-gated utilities. If you are "OpenSEO-like" but closed, login-walled, and Firebase-locked, you've picked the worst of both.

**Where you could win (the only credible angles):**
1. **India/emerging-market GEO tracking at ₹/low-$ price** — Razorpay is already in your plan. Otterly-class tools at $29+ are expensive for Indian SMBs/agencies. Price at ₹999-2,999/mo and win on price + local-language/local-brand prompts.
2. **Agency-first**: Eegnite (your email domain suggests you run an SEO agency) is your unfair distribution. Use your own agency clients as paying beta users *before* building more landing pages.
3. **Free tool as lead-gen for the paid tracker**: e.g. "Is my brand cited by ChatGPT? (free 1 check, no login, email for report)". That's the only free tool worth building — it's on-topic, novel (people search for it now), and converts directly.

## 4. Verdict: rebuild or not?

**Don't rebuild the codebase. Rebuild the strategy and the funnel. Delete ~40% of the front end.**

Stop:
- Building more scroll-story pages and more commodity tools (robots.txt, meta tag, etc. are the same trap).
- The "studio/suite" framing.
- Fake/template social proof.

Do, in order:
1. **Fix the funnel (1-2 days).** Tool UI renders on the tool page itself, no login, state in localStorage (you already have `*WorkspaceStorage`). Login only for save/export history/paid. Collapse each landing page to: H1 → working tool → short explainer (FAQ + JSON-LD). Drop Lenis/scroll-jack on tool pages.
2. **Fix your own SEO (1 day).** `app/sitemap.ts`, `app/robots.ts`, per-page metadata + OG, FAQ schema, internal links hub↔tools, canonical domain, delete `src/routes/index.tsx`.
3. **Make OpenGeo the product (1-2 weeks).** Add ChatGPT (OpenAI Responses API with web search) + Perplexity (Sonar) providers — the provider interface already supports it. Replace substring matching with: exact-boundary match, citation-domain match, position/rank in answer, sentiment (one cheap LLM pass). Move cron to a queue (one job per brand-prompt) instead of one sequential loop.
4. **Charge (2-3 days).** Razorpay (India) + Stripe/Lemon Squeezy (global) subscription, 3 tiers, pricing page, email capture on free check. Until money flows, nothing else matters.
5. **Distribution.** Put 5-10 real Eegnite clients on it free for 30 days in exchange for a testimonial + case study ("brand X went from 0 to cited in ChatGPT"). Publish the data. Original GEO data/benchmarks earn links; generator pages don't.
6. Only then consider more free tools — and only ones that feed the tracker (llms.txt generator, AI-crawler robots.txt checker, "AI visibility grader").

## 5. Money reality check

- Free-tool-only: realistically ₹0-low. Ad revenue on tool traffic is pennies; conversion of tool users to paid SEO SaaS is ~0.5-2%.
- To make "a lot": ~100 paying customers × $29 ≈ $2.9k MRR; 100 × $99 agency ≈ $9.9k MRR. 100 customers needs a distribution channel, which today you lack and your agency can supply.
- Fastest path to first revenue: sell GEO audit reports as a service from the tracker's data (agency model), productize later.

## 6. Cleanup checklist
- [ ] Remove `src/routes/index.tsx` (identical dupe of `app/page.tsx`)
- [ ] Remove/replace `DeFiArchitectureSection`, `TrustedBy` fake logos, `Testimonials` placeholders
- [ ] Reconcile naming (OMNI SEO vs OpenGeo vs OpenSeo vs ai-visibility-tracker) and fix README (Next 16)
- [ ] Commit the 19 pending files with real messages
- [ ] Reduce global fonts 5 → 2
- [ ] Mark OpenGeo "live" or gate behind waitlist with email capture
