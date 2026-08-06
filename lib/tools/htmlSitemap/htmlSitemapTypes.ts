export interface HtmlSitemapEntry {
  url: string;
  /** Display text. Auto-derived from the URL path when left blank. */
  label: string;
  /** Free-text grouping key, e.g. "Blog", "Products". Blank = ungrouped ("More pages"). */
  section: string;
}

export function createEmptyEntry(): HtmlSitemapEntry {
  return { url: "", label: "", section: "" };
}

/** Derives a readable label from a URL's path when the user hasn't supplied one. */
export function deriveLabel(url: string): string {
  try {
    const { pathname } = new URL(url);
    const trimmed = pathname.replace(/\/+$/, "");
    if (!trimmed || trimmed === "") return "Home";
    const last = trimmed.split("/").filter(Boolean).pop() ?? "";
    return last
      .replace(/[-_]+/g, " ")
      .replace(/\.\w+$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || url;
  } catch {
    return url;
  }
}

export const UNGROUPED_SECTION_LABEL = "More pages";
