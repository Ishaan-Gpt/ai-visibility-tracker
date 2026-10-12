/** Domain helpers shared by the analyzer, providers and settings forms. Pure: safe on server and client. */

/**
 * Second-level suffixes where the registrable domain is three labels (example.co.uk). Not the full Public
 * Suffix List, but it covers the country-code patterns customers actually use.
 */
const MULTI_PART_SUFFIXES = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "ltd.uk", "plc.uk", "me.uk", "net.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "org.nz", "net.nz",
  "co.in", "net.in", "org.in", "firm.in", "gen.in", "ind.in", "gov.in", "ac.in",
  "co.jp", "ne.jp", "or.jp", "ac.jp",
  "co.kr", "or.kr",
  "com.br", "net.br", "org.br",
  "com.mx", "org.mx",
  "com.ar", "com.co", "com.pe", "com.ve", "com.uy", "com.ec",
  "co.za", "org.za",
  "com.sg", "com.my", "com.ph", "com.hk", "com.tw", "com.cn", "com.vn", "co.id", "co.th",
  "com.tr", "com.sa", "com.eg", "com.ng", "com.pk", "com.bd", "co.il", "co.ke",
  "com.pl", "com.ua", "co.at", "or.at",
]);

/** "https://www.Example.co.uk/path" -> "www.example.co.uk". Accepts bare hosts too. */
export function hostOf(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return raw.toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#:].*$/, "");
  }
}

/** Registrable domain (eTLD+1): "blog.acme.co.uk" -> "acme.co.uk", "www.g2.com" -> "g2.com". */
export function registrableDomain(input: string): string {
  const host = hostOf(input).replace(/^www\d?\./, "");
  if (!host || /^\d+(\.\d+){3}$/.test(host)) return host;
  const labels = host.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  return MULTI_PART_SUFFIXES.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
}

/** The label before the public suffix: "acme" for "acme.co.uk". */
export function domainLabel(input: string): string {
  return registrableDomain(input).split(".")[0] ?? "";
}

/** True when `host` is `domain` or a subdomain of it (registrable-domain comparison). */
export function sameSite(hostOrUrl: string, domain: string): boolean {
  const a = registrableDomain(hostOrUrl);
  const b = registrableDomain(domain);
  return Boolean(a) && a === b;
}

/** Cleans what a user typed in a domain field into a bare hostname, or "" when it isn't one. */
export function cleanDomainInput(input: string): string {
  const host = hostOf(input).replace(/^www\./, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) && host.length <= 253 ? host : "";
}
