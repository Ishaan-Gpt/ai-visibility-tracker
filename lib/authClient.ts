"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
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

export async function establishServerSession(idToken: string) {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Could not start session");
}

export async function emailPasswordSignIn(mode: "login" | "signup", email: string, password: string) {
  const cred =
    mode === "login"
      ? await signInWithEmailAndPassword(auth, email, password)
      : await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  await establishServerSession(idToken);
  return cred.user;
}

/**
 * Popup-only Google sign-in (no redirect fallback — this is used from the homepage's
 * in-page modal, which has nowhere to resume a redirect flow). If the popup is blocked,
 * callers should point the user at /tools/ai-visibility-tracker/login, which does support
 * the redirect fallback.
 */
export async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  const cred = await withTimeout(signInWithPopup(auth, provider), GOOGLE_POPUP_TIMEOUT_MS);
  const idToken = await cred.user.getIdToken();
  await establishServerSession(idToken);
  return cred.user;
}
