import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";

/**
 * SSRF-safe fetch for user-supplied URLs. Guards:
 *  - http/https only, standard ports only
 *  - the IP that the socket actually connects to is validated inside the `lookup` hook (defeats DNS rebinding)
 *  - private / loopback / link-local / CGNAT / metadata ranges are refused (IPv4 + IPv6)
 *  - redirects are followed manually (max 5) and every hop is re-validated
 *  - hard timeout and response size cap
 */

export class SafeFetchError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIPv6(ip: string): boolean {
  const l = ip.toLowerCase();
  if (l === "::" || l === "::1") return true;
  if (l.startsWith("fc") || l.startsWith("fd")) return true; // unique local
  if (l.startsWith("fe8") || l.startsWith("fe9") || l.startsWith("fea") || l.startsWith("feb")) return true; // link-local
  const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true;
}

function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    const bad = list.find((a) => isPrivateAddress(a.address));
    if (bad || list.length === 0) {
      return callback(new SafeFetchError("That address is not allowed."), "", 0);
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

export interface SafeResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  finalUrl: string;
  redirects: string[];
  elapsedMs: number;
  bytes: number;
  truncated: boolean;
}

export function normalizeUrl(input: string): URL {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SafeFetchError("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new SafeFetchError("Only http(s) URLs are supported.");
  if (url.username || url.password) throw new SafeFetchError("URLs with credentials are not allowed.");
  const port = url.port;
  if (port && port !== "80" && port !== "443") throw new SafeFetchError("Only standard ports (80/443) are allowed.");
  if (!url.hostname.includes(".") && !net.isIP(url.hostname)) throw new SafeFetchError("Enter a public domain name.");
  if (net.isIP(url.hostname) && isPrivateAddress(url.hostname)) throw new SafeFetchError("That address is not allowed.");
  return url;
}

function once(url: URL, timeoutMs: number, maxBytes: number): Promise<Omit<SafeResponse, "redirects" | "finalUrl">> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: guardedLookup as unknown as net.LookupFunction,
        timeout: timeoutMs,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; seowise-Bot/1.0; +https://tools.eegnite.com/bot)",
          accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
          "accept-encoding": "gzip, br, deflate",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;
        res.on("data", (c: Buffer) => {
          bytes += c.length;
          if (bytes > maxBytes) {
            truncated = true;
            res.destroy();
            return;
          }
          chunks.push(c);
        });
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          let buf = Buffer.concat(chunks);
          const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
          try {
            const opts = { maxOutputLength: maxBytes * 4 };
            if (enc.includes("br")) buf = zlib.brotliDecompressSync(buf, opts);
            else if (enc.includes("gzip")) buf = zlib.gunzipSync(buf, opts);
            else if (enc.includes("deflate")) buf = zlib.inflateSync(buf, opts);
          } catch {
            // Truncated or oversized compressed stream: fall back to what we could decode.
            try {
              if (enc.includes("gzip")) buf = zlib.gunzipSync(Buffer.concat(chunks), { finishFlush: zlib.constants.Z_SYNC_FLUSH, maxOutputLength: maxBytes * 4 });
            } catch { /* leave raw buffer */ }
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: Object.fromEntries(
              Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v.join(", ") : (v ?? "")]),
            ),
            body: buf.toString("utf8"),
            elapsedMs: Date.now() - started,
            bytes: Math.min(bytes, maxBytes),
            truncated,
          });
        };
        res.on("end", done);
        res.on("close", done);
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new SafeFetchError("The site took too long to respond.")));
    req.on("error", (err) =>
      reject(err instanceof SafeFetchError ? err : new SafeFetchError(`Could not reach the site (${(err as NodeJS.ErrnoException).code ?? err.message}).`)),
    );
    req.end();
  });
}

export async function safeFetch(
  input: string,
  opts: { timeoutMs?: number; maxBytes?: number; maxRedirects?: number } = {},
): Promise<SafeResponse> {
  const { timeoutMs = 10_000, maxBytes = 2_000_000, maxRedirects = 5 } = opts;
  let url = normalizeUrl(input);
  const redirects: string[] = [];
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await once(url, timeoutMs, maxBytes);
    const loc = res.headers["location"];
    if (res.status >= 300 && res.status < 400 && loc) {
      redirects.push(`${res.status} ${url.href}`);
      url = normalizeUrl(new URL(loc, url).href);
      continue;
    }
    return { ...res, finalUrl: url.href, redirects };
  }
  throw new SafeFetchError("Too many redirects.");
}
