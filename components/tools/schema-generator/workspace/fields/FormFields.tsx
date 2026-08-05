"use client";

type FieldWrapProps = { label: string; hint?: string; children: React.ReactNode };

function FieldWrap({ label, hint, children }: FieldWrapProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-xs font-medium text-foreground/70">{label}</span>
      {children}
      {hint ? <span className="mt-1 block font-body text-[11px] text-foreground/35">{hint}</span> : null}
    </label>
  );
}

const inputClasses =
  "w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm text-foreground outline-none transition-colors focus:border-primary";

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <FieldWrap label={label} hint={hint}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
      />
    </FieldWrap>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <FieldWrap label={label} hint={hint}>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClasses} resize-none`}
      />
    </FieldWrap>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  hint?: string;
}) {
  return (
    <FieldWrap label={label} hint={hint}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClasses}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

export function StringListField({
  label,
  values,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block font-body text-xs font-medium text-foreground/70">{label}</span>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={v}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              className={inputClasses}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="shrink-0 rounded-lg border border-foreground/15 px-3 text-sm text-foreground/50 hover:text-foreground"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="mt-2 font-body text-xs text-primary hover:underline"
      >
        + Add
      </button>
      {hint ? <span className="mt-1 block font-body text-[11px] text-foreground/35">{hint}</span> : null}
    </div>
  );
}

export function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="font-body text-[11px] font-medium uppercase tracking-[0.1em] text-foreground/40">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
