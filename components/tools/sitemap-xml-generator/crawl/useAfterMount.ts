"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `fn` once, right after the first client render. For reading browser-only state
 * (localStorage, the query string) without a server/client hydration mismatch.
 */
export function useAfterMount(fn: () => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    const id = setTimeout(() => ref.current(), 0);
    return () => clearTimeout(id);
  }, []);
}
