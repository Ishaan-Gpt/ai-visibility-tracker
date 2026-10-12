import type { SitemapUrlEntry } from "@/lib/tools/sitemap/sitemapTypes";

const STORAGE_KEY = "openseo:sitemap-workspace";

export type PersistedSitemapSession = {
  entries: SitemapUrlEntry[];
};

/** Same load/save/clear shape as `lib/tools/workspaceStorage.ts` (schema tool), kept as a sibling since the two tools persist different data shapes. */
export function loadSitemapSession(): PersistedSitemapSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSitemapSession>;
    if (!Array.isArray(parsed.entries)) return null;
    return parsed as PersistedSitemapSession;
  } catch {
    return null;
  }
}

export function saveSitemapSession(session: PersistedSitemapSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable (private browsing) — convenience feature, fail silently.
  }
}

export function clearSitemapSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/* ---------- Last site crawl (shared by the XML and HTML sitemap tools) ---------- */

const CRAWL_KEY = "seowise:last-site-crawl";

export type PersistedCrawl<T> = { savedAt: number; result: T };

/** Keeps the last crawl so a reload, or the other sitemap tool, can reuse it without spending another crawl. */
export function saveLastCrawl<T extends { pages: { images?: string[] }[] }>(result: T) {
  if (typeof window === "undefined") return;
  try {
    let json = JSON.stringify({ savedAt: Date.now(), result });
    // localStorage is ~5 MB per origin: drop image lists first if the crawl is large.
    if (json.length > 3_500_000) json = JSON.stringify({ savedAt: Date.now(), result: { ...result, pages: result.pages.map((p) => ({ ...p, images: undefined })) } });
    if (json.length > 4_500_000) return;
    window.localStorage.setItem(CRAWL_KEY, json);
  } catch {
    // Storage full or unavailable: a convenience only.
  }
}

export function loadLastCrawl<T>(): PersistedCrawl<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CRAWL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCrawl<T>;
    if (!parsed?.result || typeof parsed.savedAt !== "number") return null;
    // Older than a week is stale enough to recrawl.
    if (Date.now() - parsed.savedAt > 7 * 86_400_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastCrawl() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CRAWL_KEY);
  } catch {
    /* ignore */
  }
}
