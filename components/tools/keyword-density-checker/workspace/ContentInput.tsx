"use client";

type ContentInputProps = {
  content: string;
  onContentChange: (value: string) => void;
  keywordsRaw: string;
  onKeywordsRawChange: (value: string) => void;
  wordCount: number;
};

export function ContentInput({ content, onContentChange, keywordsRaw, onKeywordsRawChange, wordCount }: ContentInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block font-body text-xs font-medium text-foreground/70">Content</label>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={16}
          className="w-full resize-none rounded-2xl border border-foreground/15 bg-background p-4 font-body text-sm text-foreground/80 outline-none focus:border-primary"
        />
        <p className="mt-2 font-body text-xs text-foreground/40">{wordCount} words</p>
      </div>
      <div>
        <label className="mb-1.5 block font-body text-xs font-medium text-foreground/70">
          Target keyword(s) — optional, comma-separated
        </label>
        <input
          value={keywordsRaw}
          onChange={(e) => onKeywordsRawChange(e.target.value)}
          placeholder="e.g. ai visibility tracker, schema markup"
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
