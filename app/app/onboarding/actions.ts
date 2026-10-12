"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getUser, planLimits } from "@/lib/data";
import { cleanDomainInput } from "@/lib/visibility/domains";
import { suggestPrompts, type PromptSuggestion } from "@/lib/visibility/suggest";
import type { BrandDoc, Competitor, PromptDoc } from "@/lib/types";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MAX_PROMPT_CHARS = 300;
const MIN_PROMPT_CHARS = 3;

function cleanText(input: unknown, max: number): string {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function refresh() {
  revalidatePath("/app/visibility");
  revalidatePath("/app");
}

async function requireBrand(): Promise<{ uid: string; brand: BrandDoc; limits: ReturnType<typeof planLimits> }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app/visibility");
  const brand = await getBrandForUser(user.uid);
  if (!brand) redirect("/app/onboarding");
  const userDoc = await getUser(user.uid);
  return { uid: user.uid, brand, limits: planLimits(userDoc?.plan) };
}

async function brandPrompts(brandId: string): Promise<PromptDoc[]> {
  const snap = await adminDb().collection("prompts").where("brandId", "==", brandId).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PromptDoc, "id">) }));
}

/** Loads a prompt and checks it belongs to the signed-in user's brand. */
async function ownedPrompt(promptId: string) {
  const { brand } = await requireBrand();
  if (!promptId || typeof promptId !== "string") return null;
  const ref = adminDb().collection("prompts").doc(promptId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("brandId") !== brand.id) return null;
  return { ref, brand };
}

function parseAliases(raw: unknown, brandName: string, max: number): string[] {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\n]/);
  const seen = new Set<string>([brandName.trim().toLowerCase()]);
  const out: string[] = [];
  for (const a of list) {
    const v = cleanText(a, 60);
    if (v.length < 2 || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out.slice(0, max);
}

/* ---------------- onboarding ---------------- */

export async function createBrand(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await getBrandForUser(user.uid);
  if (existing) redirect("/app/visibility");

  const name = cleanText(formData.get("name"), 80);
  const domain = cleanDomainInput(String(formData.get("domain") ?? ""));
  const category = cleanText(formData.get("category"), 80);
  const competitorName = cleanText(formData.get("competitorName"), 80);
  const competitorDomain = cleanDomainInput(String(formData.get("competitorDomain") ?? ""));

  if (!name || !domain) throw new Error("Brand name and a valid domain (like acme.com) are required.");

  const userDoc = await getUser(user.uid);
  const limits = planLimits(userDoc?.plan);
  const competitors = competitorName && competitorDomain && competitorDomain !== domain ? [{ name: competitorName, domain: competitorDomain }] : [];
  const aliases = parseAliases(formData.get("aliases"), name, limits.maxAliases);

  const brandRef = adminDb().collection("brands").doc();
  await brandRef.set({
    ownerUid: user.uid,
    name,
    domain,
    competitors: competitors.slice(0, limits.maxCompetitors),
    aliases,
    ...(category ? { category } : {}),
    createdAt: Date.now(),
    lastCheckedAt: 0,
  });

  // Seed with the prompts from the same form (up to the plan limit), de-duplicated.
  const seen = new Set<string>();
  const promptTexts = formData
    .getAll("prompts")
    .map((p) => cleanText(p, MAX_PROMPT_CHARS))
    .filter((p) => p.length >= MIN_PROMPT_CHARS && !seen.has(p.toLowerCase()) && seen.add(p.toLowerCase()))
    .slice(0, limits.maxPrompts);

  const batch = adminDb().batch();
  const now = Date.now();
  promptTexts.forEach((text, i) => {
    batch.set(adminDb().collection("prompts").doc(), { brandId: brandRef.id, text, active: true, createdAt: now + i });
  });
  await batch.commit();

  refresh();
  // `first=1` makes the dashboard start the free first check immediately.
  redirect(promptTexts.length ? "/app/visibility?first=1" : "/app/visibility");
}

/** Prompt ideas for the onboarding form, before a brand exists. */
export async function suggestOnboardingPrompts(input: { name: string; domain: string; category?: string }): Promise<ActionResult<{ prompts: PromptSuggestion[]; category: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };
  const name = cleanText(input.name, 80);
  const domain = cleanDomainInput(input.domain ?? "");
  if (!name || !domain) return { ok: false, error: "Add your brand name and domain first." };
  try {
    const res = await suggestPrompts({ name, domain, category: cleanText(input.category, 80) || undefined, competitors: [], existing: [], count: 8 });
    return { ok: true, ...res };
  } catch (err) {
    console.error("[visibility] onboarding suggestions failed", err);
    return { ok: false, error: "Couldn't draft prompts right now. Write your own, or try again in a minute." };
  }
}

/* ---------------- prompts ---------------- */

export async function addPrompts(texts: string[]): Promise<ActionResult<{ added: number }>> {
  const { brand, limits } = await requireBrand();
  const current = await brandPrompts(brand.id);
  const seen = new Set(current.map((p) => p.text.toLowerCase()));
  const clean: string[] = [];
  for (const t of Array.isArray(texts) ? texts : []) {
    const v = cleanText(t, MAX_PROMPT_CHARS);
    if (v.length < MIN_PROMPT_CHARS || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    clean.push(v);
  }
  if (!clean.length) return { ok: false, error: "Those prompts are already tracked." };
  const room = limits.maxPrompts - current.length;
  if (room <= 0) return { ok: false, error: `Your plan tracks up to ${limits.maxPrompts} prompts. Delete one or upgrade to add more.` };
  const batch = adminDb().batch();
  const now = Date.now();
  clean.slice(0, room).forEach((text, i) => batch.set(adminDb().collection("prompts").doc(), { brandId: brand.id, text, active: true, createdAt: now + i }));
  await batch.commit();
  refresh();
  return { ok: true, added: Math.min(room, clean.length) };
}

/** Form-action version, kept for existing forms. */
export async function addPrompt(formData: FormData) {
  const res = await addPrompts([String(formData.get("text") ?? "")]);
  if (!res.ok) throw new Error(res.error);
}

export async function updatePrompt(promptId: string, text: string): Promise<ActionResult> {
  const owned = await ownedPrompt(promptId);
  if (!owned) return { ok: false, error: "Prompt not found." };
  const clean = cleanText(text, MAX_PROMPT_CHARS);
  if (clean.length < MIN_PROMPT_CHARS) return { ok: false, error: "Prompt is too short." };
  await owned.ref.update({ text: clean, updatedAt: Date.now() });
  refresh();
  return { ok: true };
}

export async function setPromptActive(promptId: string, active: boolean): Promise<ActionResult> {
  const owned = await ownedPrompt(promptId);
  if (!owned) return { ok: false, error: "Prompt not found." };
  await owned.ref.update({ active: Boolean(active), updatedAt: Date.now() });
  refresh();
  return { ok: true };
}

/** Form-action version, kept for existing forms. Now checks ownership. */
export async function togglePrompt(formData: FormData) {
  const res = await setPromptActive(String(formData.get("promptId") ?? ""), formData.get("nextActive") === "true");
  if (!res.ok) throw new Error(res.error);
}

/** Deletes the prompt and its run history. */
export async function deletePrompt(promptId: string): Promise<ActionResult> {
  const owned = await ownedPrompt(promptId);
  if (!owned) return { ok: false, error: "Prompt not found." };
  const db = adminDb();
  const runs = await db.collection("runs").where("promptId", "==", promptId).limit(1000).get();
  for (let i = 0; i < runs.docs.length; i += 400) {
    const batch = db.batch();
    for (const d of runs.docs.slice(i, i + 400)) if (d.get("brandId") === owned.brand.id) batch.delete(d.ref);
    await batch.commit();
  }
  await owned.ref.delete();
  refresh();
  return { ok: true };
}

/** Drafts ~10 prompts for the existing brand; the user picks which to track. */
export async function suggestBrandPrompts(): Promise<ActionResult<{ prompts: PromptSuggestion[]; category: string }>> {
  const { brand } = await requireBrand();
  const current = await brandPrompts(brand.id);
  try {
    const res = await suggestPrompts({
      name: brand.name,
      domain: brand.domain,
      category: brand.category,
      competitors: brand.competitors,
      existing: current.map((p) => p.text),
      count: 10,
    });
    if (!brand.category && res.category) await adminDb().collection("brands").doc(brand.id).update({ category: res.category });
    return { ok: true, ...res };
  } catch (err) {
    console.error("[visibility] suggestions failed", err);
    return { ok: false, error: "Couldn't draft prompts right now. Try again in a minute." };
  }
}

/* ---------------- brand settings ---------------- */

export async function updateBrandSettings(input: { competitors: Competitor[]; aliases: string[]; category: string }): Promise<ActionResult> {
  const { brand, limits } = await requireBrand();
  const competitors: Competitor[] = [];
  const seen = new Set<string>([brand.domain]);
  for (const c of Array.isArray(input.competitors) ? input.competitors : []) {
    const name = cleanText(c?.name, 80);
    const domain = cleanDomainInput(String(c?.domain ?? ""));
    if (!name && !domain) continue;
    if (!name || !domain) return { ok: false, error: "Each competitor needs a name and a valid domain." };
    if (seen.has(domain)) return { ok: false, error: `${domain} is listed twice.` };
    seen.add(domain);
    competitors.push({ name, domain });
  }
  if (competitors.length > limits.maxCompetitors) {
    return { ok: false, error: `Your plan compares up to ${limits.maxCompetitors} competitor${limits.maxCompetitors === 1 ? "" : "s"}.` };
  }
  const aliases = parseAliases(input.aliases, brand.name, limits.maxAliases);
  const category = cleanText(input.category, 80);
  await adminDb().collection("brands").doc(brand.id).update({ competitors, aliases, category });
  refresh();
  return { ok: true };
}
