import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUser } from "@/lib/data";
import { adminDb } from "@/lib/firebase/admin";
import { billingConfigured, createSubscription } from "@/lib/billing/razorpay";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!billingConfigured()) {
    return NextResponse.json({ error: "Billing is not configured yet. Please check back soon." }, { status: 503 });
  }
  const doc = await getUser(user.uid);
  if (doc?.plan === "paid") return NextResponse.json({ error: "You are already on the Pro plan." }, { status: 409 });

  try {
    const sub = await createSubscription(user.uid, user.email ?? "");
    await adminDb().collection("users").doc(user.uid).set(
      { pendingSubscriptionId: sub.id, billingProvider: "razorpay" },
      { merge: true },
    );
    return NextResponse.json({ url: sub.shortUrl });
  } catch (err) {
    console.error("[billing] checkout failed", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
