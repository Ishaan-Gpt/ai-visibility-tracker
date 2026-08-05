import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Log in</h1>
      <AuthForm mode="login" />
      <p className="mt-6 text-sm text-muted">
        No account?{" "}
        <Link href="/tools/ai-visibility-tracker/signup" className="font-semibold text-primary hover:text-primary-hover">
          Sign up
        </Link>
      </p>
    </div>
  );
}
