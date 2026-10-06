import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/session";
import { AuthLayout } from "@/components/marketing/AuthLayout";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Already signed in: skip the form and go where they were heading.
  if (await getCurrentUser()) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
  return (
    <AuthLayout
      title={<>Welcome <span className="accent-word">back</span></>}
      subtitle="Sign in to your saved reports and higher limits."
      footer={
        <>
          New here?{" "}
          <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-ds-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm mode="login" next={next} />
    </AuthLayout>
  );
}
