import "server-only";
import type { CrawlProgress, StreamEvent } from "@/lib/crawl/types";

/**
 * Streams NDJSON events: `{"type":"progress",...}` lines while `run` works, then exactly one
 * `{"type":"result"}` or `{"type":"error"}` line. A heartbeat line keeps proxies from timing out
 * the connection during long quiet stretches.
 */
export function ndjsonResponse<T>(
  run: (progress: (p: CrawlProgress) => void, signal: AbortSignal) => Promise<T>,
  opts: { signal?: AbortSignal; extra?: Record<string, unknown>; onError?: (err: unknown) => string } = {},
): Response {
  const encoder = new TextEncoder();
  const ac = new AbortController();
  opts.signal?.addEventListener("abort", () => ac.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (ev: StreamEvent<T> | { type: "heartbeat" } | { type: "meta"; [k: string]: unknown }) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(ev)}\n`));
        } catch {
          closed = true;
        }
      };
      if (opts.extra) send({ type: "meta", ...opts.extra });
      const hb = setInterval(() => send({ type: "heartbeat" }), 10_000);
      try {
        const data = await run((progress) => send({ type: "progress", progress }), ac.signal);
        send({ type: "result", data });
      } catch (err) {
        send({ type: "error", message: opts.onError ? opts.onError(err) : err instanceof Error ? err.message : "Something went wrong." });
      } finally {
        clearInterval(hb);
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      ac.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
