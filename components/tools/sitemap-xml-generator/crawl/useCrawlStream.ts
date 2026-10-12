"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CrawlProgress } from "@/lib/crawl/types";
import type { QuotaInfo } from "@/components/tools/shell/Bits";

export type StreamStatus = "idle" | "running" | "done" | "error";

/**
 * Posts to a streaming tool route and reads its NDJSON events: a meta line (quota, cap),
 * progress lines, then exactly one result or error line.
 */
export function useCrawlStream<T>(endpoint: string) {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<{ message: string; limited?: boolean } | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (body: Record<string, unknown>): Promise<T | null> => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setStatus("running");
      setError(null);
      setProgress(null);
      setStartedAt(Date.now());
      let final: T | null = null;
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ac.signal });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({ error: "Unexpected response from the server." }));
          if (data.quota) setQuota(data.quota as QuotaInfo);
          throw Object.assign(new Error(data.error ?? "Something went wrong."), { limited: !!data.limited });
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let failed: string | null = null;
        const handle = (line: string) => {
          if (!line.trim()) return;
          let ev: { type: string; [k: string]: unknown };
          try {
            ev = JSON.parse(line);
          } catch {
            return;
          }
          if (ev.type === "meta") {
            if (ev.quota) setQuota(ev.quota as QuotaInfo);
            setMeta(ev);
          } else if (ev.type === "progress") setProgress(ev.progress as CrawlProgress);
          else if (ev.type === "result") final = ev.data as T;
          else if (ev.type === "error") failed = String(ev.message ?? "Something went wrong.");
        };
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            handle(buf.slice(0, nl));
            buf = buf.slice(nl + 1);
          }
        }
        handle(buf);
        if (failed) throw new Error(failed);
        if (!final) throw new Error("The connection closed before the crawl finished. Please try again.");
        setResult(final);
        setStatus("done");
        return final;
      } catch (e) {
        if (ac.signal.aborted) {
          setStatus(final ? "done" : "idle");
          return null;
        }
        setError({ message: e instanceof Error ? e.message : "Something went wrong.", limited: (e as { limited?: boolean }).limited });
        setStatus("error");
        return null;
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [endpoint],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setProgress(null);
  }, []);

  return { status, progress, result, setResult, error, quota, meta, startedAt, run, cancel };
}

export function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
