/** Shared text/URL matching used across providers to decide "was this brand mentioned". */

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^www\./, "");
}

/** Bare domain without common TLD, used for loose name-in-text matching (e.g. "eegnite" from "eegnite.com"). */
function domainRoot(domain: string): string {
  return normalizeDomain(domain).split(".")[0];
}

export function textMentionsBrand(text: string, name: string, domain: string): boolean {
  const lower = text.toLowerCase();
  if (name && lower.includes(name.toLowerCase())) return true;
  if (domain) {
    const normalized = normalizeDomain(domain);
    if (lower.includes(normalized)) return true;
    const root = domainRoot(domain);
    if (root.length > 2 && lower.includes(root)) return true;
  }
  return false;
}

function hostnameOf(url: string): string {
  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return normalizeDomain(url);
  }
}

export function urlsMentionDomain(urls: string[], domain: string): boolean {
  const normalized = normalizeDomain(domain);
  return urls.some((url) => hostnameOf(url).includes(normalized));
}
