# CONTEXT.md — OMNI SEO (give this to an LLM)

**Goal:** Free, no-login SEO utility tools that rank on Google and funnel users into a paid AI-visibility (GEO) tracker. Owner: Ishaan (agency: Eegnite). Target: first paying customers fast, India price-point first.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · framer-motion/GSAP/Lenis · Firebase Auth + Firestore · Gemini (`@google/genai`) · Vercel (cron). Read `node_modules/next/dist/docs/` before writing Next code — APIs differ from training data (see AGENTS.md).

**Layout:**
- `app/page.tsx` — marketing home (`src/routes/index.tsx` is a dead duplicate; delete).
- `app/tools/<tool>/page.tsx` — marketing landing; `/build` currently redirects to login-gated dashboard (BUG vs "no login" promise).
- Tools: schema-generator, sitemap-xml-generator, sitemap-html-generator, keyword-density-checker. Logic in `lib/tools/*` (pure TS, client-side), UI in `components/tools/<tool>/{sections,workspace,onboarding}`. Workspace state via `*WorkspaceStorage.ts` (localStorage).
- `app/tools/ai-visibility-tracker/*` — the real product (OpenGeo): auth, onboarding, dashboard. `lib/providers/` (Gemini only), `app/api/cron/check-prompts/route.ts` (daily, sequential), Firestore collections: users, brands, prompts, runs, rollups. Plan limits in `lib/types.ts` PLAN_LIMITS. Billing is a stub.
- `lib/hub/tools.ts` — hub registry (OpenGeo marked coming-soon).

**Known problems (priority order):**
1. Tool pages gate the tool behind login → breaks SEO funnel. Render tool inline, login only for save/export/paid.
2. No payments. Add Razorpay (IN) + Stripe/LemonSqueezy (global), 3 tiers, pricing page, email capture.
3. GEO tracker is Gemini-only with naive substring matching. Add OpenAI (web search) + Perplexity providers; word-boundary + citation-domain matching, position, sentiment; per-prompt queue jobs instead of one sequential cron loop.
4. Site's own SEO missing: `app/sitemap.ts`, `app/robots.ts`, OG images, FAQ JSON-LD, internal links. Scroll-jack story pages hurt CWV; tool should be above the fold.
5. Fake/template social proof on home (`DeFiArchitectureSection`, `TrustedBy`, `Testimonials`) — replace with real or remove.
6. Naming inconsistent (OMNI SEO / OpenGeo / OpenSeo / ai-visibility-tracker); README says Next 15.

**Strategy rules:** Don't add more commodity tools/landing-page sections. Only build free tools that feed the tracker (llms.txt generator, AI-crawler robots checker, free "is my brand cited in ChatGPT?" check). Validate with real Eegnite clients before more features. Keep tool pages: H1 → working tool → short FAQ.

**Env:** see `.env.example` (Firebase client+admin, `GEMINI_API_KEY`, `CRON_SECRET`). Dev: `npm run dev` (port 3000, auto-falls to 3001 if busy).

Full analysis: `REVIEW.md`.
