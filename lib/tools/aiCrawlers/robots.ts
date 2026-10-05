/** Minimal RFC 9309 robots.txt parser + evaluator (longest-match wins, Allow wins ties, supports * and $). */

export interface RobotsRule {
  allow: boolean;
  pattern: string;
}
export interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}
export interface ParsedRobots {
  groups: RobotsGroup[];
  sitemaps: string[];
}

export function parseRobots(text: string): ParsedRobots {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      lastWasAgent = false;
      if (current) current.rules.push({ allow: field === "allow", pattern: value });
    } else if (field === "sitemap") {
      if (value) sitemaps.push(value);
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return { groups, sitemaps };
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}`);
}

/** Merges every group naming this agent exactly; falls back to "*" groups. Returns null if no group applies. */
function rulesFor(parsed: ParsedRobots, agent: string): { rules: RobotsRule[]; matched: "specific" | "wildcard" } | null {
  const token = agent.toLowerCase();
  const specific = parsed.groups.filter((g) => g.agents.includes(token));
  if (specific.length) return { rules: specific.flatMap((g) => g.rules), matched: "specific" };
  const wildcard = parsed.groups.filter((g) => g.agents.includes("*"));
  if (wildcard.length) return { rules: wildcard.flatMap((g) => g.rules), matched: "wildcard" };
  return null;
}

function decidePath(rules: RobotsRule[], path: string): boolean {
  let best: { len: number; allow: boolean } | null = null;
  for (const r of rules) {
    if (r.pattern === "") continue; // empty Disallow = allow all; empty Allow = no-op
    const anchored = r.pattern.endsWith("$");
    const re = anchored ? new RegExp(`${patternToRegex(r.pattern.slice(0, -1)).source}$`) : patternToRegex(r.pattern);
    if (re.test(path)) {
      const len = r.pattern.length;
      if (!best || len > best.len || (len === best.len && r.allow)) best = { len, allow: r.allow };
    }
  }
  return best ? best.allow : true;
}

/** True when `agent` may fetch `path` under these rules. */
export function evaluatePath(parsed: ParsedRobots, agent: string, path: string): boolean {
  const found = rulesFor(parsed, agent);
  return found ? decidePath(found.rules, path) : true;
}

export type Access = "allowed" | "blocked" | "partial";

export interface AgentVerdict {
  access: Access;
  /** "specific" = named rule for this bot, "wildcard" = falls back to User-agent: *, "none" = no robots rules apply */
  basis: "specific" | "wildcard" | "none";
  detail: string;
}

export function evaluateAgent(parsed: ParsedRobots, agent: string): AgentVerdict {
  const found = rulesFor(parsed, agent);
  if (!found) return { access: "allowed", basis: "none", detail: "No rules apply, so crawling is allowed." };

  const rootAllowed = decidePath(found.rules, "/");
  const disallowsSomething = found.rules.some((r) => !r.allow && r.pattern !== "" && r.pattern !== "/");
  const basis = found.matched;

  if (!rootAllowed) {
    // "Disallow: /" can still be partially overridden by a more specific Allow.
    const hasAllow = found.rules.some((r) => r.allow && r.pattern !== "" && r.pattern !== "/");
    return hasAllow
      ? { access: "partial", basis, detail: "Blocked from the site root, with some paths explicitly allowed." }
      : { access: "blocked", basis, detail: "Blocked from the entire site (Disallow: /)." };
  }
  return disallowsSomething
    ? { access: "partial", basis, detail: "Allowed, but some paths are disallowed." }
    : { access: "allowed", basis, detail: basis === "wildcard" ? "Allowed via the User-agent: * rules." : "Explicitly allowed." };
}
