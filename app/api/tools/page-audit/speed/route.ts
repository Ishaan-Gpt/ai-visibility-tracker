import { NextRequest, NextResponse } from "next/server";
import { runPageSpeed, SpeedError, verifySpeedToken } from "@/lib/tools/pageAudit/speed";

export const maxDuration = 60;

/**
 * Core Web Vitals for a URL that was just audited. Not metered separately: it requires the signed, short-lived token
 * the audit returned, so it can only follow a counted audit.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown; token?: unknown; exp?: unknown; strategy?: unknown };
  const url = typeof body.url === "string" ? body.url : "";
  if (!url || !verifySpeedToken(url, Number(body.exp), String(body.token ?? ""))) {
    return NextResponse.json({ error: "Run the audit again to load Core Web Vitals." }, { status: 403 });
  }
  const strategy = body.strategy === "desktop" ? "desktop" : "mobile";
  try {
    return NextResponse.json(await runPageSpeed(url, strategy));
  } catch (err) {
    if (err instanceof SpeedError) return NextResponse.json({ error: err.message }, { status: 502 });
    console.error("[page-audit/speed]", err);
    return NextResponse.json({ error: "Couldn't load Core Web Vitals right now." }, { status: 500 });
  }
}
