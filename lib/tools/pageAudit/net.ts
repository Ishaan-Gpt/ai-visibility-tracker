import { safeFetch, type SafeFetchOptions, type SafeResponse } from "@/lib/net/safeFetch";

export type Probe = { ok: true; res: SafeResponse; ms: number } | { ok: false; error: string; code?: string; timeout: boolean; ms: number };

/**
 * A secondary fetch that never throws and never outlives `hardMs` (safeFetch's own timeout is per socket idle,
 * not a wall clock, so a slow-drip server could otherwise hold the audit open).
 */
export async function tryFetch(url: string, opts: SafeFetchOptions, hardMs: number): Promise<Probe> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<Probe>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, error: "Timed out", timeout: true, ms: Date.now() - started }), Math.max(250, hardMs));
  });
  const attempt = safeFetch(url, { ...opts, timeoutMs: Math.min(opts.timeoutMs ?? hardMs, hardMs) })
    .then((res): Probe => ({ ok: true, res, ms: Date.now() - started }))
    .catch((err: unknown): Probe => {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code ?? msg.match(/\(([A-Z_]+)\)/)?.[1];
      return { ok: false, error: msg, code, timeout: /too long|ETIMEDOUT|timed out/i.test(msg), ms: Date.now() - started };
    });
  try {
    return await Promise.race([attempt, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

/** Milliseconds left before `deadline`, never below `floor`. */
export function remaining(deadline: number, floor = 0): number {
  return Math.max(floor, deadline - Date.now());
}

export function sameSite(a: string, b: string): boolean {
  return a.replace(/^www\./, "") === b.replace(/^www\./, "");
}

/** Normalises for equality checks: no hash, no trailing slash (except root), lowercase host. */
export function urlKey(u: string): string {
  try {
    const x = new URL(u);
    x.hash = "";
    let s = `${x.protocol}//${x.host.toLowerCase()}${x.pathname}${x.search}`;
    if (s.endsWith("/") && x.pathname !== "/") s = s.slice(0, -1);
    return s;
  } catch {
    return u;
  }
}
