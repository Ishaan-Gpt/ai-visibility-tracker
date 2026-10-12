import { bareHost, isAbsoluteHttp, type TagSet } from "./fields";

/** What we know about an image, either from the server probe or from loading it in the browser. */
export interface ImageFacts {
  url: string;
  source: "probe" | "browser";
  state: "loading" | "ok" | "error";
  width: number | null;
  height: number | null;
  /** Only the server probe knows the file size. */
  bytes: number | null;
  contentType: string | null;
  format: string | null;
  httpStatus: number | null;
  error?: string;
}

export type ImageLookup = (url: string) => ImageFacts | undefined;

export type Platform = "facebook" | "linkedin" | "x" | "slack" | "whatsapp" | "discord";

export const PLATFORMS: { id: Platform; name: string }[] = [
  { id: "facebook", name: "Facebook" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "x", name: "X" },
  { id: "slack", name: "Slack" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "discord", name: "Discord" },
];

/** A value plus the tag chain the platform walked to get it. */
export interface Picked {
  value: string;
  /** Tag that supplied the value, or null when every tag in the chain was empty. */
  used: string | null;
  chain: string[];
}

export interface SocialCard {
  platform: Platform;
  title: Picked;
  description: Picked;
  image: Picked;
  facts?: ImageFacts;
  /** How the image is drawn: big banner, small thumbnail, or not at all. */
  layout: "large" | "small" | "none";
  /** Width / height of the large crop. */
  ratio: number;
  domain: string;
  siteName: string;
  showsTitle: boolean;
  showsDescription: boolean;
  /** X only: the effective card type. */
  cardType?: string;
  notes: string[];
}

function pick(chain: [string, string][]): Picked {
  const hit = chain.find(([, v]) => v.trim());
  return { value: hit?.[1].trim() ?? "", used: hit?.[0] ?? null, chain: chain.map(([k]) => k) };
}

/** Relative image URLs are ignored by every platform's crawler. */
function usableImage(p: Picked): Picked {
  if (p.value && !isAbsoluteHttp(p.value)) return { ...p, value: "", used: null };
  return p;
}

function dims(f?: ImageFacts) {
  return f && f.state === "ok" && f.width && f.height ? { w: f.width, h: f.height } : null;
}

export function resolveCards(t: TagSet, pageUrl: string, img: ImageLookup): SocialCard[] {
  const domain = bareHost(t.ogUrl || t.canonical || pageUrl);
  const siteName = t.siteName || domain;
  const T = (k: string, v: string): [string, string] => [k, v];

  const cards: SocialCard[] = [];

  // Facebook: og first, then the HTML title / description. Ignores twitter:*.
  {
    const image = usableImage(pick([T("og:image", t.ogImage)]));
    const facts = image.value ? img(image.value) : undefined;
    const d = dims(facts);
    const notes: string[] = [];
    let layout: SocialCard["layout"] = image.value ? "large" : "none";
    if (d && (d.w < 200 || d.h < 200)) {
      layout = "none";
      notes.push("Image is under 200×200, so Facebook drops it.");
    } else if (d && (d.w < 600 || d.h < 315)) {
      layout = "small";
      notes.push("Under 600×315, so Facebook shows a small square thumbnail instead of the banner.");
    }
    if (facts?.state === "error") layout = "none";
    cards.push({
      platform: "facebook",
      title: pick([T("og:title", t.ogTitle), T("<title>", t.title)]),
      description: pick([T("og:description", t.ogDescription), T("meta description", t.description)]),
      image,
      facts,
      layout,
      ratio: 1.91,
      domain,
      siteName,
      showsTitle: true,
      showsDescription: true,
      notes,
    });
  }

  // LinkedIn: og only (then <title>); the feed shows title + domain, no description.
  {
    const image = usableImage(pick([T("og:image", t.ogImage)]));
    const facts = image.value ? img(image.value) : undefined;
    const d = dims(facts);
    const notes = ["LinkedIn ignores twitter:* tags and no longer shows the description in the feed."];
    let layout: SocialCard["layout"] = image.value ? "large" : "none";
    if (d && d.w < 401) {
      layout = "small";
      notes.push("Under 401px wide, so LinkedIn shows a small thumbnail on the left.");
    }
    if (facts?.state === "error") layout = "none";
    cards.push({
      platform: "linkedin",
      title: pick([T("og:title", t.ogTitle), T("<title>", t.title)]),
      description: pick([T("og:description", t.ogDescription), T("meta description", t.description)]),
      image,
      facts,
      layout,
      ratio: 1.91,
      domain,
      siteName,
      showsTitle: true,
      showsDescription: false,
      notes,
    });
  }

  // X: twitter:* first, og:* as fallback. Large cards show only the image with a domain label.
  {
    const raw = t.twitterCard.trim().toLowerCase();
    const valid = ["summary", "summary_large_image", "app", "player"].includes(raw);
    const cardType = valid ? raw : "summary";
    const image = usableImage(pick([T("twitter:image", t.twitterImage), T("og:image", t.ogImage)]));
    const facts = image.value ? img(image.value) : undefined;
    const d = dims(facts);
    const notes: string[] = [];
    if (!raw) notes.push("No twitter:card, so X falls back to a small summary card.");
    else if (!valid) notes.push(`"${t.twitterCard}" is not a valid twitter:card, so X treats it as summary.`);
    if (cardType === "app" || cardType === "player") notes.push(`${cardType} cards need extra tags; shown here as a summary card.`);
    let layout: SocialCard["layout"] = image.value ? (cardType === "summary_large_image" ? "large" : "small") : "none";
    if (layout === "large") notes.push("Since late 2023 X shows large cards as the image with a domain label only; title and description are hidden.");
    if (layout === "large" && d && (d.w < 300 || d.h < 157)) {
      layout = "small";
      notes.push("Below the 300×157 minimum for large cards; X may fall back to a summary card.");
    }
    if (facts?.state === "error") layout = "none";
    cards.push({
      platform: "x",
      title: pick([T("twitter:title", t.twitterTitle), T("og:title", t.ogTitle)]),
      description: pick([T("twitter:description", t.twitterDescription), T("og:description", t.ogDescription)]),
      image,
      facts,
      layout,
      ratio: 2,
      domain,
      siteName,
      showsTitle: layout !== "large",
      showsDescription: layout !== "large",
      cardType,
      notes,
    });
  }

  // Slack: og, then twitter, then HTML. Large image for summary_large_image, thumbnail otherwise.
  {
    const image = usableImage(pick([T("og:image", t.ogImage), T("twitter:image", t.twitterImage)]));
    const facts = image.value ? img(image.value) : undefined;
    let layout: SocialCard["layout"] = image.value ? (t.twitterCard === "summary_large_image" ? "large" : "small") : "none";
    if (facts?.state === "error") layout = "none";
    cards.push({
      platform: "slack",
      title: pick([T("og:title", t.ogTitle), T("twitter:title", t.twitterTitle), T("<title>", t.title)]),
      description: pick([T("og:description", t.ogDescription), T("twitter:description", t.twitterDescription), T("meta description", t.description)]),
      image,
      facts,
      layout,
      ratio: 1.91,
      domain,
      siteName,
      showsTitle: true,
      showsDescription: true,
      notes: layout === "small" ? ["Slack shows a large image only when twitter:card is summary_large_image."] : [],
    });
  }

  // WhatsApp: og only. Big banner for wide images, small square thumbnail otherwise.
  {
    const image = usableImage(pick([T("og:image", t.ogImage)]));
    const facts = image.value ? img(image.value) : undefined;
    const d = dims(facts);
    const notes: string[] = [];
    let layout: SocialCard["layout"] = image.value ? "large" : "none";
    if (d && (d.w < 300 || d.w / d.h < 1.3)) {
      layout = "small";
      notes.push(d.w < 300 ? "Under 300px wide, so WhatsApp uses a small thumbnail." : "Not a wide image, so WhatsApp uses a small square thumbnail.");
    }
    if (facts?.bytes && facts.bytes > 600 * 1024) notes.push("Over ~600 KB: WhatsApp often skips the image entirely.");
    if (facts?.state === "error") layout = "none";
    cards.push({
      platform: "whatsapp",
      title: pick([T("og:title", t.ogTitle), T("<title>", t.title)]),
      description: pick([T("og:description", t.ogDescription), T("meta description", t.description)]),
      image,
      facts,
      layout,
      ratio: 1.91,
      domain,
      siteName,
      showsTitle: true,
      showsDescription: true,
      notes,
    });
  }

  // Discord: og, then twitter, then HTML. Border uses theme-color.
  {
    const image = usableImage(pick([T("og:image", t.ogImage), T("twitter:image", t.twitterImage)]));
    const facts = image.value ? img(image.value) : undefined;
    let layout: SocialCard["layout"] = image.value ? (t.twitterCard === "summary_large_image" ? "large" : "small") : "none";
    if (facts?.state === "error") layout = "none";
    const notes: string[] = [];
    if (!t.themeColor) notes.push("No theme-color, so the embed border is plain grey.");
    if (layout === "small") notes.push("Discord shows a big image only for twitter:card summary_large_image.");
    cards.push({
      platform: "discord",
      title: pick([T("og:title", t.ogTitle), T("twitter:title", t.twitterTitle), T("<title>", t.title)]),
      description: pick([T("og:description", t.ogDescription), T("twitter:description", t.twitterDescription), T("meta description", t.description)]),
      image,
      facts,
      layout,
      ratio: 1.91,
      domain,
      siteName,
      showsTitle: true,
      showsDescription: true,
      notes,
    });
  }

  return cards;
}
