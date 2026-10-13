"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconSpinner } from "@/components/icons/Icons";
import { useViewer } from "@/components/viewer/useViewer";

interface ProjectLite {
  id: string;
  name: string;
  domain: string;
  country: string;
  locationName: string;
  device: string;
}

/** A small flag on a rung: "start tracking this". */
function TrackGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17h14" />
      <path d="M7 17V8.5M7 3.2v5.3l5.4-2.4L7 3.6" />
      <path d="M12.5 17v-4.2h3.8V17" />
    </svg>
  );
}

let projectsCache: Promise<ProjectLite[] | null> | null = null;
function loadProjects(): Promise<ProjectLite[] | null> {
  if (!projectsCache) {
    projectsCache = fetch("/api/rank-tracker/projects", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ projects: ProjectLite[] }>) : null))
      .then((d) => d?.projects ?? null)
      .catch(() => null);
  }
  return projectsCache;
}

/**
 * "Track" action used by Keyword Research and Domain keywords: adds keywords to a Rank Tracker project.
 * Signed-out visitors get a sign-up link; accounts without a project get a link to create one.
 */
export function TrackButton({
  keywords,
  country,
  label = "Track",
  compact = false,
  className = "",
}: {
  keywords: { keyword: string; volume?: number | null }[];
  country?: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const viewer = useViewer();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectLite[] | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    let alive = true;
    loadProjects().then((p) => alive && setProjects(p));
    return () => {
      alive = false;
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function add(p: ProjectLite) {
    setBusy(p.id);
    setNote(null);
    try {
      const res = await fetch(`/api/rank-tracker/projects/${p.id}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keywords.slice(0, 500) }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      setNote({ ok: res.ok, text: data.message || data.error || (res.ok ? "Added." : "Couldn't add.") });
    } catch {
      setNote({ ok: false, text: "Network error. Try again." });
    } finally {
      setBusy(null);
    }
  }

  const sorted = projects ? [...projects].sort((a, b) => Number(b.country === country) - Number(a.country === country)) : projects;
  const n = keywords.length;

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setNote(null);
        }}
        disabled={!n}
        aria-expanded={open}
        title={n === 1 ? `Track “${keywords[0].keyword}” in the Rank Tracker` : `Track ${n} keywords in the Rank Tracker`}
        className={
          compact
            ? "inline-flex h-7 items-center gap-1 rounded-[9px] px-2 text-[12.5px] text-ds-ink-2 transition-colors hover:bg-white/70 hover:text-ds-ink disabled:opacity-40"
            : "glass-inset inline-flex h-9 items-center gap-2 rounded-[12px] px-4 text-[14px] font-medium text-ds-ink transition-colors hover:bg-white/75 disabled:opacity-40"
        }
      >
        <TrackGlyph className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
      </button>
      {open && (
        <div className="glass-strong absolute right-0 top-[calc(100%+8px)] z-50 w-[270px] max-w-[calc(100vw-32px)] rounded-[16px] p-2 text-left">
          {viewer && !viewer.signedIn ? (
            <div className="p-2 text-[13.5px] text-ds-ink-2">
              Rank tracking needs a free account.{" "}
              <Link href={`/signup?next=${encodeURIComponent("/app/rank-tracker")}`} className="font-medium text-ds-ink underline underline-offset-4">
                Sign up
              </Link>
            </div>
          ) : sorted === undefined ? (
            <p className="flex items-center gap-2 p-2 text-[13.5px] text-ds-ink-2">
              <IconSpinner className="h-4 w-4 animate-spin" /> Loading projects…
            </p>
          ) : !sorted || !sorted.length ? (
            <div className="p-2 text-[13.5px] text-ds-ink-2">
              No Rank Tracker project yet.{" "}
              <Link href="/app/rank-tracker" className="font-medium text-ds-ink underline underline-offset-4">
                Create one
              </Link>
            </div>
          ) : (
            <>
              <p className="px-2 pb-1 pt-1 text-[12.5px] text-ds-ink-2">
                Add {n === 1 ? `“${keywords[0].keyword}”` : `${n} keywords`} to
              </p>
              {sorted.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => add(p)}
                  className="flex w-full items-center justify-between gap-2 rounded-[11px] px-2 py-2 text-left text-[13.5px] text-ds-ink transition-colors hover:bg-white/70 disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.domain}</span>
                    <span className="block truncate text-[12px] text-ds-ink-2">
                      {p.locationName} · {p.device}
                    </span>
                  </span>
                  {busy === p.id && <IconSpinner className="h-4 w-4 shrink-0 animate-spin" />}
                </button>
              ))}
            </>
          )}
          {note && <p className={`mx-2 mb-1 mt-1 text-[12.5px] ${note.ok ? "text-ds-success" : "text-ds-danger"}`}>{note.text}</p>}
        </div>
      )}
    </div>
  );
}
