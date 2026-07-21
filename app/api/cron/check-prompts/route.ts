import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ACTIVE_PROVIDERS, checkPrompt } from "@/lib/providers";
import { planLimits } from "@/lib/data";
import type { BrandDoc, PromptDoc, RollupDoc, UserDoc } from "@/lib/types";

export const maxDuration = 300; // this job fans out to an LLM call per prompt/provider; allow up to 5 min

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function runForBrand(brand: BrandDoc, prompts: PromptDoc[]) {
  const db = adminDb();
  let mentionedCount = 0;
  const competitorMentionCounts: Record<string, number> = {};
  for (const c of brand.competitors) competitorMentionCounts[c.domain] = 0;

  const activePrompts = prompts.filter((p) => p.active);
  let succeeded = 0;

  for (const prompt of activePrompts) {
    for (const provider of ACTIVE_PROVIDERS) {
      try {
        const result = await checkPrompt(provider, {
          promptText: prompt.text,
          brandName: brand.name,
          brandDomain: brand.domain,
          competitors: brand.competitors,
        });

        if (result.mentioned) mentionedCount += 1;
        for (const [domain, wasMentioned] of Object.entries(result.competitorMentions)) {
          if (wasMentioned) competitorMentionCounts[domain] = (competitorMentionCounts[domain] ?? 0) + 1;
        }

        await db.collection("runs").add({
          brandId: brand.id,
          promptId: prompt.id,
          provider: result.provider,
          timestamp: Date.now(),
          mentioned: result.mentioned,
          citedUrls: result.citedUrls,
          competitorMentions: result.competitorMentions,
          rawExcerpt: result.rawExcerpt,
          grounded: result.grounded,
        });
        succeeded += 1;
      } catch (err) {
        console.error(`[cron] check failed for brand=${brand.id} prompt=${prompt.id}`, err);
      }
    }
  }

  // If every single check failed (e.g. a provider outage or bad API key), don't write a
  // misleading "0% visibility" rollup and don't mark the brand as checked — leave it due
  // so the next cron tick retries instead of silently reporting a fake score for a week.
  if (activePrompts.length > 0 && succeeded === 0) {
    console.error(`[cron] all checks failed for brand=${brand.id}, skipping rollup`);
    return;
  }

  const rollup: RollupDoc = {
    brandId: brand.id,
    date: todayKey(),
    totalPrompts: succeeded,
    mentionedCount,
    score: succeeded > 0 ? Math.round((mentionedCount / succeeded) * 100) : 0,
    competitorMentionCounts,
  };
  await db
    .collection("rollups")
    .doc(`${brand.id}_${rollup.date}`)
    .set(rollup, { merge: true });

  await db.collection("brands").doc(brand.id).update({ lastCheckedAt: Date.now() });
}

async function handleCronRequest(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const brandsSnap = await db.collection("brands").get();

  const summary: { brandId: string; ran: boolean; reason?: string }[] = [];

  for (const brandDoc of brandsSnap.docs) {
    const brand = { id: brandDoc.id, ...(brandDoc.data() as Omit<BrandDoc, "id">) } as BrandDoc & {
      lastCheckedAt?: number;
    };

    const userSnap = await db.collection("users").doc(brand.ownerUid).get();
    const user = userSnap.exists ? (userSnap.data() as UserDoc) : undefined;
    const limits = planLimits(user?.plan);

    const dueAgainAt = (brand.lastCheckedAt ?? 0) + limits.refreshDays * 24 * 60 * 60 * 1000;
    if (Date.now() < dueAgainAt) {
      summary.push({ brandId: brand.id, ran: false, reason: "not due yet" });
      continue;
    }

    const promptsSnap = await db.collection("prompts").where("brandId", "==", brand.id).get();
    const prompts = promptsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PromptDoc, "id">) }));

    await runForBrand(brand, prompts);
    summary.push({ brandId: brand.id, ran: true });
  }

  return NextResponse.json({ ok: true, summary });
}

export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
