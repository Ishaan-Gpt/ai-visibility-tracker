import { NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { expandSeed } from "@/lib/keywords/suggest";
import { classifyIntent } from "@/lib/keywords/intent";
import { clusterKeywords } from "@/lib/keywords/cluster";
import { dataforseoConfigured, enrichKeywords } from "@/lib/keywords/dataforseo";
import { COUNTRIES, type KeywordRow, type ResearchResponse } from "@/lib/keywords/types";

export const maxDuration = 60;

const MAX_KEYWORDS = 600;

export async function POST(req: NextRequest) {
  let body: { seed?: unknown; country?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const seed = typeof body.seed === "string" ? body.seed.trim().toLowerCase().replace(/\s+/g, " ") : "";
  if (seed.length < 2 || seed.length > 80) {
    return NextResponse.json({ error: "Enter a seed keyword between 2 and 80 characters." }, { status: 400 });
  }
  const country = COUNTRIES.some((c) => c.code === body.country) ? (body.country as string) : "us";
  const language = typeof body.language === "string" && /^[a-z]{2}$/.test(body.language) ? body.language : "en";

  // Daily cap (per IP when anonymous): protects the data provider and Google autocomplete from abuse.
  const viewer = await getViewer();
  const usage = await consumeQuota(req, "keywords", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  const started = Date.now();
  const { suggestions, requests } = await expandSeed(seed, country, language);

  const merged = new Map<string, "seed" | "autocomplete" | "question">();
  merged.set(seed, "seed");
  for (const s of suggestions) if (!merged.has(s.keyword)) merged.set(s.keyword, s.from);
  const keywordList = [...merged.keys()].slice(0, MAX_KEYWORDS);

  if (keywordList.length <= 1) {
    return NextResponse.json(
      { error: "No suggestions came back for that seed. Try a broader or differently worded keyword." },
      { status: 404 },
    );
  }

  const clusters = clusterKeywords(keywordList, seed);
  let rows: KeywordRow[] = keywordList.map((keyword) => ({
    keyword,
    source: merged.get(keyword) ?? "autocomplete",
    intent: classifyIntent(keyword),
    cluster: clusters.get(keyword) ?? keyword,
    words: keyword.split(" ").length,
  }));

  const provider: ResearchResponse["provider"] = { volume: false, name: null };
  if (dataforseoConfigured()) {
    try {
      const enriched = await enrichKeywords(keywordList, country, language);
      rows = rows.map((r) => ({ ...r, ...(enriched.get(r.keyword) ?? {}) }));
      provider.volume = true;
      provider.name = "DataForSEO";
    } catch (err) {
      provider.error = err instanceof Error ? err.message : "Data provider failed";
    }
  }

  const response: ResearchResponse & { quota: typeof usage.quota } = {
    quota: usage.quota,
    seed,
    country,
    language,
    keywords: rows,
    provider,
    stats: { suggestRequests: requests, elapsedMs: Date.now() - started },
  };
  return NextResponse.json(response);
}
