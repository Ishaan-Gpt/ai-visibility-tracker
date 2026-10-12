"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ImageProbe } from "@/lib/tools/pageExtract/types";
import type { Measure } from "./serpMetrics";
import type { ImageFacts, ImageLookup } from "./socialRules";

const noop = () => () => {};

/** False during SSR and hydration, true afterwards. Lets us read canvas / localStorage without hydration mismatches. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

/** Canvas measureText with a small cache. Only call after hydration. */
export const measureText: Measure = (text, font) => {
  const key = `${font}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx && typeof document !== "undefined") ctx = document.createElement("canvas").getContext("2d");
  let w: number;
  if (ctx) {
    ctx.font = font;
    w = ctx.measureText(text).width;
  } else {
    const size = Number(font.match(/(\d+)px/)?.[1] ?? 14);
    w = text.length * size * 0.5;
  }
  if (cache.size > 6000) cache.clear();
  cache.set(key, w);
  return w;
};

function fromProbe(p: ImageProbe): ImageFacts {
  return {
    url: p.url || p.requestedUrl,
    source: "probe",
    state: p.ok ? "ok" : "error",
    width: p.width,
    height: p.height,
    bytes: p.bytes,
    contentType: p.contentType,
    format: p.format,
    httpStatus: p.status,
    error: p.error,
  };
}

/**
 * Facts for every image URL in `urls`: from the server probe when the page was loaded,
 * otherwise by loading the image in the browser (naturalWidth/Height work cross-origin;
 * the file size stays unknown).
 */
export function useImageFacts(urls: string[], probes: ImageProbe[] | undefined): ImageLookup {
  const [browser, setBrowser] = useState<Record<string, ImageFacts>>({});
  const started = useRef(new Set<string>());
  const finished = useRef(new Set<string>());
  const key = [...new Set(urls.filter((u) => /^https?:\/\//i.test(u)))].sort().join("\n");

  const probeMap = useMemo(() => {
    const m = new Map<string, ImageFacts>();
    for (const p of probes ?? []) {
      const f = fromProbe(p);
      m.set(p.requestedUrl, f);
      if (p.url) m.set(p.url, f);
    }
    return m;
  }, [probes]);

  useEffect(() => {
    const startedSet = started.current;
    const finishedSet = finished.current;
    const todo = key ? key.split("\n").filter((u) => !probeMap.has(u) && !startedSet.has(u)) : [];
    if (!todo.length) return;
    const imgs: HTMLImageElement[] = [];
    // Wait for typing to settle before hitting the network.
    const timer = window.setTimeout(() => {
      for (const u of todo) {
        startedSet.add(u);
        const img = new Image();
        imgs.push(img);
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        const done = (f: Partial<ImageFacts>) => {
          finishedSet.add(u);
          setBrowser((prev) => ({
            ...prev,
            [u]: { url: u, source: "browser", state: "error", width: null, height: null, bytes: null, contentType: null, format: null, httpStatus: null, ...f },
          }));
        };
        img.onload = () => done({ state: "ok", width: img.naturalWidth || null, height: img.naturalHeight || null, format: /\.svg(\?|$)/i.test(u) ? "svg" : null });
        img.onerror = () => done({ state: "error", error: "The image did not load in your browser." });
        img.src = u;
      }
    }, 450);
    return () => {
      window.clearTimeout(timer);
      for (const i of imgs) {
        i.onload = null;
        i.onerror = null;
      }
      // Anything still in flight is retried on the next run.
      for (const u of todo) if (!finishedSet.has(u)) startedSet.delete(u);
    };
  }, [key, probeMap]);

  return useCallback(
    (url: string) => {
      if (!/^https?:\/\//i.test(url)) return undefined;
      return (
        probeMap.get(url) ??
        browser[url] ?? { url, source: "browser", state: "loading", width: null, height: null, bytes: null, contentType: null, format: null, httpStatus: null }
      );
    },
    [probeMap, browser],
  );
}
