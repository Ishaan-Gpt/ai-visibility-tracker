import type { PromptDoc, RunDoc } from "@/lib/types";
import { addPrompt, togglePrompt } from "@/app/app/onboarding/actions";
import { Glass, Kicker } from "@/components/studio/Glass";
import { IcPause, IcPlay, IcPlus } from "@/components/icons/Studio";

function latestRunFor(promptId: string, runs: RunDoc[]): RunDoc | undefined {
  return runs.find((r) => r.promptId === promptId);
}

/** Status as a tiny wax seal: filled apricot = mentioned, hollow ring = not yet, dotted = never checked. */
function Seal({ tone }: { tone: "good" | "warn" | "idle" }) {
  return (
    <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0" aria-hidden>
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

export default function PromptList({ prompts, runs, maxPrompts }: { prompts: PromptDoc[]; runs: RunDoc[]; maxPrompts: number }) {
  const atLimit = prompts.length >= maxPrompts;
  return (
    <Glass className="h-full p-6">
      <div className="flex items-end justify-between">
        <div>
          <Kicker>Tracked prompts</Kicker>
          <h2 className="mt-2 font-serif text-[28px] leading-none">
            What people <span className="italic">ask</span>
          </h2>
        </div>
        <span className="font-serif text-[22px] tabular-nums text-ds-ink-2">
          {prompts.length}
          <span className="text-[14px] text-ds-ink-3">/{maxPrompts}</span>
        </span>
      </div>

      <ul className="mt-5 space-y-2">
        {prompts.map((prompt) => {
          const latest = latestRunFor(prompt.id, runs);
          const tone = !latest ? "idle" : latest.mentioned ? "good" : "warn";
          return (
            <li key={prompt.id} className={`glass-inset flex items-center gap-3 rounded-[14px] px-4 py-3 transition-opacity ${prompt.active ? "" : "opacity-60"}`}>
              <Seal tone={tone} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] text-ds-ink">“{prompt.text}”</p>
                <p className="text-[12.5px] text-ds-ink-2">
                  {!latest ? "Not checked yet" : latest.mentioned ? "Mentioned in the last check" : "Not mentioned in the last check"}
                  {latest && !latest.grounded && <span className="ml-1 text-[#b7660a]">· approximate, no live web search</span>}
                  {!prompt.active && <span className="ml-1">· paused</span>}
                </p>
              </div>
              <form action={togglePrompt}>
                <input type="hidden" name="promptId" value={prompt.id} />
                <input type="hidden" name="nextActive" value={(!prompt.active).toString()} />
                <button type="submit" aria-label={prompt.active ? "Pause tracking" : "Resume tracking"} title={prompt.active ? "Pause" : "Resume"} className="flex h-9 w-9 items-center justify-center rounded-[11px] text-ds-ink-2 transition-colors hover:bg-white/70 hover:text-ds-ink">
                  {prompt.active ? <IcPause className="h-4 w-4" /> : <IcPlay className="h-4 w-4" />}
                </button>
              </form>
            </li>
          );
        })}
        {prompts.length === 0 && <li className="text-[14px] text-ds-ink-2">No prompts yet.</li>}
      </ul>

      {!atLimit ? (
        <form action={addPrompt} className="glass-inset mt-4 flex items-center gap-2 rounded-[14px] p-1.5 pl-4 focus-within:ring-2 focus-within:ring-ds-accent/60">
          <label htmlFor="new-prompt" className="sr-only">
            New prompt
          </label>
          <input id="new-prompt" name="text" required placeholder="Add a prompt to track…" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-ds-ink-3" />
          <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ds-accent px-3.5 text-[13.5px] font-medium text-ds-ink transition hover:bg-[var(--ds-accent-hover)]">
            <IcPlus className="h-4 w-4" /> Add
          </button>
        </form>
      ) : (
        <p className="mt-4 text-[13.5px] text-ds-ink-2">You&apos;ve reached your plan&apos;s {maxPrompts} tracked prompts. Pro tracks more.</p>
      )}
    </Glass>
  );
}
