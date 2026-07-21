import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/session";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  let sessionCookie: string;
  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email;
    sessionCookie = await createSessionCookie(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  // Ensure a users/{uid} doc exists (first login = signup).
  const userRef = adminDb().collection("users").doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    await userRef.set({
      uid,
      email: email ?? "",
      plan: "free",
      createdAt: Date.now(),
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
