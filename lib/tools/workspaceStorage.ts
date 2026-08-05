import type { SchemaFormData, SchemaType } from "@/lib/tools/schemaTemplates";

const STORAGE_KEY = "openseo:schema-workspace";

export type PersistedSession = {
  types: SchemaType[];
  activeType: SchemaType;
  formData: SchemaFormData;
};

/** Loads a previously saved workspace session. Returns null on the server, when empty, or on any parse failure. */
export function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (!parsed.types?.length || !parsed.activeType || !parsed.formData) return null;
    return parsed as PersistedSession;
  } catch {
    return null;
  }
}

export function saveSession(session: PersistedSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable (private browsing) — this is a convenience feature, fail silently.
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
