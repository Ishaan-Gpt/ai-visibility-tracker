"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Glass } from "@/components/studio/Glass";
import { IconAlert, IconRerun } from "@/components/icons/Icons";
import { timeAgo, timeUntil } from "./format";

interface Props {
  /** Start the free first check on mount (right after onboarding). */
  autoStart: boolean;
  /** A check is already in flight (lock held) when the page rendered. */
  running: boolean;
  lastCheckedAt: number | null;
  nextCheckAt: number | null;
  lastRunError: string | null;
  activePrompts: number;
  engines: string[];
  quota: { remaining: number; limit: number } | null;
  /** First check is free and doesn't need quota. */
  neverChecked: boolean;
}

type Phase = { kind: "idle" } | { kind: "running"; startedAt: number } | { kind: "done"; answers: number; failed: number; seconds: number } | { kind: "error"; message: string };

/** Rough per-answer time (engine answer + analysis) and the server's concurrency, for an honest ETA. */
const SECONDS_PER_ANSWER = 22;
const CONCURRENCY = 8;

/** A watch hand sweeping a dial: the in-progress mark. */
function Sweep() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <circle cx="20" cy="20" r="16" fill="rgba(255,255,255,.5)" stroke="rgba(43,41,39,.12)" strokeWidth="1.2" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const q = (n: number) => Math.round(n * 100) / 100; // identical strings on server and client
        return <line key={i} x1={q(20 + Math.cos(a) * 13.5)} y1={q(20 + Math.sin(a) * 13.5)} x2={q(20 + Math.cos(a) * 15.5)} y2={q(20 + Math.sin(a) * 15.5)} stroke="rgba(43,41,39,.25)" strokeWidth="1" />;
      })}
      <g className="origin-center animate-spin [animation-duration:2.4s]" style={{ transformBox: "fill-box" }}>
        <line x1="20" y1="20" x2="20" y2="7" stroke="#d5855a" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <circle cx="20" cy="20" r="2.2" fill="#2b2927" />
    </svg>
  );
}

export default function RunBar({ autoStart, running, lastCheckedAt, nextCheckAt, lastRunError, activePrompts, engines, quota, neverChecked }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(() => (running ? { kind: "running", startedAt: Date.now() } : { kind: "idle" }));
  const [now, setNow] = useState(() => Date.now());
  const started = useRef(false);
  const total = activePrompts * Math.max(engines.length, 1);
  const expected = Math.max(15, Math.ceil(total / CONCURRENCY) * SECONDS_PER_ANSWER);

  const run = useCallback(
    async (initial: boolean) => {
      setPhase({ kind: "running", startedAt: Date.now() });
      try {
        const res = await fetch("/api/visibility/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initial }) });
        const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string; answers?: number; failed?: number; elapsedMs?: number };
        if (res.status === 409) {
          // Someone (another tab, the scheduler) is already checking: wait for it instead of failing.
          setPhase({ kind: "running", startedAt: Date.now() });
          return;
        }
        if (!res.ok) {
          setPhase({ kind: "error", message: data.error ?? "The check didn't complete. Try again shortly." });
          return;
        }
        setPhase({ kind: "done", answers: data.answers ?? 0, failed: data.failed ?? 0, seconds: Math.round((data.elapsedMs ?? 0) / 1000) });
        router.refresh();
      } catch {
        setPhase({ kind: "error", message: "Lost connection while checking. The check may still finish; refresh in a minute." });
      }
    },
    [router],
  );

  useEffect(() => {
    if (autoStart && !running && !started.current && activePrompts > 0) {
      started.current = true;
      // Drop ?first=1 so a reload doesn't try again.
      window.history.replaceState(null, "", window.location.pathname);
      void run(true);
    }
  }, [autoStart, running, activePrompts, run]);

  // Tick the elapsed clock, and poll the server when a check started elsewhere is in flight.
  const isRunning = phase.kind === "running";
  useEffect(() => {
    if (!isRunning) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/visibility/run", { cache: "no-store" });
        if (res.status === 401 || res.status === 404) {
          setPhase({ kind: "idle" });
          return;
        }
        const data = (await res.json()) as { running?: boolean };
        if (res.ok && data.running === false) {
          setPhase((p) => (p.kind === "running" ? { kind: "done", answers: 0, failed: 0, seconds: 0 } : p));
          router.refresh();
        }
      } catch {
        /* keep waiting */
      }
    }, 6000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [isRunning, router]);

  const elapsed = phase.kind === "running" ? Math.max(0, Math.round((now - phase.startedAt) / 1000)) : 0;
  const progress = phase.kind === "running" ? Math.min(0.94, 1 - Math.exp(-elapsed / (expected * 0.75))) : 0;
  const canRun = activePrompts > 0 && (neverChecked || !quota || quota.remaining > 0);

  return (
    <Glass className="mb-5 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        {phase.kind === "running" ? (
          <>
            <Sweep />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-ds-ink">
                Asking {engines.join(", ") || "the engines"} {activePrompts} prompt{activePrompts === 1 ? "" : "s"}
                <span className="font-normal text-ds-ink-2"> · {elapsed}s</span>
              </p>
              <p className="text-[13px] text-ds-ink-2">Reading each answer for mentions, position, sources and sentiment. Usually under {Math.ceil(expected / 10) * 10}s; you can leave this page.</p>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-ds-ink">
                {lastCheckedAt ? (
                  <>
                    Last checked <span className="font-medium">{timeAgo(lastCheckedAt, now)}</span>
                    {nextCheckAt && <span className="text-ds-ink-2"> · next scheduled check {timeUntil(nextCheckAt, now)}</span>}
                  </>
                ) : (
                  <>Not checked yet</>
                )}
              </p>
              <p className="text-[13px] text-ds-ink-2">
                {phase.kind === "done" && phase.answers > 0
                  ? `Done: ${phase.answers} answer${phase.answers === 1 ? "" : "s"} analysed in ${phase.seconds}s${phase.failed ? `, ${phase.failed} failed` : ""}.`
                  : phase.kind === "done"
                    ? "Check finished."
                    : activePrompts === 0
                      ? "Add or resume a prompt to run a check."
                      : neverChecked
                        ? "Your first check is free and takes about a minute."
                        : quota
                          ? `${quota.remaining} of ${quota.limit} on-demand checks left today. Scheduled checks don't count.`
                          : "Runs every active prompt on every active engine."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => run(neverChecked)}
              disabled={!canRun}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ds-ink px-5 text-[14.5px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconRerun className="h-4 w-4" /> {neverChecked ? "Run first check" : "Run check now"}
            </button>
          </>
        )}
      </div>
      {phase.kind === "running" && (
        <div className="h-1 w-full bg-white/40">
          <div className="h-full bg-[linear-gradient(90deg,#f6c3a2,#d5855a)] transition-[width] duration-1000 ease-out" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      {(phase.kind === "error" || (phase.kind === "idle" && lastRunError)) && (
        <p className="flex items-start gap-2 border-t border-white/60 px-5 py-3 text-[13.5px] text-ds-danger">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {phase.kind === "error" ? phase.message : `Last check had problems: ${lastRunError}`}
        </p>
      )}
    </Glass>
  );
}
