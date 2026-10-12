import { ancestorsOf, isKnownType, normalizeType } from "@/lib/audit/vocab";
import { SCHEMA_ENUMS, SCHEMA_PROPS } from "@/lib/tools/validation/schemaPropsData";

/**
 * Property-level view of the schema.org vocabulary (domains, ranges, supersession,
 * enumeration members), built lazily from the compact strings in schemaPropsData.ts.
 */

export interface PropInfo {
  name: string;
  domains: string[];
  ranges: string[];
  superseded: boolean;
  supersededBy: string[];
  pending: boolean;
}

let props: Map<string, PropInfo> | null = null;
let lowerProps: Map<string, string> | null = null;
let enums: Map<string, Set<string>> | null = null;
const typePropCache = new Map<string, Set<string>>();

function propIndex(): Map<string, PropInfo> {
  if (props) return props;
  props = new Map();
  lowerProps = new Map();
  for (const raw of SCHEMA_PROPS.split(";")) {
    if (!raw) continue;
    const flag = raw[0] === "!" || raw[0] === "?" ? raw[0] : "";
    const [name, domains = "", ranges = "", supersededBy = ""] = (flag ? raw.slice(1) : raw).split(">");
    props.set(name, {
      name,
      domains: domains ? domains.split(",") : [],
      ranges: ranges ? ranges.split(",") : [],
      superseded: flag === "!",
      supersededBy: supersededBy ? supersededBy.split(",") : [],
      pending: flag === "?",
    });
    lowerProps.set(name.toLowerCase(), name);
  }
  return props;
}

function enumIndex(): Map<string, Set<string>> {
  if (enums) return enums;
  enums = new Map();
  for (const raw of SCHEMA_ENUMS.split(";")) {
    if (!raw) continue;
    const [name, members = ""] = raw.split(">");
    enums.set(name, new Set(members.split(",").filter(Boolean)));
  }
  return enums;
}

/** Accepts "name", "schema:name" or "https://schema.org/name". */
export function normalizeProperty(key: string): string {
  return key.trim().replace(/^https?:\/\/(www\.)?schema\.org\//i, "").replace(/^schema:/i, "");
}

export function propertyInfo(name: string): PropInfo | null {
  return propIndex().get(normalizeProperty(name)) ?? null;
}

/** Type plus all of its ancestors. */
export function typeChain(type: string): string[] {
  const t = normalizeType(type);
  return [t, ...ancestorsOf(t)];
}

/** True when `prop` is defined for `type` or any ancestor (schema.org domainIncludes). */
export function typeAllowsProperty(type: string, prop: string): boolean {
  const info = propertyInfo(prop);
  if (!info) return false;
  const chain = typeChain(type);
  return info.domains.some((d) => chain.includes(d));
}

export function propertiesOfType(type: string): Set<string> {
  const t = normalizeType(type);
  const hit = typePropCache.get(t);
  if (hit) return hit;
  const chain = new Set(typeChain(t));
  const out = new Set<string>();
  for (const info of propIndex().values()) if (info.domains.some((d) => chain.has(d))) out.add(info.name);
  typePropCache.set(t, out);
  return out;
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

/** Closest real property for a misspelt one: exact case-insensitive match first, then edit distance ≤ 2 among the type's own properties, then all properties. */
export function suggestProperty(prop: string, types: string[]): string | null {
  const p = normalizeProperty(prop);
  propIndex();
  const ci = lowerProps!.get(p.toLowerCase());
  if (ci && ci !== p) return ci;
  const lower = p.toLowerCase();
  const pools: Iterable<string>[] = [];
  const known = types.filter(isKnownType);
  if (known.length) {
    const own = new Set<string>();
    for (const t of known) for (const x of propertiesOfType(t)) own.add(x);
    pools.push(own);
  }
  pools.push(propIndex().keys());
  for (const pool of pools) {
    let best: { name: string; d: number } | null = null;
    for (const name of pool) {
      if (Math.abs(name.length - p.length) > 2) continue;
      const d = distance(lower, name.toLowerCase());
      if (d <= 2 && (!best || d < best.d)) best = { name, d };
    }
    if (best) return best.name;
  }
  return null;
}

export function enumerationMembers(enumType: string): Set<string> | null {
  return enumIndex().get(normalizeType(enumType)) ?? null;
}

/** Which enumeration (if any) a member name belongs to, e.g. "InStock" → ["ItemAvailability"]. */
export function enumerationsOfMember(member: string): string[] {
  const m = normalizeType(member);
  const out: string[] = [];
  for (const [name, members] of enumIndex()) if (members.has(m)) out.push(name);
  return out;
}
