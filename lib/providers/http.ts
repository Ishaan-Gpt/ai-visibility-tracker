import "server-only";

export class EngineHttpError extends Error {
  readonly engine: string;
  readonly status: number;
  constructor(engine: string, status: number, detail: string) {
    super(`${engine} returned ${status}: ${detail.slice(0, 200)}`);
    this.engine = engine;
    this.status = status;
  }
}

/** JSON POST with a timeout and one retry on 429/5xx. Error bodies are truncated and never include keys. */
export async function postJson(engine: string, url: string, headers: Record<string, string>, body: unknown, timeoutMs = 60_000): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (res.ok) return res.json();
    const text = await res.text().catch(() => "");
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt === 0) {
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
      continue;
    }
    throw new EngineHttpError(engine, res.status, text);
  }
}
