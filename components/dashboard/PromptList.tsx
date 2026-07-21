import type { PromptDoc, RunDoc } from "@/lib/types";
import { addPrompt, togglePrompt } from "@/app/(app)/onboarding/actions";

function latestRunFor(promptId: string, runs: RunDoc[]): RunDoc | undefined {
  return runs.find((r) => r.promptId === promptId);
}

export default function PromptList({
  prompts,
  runs,
  maxPrompts,
}: {
  prompts: PromptDoc[];
  runs: RunDoc[];
  maxPrompts: number;
}) {
  const atLimit = prompts.length >= maxPrompts;

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Tracked prompts</h2>

      <ul className="flex flex-col divide-y divide-border">
        {prompts.map((prompt) => {
          const latest = latestRunFor(prompt.id, runs);
          return (
            <li key={prompt.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{prompt.text}</p>
                <p className="text-xs text-muted">
                  {latest
                    ? latest.mentioned
                      ? "✅ Mentioned in last check"
                      : "⚠️ Not mentioned in last check"
                    : "Not checked yet"}
                  {latest && !latest.grounded && (
                    <span className="ml-1 text-orange-500">
                      · approximate, no live web search yet
                    </span>
                  )}
                </p>
              </div>
              <form action={togglePrompt}>
                <input type="hidden" name="promptId" value={prompt.id} />
                <input type="hidden" name="nextActive" value={(!prompt.active).toString()} />
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface"
                >
                  {prompt.active ? "Pause" : "Resume"}
                </button>
              </form>
            </li>
          );
        })}
        {prompts.length === 0 && <li className="py-3 text-sm text-muted">No prompts yet.</li>}
      </ul>

      {!atLimit && (
        <form action={addPrompt} className="mt-4 flex gap-2">
          <input
            name="text"
            required
            placeholder="Add another prompt to track…"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-orange-100"
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Add
          </button>
        </form>
      )}
      {atLimit && (
        <p className="mt-4 text-xs text-muted">
          You&apos;ve reached your plan&apos;s limit of {maxPrompts} tracked prompts. Upgrade to track more.
        </p>
      )}
    </div>
  );
}
