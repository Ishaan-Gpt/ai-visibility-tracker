"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuotaInfo } from "@/components/tools/shell/Bits";

const autoRan = new Set<string>();

/**
 * Runs a fetch-based tool against its API route, with paced progress stages, quota tracking,
 * `?url=` auto-run (from the landing page) and `?report=<id>` restore (from saved history).
 */
export function useToolRun<T>(endpoint: string, stageCount: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<{ message: string; limited?: boolean } | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const booted = useRef(false);

  const run = useCallback(
    async (url: string) => {
      if (!url.trim()) return;
      setLoading(true);
      setError(null);
      setSavedId(null);
      setStep(0);
      timer.current = setInterval(() => setStep((s) => Math.min(stageCount - 1, s + 1)), 900);
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
        const body = await res.json().catch(() => ({ error: "Unexpected response." }));
        if (body.quota) setQuota(body.quota as QuotaInfo);
        if (!res.ok) throw Object.assign(new Error(body.error ?? "Something went wrong."), { limited: !!body.limited });
        setStep(stageCount);
        setData(body as T);
        const u = new URL(window.location.href);
        u.searchParams.set("url", url);
        u.searchParams.delete("report");
        u.searchParams.delete("run");
        window.history.replaceState(null, "", u);
      } catch (e) {
        setError({ message: e instanceof Error ? e.message : "Something went wrong.", limited: (e as { limited?: boolean }).limited });
      } finally {
        if (timer.current) clearInterval(timer.current);
        setLoading(false);
      }
    },
    [endpoint, stageCount],
  );

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  /** Returns the initial input value from the URL, auto-running or restoring as appropriate. */
  const boot = useCallback(
    (setInput: (v: string) => void) => {
      if (booted.current) return;
      booted.current = true;
      const params = new URLSearchParams(window.location.search);
      const reportId = params.get("report");
      const url = params.get("url");
      if (reportId) {
        setLoading(true);
        fetch(`/api/history?id=${encodeURIComponent(reportId)}`)
          .then(async (r) => {
            const body = await r.json();
            if (!r.ok) throw new Error(body.error ?? "Could not open that report.");
            setData(body.report as T);
            setSavedId(reportId);
            const subject = (body.report as { finalUrl?: string; domain?: string }).finalUrl ?? (body.report as { domain?: string }).domain;
            if (subject) setInput(subject);
          })
          .catch((e) => setError({ message: e instanceof Error ? e.message : "Could not open that report." }))
          .finally(() => setLoading(false));
      } else if (url) {
        setInput(url);
        if (params.get("run") === "1") {
          // Strip the flag first so a remount (or reload) can never spend a second run.
          const clean = new URL(window.location.href);
          clean.searchParams.delete("run");
          window.history.replaceState(null, "", clean);
          if (!autoRan.has(window.location.pathname + url)) {
            autoRan.add(window.location.pathname + url);
            run(url);
          }
        }
      }
    },
    [run],
  );

  return { data, loading, step, error, quota, run, boot, savedId };
}
