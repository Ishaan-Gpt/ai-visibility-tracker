import { type ElementType, type ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  as?: ElementType;
  /** "full" pins the section to 100dvh; "auto" lets content dictate height. */
  height?: "full" | "auto";
  /** Background token — deliberately narrow: no grey backgrounds for large sections. */
  tone?: "background" | "foreground";
  className?: string;
  containerClassName?: string;
  children: ReactNode;
};

/**
 * Canonical section wrapper for every tool landing page. Centralizes the
 * 100vh/auto height contract, container width, and vertical rhythm so every
 * section in every tool (this one and the four that follow) stays consistent
 * without re-deriving spacing rules per component.
 */
export function SectionShell({
  id,
  as: Tag = "section",
  height = "auto",
  tone = "background",
  className = "",
  containerClassName = "",
  children,
}: SectionShellProps) {
  const toneClasses =
    tone === "foreground" ? "bg-foreground text-background" : "bg-background text-foreground";

  const heightClasses = height === "full" ? "min-h-[100dvh] flex flex-col justify-center" : "py-24 md:py-32";

  return (
    <Tag id={id} className={`relative w-full overflow-hidden ${toneClasses} ${heightClasses} ${className}`}>
      <div className={`mx-auto w-full max-w-6xl px-6 md:px-10 ${containerClassName}`}>{children}</div>
    </Tag>
  );
}
