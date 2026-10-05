"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Link2, Sparkles } from "lucide-react";

const PROMPTS = [
  { text: "best CRM for a 10 person startup", active: true, state: "Mentioned" },
  { text: "how do I migrate from spreadsheets to a CRM", active: false, state: "Not mentioned" },
  { text: "acme crm vs competitors", active: false, state: "Mentioned" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/** Illustrative product panel. Clearly labelled as an example: no real customer data is shown. */
export function HeroDemo() {
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: EASE } };

  return (
    <motion.div
      {...fade(0.2)}
      className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-ds-xl border border-ds-night-line bg-ds-night-2 shadow-[0_30px_80px_-20px_rgba(91,61,245,0.35)]"
    >
      <div className="flex items-center justify-between border-b border-ds-night-line px-4 py-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <span className="font-mono text-[12px] text-white/40">opengeo.app / visibility</span>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/60">Illustrative example</span>
      </div>

      <div className="grid gap-px bg-ds-night-line md:grid-cols-[320px_1fr]">
        <div className="bg-ds-night-2 p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">Tracked prompts</p>
          <ul className="mt-4 space-y-2">
            {PROMPTS.map((p, i) => (
              <motion.li
                key={p.text}
                {...fade(0.5 + i * 0.12)}
                className={`rounded-ds-md border px-3 py-3 text-left ${p.active ? "border-white/25 bg-white/10" : "border-ds-night-line bg-white/[0.02]"}`}
              >
                <p className="text-[14px] leading-5 text-white/90">{p.text}</p>
                <p className={`mt-1.5 flex items-center gap-1.5 text-[12px] ${p.state === "Mentioned" ? "text-ds-signal" : "text-white/40"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${p.state === "Mentioned" ? "bg-ds-signal" : "bg-white/30"}`} />
                  {p.state}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-ds-night-2 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-white/40">
            <Sparkles className="h-3.5 w-3.5" /> AI answer
          </div>
          <motion.p {...fade(0.7)} className="mt-4 text-[16px] leading-7 text-white/80 sm:text-[17px] sm:leading-8">
            For a small team, the strongest options are <span className="text-white">HubSpot</span> for an all-in-one suite and{" "}
            <mark className="rounded bg-ds-signal/20 px-1 text-ds-signal">Acme CRM</mark> if you want fast setup and simple pricing. Pipedrive is a good fit when your process is
            mostly sales stages.
          </motion.p>

          <motion.div {...fade(0.95)} className="mt-6 flex flex-wrap gap-2">
            {["acmecrm.com/pricing", "g2.com/categories/crm", "hubspot.com/crm"].map((s, i) => (
              <span
                key={s}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[12px] ${
                  i === 0 ? "border-ds-signal/40 bg-ds-signal/10 text-ds-signal" : "border-ds-night-line text-white/50"
                }`}
              >
                <Link2 className="h-3 w-3" /> {s}
              </span>
            ))}
          </motion.div>

          <motion.div {...fade(1.1)} className="mt-6 grid grid-cols-3 gap-3 border-t border-ds-night-line pt-5">
            {[
              { k: "Mentioned", v: "Yes", icon: true },
              { k: "Cited source", v: "Your site" },
              { k: "Competitors named", v: "2" },
            ].map((m) => (
              <div key={m.k}>
                <p className="text-[12px] text-white/40">{m.k}</p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[18px] text-white sm:text-[20px]">
                  {m.icon && <Check className="h-4 w-4 text-ds-signal" />}
                  {m.v}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
