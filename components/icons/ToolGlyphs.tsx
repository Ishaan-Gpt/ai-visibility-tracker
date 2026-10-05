import type { SVGProps } from "react";

/* One hand-drawn glyph per tool, same duotone language as the studio icons (ink line + apricot wash). */

type P = SVGProps<SVGSVGElement>;
const W = "#f2a97f";

function G({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {children}
    </svg>
  );
}

const GLYPHS: Record<string, (p: P) => React.ReactElement> = {
  "page-audit": (p) => (
    <G {...p}>
      <path d="M6 3.5h8.5L18 7v6" />
      <path d="M6 3.5v17h6" />
      <circle cx="15.6" cy="15.6" r="3.2" fill={W} stroke="none" />
      <circle cx="15.6" cy="15.6" r="3.4" />
      <path d="m18.1 18.1 2.6 2.6" strokeWidth="1.8" />
      <path d="M8.6 8.4h5M8.6 11.4h3" />
    </G>
  ),
  "ai-crawler-check": (p) => (
    <G {...p}>
      <rect x="5.4" y="8" width="13.2" height="10.4" rx="3" fill={W} stroke="none" opacity=".7" />
      <rect x="5" y="7.6" width="14" height="11" rx="3.2" />
      <path d="M12 7.6V4.8" />
      <circle cx="12" cy="4" r=".9" />
      <path d="M9.5 12.2h.01M14.5 12.2h.01" strokeWidth="2.4" />
      <path d="M2.8 12.4v2.4M21.2 12.4v2.4" />
    </G>
  ),
  "llms-txt-generator": (p) => (
    <G {...p}>
      <path d="M7 4h10v16H7z" fill={W} stroke="none" opacity=".55" transform="translate(1.2 1)" />
      <path d="M6 3.6h12v16.8H6z" />
      <path d="M9 8h6M9 11h6M9 14h3.4" />
      <path d="M14.6 16.6l1.4 1.4 2.6-2.8" />
    </G>
  ),
  "schema-generator": (p) => (
    <G {...p}>
      <circle cx="12" cy="12" r="2.6" fill={W} stroke="none" />
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="5" cy="6" r="1.8" />
      <circle cx="19" cy="6" r="1.8" />
      <circle cx="12" cy="20" r="1.8" />
      <path d="M6.4 7.2 10 10.4M17.6 7.2 14 10.4M12 14.4v3.8" />
    </G>
  ),
  "sitemap-xml-generator": (p) => (
    <G {...p}>
      <rect x="9" y="3.6" width="6" height="4.4" rx="1" fill={W} stroke="none" />
      <rect x="9" y="3.6" width="6" height="4.4" rx="1" />
      <rect x="3.4" y="16" width="5" height="4.4" rx="1" />
      <rect x="9.5" y="16" width="5" height="4.4" rx="1" />
      <rect x="15.6" y="16" width="5" height="4.4" rx="1" />
      <path d="M12 8v4M5.9 16v-2.4c0-.9.7-1.6 1.6-1.6h9c.9 0 1.6.7 1.6 1.6V16M12 12v4" />
    </G>
  ),
  "sitemap-html-generator": (p) => (
    <G {...p}>
      <path d="M3.6 6.4c0-1 .8-1.8 1.8-1.8h13.2c1 0 1.8.8 1.8 1.8v11.2c0 1-.8 1.8-1.8 1.8H5.4c-1 0-1.8-.8-1.8-1.8z" />
      <path d="M3.6 8.6h16.8" />
      <rect x="6.4" y="11.2" width="4.4" height="5.2" rx=".8" fill={W} stroke="none" />
      <path d="M13 11.8h4.6M13 14.2h3.2M13 16.6h4" />
    </G>
  ),
  "meta-tag-preview": (p) => (
    <G {...p}>
      <rect x="3.6" y="5" width="16.8" height="14" rx="2.4" />
      <path d="M6.6 9.4h8.6" strokeWidth="2.2" stroke={W} />
      <path d="M6.6 9.4h8.6" />
      <path d="M6.6 12.6h10.8M6.6 15.2h7" strokeOpacity=".6" />
    </G>
  ),
  "keyword-research": (p) => (
    <G {...p}>
      <path d="M4 16.6c2.4-1 4-3.4 5-6.2 1 2 2.4 3.2 4.4 3.4 2.4.2 4.4-2.2 6.6-6.2" />
      <circle cx="9" cy="10.4" r="1.6" fill={W} stroke="none" />
      <circle cx="13.4" cy="13.8" r="1.6" fill={W} stroke="none" />
      <path d="M17.6 7.6H20v2.4" />
      <path d="M4 20h16" strokeOpacity=".5" />
    </G>
  ),
  "keyword-density-checker": (p) => (
    <G {...p}>
      <path d="M5 19V13M9.6 19V8M14.2 19v-4.4M18.8 19V5.4" strokeWidth="2.4" stroke={W} />
      <path d="M5 19V13M9.6 19V8M14.2 19v-4.4M18.8 19V5.4" />
      <path d="M3.4 19.8h17.2" />
    </G>
  ),
  "ai-visibility-tracker": (p) => (
    <G {...p}>
      <path d="M4 7.4c0-1.2 1-2.2 2.2-2.2h11.6c1.2 0 2.2 1 2.2 2.2v6.8c0 1.2-1 2.2-2.2 2.2H11l-4.4 3.4v-3.4h-.4A2.2 2.2 0 0 1 4 14.2z" fill={W} fillOpacity=".45" />
      <path d="M12 7.8c.3 1.8.9 2.5 2.6 3-1.7.5-2.3 1.2-2.6 3-.3-1.8-.9-2.5-2.6-3 1.7-.5 2.3-1.2 2.6-3z" />
    </G>
  ),
};

export function ToolGlyph({ slug, ...p }: P & { slug: string }) {
  const Glyph = GLYPHS[slug] ?? GLYPHS["page-audit"];
  return <Glyph {...p} />;
}
