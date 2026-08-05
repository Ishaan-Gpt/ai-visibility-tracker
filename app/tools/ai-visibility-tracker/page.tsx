import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OpenGeo — AI Visibility Tracker",
  description: "Track whether your brand shows up in ChatGPT, Gemini, and AI search answers.",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-foreground">
            Open<span className="text-primary">Geo</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/tools/ai-visibility-tracker/login" className="text-sm font-medium text-foreground hover:text-primary">
              Log in
            </Link>
            <Link
              href="/tools/ai-visibility-tracker/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-surface">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center">
          <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            Does your brand show up when people ask <span className="text-primary">ChatGPT and Gemini</span>?
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Track whether your brand gets mentioned and cited in AI search answers — and see exactly
            where your competitors are beating you. Self-serve, no retainer, no account manager required.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tools/ai-visibility-tracker/signup"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Start tracking for free
            </Link>
            <Link
              href="/tools/ai-visibility-tracker/login"
              className="rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 px-4 pb-24 sm:grid-cols-3">
          {[
            {
              title: "AI visibility score",
              body: "See what percentage of your key prompts actually mention your brand.",
            },
            {
              title: "Competitor comparison",
              body: "Know exactly which prompts your competitor wins that you don't.",
            },
            {
              title: "Weekly checks, free",
              body: "Free tier tracks 3 prompts weekly. Upgrade for daily checks and more prompts.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-white p-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
