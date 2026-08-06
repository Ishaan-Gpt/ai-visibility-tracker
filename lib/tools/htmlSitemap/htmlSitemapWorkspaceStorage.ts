import type { HtmlSitemapEntry } from "@/lib/tools/htmlSitemap/htmlSitemapTypes";

const STORAGE_KEY = "openseo:html-sitemap-workspace";

export type PersistedHtmlSitemapSession = {
  entries: HtmlSitemapEntry[];
};

export function loadHtmlSitemapSession(): PersistedHtmlSitemapSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedHtmlSitemapSession>;
    if (!Array.isArray(parsed.entries)) return null;
    return parsed as PersistedHtmlSitemapSession;
  } catch {
    return null;
  }
}

export function saveHtmlSitemapSession(session: PersistedHtmlSitemapSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable (private browsing) — convenience feature, fail silently.
  }
}

export function clearHtmlSitemapSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
