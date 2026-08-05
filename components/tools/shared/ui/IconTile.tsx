import { type ReactNode } from "react";

type IconTileProps = {
  children: ReactNode;
  tone?: "primary" | "ink";
  size?: "sm" | "md";
  className?: string;
};

/**
 * Consistent sizing/background wrapper for the hand-authored inline SVG icon
 * set in `components/tools/shared/icons/` — never a third-party icon package.
 */
export function IconTile({ children, tone = "primary", size = "md", className = "" }: IconTileProps) {
  const toneClasses = tone === "primary" ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground";
  const sizeClasses = size === "sm" ? "h-9 w-9 [&>svg]:h-4 [&>svg]:w-4" : "h-12 w-12 [&>svg]:h-5 [&>svg]:w-5";

  return (
    <div className={`flex items-center justify-center rounded-xl ${sizeClasses} ${toneClasses} ${className}`}>
      {children}
    </div>
  );
}
