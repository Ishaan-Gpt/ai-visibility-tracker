"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const GOOGLE_POPUP_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Google sign-in timed out — check your popup blocker and try again.")),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function establishServerSession(idToken: string) {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Could not start session");
}

export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const destination = next && next.startsWith("/") ? next : "/tools/ai-visibility-tracker/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cred = await getRedirectResult(auth);
        if (!cred || cancelled) return;
        setLoading(true);
        const idToken = await cred.user.getIdToken();
        await establishServerSession(idToken);
        router.push(destination);
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await establishServerSession(idToken);
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await withTimeout(signInWithPopup(auth, provider), GOOGLE_POPUP_TIMEOUT_MS);
      const idToken = await cred.user.getIdToken();
      await establishServerSession(idToken);
      router.push(destination);
      router.refresh();
      setLoading(false);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // Popups aren't working in this browser/context — fall back to a full-page redirect,
        // which is handled by the getRedirectResult() effect above on the next page load.
        try {
          await signInWithRedirect(auth, provider);
          return; // page is navigating away
        } catch (redirectErr) {
          setError(redirectErr instanceof Error ? redirectErr.message : "Something went wrong");
          setLoading(false);
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 py-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-ds-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 py-3 text-sm text-neutral-900 outline-none transition focus:ring-2 focus:ring-ds-ink"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-ds-md bg-ds-btn py-3.5 text-sm font-semibold text-white  transition hover:bg-black disabled:cursor-default disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "login" ? "Log In ↗" : "Sign Up Free ↗"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ds-ink-2">
        <div className="h-px flex-1 bg-neutral-200" />
        or
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-ds-md border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-default disabled:opacity-60"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
