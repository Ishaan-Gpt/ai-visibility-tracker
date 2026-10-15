/* Shared (client + server) Backlinks types. No server-only imports. */

export type BacklinkScope = "domain" | "page";

export interface BlSummary {
  /** DataForSEO rank on a 0-100 scale (their PageRank-like authority). */
  rank: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  referringPages: number | null;
  referringIps: number | null;
  dofollow: number | null;
  nofollow: number | null;
  brokenBacklinks: number | null;
  newBacklinks: number | null;
  lostBacklinks: number | null;
  newDomains: number | null;
  lostDomains: number | null;
  /** 0-100; higher means the target looks spammier. */
  spamScore: number | null;
  firstSeen: string | null;
}

export interface BlHistoryPoint {
  /** YYYY-MM-01 */
  month: string;
  backlinks: number | null;
  referringDomains: number | null;
  newDomains: number | null;
  lostDomains: number | null;
}

export interface BlDomain {
  domain: string;
  rank: number | null;
  backlinks: number | null;
  dofollow: number | null;
  spamScore: number | null;
  firstSeen: string | null;
  lost: boolean;
}

export interface BlLink {
  from: string;
  fromDomain: string;
  to: string;
  anchor: string;
  dofollow: boolean;
  type: string | null;
  domainRank: number | null;
  pageRank: number | null;
  spamScore: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
  isNew: boolean;
  isBroken: boolean;
}

export interface BlAnchor {
  anchor: string;
  backlinks: number | null;
  referringDomains: number | null;
  dofollow: number | null;
  firstSeen: string | null;
}

export interface BacklinksResult {
  target: string;
  scope: BacklinkScope;
  includeSubdomains: boolean;
  rowLimit: number;
  summary: BlSummary;
  history: BlHistoryPoint[];
  domains: BlDomain[];
  links: BlLink[];
  anchors: BlAnchor[];
  /** Domains that stopped linking in the last 90 days. */
  lostDomains: BlDomain[];
  /** Which list calls failed (the rest of the report is still usable). */
  partial: string[];
  fetchedAt: number;
  cachedAt?: number;
}
