"use client";

import { useState, useTransition } from "react";
import type { Provider } from "@/lib/types";
import { addPrompts, deletePrompt, setPromptActive, suggestBrandPrompts, updatePrompt } from "@/app/app/onboarding/actions";
import { ENGINE_LABELS, ENGINE_ORDER } from "@/lib/providers/labels";
import { Glass } from "@/components/studio/Glass";
import { IcBin, IcCheck, IcPause, IcPlay, IcPlus } from "@/components/icons/Studio";
import { IconChevron, IconClose, IconSpark, IconSpinner } from "@/components/icons/Icons";
import AnswerView from "./AnswerView";
import type { PromptView, SlimRun } from "./format";
import { shortDate } from "./format";

/** Status as a tiny wax seal: filled apricot = mentioned, hollow ring = not yet, dotted = never checked. */
function Seal({ tone }: { tone: "good" | "warn" | "idle" }) {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
      {tone === "good" && (
        <>
          <path d="M10 1.8l2 1.6 2.5-.3 1 2.3 2.3 1-.3 2.5 1.6 2-1.6 2 .3 2.5-2.3 1-1 2.3-2.5-.3-2 1.6-2-1.6-2.5.3-1-2.3-2.3-1 .3-2.5L1.8 10l1.6-2-.3-2.5 2.3-1 1-2.3 2.5.3z" fill="#f2a97f" />
          <path d="m6.8 10.2 2.2 2.1 4.4-4.5" stroke="#2b2927" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {tone === "warn" && <circle cx="10" cy="10" r="6.5" fill="none" stroke="#b7660a" strokeWidth="1.4" />}
      {tone === "idle" && <circle cx="10" cy="10" r="6.5" fill="none" stroke="#a8a29b" strokeWidth="1.4" strokeDasharray="2 2.6" />}
    </svg>
  );
}

/** Oldest to newest: one bead per check, filled when you were named. */
function History({ runs }: { runs: SlimRun[] }) {
  const shown = runs.slice(0, 14).reverse();
  if (shown.length < 2) return null;
  return (
    <div className="flex items-center gap-1" aria-label="Mention history, oldest to newest">
      {shown.map((r, i) => (
        <span
          key={i}
          title={`${shortDate(r.timestamp)} · ${ENGINE_LABELS[r.provider]} · ${r.mentioned ? `named${r.position ? ` #${r.position}` : ""}` : "not named"}${r.cited ? " · cited" : ""}`}
          className={`block h-2.5 w-2.5 rounded-full border ${r.mentioned ? "border-[#d5855a] bg-ds-accent" : "border-ds-ink-3/60 bg-transparent"} ${r.cited ? "ring-2 ring-[#5c7c68]/40" : ""}`}
        />
      ))}
    </div>
  );
}

const btn = "flex h-8 w-8 items-center justify-center rounded-[10px] text-ds-ink-2 transition-colors hover:bg-white/70 hover:text-ds-ink disabled:opacity-40";

function PromptRow({ view, brandName }: { view: PromptView; brandName: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(view.text);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const engines = ENGINE_ORDER.filter((p) => view.latest[p]);
  const [tab, setTab] = useState<Provider | undefined>(engines[0]);
  const current = tab ? view.latest[tab] : undefined;
  const anyMentioned = engines.some((p) => view.latest[p]?.mentioned);
  const tone = engines.length === 0 ? "idle" : anyMentioned ? "good" : "warn";

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
    });

  return (
    <li className={`glass-inset rounded-[14px] transition-opacity ${view.active ? "" : "opacity-60"}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <Seal tone={tone} />
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  const res = await updatePrompt(view.id, draft);
                  if (res.ok) setEditing(false);
                  return res;
                });
              }}
              className="flex items-center gap-2"
            >
              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={300} aria-label="Prompt text" className="min-w-0 flex-1 rounded-[10px] bg-white/70 px-3 py-1.5 text-[14.5px] outline-none focus:ring-2 focus:ring-ds-accent/60" />
              <button type="submit" disabled={pending} className={btn} aria-label="Save prompt">
                <IcCheck className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => { setEditing(false); setDraft(view.text); }} className={btn} aria-label="Cancel editing">
                <IconClose className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setOpen((o) => !o)} className="block w-full text-left" aria-expanded={open}>
              <p className="text-[15px] text-ds-ink">“{view.text}”</p>
            </button>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ds-ink-2">
            {engines.length === 0 ? (
              <span>Not checked yet</span>
            ) : (
              engines.map((p) => {
                const r = view.latest[p]!;
                return (
                  <span key={p}>
                    {ENGINE_LABELS[p]}:{" "}
                    <span className={r.mentioned ? "text-ds-accent-ink" : ""}>{r.mentioned ? (r.position ? `#${r.position}` : "named") : "not named"}</span>
                    {r.cited && <span className="text-ds-success"> · cited</span>}
                    {!r.grounded && <span className="text-[#b7660a]"> · no live search</span>}
                  </span>
                );
              })
            )}
            {!view.active && <span>· paused</span>}
            <History runs={view.history} />
          </div>
          {error && <p className="mt-1 text-[12.5px] text-ds-danger">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center">
          {confirmDelete ? (
            <span className="flex items-center gap-1 text-[12.5px]">
              <button type="button" disabled={pending} onClick={() => act(() => deletePrompt(view.id))} className="rounded-[8px] bg-ds-danger/10 px-2.5 py-1.5 font-medium text-ds-danger hover:bg-ds-danger/15">
                Delete prompt and history
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className={btn} aria-label="Keep prompt">
                <IconClose className="h-4 w-4" />
              </button>
            </span>
          ) : (
            <>
              {!editing && (
                <button type="button" onClick={() => setEditing(true)} className={btn} aria-label="Edit prompt" title="Edit">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 19.2l.9-3.9L15.8 5.4a1.9 1.9 0 0 1 2.7 0l.1.1a1.9 1.9 0 0 1 0 2.7L8.7 18.1z" />
                    <path d="M13.9 7.3l2.8 2.8M4.8 20.2c3.6-.2 8.2-.2 14.4 0" />
                  </svg>
                </button>
              )}
              <button type="button" disabled={pending} onClick={() => act(() => setPromptActive(view.id, !view.active))} className={btn} aria-label={view.active ? "Pause tracking" : "Resume tracking"} title={view.active ? "Pause" : "Resume"}>
                {view.active ? <IcPause className="h-4 w-4" /> : <IcPlay className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)} className={`group ${btn}`} aria-label="Delete prompt" title="Delete">
                <IcBin className="h-4 w-4" />
              </button>
              {engines.length > 0 && (
                <button type="button" onClick={() => setOpen((o) => !o)} className={btn} aria-label={open ? "Hide answer" : "Show answer"} aria-expanded={open}>
                  <IconChevron className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {open && current && (
        <div className="border-t border-white/60 px-4 pb-4 pt-3">
          {engines.length > 1 && (
            <div className="mb-3 flex gap-1" role="tablist" aria-label="Engine">
              {engines.map((p) => (
                <button key={p} type="button" role="tab" aria-selected={p === tab} onClick={() => setTab(p)} className={`rounded-full px-3 py-1 text-[12.5px] transition ${p === tab ? "bg-ds-ink text-[#faf8f2]" : "text-ds-ink-2 hover:bg-white/60"}`}>
                  {ENGINE_LABELS[p]}
                </button>
              ))}
            </div>
          )}
          <AnswerView run={current} brandName={brandName} />
        </div>
      )}
    </li>
  );
}

type SuggestState = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; prompts: { text: string; intent: string }[]; category: string };

function Suggestions({ state, room, onClose }: { state: SuggestState; room: number; onClose: () => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (t: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else if (n.size < room) n.add(t);
      return n;
    });

  return (
    <div className="glass-inset mt-4 rounded-[16px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14.5px] font-medium text-ds-ink">Suggested prompts</h3>
          <p className="text-[12.5px] text-ds-ink-2">
            {state.kind === "ready" && state.category ? `Drafted for: ${state.category}. ` : ""}Pick up to {room}. Unbranded prompts show real visibility; branded ones always name you.
          </p>
        </div>
        <button type="button" onClick={onClose} className={btn} aria-label="Close suggestions">
          <IconClose className="h-4 w-4" />
        </button>
      </div>
      {state.kind === "loading" && (
        <p className="mt-3 flex items-center gap-2 text-[13.5px] text-ds-ink-2">
          <IconSpinner className="h-4 w-4 animate-spin" /> Drafting prompts a customer would ask…
        </p>
      )}
      {state.kind === "error" && <p className="mt-3 text-[13.5px] text-ds-danger">{state.message}</p>}
      {state.kind === "ready" && (
        <>
          <ul className="mt-3 space-y-1.5">
            {state.prompts.map((p) => {
              const on = picked.has(p.text);
              const full = !on && picked.size >= room;
              return (
                <li key={p.text}>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-1.5 text-[14px] transition hover:bg-white/50 ${full ? "cursor-not-allowed opacity-50" : ""}`}>
                    <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(p.text)} className="h-4 w-4 accent-[#d5855a]" />
                    <span className="min-w-0 flex-1 text-ds-ink">{p.text}</span>
                    <span className="shrink-0 text-[11.5px] text-ds-ink-3">{p.intent}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {error && <p className="mt-2 text-[12.5px] text-ds-danger">{error}</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={picked.size === 0 || pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const res = await addPrompts([...picked]);
                  if (res.ok) onClose();
                  else setError(res.error);
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ds-accent px-3.5 text-[13.5px] font-medium text-ds-ink transition hover:bg-[var(--ds-accent-hover)] disabled:opacity-50"
            >
              {pending ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IcPlus className="h-4 w-4" />} Track {picked.size || ""} selected
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PromptList({ prompts, brandName, maxPrompts }: { prompts: PromptView[]; brandName: string; maxPrompts: number }) {
  const room = Math.max(0, maxPrompts - prompts.length);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<SuggestState | null>(null);
  const [pending, start] = useTransition();
  const openSuggestions = () => {
    setSuggest({ kind: "loading" });
    void suggestBrandPrompts()
      .then((res) => setSuggest((cur) => (cur ? (res.ok ? { kind: "ready", prompts: res.prompts, category: res.category } : { kind: "error", message: res.error }) : cur)))
      .catch(() => setSuggest((cur) => (cur ? { kind: "error", message: "Couldn't draft prompts right now." } : cur)));
  };

  return (
    <Glass className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-[28px] leading-none">
          What people <span className="italic">ask</span>
        </h2>
        <div className="flex items-center gap-3">
          {room > 0 && !suggest && (
            <button type="button" onClick={openSuggestions} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] font-medium text-ds-ink-2 transition hover:bg-white/60 hover:text-ds-ink">
              <IconSpark className="h-4 w-4" /> Suggest prompts
            </button>
          )}
          <span className="font-serif text-[22px] tabular-nums text-ds-ink-2">
            {prompts.length}
            <span className="text-[14px] text-ds-ink-3">/{maxPrompts}</span>
          </span>
        </div>
      </div>

      {suggest && <Suggestions state={suggest} room={room} onClose={() => setSuggest(null)} />}

      <ul className="mt-5 space-y-2">
        {prompts.map((p) => (
          <PromptRow key={p.id} view={p} brandName={brandName} />
        ))}
        {prompts.length === 0 && <li className="text-[14px] text-ds-ink-2">No prompts yet. Add one below or let us suggest some.</li>}
      </ul>

      {room > 0 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              setError(null);
              const res = await addPrompts([text]);
              if (res.ok) setText("");
              else setError(res.error);
            });
          }}
          className="glass-inset mt-4 flex items-center gap-2 rounded-[14px] p-1.5 pl-4 focus-within:ring-2 focus-within:ring-ds-accent/60"
        >
          <label htmlFor="new-prompt" className="sr-only">
            New prompt
          </label>
          <input id="new-prompt" value={text} onChange={(e) => setText(e.target.value)} required minLength={3} maxLength={300} placeholder="Add a prompt to track…" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-ds-ink-3" />
          <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ds-accent px-3.5 text-[13.5px] font-medium text-ds-ink transition hover:bg-[var(--ds-accent-hover)] disabled:opacity-60">
            {pending ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IcPlus className="h-4 w-4" />} Add
          </button>
        </form>
      ) : (
        <p className="mt-4 text-[13.5px] text-ds-ink-2">You&apos;ve reached your plan&apos;s {maxPrompts} tracked prompts. Delete one to swap it, or go Pro to track more.</p>
      )}
      {error && <p className="mt-2 text-[12.5px] text-ds-danger">{error}</p>}
      <p className="mt-3 text-[12px] text-ds-ink-3">New and edited prompts are checked on the next run. Paused prompts keep their history.</p>
    </Glass>
  );
}
