import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 py-16">
      <div className="w-full max-w-xl rounded-[28px] border border-black/5 bg-white p-8 shadow-2xl md:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD209] text-lg font-bold text-black"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            O
          </div>
          <h1
            className="text-2xl font-bold tracking-tight text-neutral-900"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Create your OMNI SEO account
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Access all 5 AI search &amp; visibility tools in one studio.
          </p>
        </div>

        <AuthForm mode="signup" next={next} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
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
