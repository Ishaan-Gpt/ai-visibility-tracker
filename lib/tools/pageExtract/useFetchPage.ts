"use client";

import { useCallback, useRef, useState } from "react";
import type { PageExtract } from "@/lib/tools/pageExtract/types";

/** Same shape as components/tools/shell/Bits QuotaInfo, so it can be passed to <QuotaNote>. */
export interface FetchQuota {
  tier: "anon" | "free" | "pro";
  limit: number;
  used: number;
  remaining: number;
}

export interface FetchPageError {
  message: string;
  limited?: boolean;
}

export async function requestPageExtract(url: string, opts: { probeImages?: boolean; signal?: AbortSignal } = {}): Promise<{ page: PageExtract; quota: FetchQuota | null }> {
  const res = await fetch("/api/tools/fetch-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, probeImages: !!opts.probeImages }),
    signal: opts.signal,
  });
  const body = (await res.json().catch(() => ({ error: "Unexpected response from the server." }))) as { page?: PageExtract; quota?: FetchQuota; error?: string; limited?: boolean };
  if (!res.ok || !body.page) {
    throw Object.assign(new Error(body.error ?? "Could not load that page."), { limited: !!body.limited, quota: body.quota ?? null });
  }
  return { page: body.page, quota: body.quota ?? null };
}

/** Loads one page through /api/tools/fetch-page with loading / error / quota state. Stale responses are dropped. */
export function useFetchPage() {
  const [page, setPage] = useState<PageExtract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FetchPageError | null>(null);
  const [quota, setQuota] = useState<FetchQuota | null>(null);
  const seq = useRef(0);

  const load = useCallback(async (url: string, opts: { probeImages?: boolean } = {}): Promise<PageExtract | null> => {
    if (!url.trim()) return null;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const r = await requestPageExtract(url, opts);
      if (id !== seq.current) return null;
      setPage(r.page);
      if (r.quota) setQuota(r.quota);
      return r.page;
    } catch (e) {
      if (id !== seq.current) return null;
      const err = e as Error & { limited?: boolean; quota?: FetchQuota | null };
      if (err.quota) setQuota(err.quota);
      setError({ message: err.message || "Could not load that page.", limited: err.limited });
      return null;
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    seq.current++;
    setPage(null);
    setError(null);
    setLoading(false);
  }, []);

  return { page, loading, error, quota, load, reset, setQuota };
}
