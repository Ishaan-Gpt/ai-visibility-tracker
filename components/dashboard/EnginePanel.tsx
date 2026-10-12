import type { RollupDoc } from "@/lib/types";
import { Glass } from "@/components/studio/Glass";
import type { EngineView } from "./format";

/** A small lamp: lit when the engine runs, unlit (outline) when its key isn't configured. */
function Lamp({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <circle cx="7" cy="7" r="5" fill={on ? "#5c7c68" : "none"} stroke={on ? "#5c7c68" : "#a8a29b"} strokeWidth="1.2" strokeDasharray={on ? undefined : "2 2"} />
      {on && <circle cx="5.6" cy="5.6" r="1.4" fill="#fff" fillOpacity=".55" />}
    </svg>
  );
}

/** Which engines run, and how visible you are on each in the latest check. */
export default function EnginePanel({ engines, rollup }: { engines: EngineView[]; rollup: RollupDoc | null }) {
  const byProvider = rollup?.byProvider;
  const anyUngrounded = rollup?.groundedCount !== undefined && rollup.groundedCount < (rollup.totalAnswers ?? 0);
  return (
    <Glass className="h-full p-6">
      <h2 className="font-serif text-[28px] leading-none">
        By <span className="italic">engine</span>
      </h2>
      <ul className="mt-5 space-y-3">
        {engines.map((e) => {
          const s = byProvider?.[e.id];
          const rate = s && s.total ? Math.round((s.mentioned / s.total) * 100) : null;
          return (
            <li key={e.id} className={`glass-inset rounded-[14px] px-4 py-3 ${e.active ? "" : "opacity-70"}`}>
              <div className="flex items-center gap-2.5">
                <Lamp on={e.active} />
                <span className="text-[14.5px] font-medium text-ds-ink">{e.label}</span>
                <span className="ml-auto font-serif text-[22px] tabular-nums leading-none">
                  {rate === null ? <span className="text-[13px] font-sans text-ds-ink-3">{e.active ? "–" : "off"}</span> : <>{rate}<span className="text-[12px] text-ds-ink-3">%</span></>}
                </span>
              </div>
              <p className="mt-1 pl-6 text-[12px] leading-5 text-ds-ink-2">
                {e.active ? e.detail : <>Not active. Set <span className="font-mono">{e.envVar}</span> to add it.</>}
                {s && (
                  <span className="block text-ds-ink-3">
                    {s.mentioned}/{s.total} answers name you · {s.cited} cite you{s.grounded < s.total ? ` · ${s.total - s.grounded} without live search` : ""}
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
      {anyUngrounded && (
        <p className="mt-4 text-[12.5px] leading-5 text-[#b7660a]">Some answers in the last check ran without live web search (training data only), so they may be out of date and carry no sources.</p>
      )}
    </Glass>
  );
}
