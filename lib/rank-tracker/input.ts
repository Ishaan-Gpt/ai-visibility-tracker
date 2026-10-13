import "server-only";
import { cleanDomainInput } from "@/lib/visibility/domains";
import { COUNTRIES, LANGUAGES } from "@/lib/keywords/types";
import { locationsFor } from "@/lib/dataforseo/labs";
import type { Device } from "./types";

/** Validated project settings from a request body. Location city codes are checked against DataForSEO's list. */
export interface ProjectInput {
  name: string;
  domain: string;
  includeSubdomains: boolean;
  country: string;
  language: string;
  locationCode: number;
  locationName: string;
  device: Device;
  competitors: string[];
  emailAlerts: boolean;
  alertThreshold: number;
}

export async function parseProjectInput(body: Record<string, unknown>, competitorLimit: number): Promise<{ ok: true; value: ProjectInput } | { ok: false; error: string }> {
  const domain = cleanDomainInput(typeof body.domain === "string" ? body.domain : "");
  if (!domain) return { ok: false, error: "Enter a valid domain, like example.com." };
  const country = COUNTRIES.find((c) => c.code === body.country);
  if (!country) return { ok: false, error: "Pick a country." };
  const language = LANGUAGES.find((l) => l.code === body.language)?.dfs ?? country.lang;
  const device: Device = body.device === "mobile" ? "mobile" : "desktop";

  let locationCode = country.dataforseoLocation;
  let locationName = country.name;
  const city = body.city as { code?: unknown; name?: unknown } | null | undefined;
  if (city && typeof city.code === "number") {
    try {
      const match = (await locationsFor(country.code)).find((l) => l.code === city.code);
      if (!match) return { ok: false, error: "That city isn't in the location list for this country." };
      locationCode = match.code;
      locationName = match.name;
    } catch {
      return { ok: false, error: "Couldn't verify the city right now. Save without a city or try again." };
    }
  }

  const rawComp = Array.isArray(body.competitors) ? body.competitors : [];
  const competitors: string[] = [];
  for (const c of rawComp) {
    const d = cleanDomainInput(typeof c === "string" ? c : "");
    if (d && d !== domain && !competitors.includes(d)) competitors.push(d);
  }
  if (competitors.length > competitorLimit) return { ok: false, error: `Your plan tracks up to ${competitorLimit} competitor${competitorLimit === 1 ? "" : "s"} per project.` };

  const name = (typeof body.name === "string" ? body.name : "").replace(/\s+/g, " ").trim().slice(0, 60) || domain;
  const threshold = Number(body.alertThreshold);
  return {
    ok: true,
    value: {
      name,
      domain,
      includeSubdomains: body.includeSubdomains !== false,
      country: country.code,
      language,
      locationCode,
      locationName,
      device,
      competitors,
      emailAlerts: body.emailAlerts !== false,
      alertThreshold: Number.isInteger(threshold) && threshold >= 1 && threshold <= 50 ? threshold : 5,
    },
  };
}
