# CONTEXT.md — seowise (give this to an LLM)

## Essence (agreed with owner, 2026-10-06)
**seowise**: free SEO tools anyone can use instantly (no signup), built for **agencies and freelancers**. The paid plan = **higher limits + saved history** across every tool. Revenue: Razorpay subscription (price TBD, show "Soon").

## Moat (all three agreed)
1. **Zero friction** — paste a URL, get a useful answer in seconds, no signup.
2. **Client-ready output** — every result can be shared/exported as a clean report an agency can send to a client.
3. **AI-search lens on every tool** — each tool also answers "is this ready for ChatGPT/Gemini/AI answers?"
Supporting principle: be honest about data (label real vs estimated; never fabricate numbers).

## Result screen pattern (every tool)
**Verdict first** (score/verdict + top fixes), **expandable pro detail underneath**. Share/export action on every result.

## Hero tools (landing + primary nav)
1. **Page Audit** (verdict + top fixes + AI-readiness)  2. **AI Crawler Check + robots.txt/llms.txt**  3. **Schema + Sitemaps + Meta Preview**.
Keyword Research, AI Visibility tracker and Keyword Density stay available but quieter.

## Client-ready output
**PDF export** of every result (clean, branded seowise for now). No public share links and no white-label branding in v1.

## Visual identity
- Keep the original **orange + cream** identity, pushed bolder and more premium (not the violet/dark OpenGEO experiment).
- Type: **Helvetica-style grotesk** (free match: Inter Tight / Geist; Helvetica Neue where available) + **elegant calligraphic italic on accent words** (Playfair-italic feel).
- Motion: subtle, eased, in/out transitions, micro-interactions everywhere (magnetic buttons, springy hovers, text reveals). Must respect prefers-reduced-motion.

## Landing page
Lean but extremely cool, highly interactive. Centrepiece: **scroll-driven story** (messy site -> audit -> fixes -> client report) plus playful micro-interactions. Keep the original landing sections/layout language, with **honest content** (no fake logos/testimonials/team).

## Information architecture
- `/` landing. `/tools/<tool>` = **working public tool** (tool first, short explainer below; no login wall).
- `/app` = account area: saved history/projects, plan + billing.
- Free anonymous limits on fetch-based tools (Page Audit, AI Crawler Check, Keyword Research): per-IP daily caps, higher signed-in, highest paid. Client-only tools are unlimited.

## Stack
Next.js 16 (App Router), React 19, Tailwind v4, framer-motion, Firebase Auth + Firestore, Gemini, Vercel. Read `node_modules/next/dist/docs/` before writing Next code. Firebase project `eegnite-seo`; Vercel project `ai-visibility-tracker` (domain tools.eegnite.com).

## Existing real code to reuse
`lib/net/safeFetch.ts` (SSRF-safe fetch), `lib/tools/{pageAudit,aiCrawlers,aiFiles,...}`, `lib/keywords/*`, tool workspaces under `components/tools/*/workspace`, Razorpay billing in `lib/billing` + `app/api/billing/*`, newsletter route, Firebase auth session (`lib/session.ts`).

## Open decisions
Final brand assets (logo), Pro price, ChatGPT/Perplexity provider keys, Razorpay + DataForSEO credentials, real testimonials/logos (until then, none shown).
