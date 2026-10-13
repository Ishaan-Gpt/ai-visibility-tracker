"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconAlert, IconRerun, IconSpinner } from "@/components/icons/Icons";
import { Glass } from "@/components/studio/Glass";
import type { DashboardData } from "@/lib/rank-tracker/view";
import type { RtProject } from "@/lib/rank-tracker/types";
import { EmptyMark, softButton } from "./bits";
import { DomainKeywords } from "./DomainKeywords";
import { countryName, languageName, timeAgo, todayUtc } from "./format";
import { KeywordDetail } from "./KeywordDetail";
import { KeywordTable } from "./KeywordTable";
import { Overview } from "./Overview";
import { ProjectForm } from "./ProjectForm";

type Tab = "rankings" | "domains";
const POLL_MS = 8000;

function timeUntil(ts: number, now: number): string {
  const h = Math.round((ts - now) / 3_600_000);
  if (h <= 0) return "within the hour";
  if (h < 36) return `in about ${h} h`;
  const d = Math.round(h / 24);
  return `in ${d} day${d === 1 ? "" : "s"}`;
}

export function RankTrackerApp({ initial, initialTab, domainRows }: { initial: DashboardData; initialTab: Tab; domainRows: number }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [mode, setMode] = useState<"view" | "create" | "edit">(initial.projects.length ? "view" : "create");
  const [detail, setDetail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const today = todayUtc();
  const project = data.project;
  const closeDetail = useCallback(() => setDetail(null), []);

  // A fresh server render (project switch) replaces local state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopt new server data after navigation
    setData(initial);
  }, [initial]);

  const refresh = useCallback(
    async (collect = false) => {
      if (!project) return;
      try {
        const res = await fetch(`/api/rank-tracker/projects/${project.id}${collect ? "?collect=1" : ""}`, { cache: "no-store" });
        if (res.ok) setData((await res.json()) as DashboardData);
      } catch {
        /* keep the current view */
      }
    },
    [project],
  );

  // Poll while checks are in flight; each poll also collects finished tasks for this project.
  const inFlight = data.inFlight;
  useEffect(() => {
    if (!inFlight || !project) return;
    const t = setInterval(() => {
      setNow(Date.now());
      void refresh(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [inFlight, project, refresh]);

  async function checkNow() {
    if (!project) return;
    setChecking(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/rank-tracker/projects/${project.id}/check`, { method: "POST" });
      const d = (await res.json().catch(() => ({}))) as { posted?: number; skipped?: number; paused?: string | null; error?: string };
      if (!res.ok) setMessage({ ok: false, text: d.error ?? "The check couldn't start." });
      else
        setMessage({
          ok: true,
          text: `Checking ${d.posted} keyword${d.posted === 1 ? "" : "s"}. Results usually arrive within a few minutes; you can leave this page.${d.paused ? ` Some were held back: ${d.paused}` : ""}`,
        });
      await refresh();
    } finally {
      setChecking(false);
    }
  }

  const stats = useMemo(() => {
    const lastChecked = Math.max(0, ...data.keywords.map((k) => k.last?.checkedAt ?? 0)) || null;
    const due = data.keywords.filter((k) => !k.pendingTaskId).map((k) => k.nextDueAt ?? 0);
    const nextDue = due.length ? Math.min(...due) : null;
    const neverChecked = data.keywords.filter((k) => !k.last).length;
    const checkable = data.keywords.filter((k) => !k.pendingTaskId && k.last?.date !== today).length;
    return { lastChecked, nextDue, neverChecked, checkable };
  }, [data.keywords, today]);

  const cadence = data.plan.cadenceDays === 1 ? "daily" : data.plan.cadenceDays === 7 ? "weekly" : `every ${data.plan.cadenceDays} days`;

  function onSaved(p: RtProject) {
    setMode("view");
    setMessage({ ok: true, text: mode === "create" ? "Project created. Add the keywords you want to track." : "Saved. Changes apply from the next check." });
    router.push(`/app/rank-tracker?project=${p.id}`, { scroll: false });
    router.refresh();
  }

  async function deleteProject() {
    if (!project || !window.confirm(`Delete ${project.domain} and all of its keywords and history? This can't be undone.`)) return;
    const res = await fetch(`/api/rank-tracker/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      setMode("view");
      router.push("/app/rank-tracker", { scroll: false });
      router.refresh();
    } else setMessage({ ok: false, text: "Couldn't delete the project." });
  }

  const tabs = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex gap-1 rounded-[14px] bg-white/45 p-1" role="tablist" aria-label="Rank Tracker views">
        {(
          [
            ["rankings", "Rankings"],
            ["domains", "Domain keywords"],
          ] as const
        ).map(([t, l]) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              window.history.replaceState(null, "", t === "domains" ? `/app/rank-tracker?tab=domains${project ? `&project=${project.id}` : ""}` : `/app/rank-tracker${project ? `?project=${project.id}` : ""}`);
            }}
            className={`h-9 rounded-[11px] px-4 text-[14px] transition-colors ${tab === t ? "bg-white text-ds-ink shadow-sm" : "text-ds-ink-2 hover:text-ds-ink"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "rankings" && data.projects.length > 0 && mode === "view" && (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {data.projects.length > 1 && (
            <select
              value={project?.id ?? ""}
              onChange={(e) => router.push(`/app/rank-tracker?project=${e.target.value}`, { scroll: false })}
              aria-label="Project"
              className="glass-inset h-9 max-w-[220px] rounded-[11px] px-3 text-[14px] text-ds-ink outline-none"
            >
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.device}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => setMode("edit")} className={softButton}>
            Settings
          </button>
          {data.projects.length < data.plan.projectLimit && (
            <button type="button" onClick={() => setMode("create")} className={softButton}>
              New project
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (tab === "domains") {
    return (
      <>
        {tabs}
        <DomainKeywords defaultDomain={project?.domain ?? ""} defaultCountry={project?.country ?? "us"} lookupsLeft={data.plan.lookupsLeft} lookupsLimit={data.plan.lookupsLimit} rowLimit={domainRows} />
      </>
    );
  }

  if (mode !== "view" || !project) {
    return (
      <>
        {tabs}
        <Glass className="p-5 sm:p-7">
          {mode === "create" && !data.projects.length && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <EmptyMark className="h-16 w-28 shrink-0" />
              <div>
                <h2 className="font-serif text-[30px] leading-[1.05]">
                  Start with your <span className="italic">domain</span>
                </h2>
                <p className="mt-1 max-w-[560px] text-[14px] leading-6 text-ds-ink-2">
                  Pick where you want to rank (country or city, language, desktop or mobile) and up to {data.plan.competitorLimit} competitor{data.plan.competitorLimit === 1 ? "" : "s"}. Your plan checks up to {data.plan.keywordLimit} keywords {cadence}.
                </p>
              </div>
            </div>
          )}
          {mode !== "create" || data.projects.length ? (
            <h2 className="mb-5 font-serif text-[28px] leading-none">{mode === "edit" ? <>Project <span className="italic">settings</span></> : <>New <span className="italic">project</span></>}</h2>
          ) : null}
          <ProjectForm
            key={mode === "edit" ? project?.id : "new"}
            initial={mode === "edit" ? project : null}
            competitorLimit={data.plan.competitorLimit}
            onSaved={onSaved}
            onCancel={data.projects.length ? () => setMode("view") : undefined}
            onDelete={mode === "edit" ? deleteProject : undefined}
          />
        </Glass>
      </>
    );
  }

  const progress = data.keywords.length ? 1 - inFlight / data.keywords.length : 0;

  return (
    <>
      {tabs}
      <Glass className="mb-5 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-ds-ink">
              <span className="font-medium">{project.domain}</span>
              <span className="text-ds-ink-2">
                {" "}
                · {project.locationName === countryName(project.country) ? project.locationName : project.locationName.split(",")[0]} · {languageName(project.language)} · {project.device}
              </span>
            </p>
            <p className="text-[13px] text-ds-ink-2">
              {inFlight > 0
                ? `Checking ${inFlight} keyword${inFlight === 1 ? "" : "s"} on Google now…`
                : stats.lastChecked
                  ? `Last checked ${timeAgo(stats.lastChecked, now)} · checked ${cadence}${stats.nextDue ? `, next ${timeUntil(stats.nextDue, now)}` : ""}`
                  : data.keywords.length
                    ? `First check pending: it runs at the next scheduled pass (hourly), or start it now.`
                    : "Add keywords to start tracking."}
              {data.keywords.length > 0 && ` · ${data.plan.checksLeft} of ${data.plan.checksLimit} on-demand checks left today`}
            </p>
          </div>
          <button
            type="button"
            onClick={checkNow}
            disabled={checking || inFlight > 0 || !stats.checkable || data.plan.checksLeft <= 0 || data.status.paused || !data.status.configured}
            title={!stats.checkable && data.keywords.length ? "Every keyword was already checked today or is being checked" : undefined}
            className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ds-ink px-5 text-[14.5px] font-medium text-[#faf8f2] transition hover:bg-[#3a3633] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {checking || inFlight > 0 ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconRerun className="h-4 w-4" />} Check now
          </button>
        </div>
        {inFlight > 0 && (
          <div className="h-1 w-full bg-white/40">
            <div className="h-full bg-[linear-gradient(90deg,#f6c3a2,#d5855a)] transition-[width] duration-1000 ease-out" style={{ width: `${Math.max(6, Math.round(progress * 100))}%` }} />
          </div>
        )}
        {(data.status.paused || !data.status.configured) && (
          <p className="flex items-start gap-2 border-t border-white/60 px-5 py-3 text-[13.5px] text-ds-warning">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {!data.status.configured ? "Rank checks aren't configured on this server yet." : `Rank checks are paused: ${data.status.pauseReason} Your keywords and history are safe; checks resume automatically.`}
          </p>
        )}
        {message && <p className={`border-t border-white/60 px-5 py-3 text-[13.5px] ${message.ok ? "text-ds-success" : "text-ds-danger"}`}>{message.text}</p>}
      </Glass>

      <div className="space-y-5">
        {data.keywords.length > 0 && <Overview keywords={data.keywords} alerts={data.alerts} cadenceDays={data.plan.cadenceDays} today={today} onOpen={setDetail} />}
        <KeywordTable
          project={project}
          keywords={data.keywords}
          today={today}
          keywordLimit={data.plan.keywordLimit}
          keywordsUsed={data.plan.keywordsUsed}
          stopOnOwn={data.status.stopOnOwn}
          onChanged={() => void refresh()}
          onOpen={setDetail}
        />
      </div>
      {detail && <KeywordDetail project={project} keywordId={detail} onClose={closeDetail} />}
    </>
  );
}
