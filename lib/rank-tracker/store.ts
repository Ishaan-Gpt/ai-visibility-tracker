import "server-only";
import crypto from "node:crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getUser } from "@/lib/data";
import { RANK_LIMITS } from "@/lib/limits";
import { normalizeKeyword } from "@/lib/keywords/text";
import type { RtAlert, RtKeyword, RtProject, RtSnapshot } from "./types";

/*
 * Firestore collections (all server-only; firestore.rules deny client access):
 *   rtProjects/{id}                 one tracked domain + market
 *   rtKeywords/{hash(project,kw)}   one tracked keyword; latest check + compact history (sparklines, movers)
 *   rtSnapshots/{keywordId_date}    one full check per keyword per UTC day (idempotent id)
 *   rtTasks/{dataforseoTaskId}      in-flight Standard-queue tasks only (deleted once collected)
 *   rtAlerts/{keywordId_date_kind}  notable changes (idempotent id)
 *   rtDomainCache/{hash}            Domain keywords lookups, 7-day TTL (`expiresAt`)
 * Only equality / single-field range queries are used, so no composite indexes are required.
 */

export const C = {
  projects: "rtProjects",
  keywords: "rtKeywords",
  snapshots: "rtSnapshots",
  tasks: "rtTasks",
  alerts: "rtAlerts",
  domainCache: "rtDomainCache",
} as const;

export type PaidTier = "free" | "pro";

export async function tierOf(uid: string): Promise<PaidTier> {
  const u = await getUser(uid).catch(() => null);
  return u?.plan === "paid" ? "pro" : "free";
}

export const limitsFor = (tier: PaidTier) => RANK_LIMITS[tier];

export const keywordId = (projectId: string, keyword: string) => crypto.createHash("sha1").update(`${projectId}|${keyword}`).digest("hex").slice(0, 28);

/** Search operators make DataForSEO charge 5x per operator, and aren't rankings anyway. */
const OPERATOR = /(^|\s)-?(site|inurl|allinurl|intitle|allintitle|intext|allintext|filetype|ext|related|cache|info|define|before|after|source|link):/i;

/** Cleans one keyword for tracking, or explains why it can't be tracked. */
export function cleanTrackKeyword(raw: string, language: string): { keyword: string } | { error: string } {
  const k = normalizeKeyword(String(raw ?? ""), language);
  if (!k) return { error: "too short, too long or not text" };
  if (k.length > 80) return { error: "longer than 80 characters" };
  if (OPERATOR.test(k)) return { error: "search operators can't be tracked" };
  if (k.split(" ").length > 10) return { error: "more than 10 words" };
  return { keyword: k };
}

export function cleanTag(raw: string): string {
  return String(raw ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

const projectFrom = (id: string, d: DocumentData): RtProject => ({ id, ...(d as Omit<RtProject, "id">) });
const keywordFrom = (id: string, d: DocumentData): RtKeyword => ({ id, ...(d as Omit<RtKeyword, "id">) });

export async function listProjects(uid: string): Promise<RtProject[]> {
  const snap = await adminDb().collection(C.projects).where("ownerUid", "==", uid).get();
  return snap.docs.map((d) => projectFrom(d.id, d.data())).sort((a, b) => a.createdAt - b.createdAt);
}

/** The project when it exists AND belongs to `uid`; otherwise null (callers answer 404 either way). */
export async function getOwnedProject(uid: string, projectId: string): Promise<RtProject | null> {
  if (!/^[\w-]{1,64}$/.test(projectId)) return null;
  const snap = await adminDb().collection(C.projects).doc(projectId).get();
  if (!snap.exists || snap.data()?.ownerUid !== uid) return null;
  return projectFrom(snap.id, snap.data()!);
}

export async function getProject(projectId: string): Promise<RtProject | null> {
  const snap = await adminDb().collection(C.projects).doc(projectId).get();
  return snap.exists ? projectFrom(snap.id, snap.data()!) : null;
}

export async function listKeywords(projectId: string): Promise<RtKeyword[]> {
  const snap = await adminDb().collection(C.keywords).where("projectId", "==", projectId).get();
  return snap.docs.map((d) => keywordFrom(d.id, d.data())).sort((a, b) => a.createdAt - b.createdAt || a.keyword.localeCompare(b.keyword));
}

export async function countUserKeywords(uid: string): Promise<number> {
  const agg = await adminDb().collection(C.keywords).where("ownerUid", "==", uid).count().get();
  return agg.data().count;
}

export async function getOwnedKeyword(uid: string, kwId: string): Promise<RtKeyword | null> {
  if (!/^[a-f0-9]{28}$/.test(kwId)) return null;
  const snap = await adminDb().collection(C.keywords).doc(kwId).get();
  if (!snap.exists || snap.data()?.ownerUid !== uid) return null;
  return keywordFrom(snap.id, snap.data()!);
}

export async function listSnapshots(kwId: string, limit = 400): Promise<RtSnapshot[]> {
  const snap = await adminDb().collection(C.snapshots).where("keywordId", "==", kwId).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<RtSnapshot, "id">) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export async function listAlerts(projectId: string, limit = 60): Promise<RtAlert[]> {
  const snap = await adminDb().collection(C.alerts).where("projectId", "==", projectId).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<RtAlert, "id">) }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export interface AddInput {
  keyword: string;
  tags?: string[];
  volume?: number | null;
}

/** Adds keywords (deduped by id), within the owner's plan limit. New keywords are due immediately. */
export async function addKeywords(project: RtProject, items: AddInput[], tier: PaidTier): Promise<{ added: string[]; duplicates: string[]; invalid: { keyword: string; reason: string }[]; overLimit: string[] }> {
  const limit = limitsFor(tier).keywords;
  const invalid: { keyword: string; reason: string }[] = [];
  const unique = new Map<string, AddInput>();
  for (const it of items) {
    const c = cleanTrackKeyword(it.keyword, project.language);
    if ("error" in c) {
      if (String(it.keyword ?? "").trim()) invalid.push({ keyword: String(it.keyword).slice(0, 80), reason: c.error });
      continue;
    }
    const prev = unique.get(c.keyword);
    unique.set(c.keyword, { keyword: c.keyword, tags: [...new Set([...(prev?.tags ?? []), ...(it.tags ?? []).map(cleanTag).filter(Boolean)])].slice(0, 8), volume: it.volume ?? prev?.volume ?? null });
  }
  const db = adminDb();
  const refs = [...unique.keys()].map((k) => db.collection(C.keywords).doc(keywordId(project.id, k)));
  const existing = refs.length ? await db.getAll(...refs) : [];
  const duplicates: string[] = [];
  const fresh: AddInput[] = [];
  [...unique.values()].forEach((it, i) => (existing[i]?.exists ? duplicates.push(it.keyword) : fresh.push(it)));

  // The count + writes are not one transaction; a concurrent add could overshoot by a few, which the scheduler
  // tolerates (it only checks the oldest `limit` keywords per account).
  const used = await countUserKeywords(project.ownerUid);
  const room = Math.max(0, limit - used);
  const accepted = fresh.slice(0, room);
  const overLimit = fresh.slice(room).map((f) => f.keyword);
  const now = Date.now();
  for (let i = 0; i < accepted.length; i += 400) {
    const batch = db.batch();
    accepted.slice(i, i + 400).forEach((it, j) => {
      const doc: Omit<RtKeyword, "id"> = {
        projectId: project.id,
        ownerUid: project.ownerUid,
        keyword: it.keyword,
        tags: it.tags ?? [],
        createdAt: now + i + j, // stable order for same-batch adds
        nextDueAt: 0,
        pendingTaskId: null,
        pendingSince: null,
        attempts: 0,
        lastError: null,
        last: null,
        history: [],
        best: null,
        volume: typeof it.volume === "number" && Number.isFinite(it.volume) ? it.volume : null,
      };
      batch.create(db.collection(C.keywords).doc(keywordId(project.id, it.keyword)), doc);
    });
    await batch.commit();
  }
  return { added: accepted.map((a) => a.keyword), duplicates, invalid, overLimit };
}

/** Deletes every doc of `collection` where `field == value`, in batches. */
async function deleteWhere(collection: string, field: string, value: string) {
  const db = adminDb();
  for (;;) {
    const snap = await db.collection(collection).where(field, "==", value).limit(400).get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < 400) return;
  }
}

export async function removeKeywords(project: RtProject, ids: string[]): Promise<number> {
  const db = adminDb();
  const refs = ids.filter((id) => /^[a-f0-9]{28}$/.test(id)).map((id) => db.collection(C.keywords).doc(id));
  if (!refs.length) return 0;
  const snaps = await db.getAll(...refs);
  const owned = snaps.filter((s) => s.exists && s.data()?.projectId === project.id);
  for (const s of owned) {
    await deleteWhere(C.snapshots, "keywordId", s.id);
    await deleteWhere(C.alerts, "keywordId", s.id);
  }
  const batch = db.batch();
  owned.forEach((s) => batch.delete(s.ref));
  await batch.commit();
  return owned.length;
}

export async function deleteProject(project: RtProject): Promise<void> {
  await deleteWhere(C.snapshots, "projectId", project.id);
  await deleteWhere(C.alerts, "projectId", project.id);
  await deleteWhere(C.tasks, "projectId", project.id);
  await deleteWhere(C.keywords, "projectId", project.id);
  await adminDb().collection(C.projects).doc(project.id).delete();
}

export async function setKeywordTags(project: RtProject, ids: string[], add: string[], remove: string[]): Promise<number> {
  const db = adminDb();
  const refs = ids.filter((id) => /^[a-f0-9]{28}$/.test(id)).map((id) => db.collection(C.keywords).doc(id));
  if (!refs.length) return 0;
  const snaps = await db.getAll(...refs);
  const batch = db.batch();
  let n = 0;
  const addT = add.map(cleanTag).filter(Boolean);
  const remT = new Set(remove.map(cleanTag));
  for (const s of snaps) {
    if (!s.exists || s.data()?.projectId !== project.id) continue;
    const tags = [...new Set([...((s.data()?.tags as string[]) ?? []).filter((t) => !remT.has(t)), ...addT])].slice(0, 8);
    batch.update(s.ref, { tags });
    n += 1;
  }
  if (n) await batch.commit();
  return n;
}
