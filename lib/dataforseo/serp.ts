import "server-only";
import { DFS_CODES, dfsCall, DfsError, envelopeCost, type DfsTask } from "./client";
import type { SerpResult } from "@/lib/rank-tracker/parse";

/*
 * Google Organic SERP via the Standard queue (cheapest mode: $0.0006 per page of 10 results):
 *   POST /v3/serp/google/organic/task_post        up to 100 tasks per call, 2000 calls/min
 *   GET  /v3/serp/google/organic/tasks_ready      up to 1000 finished ids per call, 20 calls/min
 *   GET  /v3/serp/google/organic/task_get/advanced/{id}   free, results kept 30 days
 * https://docs.dataforseo.com/v3/serp/google/organic/task_post/ , .../tasks_ready/ , .../task_get/advanced/
 * Advanced (not regular) results are requested because only they include ai_overview, local_pack and other
 * features; the price is the same.
 */

export const SERP_DEPTH = 100;
export const MAX_TASKS_PER_POST = 100;

export interface SerpTaskInput {
  keyword: string;
  locationCode: number;
  languageCode: string;
  device: "desktop" | "mobile";
  /** Returned unchanged in `data.tag`; ours is "rt:<keywordId>". Max 255 chars. */
  tag: string;
  /** Stop crawling once these hosts appear in organic / featured snippet results (bills only crawled pages). */
  stopOn?: { targets: { domain: string; includeSubdomains: boolean }[]; mode: "any" | "all" };
  pingbackUrl?: string | null;
}

export function buildSerpTask(t: SerpTaskInput): Record<string, unknown> {
  const task: Record<string, unknown> = {
    // Documented: "%" must be sent as %25 and "+" as %2B.
    keyword: t.keyword.replace(/%/g, "%25").replace(/\+/g, "%2B"),
    location_code: t.locationCode,
    language_code: t.languageCode,
    device: t.device,
    depth: SERP_DEPTH,
    tag: t.tag.slice(0, 255),
  };
  if (t.stopOn?.targets.length) {
    const targets: { match_type: string; match_value: string }[] = [];
    for (const s of t.stopOn.targets) {
      if (s.includeSubdomains || t.stopOn.mode === "all") targets.push({ match_type: "with_subdomains", match_value: s.domain });
      else targets.push({ match_type: "domain", match_value: s.domain }, { match_type: "domain", match_value: `www.${s.domain}` });
    }
    // Up to 10 targets are allowed; with "all" a dropped target would make the crawl stop too early, so crawl fully.
    if (targets.length > 10 && t.stopOn.mode === "all") return task;
    task.stop_crawl_on_match = targets.slice(0, 10);
    task.target_search_mode = t.stopOn.mode;
    task.find_targets_in = ["organic", "featured_snippet"];
  }
  if (t.pingbackUrl) task.pingback_url = t.pingbackUrl;
  return task;
}

export interface PostedTask {
  tag: string;
  id: string | null;
  ok: boolean;
  cost: number;
  error?: string;
  code?: number;
}

/** Posts up to 100 tasks. Per-task failures come back as ok:false (matched by tag); transport failures throw. */
export async function postSerpTasks(tasks: Record<string, unknown>[]): Promise<{ posted: PostedTask[]; cost: number }> {
  if (tasks.length > MAX_TASKS_PER_POST) throw new Error(`At most ${MAX_TASKS_PER_POST} tasks per task_post`);
  const env = await dfsCall("POST", "/serp/google/organic/task_post", tasks, 45_000);
  const out: PostedTask[] = [];
  const byTag = new Map<string, DfsTask>();
  for (const t of env.tasks ?? []) {
    const tag = typeof t.data?.tag === "string" ? t.data.tag : "";
    if (tag) byTag.set(tag, t);
  }
  for (const input of tasks) {
    const tag = String(input.tag);
    const t = byTag.get(tag);
    if (!t) out.push({ tag, id: null, ok: false, cost: 0, error: "No task returned" });
    else if (t.status_code === DFS_CODES.created || t.status_code === DFS_CODES.ok) out.push({ tag, id: t.id, ok: true, cost: envelopeCost(t) });
    else out.push({ tag, id: t.id || null, ok: false, cost: envelopeCost(t), error: t.status_message ?? String(t.status_code), code: t.status_code });
  }
  return { posted: out, cost: envelopeCost(env) };
}

export interface ReadyTask {
  id: string;
  tag: string | null;
}

export async function serpTasksReady(): Promise<ReadyTask[]> {
  const env = await dfsCall<{ id?: string; tag?: string | null }>("GET", "/serp/google/organic/tasks_ready", undefined, 20_000);
  const out: ReadyTask[] = [];
  for (const t of env.tasks ?? []) {
    if (t.status_code !== DFS_CODES.ok) continue;
    for (const r of t.result ?? []) if (r?.id) out.push({ id: r.id, tag: r.tag ?? null });
  }
  return out;
}

export type TaskGetOutcome =
  | { state: "done"; result: SerpResult; tag: string | null }
  | { state: "no-results"; tag: string | null }
  | { state: "pending" }
  | { state: "failed"; retry: boolean; error: string; code?: number };

export async function serpTaskGet(id: string): Promise<TaskGetOutcome> {
  if (!/^[\w-]{8,80}$/.test(id)) return { state: "failed", retry: false, error: "Bad task id" };
  let env;
  try {
    env = await dfsCall<SerpResult>("GET", `/serp/google/organic/task_get/advanced/${id}`, undefined, 30_000);
  } catch (err) {
    return { state: "failed", retry: true, error: err instanceof DfsError ? err.message : "DataForSEO unreachable", code: err instanceof DfsError ? err.code : undefined };
  }
  const t = env.tasks?.[0];
  if (!t) return { state: "failed", retry: true, error: "No task in response" };
  const tag = typeof t.data?.tag === "string" ? t.data.tag : null;
  if (t.status_code === DFS_CODES.ok) {
    const r = t.result?.[0];
    return r ? { state: "done", result: r, tag } : { state: "no-results", tag };
  }
  if (t.status_code === DFS_CODES.noResults) return { state: "no-results", tag };
  if (t.status_code === DFS_CODES.inQueue || t.status_code === DFS_CODES.handed) return { state: "pending" };
  const retry = t.status_code === DFS_CODES.executionFailed || t.status_code >= 50000 || t.status_code === DFS_CODES.rateLimit || t.status_code === DFS_CODES.tooManySimultaneous;
  return { state: "failed", retry, error: t.status_message ?? String(t.status_code), code: t.status_code };
}
