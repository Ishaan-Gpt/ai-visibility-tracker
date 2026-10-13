import "server-only";

/*
 * Shared DataForSEO v3 transport (https://docs.dataforseo.com/v3/). Basic auth from DATAFORSEO_LOGIN /
 * DATAFORSEO_PASSWORD. Returns the raw envelope so callers can read per-task status codes and the `cost`
 * DataForSEO charged (which the spend guard records).
 *
 * Test mode: when DATAFORSEO_FIXTURES_DIR is set AND this is not a production build, every call is answered by
 * ./mock.ts from saved responses instead of the network. Production builds ignore the variable entirely.
 */

export interface DfsTask<R = unknown> {
  id: string;
  status_code: number;
  status_message?: string;
  time?: string;
  cost?: number;
  result_count?: number;
  path?: string[];
  data?: Record<string, unknown>;
  result?: R[] | null;
}

export interface DfsEnvelope<R = unknown> {
  version?: string;
  status_code: number;
  status_message?: string;
  time?: string;
  cost?: number;
  tasks_count?: number;
  tasks_error?: number;
  tasks?: DfsTask<R>[];
}

/** Documented task status codes we branch on (https://docs.dataforseo.com/v3/appendix/errors/). */
export const DFS_CODES = {
  ok: 20000,
  created: 20100,
  noResults: 40102,
  executionFailed: 40103,
  paymentRequired: 40200,
  rateLimit: 40202,
  costLimit: 40203,
  tooManySimultaneous: 40209,
  insufficientFunds: 40210,
  notFound: 40400,
  taskNotFound: 40401,
  resultsExpired: 40403,
  invalidField: 40501,
  handed: 40601,
  inQueue: 40602,
} as const;

export class DfsError extends Error {
  readonly code?: number;
  readonly httpStatus?: number;
  constructor(message: string, code?: number, httpStatus?: number) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
  /** Money/limit problems: pause paid calls instead of retrying. */
  get isBilling(): boolean {
    return this.httpStatus === 402 || this.code === DFS_CODES.paymentRequired || this.code === DFS_CODES.insufficientFunds || this.code === DFS_CODES.costLimit;
  }
}

/** Fixture directory, honoured only outside production builds. */
export function fixturesDir(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  return process.env.DATAFORSEO_FIXTURES_DIR || null;
}

export function dfsConfigured(): boolean {
  return Boolean(fixturesDir() || (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD));
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`;
}

/**
 * One HTTP call. Throws DfsError on transport, HTTP or envelope-level failures; per-task failures are left in
 * `tasks[]` for the caller (a batch can partly succeed).
 */
export async function dfsCall<R = unknown>(method: "GET" | "POST", path: string, body?: unknown[], timeoutMs = 30_000): Promise<DfsEnvelope<R>> {
  const dir = fixturesDir();
  if (dir) {
    const { mockCall } = await import("./mock");
    return mockCall<R>(dir, method, path, body);
  }
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) throw new DfsError("DataForSEO is not configured");
  let res: Response;
  try {
    res = await fetch(`https://api.dataforseo.com/v3${path}`, {
      method,
      headers: { Authorization: authHeader(), ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    throw new DfsError(`DataForSEO unreachable: ${err instanceof Error ? err.message : "network error"}`);
  }
  if (res.status === 401) throw new DfsError("DataForSEO rejected the credentials", 40100, 401);
  if (res.status === 402) throw new DfsError("DataForSEO account balance is too low", DFS_CODES.paymentRequired, 402);
  if (!res.ok) throw new DfsError(`DataForSEO HTTP ${res.status}`, undefined, res.status);
  const json = (await res.json()) as DfsEnvelope<R>;
  if (json.status_code !== DFS_CODES.ok) throw new DfsError(`DataForSEO: ${json.status_message ?? json.status_code}`, json.status_code, res.status);
  return json;
}

/** Envelope cost as a number (DataForSEO returns a float; be defensive about strings). */
export function envelopeCost(env: { cost?: number | string } | null | undefined): number {
  const n = Number(env?.cost ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
