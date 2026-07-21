import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "__session";
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

/** Verifies the session cookie server-side. Returns null if missing/invalid — never throws. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch {
    return null;
  }
}
