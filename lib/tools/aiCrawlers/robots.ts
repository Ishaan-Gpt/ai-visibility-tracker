/**
 * robots.txt parser, evaluator and linter following RFC 9309 and Google's published parser behaviour:
 *  - groups start at a User-agent line that follows a rule; consecutive User-agent lines share a group
 *  - user-agent matching uses the product token ([A-Za-z_-]+) case-insensitively; groups for the same token merge
 *  - most specific (longest) matching rule wins, Allow wins ties; `*` wildcard and `$` end anchor
 *  - percent-encoding is normalised on both the rule and the path before matching
 *  - BOM, CRLF / CR line endings, rules before any User-agent (ignored), 500 KiB parse limit
 *  - /robots.txt itself is always allowed
 * Pure TypeScript with no Node imports so it runs in the browser too (path tester, generator preview).
 */

export interface RobotsRule {
  allow: boolean;
  pattern: string;
  /** 1-based line number in the source file. */
  line?: number;
}
export interface RobotsGroup {
  /** Lowercase product tokens ("*" for the wildcard group). */
  agents: string[];
  rules: RobotsRule[];
  /** Line of the group's first User-agent. */
  line?: number;
  crawlDelay?: number;
  /** Cloudflare Content Signals Policy, e.g. { search: true, "ai-train": false }. */
  contentSignals?: Record<string, boolean>;
}
export type LintLevel = "error" | "warning" | "info";
export interface RobotsLint {
  level: LintLevel;
  line: number | null;
  message: string;
}
export interface ParsedRobots {
  groups: RobotsGroup[];
  sitemaps: string[];
  lint?: RobotsLint[];
  /** RSL (Really Simple Licensing) License: URLs. */
  licenses?: string[];
  /** Non-standard Host: values (Yandex). */
  hosts?: string[];
  /** True when the source exceeded the 500 KiB limit and the remainder was ignored. */
  truncated?: boolean;
  /** True when the body looks like an HTML page rather than robots.txt. */
  looksLikeHtml?: boolean;
  lineCount?: number;
}

export const ROBOTS_MAX_BYTES = 500 * 1024;

const KEY_ALIASES: Record<string, string> = {
  "user-agent": "user-agent",
  useragent: "user-agent",
  "user agent": "user-agent",
  user_agent: "user-agent",
  disallow: "disallow",
  dissallow: "disallow",
  dissalow: "disallow",
  disalow: "disallow",
  diasllow: "disallow",
  disallaw: "disallow",
  allow: "allow",
  sitemap: "sitemap",
  "site-map": "sitemap",
  "crawl-delay": "crawl-delay",
  host: "host",
  noindex: "noindex",
  "clean-param": "clean-param",
  "request-rate": "request-rate",
  "visit-time": "visit-time",
  "content-signal": "content-signal",
  license: "license",
};

/** Product token used for group matching: the leading run of [A-Za-z_-], lowercased ("*" stays "*"). */
export function productToken(value: string): string {
  const v = value.trim();
  if (v.startsWith("*")) return "*";
  const m = v.match(/^[A-Za-z0-9_-]+/);
  return m ? m[0].toLowerCase() : "";
}

function byteLength(s: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s).length;
  return s.length;
}

function clipToBytes(s: string, max: number): string {
  if (byteLength(s) <= max) return s;
  // Binary search on character count so the clip respects multi-byte characters.
  let lo = 0;
  let hi = s.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (byteLength(s.slice(0, mid)) <= max) lo = mid;
    else hi = mid - 1;
  }
  return s.slice(0, lo);
}

export function looksLikeHtml(text: string): boolean {
  return /^\s*<(!doctype|html|head|body|\?xml|meta|script|title)/i.test(text.replace(/^\uFEFF/, "").slice(0, 600));
}

export function parseRobots(text: string): ParsedRobots {
  const lint: RobotsLint[] = [];
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  const hosts: string[] = [];
  const licenses: string[] = [];
  let source = (text ?? "").replace(/^\uFEFF/, "");
  const html = looksLikeHtml(source);
  if (html) lint.push({ level: "error", line: 1, message: "This is an HTML page, not a plain-text robots.txt. Crawlers find no valid rules in it, so everything is allowed." });

  let truncated = false;
  if (byteLength(source) > ROBOTS_MAX_BYTES) {
    truncated = true;
    source = clipToBytes(source, ROBOTS_MAX_BYTES);
    lint.push({ level: "error", line: null, message: "File is larger than 500 KiB. Google and RFC 9309 parsers ignore everything after that limit." });
  }

  let current: RobotsGroup | null = null;
  let groupHasRule = false; // a User-agent line after a rule starts a new group
  const lines = source.split(/\r\n|\r|\n/);
  const seenAgents = new Map<string, number>();
  let ruleOutsideWarned = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i].replace(/#.*$/, "").trim();
    if (!line) continue;

    let rawKey: string;
    let value: string;
    const idx = line.indexOf(":");
    if (idx !== -1) {
      rawKey = line.slice(0, idx).trim().toLowerCase();
      value = line.slice(idx + 1).trim();
    } else {
      // Google accepts "key value" without a colon when the key is recognisable.
      const m = line.match(/^(\S+)\s+(\S.*)$/);
      if (m && KEY_ALIASES[m[1].toLowerCase()]) {
        rawKey = m[1].toLowerCase();
        value = m[2].trim();
        if (!html) lint.push({ level: "warning", line: lineNo, message: `Missing colon after "${m[1]}". Google tolerates this; other parsers may not.` });
      } else {
        if (!html) lint.push({ level: "warning", line: lineNo, message: `Not a "field: value" line, so it is ignored: "${line.slice(0, 60)}"` });
        continue;
      }
    }
    const key = KEY_ALIASES[rawKey];
    if (key && key !== rawKey && !html) {
      lint.push({ level: "warning", line: lineNo, message: `"${rawKey}" is a misspelling of "${key}". Google accepts it; other crawlers may not.` });
    }

    switch (key) {
      case "user-agent": {
        if (!current || groupHasRule) {
          current = { agents: [], rules: [], line: lineNo };
          groups.push(current);
          groupHasRule = false;
        }
        const token = productToken(value);
        if (!token) {
          lint.push({ level: "error", line: lineNo, message: "User-agent has no usable name, so this line matches nothing." });
          break;
        }
        const trimmed = value.trim();
        if (token !== "*" && /^\/[\d.]+$/.test(trimmed.slice(token.length))) {
          lint.push({ level: "info", line: lineNo, message: `Version "${trimmed.slice(token.length)}" is ignored; "${trimmed.slice(0, token.length)}" still matches. Harmless, but the bare token is cleaner.` });
        } else if (token !== "*" && trimmed.toLowerCase() !== token) {
          lint.push({
            level: /\s|\//.test(trimmed) && /mozilla|compatible|\(/i.test(trimmed) ? "error" : "warning",
            line: lineNo,
            message: `Only "${trimmed.slice(0, token.length)}" is used for matching; "${trimmed.slice(token.length, token.length + 40)}" is ignored. Use the bare product token (e.g. GPTBot).`,
          });
        } else if (token === "*" && trimmed !== "*") {
          lint.push({ level: "warning", line: lineNo, message: `"${trimmed}" is read as the wildcard "*".` });
        }
        if (seenAgents.has(token) && seenAgents.get(token) !== groups.length - 1) {
          lint.push({ level: "info", line: lineNo, message: `"${token}" also appears in an earlier group (line ${groups[seenAgents.get(token)!].line}). Crawlers merge the rules of both groups.` });
        }
        seenAgents.set(token, groups.length - 1);
        current.agents.push(token);
        break;
      }
      case "allow":
      case "disallow": {
        if (!current) {
          if (!ruleOutsideWarned) {
            lint.push({ level: "warning", line: lineNo, message: `${key === "allow" ? "Allow" : "Disallow"} appears before any User-agent line, so it applies to no crawler and is ignored.` });
            ruleOutsideWarned = true;
          }
          break;
        }
        groupHasRule = true;
        if (value === "") {
          // Empty Disallow = allow everything; empty Allow is a no-op. Neither adds a rule.
          if (key === "allow") lint.push({ level: "info", line: lineNo, message: "Empty Allow has no effect." });
          break;
        }
        if (/^https?:\/\//i.test(value)) {
          lint.push({ level: "error", line: lineNo, message: `Rules take a path, not a full URL. "${value.slice(0, 60)}" never matches anything.` });
        } else if (!value.startsWith("/") && !value.startsWith("*")) {
          lint.push({ level: "warning", line: lineNo, message: `Path should start with "/" or "*". "${value.slice(0, 60)}" never matches anything as written.` });
        }
        if (value.indexOf("$") !== -1 && value.indexOf("$") !== value.length - 1) {
          lint.push({ level: "info", line: lineNo, message: `"$" only anchors at the end of a rule; elsewhere it is matched literally.` });
        }
        current.rules.push({ allow: key === "allow", pattern: value, line: lineNo });
        break;
      }
      case "sitemap": {
        if (!value) break;
        if (!/^https?:\/\//i.test(value)) lint.push({ level: "error", line: lineNo, message: `Sitemap must be an absolute URL (https://…). "${value.slice(0, 60)}" is ignored by Google.` });
        else sitemaps.push(value);
        break;
      }
      case "crawl-delay": {
        const n = Number(value);
        if (current && Number.isFinite(n)) current.crawlDelay = n;
        lint.push({ level: "info", line: lineNo, message: `Crawl-delay is not part of RFC 9309. Google ignores it; Bing and some others honour it.${n > 10 ? " A delay this long can starve crawlers that do honour it." : ""}` });
        break;
      }
      case "license":
        if (value) licenses.push(value);
        lint.push({ level: "info", line: lineNo, message: "License points to RSL (Really Simple Licensing) terms for AI use. It states your licensing terms; it does not block crawlers." });
        break;
      case "host":
        hosts.push(value);
        lint.push({ level: "info", line: lineNo, message: "Host is a Yandex-only directive; other crawlers ignore it." });
        break;
      case "noindex":
        lint.push({ level: "warning", line: lineNo, message: "Noindex in robots.txt has been unsupported by Google since 2019. Use a meta robots tag or X-Robots-Tag header." });
        break;
      case "clean-param":
      case "request-rate":
      case "visit-time":
        lint.push({ level: "info", line: lineNo, message: `${rawKey} is a non-standard directive that most crawlers ignore.` });
        break;
      case "content-signal": {
        const signals: Record<string, boolean> = {};
        for (const part of value.split(",")) {
          const [k, v] = part.split("=").map((s) => s.trim().toLowerCase());
          if (k && (v === "yes" || v === "no")) signals[k] = v === "yes";
        }
        if (current) current.contentSignals = { ...(current.contentSignals ?? {}), ...signals };
        else {
          lint.push({ level: "info", line: lineNo, message: "Content-Signal appears before any User-agent; it is usually placed inside a group." });
        }
        break;
      }
      default:
        if (!html) lint.push({ level: "warning", line: lineNo, message: `Unknown directive "${rawKey.slice(0, 40)}" is ignored.` });
    }
  }

  if (!html) {
    for (const g of groups) {
      if (g.agents.length && g.rules.length === 0 && !g.contentSignals) {
        const named = g.agents.filter((a) => a !== "*");
        if (named.length) {
          lint.push({
            level: "warning",
            line: g.line ?? null,
            message: `Group for ${named.join(", ")} has no rules, so ${named.length === 1 ? "it" : "they"} may crawl everything and no longer inherit the User-agent: * rules.`,
          });
        }
      }
    }
    if (groups.length > 0 && !groups.some((g) => g.agents.includes("*"))) {
      lint.push({ level: "info", line: null, message: "No User-agent: * group. Crawlers not named here have no rules and may crawl everything." });
    }
  }

  // Cap lint noise (e.g. a huge HTML page).
  return { groups, sitemaps, lint: lint.slice(0, 200), hosts, licenses, truncated, looksLikeHtml: html, lineCount: lines.length };
}

// ── Matching ─────────────────────────────────────────────────────────────────────────────────

/** Normalise percent-encoding so "/caf%C3%A9", "/café" and "/%63afe" style variants compare equal. */
export function normalizeEncoding(s: string): string {
  const encoded = s.replace(/[^\x21-\x7e]/gu, (c) => {
    try {
      return encodeURIComponent(c);
    } catch {
      return "";
    }
  });
  return encoded.replace(/%([0-9a-fA-F]{2})/g, (_, h: string) => {
    const ch = String.fromCharCode(parseInt(h, 16));
    return /[A-Za-z0-9\-._~]/.test(ch) ? ch : `%${h.toUpperCase()}`;
  });
}

/** Path + query to test, from a path or full URL. */
export function toTestPath(input: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return "/";
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      return u.pathname + u.search;
    } catch {
      /* fall through */
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/** Google's linear-time wildcard matcher: prefix match, `*` = any run, trailing `$` = end anchor. */
function matches(path: string, pattern: string): boolean {
  const pathlen = path.length;
  const pos: number[] = new Array(pathlen + 1);
  pos[0] = 0;
  let numpos = 1;
  for (let j = 0; j < pattern.length; j++) {
    const pat = pattern[j];
    if (pat === "$" && j + 1 === pattern.length) return pos[numpos - 1] === pathlen;
    if (pat === "*") {
      numpos = pathlen - pos[0] + 1;
      for (let i = 1; i < numpos; i++) pos[i] = pos[i - 1] + 1;
    } else {
      let next = 0;
      for (let i = 0; i < numpos; i++) if (pos[i] < pathlen && path[pos[i]] === pat) pos[next++] = pos[i] + 1;
      numpos = next;
      if (numpos === 0) return false;
    }
  }
  return true;
}

/** Documented fallbacks before "*": Apple says Applebot follows Googlebot rules; Google's specialised crawlers follow Googlebot. */
const FALLBACKS: Record<string, string[]> = {
  applebot: ["googlebot"],
  "googlebot-image": ["googlebot"],
  "googlebot-video": ["googlebot"],
  "googlebot-news": ["googlebot"],
};

export type MatchBasis = "specific" | "fallback" | "wildcard" | "none";

interface Resolved {
  rules: RobotsRule[];
  groups: RobotsGroup[];
  matched: MatchBasis;
  via?: string;
}

function resolveGroups(parsed: ParsedRobots, agent: string): Resolved | null {
  const token = productToken(agent) || agent.toLowerCase();
  const pick = (t: string) => parsed.groups.filter((g) => g.agents.includes(t));
  const specific = pick(token);
  if (specific.length) return { rules: specific.flatMap((g) => g.rules), groups: specific, matched: "specific" };
  for (const fb of FALLBACKS[token] ?? []) {
    const gs = pick(fb);
    if (gs.length) return { rules: gs.flatMap((g) => g.rules), groups: gs, matched: "fallback", via: fb };
  }
  const wildcard = pick("*");
  if (wildcard.length) return { rules: wildcard.flatMap((g) => g.rules), groups: wildcard, matched: "wildcard" };
  return null;
}

/** The decisive rule for a path, or null when no rule matches (= allowed). */
function decisiveRule(rules: RobotsRule[], rawPath: string): RobotsRule | null {
  const path = normalizeEncoding(rawPath);
  let best: { len: number; rule: RobotsRule } | null = null;
  for (const r of rules) {
    if (r.pattern === "") continue;
    const pattern = normalizeEncoding(r.pattern);
    if (!matches(path, pattern)) continue;
    const len = pattern.length;
    if (!best || len > best.len || (len === best.len && r.allow && !best.rule.allow)) best = { len, rule: r };
  }
  return best ? best.rule : null;
}

function decidePath(rules: RobotsRule[], path: string): boolean {
  const r = decisiveRule(rules, path);
  return r ? r.allow : true;
}

/** True when `agent` may fetch `path` under these rules. */
export function evaluatePath(parsed: ParsedRobots, agent: string, path: string): boolean {
  const p = toTestPath(path);
  if (p === "/robots.txt") return true;
  const found = resolveGroups(parsed, agent);
  return found ? decidePath(found.rules, p) : true;
}

export interface PathExplanation {
  path: string;
  allowed: boolean;
  basis: MatchBasis;
  /** Product token whose group was used ("*" for wildcard). */
  group: string | null;
  /** Line of the first User-agent in the applied group(s). */
  groupLine: number | null;
  rule: { allow: boolean; pattern: string; line: number | null } | null;
}

/** Like Google's robots.txt tester: verdict plus the exact rule (and line) that decided it. */
export function explainPath(parsed: ParsedRobots, agent: string, path: string): PathExplanation {
  const p = toTestPath(path);
  const found = resolveGroups(parsed, agent);
  if (p === "/robots.txt") return { path: p, allowed: true, basis: found?.matched ?? "none", group: null, groupLine: null, rule: null };
  if (!found) return { path: p, allowed: true, basis: "none", group: null, groupLine: null, rule: null };
  const r = decisiveRule(found.rules, p);
  return {
    path: p,
    allowed: r ? r.allow : true,
    basis: found.matched,
    group: found.matched === "wildcard" ? "*" : found.matched === "fallback" ? found.via! : productToken(agent),
    groupLine: found.groups[0]?.line ?? null,
    rule: r ? { allow: r.allow, pattern: r.pattern, line: r.line ?? null } : null,
  };
}

/** Rules that apply to an agent (after group resolution). */
export function rulesForAgent(parsed: ParsedRobots, agent: string): { rules: RobotsRule[]; basis: MatchBasis; groupLine: number | null; via?: string } {
  const found = resolveGroups(parsed, agent);
  if (!found) return { rules: [], basis: "none", groupLine: null };
  return { rules: found.rules, basis: found.matched, groupLine: found.groups[0]?.line ?? null, via: found.via };
}

export type Access = "allowed" | "blocked" | "partial";

export interface AgentVerdict {
  access: Access;
  /** "specific" = named rule for this bot, "wildcard" = falls back to User-agent: *, "none" = no robots rules apply */
  basis: "specific" | "wildcard" | "none" | "fallback";
  detail: string;
}

const isRootish = (p: string) => p === "/" || p === "/*" || p === "*";

export function evaluateAgent(parsed: ParsedRobots, agent: string): AgentVerdict {
  const found = resolveGroups(parsed, agent);
  if (!found) return { access: "allowed", basis: "none", detail: "No rules apply, so crawling is allowed." };

  const rootAllowed = decidePath(found.rules, "/");
  const disallowsSomething = found.rules.some((r) => !r.allow && r.pattern !== "" && !isRootish(r.pattern));
  const basis = found.matched;
  const via = basis === "fallback" ? ` (follows the ${found.via} rules)` : "";

  if (!rootAllowed) {
    // "Disallow: /" can still be partially overridden by a more specific Allow.
    const hasAllow = found.rules.some((r) => r.allow && r.pattern !== "" && !isRootish(r.pattern));
    return hasAllow
      ? { access: "partial", basis, detail: `Blocked from the site root, with some paths explicitly allowed${via}.` }
      : { access: "blocked", basis, detail: `Blocked from the entire site (Disallow: /)${via}.` };
  }
  return disallowsSomething
    ? { access: "partial", basis, detail: `Allowed, but some paths are disallowed${via}.` }
    : { access: "allowed", basis, detail: basis === "wildcard" ? "Allowed via the User-agent: * rules." : basis === "fallback" ? `Allowed${via}.` : "Explicitly allowed." };
}
