import { SCHEMA_VOCAB, SCHEMA_VOCAB_VERSION } from "./schemaVocab";

export { SCHEMA_VOCAB_VERSION };

interface VocabEntry {
  parents: string[];
  superseded: boolean;
}

let index: Map<string, VocabEntry> | null = null;

function vocab(): Map<string, VocabEntry> {
  if (index) return index;
  index = new Map();
  for (const raw of SCHEMA_VOCAB.split(";")) {
    if (!raw) continue;
    const superseded = raw.startsWith("!");
    const [name, parents = ""] = (superseded ? raw.slice(1) : raw).split(">");
    index.set(name, { parents: parents ? parents.split(",") : [], superseded });
  }
  return index;
}

/** Accepts "Product", "schema:Product" or "https://schema.org/Product". */
export function normalizeType(type: string): string {
  return type.trim().replace(/^https?:\/\/schema\.org\//i, "").replace(/^schema:/i, "");
}

export function isKnownType(type: string): boolean {
  return vocab().has(normalizeType(type));
}

export function isSupersededType(type: string): boolean {
  return vocab().get(normalizeType(type))?.superseded ?? false;
}

/** Every ancestor of a type (multiple inheritance included), nearest first. */
export function ancestorsOf(type: string): string[] {
  const out: string[] = [];
  const queue = [...(vocab().get(normalizeType(type))?.parents ?? [])];
  while (queue.length) {
    const t = queue.shift()!;
    if (out.includes(t)) continue;
    out.push(t);
    queue.push(...(vocab().get(t)?.parents ?? []));
  }
  return out;
}

export function isSubtypeOf(type: string, ancestor: string): boolean {
  const t = normalizeType(type);
  return t === ancestor || ancestorsOf(t).includes(ancestor);
}

/** Closest known type names for a misspelt one (case-insensitive, then edit distance <= 2). */
export function suggestType(type: string): string | null {
  const t = normalizeType(type);
  const lower = t.toLowerCase();
  let best: { name: string; d: number } | null = null;
  for (const name of vocab().keys()) {
    if (name.toLowerCase() === lower) return name;
    if (Math.abs(name.length - t.length) > 2) continue;
    const d = distance(lower, name.toLowerCase());
    if (d <= 2 && (!best || d < best.d)) best = { name, d };
  }
  return best?.name ?? null;
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}
