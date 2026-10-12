import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import { DEFAULT_UA, SafeFetchError, isPrivateAddress, normalizeUrl } from "@/lib/net/safeFetch";

/**
 * Binary-safe sibling of `safeFetch` for sitemap files: `.xml.gz` sitemaps arrive as raw gzip bytes
 * (no Content-Encoding), which a utf8 string body would corrupt. Same SSRF guards: http(s) and
 * standard ports only (via normalizeUrl), the connected IP is validated in the lookup hook, every
 * redirect hop is re-validated, hard timeout and byte cap.
 */

function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some((a) => isPrivateAddress(a.address))) {
      return callback(new SafeFetchError("That address is not allowed."), "", 0);
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

export interface BytesResponse {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
  finalUrl: string;
  redirects: string[];
  truncated: boolean;
  elapsedMs: number;
}

interface Opts {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  signal?: AbortSignal;
}

function once(url: URL, timeoutMs: number, maxBytes: number, signal?: AbortSignal): Promise<Omit<BytesResponse, "finalUrl" | "redirects">> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: guardedLookup as unknown as net.LookupFunction,
        timeout: timeoutMs,
        signal,
        headers: {
          "user-agent": DEFAULT_UA,
          accept: "application/xml,text/xml;q=0.9,application/x-gzip;q=0.8,*/*;q=0.5",
          "accept-encoding": "gzip, br, deflate",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;
        let settled = false;
        res.on("data", (c: Buffer) => {
          bytes += c.length;
          if (bytes > maxBytes) {
            truncated = true;
            res.destroy();
            return;
          }
          chunks.push(c);
        });
        const done = () => {
          if (settled) return;
          settled = true;
          let buf = Buffer.concat(chunks);
          const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
          try {
            const o = { maxOutputLength: 64 * 1024 * 1024 };
            if (enc.includes("br")) buf = zlib.brotliDecompressSync(buf, o);
            else if (enc.includes("gzip")) buf = zlib.gunzipSync(buf, o);
            else if (enc.includes("deflate")) buf = zlib.inflateSync(buf, o);
          } catch {
            /* keep raw bytes; the caller reports unreadable content */
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: Object.fromEntries(Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v.join(", ") : (v ?? "")])),
            body: buf,
            truncated,
            elapsedMs: Date.now() - started,
          });
        };
        res.on("end", done);
        res.on("close", done);
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new SafeFetchError("The server took too long to respond.")));
    req.on("error", (err) =>
      reject(err instanceof SafeFetchError ? err : new SafeFetchError(`Could not reach the server (${(err as NodeJS.ErrnoException).code ?? err.message}).`)),
    );
    req.end();
  });
}

export async function fetchBytes(input: string, opts: Opts = {}): Promise<BytesResponse> {
  const { timeoutMs = 15_000, maxBytes = 20 * 1024 * 1024, maxRedirects = 5, signal } = opts;
  let url = normalizeUrl(input);
  const redirects: string[] = [];
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await once(url, timeoutMs, maxBytes, signal);
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

/** Decompresses gzip payloads (by magic bytes, not file name) and decodes to text. */
export function decodeSitemapBody(buf: Buffer): { text: string; gzip: boolean; error?: string } {
  let gzip = false;
  let data = buf;
  if (buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    gzip = true;
    try {
      data = zlib.gunzipSync(buf, { maxOutputLength: 64 * 1024 * 1024 });
    } catch {
      return { text: "", gzip, error: "The .gz file could not be decompressed (corrupt, or larger than 64 MB uncompressed)." };
    }
  }
  // UTF-16 BOMs are legal XML but forbidden for sitemaps (must be UTF-8); decode so we can say so.
  if (data.length > 1 && data[0] === 0xff && data[1] === 0xfe) return { text: data.toString("utf16le").replace(/^﻿/, ""), gzip };
  return { text: data.toString("utf8").replace(/^﻿/, ""), gzip };
}
