import "server-only";
import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { PLAN_LIMITS, type BrandDoc, type PromptDoc, type RunDoc, type RollupDoc, type UserDoc } from "@/lib/types";

/** Cached per request: the layout, page and quota helpers all ask for the same user doc. */
export const getUser = cache(async (uid: string): Promise<UserDoc | null> => {
  const snap = await adminDb().collection("users").doc(uid).get();
  return snap.exists ? (snap.data() as UserDoc) : null;
});

export const getBrandForUser = cache(async (uid: string): Promise<BrandDoc | null> => {
  const snap = await adminDb().collection("brands").where("ownerUid", "==", uid).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<BrandDoc, "id">) };
});

export async function getPrompts(brandId: string): Promise<PromptDoc[]> {
  const snap = await adminDb()
    .collection("prompts")
    .where("brandId", "==", brandId)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PromptDoc, "id">) }));
}

export async function getRecentRuns(brandId: string, limit = 200): Promise<RunDoc[]> {
  const snap = await adminDb()
    .collection("runs")
    .where("brandId", "==", brandId)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RunDoc, "id">) }));
}

export async function getRollups(brandId: string, limit = 30): Promise<RollupDoc[]> {
  const snap = await adminDb()
    .collection("rollups")
    .where("brandId", "==", brandId)
    .orderBy("date", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as RollupDoc).reverse();
}

export function planLimits(plan: UserDoc["plan"] | undefined) {
  return PLAN_LIMITS[plan ?? "free"];
}
