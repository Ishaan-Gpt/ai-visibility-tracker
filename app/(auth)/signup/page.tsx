import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/session";
import { AuthLayout } from "@/components/marketing/AuthLayout";

export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Already signed in: skip the form and go where they were heading.
  if (await getCurrentUser()) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
  return (
    <AuthLayout
      title={<>Create your <span className="accent-word">free</span> account</>}
      subtitle="Higher limits, saved reports and AI visibility tracking. No card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-ds-ink underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" next={next} />
    </AuthLayout>
  );
}
