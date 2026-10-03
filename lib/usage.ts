import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { getUser } from "@/lib/data";

/**
 * Per-user, per-tool daily usage cap. Protects third-party quotas and prevents abuse of fetch-based tools.
 * Returns { ok: false, message } when the cap is hit. Counts only when ok.
 */
export async function consumeDaily(
  uid: string,
  tool: string,
  limits: { free: number; paid: number },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getUser(uid);
  const limit = user?.plan === "paid" ? limits.paid : limits.free;
  const day = new Date().toISOString().slice(0, 10);
  const ref = adminDb().collection("toolUsage").doc(`${uid}_${tool}_${day}`);
  const used = ((await ref.get()).data()?.count as number | undefined) ?? 0;
  if (used >= limit) {
    return { ok: false, message: `Daily limit reached (${limit} runs on your plan). Try again tomorrow or upgrade.` };
  }
  await ref.set({ uid, tool, day, count: used + 1 }, { merge: true });
  return { ok: true };
}
