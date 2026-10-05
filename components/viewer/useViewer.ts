"use client";

import { useEffect, useState } from "react";

export type ViewerTier = "anon" | "free" | "pro";
export interface ClientViewer {
  signedIn: boolean;
  email: string | null;
  tier: ViewerTier;
}

let cached: Promise<ClientViewer> | null = null;

function load(): Promise<ClientViewer> {
  if (!cached) {
    cached = fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ClientViewer | null) => d ?? { signedIn: false, email: null, tier: "anon" as const })
      .catch(() => ({ signedIn: false, email: null, tier: "anon" as const }));
  }
  return cached;
}

/** Signed-in state for statically rendered pages. `null` while loading. */
export function useViewer(): ClientViewer | null {
  const [viewer, setViewer] = useState<ClientViewer | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((v) => alive && setViewer(v));
    return () => {
      alive = false;
    };
  }, []);
  return viewer;
}

export function resetViewerCache() {
  cached = null;
}
