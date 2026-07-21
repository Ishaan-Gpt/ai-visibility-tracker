import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Create your account</h1>
      <AuthForm mode="signup" />
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
          Log in
        </Link>
      </p>
    </div>
  );
}
