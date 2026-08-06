const STORAGE_KEY = "openseo:keyword-density-workspace";

export type PersistedKeywordDensitySession = {
  content: string;
  targetKeywords: string[];
};

export function loadKeywordDensitySession(): PersistedKeywordDensitySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedKeywordDensitySession>;
    if (typeof parsed.content !== "string") return null;
    return { content: parsed.content, targetKeywords: Array.isArray(parsed.targetKeywords) ? parsed.targetKeywords : [] };
  } catch {
    return null;
  }
}

export function saveKeywordDensitySession(session: PersistedKeywordDensitySession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable (private browsing) — convenience feature, fail silently.
  }
}

export function clearKeywordDensitySession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
