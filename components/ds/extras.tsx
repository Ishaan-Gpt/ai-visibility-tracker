import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

/** Circular score gauge. Color follows the design-system status tokens. */
export function ScoreRing({ score, size = 112, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 80 ? "var(--ds-success)" : score >= 50 ? "var(--ds-warning)" : "var(--ds-danger)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Score"}: ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ds-line)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.max(0, Math.min(100, score))) / 100}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[32px] font-normal leading-8 tracking-[-0.02em] text-ds-ink">{score}</div>
        {label && <div className="text-[12px] text-ds-ink-2">{label}</div>}
      </div>
    </div>
  );
}

const SEVERITY = {
  error: { icon: AlertCircle, cls: "text-ds-danger bg-ds-danger/10", label: "Error" },
  warning: { icon: AlertTriangle, cls: "text-ds-warning bg-ds-warning/10", label: "Warning" },
  info: { icon: Info, cls: "text-ds-ink-2 bg-ds-muted", label: "Info" },
  pass: { icon: CheckCircle2, cls: "text-ds-success bg-ds-success/10", label: "Pass" },
} as const;

export function SeverityIcon({ severity }: { severity: keyof typeof SEVERITY }) {
  const { icon: Icon, cls, label } = SEVERITY[severity];
  return (
    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cls}`} title={label}>
      <Icon className="h-4 w-4" strokeWidth={2} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
