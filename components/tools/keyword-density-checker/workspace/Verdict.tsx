"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SeverityIcon } from "@/components/ds/extras";
import type { DocAnalysis } from "@/lib/tools/keywordDensity/analyzer";
import type { OverOptFlag } from "@/lib/tools/keywordDensity/overOptimization";
import { COMPARE_CAP, type CompareResult } from "@/lib/tools/keywordDensity/compare";
import { fmt } from "@/components/tools/keyword-density-checker/workspace/ui";

function gradePhrase(g: number): string {
  if (g < 6) return "an easy, elementary reading level";
  if (g < 13) return `a grade ${Math.max(1, Math.round(g))} reading level`;
  if (g < 16) return "a college reading level";
  return "a post-graduate reading level";
}

function hostOf(u: string | null) {
  if (!u) return null;
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Verdict first: one serif sentence about the text, the key numbers as chips, then anything that looks over-optimised. */
export function Verdict({ a, extraFlags, compare }: { a: DocAnalysis; extraFlags: OverOptFlag[]; compare?: CompareResult | null }) {
  const r = a.readability;
  const flags = [...a.overOptimization, ...extraFlags];
  const warnings = flags.filter((f) => f.severity === "warning").length;
  const infos = flags.length - warnings;
  const tail = warnings ? "and some of it looks over-optimised." : infos ? "with a little heavy repetition." : "and nothing looks over-optimised.";
  const host = hostOf(a.doc.url);

  const head = compare ? (
    <>
      Your {compare.youWords.toLocaleString()} words against their {compare.themWords.toLocaleString()}:{" "}
      <span className="italic">
        {compare.missing.length
          ? `${compare.missing.length}${compare.missing.length >= COMPARE_CAP ? "+" : ""} topical term${compare.missing.length === 1 ? "" : "s"} they cover and you don't.`
          : compare.underused.length
            ? `no missing terms, ${compare.underused.length} they cover in more depth.`
            : "no obvious term gaps."}
      </span>
    </>
  ) : (
    <>
      {a.wordCount.toLocaleString()} words at {r.sentences ? gradePhrase(r.fleschKincaidGrade) : "no measurable reading level yet"}, <span className="italic">{tail}</span>
    </>
  );

  const chips = [
    r.sentences ? `Reading ease ${fmt(r.fleschReadingEase)} · ${r.fleschLabel}` : null,
    `${Math.max(1, Math.round(r.readingMinutes))} min read`,
    `${r.sentences} sentences`,
    `${r.paragraphs} paragraphs`,
    `${Math.round(a.vocabularyDiversity * 100)}% unique words`,
    host,
  ].filter(Boolean) as string[];

  return (
    <section data-print-card className="glass-strong relative overflow-hidden rounded-[28px] p-5 sm:p-9">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(242,169,127,.45),transparent)] print:hidden" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(201,214,219,.6),transparent)] print:hidden" />
      <div className="relative grid gap-7 lg:grid-cols-[auto_1fr] lg:items-center">
        <EaseDial value={r.sentences ? r.fleschReadingEase : null} grade={r.sentences ? r.fleschKincaidGrade : null} />
        <div className="min-w-0">
          <h2 className="text-balance font-serif text-[32px] leading-[1.02] text-ds-ink sm:text-[46px]">{head}</h2>
          <p className="mt-3 max-w-[600px] text-[15.5px] leading-6 text-ds-ink-2">
            Keyword density is not a ranking factor. Search engines read for meaning, so this checks what actually matters: whether the topic is covered, where it appears, whether anything repeats unnaturally, and how easy it is to read.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
            {chips.map((c) => (
              <span key={c} className="glass-inset rounded-[10px] px-2.5 py-1 tabular-nums text-ds-ink-2">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="relative mt-7 grid gap-2.5 md:grid-cols-2">
        {flags.length === 0 ? (
          <li className="flex gap-3 rounded-[16px] bg-white/45 p-3.5 md:col-span-2">
            <SeverityIcon severity="pass" />
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-ds-ink">No unnatural repetition</p>
              <p className="text-[14px] leading-5 text-ds-ink-2">No word or phrase repeats more than natural writing would, and the title and H1 don&apos;t repeat themselves.</p>
            </div>
          </li>
        ) : (
          flags.slice(0, 6).map((f) => (
            <li key={f.id} className={`flex gap-3 rounded-[16px] p-3.5 ${f.severity === "warning" ? "bg-[#f7e2c4]/55" : "bg-white/45"}`}>
              <SeverityIcon severity={f.severity === "warning" ? "warning" : "info"} />
              <div className="min-w-0">
                <p className="break-words text-[15px] font-medium text-ds-ink">{f.title}</p>
                <p className="text-[14px] leading-5 text-ds-ink-2">{f.detail}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

/**
 * Reading-ease dial: a half ring from "very difficult" (0) to "very easy" (100) with engraved ticks,
 * a soft needle and the Flesch score in serif. Grade sits underneath.
 */
function EaseDial({ value, grade }: { value: number | null; grade: number | null }) {
  const reduce = useReducedMotion();
  const W = 220;
  const cx = W / 2;
  const cy = 118;
  const R = 92;
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  const angle = Math.PI * (1 - v / 100); // 180° (left) → 0° (right)
  const pt = (a: number, rr: number) => [cx + rr * Math.cos(a), cy - rr * Math.sin(a)] as const;
  const [x0, y0] = pt(Math.PI, R);
  const [x1, y1] = pt(0, R);
  const [nx, ny] = pt(angle, R - 18);
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5);
  return (
    <div className="mx-auto w-[220px] text-center lg:mx-0">
      <svg viewBox={`0 0 ${W} 140`} className="w-full" role="img" aria-label={value === null ? "Reading ease not available" : `Flesch reading ease ${fmt(v)} out of 100`}>
        <defs>
          <linearGradient id="kd-ease" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#e9a27a" />
            <stop offset="55%" stopColor="#ead7b4" />
            <stop offset="100%" stopColor="#9fbfa8" />
          </linearGradient>
        </defs>
        <path d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`} fill="none" stroke="url(#kd-ease)" strokeWidth="14" strokeLinecap="round" opacity="0.9" />
        {ticks.map((t) => {
          const a = Math.PI * (1 - t / 100);
          const [ax, ay] = pt(a, R - 12);
          const [bx, by] = pt(a, R - (t % 25 === 0 ? 22 : 17));
          return <line key={t} x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(43,41,39,.28)" strokeWidth={t % 25 === 0 ? 1.4 : 0.8} strokeLinecap="round" />;
        })}
        {value !== null && (
          <motion.g initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#2b2927" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="5.5" fill="#2b2927" />
            <circle cx={cx} cy={cy} r="2" fill="#faf8f2" />
          </motion.g>
        )}
        <text x={x0 + 2} y={cy + 18} fontSize="10.5" fill="#a8a29b" textAnchor="start">
          hard
        </text>
        <text x={x1 - 2} y={cy + 18} fontSize="10.5" fill="#a8a29b" textAnchor="end">
          easy
        </text>
      </svg>
      <p className="-mt-1 font-serif text-[46px] leading-none tabular-nums text-ds-ink">{value === null ? "–" : fmt(v, 0)}</p>
      <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ds-ink-2">Reading ease</p>
      {grade !== null && <p className="mt-1 text-[13px] text-ds-ink-2">Grade {fmt(grade)}</p>}
    </div>
  );
}
