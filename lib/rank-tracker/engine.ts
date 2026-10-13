import "server-only";
import crypto from "node:crypto";
import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { DfsError } from "@/lib/dataforseo/client";
import { noteProviderError, reserveSpend, settleSpend } from "@/lib/dataforseo/guard";
import { serpTaskMaxCost } from "@/lib/dataforseo/prices";
import { buildSerpTask, MAX_TASKS_PER_POST, postSerpTasks, SERP_DEPTH, serpTaskGet, serpTasksReady, type TaskGetOutcome } from "@/lib/dataforseo/serp";
import { alertKinds } from "./metrics";
import { emailAlerts, pingbackUrl } from "./notify";
import { emptyCheck, parseSerp } from "./parse";
import { canPost, CLAIM_LEASE_MS, MAX_ATTEMPTS, nextDueAfterCheck, PENDING_LEASE_MS, retryAt, TASK_ABANDON_MS, todayKey, upsertPoint, withinPlan } from "./schedule";
import { C, limitsFor, tierOf, type PaidTier } from "./store";
import type { RtAlert, RtCheck, RtKeyword, RtProject, RtSnapshot } from "./types";

/*
 * Check lifecycle
 *   1. claim   - transaction per batch: a keyword is claimed only if canPost() (not checked today, no live task,
 *                due or manual). The claim leases it (pendingTaskId "claim:*", nextDueAt pushed out) so neither a
 *                second cron tick nor an on-demand click can post it twice.
 *   2. budget  - reserveSpend() for the worst case (10 pages each); keywords that don't fit are released.
 *   3. post    - task_post, 100 tasks per call, tag "rt:<keywordId>"; each created task gets an rtTasks doc and
 *                becomes the keyword's pendingTaskId. Actual `cost` replaces the reservation.
 *   4. collect - tasks_ready (or the stale sweep / dashboard poll / pingback) -> task_get/advanced -> parse ->
 *                snapshot rtSnapshots/{keywordId_date} + keyword.last/history + alerts, all idempotent per day.
 *                The rtTasks doc is deleted once collected.
 * Failures back off (30 min, 2 h, 6 h); billing errors pause all paid calls via the guard.
 */

const TAG_PREFIX = "rt:";
const DEFAULT_ALERT_THRESHOLD = 5;

interface TaskDoc {
  keywordId: string;
  projectId: string;
  ownerUid: string;
  date: string;
  postedAt: number;
  cost: number;
  attempts?: number;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 200);

/* ------------------------------------------------------------------ posting */

export interface PostOutcome {
  posted: number;
  skipped: number;
  failed: number;
  /** Set when the spend guard stopped some or all keywords. */
  paused: string | null;
  errors: string[];
  cost: number;
}

/** Claims keywords for posting. Returns the ones this caller now owns, with their previous nextDueAt. */
async function claim(ids: string[], now: number, manual: boolean, token: string): Promise<{ kw: RtKeyword; prevDue: number }[]> {
  const db = adminDb();
  const out: { kw: RtKeyword; prevDue: number }[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const refs = ids.slice(i, i + 100).map((id) => db.collection(C.keywords).doc(id));
    const won = await db.runTransaction(async (tx) => {
      const snaps = await tx.getAll(...refs);
      const mine: { kw: RtKeyword; prevDue: number }[] = [];
      for (const s of snaps) {
        if (!s.exists) continue;
        const kw = { id: s.id, ...(s.data() as Omit<RtKeyword, "id">) };
        if (!canPost({ nextDueAt: kw.nextDueAt ?? 0, pendingTaskId: kw.pendingTaskId, pendingSince: kw.pendingSince, lastDate: kw.last?.date ?? null }, now, manual)) continue;
        tx.update(s.ref, { pendingTaskId: `claim:${token}`, pendingSince: now, nextDueAt: now + CLAIM_LEASE_MS });
        mine.push({ kw, prevDue: kw.nextDueAt ?? 0 });
      }
      return mine;
    });
    out.push(...won);
  }
  return out;
}

async function release(items: { kw: RtKeyword; prevDue: number }[], patch: (k: RtKeyword, prevDue: number) => Record<string, unknown>) {
  const db = adminDb();
  for (let i = 0; i < items.length; i += 400) {
    const batch = db.batch();
    for (const { kw, prevDue } of items.slice(i, i + 400)) batch.update(db.collection(C.keywords).doc(kw.id), { pendingTaskId: null, pendingSince: null, ...patch(kw, prevDue) });
    await batch.commit().catch((err) => console.error("[rank-tracker] release failed", errText(err)));
  }
}

/** Posts checks for keywords (grouped with their project). Safe to call concurrently. */
export async function postChecks(items: { kw: RtKeyword; project: RtProject }[], opts: { manual: boolean; now?: number }): Promise<PostOutcome> {
  const now = opts.now ?? Date.now();
  const token = crypto.randomUUID().slice(0, 8);
  const projectOf = new Map(items.map((i) => [i.kw.id, i.project]));
  const out: PostOutcome = { posted: 0, skipped: 0, failed: 0, paused: null, errors: [], cost: 0 };
  if (!items.length) return out;

  const claimed = await claim(items.map((i) => i.kw.id), now, opts.manual, token);
  out.skipped = items.length - claimed.length;
  if (!claimed.length) return out;

  const unit = serpTaskMaxCost(SERP_DEPTH);
  const budget = await reserveSpend("serp", unit, claimed.length);
  const granted = claimed.slice(0, budget.granted);
  const denied = claimed.slice(budget.granted);
  if (denied.length) {
    out.paused = budget.reason ?? "Today's data budget is used up.";
    out.skipped += denied.length;
    // Back to exactly how they were: due again on the next tick once the budget allows.
    await release(denied, (_k, prevDue) => ({ nextDueAt: prevDue }));
  }

  let actual = 0;
  const db = adminDb();
  for (let i = 0; i < granted.length; i += MAX_TASKS_PER_POST) {
    const chunk = granted.slice(i, i + MAX_TASKS_PER_POST);
    const tasks = chunk.map(({ kw }) => {
      const p = projectOf.get(kw.id)!;
      const tag = `${TAG_PREFIX}${kw.id}`;
      return buildSerpTask({
        keyword: kw.keyword,
        locationCode: p.locationCode,
        languageCode: p.language,
        device: p.device,
        tag,
        stopOn: stopTargets(p),
        pingbackUrl: pingbackUrl(tag),
      });
    });
    try {
      const { posted, cost } = await postSerpTasks(tasks);
      actual += cost;
      const byTag = new Map(posted.map((p) => [p.tag, p]));
      const batch = db.batch();
      const failed: { kw: RtKeyword; prevDue: number; error: string }[] = [];
      for (const c of chunk) {
        const p = byTag.get(`${TAG_PREFIX}${c.kw.id}`);
        if (p?.ok && p.id) {
          const project = projectOf.get(c.kw.id)!;
          const doc: TaskDoc = { keywordId: c.kw.id, projectId: project.id, ownerUid: project.ownerUid, date: todayKey(now), postedAt: now, cost: p.cost };
          batch.set(db.collection(C.tasks).doc(p.id), doc);
          batch.update(db.collection(C.keywords).doc(c.kw.id), { pendingTaskId: p.id, pendingSince: now, nextDueAt: now + PENDING_LEASE_MS });
          out.posted += 1;
        } else {
          failed.push({ ...c, error: p?.error ?? "Task was not created" });
        }
      }
      await batch.commit();
      if (failed.length) {
        out.failed += failed.length;
        out.errors.push(...new Set(failed.map((f) => f.error)));
        await release(failed, (k) => ({ attempts: (k.attempts ?? 0) + 1, lastError: failed.find((f) => f.kw.id === k.id)?.error ?? "Task was not created", nextDueAt: retryAt(now, (k.attempts ?? 0) + 1) }));
      }
    } catch (err) {
      await noteProviderError(err);
      out.failed += chunk.length;
      out.errors.push(errText(err));
      const billing = err instanceof DfsError && err.isBilling;
      await release(chunk, (k, prevDue) => (billing ? { nextDueAt: prevDue } : { attempts: (k.attempts ?? 0) + 1, lastError: errText(err), nextDueAt: retryAt(now, (k.attempts ?? 0) + 1) }));
      if (billing) {
        out.paused = "The data provider reported a billing limit.";
        // Release whatever is left unposted too.
        await release(granted.slice(i + MAX_TASKS_PER_POST), (_k, prevDue) => ({ nextDueAt: prevDue }));
        break;
      }
    }
  }
  await settleSpend("serp", budget.reserved, actual);
  out.cost = actual;
  const touched = new Set(granted.map((g) => projectOf.get(g.kw.id)!.id));
  await Promise.all([...touched].map((id) => db.collection(C.projects).doc(id).update({ lastPostedAt: now }).catch(() => {})));
  return out;
}

/**
 * stop_crawl_on_match targets. Default "own": stop as soon as our domain shows up, so a keyword ranking #4 costs
 * one page instead of ten; competitors are then known within the pages crawled (the UI says "not in top N").
 * RANK_TRACKER_STOP_ON=all waits until our domain AND every competitor appear (dearer, complete competitor data);
 * =off always crawls the full top 100.
 */
function stopTargets(p: RtProject): { targets: { domain: string; includeSubdomains: boolean }[]; mode: "any" | "all" } | undefined {
  const mode = process.env.RANK_TRACKER_STOP_ON ?? "own";
  if (mode === "off") return undefined;
  const own = { domain: p.domain, includeSubdomains: p.includeSubdomains };
  if (mode === "all") return { targets: [own, ...p.competitors.map((d) => ({ domain: d, includeSubdomains: true }))], mode: "all" };
  return { targets: [own], mode: "any" };
}

/* ---------------------------------------------------------------- collecting */

interface CollectCtx {
  now: number;
  projects: Map<string, RtProject | null>;
  tiers: Map<string, PaidTier>;
  alerts: Map<string, { project: RtProject; alerts: RtAlert[] }>;
}

const newCtx = (): CollectCtx => ({ now: Date.now(), projects: new Map(), tiers: new Map(), alerts: new Map() });

async function projectFor(ctx: CollectCtx, id: string): Promise<RtProject | null> {
  if (!ctx.projects.has(id)) {
    const s = await adminDb().collection(C.projects).doc(id).get();
    ctx.projects.set(id, s.exists ? ({ id: s.id, ...(s.data() as Omit<RtProject, "id">) } as RtProject) : null);
  }
  return ctx.projects.get(id) ?? null;
}

async function tierFor(ctx: CollectCtx, uid: string): Promise<PaidTier> {
  if (!ctx.tiers.has(uid)) ctx.tiers.set(uid, await tierOf(uid));
  return ctx.tiers.get(uid)!;
}

export type CollectState = "collected" | "pending" | "failed" | "gone";

/** Collects one task: writes the day's snapshot, updates the keyword, records alerts. Idempotent. */
async function collectOne(ctx: CollectCtx, taskId: string, task: TaskDoc, prefetched?: TaskGetOutcome): Promise<CollectState> {
  const db = adminDb();
  const taskRef = db.collection(C.tasks).doc(taskId);
  const kwRef = db.collection(C.keywords).doc(task.keywordId);
  const outcome = prefetched ?? (await serpTaskGet(taskId));
  const now = Date.now();

  if (outcome.state === "pending") {
    if (now - task.postedAt > TASK_ABANDON_MS) {
      await giveUp(taskRef, kwRef, taskId, "The check never finished at the data provider.");
      return "failed";
    }
    return "pending";
  }

  const kwSnap = await kwRef.get();
  if (!kwSnap.exists) {
    await taskRef.delete().catch(() => {});
    return "gone";
  }
  const kw = { id: kwSnap.id, ...(kwSnap.data() as Omit<RtKeyword, "id">) } as RtKeyword;
  const project = await projectFor(ctx, task.projectId);
  if (!project) {
    await taskRef.delete().catch(() => {});
    return "gone";
  }

  if (outcome.state === "failed") {
    const attempts = (task.attempts ?? 0) + 1;
    if (outcome.retry && attempts < MAX_ATTEMPTS && now - task.postedAt < TASK_ABANDON_MS) {
      await taskRef.update({ attempts }).catch(() => {});
      return "pending";
    }
    await giveUp(taskRef, kwRef, taskId, outcome.error, kw);
    return "failed";
  }

  const parsed =
    outcome.state === "done"
      ? parseSerp(outcome.result, { domain: project.domain, includeSubdomains: project.includeSubdomains }, project.competitors, { date: task.date, checkedAt: now })
      : { check: emptyCheck(project.competitors, { date: task.date, checkedAt: now }), top: [], seResultsCount: 0, checkUrl: null };
  const check: RtCheck = parsed.check;

  const earlier = (kw.history ?? []).filter((p) => p.d < task.date);
  const before = earlier.length ? earlier[earlier.length - 1].p : undefined;
  const kinds = alertKinds(before, check.position, project.alertThreshold ?? DEFAULT_ALERT_THRESHOLD);
  const tier = await tierFor(ctx, project.ownerUid);

  const snapshot: Omit<RtSnapshot, "id"> = {
    ...check,
    keywordId: kw.id,
    projectId: project.id,
    ownerUid: project.ownerUid,
    keyword: kw.keyword,
    top: parsed.top,
    seResultsCount: parsed.seResultsCount,
    checkUrl: parsed.checkUrl,
    taskId,
  };
  const history = upsertPoint(kw.history ?? [], { d: task.date, p: check.position });
  const ranked = history.map((h) => h.p).filter((p): p is number => p !== null);

  const batch = db.batch();
  batch.set(db.collection(C.snapshots).doc(`${kw.id}_${task.date}`), snapshot);
  const kwPatch: Record<string, unknown> = {
    last: check,
    history,
    best: ranked.length ? Math.min(...ranked) : null,
    attempts: 0,
    lastError: null,
  };
  // Only the task that owns the keyword releases it and schedules the next check.
  if (kw.pendingTaskId === taskId || !kw.pendingTaskId?.length) {
    kwPatch.pendingTaskId = null;
    kwPatch.pendingSince = null;
    kwPatch.nextDueAt = nextDueAfterCheck(now, limitsFor(tier).cadenceDays);
  }
  batch.update(kwRef, kwPatch);
  const created: RtAlert[] = [];
  for (const kind of kinds) {
    const id = `${kw.id}_${task.date}_${kind}`;
    const alert: Omit<RtAlert, "id"> = { projectId: project.id, ownerUid: project.ownerUid, keywordId: kw.id, keyword: kw.keyword, kind, from: before ?? null, to: check.position, date: task.date, createdAt: now };
    batch.set(db.collection(C.alerts).doc(id), alert);
    created.push({ id, ...alert });
  }
  batch.delete(taskRef);
  batch.update(db.collection(C.projects).doc(project.id), { lastCollectedAt: now });
  await batch.commit();

  if (created.length) {
    const entry = ctx.alerts.get(project.id) ?? { project, alerts: [] };
    entry.alerts.push(...created);
    ctx.alerts.set(project.id, entry);
  }
  return "collected";
}

async function giveUp(taskRef: DocumentReference, kwRef: DocumentReference, taskId: string, error: string, kw?: RtKeyword) {
  const now = Date.now();
  const k = kw ?? ((await kwRef.get()).data() as RtKeyword | undefined);
  const batch = adminDb().batch();
  batch.delete(taskRef);
  if (k && k.pendingTaskId === taskId) {
    const attempts = (k.attempts ?? 0) + 1;
    batch.update(kwRef, { pendingTaskId: null, pendingSince: null, attempts, lastError: error.slice(0, 200), nextDueAt: retryAt(now, attempts) });
  }
  await batch.commit().catch((err) => console.error("[rank-tracker] giveUp failed", errText(err)));
}

async function collectIds(ctx: CollectCtx, ids: string[], deadline: number): Promise<Record<CollectState, number>> {
  const counts: Record<CollectState, number> = { collected: 0, pending: 0, failed: 0, gone: 0 };
  if (!ids.length) return counts;
  const db = adminDb();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length && Date.now() < deadline; i += 100) {
    const refs = unique.slice(i, i + 100).map((id) => db.collection(C.tasks).doc(id));
    const snaps = await db.getAll(...refs);
    const mine = snaps.filter((s) => s.exists);
    // Modest concurrency: task_get is free but DataForSEO limits simultaneous requests.
    let next = 0;
    const worker = async () => {
      while (next < mine.length && Date.now() < deadline) {
        const s = mine[next++];
        try {
          counts[await collectOne(ctx, s.id, s.data() as TaskDoc)] += 1;
        } catch (err) {
          counts.failed += 1;
          console.error("[rank-tracker] collect failed", s.id, errText(err));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(8, mine.length) }, worker));
  }
  return counts;
}

async function finish(ctx: CollectCtx) {
  if (ctx.alerts.size) await emailAlerts(ctx.alerts);
}

/** Everything DataForSEO reports as ready that is ours. */
export async function collectReady(deadline: number) {
  const ctx = newCtx();
  let ready: string[] = [];
  try {
    ready = (await serpTasksReady()).filter((t) => t.tag?.startsWith(TAG_PREFIX)).map((t) => t.id);
  } catch (err) {
    console.warn("[rank-tracker] tasks_ready failed", errText(err));
  }
  const counts = await collectIds(ctx, ready, deadline);
  await finish(ctx);
  return { ready: ready.length, ...counts };
}

/** Tasks posted more than `olderThanMs` ago that tasks_ready didn't return (missed, or another env collected the list). */
export async function collectStale(deadline: number, olderThanMs = 20 * 60_000, max = 100) {
  const ctx = newCtx();
  const snap = await adminDb().collection(C.tasks).where("postedAt", "<", Date.now() - olderThanMs).orderBy("postedAt").limit(max).get();
  const counts = await collectIds(ctx, snap.docs.map((d) => d.id), deadline);
  await finish(ctx);
  return { stale: snap.size, ...counts };
}

/** On-demand collection for one project's in-flight tasks (dashboard poll). */
export async function collectProject(projectId: string, deadline: number, minAgeMs = 10_000) {
  const ctx = newCtx();
  const snap = await adminDb().collection(C.tasks).where("projectId", "==", projectId).get();
  const ids = snap.docs.filter((d) => Date.now() - ((d.data() as TaskDoc).postedAt ?? 0) >= minAgeMs).map((d) => d.id);
  const counts = await collectIds(ctx, ids, deadline);
  await finish(ctx);
  return { inFlight: snap.size, ...counts };
}

/** Pingback: collect one task by id (only if it is one of ours). */
export async function collectById(taskId: string) {
  const ctx = newCtx();
  const counts = await collectIds(ctx, [taskId], Date.now() + 25_000);
  await finish(ctx);
  return counts;
}

/* ---------------------------------------------------------------- scheduling */

/** Keywords due for their scheduled check, limited to each account's plan, with their project. */
export async function dueKeywords(now: number, max = 1000): Promise<{ kw: RtKeyword; project: RtProject }[]> {
  const db = adminDb();
  const snap = await db.collection(C.keywords).where("nextDueAt", "<=", now).orderBy("nextDueAt").limit(max).get();
  const kws = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<RtKeyword, "id">) }) as RtKeyword)
    .filter((k) => canPost({ nextDueAt: k.nextDueAt ?? 0, pendingTaskId: k.pendingTaskId, pendingSince: k.pendingSince, lastDate: k.last?.date ?? null }, now));
  if (!kws.length) return [];

  const projectIds = [...new Set(kws.map((k) => k.projectId))];
  const projects = new Map<string, RtProject>();
  for (let i = 0; i < projectIds.length; i += 100) {
    const snaps = await db.getAll(...projectIds.slice(i, i + 100).map((id) => db.collection(C.projects).doc(id)));
    for (const s of snaps) if (s.exists) projects.set(s.id, { id: s.id, ...(s.data() as Omit<RtProject, "id">) } as RtProject);
  }

  // Plan enforcement after a downgrade: only the oldest `limit` keywords per account keep being checked.
  const owners = [...new Set(kws.map((k) => k.ownerUid))];
  const allowed = new Map<string, Set<string> | null>();
  for (const uid of owners) {
    const limit = limitsFor(await tierOf(uid)).keywords;
    const count = (await db.collection(C.keywords).where("ownerUid", "==", uid).count().get()).data().count;
    if (count <= limit) {
      allowed.set(uid, null);
      continue;
    }
    const all = await db.collection(C.keywords).where("ownerUid", "==", uid).select("createdAt").get();
    allowed.set(uid, withinPlan(all.docs.map((d) => ({ id: d.id, createdAt: (d.data().createdAt as number) ?? 0 })), limit));
  }

  return kws
    .filter((k) => projects.has(k.projectId) && projects.get(k.projectId)!.ownerUid === k.ownerUid)
    .filter((k) => {
      const set = allowed.get(k.ownerUid);
      return !set || set.has(k.id);
    })
    .map((kw) => ({ kw, project: projects.get(kw.projectId)! }));
}

/** One scheduler tick: collect what's ready, sweep stale tasks, then post what's due. */
export async function runTick(deadline: number) {
  const ready = await collectReady(deadline - 60_000);
  const stale = Date.now() < deadline - 60_000 ? await collectStale(deadline - 60_000) : null;
  const due = Date.now() < deadline - 30_000 ? await dueKeywords(Date.now()) : [];
  const post = due.length ? await postChecks(due, { manual: false }) : null;
  return { ready, stale, due: due.length, post };
}
