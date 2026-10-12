import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUser } from "@/lib/data";
import { adminDb } from "@/lib/firebase/admin";
import { billingConfigured, cancelSubscription } from "@/lib/billing/razorpay";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!billingConfigured()) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });

  const doc = await getUser(user.uid);
  if (doc?.plan !== "paid" || !doc.subscriptionId) {
    return NextResponse.json({ error: "You don't have an active subscription." }, { status: 409 });
  }
  if (doc.billingStatus === "cancel_scheduled") return NextResponse.json({ ok: true, alreadyScheduled: true });

  try {
    const { endsAt } = await cancelSubscription(doc.subscriptionId);
    await adminDb().collection("users").doc(user.uid).set({ billingStatus: "cancel_scheduled", accessEndsAt: endsAt }, { merge: true });
    return NextResponse.json({ ok: true, endsAt });
  } catch (err) {
    console.error("[billing] cancel failed", err);
    return NextResponse.json({ error: "Could not cancel right now. Please try again or contact support." }, { status: 502 });
  }
}
