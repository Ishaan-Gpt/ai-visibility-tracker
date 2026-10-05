import type { SVGProps } from "react";

/* Hand-drawn seowise icon set. Fine 1.4px strokes, rounded joins, slightly asymmetric shapes so they read as drawn, not stock. */

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

/** Tick inside a hand-closed circle (the gap at 1 o'clock is deliberate). */
export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}>
    <path d="M17.6 4.9A9 9 0 1 0 20.6 9.4" />
    <path d="m8 12.3 2.7 2.6L20.4 5" />
  </svg>
);

export const IconTick = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.6 4.3 4L19.2 6.8" />
  </svg>
);

/** Arrow with a soft, slightly curved shaft. */
export const IconArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.2c4.6-.4 9.5-.3 14.6 0" />
    <path d="m13.8 6.6 5.4 5.6-5.4 5.4" />
  </svg>
);

export const IconArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 19.5c.2-4.8.2-9.6 0-14.6" />
    <path d="m6.6 10.2 5.4-5.4 5.4 5.4" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m6.5 9.5 5.5 5.2 5.5-5.2" />
  </svg>
);

/** Loupe whose handle ends in a small spark: "seeing" a page. */
export const IconLoupe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 4.6 4.6" />
    <path d="M8.2 9.1c.4-1 1.2-1.6 2.3-1.8" />
  </svg>
);

/** A crawler: a small robot head with antenna, drawn as one wobbly outline. */
export const IconCrawler = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9.5c0-1.4 1.1-2.5 2.5-2.5h7c1.4 0 2.5 1.1 2.5 2.5v6c0 1.4-1.1 2.5-2.5 2.5h-7A2.5 2.5 0 0 1 6 15.5z" />
    <path d="M12 7V4.6" />
    <circle cx="12" cy="3.8" r=".8" />
    <path d="M9.6 12h.01M14.4 12h.01" strokeWidth="2.2" />
    <path d="M10.2 15.1c1.1.6 2.5.6 3.6 0" />
  </svg>
);

/** Folded page with a ribbon corner: the client PDF. */
export const IconReport = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.8h8.4L18.5 8v12.2H6z" />
    <path d="M14.2 3.8V8h4.3" />
    <path d="M8.8 12.3h6.6M8.8 15.3h4.4" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5c.6 4.4 1.9 6.3 6.5 8.5-4.6 2.2-5.9 4.1-6.5 8.5-.6-4.4-1.9-6.3-6.5-8.5 4.6-2.2 5.9-4.1 6.5-8.5z" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7.2c0-1 .8-1.7 1.7-1.7h12.6c.9 0 1.7.8 1.7 1.7v9.6c0 1-.8 1.7-1.7 1.7H5.7c-.9 0-1.7-.8-1.7-1.7z" />
    <path d="m4.5 7 7.5 5.8L19.5 7" />
  </svg>
);

export const IconSpinner = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4a8 8 0 1 1-7.4 5" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8.5c5.3-.3 10.7-.3 16 0M4 15.5c5.3.3 10.7.3 16 0" />
  </svg>
);

export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

/** Shield with a small keyhole: "stays yours". */
export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.6 18.8 6v5.6c0 4.2-2.8 7.4-6.8 8.8-4-1.4-6.8-4.6-6.8-8.8V6z" />
    <circle cx="12" cy="11" r="1.4" />
    <path d="M12 12.4v2.8" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <path d="M19.8 13.6A8 8 0 1 1 12 4" />
    <path d="M12 8v4.4l2.8 1.8" />
    <path d="M16.4 4.9c.9.5 1.7 1.2 2.3 2" />
  </svg>
);

/* ---- Tool-workspace additions (same hand: 1.4px line, slightly imperfect curves) ---- */

/** Two offset sheets; the back one has a folded corner. */
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 8.4V5.6c0-.9.7-1.6 1.6-1.6h6.2l3.2 3.2v8.2c0 .9-.7 1.6-1.6 1.6h-2.6" />
    <path d="M16.6 4v3.4H20" />
    <rect x="4" y="8.4" width="11" height="11.6" rx="1.6" />
  </svg>
);

/** A drop falling into an open tray. */
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.6c.2 3.6.2 7.2 0 10.6" />
    <path d="m7.6 10.2 4.4 4.4 4.4-4.4" />
    <path d="M4.4 15.2v2.6c0 1.2.9 2.2 2.2 2.2h10.8c1.2 0 2.2-1 2.2-2.2v-2.6" />
  </svg>
);

/** The PDF: a page with a ribbon bookmark hanging off its top edge. */
export const IconPdf = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.6h8.2l3.8 3.8v13H6z" />
    <path d="M14 3.6v4h4" />
    <path d="M9 3.6v6l1.6-1.2 1.6 1.2v-6" />
    <path d="M8.8 14.2h6.4M8.8 17h4.2" />
  </svg>
);

export const IconBookmark = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <svg {...base(rest)}>
      <path d="M6.6 4.6c0-.6.5-1 1-1h8.8c.6 0 1 .4 1 1v15.6l-5.4-3.8-5.4 3.8z" fill={filled ? "currentColor" : "none"} fillOpacity={filled ? 0.18 : 0} />
      {filled && <path d="m9.4 9.6 1.8 1.8 3.6-3.8" />}
    </svg>
  );
};

/** An arrow chasing its own tail, open at the top. */
export const IconRerun = (p: P) => (
  <svg {...base(p)}>
    <path d="M19.4 12.6A7.5 7.5 0 1 1 16.6 6" />
    <path d="M17 2.8 16.6 6l3.2.6" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.4" width="14" height="10" rx="2.4" />
    <path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6" />
    <circle cx="12" cy="15.2" r="1.2" />
  </svg>
);

/** Error: a hand-cut octagon with a stroke. */
export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M8.4 3.6h7.2l4.8 4.8v7.2l-4.8 4.8H8.4l-4.8-4.8V8.4z" />
    <path d="M12 8v4.6" />
    <path d="M12 16h.01" strokeWidth="2.2" />
  </svg>
);

/** Warning: a softened triangle. */
export const IconWarn = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.4 4.6c.7-1.2 2.5-1.2 3.2 0l7 12.2c.7 1.2-.2 2.8-1.6 2.8h-14c-1.4 0-2.3-1.6-1.6-2.8z" />
    <path d="M12 9.4v4" />
    <path d="M12 16.4h.01" strokeWidth="2.2" />
  </svg>
);

export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.6 12a8.6 8.6 0 1 1-4.4-7.5" />
    <path d="M12 11v5.4" />
    <path d="M12 7.6h.01" strokeWidth="2.2" />
  </svg>
);

export const IconMinus = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.4 12c4.4-.3 8.8-.3 13.2 0" />
  </svg>
);

export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m14.5 6.5-5.2 5.5 5.2 5.5" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9.5 6.5 5.2 5.5-5.2 5.5" />
  </svg>
);

/** Sort caret: a single soft triangle, rotated for direction. */
export const IconCaret = (p: P) => (
  <svg {...base(p)}>
    <path d="M7.6 14.2 12 9l4.4 5.2z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPlusSmall = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5.6c.2 4.3.2 8.5 0 12.8M5.6 12c4.3-.2 8.5-.2 12.8 0" />
  </svg>
);

export const IconBin = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.6 6.6h14.8M9.6 6.4V4.6h4.8v1.8" />
    <path d="M6.4 9l.9 10.2c.1.7.6 1.2 1.3 1.2h6.8c.7 0 1.2-.5 1.3-1.2l.9-10.2" />
  </svg>
);

export const IconDesktop = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.6" y="4.6" width="16.8" height="11.4" rx="1.8" />
    <path d="M9 20h6M12 16v4" />
  </svg>
);

export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <rect x="7" y="3.4" width="10" height="17.2" rx="2.4" />
    <path d="M11 17.6h2" />
  </svg>
);
