/** Bounded-concurrency map. Results keep input order; items not started before `deadline` resolve to `skipped`. */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  opts: { deadline?: number } = {},
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      if (opts.deadline && Date.now() > opts.deadline) throw new DeadlineError();
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}

/** Like mapLimit, but never throws: each item settles to a value or an error, and late items are marked skipped. */
export async function settleLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  opts: { deadline?: number } = {},
): Promise<({ ok: true; value: R } | { ok: false; error: unknown; skipped?: boolean })[]> {
  const out = new Array<{ ok: true; value: R } | { ok: false; error: unknown; skipped?: boolean }>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      if (opts.deadline && Date.now() > opts.deadline) {
        out[i] = { ok: false, error: new DeadlineError(), skipped: true };
        continue;
      }
      try {
        out[i] = { ok: true, value: await fn(items[i], i) };
      } catch (error) {
        out[i] = { ok: false, error };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return out;
}

export class DeadlineError extends Error {
  constructor() {
    super("Time budget exhausted");
  }
}
