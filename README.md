# AI Visibility Tracker

Self-serve SaaS that tracks whether your brand gets mentioned/cited when people ask
Gemini (Google Search-grounded) the questions your customers actually ask — and how
you compare to one tracked competitor. Stage 1 build: Gemini only, single brand per
account, free (3 prompts/weekly) and paid (10 prompts/daily) tiers.

Stack: Next.js 15 (App Router, SSR) + Tailwind v4 + Firebase Auth/Firestore + Gemini API
(`@google/genai`, Google Search grounding) + Vercel Cron.

## 1. Create a Firebase project

1. https://console.firebase.google.com → Add project (a **new** project, separate from
   any other Eegnite Firebase project).
2. Build > Authentication → Get started → enable **Email/Password** and **Google** sign-in.
3. Build > Firestore Database → Create database (production mode, any region).
4. Project settings (gear icon) > General > "Your apps" → add a **Web app** → copy the
   `firebaseConfig` values into `.env.local` as the `NEXT_PUBLIC_FIREBASE_*` vars.
5. Project settings > Service accounts → Generate new private key → downloads a JSON
   file. Minify it to one line (e.g. `node -e "console.log(JSON.stringify(require('./path/to/key.json')))"`)
   and paste it as `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env.local`.
6. Deploy the security rules once you have the Firebase CLI set up:
   `npx firebase-tools deploy --only firestore:rules --project <your-project-id>`

## 2. Get a Gemini API key

1. https://aistudio.google.com/apikey → create a key.
2. Enable billing on the underlying Google Cloud project — grounding with Google
   Search is not available on the free quota.
3. Put it in `.env.local` as `GEMINI_API_KEY`.

## 3. Local setup

```bash
cp .env.example .env.local   # fill in the values from steps 1 & 2
npm install
npm run dev
```

Visit http://localhost:3000, sign up, and create your brand.

## 4. Test the check job locally

The scheduled check normally runs via Vercel Cron, but you can trigger it manually:

```bash
curl -X POST http://localhost:3000/api/cron/check-prompts \
  -H "Authorization: Bearer <your CRON_SECRET from .env.local>"
```

This runs every brand that's "due" (free = 7 days since last check, paid = 1 day).
A brand new brand with `lastCheckedAt` unset is always due, so this should run
immediately after onboarding.

## 5. Deploy

1. Push this repo, import it into Vercel.
2. Add all the `.env.local` variables as Vercel project environment variables
   (including `CRON_SECRET` — Vercel automatically sends it as
   `Authorization: Bearer $CRON_SECRET` when invoking the cron job defined in
   `vercel.json`, no extra config needed).
3. Deploy. The cron job runs daily at 03:00 UTC and internally skips brands that
   aren't due yet based on their plan's refresh interval.

## What's deliberately not built yet (see the staged plan)

- Only Gemini is wired up as a provider — OpenAI/Anthropic/Perplexity are Stage 2,
  once there's a key and the Gemini-only cost/accuracy model is validated. The
  provider interface (`lib/providers`) is built so adding one is additive.
- Billing is a stub — no real Razorpay checkout yet.
- One brand per account, no agency/white-label multi-tenant workspace (Stage 3).
- No content-gap suggestions or Slack/email alerts (Stage 2).
