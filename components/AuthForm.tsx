"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrow, IconSpinner } from "@/components/icons/Icons";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { resetViewerCache } from "@/components/viewer/useViewer";

const GOOGLE_POPUP_TIMEOUT_MS = 20_000;

const inputClass =
  "glass-inset h-12 w-full rounded-[12px] px-4 text-[15.5px] text-ds-ink outline-none transition-[box-shadow,background-color] duration-300 placeholder:text-ds-ink-3 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(242,169,127,0.35)]";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Google sign-in timed out. Check your popup blocker and try again.")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function establishServerSession(idToken: string) {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Could not start your session. Please try again.");
  resetViewerCache();
}

/** Firebase error codes → plain English. */
function friendly(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "That email and password don't match.",
    "auth/wrong-password": "That email and password don't match.",
    "auth/user-not-found": "No account with that email. Create one instead?",
    "auth/email-already-in-use": "An account with that email already exists. Log in instead.",
    "auth/weak-password": "Use at least 6 characters for your password.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
    "auth/network-request-failed": "Network problem. Check your connection and try again.",
  };
  if (map[code]) return map[code];
  return err instanceof Error ? err.message.replace(/^Firebase: /, "") : "Something went wrong.";
}

export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
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
        await establishServerSession(await cred.user.getIdToken());
        router.push(destination);
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          setError(friendly(err));
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
      const cred = mode === "login" ? await signInWithEmailAndPassword(auth, email, password) : await createUserWithEmailAndPassword(auth, email, password);
      await establishServerSession(await cred.user.getIdToken());
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(friendly(err));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await withTimeout(signInWithPopup(auth, provider), GOOGLE_POPUP_TIMEOUT_MS);
      await establishServerSession(await cred.user.getIdToken());
      router.push(destination);
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        // Popups blocked: fall back to a full-page redirect, resumed by the getRedirectResult() effect above.
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          setError(friendly(redirectErr));
        }
      } else if (code !== "auth/popup-closed-by-user") {
        setError(friendly(err));
      }
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="glass-inset flex h-12 w-full items-center justify-center gap-3 rounded-[12px] text-[15px] font-medium text-ds-ink transition hover:bg-white/80 active:translate-y-px disabled:opacity-60"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-ds-ink-3">
        <div className="h-px flex-1 bg-ds-line" />
        or
        <div className="h-px flex-1 bg-ds-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ds-ink-2">Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ds-ink-2">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-[10px] bg-[#c92a2a]/10 px-3 py-2 text-[14px] text-[#a12121]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="group mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-ds-accent text-[15px] font-medium text-ds-ink shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_10px_24px_-14px_rgba(165,85,45,.7)] transition hover:bg-[var(--ds-accent-hover)] active:translate-y-px disabled:opacity-60"
        >
          {loading ? <IconSpinner className="h-4 w-4 animate-spin" /> : null}
          {loading ? "One moment…" : mode === "login" ? "Log in" : "Create account"}
          {!loading && <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>
      {mode === "signup" && (
        <p className="mt-4 text-center text-[12px] leading-5 text-ds-ink-3">
          By continuing you agree to the{" "}
          <a href="/terms" className="underline underline-offset-2 hover:text-ds-ink">
            terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-ds-ink">
            privacy policy
          </a>
          .
        </p>
      )}
    </div>
  );
}
