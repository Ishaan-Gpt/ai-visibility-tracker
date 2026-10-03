import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyWebhookSignature } from "@/lib/billing/razorpay";

type SubscriptionEvent = {
  event: string;
  payload?: { subscription?: { entity?: { id?: string; status?: string; notes?: Record<string, string> | unknown[] } } };
};

const ACTIVATE = new Set(["subscription.activated", "subscription.charged", "subscription.resumed"]);
const DEACTIVATE = new Set(["subscription.cancelled", "subscription.halted", "subscription.completed", "subscription.expired", "subscription.paused"]);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let evt: SubscriptionEvent;
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const entity = evt.payload?.subscription?.entity;
  const notes = entity?.notes && !Array.isArray(entity.notes) ? entity.notes : undefined;
  const uid = notes?.uid;
  if (!entity?.id || !uid) return NextResponse.json({ ok: true, ignored: "no uid" });

  const ref = adminDb().collection("users").doc(uid);
  const snap = await ref.get();
  // Guard: only act on the subscription we created for this user.
  const known = snap.data()?.pendingSubscriptionId ?? snap.data()?.subscriptionId;
  if (!snap.exists || known !== entity.id) return NextResponse.json({ ok: true, ignored: "unknown subscription" });

  if (ACTIVATE.has(evt.event)) {
    await ref.set({ plan: "paid", subscriptionId: entity.id, billingStatus: entity.status ?? "active", paidAt: Date.now() }, { merge: true });
  } else if (DEACTIVATE.has(evt.event)) {
    await ref.set({ plan: "free", billingStatus: entity.status ?? evt.event.replace("subscription.", "") }, { merge: true });
  }
  return NextResponse.json({ ok: true });
}
