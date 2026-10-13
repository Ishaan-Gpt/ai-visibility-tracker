import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { dfsConfigured } from "@/lib/dataforseo/client";
import { guardStatus } from "@/lib/dataforseo/guard";
import { DAILY_LIMITS } from "@/lib/limits";
import { emailConfigured } from "./notify";
import { limitsFor, listAlerts, listKeywords, listProjects, type PaidTier } from "./store";
import type { RtAlert, RtKeyword, RtProject } from "./types";

/** What the dashboard renders (also returned by the polling endpoint). */
export interface DashboardData {
  projects: Pick<RtProject, "id" | "name" | "domain" | "locationName" | "device">[];
  project: RtProject | null;
  keywords: RtKeyword[];
  alerts: RtAlert[];
  inFlight: number;
  status: {
    configured: boolean;
    paused: boolean;
    pauseReason: string | null;
    emailAlerts: boolean;
    /** Checks stop once our domain is found (competitor columns then cover only the pages crawled). */
    stopOnOwn: boolean;
  };
  plan: {
    tier: PaidTier;
    keywordLimit: number;
    keywordsUsed: number;
    projectLimit: number;
    competitorLimit: number;
    cadenceDays: number;
    checksLeft: number;
    checksLimit: number;
    lookupsLeft: number;
    lookupsLimit: number;
  };
}

const HISTORY_IN_LIST = 120;

async function quotaLeft(uid: string, tool: "rank-check" | "domain-keywords", tier: PaidTier) {
  const limit = DAILY_LIMITS[tool][tier];
  try {
    const day = new Date().toISOString().slice(0, 10);
    const snap = await adminDb().collection("quota").doc(`u_${uid}_${tool}_${day}`).get();
    return { left: Math.max(0, limit - ((snap.data()?.count as number | undefined) ?? 0)), limit };
  } catch {
    return { left: limit, limit };
  }
}

export async function dashboardData(uid: string, tier: PaidTier, projectId: string | null): Promise<DashboardData> {
  const projects = await listProjects(uid);
  const project = (projectId && projects.find((p) => p.id === projectId)) || projects[0] || null;
  const [keywords, alerts, guard, checks, lookups, used] = await Promise.all([
    project ? listKeywords(project.id) : Promise.resolve([]),
    project ? listAlerts(project.id) : Promise.resolve([]),
    guardStatus(),
    quotaLeft(uid, "rank-check", tier),
    quotaLeft(uid, "domain-keywords", tier),
    adminDb()
      .collection("rtKeywords")
      .where("ownerUid", "==", uid)
      .count()
      .get()
      .then((a) => a.data().count)
      .catch(() => 0),
  ]);
  const lim = limitsFor(tier);
  return {
    projects: projects.map((p) => ({ id: p.id, name: p.name, domain: p.domain, locationName: p.locationName, device: p.device })),
    project,
    keywords: keywords.map((k) => ({ ...k, history: (k.history ?? []).slice(-HISTORY_IN_LIST) })),
    alerts,
    inFlight: keywords.filter((k) => k.pendingTaskId && !k.pendingTaskId.startsWith("claim:")).length,
    status: { configured: dfsConfigured(), paused: guard.paused, pauseReason: guard.reason, emailAlerts: emailConfigured(), stopOnOwn: (process.env.RANK_TRACKER_STOP_ON ?? "own") === "own" },
    plan: {
      tier,
      keywordLimit: lim.keywords,
      keywordsUsed: used,
      projectLimit: lim.projects,
      competitorLimit: lim.competitors,
      cadenceDays: lim.cadenceDays,
      checksLeft: checks.left,
      checksLimit: checks.limit,
      lookupsLeft: lookups.left,
      lookupsLimit: lookups.limit,
    },
  };
}
