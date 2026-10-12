import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import type net from "node:net";
import { DEFAULT_UA, SafeFetchError, isPrivateAddress, normalizeUrl } from "@/lib/net/safeFetch";
import type { ImageProbe } from "@/lib/tools/pageExtract/types";

/**
 * Reads just enough of an image to learn its format and pixel size, the way a social
 * crawler would see it. `safeFetch` decodes bodies as UTF-8 (fine for HTML, lossy for
 * binary), so this is a small binary partial GET with the same SSRF guards:
 * standard ports via `normalizeUrl`, the connected IP checked in the `lookup` hook,
 * every redirect hop re-validated, a hard timeout and a byte cap.
 */

const MAX_PROBE_BYTES = 512 * 1024;
const MAX_HOPS = 4;

function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some((a) => isPrivateAddress(a.address))) return callback(new SafeFetchError("That address is not allowed."), "", 0);
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

type Dims = { width: number; height: number; format: string };

/** Parses width/height from the first bytes of PNG, GIF, JPEG, WebP, BMP, AVIF/HEIC or SVG. Returns null if more bytes are needed or the format is unknown. */
export function sniffDimensions(b: Buffer): Dims | null {
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.toString("ascii", 12, 16) === "IHDR") {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), format: "png" };
  }
  if (b.length >= 10 && (b.toString("ascii", 0, 6) === "GIF87a" || b.toString("ascii", 0, 6) === "GIF89a")) {
    return { width: b.readUInt16LE(6), height: b.readUInt16LE(8), format: "gif" };
  }
  if (b.length >= 26 && b.toString("ascii", 0, 2) === "BM") {
    return { width: b.readInt32LE(18), height: Math.abs(b.readInt32LE(22)), format: "bmp" };
  }
  if (b.length >= 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff, format: "webp" };
    if (chunk === "VP8L") {
      const b0 = b[21], b1 = b[22], b2 = b[23], b3 = b[24];
      return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)), format: "webp" };
    }
    if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3), format: "webp" };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7), format: "jpeg" };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  }
  if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp") {
    const brand = b.toString("ascii", 8, 12);
    const idx = b.indexOf("ispe");
    if (idx > 0 && idx + 16 <= b.length) return { width: b.readUInt32BE(idx + 8), height: b.readUInt32BE(idx + 12), format: brand.startsWith("avi") ? "avif" : "heif" };
    return null;
  }
  const head = b.toString("utf8", 0, Math.min(b.length, 4096));
  const svg = head.match(/<svg\b[^>]*>/i);
  if (svg) {
    const tag = svg[0];
    const w = Number(tag.match(/\bwidth=["']?([\d.]+)(?:px)?["'\s>]/i)?.[1]);
    const h = Number(tag.match(/\bheight=["']?([\d.]+)(?:px)?["'\s>]/i)?.[1]);
    if (w && h) return { width: Math.round(w), height: Math.round(h), format: "svg" };
    const vb = tag.match(/viewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (vb) return { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])), format: "svg" };
    return { width: 0, height: 0, format: "svg" };
  }
  return null;
}

type Hop = { status: number; headers: http.IncomingHttpHeaders; dims: Dims | null };

function hop(url: URL, timeoutMs: number): Promise<Hop> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: guardedLookup as unknown as net.LookupFunction,
        timeout: timeoutMs,
        headers: {
          "user-agent": DEFAULT_UA,
          accept: "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
          "accept-encoding": "identity",
          range: `bytes=0-${MAX_PROBE_BYTES - 1}`,
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, headers: res.headers, dims: null });
        }
        const chunks: Buffer[] = [];
        let size = 0;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          const buf = Buffer.concat(chunks);
          resolve({ status, headers: res.headers, dims: sniffDimensions(buf) });
        };
        res.on("data", (c: Buffer) => {
          chunks.push(c);
          size += c.length;
          if (size >= 64 && sniffDimensions(Buffer.concat(chunks))) {
            finish();
            res.destroy();
          } else if (size >= MAX_PROBE_BYTES) {
            finish();
            res.destroy();
          }
        });
        res.on("end", finish);
        res.on("close", finish);
        res.on("error", (e) => (done ? undefined : reject(e)));
      },
    );
    req.on("timeout", () => req.destroy(new SafeFetchError("The image took too long to respond.")));
    req.on("error", (err) => reject(err instanceof SafeFetchError ? err : new SafeFetchError(`Could not reach the image (${(err as NodeJS.ErrnoException).code ?? err.message}).`)));
    req.end();
  });
}

function totalBytes(h: http.IncomingHttpHeaders, status: number): number | null {
  const range = h["content-range"];
  if (typeof range === "string") {
    const total = Number(range.split("/")[1]);
    if (Number.isFinite(total) && total > 0) return total;
  }
  if (status === 200 && h["content-length"]) {
    const n = Number(h["content-length"]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export async function probeImage(input: string, timeoutMs = 6000): Promise<ImageProbe> {
  const base: ImageProbe = { requestedUrl: input, url: input, ok: false, status: null, contentType: null, bytes: null, width: null, height: null, format: null };
  if (input.startsWith("data:")) return { ...base, error: "Inline data: URLs are not fetched by social platforms." };
  let url: URL;
  try {
    url = normalizeUrl(input);
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "Invalid image URL." };
  }
  try {
    for (let i = 0; i <= MAX_HOPS; i++) {
      const r = await hop(url, timeoutMs);
      const loc = r.headers.location;
      if (r.status >= 300 && r.status < 400 && typeof loc === "string") {
        url = normalizeUrl(new URL(loc, url).href);
        continue;
      }
      const contentType = (typeof r.headers["content-type"] === "string" ? r.headers["content-type"] : "").split(";")[0].trim() || null;
      const ok = r.status >= 200 && r.status < 300;
      return {
        requestedUrl: input,
        url: url.href,
        ok: ok && !!r.dims,
        status: r.status,
        contentType,
        bytes: totalBytes(r.headers, r.status),
        width: r.dims?.width || null,
        height: r.dims?.height || null,
        format: r.dims?.format ?? null,
        ...(ok ? (r.dims ? {} : { error: contentType && !contentType.startsWith("image/") ? `The URL returns ${contentType}, not an image.` : "Could not read the image dimensions." }) : { error: `The image URL returns HTTP ${r.status}.` }),
      };
    }
    return { ...base, error: "Too many redirects." };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "Could not fetch the image." };
  }
}
