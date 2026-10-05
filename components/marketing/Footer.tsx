"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { IconArrow, IconSpinner, IconTick } from "@/components/icons/Icons";
import { Halftone, PaintedLandscape } from "@/components/landing/Painted";
import { HERO_TOOLS, MORE_TOOLS, toolHref } from "@/lib/tools/registry";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, website }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not subscribe.");
      setState("done");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not subscribe.");
      setState("error");
    }
  }
  if (state === "done")
    return (
      <p className="inline-flex items-center gap-2 text-[14px] text-white">
        <IconTick className="h-4 w-4" /> You&apos;re on the list.
      </p>
    );
  return (
    <form onSubmit={submit} className="max-w-[340px]">
      <div className="flex items-center gap-1 rounded-[10px] bg-white/15 p-1 pl-3 backdrop-blur-md focus-within:bg-white/25">
        <label htmlFor="nl" className="sr-only">
          Email
        </label>
        <input id="nl" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Notes on AI search, monthly" className="h-9 min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/70" />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button type="submit" aria-label="Subscribe" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#faf8f2] text-ds-ink transition hover:bg-white">
          {state === "loading" ? <IconSpinner className="h-4 w-4 animate-spin" /> : <IconArrow className="h-4 w-4" />}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-[13px] text-white/90">{msg}</p>}
    </form>
  );
}

export function Footer() {
  const cols = [
    { title: "Tools", links: HERO_TOOLS.slice(0, 4).map((t) => [toolHref(t.slug), t.name]) },
    { title: "More", links: [...MORE_TOOLS.slice(0, 3).map((t) => [toolHref(t.slug), t.name]), ["/tools", "All tools"]] },
    { title: "Company", links: [["/#pricing", "Pricing"], ["/login", "Sign in"], ["/privacy", "Privacy"], ["/terms", "Terms"]] },
  ];
  return (
    <footer className="no-print relative min-h-[620px] overflow-hidden text-white sm:min-h-[680px]" data-print-hide>
      <PaintedLandscape />
      <Halftone className="opacity-60" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#e6e3d8] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#2c3322]/85 via-[#3b4430]/45 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[620px] max-w-[1200px] flex-col justify-end px-4 pb-8 sm:min-h-[680px] sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo inverted />
            <p className="mt-3 max-w-[260px] text-[14.5px] leading-6 text-white/85">Warm, honest SEO tools built for agencies and freelancers.</p>
            <div className="mt-5">
              <Newsletter />
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="font-serif text-[20px]">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-[14px] text-white/80 transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-white/20 pt-5 text-[12.5px] text-white/70 sm:flex-row">
          <p>© {new Date().getFullYear()} seowise. Built with care.</p>
          <p>Free tools, honest data.</p>
        </div>
      </div>
    </footer>
  );
}
