"use client";

import { useEffect, useState } from "react";
import { IconClose, IconDesktop, IconPhone, IconSpinner } from "@/components/icons/Icons";
import { IcBin, IcPlus } from "@/components/icons/Studio";
import { COUNTRIES, LANGUAGES } from "@/lib/keywords/types";
import type { RtProject } from "@/lib/rank-tracker/types";
import { darkButton, field, softButton } from "./bits";

interface City {
  code: number;
  name: string;
  type: string;
}

/** Create or edit a project: domain, market (country, optional city, language), device, competitors, alerts. */
export function ProjectForm({
  initial,
  competitorLimit,
  onSaved,
  onCancel,
  onDelete,
}: {
  initial: RtProject | null;
  competitorLimit: number;
  onSaved: (p: RtProject) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const initialCountry = COUNTRIES.find((c) => c.code === initial?.country) ?? COUNTRIES[0];
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [name, setName] = useState(initial && initial.name !== initial.domain ? initial.name : "");
  const [country, setCountry] = useState(initialCountry.code);
  const [language, setLanguage] = useState(initial?.language ?? initialCountry.lang);
  const [device, setDevice] = useState<"desktop" | "mobile">(initial?.device ?? "desktop");
  const [subdomains, setSubdomains] = useState(initial?.includeSubdomains ?? true);
  const [competitors, setCompetitors] = useState<string[]>(initial?.competitors ?? []);
  const [compInput, setCompInput] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(initial?.emailAlerts !== false);
  const [threshold, setThreshold] = useState(initial?.alertThreshold ?? 5);
  const isCity = Boolean(initial && initial.locationCode !== initialCountry.dataforseoLocation);
  const [city, setCity] = useState<City | null>(isCity && initial ? { code: initial.locationCode, name: initial.locationName, type: "City" } : null);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [cityState, setCityState] = useState<"idle" | "loading" | "error">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cityQuery.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setCityState("loading");
      try {
        const res = await fetch(`/api/rank-tracker/locations?country=${country}&q=${encodeURIComponent(cityQuery.trim())}`, { signal: ctrl.signal });
        const data = (await res.json()) as { locations?: City[]; error?: string };
        setCityResults(data.locations ?? []);
        setCityState(data.error ? "error" : "idle");
      } catch {
        if (!ctrl.signal.aborted) setCityState("error");
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [cityQuery, country]);

  function addCompetitor() {
    const v = compInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    if (!v || competitors.includes(v) || competitors.length >= competitorLimit) return;
    setCompetitors([...competitors, v]);
    setCompInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      domain,
      name,
      country,
      language,
      device,
      includeSubdomains: subdomains,
      competitors: compInput.trim() && competitors.length < competitorLimit ? [...competitors, compInput.trim()] : competitors,
      emailAlerts,
      alertThreshold: threshold,
      city: city ? { code: city.code, name: city.name } : null,
    };
    try {
      const res = await fetch(initial ? `/api/rank-tracker/projects/${initial.id}` : "/api/rank-tracker/projects", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { project?: RtProject; error?: string };
      if (!res.ok || !data.project) {
        setError(data.error ?? "Couldn't save the project.");
        return;
      }
      onSaved(data.project);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const marketChanged = initial && (initial.domain !== domain.trim().toLowerCase() || initial.country !== country || initial.device !== device || initial.language !== language);

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ds-ink-2">Your domain</span>
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className={field} required autoComplete="off" spellCheck={false} inputMode="url" />
        </label>
        <label className="flex items-start gap-2.5 text-[13.5px] text-ds-ink">
          <input type="checkbox" checked={subdomains} onChange={(e) => setSubdomains(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#d5855a]" />
          <span>
            Count subdomains too <span className="text-ds-ink-2">(blog.{domain || "example.com"}, shop.…)</span>
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ds-ink-2">Project name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={domain || "My site"} className={field} maxLength={60} />
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] text-ds-ink-2">Device</span>
          <div className="inline-flex gap-1 rounded-[12px] bg-white/40 p-1">
            {(["desktop", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                className={`inline-flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13.5px] capitalize transition-colors ${device === d ? "bg-white text-ds-ink shadow-sm" : "text-ds-ink-2 hover:text-ds-ink"}`}
              >
                {d === "desktop" ? <IconDesktop className="h-4 w-4" /> : <IconPhone className="h-4 w-4" />} {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ds-ink-2">Country</span>
            <select
              value={country}
              onChange={(e) => {
                const c = COUNTRIES.find((x) => x.code === e.target.value) ?? COUNTRIES[0];
                setCountry(c.code);
                setLanguage(c.lang);
                setCity(null);
                setCityResults([]);
              }}
              className={field}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ds-ink-2">Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={field}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.dfs}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="relative">
          <span className="mb-1.5 block text-[13px] text-ds-ink-2">City or region (optional)</span>
          {city ? (
            <span className="glass-inset inline-flex h-10 max-w-full items-center gap-2 rounded-[11px] pl-3 pr-1 text-[14px]">
              <span className="truncate">{city.name}</span>
              <button type="button" onClick={() => setCity(null)} aria-label="Remove city" className="flex h-8 w-8 items-center justify-center rounded-[9px] hover:bg-white/70">
                <IconClose className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <input value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} placeholder="Whole country, or search a city…" className={field} autoComplete="off" />
          )}
          {!city && cityQuery.trim().length >= 2 && (
            <div className="glass-strong absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-60 overflow-y-auto rounded-[14px] p-1.5">
              {cityState === "loading" && !cityResults.length ? (
                <p className="flex items-center gap-2 px-2 py-2 text-[13px] text-ds-ink-2">
                  <IconSpinner className="h-4 w-4 animate-spin" /> Searching…
                </p>
              ) : cityResults.length ? (
                cityResults.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setCityQuery("");
                      setCityResults([]);
                    }}
                    className="block w-full truncate rounded-[10px] px-2 py-1.5 text-left text-[13.5px] hover:bg-white/70"
                  >
                    {c.name} <span className="text-ds-ink-3">· {c.type}</span>
                  </button>
                ))
              ) : (
                <p className="px-2 py-2 text-[13px] text-ds-ink-2">{cityState === "error" ? "Location search is unavailable right now." : "No matching location."}</p>
              )}
            </div>
          )}
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] text-ds-ink-2">
            Competitors <span className="text-ds-ink-3">({competitors.length}/{competitorLimit})</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {competitors.map((c) => (
              <span key={c} className="glass-inset inline-flex h-8 items-center gap-1 rounded-full pl-3 pr-1 text-[13px]">
                {c}
                <button type="button" onClick={() => setCompetitors(competitors.filter((x) => x !== c))} aria-label={`Remove ${c}`} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/70">
                  <IcBin className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          {competitors.length < competitorLimit && (
            <div className="mt-2 flex gap-2">
              <input
                value={compInput}
                onChange={(e) => setCompInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCompetitor();
                  }
                }}
                placeholder="competitor.com"
                className={field}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={addCompetitor} className={softButton} aria-label="Add competitor">
                <IcPlus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px]">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="h-4 w-4 accent-[#d5855a]" />
            Email me notable changes
          </label>
          <label className="inline-flex items-center gap-2 text-ds-ink-2">
            Alert on moves of
            <input type="number" min={1} max={50} value={threshold} onChange={(e) => setThreshold(Math.max(1, Math.min(50, Number(e.target.value) || 5)))} className="glass-inset h-8 w-14 rounded-[9px] px-2 text-center text-ds-ink outline-none" />
            positions
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <button type="submit" disabled={saving} className={darkButton}>
          {saving && <IconSpinner className="h-4 w-4 animate-spin" />}
          {initial ? "Save changes" : "Create project"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={softButton}>
            Cancel
          </button>
        )}
        {onDelete && (
          <button type="button" onClick={onDelete} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[11px] px-3 text-[13.5px] text-ds-danger hover:bg-white/50">
            <IcBin className="h-4 w-4" /> Delete project
          </button>
        )}
        {marketChanged && <p className="w-full text-[12.5px] text-ds-warning">Changing the domain, market or device makes new checks incomparable with the history so far.</p>}
        {error && <p className="w-full text-[13.5px] text-ds-danger">{error}</p>}
      </div>
    </form>
  );
}
