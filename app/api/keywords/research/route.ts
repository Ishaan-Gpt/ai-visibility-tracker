import { after, NextRequest, NextResponse } from "next/server";
import { consumeQuota, getViewer } from "@/lib/usage";
import { PROVIDER_KEYWORDS } from "@/lib/limits";
import { cacheKey, readCache, writeCache } from "@/lib/keywords/cache";
import { runResearch } from "@/lib/keywords/research";
import { normalizeKeyword } from "@/lib/keywords/text";
import { COUNTRIES, DEFAULT_SOURCES, LANGUAGES, SOURCES, type SuggestSource } from "@/lib/keywords/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { seed?: unknown; country?: unknown; language?: unknown; sources?: unknown; fresh?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const country = COUNTRIES.find((c) => c.code === body.country) ?? COUNTRIES[0];
  const language = LANGUAGES.find((l) => l.code === body.language)?.code ?? country.lang;
  const seed = normalizeKeyword(typeof body.seed === "string" ? body.seed : "", language);
  if (seed.length < 2 || seed.length > 80) {
    return NextResponse.json({ error: "Enter a seed keyword between 2 and 80 characters." }, { status: 400 });
  }
  const valid = new Set(SOURCES.map((s) => s.id));
  const requested = Array.isArray(body.sources) ? body.sources.filter((s): s is SuggestSource => valid.has(s as SuggestSource)) : [];
  const sources = SOURCES.map((s) => s.id).filter((id) => (requested.length ? requested : DEFAULT_SOURCES).includes(id));

  const viewer = await getViewer();
  const providerLimit = PROVIDER_KEYWORDS[viewer.tier];

  // Cache first: a hit returns instantly and does not use a run (or any paid provider credit).
  const key = cacheKey(seed, country.code, language, sources, providerLimit);
  if (body.fresh !== true) {
    const hit = await readCache(key);
    if (hit) return NextResponse.json(hit);
  }

  // Daily cap (per IP when anonymous): protects the data provider and the autocomplete endpoints from abuse.
  const usage = await consumeQuota(req, "keywords", viewer);
  if (!usage.ok) return NextResponse.json({ error: usage.message, quota: usage.quota, limited: true }, { status: 429 });

  const result = await runResearch({ seed, country: country.code, language, sources, providerLimit });

  if (result.keywords.length <= 1) {
    return NextResponse.json(
      { error: "No suggestions came back for that seed. Try a broader or differently worded keyword, or add more sources." },
      { status: 404 },
    );
  }

  // Only cache complete-enough results: a provider error or a mostly failed run should be retried next time.
  const failedSources = Object.values(result.stats.perSource).filter((s) => s && s.ok === 0).length;
  if (!result.provider.error && failedSources < sources.length) after(() => writeCache(key, result));

  return NextResponse.json({ ...result, quota: usage.quota });
}
