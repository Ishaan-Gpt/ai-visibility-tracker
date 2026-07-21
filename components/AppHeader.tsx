"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function AppHeader({ email }: { email: string }) {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="text-lg font-bold text-foreground">
          AI Visibility <span className="text-primary">Tracker</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">{email}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
