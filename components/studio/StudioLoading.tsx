/** Glass skeleton in the studio's own shape, with the loupe scanning a hairline while data loads. */
export function StudioLoading({ label = "Opening your studio" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="skeleton h-12 w-[min(420px,80vw)] rounded-[14px]" />
          <div className="skeleton h-4 w-[min(360px,70vw)] rounded-full" />
        </div>
        <div className="skeleton h-14 w-[min(420px,90vw)] rounded-[18px]" />
      </div>

      <div className="relative mx-auto mb-8 h-6 max-w-[320px]">
        <span className="absolute left-0 right-0 top-1/2 h-px bg-ds-ink/15" />
        <svg viewBox="0 0 24 24" className="absolute top-0 h-6 w-6 animate-[scan_1.8s_ease-in-out_infinite] text-ds-ink" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6" fill="#f2a97f" fillOpacity=".35" />
          <path d="m15 15 4.6 4.6" strokeWidth="2.2" />
        </svg>
        <p className="absolute left-0 right-0 top-8 text-center font-serif text-[18px] italic text-ds-ink-2">{label}…</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="glass h-[340px] rounded-[24px] p-6">
          <div className="skeleton h-7 w-56 rounded-[10px]" />
          <div className="mt-10 flex justify-around">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-[168px] w-[54px] rounded-b-[27px] rounded-t-[10px]" />
            ))}
          </div>
        </div>
        <div className="skeleton h-[340px] rounded-b-[24px] rounded-t-[999px]" />
      </div>
      <div className="glass mt-10 space-y-px overflow-hidden rounded-[24px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5">
            <div className="skeleton h-11 w-11 rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/2 rounded-full" />
              <div className="skeleton h-3 w-1/3 rounded-full" />
            </div>
            <div className="skeleton h-11 w-11 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
