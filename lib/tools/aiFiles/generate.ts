import { BOT_CATALOGUE, type BotInfo } from "@/lib/tools/aiCrawlers/bots";
import { parseRobots, productToken } from "@/lib/tools/aiCrawlers/robots";

/** "inherit" = no group of its own, so the bot follows the User-agent: * rules. */
export type BotPolicy = "allow" | "block" | "inherit";
export type Preset = "open" | "search-only" | "block-all-ai" | "custom";

export interface RobotsOptions {
  /** Policy per agent name. Bots not listed (or "inherit") fall back to the wildcard group. */
  policies: Record<string, BotPolicy>;
  disallowPaths: string[];
  sitemaps: string[];
}

/** Agents the generator offers: every catalogued agent except classic search engines. */
export const GENERATOR_BOTS: BotInfo[] = BOT_CATALOGUE.filter((b) => b.purpose !== "search");

/**
 * Presets. "search-only" stays visible in AI search and assistants while opting out of training.
 * Classic search engines are never touched by presets.
 */
export function presetPolicies(preset: Exclude<Preset, "custom">): Record<string, BotPolicy> {
  const out: Record<string, BotPolicy> = {};
  for (const b of GENERATOR_BOTS) {
    if (preset === "open") out[b.agent] = "allow";
    else if (preset === "block-all-ai") out[b.agent] = "block";
    else out[b.agent] = b.purpose === "ai-training" ? "block" : "allow";
  }
  return out;
}

const normPath = (p: string) => (p.startsWith("/") || p.startsWith("*") ? p : `/${p}`);


/** Groups the chosen policies into at most two compact groups (allowed / blocked), each with several User-agent lines. */
function aiGroups(policies: Record<string, BotPolicy>, wildcardRules: string[]): string[] {
  const allowed = GENERATOR_BOTS.filter((b) => policies[b.agent] === "allow");
  const blocked = GENERATOR_BOTS.filter((b) => policies[b.agent] === "block");
  const lines: string[] = [];
  if (allowed.length) {
    // A named group replaces the * group for that bot, so carry the private paths over (minus any site-wide block).
    const carried = wildcardRules.filter((r) => !/^disallow:\s*\/\*?\s*$/i.test(r));
    lines.push("# AI search, assistants and crawlers you allow", ...allowed.map((b) => `User-agent: ${b.agent}`), "Allow: /", ...carried, "");
  }
  if (blocked.length) {
    lines.push("# AI crawlers you block", ...blocked.map((b) => `User-agent: ${b.agent}`), "Disallow: /", "");
  }
  return lines;
}

export function generateRobots({ policies, disallowPaths, sitemaps }: RobotsOptions): string {
  const paths = disallowPaths.map((p) => p.trim()).filter(Boolean).map(normPath);
  const wildcard = paths.length ? paths.map((p) => `Disallow: ${p}`) : [];
  const lines: string[] = ["User-agent: *", ...(wildcard.length ? wildcard : ["Allow: /"]), ""];
  lines.push(...aiGroups(policies, wildcard));
  const sm = [...new Set(sitemaps.map((s) => s.trim()).filter(Boolean))];
  if (sm.length) lines.push(...sm.map((s) => `Sitemap: ${s}`), "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export const MANAGED_BEGIN = "# BEGIN seowise AI crawler rules";
export const MANAGED_END = "# END seowise AI crawler rules";

export interface MergeResult {
  text: string;
  /** Agents whose existing User-agent lines were moved into the managed block. */
  replacedAgents: string[];
  /** Sitemaps added that were not already declared. */
  addedSitemaps: string[];
}

/**
 * Merges AI rules into an existing robots.txt instead of replacing it:
 *  - removes a previous seowise block, then removes User-agent lines for every agent we now manage
 *    (a group left with no agents is dropped; other agents in shared groups keep their rules)
 *  - keeps the site's own * group and everything else untouched
 *  - appends one managed block; allowed bots inherit the site's current * Disallow rules
 *  - adds missing Sitemap lines
 */
export function mergeRobots(existing: string, policies: Record<string, BotPolicy>, sitemaps: string[]): MergeResult {
  const managed = new Set(GENERATOR_BOTS.filter((b) => policies[b.agent] === "allow" || policies[b.agent] === "block").map((b) => b.agent.toLowerCase()));
  const src = existing.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const withoutBlock = src.replace(new RegExp(`${escapeRe(MANAGED_BEGIN)}[\\s\\S]*?${escapeRe(MANAGED_END)}\\n?`, "g"), "");
  const lines = withoutBlock.split("\n");

  // Split into groups the way RFC 9309 parsers do: consecutive User-agent lines share a group until a rule appears.
  type Group = { kind: "group"; header: string[]; body: string[] };
  type Seg = { kind: "other"; line: string } | Group;
  const isUa = (l: string) => /^\s*user[-_ ]?agent\s*:/i.test(l);
  const isRule = (l: string) => /^\s*(allow|disallow|dis+al+ow|diasllow|disallaw)\s*:/i.test(l);
  const segs: Seg[] = [];
  let cur: Group | null = null;
  let sawRule = false;
  for (const line of lines) {
    if (isUa(line)) {
      if (!cur || sawRule) {
        cur = { kind: "group", header: [], body: [] };
        segs.push(cur);
        sawRule = false;
      }
      if (cur.body.length) cur.header.push(...cur.body.splice(0));
      cur.header.push(line);
    } else if (cur) {
      cur.body.push(line);
      if (isRule(line)) sawRule = true;
    } else segs.push({ kind: "other", line });
  }

  const out: string[] = [];
  const replaced = new Set<string>();
  for (const seg of segs) {
    if (seg.kind === "other") {
      out.push(seg.line);
      continue;
    }
    const keptHeader = seg.header.filter((l) => {
      if (!isUa(l)) return true;
      const tok = productToken(l.replace(/^[^:]*:/, "").replace(/#.*$/, ""));
      if (managed.has(tok)) {
        replaced.add(tok);
        return false;
      }
      return true;
    });
    // A group left with no agents is dropped entirely; otherwise its rules would attach to the previous group.
    if (keptHeader.some(isUa)) out.push(...keptHeader, ...seg.body);
    // Keep file-level lines that happened to sit inside it (Sitemap, RSL License, Host).
    else out.push(...seg.body.filter((l) => /^\s*(sitemap|license|host)\s*:/i.test(l)), "");
  }

  const parsed = parseRobots(withoutBlock);
  const star = parsed.groups.filter((g) => g.agents.includes("*")).flatMap((g) => g.rules);
  const wildcardRules = star.map((r) => `${r.allow ? "Allow" : "Disallow"}: ${r.pattern}`).filter((r) => !/^allow:\s*\/\s*$/i.test(r));
  const block = aiGroups(policies, wildcardRules);

  let text = out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  const declared = new Set(parsed.sitemaps.map((s) => s.trim()));
  const addedSitemaps = [...new Set(sitemaps.map((s) => s.trim()).filter((s) => s && !declared.has(s)))];
  if (addedSitemaps.length) text += `\n\n${addedSitemaps.map((s) => `Sitemap: ${s}`).join("\n")}`;
  // Managed block last so a re-merge finds and replaces it in place.
  if (block.length) text += `\n\n${MANAGED_BEGIN}\n${block.join("\n").trimEnd()}\n${MANAGED_END}`;
  return { text: text.trimStart() + "\n", replacedAgents: GENERATOR_BOTS.filter((b) => replaced.has(b.agent.toLowerCase())).map((b) => b.agent), addedSitemaps };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface LlmsLink {
  title: string;
  url: string;
  description: string;
}
export interface LlmsSection {
  title: string;
  links: LlmsLink[];
}
export interface LlmsOptions {
  name: string;
  summary: string;
  details: string;
  sections: LlmsSection[];
}

/** Format per https://llmstxt.org : H1 name, blockquote summary, optional prose, H2 sections of "- [title](url): notes". */
export function generateLlmsTxt({ name, summary, details, sections }: LlmsOptions): string {
  const out: string[] = [`# ${name.trim() || "Your site"}`];
  if (summary.trim()) out.push("", ...summary.trim().split(/\r?\n/).map((l) => `> ${l}`));
  if (details.trim()) out.push("", details.trim());
  for (const s of sections) {
    const links = s.links.filter((l) => l.title.trim() && l.url.trim());
    if (!s.title.trim() || links.length === 0) continue;
    out.push("", `## ${s.title.trim()}`, "");
    for (const l of links) out.push(`- [${l.title.trim()}](${l.url.trim()})${l.description.trim() ? `: ${l.description.trim()}` : ""}`);
  }
  return out.join("\n") + "\n";
}
