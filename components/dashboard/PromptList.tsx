import type { PromptDoc, RunDoc } from "@/lib/types";
import { addPrompt, togglePrompt } from "@/app/tools/ai-visibility-tracker/(app)/onboarding/actions";
import { Card, buttonClass } from "@/components/ds/primitives";

function latestRunFor(promptId: string, runs: RunDoc[]): RunDoc | undefined {
  return runs.find((r) => r.promptId === promptId);
}

function StatusDot({ tone }: { tone: "good" | "warn" | "idle" }) {
  const color = tone === "good" ? "bg-ds-success" : tone === "warn" ? "bg-ds-warning" : "bg-ds-ink-3";
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />;
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
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-medium text-ds-ink">Tracked prompts</h2>
        <span className="text-[14px] text-ds-ink-2">
          {prompts.length} / {maxPrompts}
        </span>
      </div>

      <ul className="divide-y divide-ds-line">
        {prompts.map((prompt) => {
          const latest = latestRunFor(prompt.id, runs);
          const tone = !latest ? "idle" : latest.mentioned ? "good" : "warn";
          return (
            <li key={prompt.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 flex-1 gap-3">
                <StatusDot tone={tone} />
                <div className="min-w-0">
                  <p className="truncate text-[16px] text-ds-ink">{prompt.text}</p>
                  <p className="text-[14px] text-ds-ink-2">
                    {!latest ? "Not checked yet" : latest.mentioned ? "Mentioned in last check" : "Not mentioned in last check"}
                    {latest && !latest.grounded && (
                      <span className="ml-1 text-ds-warning">· approximate, no live web search</span>
                    )}
                    {!prompt.active && <span className="ml-1">· paused</span>}
                  </p>
                </div>
              </div>
              <form action={togglePrompt}>
                <input type="hidden" name="promptId" value={prompt.id} />
                <input type="hidden" name="nextActive" value={(!prompt.active).toString()} />
                <button type="submit" className={buttonClass("secondary")}>
                  {prompt.active ? "Pause" : "Resume"}
                </button>
              </form>
            </li>
          );
        })}
        {prompts.length === 0 && <li className="py-3 text-[14px] text-ds-ink-2">No prompts yet.</li>}
      </ul>

      {!atLimit ? (
        <form action={addPrompt} className="mt-4 flex gap-2">
          <input
            name="text"
            required
            placeholder="Add another prompt to track…"
            className="h-10 w-full rounded-ds-md border border-ds-line bg-ds-surface px-4 text-[16px] text-ds-ink outline-none placeholder:text-ds-ink-3 focus:ring-2 focus:ring-ds-ink"
          />
          <button type="submit" className={buttonClass("primary")}>
            Add
          </button>
        </form>
      ) : (
        <p className="mt-4 text-[14px] text-ds-ink-2">
          You have reached your plan&apos;s limit of {maxPrompts} tracked prompts. Upgrade to track more.
        </p>
      )}
    </Card>
  );
}
