import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { DAILY_LIMITS, type QuotaTool, type Tier } from "@/lib/limits";
import type { HistoryItem } from "@/lib/history";

export async function listReports(uid: string): Promise<HistoryItem[]> {
  const snap = await adminDb().collection("reports").where("ownerUid", "==", uid).select("tool", "title", "subtitle", "score", "aiScore", "createdAt").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryItem, "id">) })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function usageToday(uid: string, tier: Tier): Promise<{ tool: QuotaTool; used: number; limit: number }[]> {
  const day = new Date().toISOString().slice(0, 10);
  const tools = Object.keys(DAILY_LIMITS) as QuotaTool[];
  const refs = tools.map((t) => adminDb().collection("quota").doc(`u_${uid}_${t}_${day}`));
  const snaps = await adminDb().getAll(...refs);
  return tools.map((tool, i) => ({ tool, used: (snaps[i].data()?.count as number | undefined) ?? 0, limit: DAILY_LIMITS[tool][tier] }));
}
