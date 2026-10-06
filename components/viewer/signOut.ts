"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { resetViewerCache } from "@/components/viewer/useViewer";

/**
 * Ends the session everywhere: Firebase client, the server cookie, and the in-memory viewer cache.
 * A full page load afterwards guarantees no signed-in page survives in the client router cache.
 */
export async function signOutEverywhere(to = "/") {
  await Promise.allSettled([signOut(auth), fetch("/api/session", { method: "DELETE", cache: "no-store" })]);
  resetViewerCache();
  window.location.assign(to);
}
