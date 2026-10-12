import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getUser } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

import { DAILY_LIMITS, type QuotaTool, type Tier } from "@/lib/limits";

export { DAILY_LIMITS };
export type { QuotaTool, Tier };

export interface Quota {
  tier: Tier;
  limit: number;
  used: number;
  remaining: number;
}

export interface Viewer {
  uid: string | null;
  email: string | null;
  tier: Tier;
}

export async function getViewer(): Promise<Viewer> {
  const user = await getCurrentUser();
  if (!user) return { uid: null, email: null, tier: "anon" };
  const doc = await getUser(user.uid).catch(() => null);
  return { uid: user.uid, email: user.email ?? null, tier: doc?.plan === "paid" ? "pro" : "free" };
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** IPs are never stored raw: a salted hash is enough to count runs per day. */
function ipKey(ip: string): string {
  const salt = process.env.QUOTA_SALT ?? process.env.CRON_SECRET ?? "seowise";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
}

// Fallback when Firestore is unreachable: per-instance memory, so limits still roughly apply.
const memory = new Map<string, number>();

/**
 * Atomically consumes one run for today. Returns the quota after consumption, or { ok: false } when exhausted.
 */
export async function consumeQuota(
  req: NextRequest,
  tool: QuotaTool,
  viewer: Viewer,
): Promise<{ ok: true; quota: Quota } | { ok: false; quota: Quota; message: string }> {
  const limit = DAILY_LIMITS[tool][viewer.tier];
  const day = new Date().toISOString().slice(0, 10);
  const subject = viewer.uid ? `u_${viewer.uid}` : `ip_${ipKey(clientIp(req))}`;
  const id = `${subject}_${tool}_${day}`;

  let used: number;
  try {
    const ref = adminDb().collection("quota").doc(id);
    used = await adminDb().runTransaction(async (tx) => {
      const current = ((await tx.get(ref)).data()?.count as number | undefined) ?? 0;
      if (current >= limit) return current + 1; // signal exhaustion without writing
      tx.set(ref, { tool, day, tier: viewer.tier, count: FieldValue.increment(1), expiresAt: new Date(Date.now() + 2 * 86_400_000) }, { merge: true });
      return current + 1;
    });
  } catch (err) {
    console.warn("[quota] falling back to memory", err instanceof Error ? err.message : err);
    used = (memory.get(id) ?? 0) + 1;
    if (used <= limit) memory.set(id, used);
    if (memory.size > 10_000) memory.clear();
  }

  if (used > limit) {
    const quota = { tier: viewer.tier, limit, used: limit, remaining: 0 };
    const message =
      viewer.tier === "anon"
        ? `You've used today's ${limit} free runs. Create a free account to get ${DAILY_LIMITS[tool].free} a day.`
        : viewer.tier === "free"
          ? `You've used today's ${limit} runs on the free plan. Limits reset at midnight UTC, or go Pro for ${DAILY_LIMITS[tool].pro} a day.`
          : `Daily limit of ${limit} runs reached. It resets at midnight UTC.`;
    return { ok: false, quota, message };
  }
  return { ok: true, quota: { tier: viewer.tier, limit, used, remaining: limit - used } };
}

/**
 * Gives back a run consumed by `consumeQuota` when the failure was not the user's result to keep (the site was
 * unreachable, a typo'd domain, our own error). Best-effort: never throws. Returns the corrected quota.
 */
export async function refundQuota(req: NextRequest, tool: QuotaTool, viewer: Viewer, quota: Quota): Promise<Quota> {
  const day = new Date().toISOString().slice(0, 10);
  const subject = viewer.uid ? `u_${viewer.uid}` : `ip_${ipKey(clientIp(req))}`;
  const id = `${subject}_${tool}_${day}`;
  try {
    const ref = adminDb().collection("quota").doc(id);
    await adminDb().runTransaction(async (tx) => {
      const current = ((await tx.get(ref)).data()?.count as number | undefined) ?? 0;
      if (current > 0) tx.set(ref, { count: FieldValue.increment(-1) }, { merge: true });
    });
  } catch {
    const used = memory.get(id) ?? 0;
    if (used > 0) memory.set(id, used - 1);
  }
  const used = Math.max(0, quota.used - 1);
  return { ...quota, used, remaining: quota.limit - used };
}
