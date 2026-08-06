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
