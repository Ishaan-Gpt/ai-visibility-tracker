import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hits = new Map<string, number[]>();

/** Best-effort per-instance rate limit (5 signups / minute / IP). */
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { email?: unknown; website?: unknown };
  // Honeypot: real users never fill the hidden "website" field.
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true });

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const id = crypto.createHash("sha256").update(email).digest("hex").slice(0, 32);
  await adminDb().collection("newsletter").doc(id).set({ email, source: "landing-footer", createdAt: Date.now() }, { merge: true });
  return NextResponse.json({ ok: true });
}
