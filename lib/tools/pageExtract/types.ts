import type { JsonParseError } from "@/lib/tools/validation/jsonParse";

/** Client-safe types for the structured extraction returned by POST /api/tools/fetch-page. */

export type JsonLdBlock =
  | { index: number; raw: string; truncated: boolean; ok: true; data: unknown; notes: string[] }
  | { index: number; raw: string; truncated: boolean; ok: false; error: JsonParseError; notes: string[] };

/** A microdata / RDFa item converted to a JSON-LD-like object ("@type", "@id", properties). */
export type SdItem = Record<string, unknown>;

export interface StructuredData {
  jsonLd: JsonLdBlock[];
  microdata: SdItem[];
  rdfa: SdItem[];
  /** Extraction-level problems (e.g. itemprop outside any itemscope). */
  warnings: string[];
}

export type ContentBlockType = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "li" | "blockquote" | "pre" | "td" | "caption" | "other";

export interface ContentBlock {
  type: ContentBlockType;
  text: string;
}

export interface ImageRef {
  src: string;
  alt: string | null;
  width?: number;
  height?: number;
}

/** Result of probing an image URL server-side (what a social crawler would see). */
export interface ImageProbe {
  /** The URL as found in the page (resolved to absolute). */
  requestedUrl: string;
  /** Final URL after redirects. */
  url: string;
  ok: boolean;
  status: number | null;
  contentType: string | null;
  /** From Content-Length / Content-Range when the server reports it. */
  bytes: number | null;
  width: number | null;
  height: number | null;
  format: string | null;
  error?: string;
}

export interface MetaTag {
  /** name="", property="", http-equiv="" or itemprop="" */
  key: string;
  attr: "name" | "property" | "http-equiv" | "itemprop" | "charset";
  content: string;
}

export interface PageExtract {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  redirects: string[];
  contentType: string;
  isHtml: boolean;
  fetchedAt: number;
  elapsedMs: number;
  bytes: number;
  /** HTML was larger than the fetch cap; only the first part was analysed. */
  truncated: boolean;

  lang: string | null;
  charset: string | null;
  viewport: string | null;
  /** Every <title> in the document, in order (more than one is a problem). */
  titles: string[];
  /** Every meta description, in order. */
  metaDescriptions: string[];
  /** Absolute canonical URLs, in order. */
  canonicals: string[];
  robots: { meta: string[]; googlebot: string[]; xRobotsTag: string | null };
  /** Every og:* / article:* / product:* / fb:* property, keyed by property, values in order. */
  og: Record<string, string[]>;
  /** Every twitter:* tag, keyed by name, values in order. */
  twitter: Record<string, string[]>;
  /** All meta tags (capped), for "show all tags" views. */
  metaTags: MetaTag[];
  siteName: string | null;
  favicon: string | null;
  appleTouchIcon: string | null;
  themeColor: string | null;
  hreflang: { lang: string; href: string }[];
  /** Published / modified dates found in meta tags or JSON-LD (raw strings). */
  dates: { published: string | null; modified: string | null };

  /** Headings outline for the whole document, in order. */
  headings: { level: number; text: string }[];
  content: {
    /** Where the main content came from. */
    source: "main" | "article" | "role-main" | "density" | "body";
    blocks: ContentBlock[];
    /** Main content as plain text, blocks separated by blank lines. */
    text: string;
    wordCount: number;
    images: ImageRef[];
  };
  links: { internal: number; external: number };

  structuredData: StructuredData;
  /** Present when the caller asked for social images to be probed. */
  imageProbes?: ImageProbe[];
}
