"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/session";
import { getBrandForUser, getUser, planLimits } from "@/lib/data";

function normalizeDomain(input: string): string {
  const trimmed = input.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  return trimmed.toLowerCase();
}

export async function createBrand(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await getBrandForUser(user.uid);
  if (existing) {
    throw new Error("A brand already exists for this account (Stage 1 supports one brand per account).");
  }

  const name = String(formData.get("name") ?? "").trim();
  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  const competitorName = String(formData.get("competitorName") ?? "").trim();
  const competitorDomain = normalizeDomain(String(formData.get("competitorDomain") ?? ""));

  if (!name || !domain) {
    throw new Error("Brand name and domain are required.");
  }

  const competitors = competitorName && competitorDomain ? [{ name: competitorName, domain: competitorDomain }] : [];

  const brandRef = adminDb().collection("brands").doc();
  await brandRef.set({
    ownerUid: user.uid,
    name,
    domain,
    competitors,
    createdAt: Date.now(),
  });

  // Seed with any prompts submitted on the same form (up to plan limit).
  const userDoc = await getUser(user.uid);
  const limits = planLimits(userDoc?.plan);
  const promptTexts = formData
    .getAll("prompts")
    .map((p) => String(p).trim())
    .filter(Boolean)
    .slice(0, limits.maxPrompts);

  const batch = adminDb().batch();
  for (const text of promptTexts) {
    const promptRef = adminDb().collection("prompts").doc();
    batch.set(promptRef, {
      brandId: brandRef.id,
      text,
      active: true,
      createdAt: Date.now(),
    });
  }
  await batch.commit();

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function addPrompt(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const brand = await getBrandForUser(user.uid);
  if (!brand) throw new Error("Create a brand first.");

  const userDoc = await getUser(user.uid);
  const limits = planLimits(userDoc?.plan);

  const currentSnap = await adminDb().collection("prompts").where("brandId", "==", brand.id).get();
  if (currentSnap.size >= limits.maxPrompts) {
    throw new Error(
      `Your plan allows up to ${limits.maxPrompts} tracked prompts. Upgrade to track more.`
    );
  }

  const text = String(formData.get("text") ?? "").trim();
  if (!text) throw new Error("Prompt text is required.");

  await adminDb().collection("prompts").add({
    brandId: brand.id,
    text,
    active: true,
    createdAt: Date.now(),
  });

  revalidatePath("/dashboard");
}

export async function togglePrompt(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const promptId = String(formData.get("promptId") ?? "");
  const nextActive = formData.get("nextActive") === "true";
  if (!promptId) throw new Error("Missing promptId.");
  await adminDb().collection("prompts").doc(promptId).update({ active: nextActive });
  revalidatePath("/dashboard");
}
