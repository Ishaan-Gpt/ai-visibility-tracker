import "server-only";
import crypto from "node:crypto";

/**
 * Razorpay Subscriptions (https://razorpay.com/docs/api/payments/subscriptions/).
 * Needs RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID (create the plan in the dashboard) and
 * RAZORPAY_WEBHOOK_SECRET (set when adding the webhook). Not yet exercised against a live Razorpay account.
 */

export function billingConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_PLAN_ID);
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
}

export async function createSubscription(uid: string, email: string): Promise<{ id: string; shortUrl: string }> {
  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: { uid, email },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json()) as { id?: string; short_url?: string; error?: { description?: string } };
  if (!res.ok || !data.id || !data.short_url) {
    throw new Error(data.error?.description ?? `Razorpay error ${res.status}`);
  }
  return { id: data.id, shortUrl: data.short_url };
}

/**
 * Cancels at the end of the current billing cycle, so the customer keeps Pro for the period they paid for.
 * Razorpay then sends subscription.cancelled, which the webhook turns into a downgrade.
 */
export async function cancelSubscription(id: string): Promise<{ status: string; endsAt: number | null }> {
  const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json()) as { status?: string; current_end?: number | null; error?: { description?: string } };
  if (!res.ok) throw new Error(data.error?.description ?? `Razorpay error ${res.status}`);
  return { status: data.status ?? "active", endsAt: data.current_end ? data.current_end * 1000 : null };
}

/** Constant-time check of Razorpay's X-Razorpay-Signature (hex HMAC-SHA256 of the raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
