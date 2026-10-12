import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { activeEngines } from "@/lib/providers";
import type { BrandDoc, PromptDoc, Provider, RollupDoc, RunDoc } from "@/lib/types";
import { analyzeAnswer, toCitations } from "./analyze";
import { extractFromAnswer } from "./extract";
import { computeRollup } from "./metrics";
import { settleLimit } from "./pool";

export const EXCERPT_CHARS = 4000;
const LOCK_TTL_MS = 6 * 60_000;

export function todayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export type RunSource = "manual" | "initial" | "cron";

export interface RunOutcome {
  status: "completed" | "partial" | "failed" | "locked" | "no-prompts" | "no-engines";
  date: string;
  answers: number;
  failed: number;
  skipped: number;
  engines: Provider[];
  rollup?: RollupDoc;
  errors: string[];
  elapsedMs: number;
}

/** Takes the per-brand run lock. Returns false when another check is already running. */
export async function acquireRunLock(brandId: string, ttlMs = LOCK_TTL_MS): Promise<boolean> {
  const db = adminDb();
  const ref = db.collection("brands").doc(brandId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const until = (snap.data()?.runLockUntil as number | undefined) ?? 0;
    if (until > Date.now()) return false;
    tx.update(ref, { runLockUntil: Date.now() + ttlMs });
    return true;
  });
}

async function releaseRunLock(brandId: string, extra: Record<string, unknown> = {}) {
  await adminDb()
    .collection("brands")
    .doc(brandId)
    .update({ runLockUntil: 0, ...extra })
    .catch((err) => console.error(`[visibility] failed to release lock for ${brandId}`, err));
}

async function activePrompts(brandId: string): Promise<PromptDoc[]> {
  // Equality-only query: no composite index needed; sorted in memory.
  const snap = await adminDb().collection("prompts").where("brandId", "==", brandId).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PromptDoc, "id">) }))
    .filter((p) => p.active)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function errMessage(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 220);
}

/**
 * Checks every active prompt on every configured engine, analyses each answer, stores the runs and the
 * day's rollup, and stamps the brand as checked. Concurrency-bounded and deadline-aware; holds a per-brand
 * lock so a double click, a second tab or the scheduler can't run the same brand twice at once.
 */
export async function runBrandCheck(
  brand: BrandDoc,
  opts: { source: RunSource; concurrency?: number; deadline?: number; lockHeld?: boolean } = { source: "manual" },
): Promise<RunOutcome> {
  const started = Date.now();
  const date = todayKey(started);
  const engines = activeEngines();
  const base = { date, answers: 0, failed: 0, skipped: 0, engines: engines.map((e) => e.id), errors: [] as string[] };
  if (!engines.length) return { ...base, status: "no-engines", elapsedMs: 0, errors: ["No AI engine is configured (GEMINI_API_KEY is missing)."] };

  if (!opts.lockHeld && !(await acquireRunLock(brand.id))) return { ...base, status: "locked", elapsedMs: Date.now() - started };

  let lockExtra: Record<string, unknown> = {};
  try {
    const prompts = await activePrompts(brand.id);
    if (!prompts.length) return { ...base, status: "no-prompts", elapsedMs: Date.now() - started };

    const tasks = prompts.flatMap((prompt) => engines.map((engine) => ({ prompt, engine })));
    const settled = await settleLimit(
      tasks,
      opts.concurrency ?? 6,
      async ({ prompt, engine }) => {
        const answer = await engine.ask(prompt.text);
        if (!answer.text.trim()) throw new Error(`${engine.label} returned an empty answer`);
        const citations = toCitations(answer.citations).slice(0, 30);
        const extraction = await extractFromAnswer(answer.text, brand);
        const analysis = analyzeAnswer({
          text: answer.text,
          citations,
          brand: { name: brand.name, domain: brand.domain, aliases: brand.aliases },
          competitors: brand.competitors,
          extractedBrands: extraction?.brands,
        });
        const run: Omit<RunDoc, "id"> = {
          brandId: brand.id,
          promptId: prompt.id,
          provider: answer.provider,
          model: answer.model,
          timestamp: Date.now(),
          date,
          mentioned: analysis.mentioned,
          citedUrls: citations.map((c) => c.url),
          citations,
          cited: analysis.cited,
          competitorMentions: analysis.competitorMentions,
          competitorPositions: analysis.competitorPositions,
          competitorCited: analysis.competitorCited,
          position: analysis.position,
          rawExcerpt: answer.text.slice(0, EXCERPT_CHARS),
          mentionSpans: analysis.mentionSpans.filter(([, end]) => end <= EXCERPT_CHARS).slice(0, 40),
          grounded: answer.grounded,
          sentiment: analysis.mentioned ? (extraction?.sentiment ?? null) : null,
          sentimentReason: analysis.mentioned && extraction?.reason ? extraction.reason : "",
          otherBrands: analysis.otherBrands,
          brandOrder: analysis.brandOrder,
          analyzed: extraction !== null,
        };
        return run;
      },
      { deadline: opts.deadline },
    );

    const runs: Omit<RunDoc, "id">[] = [];
    const errors: string[] = [];
    let skipped = 0;
    settled.forEach((s, i) => {
      if (s.ok) runs.push(s.value);
      else if (s.skipped) skipped++;
      else {
        const t = tasks[i];
        console.error(`[visibility] ${t.engine.id} failed brand=${brand.id} prompt=${t.prompt.id}: ${errMessage(s.error)}`);
        errors.push(`${t.engine.label}: ${errMessage(s.error)}`);
      }
    });

    const db = adminDb();
    for (let i = 0; i < runs.length; i += 400) {
      const batch = db.batch();
      for (const run of runs.slice(i, i + 400)) batch.set(db.collection("runs").doc(), run);
      await batch.commit();
    }

    const outcome = { ...base, answers: runs.length, failed: errors.length, skipped, errors: [...new Set(errors)].slice(0, 5) };

    // Every check failed (outage, bad key): don't write a fake 0% and don't mark the brand checked, so the
    // scheduler retries next tick.
    if (!runs.length) {
      lockExtra = { lastRunError: outcome.errors[0] ?? "Every check failed." };
      return { ...outcome, status: "failed", elapsedMs: Date.now() - started };
    }
    // Ran out of time part-way: keep the answers, but leave the brand due so the next tick does a full check.
    if (skipped > 0) return { ...outcome, status: "partial", elapsedMs: Date.now() - started };

    const rollup = computeRollup(brand, date, runs);
    await db.collection("rollups").doc(`${brand.id}_${date}`).set(rollup);
    lockExtra = { lastCheckedAt: Date.now(), lastCheckedDate: date, lastRunError: errors.length ? outcome.errors[0] : null };
    return { ...outcome, status: "completed", rollup, elapsedMs: Date.now() - started };
  } finally {
    await releaseRunLock(brand.id, lockExtra);
  }
}
