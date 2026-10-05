import type { SVGProps } from "react";

/*
 * Studio icon set. Duotone: a 1.4px ink line plus one soft apricot "wash" shape that sits slightly off-register
 * behind the line, like a hand-tinted engraving. `--duo` controls the wash (defaults to the accent).
 */

type P = SVGProps<SVGSVGElement> & { active?: boolean };

function Svg({ active, children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-active={active ? "" : undefined}
      className={`group/icon ${p.className ?? ""}`}
      {...p}
    >
      {children}
    </svg>
  );
}

const wash = "fill-[var(--duo,#f2a97f)] stroke-none opacity-0 transition-opacity duration-500 group-data-[active]/icon:opacity-100";

/** Overview: an arched window with four panes. */
export const IcWindow = (p: P) => (
  <Svg {...p}>
    <path className={wash} d="M7.6 20.4V11a4.9 4.9 0 0 1 9.8 0v9.4z" />
    <path d="M5.5 20.5V10.2a6.5 6.5 0 0 1 13 0v10.3z" />
    <path d="M12 3.8v16.7M5.6 13.6h12.8" />
    <path d="M4 20.5h16" />
  </Svg>
);

/** Saved reports: a dossier with a tab and a sheet peeking out. */
export const IcDossier = (p: P) => (
  <Svg {...p}>
    <path className={wash} d="M5 9.2h15v9.6H5z" />
    <path d="M7.4 6.4V4.6h9.2l2 2" />
    <path d="M3.6 8.2c0-.8.6-1.4 1.4-1.4h4.3l1.6 1.6h8.1c.8 0 1.4.6 1.4 1.4v8.6c0 .8-.6 1.4-1.4 1.4H5c-.8 0-1.4-.6-1.4-1.4z" />
    <path d="M9 14h6" />
  </Svg>
);

/** AI visibility: an eye inside a loupe, with a spark. */
export const IcSeer = (p: P) => (
  <Svg {...p}>
    <circle className={wash} cx="10.3" cy="10.3" r="4.2" />
    <circle cx="10.3" cy="10.3" r="6.3" />
    <path d="M6.5 10.3s1.5-2.4 3.8-2.4 3.8 2.4 3.8 2.4-1.5 2.4-3.8 2.4-3.8-2.4-3.8-2.4z" />
    <circle cx="10.3" cy="10.3" r=".9" fill="currentColor" />
    <path d="m15 15 4.8 4.8" strokeWidth="2" />
    <path d="M19.4 3.2v2.6M18.1 4.5h2.6" />
  </Svg>
);

/** Plan & billing: a ticket with notches and a perforated stub. */
export const IcTicket = (p: P) => (
  <Svg {...p}>
    <path className={wash} d="M15.4 6.4h3.8v11.2h-3.8z" />
    <path d="M3.5 6.4h17v3.4a2.2 2.2 0 0 0 0 4.4v3.4h-17v-3.4a2.2 2.2 0 0 0 0-4.4z" />
    <path d="M15.2 6.8v1.4M15.2 10.6v1.2M15.2 13.9v1.2M15.2 16.4v.8" />
    <path d="M7 10.4h4.6M7 13.4h3" />
  </Svg>
);

/** Tools: a draughtsman's compass. */
export const IcCompass = (p: P) => (
  <Svg {...p}>
    <circle className={wash} cx="12" cy="5.4" r="2.2" />
    <circle cx="12" cy="5.4" r="1.7" />
    <path d="M11.2 7 5.6 20.2M12.8 7l5.6 13.2" />
    <path d="M7.4 15.4c3 1.4 6.2 1.4 9.2 0" />
  </Svg>
);

/** Sign out: a door left ajar with a small step out. */
export const IcDoor = (p: P) => (
  <Svg {...p}>
    <path className={wash} d="M6 4.4 12.6 6v14L6 18.6z" />
    <path d="M6 20.2V3.8h8.6v3.4M14.6 16.8v3.4H6" />
    <path d="M6 3.8l6.6 2.2v14.2" />
    <path d="M16 12h5.2M19 9.8l2.2 2.2-2.2 2.2" />
  </Svg>
);

export const IcPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5.2c.2 4.6.2 9 0 13.6M5.2 12c4.6-.2 9-.2 13.6 0" />
  </Svg>
);

/** A bin whose lid lifts on hover (pass className "group" on the parent). */
export const IcBin = (p: P) => (
  <Svg {...p}>
    <path className="origin-[18px_6px] transition-transform duration-300 group-hover:-rotate-[14deg]" d="M4.6 6.6h14.8M9.6 6.4V4.6h4.8v1.8" />
    <path d="M6.4 9l.9 10.2c.1.7.6 1.2 1.3 1.2h6.8c.7 0 1.2-.5 1.3-1.2l.9-10.2" />
    <path d="M10.2 11.6v5.6M13.8 11.6v5.6" />
  </Svg>
);

export const IcPause = (p: P) => (
  <Svg {...p}>
    <path d="M9 6.5v11M15 6.5v11" strokeWidth="1.8" />
  </Svg>
);

export const IcPlay = (p: P) => (
  <Svg {...p}>
    <path d="M8.4 5.8v12.4c0 .5.5.8.9.5l9.2-6.2c.4-.3.4-.8 0-1L9.3 5.3c-.4-.3-.9 0-.9.5z" />
  </Svg>
);

export const IcOpen = (p: P) => (
  <Svg {...p}>
    <path d="M7 17 17.2 6.8M9.4 6.6h7.9v7.9" />
  </Svg>
);

export const IcCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.6 4.3 4L19.2 6.8" strokeWidth="1.7" />
  </Svg>
);

/** Empty-state illustration: an open dossier with a single loose sheet floating out. */
export function EmptyDossier({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} fill="none" aria-hidden>
      <ellipse cx="80" cy="108" rx="54" ry="5" fill="#2b2927" opacity="0.06" />
      <path d="M30 44h100v54c0 3-2 5-5 5H35c-3 0-5-2-5-5z" fill="#f9e0cf" />
      <path d="M30 44h38l7-8h50c3 0 5 2 5 5v3" stroke="#2b2927" strokeWidth="1.4" strokeLinejoin="round" />
      <g className="origin-center animate-[float_5s_ease-in-out_infinite]">
        <path d="M58 18h40l8 8v38H58z" fill="#faf8f2" stroke="#2b2927" strokeWidth="1.4" strokeLinejoin="round" transform="rotate(-6 80 40)" />
        <path d="M65 34h26M65 41h20M65 48h24" stroke="#2b2927" strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" transform="rotate(-6 80 40)" />
      </g>
      <path d="M26 56h108l-6 47c-.3 2.4-2.4 4-4.8 4H36.8c-2.4 0-4.5-1.6-4.8-4z" fill="#faf8f2" stroke="#2b2927" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M64 78h32" stroke="#2b2927" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
