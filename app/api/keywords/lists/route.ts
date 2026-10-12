import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { adminDb } from "@/lib/firebase/admin";
import { LANGUAGES, SOURCES, type GroupType, type Intent, type KeywordRow, type SuggestSource } from "@/lib/keywords/types";

const MAX_LISTS = 25;
const MAX_KEYWORDS_PER_LIST = 1000;
const VALID_SOURCES = new Set<SuggestSource>(SOURCES.map((s) => s.id));
const INTENTS = new Set<Intent>(["informational", "commercial", "transactional", "navigational"]);
const GROUPS = new Set<GroupType>(["question", "comparison", "preposition", "other"]);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const snap = await adminDb().collection("keywordLists").doc(id).get();
    if (!snap.exists || snap.data()?.ownerUid !== user.uid) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const data = snap.data()!;
    return NextResponse.json({
      id,
      name: data.name,
      seed: data.seed,
      country: data.country,
      language: data.language ?? "en",
      sources: data.sources ?? [],
      keywords: data.keywords,
    });
  }
  const snap = await adminDb()
    .collection("keywordLists")
    .where("ownerUid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(MAX_LISTS)
    .get();
  const lists = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name as string,
      seed: data.seed as string,
      country: data.country as string,
      count: (data.keywords as unknown[]).length,
      createdAt: data.createdAt as number,
    };
  });
  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { name?: unknown; seed?: unknown; country?: unknown; language?: unknown; sources?: unknown; keywords?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const seed = typeof body.seed === "string" ? body.seed.slice(0, 80) : "";
  const country = typeof body.country === "string" ? body.country.slice(0, 2) : "us";
  const language = LANGUAGES.find((l) => l.code === body.language)?.code ?? "en";
  const listSources = Array.isArray(body.sources) ? body.sources.filter((s): s is SuggestSource => VALID_SOURCES.has(s as SuggestSource)) : [];
  if (!name || !Array.isArray(body.keywords) || body.keywords.length === 0) {
    return NextResponse.json({ error: "Name and at least one keyword are required." }, { status: 400 });
  }
  const keywords = (body.keywords as Partial<KeywordRow>[])
    .filter((k) => k && typeof k.keyword === "string" && k.keyword.trim())
    .slice(0, MAX_KEYWORDS_PER_LIST)
    .map((k) => ({
      keyword: String(k.keyword).slice(0, 120),
      intent: INTENTS.has(k.intent as Intent) ? (k.intent as Intent) : "informational",
      intentBy: k.intentBy === "ai" ? "ai" : "rules",
      cluster: String(k.cluster ?? "").slice(0, 120),
      group: GROUPS.has(k.group as GroupType) ? (k.group as GroupType) : "other",
      groupWord: typeof k.groupWord === "string" ? k.groupWord.slice(0, 24) : null,
      sources: Array.isArray(k.sources) ? k.sources.filter((s) => VALID_SOURCES.has(s)) : [],
      rank: num(k.rank),
      hits: num(k.hits) ?? 0,
      signal: num(k.signal) ?? 0,
      depth: k.depth === 0 || k.depth === 2 ? k.depth : 1,
      words: num(k.words) ?? String(k.keyword).split(" ").length,
      volume: num(k.volume),
      kd: num(k.kd),
      cpc: num(k.cpc),
      competition: num(k.competition),
      trend: Array.isArray(k.trend) ? k.trend.filter((v): v is number => typeof v === "number").slice(-12) : null,
    }));
  if (keywords.length === 0) return NextResponse.json({ error: "At least one keyword is required." }, { status: 400 });

  const col = adminDb().collection("keywordLists");
  const existing = await col.where("ownerUid", "==", user.uid).count().get();
  if (existing.data().count >= MAX_LISTS) {
    return NextResponse.json({ error: `You can save up to ${MAX_LISTS} lists. Delete one first.` }, { status: 400 });
  }
  const ref = await col.add({ ownerUid: user.uid, name, seed, country, language, sources: listSources, keywords, createdAt: Date.now() });
  return NextResponse.json({ id: ref.id });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const ref = adminDb().collection("keywordLists").doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.ownerUid !== user.uid) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await ref.delete();
  return NextResponse.json({ ok: true });
}
