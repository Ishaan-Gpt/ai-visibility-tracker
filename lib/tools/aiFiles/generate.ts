import { AI_BOTS } from "@/lib/tools/aiCrawlers/bots";

export type BotPolicy = "allow" | "block";
export type Preset = "open" | "search-only" | "block-all-ai" | "custom";

export interface RobotsOptions {
  /** Policy per AI bot agent token. Bots not listed fall back to the wildcard group. */
  policies: Record<string, BotPolicy>;
  disallowPaths: string[];
  sitemaps: string[];
}

/** Presets: "search-only" stays visible in AI search/assistants while opting out of training crawlers. */
export function presetPolicies(preset: Exclude<Preset, "custom">): Record<string, BotPolicy> {
  const out: Record<string, BotPolicy> = {};
  for (const b of AI_BOTS) {
    if (b.purpose === "search") continue; // classic search engines are never blocked by presets
    if (preset === "open") out[b.agent] = "allow";
    else if (preset === "block-all-ai") out[b.agent] = "block";
    else out[b.agent] = b.purpose === "ai-training" ? "block" : "allow";
  }
  return out;
}

export function generateRobots({ policies, disallowPaths, sitemaps }: RobotsOptions): string {
  const lines: string[] = ["User-agent: *"];
  const paths = disallowPaths.map((p) => p.trim()).filter(Boolean);
  if (paths.length === 0) lines.push("Allow: /");
  else paths.forEach((p) => lines.push(`Disallow: ${p.startsWith("/") ? p : `/${p}`}`));

  const blocked = AI_BOTS.filter((b) => policies[b.agent] === "block");
  const allowed = AI_BOTS.filter((b) => policies[b.agent] === "allow");

  if (allowed.length) {
    lines.push("", "# AI crawlers explicitly allowed");
    for (const b of allowed) {
      lines.push(`User-agent: ${b.agent}`);
      if (paths.length === 0) lines.push("Allow: /");
      else paths.forEach((p) => lines.push(`Disallow: ${p.startsWith("/") ? p : `/${p}`}`));
      lines.push("");
    }
    lines.pop();
  }
  if (blocked.length) {
    lines.push("", "# AI crawlers blocked");
    for (const b of blocked) lines.push(`User-agent: ${b.agent}`, "Disallow: /", "");
    lines.pop();
  }
  const sm = sitemaps.map((s) => s.trim()).filter(Boolean);
  if (sm.length) lines.push("", ...sm.map((s) => `Sitemap: ${s}`));
  return lines.join("\n") + "\n";
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
