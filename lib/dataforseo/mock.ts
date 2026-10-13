import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { DfsEnvelope, DfsTask } from "./client";
import { serpPages, DFS_PRICES, labsCost } from "./prices";

/*
 * Development-only DataForSEO simulator, active when DATAFORSEO_FIXTURES_DIR is set outside production. It answers
 * from responses saved from the real API:
 *   live-serp.json  - /v3/serp/google/organic/live/advanced (same item shape as task_get/advanced)
 *   live-labs.json  - /v3/dataforseo_labs/google/ranked_keywords/live
 * and simulates the Standard queue lifecycle (task_post -> tasks_ready -> task_get) in memory, so the scheduler,
 * collector and UI can be exercised without spending credit. Rankings are rotated per keyword and post time so
 * keywords land at different positions and move between checks; DFS_MOCK_READY_MS (default 4000) controls how long a task stays queued.
 */

interface MockTask {
  id: string;
  postedAt: number;
  data: Record<string, unknown>;
  collected: boolean;
}

const g = globalThis as unknown as { __dfsMock?: Map<string, MockTask> };
const tasks = (g.__dfsMock ??= new Map<string, MockTask>());

const readyMs = () => Number(process.env.DFS_MOCK_READY_MS ?? 4000);

function load(dir: string, name: string): DfsEnvelope<Record<string, unknown>> {
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) as DfsEnvelope<Record<string, unknown>>;
}

const envelope = <R,>(list: DfsTask<R>[], cost = 0): DfsEnvelope<R> => ({
  version: "mock",
  status_code: 20000,
  status_message: "Ok.",
  time: "0 sec.",
  cost,
  tasks_count: list.length,
  tasks_error: list.filter((t) => t.status_code >= 40000).length,
  tasks: list,
});

const hash = (s: string) => crypto.createHash("sha1").update(s).digest().readUInt32BE(0);

/** The saved SERP with the organic block rotated by a keyword-dependent amount, ranks renumbered. */
function serpFor(dir: string, keyword: string, depth: number, seed: string): Record<string, unknown> {
  const live = load(dir, "live-serp.json");
  const result = structuredClone(live.tasks?.[0]?.result?.[0] ?? {}) as Record<string, unknown> & { items?: Record<string, unknown>[] };
  const items = result.items ?? [];
  const organic = items.filter((i) => i.type === "organic");
  const shift = organic.length ? hash(keyword + seed) % organic.length : 0;
  const rotated = [...organic.slice(shift), ...organic.slice(0, shift)];
  let o = 0;
  let abs = 0;
  const out: Record<string, unknown>[] = [];
  for (const it of items) {
    abs += 1;
    if (it.type === "organic") {
      const src = rotated[o++];
      out.push({ ...src, rank_group: o, rank_absolute: abs, page: Math.ceil(o / 10) });
    } else {
      out.push({ ...it, rank_absolute: abs });
    }
  }
  const capped = out.filter((i) => i.type !== "organic" || (i.rank_group as number) <= depth);
  return { ...result, keyword, items: capped, items_count: capped.length };
}

export async function mockCall<R>(dir: string, method: "GET" | "POST", p: string, body?: unknown[]): Promise<DfsEnvelope<R>> {
  const now = Date.now();

  if (method === "POST" && p === "/serp/google/organic/task_post") {
    const list = (body ?? []) as Record<string, unknown>[];
    if (list.length > 100) return { status_code: 20000, tasks: [{ id: "", status_code: 40006, status_message: "You can set no more than 100 tasks at a time." }] } as DfsEnvelope<R>;
    const out = list.map((t) => {
      const id = crypto.randomUUID();
      const data = { api: "serp", function: "task_post", se: "google", se_type: "organic", ...t };
      tasks.set(id, { id, postedAt: now, data, collected: false });
      const cost = serpPages(Number(t.depth ?? 10)) * DFS_PRICES.serpStandardPerPage;
      return { id, status_code: 20100, status_message: "Task Created.", cost, result_count: 0, data, result: null } as DfsTask<R>;
    });
    return envelope(out, out.reduce((s, t) => s + (t.cost ?? 0), 0));
  }

  if (method === "GET" && p === "/serp/google/organic/tasks_ready") {
    const ready = [...tasks.values()].filter((t) => !t.collected && now - t.postedAt >= readyMs()).slice(0, 1000);
    const result = ready.map((t) => ({
      id: t.id,
      se: "google",
      se_type: "organic",
      date_posted: new Date(t.postedAt).toISOString().replace("T", " ").slice(0, 19) + " +00:00",
      tag: t.data.tag ?? null,
      endpoint_regular: `/v3/serp/google/organic/task_get/regular/${t.id}`,
      endpoint_advanced: `/v3/serp/google/organic/task_get/advanced/${t.id}`,
      endpoint_html: `/v3/serp/google/organic/task_get/html/${t.id}`,
    }));
    return envelope([{ id: crypto.randomUUID(), status_code: 20000, status_message: "Ok.", cost: 0, result_count: result.length, result: result as R[] }]);
  }

  const get = p.match(/^\/serp\/google\/organic\/task_get\/advanced\/([\w-]+)$/);
  if (method === "GET" && get) {
    const t = tasks.get(get[1]);
    if (!t) return envelope([{ id: get[1], status_code: 40401, status_message: "Task Not Found." }]);
    if (now - t.postedAt < readyMs()) return envelope([{ id: t.id, status_code: 40602, status_message: "Task In Queue.", data: t.data, result: null }]);
    t.collected = true;
    const result = serpFor(dir, decodeURIComponent(String(t.data.keyword ?? "")), Number(t.data.depth ?? 10), String(t.postedAt));
    return envelope([{ id: t.id, status_code: 20000, status_message: "Ok.", cost: 0, result_count: 1, data: t.data, result: [result as R] }]);
  }

  if (method === "POST" && p === "/dataforseo_labs/google/ranked_keywords/live") {
    const req = ((body ?? [])[0] ?? {}) as { target?: string; limit?: number };
    const live = load(dir, "live-labs.json");
    const res = structuredClone(live.tasks?.[0]?.result?.[0] ?? {}) as Record<string, unknown> & { items?: unknown[] };
    const items = (res.items ?? []).slice(0, req.limit ?? 100);
    const cost = labsCost(items.length);
    return envelope([{ id: crypto.randomUUID(), status_code: 20000, status_message: "Ok.", cost, result_count: 1, data: { ...req }, result: [{ ...res, target: req.target ?? res.target, items, items_count: items.length } as R] }], cost);
  }

  if (method === "GET" && p === "/appendix/user_data") {
    const balance = Number(process.env.DFS_MOCK_BALANCE ?? 25);
    return envelope([{ id: crypto.randomUUID(), status_code: 20000, status_message: "Ok.", cost: 0, result_count: 1, result: [{ login: "mock", money: { total: balance, balance } } as R] }]);
  }

  const loc = p.match(/^\/serp\/google\/locations\/([a-z]{2})$/);
  if (method === "GET" && loc) {
    // Hand-made sample in the documented shape (location_code / location_name / location_code_parent / country_iso_code / location_type).
    const iso = loc[1].toUpperCase();
    const sample: Record<string, [number, string][]> = {
      US: [
        [1023191, "New York,New York,United States"],
        [1013962, "Los Angeles,California,United States"],
        [1016367, "Chicago,Illinois,United States"],
      ],
      GB: [[1006886, "London,England,United Kingdom"]],
    };
    const result = (sample[iso] ?? []).map(([code, name]) => ({ location_code: code, location_name: name, location_code_parent: null, country_iso_code: iso, location_type: "City" }));
    return envelope([{ id: crypto.randomUUID(), status_code: 20000, status_message: "Ok.", cost: 0, result_count: result.length, result: result as R[] }]);
  }

  return envelope([{ id: crypto.randomUUID(), status_code: 40402, status_message: `Mock has no fixture for ${method} ${p}` }]);
}
