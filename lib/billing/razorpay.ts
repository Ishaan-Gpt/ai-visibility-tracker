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

export async function createSubscription(uid: string, email: string): Promise<{ id: string; shortUrl: string }> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
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

/** Constant-time check of Razorpay's X-Razorpay-Signature (hex HMAC-SHA256 of the raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
