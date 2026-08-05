import type { SVGProps } from "react";

/**
 * Hand-authored line-art icon set for schema.org entity types. Deliberately
 * not sourced from an icon package (lucide-react et al. are off-limits per
 * brand guidelines) — each glyph is a small bespoke SVG built from primitive
 * shapes so the set reads as one consistent family.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function OrganizationIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="4" y="3" width="12" height="18" />
      <path d="M8 7h4M8 11h4M8 15h4M16 10h4v11h-4" />
    </svg>
  );
}

export function WebsiteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

export function BreadcrumbIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 12h4l2-4h4l2 4h4" />
      <circle cx="7" cy="12" r="1.4" />
      <circle cx="13" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  );
}

export function ArticleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function FaqIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 17a7 7 0 1 0-4.9-2" />
      <path d="M4 21l2.7-2.9" />
      <path d="M12 8.5c1.4 0 2.2.8 2.2 1.8 0 1.4-2.2 1.4-2.2 3.2" />
      <circle cx="12" cy="15.6" r="0.15" fill="currentColor" />
    </svg>
  );
}

export function HowToIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 6h1M5 12h1M5 18h1" />
      <path d="M9 6h10M9 12h10M9 18h6" />
    </svg>
  );
}

export function LocalBusinessIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 10 12 4l8 6" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function ProductIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3 20 7v10l-8 4-8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </svg>
  );
}

export function SoftwareAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3" y="5" width="18" height="12" rx="1" />
      <path d="M3 17h18M9 21h6" />
      <path d="M8 9l-2 2 2 2M16 9l2 2-2 2" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 21c1-4.2 4-6.4 7-6.4s6 2.2 7 6.4" />
    </svg>
  );
}

export function EventIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="1" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <circle cx="8.5" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ReviewIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z" />
    </svg>
  );
}

export function VideoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3" y="6" width="13" height="12" rx="1" />
      <path d="M16 10.5 21 7.5v9L16 13.5" />
    </svg>
  );
}

export function RecipeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 3v6a3 3 0 0 0 3 3v9M9 3v6M12 3v6" />
      <path d="M18 3c-1.6 1.2-2.4 2.8-2.4 5s.8 3.8 2.4 5v8" />
    </svg>
  );
}

export function GraphIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M7.8 7.3 10.5 16M16.2 7.3 13.5 16M8.2 6h7.6" />
    </svg>
  );
}

export function CheckRingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.6 2.6L16.4 9" />
    </svg>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M12 15 15.5 9.5" />
      <path d="M4 15h.01M20 15h.01M12 15h.01" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18" />
    </svg>
  );
}

export function JobPostingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3.5" y="7" width="17" height="13" rx="1" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3.5 12h17" />
    </svg>
  );
}

export function CourseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 6.5 12 3l9 3.5-9 3.5-9-3.5Z" />
      <path d="M7 9v6c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V9" />
    </svg>
  );
}

export function ServiceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21" />
      <path d="M6.3 6.3 8 8M16 16l1.7 1.7M6.3 17.7 8 16M16 8l1.7-1.7" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  );
}

export function QAPageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 5h16v10H9l-4 3v-3H4z" />
      <path d="M10 9c0-1 .8-1.6 2-1.6s2 .6 2 1.6c0 1.2-2 1.2-2 2.6" />
      <circle cx="12" cy="14.2" r="0.15" fill="currentColor" />
    </svg>
  );
}

export function DatasetIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}

export function MovieIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M7 5 5 9M13 5l-2 4M19 5l-2 4" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 4.5C5.5 3.7 7.5 3.5 9 4c1 .3 2 .9 3 1.6C13 4.9 14 4.3 15 4c1.5-.5 3.5-.3 5 .5v14c-1.5-.8-3.5-1-5-.5-1 .3-2 .9-3 1.6-1-.7-2-1.3-3-1.6-1.5-.5-3.5-.3-5 .5Z" />
      <path d="M12 5.6v13" />
    </svg>
  );
}
