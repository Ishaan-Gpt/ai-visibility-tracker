/* Client-safe shape of a feature's launch state (see lib/features.ts). */

export interface FeatureState {
  key: string;
  name: string;
  href: string | null;
  summary: string;
  live: boolean;
  /** Not built yet, as opposed to built but waiting on an API key. */
  roadmap: boolean;
  /** Why it isn't live (operator-facing; never shown to customers). null when live. */
  reason: string | null;
}
