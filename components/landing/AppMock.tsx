import { IconCheckCircle, IconCrawler, IconLoupe, IconReport, IconSpark } from "@/components/icons/Icons";

/* A faithful miniature of the Page Audit result, built in HTML so it stays crisp. Example data, fictional domain. */

function MiniRing({ v, label }: { v: number; label: string }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2.5">
      <svg width="42" height="42" className="-rotate-90">
        <circle cx="21" cy="21" r={r} fill="none" stroke="rgba(43,41,39,0.1)" strokeWidth="3.5" />
        <circle cx="21" cy="21" r={r} fill="none" stroke={v > 79 ? "#5c7c68" : "#d58f5e"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} />
      </svg>
      <div>
        <div className="font-serif text-[22px] leading-none">{v}</div>
        <div className="text-[10px] text-ds-ink-2">{label}</div>
      </div>
    </div>
  );
}

const FIXES = [
  { t: "Unblock OAI-SearchBot in robots.txt", tag: "AI", done: true },
  { t: "Add LocalBusiness + FAQPage schema", tag: "AI", done: false },
  { t: "Write a 150-character meta description", tag: "SEO", done: false },
];

export function AppMock() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/60 bg-[#faf8f2]/95 text-ds-ink shadow-[0_40px_90px_-40px_rgba(43,41,39,0.55)] backdrop-blur">
      <div className="relative flex h-8 items-center border-b border-ds-line bg-[#efebe1] px-3">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#d9d3c6]" />
          <span className="h-2 w-2 rounded-full bg-[#d9d3c6]" />
          <span className="h-2 w-2 rounded-full bg-[#d9d3c6]" />
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-[#e4dfd2] px-6 py-0.5 text-[10px] text-ds-ink-2">seowise.app</span>
      </div>
      <div className="grid grid-cols-[44px_150px_1fr] max-md:grid-cols-[1fr]">
        <aside className="flex flex-col items-center gap-3 border-r border-ds-line py-3 text-ds-ink-2 max-md:hidden">
          {[IconLoupe, IconCrawler, IconSpark, IconReport].map((I, i) => (
            <span key={i} className={`flex h-7 w-7 items-center justify-center rounded-md ${i === 0 ? "bg-[#e9e3d5] text-ds-ink" : ""}`}>
              <I className="h-4 w-4" />
            </span>
          ))}
        </aside>
        <aside className="border-r border-ds-line p-3 text-[11px] max-md:hidden">
          <p className="mb-2 text-ds-ink-3">Audit</p>
          {["Verdict", "Top fixes", "AI lens", "Full audit", "Page facts"].map((s, i) => (
            <div key={s} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 1 ? "bg-[#e9e3d5] font-medium" : "text-ds-ink-2"}`}>
              <span className={`h-2.5 w-2.5 rounded-full border ${i < 1 ? "border-[#5c7c68] bg-[#5c7c68]" : "border-ds-ink-3"}`} />
              {s}
            </div>
          ))}
          <p className="mb-2 mt-5 text-ds-ink-3">Saved</p>
          {["acme-bakery.example", "northside-dental.example"].map((s) => (
            <div key={s} className="truncate px-2 py-1 text-ds-ink-2">
              {s}
            </div>
          ))}
        </aside>
        <main className="min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-serif text-[19px] leading-tight">northside-dental.example/services</p>
              <p className="text-[10.5px] text-ds-ink-3">Audited just now · HTTP 200 · 640 ms</p>
            </div>
            <span className="shrink-0 rounded-md border border-ds-line bg-white/60 px-2 py-1 text-[10px]">Export PDF</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-5 rounded-[10px] border border-ds-line bg-white/50 p-3">
            <MiniRing v={72} label="SEO score" />
            <MiniRing v={58} label="AI ready" />
            <p className="min-w-[150px] flex-1 text-[11.5px] leading-4 text-ds-ink-2">
              <span className="font-medium text-ds-ink">Needs work.</span> Three fixes will move the needle; one blocks AI search outright.
            </p>
          </div>
          <p className="mb-2 mt-4 text-[11.5px] font-medium">Top fixes, in order</p>
          <div className="space-y-1.5">
            {FIXES.map((f, i) => (
              <div key={f.t} className="flex items-center gap-2.5 rounded-[9px] border border-ds-line bg-white/55 px-3 py-2 text-[11.5px]">
                <span className="font-mono text-[10px] text-ds-ink-3">0{i + 1}</span>
                <span className={`min-w-0 flex-1 truncate ${f.done ? "text-ds-ink-3 line-through" : ""}`}>{f.t}</span>
                <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-medium ${f.tag === "AI" ? "bg-[#f9e0cf] text-[#a5552d]" : "bg-[#ece7da] text-ds-ink-2"}`}>{f.tag}</span>
                {f.done ? (
                  <span className="flex items-center gap-1 text-[10px] text-[#5c7c68]">
                    <IconCheckCircle className="h-3.5 w-3.5" /> Fixed
                  </span>
                ) : (
                  <span className="text-[10px] text-ds-ink-3">Open</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-[9px] border border-dashed border-ds-line-strong py-2 text-center text-[11px] text-ds-ink-2">+ Add to client report</div>
        </main>
      </div>
    </div>
  );
}
