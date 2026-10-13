import "server-only";
import crypto from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { siteUrl } from "@/lib/site";
import { ALERT_LABEL, type RtAlert, type RtProject } from "./types";

/* ---------------- pingback (optional, faster collection) ---------------- */

/**
 * DataForSEO calls `pingback_url` (GET, with $id / $tag substituted) when a task finishes. Enabled only when
 * RANK_TRACKER_PINGBACK_BASE_URL is an https origin (e.g. https://tools.eegnite.com). The URL carries an HMAC of
 * the tag so random callers are rejected before any work; the route then only collects task ids that exist in
 * rtTasks, so a forged call can at most trigger a free task_get.
 */
function pingbackSecret(): string | null {
  return process.env.RANK_TRACKER_PINGBACK_SECRET || process.env.CRON_SECRET || null;
}

export function signTag(tag: string): string | null {
  const secret = pingbackSecret();
  return secret ? crypto.createHmac("sha256", secret).update(tag).digest("hex").slice(0, 32) : null;
}

export function verifyTag(tag: string, sig: string): boolean {
  const want = signTag(tag);
  if (!want || sig.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}

export function pingbackUrl(tag: string): string | null {
  const base = process.env.RANK_TRACKER_PINGBACK_BASE_URL;
  if (!base || !/^https:\/\/[^/]+/.test(base)) return null;
  const sig = signTag(tag);
  if (!sig) return null;
  return `${base.replace(/\/+$/, "")}/api/rank-tracker/pingback?id=$id&tag=$tag&sig=${sig}`;
}

/* ---------------- email alerts (optional) ---------------- */

/** Resend (https://resend.com/docs/api-reference/emails/send-email). Does nothing unless both env vars are set. */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ALERT_FROM_EMAIL);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pos = (p: number | null) => (p === null ? "not in top 100" : `#${p}`);

/** One digest email per project with new alerts. Best-effort; never throws. */
export async function emailAlerts(byProject: Map<string, { project: RtProject; alerts: RtAlert[] }>): Promise<number> {
  if (!emailConfigured() || !byProject.size) return 0;
  let sent = 0;
  for (const { project, alerts } of byProject.values()) {
    if (project.emailAlerts === false || !alerts.length) continue;
    try {
      const user = await adminDb().collection("users").doc(project.ownerUid).get();
      const to = user.data()?.email as string | undefined;
      if (!to) continue;
      const rows = alerts.slice(0, 40);
      const subject = `${project.domain}: ${alerts.length} ranking change${alerts.length === 1 ? "" : "s"}`;
      const text = [
        `Notable ranking changes for ${project.domain} (${project.locationName}, ${project.device}):`,
        "",
        ...rows.map((a) => `- "${a.keyword}": ${ALERT_LABEL[a.kind]} (${pos(a.from)} -> ${pos(a.to)})`),
        "",
        `Open the dashboard: ${siteUrl()}/app/rank-tracker?project=${project.id}`,
      ].join("\n");
      const html = `<p>Notable ranking changes for <b>${esc(project.domain)}</b> (${esc(project.locationName)}, ${project.device}):</p><ul>${rows
        .map((a) => `<li><b>${esc(a.keyword)}</b>: ${ALERT_LABEL[a.kind]} (${pos(a.from)} &rarr; ${pos(a.to)})</li>`)
        .join("")}</ul><p><a href="${siteUrl()}/app/rank-tracker?project=${project.id}">Open the dashboard</a></p>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.ALERT_FROM_EMAIL, to: [to], subject, text, html }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) sent += 1;
      else console.warn("[rank-tracker] alert email failed", res.status);
    } catch (err) {
      console.warn("[rank-tracker] alert email error", err instanceof Error ? err.message : err);
    }
  }
  return sent;
}
