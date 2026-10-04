import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ds-canvas px-4 py-16">
      <div className="w-full max-w-xl rounded-ds-lg border border-ds-line bg-ds-surface p-6 sm:p-8 md:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-ds-md bg-ds-accent text-lg font-medium text-white"
          >
            O
          </div>
          <h1
            className="text-[26px] font-normal tracking-[-0.02em] text-ds-ink"
          >
            Create your OMNI SEO account
          </h1>
          <p className="mt-1 text-xs text-ds-ink-2">
            Access all your SEO and AI-visibility tools in one studio.
          </p>
        </div>

        <AuthForm mode="signup" next={next} />

        <p className="mt-6 text-center text-xs text-ds-ink-2">
          Already have an account?{" "}
          <Link
            href={`/tools/ai-visibility-tracker/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-black underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
