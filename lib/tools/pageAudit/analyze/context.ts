import type { CheerioAPI } from "cheerio";
import type { ParsedRobots } from "@/lib/tools/aiCrawlers/robots";
import type { AiCheck, AuditCheck } from "../types";

/** Everything analyzePage needs. No network: the caller fetched the page (and optionally robots.txt / llms.txt). */
export interface PageInput {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  html: string;
  redirects: string[];
  elapsedMs: number;
  /** Bytes on the wire (compressed). Defaults to the HTML length. */
  bytes?: number;
  truncated?: boolean;
  /** Parsed robots.txt for the host; undefined = unknown (skip robots checks), null = no robots.txt. */
  robots?: ParsedRobots | null;
  /** Whether /llms.txt exists; undefined = not checked. */
  llmsTxt?: boolean;
}

export interface Ctx {
  input: PageInput;
  $: CheerioAPI;
  isHtml: boolean;
  isHttps: boolean;
  host: string;
  pagePath: string;
  checks: AuditCheck[];
  ai: AiCheck[];
  /** Visible body text (scripts/styles removed). */
  bodyText: string;
  wordCount: number;
}

export const add = (ctx: Ctx, c: AuditCheck) => {
  ctx.checks.push(c);
};

export const addAi = (ctx: Ctx, c: AiCheck) => {
  ctx.ai.push(c);
};

export function abs(href: string | undefined | null, base: string): string | null {
  if (!href) return null;
  try {
    return new URL(href.trim(), base).href;
  } catch {
    return null;
  }
}

export function clip(s: string, n = 140): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Caps an evidence list and says how many were left out, so nothing is truncated silently. */
export function evidence(list: string[], max = 60): string[] {
  if (list.length <= max) return list;
  return [...list.slice(0, max), `…and ${list.length - max} more`];
}
