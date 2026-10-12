/**
 * Rule-source citation. When Google's Search Central structured-data docs or
 * the schema.org vocabulary revise field requirements, update this string and
 * audit `schemaValidation.ts` and the RICH_RESULT_FEATURES below against the new
 * revision rather than guessing.
 *
 * Mapped to: schema.org vocabulary (current, fetched 2026-10-13) + Google Search Central
 * "Structured data markup that Google Search supports" gallery (last updated 2026-06-15),
 * each feature's documentation page and the Search Central documentation changelog,
 * as of the date below.
 */
export const RULES_SOURCE_VERSION = {
  schemaOrgVersion: "29.x (current)",
  googleDocsCheckedOn: "2026-10-13",
};

export type RuleWeight = "required" | "recommended";

export const WEIGHT_POINTS: Record<RuleWeight, number> = {
  required: 12,
  recommended: 5,
};

export type FieldRule = {
  label: string;
  weight: RuleWeight;
  passed: boolean;
  /** Short reason shown in the UI when the rule fails, e.g. why Google cares. */
  hint?: string;
};

/* ======================================================================
 * Google rich result features, for validating real markup (any shape).
 * ====================================================================== */

/**
 * - active: Google shows this rich result today.
 * - limited: valid, but only shown for some sites / regions / surfaces (see note).
 * - retired: Google no longer shows it; the markup is harmless but earns nothing in Search.
 */
export type FeatureAvailability = "active" | "limited" | "retired";

/** Graph-aware accessors supplied by the validator (arrays flattened, @id references resolved). */
export interface NodeAccess {
  /** Values at a dotted path ("offers.price"), arrays flattened, @id references resolved. */
  values(node: unknown, path: string): unknown[];
  /** At least one non-empty value at the path. */
  has(node: unknown, path: string): boolean;
  /** First string/number value at the path, as a string. */
  str(node: unknown, path: string): string | null;
  /** Normalised schema.org types of a node ("Product"). */
  types(node: unknown): string[];
  /** Node is (a subtype of) the given type. */
  isA(node: unknown, type: string): boolean;
  /** Where in the page the node sits, e.g. top-level, or the property it hangs off. */
  pageUrl?: string;
}

export interface RichResultFeature {
  id: string;
  name: string;
  docsUrl: string;
  availability: FeatureAvailability;
  /** Shown with every result for this feature (availability caveats, history). */
  note?: string;
  /** Only evaluate on the top-level item or a page's mainEntity (not on, say, a publisher Organization). */
  rootOnly?: boolean;
  matches(node: unknown, a: NodeAccess): boolean;
  evaluate(node: unknown, a: NodeAccess): FieldRule[];
}

const DOCS = "https://developers.google.com/search/docs/appearance/structured-data/";

const req = (label: string, passed: boolean, hint?: string): FieldRule => ({ label, weight: "required", passed, hint });
const rec = (label: string, passed: boolean, hint?: string): FieldRule => ({ label, weight: "recommended", passed, hint });

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const HAS_TZ = /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

function anyHas(a: NodeAccess, node: unknown, paths: string[]) {
  return paths.some((p) => a.has(node, p));
}

function numeric(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(String(v).replace(",", ".").replace(/%$/, ""));
  return Number.isFinite(n) ? n : null;
}

/** Rating checks shared by review snippets, products, recipes, apps… */
function ratingRules(a: NodeAccess, node: unknown, prefix: "aggregateRating" | "" = "aggregateRating"): FieldRule[] {
  const base = prefix ? `${prefix}.` : "";
  const value = numeric(a.str(node, `${base}ratingValue`));
  const best = numeric(a.str(node, `${base}bestRating`)) ?? 5;
  const worst = numeric(a.str(node, `${base}worstRating`)) ?? 1;
  const rawValue = a.str(node, `${base}ratingValue`) ?? "";
  const pct = rawValue.trim().endsWith("%");
  return [
    req(`${prefix ? "aggregateRating." : ""}ratingValue`, a.has(node, `${base}ratingValue`)),
    req(`${prefix ? "aggregateRating." : ""}ratingCount or reviewCount`, anyHas(a, node, [`${base}ratingCount`, `${base}reviewCount`]), "At least one of ratingCount or reviewCount is required."),
    ...(value !== null && !pct && (value > best || value < worst)
      ? [req(`ratingValue within ${worst}–${best}`, false, `ratingValue ${value} is outside the rating scale. Set bestRating / worstRating if you don't use 1–5.`)]
      : []),
  ];
}

function reviewRules(a: NodeAccess, review: unknown, standalone: boolean): FieldRule[] {
  const authorName = a.str(review, "author.name") ?? (a.values(review, "author").find((v) => typeof v === "string") as string | undefined) ?? null;
  const value = numeric(a.str(review, "reviewRating.ratingValue"));
  const best = numeric(a.str(review, "reviewRating.bestRating")) ?? 5;
  const worst = numeric(a.str(review, "reviewRating.worstRating")) ?? 1;
  return [
    req("author (with a name)", !!authorName),
    ...(authorName && authorName.length >= 100 ? [req("author name under 100 characters", false, "Longer names make the page ineligible for an author-based review snippet.")] : []),
    ...(standalone ? [req("itemReviewed (with a name)", a.has(review, "itemReviewed.name"), "Standalone reviews must say what is reviewed. Omit itemReviewed only when the review is nested in the item with the review property.")] : []),
    req("reviewRating.ratingValue", a.has(review, "reviewRating.ratingValue")),
    ...(value !== null && (value > best || value < worst) ? [req(`reviewRating within ${worst}–${best}`, false, "The rating is outside the scale. Set bestRating / worstRating if you don't use 1–5.")] : []),
    rec("datePublished", a.has(review, "datePublished")),
    rec("reviewRating.bestRating", a.has(review, "reviewRating.bestRating"), "If omitted, Google assumes 5."),
  ];
}

const REVIEWABLE = ["Book", "Course", "CreativeWorkSeason", "CreativeWorkSeries", "Episode", "Event", "Game", "HowTo", "LocalBusiness", "MediaObject", "Movie", "MusicPlaylist", "MusicRecording", "Organization", "Product", "Recipe", "SoftwareApplication"];

function offerPrice(a: NodeAccess, offer: unknown) {
  return a.str(offer, "price") ?? a.str(offer, "priceSpecification.price");
}

export const RICH_RESULT_FEATURES: RichResultFeature[] = [
  {
    id: "article",
    name: "Article",
    docsUrl: `${DOCS}article`,
    availability: "active",
    note: "Article markup has no required properties. Google uses it to better understand title, images, dates and authors.",
    matches: (n, a) => a.isA(n, "Article") && !a.isA(n, "SocialMediaPosting"),
    evaluate: (n, a) => {
      const published = a.str(n, "datePublished");
      const authorName = a.str(n, "author.name") ?? (a.values(n, "author").find((v) => typeof v === "string") as string | undefined) ?? null;
      return [
        rec("headline", a.has(n, "headline")),
        rec("image", a.has(n, "image"), "Use high-resolution images (Google recommends several aspect ratios: 16:9, 4:3 and 1:1)."),
        rec("datePublished", a.has(n, "datePublished")),
        ...(published && ISO_DATE_TIME.test(published) && !HAS_TZ.test(published) ? [rec("datePublished with timezone", false, "Google recommends including a timezone; otherwise it assumes Googlebot's.")] : []),
        rec("dateModified", a.has(n, "dateModified")),
        rec("author.name", !!authorName),
        ...(authorName && /^https?:\/\//.test(authorName) ? [rec("author.name is a name, not a URL", false, "Put only the author's name in author.name; use author.url for the link.")] : []),
        ...(authorName && /^(by|posted by|written by)\s/i.test(authorName) ? [rec("author.name without prefixes", false, 'Remove words like "By" or "Posted by" from the name.')] : []),
        rec("author.url (or sameAs)", anyHas(a, n, ["author.url", "author.sameAs"]), "A profile page URL helps Google disambiguate the author."),
        rec("author has @type Person or Organization", a.values(n, "author").every((au) => typeof au !== "object" || a.isA(au, "Person") || a.isA(au, "Organization"))),
      ];
    },
  },
  {
    id: "breadcrumb",
    name: "Breadcrumb",
    docsUrl: `${DOCS}breadcrumb`,
    availability: "active",
    note: "Since January 2025 Google shows breadcrumbs on desktop results only; mobile results show the site name and domain instead.",
    matches: (n, a) => a.isA(n, "BreadcrumbList"),
    evaluate: (n, a) => {
      const items = a.values(n, "itemListElement").filter((x) => x && typeof x === "object");
      const sorted = [...items].sort((x, y) => (numeric(a.str(x, "position")) ?? 0) - (numeric(a.str(y, "position")) ?? 0));
      const named = items.every((it) => a.has(it, "name") || a.has(it, "item.name"));
      const positioned = items.every((it) => numeric(a.str(it, "position")) !== null);
      // item must be a URL, or a Thing identified by @id (a nested object with only a name has no link).
      const hasLink = (it: unknown) => a.values(it, "item").some((v) => (typeof v === "string" && v.trim() !== "") || (!!v && typeof v === "object" && (typeof (v as Record<string, unknown>)["@id"] === "string" || a.has(v, "url"))));
      const linked = sorted.slice(0, -1).every(hasLink);
      return [
        req("itemListElement (ListItem)", items.length > 0),
        req("every ListItem has a name", items.length > 0 && named),
        req("every ListItem has a position", items.length > 0 && positioned),
        req("every ListItem except the last has item (URL)", items.length > 0 && linked, "The last crumb (the current page) may omit item; all others need it."),
        rec("at least two ListItems", items.length >= 2, "A one-level trail adds nothing over the URL."),
      ];
    },
  },
  {
    id: "carousel",
    name: "Carousel (ItemList)",
    docsUrl: `${DOCS}carousel`,
    availability: "active",
    rootOnly: true,
    note: "Only works combined with Recipe, Course list, Restaurant or Movie items, all of the same type.",
    matches: (n, a) => a.isA(n, "ItemList") && !a.isA(n, "BreadcrumbList") && !a.isA(n, "HowToSection") && !a.isA(n, "OfferCatalog"),
    evaluate: (n, a) => {
      const items = a.values(n, "itemListElement").filter((x) => x && typeof x === "object");
      const summary = items.every((it) => a.has(it, "url"));
      const allInOne = items.every((it) => a.has(it, "item"));
      const itemTypes = new Set(items.flatMap((it) => a.values(it, "item").flatMap((x) => a.types(x))));
      const supported = [...itemTypes].every((t) => ["Recipe", "Course", "Restaurant", "Movie"].some((s) => a.isA({ "@type": t }, s)));
      return [
        req("at least two ListItems", items.length >= 2),
        req("every ListItem has a position", items.length > 0 && items.every((it) => a.has(it, "position"))),
        req("every ListItem has url (summary page) or item (all-in-one page)", items.length > 0 && (summary || allInOne)),
        ...(allInOne && itemTypes.size ? [req("items are Recipe, Course, Restaurant or Movie", supported)] : []),
      ];
    },
  },
  {
    id: "course-list",
    name: "Course list",
    docsUrl: `${DOCS}course`,
    availability: "active",
    note: "Course list is shown in English. The separate Course info rich result was retired in September 2025.",
    matches: (n, a) => a.isA(n, "Course"),
    evaluate: (n, a) => {
      const desc = a.str(n, "description") ?? "";
      return [
        req("name", a.has(n, "name")),
        req("description", a.has(n, "description")),
        ...(desc.length > 60 ? [rec("description fits the 60-character display limit", false, "Longer descriptions are cut in the rich result.")] : []),
        rec("provider (Organization)", a.has(n, "provider")),
      ];
    },
  },
  {
    id: "dataset",
    name: "Dataset",
    docsUrl: `${DOCS}dataset`,
    availability: "limited",
    note: "Dataset markup is used by Google Dataset Search only, not by Google Search results (clarified November 2025).",
    matches: (n, a) => a.isA(n, "Dataset"),
    evaluate: (n, a) => {
      const desc = a.str(n, "description") ?? "";
      return [
        req("name", a.has(n, "name")),
        req("description (50–5000 characters)", desc.length >= 50 && desc.length <= 5000, desc ? `Currently ${desc.length} characters.` : undefined),
        rec("creator", a.has(n, "creator")),
        rec("license", a.has(n, "license")),
        rec("url", a.has(n, "url")),
        rec("identifier (e.g. DOI)", a.has(n, "identifier")),
        rec("keywords", a.has(n, "keywords")),
        rec("distribution.contentUrl", a.has(n, "distribution.contentUrl")),
        rec("temporalCoverage or spatialCoverage", anyHas(a, n, ["temporalCoverage", "spatialCoverage"])),
        rec("isAccessibleForFree", a.has(n, "isAccessibleForFree")),
      ];
    },
  },
  {
    id: "discussion-forum",
    name: "Discussion forum",
    docsUrl: `${DOCS}discussion-forum`,
    availability: "active",
    note: "For forum-style user content. If the thread is one question with answers, use QAPage instead.",
    matches: (n, a) => a.isA(n, "SocialMediaPosting"),
    evaluate: (n, a) => [
      req("author (with a name)", a.has(n, "author.name")),
      req("datePublished", a.has(n, "datePublished")),
      req("text, image or video", anyHas(a, n, ["text", "image", "video"])),
      rec("author.url", a.has(n, "author.url")),
      rec("headline", a.has(n, "headline")),
      rec("url", a.has(n, "url")),
      rec("comment (replies)", a.has(n, "comment")),
      rec("interactionStatistic", a.has(n, "interactionStatistic")),
      rec("dateModified", a.has(n, "dateModified")),
    ],
  },
  {
    id: "education-qa",
    name: "Education Q&A (flashcards)",
    docsUrl: `${DOCS}education-qa`,
    availability: "active",
    note: "Only for education-related searches, in English, Portuguese, Vietnamese and Spanish (Mexico).",
    matches: (n, a) => a.isA(n, "Quiz") && a.values(n, "hasPart").some((q) => /flashcard/i.test(a.str(q, "eduQuestionType") ?? "")),
    evaluate: (n, a) => {
      const qs = a.values(n, "hasPart").filter((q) => q && typeof q === "object");
      return [
        req("hasPart (Question)", qs.length > 0),
        req('every Question has eduQuestionType "Flashcard"', qs.length > 0 && qs.every((q) => (a.str(q, "eduQuestionType") ?? "") === "Flashcard")),
        req("every Question has text", qs.length > 0 && qs.every((q) => a.has(q, "text"))),
        req("every Question has one acceptedAnswer with text", qs.length > 0 && qs.every((q) => a.values(q, "acceptedAnswer").length === 1 && a.has(q, "acceptedAnswer.text"))),
        rec("about (the concept)", a.has(n, "about")),
        rec("educationalAlignment", a.has(n, "educationalAlignment")),
      ];
    },
  },
  {
    id: "practice-problem",
    name: "Practice problems",
    docsUrl: "https://developers.google.com/search/updates",
    availability: "retired",
    note: "Practice problem rich results were removed from Google Search (documentation removed January 2026).",
    matches: (n, a) => a.isA(n, "Quiz") && a.values(n, "hasPart").some((q) => /multiple choice|checkbox/i.test(a.str(q, "eduQuestionType") ?? "")),
    evaluate: () => [],
  },
  {
    id: "employer-rating",
    name: "Employer aggregate rating",
    docsUrl: `${DOCS}employer-rating`,
    availability: "active",
    matches: (n, a) => a.isA(n, "EmployerAggregateRating"),
    evaluate: (n, a) => [
      req("itemReviewed (Organization with a name)", a.has(n, "itemReviewed.name")),
      ...ratingRules(a, n, ""),
      rec("bestRating", a.has(n, "bestRating"), "If omitted, 5 is assumed."),
      rec("worstRating", a.has(n, "worstRating"), "If omitted, 1 is assumed."),
    ],
  },
  {
    id: "event",
    name: "Event",
    docsUrl: `${DOCS}event`,
    availability: "active",
    note: "Since June 2025 events must be held at a physical location and bookable by the public; online-only events aren't eligible.",
    matches: (n, a) => a.isA(n, "Event"),
    evaluate: (n, a) => {
      const start = a.str(n, "startDate");
      const locations = a.values(n, "location");
      const physical = locations.some((l) => l && typeof l === "object" && !a.isA(l, "VirtualLocation") && (a.has(l, "address") || a.has(l, "name")));
      const status = a.str(n, "eventStatus") ?? "";
      return [
        req("name", a.has(n, "name")),
        req("startDate", a.has(n, "startDate")),
        ...(start && /^\d{4}-\d{2}-\d{2}T/.test(start) && !HAS_TZ.test(start) ? [rec("startDate includes a timezone offset", false, "Without an offset Google uses the event location's timezone.")] : []),
        req("location (Place)", locations.length > 0 && physical, locations.some((l) => a.isA(l, "VirtualLocation")) ? "Online-only (VirtualLocation) events are no longer eligible." : undefined),
        req("location.address", a.has(n, "location.address")),
        rec("location.name", a.has(n, "location.name")),
        rec("description", a.has(n, "description")),
        rec("endDate", a.has(n, "endDate")),
        rec("eventStatus", a.has(n, "eventStatus")),
        ...(/Rescheduled/.test(status) ? [rec("previousStartDate (rescheduled event)", a.has(n, "previousStartDate"))] : []),
        rec("image", a.has(n, "image")),
        rec("offers (price, priceCurrency, availability, url)", ["offers.price", "offers.priceCurrency", "offers.availability", "offers.url"].every((p) => a.has(n, p))),
        rec("organizer (name, url)", a.has(n, "organizer.name") && a.has(n, "organizer.url")),
        rec("performer", a.has(n, "performer")),
      ];
    },
  },
  {
    id: "image-metadata",
    name: "Image metadata",
    docsUrl: `${DOCS}image-license-metadata`,
    availability: "active",
    matches: (n, a) => a.isA(n, "ImageObject") && anyHas(a, n, ["license", "acquireLicensePage", "creditText", "copyrightNotice", "creator"]),
    evaluate: (n, a) => [
      req("contentUrl", a.has(n, "contentUrl")),
      req("creator, creditText, copyrightNotice or license", anyHas(a, n, ["creator", "creditText", "copyrightNotice", "license"])),
      rec("license", a.has(n, "license")),
      rec("acquireLicensePage", a.has(n, "acquireLicensePage")),
      rec("creator.name", a.has(n, "creator.name")),
      rec("creditText", a.has(n, "creditText")),
      rec("copyrightNotice", a.has(n, "copyrightNotice")),
    ],
  },
  {
    id: "job-posting",
    name: "Job posting",
    docsUrl: `${DOCS}job-posting`,
    availability: "active",
    matches: (n, a) => a.isA(n, "JobPosting"),
    evaluate: (n, a) => {
      const remote = (a.str(n, "jobLocationType") ?? "").toUpperCase() === "TELECOMMUTE";
      const validThrough = a.str(n, "validThrough");
      const expired = validThrough ? Date.parse(validThrough) < Date.now() : false;
      return [
        req("title", a.has(n, "title")),
        req("description", a.has(n, "description")),
        req("datePosted", a.has(n, "datePosted")),
        req("hiringOrganization (with a name)", a.has(n, "hiringOrganization.name") || a.values(n, "hiringOrganization").some((v) => typeof v === "string")),
        req(remote ? "jobLocation or applicantLocationRequirements (remote job)" : "jobLocation.address", remote ? anyHas(a, n, ["jobLocation", "applicantLocationRequirements"]) : a.has(n, "jobLocation.address"), "Use jobLocationType TELECOMMUTE plus applicantLocationRequirements for fully remote roles."),
        ...(!remote && a.has(n, "jobLocation.address") ? [rec("jobLocation.address.addressCountry", a.has(n, "jobLocation.address.addressCountry"))] : []),
        ...(remote ? [rec("applicantLocationRequirements", a.has(n, "applicantLocationRequirements"))] : []),
        rec("validThrough", !!validThrough, "Required if the posting expires."),
        ...(expired ? [req("posting not expired", false, `validThrough (${validThrough}) is in the past. Remove the page or the markup for closed jobs.`)] : []),
        rec("baseSalary (currency + value)", a.has(n, "baseSalary.currency") && a.has(n, "baseSalary.value")),
        rec("employmentType", a.has(n, "employmentType")),
        rec("identifier", a.has(n, "identifier")),
        rec("directApply", a.has(n, "directApply")),
      ];
    },
  },
  {
    id: "local-business",
    name: "Local business",
    docsUrl: `${DOCS}local-business`,
    availability: "active",
    rootOnly: true,
    note: "Business details feed the knowledge panel alongside your Google Business Profile. Ratings about your own business (self-serving reviews) aren't shown.",
    matches: (n, a) => a.isA(n, "LocalBusiness"),
    evaluate: (n, a) => {
      const food = a.isA(n, "FoodEstablishment");
      const lat = a.str(n, "geo.latitude");
      const decimals = lat ? (lat.split(".")[1] ?? "").length : 0;
      const price = a.str(n, "priceRange") ?? "";
      return [
        req("name", a.has(n, "name")),
        req("address (PostalAddress)", a.has(n, "address")),
        rec("address.streetAddress", a.has(n, "address.streetAddress")),
        rec("address.addressLocality", a.has(n, "address.addressLocality")),
        rec("address.postalCode", a.has(n, "address.postalCode")),
        rec("address.addressCountry", a.has(n, "address.addressCountry")),
        rec("geo (latitude + longitude)", a.has(n, "geo.latitude") && a.has(n, "geo.longitude")),
        ...(lat && decimals < 5 ? [rec("geo precision of 5+ decimals", false)] : []),
        rec("openingHoursSpecification", a.has(n, "openingHoursSpecification") || a.has(n, "openingHours")),
        rec("telephone", a.has(n, "telephone")),
        rec("url", a.has(n, "url")),
        rec("image", a.has(n, "image")),
        rec("priceRange", a.has(n, "priceRange")),
        ...(price.length >= 100 ? [req("priceRange under 100 characters", false)] : []),
        ...(food ? [rec("servesCuisine", a.has(n, "servesCuisine")), rec("menu", a.has(n, "menu") || a.has(n, "hasMenu"))] : []),
        rec("a specific subtype (not plain LocalBusiness)", a.types(n).some((t) => t !== "LocalBusiness"), "Use the most specific type, e.g. Restaurant, Dentist, HardwareStore."),
      ];
    },
  },
  {
    id: "math-solver",
    name: "Math solver",
    docsUrl: `${DOCS}math-solvers`,
    availability: "active",
    matches: (n, a) => a.isA(n, "MathSolver"),
    evaluate: (n, a) => [
      req("url", a.has(n, "url")),
      req("usageInfo", a.has(n, "usageInfo")),
      req("potentialAction (SolveMathAction) with target", a.has(n, "potentialAction.target")),
      req("potentialAction.mathExpression-input", a.has(n, "potentialAction.mathExpression-input")),
      rec("inLanguage", a.has(n, "inLanguage")),
      rec("assesses (problem types)", a.has(n, "assesses")),
    ],
  },
  {
    id: "movie",
    name: "Movie carousel",
    docsUrl: `${DOCS}movie`,
    availability: "active",
    note: "Shown as a carousel for movie list queries; combine with an ItemList on list pages.",
    matches: (n, a) => a.isA(n, "Movie"),
    evaluate: (n, a) => [
      req("name", a.has(n, "name")),
      req("image", a.has(n, "image"), "Use a 6:9 aspect ratio image."),
      rec("aggregateRating", a.has(n, "aggregateRating")),
      rec("dateCreated", a.has(n, "dateCreated")),
      rec("director", a.has(n, "director")),
      rec("review", a.has(n, "review")),
    ],
  },
  {
    id: "organization",
    name: "Organization",
    docsUrl: `${DOCS}organization`,
    availability: "active",
    rootOnly: true,
    note: "No required properties. Helps Google show your logo, identifiers and details in knowledge panels and attribution.",
    matches: (n, a) => a.isA(n, "Organization") && !a.isA(n, "LocalBusiness"),
    evaluate: (n, a) => [
      rec("name", a.has(n, "name")),
      rec("url", a.has(n, "url")),
      rec("logo", a.has(n, "logo"), "At least 112×112px, crawlable, and looks right on a white background."),
      rec("sameAs (official profiles)", a.has(n, "sameAs")),
      rec("description", a.has(n, "description")),
      rec("address", a.has(n, "address")),
      rec("contactPoint, telephone or email", anyHas(a, n, ["contactPoint", "telephone", "email"])),
      rec("legalName", a.has(n, "legalName")),
      rec("an identifier (vatID, taxID, duns, leiCode, iso6523Code, naics or globalLocationNumber)", anyHas(a, n, ["vatID", "taxID", "duns", "leiCode", "iso6523Code", "naics", "globalLocationNumber"])),
      rec("foundingDate", a.has(n, "foundingDate")),
    ],
  },
  {
    id: "product-snippet",
    name: "Product snippet",
    docsUrl: `${DOCS}product-snippet`,
    availability: "active",
    note: "Product snippets show ratings, price and availability for pages about a product (including review pages).",
    matches: (n, a) => a.isA(n, "Product") && !a.isA(n, "ProductGroup"),
    evaluate: (n, a) => {
      const offers = a.values(n, "offers").filter((o) => o && typeof o === "object");
      const aggregateOffers = offers.filter((o) => a.isA(o, "AggregateOffer"));
      const plainOffers = offers.filter((o) => !a.isA(o, "AggregateOffer"));
      const reviews = a.values(n, "review").filter((r) => r && typeof r === "object");
      return [
        req("name", a.has(n, "name")),
        req("review, aggregateRating or offers", anyHas(a, n, ["review", "aggregateRating", "offers"])),
        ...(a.has(n, "aggregateRating") ? ratingRules(a, n) : []),
        ...(reviews.length ? reviewRules(a, reviews[0], false).filter((r) => r.weight === "required").map((r) => ({ ...r, label: `review: ${r.label}` })) : []),
        ...(plainOffers.length ? [req("offers.price (a number)", plainOffers.every((o) => numeric(offerPrice(a, o)) !== null), "A plain number such as 19.99, with the currency in priceCurrency.")] : []),
        ...(aggregateOffers.length ? [req("AggregateOffer lowPrice + priceCurrency", aggregateOffers.every((o) => a.has(o, "lowPrice") && a.has(o, "priceCurrency")))] : []),
        rec("aggregateRating", a.has(n, "aggregateRating")),
        rec("review", reviews.length > 0),
        rec("offers", offers.length > 0),
        ...(plainOffers.length ? [rec("offers.priceCurrency", plainOffers.every((o) => a.has(o, "priceCurrency") || a.has(o, "priceSpecification.priceCurrency"))), rec("offers.availability", plainOffers.every((o) => a.has(o, "availability")))] : []),
      ];
    },
  },
  {
    id: "merchant-listing",
    name: "Merchant listing",
    docsUrl: `${DOCS}merchant-listing`,
    availability: "active",
    note: "For pages where shoppers can buy the product. Shipping and return policies can also be set at Organization level or in Merchant Center.",
    matches: (n, a) => a.isA(n, "Product") && !a.isA(n, "ProductGroup") && a.has(n, "offers"),
    evaluate: (n, a) => {
      const offers = a.values(n, "offers").filter((o) => o && typeof o === "object");
      const plain = offers.filter((o) => !a.isA(o, "AggregateOffer"));
      const prices = plain.map((o) => numeric(offerPrice(a, o)));
      return [
        req("name", a.has(n, "name")),
        req("image", a.has(n, "image")),
        req("offers is an Offer (AggregateOffer isn't supported here)", plain.length > 0),
        req("offers.price (a number)", plain.length > 0 && prices.every((p) => p !== null), "A plain number such as 19.99, with the currency in priceCurrency."),
        ...(prices.some((p) => p !== null && p <= 0) ? [req("offers.price greater than zero", false, "Merchant listings need a positive price.")] : []),
        req("offers.priceCurrency", plain.length > 0 && plain.every((o) => a.has(o, "priceCurrency") || a.has(o, "priceSpecification.priceCurrency"))),
        rec("offers.availability", plain.length > 0 && plain.every((o) => a.has(o, "availability"))),
        rec("offers.itemCondition", plain.some((o) => a.has(o, "itemCondition"))),
        rec("offers.shippingDetails (or an Organization shipping policy)", plain.some((o) => a.has(o, "shippingDetails"))),
        rec("offers.hasMerchantReturnPolicy (or an Organization return policy)", plain.some((o) => a.has(o, "hasMerchantReturnPolicy"))),
        rec("brand.name", a.has(n, "brand.name")),
        rec("gtin / mpn / isbn", anyHas(a, n, ["gtin", "gtin8", "gtin12", "gtin13", "gtin14", "isbn", "mpn"])),
        rec("sku", a.has(n, "sku")),
        rec("description", a.has(n, "description")),
        rec("aggregateRating or review", anyHas(a, n, ["aggregateRating", "review"])),
      ];
    },
  },
  {
    id: "product-variants",
    name: "Product variants",
    docsUrl: `${DOCS}product-variants`,
    availability: "active",
    matches: (n, a) => a.isA(n, "ProductGroup"),
    evaluate: (n, a) => {
      const variants = a.values(n, "hasVariant").filter((v) => v && typeof v === "object");
      // Multi-page variant groups may list variants that live on other pages by url only; that's allowed.
      const stub = (v: unknown) => a.has(v, "url") && !a.has(v, "name") && !a.has(v, "offers");
      const onPage = variants.filter((v) => !stub(v));
      return [
        req("name", a.has(n, "name")),
        rec("hasVariant (Product variants)", variants.length > 0),
        rec("productGroupID", a.has(n, "productGroupID")),
        rec("variesBy", a.has(n, "variesBy")),
        rec("brand.name", a.has(n, "brand.name")),
        rec("description", a.has(n, "description")),
        rec("url", a.has(n, "url")),
        ...(onPage.length
          ? [
              rec(
                "every on-page variant has name, image and offers.price",
                onPage.every((v) => a.has(v, "name") && a.has(v, "image") && a.has(v, "offers.price")),
                `Each variant is evaluated like a merchant listing.${variants.length > onPage.length ? ` ${variants.length - onPage.length} variants are url-only references to other pages, which is fine.` : ""}`,
              ),
            ]
          : []),
      ];
    },
  },
  {
    id: "profile-page",
    name: "Profile page",
    docsUrl: `${DOCS}profile-page`,
    availability: "active",
    matches: (n, a) => a.isA(n, "ProfilePage"),
    evaluate: (n, a) => {
      const main = a.values(n, "mainEntity").filter((m) => m && typeof m === "object");
      return [
        req("mainEntity (Person or Organization)", main.some((m) => a.isA(m, "Person") || a.isA(m, "Organization"))),
        req("mainEntity.name", a.has(n, "mainEntity.name")),
        rec("dateCreated", a.has(n, "dateCreated")),
        rec("dateModified", a.has(n, "dateModified")),
        rec("mainEntity.alternateName", a.has(n, "mainEntity.alternateName")),
        rec("mainEntity.identifier", a.has(n, "mainEntity.identifier")),
        rec("mainEntity.description", a.has(n, "mainEntity.description")),
        rec("mainEntity.image", a.has(n, "mainEntity.image")),
        rec("mainEntity.sameAs", a.has(n, "mainEntity.sameAs")),
        rec("mainEntity.interactionStatistic", a.has(n, "mainEntity.interactionStatistic")),
      ];
    },
  },
  {
    id: "qa",
    name: "Q&A",
    docsUrl: `${DOCS}qapage`,
    availability: "active",
    note: "For pages where users ask one question and others answer it. Content written by the site itself was FAQ, which Google no longer shows.",
    matches: (n, a) => a.isA(n, "QAPage"),
    evaluate: (n, a) => {
      const q = a.values(n, "mainEntity").find((m) => a.isA(m, "Question"));
      const answers = q ? [...a.values(q, "acceptedAnswer"), ...a.values(q, "suggestedAnswer")] : [];
      return [
        req("mainEntity (Question)", !!q),
        req("Question.name", !!q && a.has(q, "name")),
        req("Question.answerCount", !!q && a.has(q, "answerCount")),
        req("acceptedAnswer or suggestedAnswer", answers.length > 0),
        req("every Answer has text", answers.length > 0 && answers.every((ans) => a.has(ans, "text"))),
        rec("Question.text", !!q && a.has(q, "text")),
        rec("Question.author (name + url)", !!q && a.has(q, "author.name") && a.has(q, "author.url")),
        rec("Question.datePublished", !!q && a.has(q, "datePublished")),
        rec("Answer.author", answers.length > 0 && answers.every((ans) => a.has(ans, "author"))),
        rec("Answer.datePublished", answers.length > 0 && answers.every((ans) => a.has(ans, "datePublished"))),
        rec("Answer.upvoteCount", answers.length > 0 && answers.every((ans) => a.has(ans, "upvoteCount"))),
        rec("Answer.url", answers.length > 0 && answers.every((ans) => a.has(ans, "url"))),
      ];
    },
  },
  {
    id: "recipe",
    name: "Recipe",
    docsUrl: `${DOCS}recipe`,
    availability: "active",
    matches: (n, a) => a.isA(n, "Recipe"),
    evaluate: (n, a) => [
      req("name", a.has(n, "name")),
      req("image", a.has(n, "image")),
      ...(a.has(n, "aggregateRating") ? ratingRules(a, n) : [rec("aggregateRating", false)]),
      rec("author", a.has(n, "author")),
      rec("description", a.has(n, "description")),
      rec("datePublished", a.has(n, "datePublished")),
      rec("prepTime + cookTime (or totalTime)", (a.has(n, "prepTime") && a.has(n, "cookTime")) || a.has(n, "totalTime"), "cookTime and prepTime should be used together."),
      rec("recipeIngredient", a.has(n, "recipeIngredient")),
      rec("recipeInstructions", a.has(n, "recipeInstructions")),
      rec("recipeYield", a.has(n, "recipeYield")),
      rec("nutrition.calories", a.has(n, "nutrition.calories")),
      rec("recipeCategory", a.has(n, "recipeCategory")),
      rec("recipeCuisine", a.has(n, "recipeCuisine")),
      rec("keywords", a.has(n, "keywords")),
      rec("video", a.has(n, "video")),
    ],
  },
  {
    id: "review-snippet",
    name: "Review snippet",
    docsUrl: `${DOCS}review-snippet`,
    availability: "active",
    note: "Reviews of your own business or organization (self-serving) aren't shown. Don't mix several ways of saying what is reviewed.",
    matches: (n, a) => {
      if (a.isA(n, "EmployerAggregateRating")) return false;
      if (a.isA(n, "Review") || a.isA(n, "AggregateRating")) return true;
      // Rated items whose own feature doesn't already cover ratings.
      const covered = ["Product", "Recipe", "SoftwareApplication", "Movie", "Course", "LocalBusiness"];
      return REVIEWABLE.some((t) => a.isA(n, t)) && !covered.some((t) => a.isA(n, t)) && anyHas(a, n, ["review", "aggregateRating"]);
    },
    evaluate: (n, a) => {
      if (a.isA(n, "Review")) {
        const reviewed = a.values(n, "itemReviewed");
        const validType = reviewed.some((it) => REVIEWABLE.some((t) => a.isA(it, t)));
        return [...reviewRules(a, n, true), ...(reviewed.length ? [req(`itemReviewed is a supported type`, validType, `Supported: ${REVIEWABLE.join(", ")}.`)] : [])];
      }
      if (a.isA(n, "AggregateRating")) {
        return [req("itemReviewed (with a name)", a.has(n, "itemReviewed.name")), ...ratingRules(a, n, "")];
      }
      const reviews = a.values(n, "review").filter((r) => r && typeof r === "object");
      return [
        req("name of the reviewed item", a.has(n, "name")),
        ...(a.has(n, "aggregateRating") ? ratingRules(a, n) : []),
        ...(reviews.length ? reviewRules(a, reviews[0], false) : []),
      ];
    },
  },
  {
    id: "software-app",
    name: "Software app",
    docsUrl: `${DOCS}software-app`,
    availability: "active",
    matches: (n, a) => a.isA(n, "SoftwareApplication"),
    evaluate: (n, a) => [
      req("name", a.has(n, "name")),
      req("offers.price (use 0 for free apps)", a.has(n, "offers.price")),
      req("aggregateRating or review", anyHas(a, n, ["aggregateRating", "review"])),
      ...(a.has(n, "aggregateRating") ? ratingRules(a, n) : []),
      rec("applicationCategory", a.has(n, "applicationCategory"), 'e.g. "GameApplication", "BusinessApplication".'),
      rec("operatingSystem", a.has(n, "operatingSystem")),
    ],
  },
  {
    id: "speakable",
    name: "Speakable",
    docsUrl: `${DOCS}speakable`,
    availability: "limited",
    note: "Beta: news publishers, English, US users on Google Assistant devices.",
    matches: (n, a) => a.has(n, "speakable"),
    evaluate: (n, a) => [req("speakable.cssSelector or speakable.xPath", anyHas(a, n, ["speakable.cssSelector", "speakable.xPath"]))],
  },
  {
    id: "paywalled-content",
    name: "Subscription and paywalled content",
    docsUrl: `${DOCS}paywalled-content`,
    availability: "active",
    note: "Not a visual rich result: it tells Google the hidden section is a paywall, not cloaking.",
    matches: (n, a) => /^(false|https?:\/\/schema\.org\/false)$/i.test(a.str(n, "isAccessibleForFree") ?? ""),
    evaluate: (n, a) => [
      req("isAccessibleForFree: false", true),
      rec("hasPart (WebPageElement) with cssSelector", a.has(n, "hasPart.cssSelector")),
      rec("hasPart.isAccessibleForFree: false", /false/i.test(a.str(n, "hasPart.isAccessibleForFree") ?? "")),
    ],
  },
  {
    id: "vacation-rental",
    name: "Vacation rental",
    docsUrl: `${DOCS}vacation-rental`,
    availability: "limited",
    note: "Only for sites that meet Google's eligibility criteria and complete a Hotel Center integration. Check Google's docs before investing.",
    matches: (n, a) => a.isA(n, "VacationRental"),
    evaluate: (n, a) => {
      const images = a.values(n, "image").length;
      return [
        req("name", a.has(n, "name")),
        req("identifier", a.has(n, "identifier")),
        req("image", images > 0),
        rec("at least 8 images", images >= 8),
        req("latitude + longitude (or geo)", (a.has(n, "latitude") && a.has(n, "longitude")) || (a.has(n, "geo.latitude") && a.has(n, "geo.longitude"))),
        req("containsPlace (Accommodation)", a.has(n, "containsPlace")),
        req("containsPlace.occupancy.value", a.has(n, "containsPlace.occupancy.value")),
        rec("address", a.has(n, "address")),
        rec("aggregateRating", a.has(n, "aggregateRating")),
        rec("checkinTime + checkoutTime", a.has(n, "checkinTime") && a.has(n, "checkoutTime")),
        rec("description", a.has(n, "description")),
        rec("containsPlace.amenityFeature", a.has(n, "containsPlace.amenityFeature")),
        rec("containsPlace.numberOfBedrooms", a.has(n, "containsPlace.numberOfBedrooms")),
      ];
    },
  },
  {
    id: "video",
    name: "Video",
    docsUrl: `${DOCS}video`,
    availability: "active",
    matches: (n, a) => a.isA(n, "VideoObject"),
    evaluate: (n, a) => {
      const upload = a.str(n, "uploadDate");
      const live = a.values(n, "publication").some((p) => /true/i.test(a.str(p, "isLiveBroadcast") ?? ""));
      return [
        req("name", a.has(n, "name")),
        req("thumbnailUrl", a.has(n, "thumbnailUrl")),
        req("uploadDate", a.has(n, "uploadDate")),
        ...(upload && /T/.test(upload) && !HAS_TZ.test(upload) ? [rec("uploadDate includes a timezone", false, "Without a timezone Google assumes Googlebot's.")] : []),
        rec("contentUrl or embedUrl", anyHas(a, n, ["contentUrl", "embedUrl"]), "Google needs to fetch the video file to show video features."),
        rec("description", a.has(n, "description")),
        rec("duration (ISO 8601)", a.has(n, "duration")),
        rec("creator or author", anyHas(a, n, ["creator", "author"])),
        rec("interactionStatistic", a.has(n, "interactionStatistic")),
        rec("key moments (hasPart Clip or SeekToAction)", anyHas(a, n, ["hasPart", "potentialAction"])),
        ...(live ? [req("publication startDate + endDate (live)", a.has(n, "publication.startDate") && a.has(n, "publication.endDate"))] : []),
      ];
    },
  },
  {
    id: "site-name",
    name: "Site name",
    docsUrl: "https://developers.google.com/search/docs/appearance/site-names",
    availability: "active",
    rootOnly: true,
    note: "Read from the home page only. The sitelinks search box (SearchAction) was retired in November 2024; it is harmless to keep.",
    matches: (n, a) => a.isA(n, "WebSite"),
    evaluate: (n, a) => [req("name", a.has(n, "name")), req("url", a.has(n, "url")), rec("alternateName", a.has(n, "alternateName"))],
  },
  {
    id: "faq",
    name: "FAQ",
    docsUrl: "https://developers.google.com/search/updates",
    availability: "retired",
    note: "Google stopped showing FAQ rich results on May 7, 2026 (after limiting them to authoritative government and health sites in 2023). Valid FAQPage markup still helps other systems understand the page.",
    matches: (n, a) => a.isA(n, "FAQPage"),
    evaluate: (n, a) => {
      const qs = a.values(n, "mainEntity").filter((q) => q && typeof q === "object");
      return [
        req("mainEntity (Question)", qs.length > 0),
        req("every Question has a name", qs.length > 0 && qs.every((q) => a.has(q, "name"))),
        req("every Question has acceptedAnswer.text", qs.length > 0 && qs.every((q) => a.has(q, "acceptedAnswer.text"))),
      ];
    },
  },
  {
    id: "howto",
    name: "How-to",
    docsUrl: "https://developers.google.com/search/updates",
    availability: "retired",
    note: "How-to rich results were removed from Google Search on desktop and mobile in September 2023.",
    matches: (n, a) => a.isA(n, "HowTo") && !a.isA(n, "Recipe"),
    evaluate: (n, a) => [req("name", a.has(n, "name")), req("step", a.has(n, "step"))],
  },
  {
    id: "retired-misc",
    name: "Retired feature",
    docsUrl: "https://developers.google.com/search/updates",
    availability: "retired",
    note: "Google retired the rich results for Course info, Estimated salary, Learning video, Special announcement and Vehicle listing (documentation removed September 2025) and announced it is phasing out ClaimReview fact checks.",
    matches: (n, a) => a.isA(n, "SpecialAnnouncement") || a.isA(n, "ClaimReview") || a.isA(n, "Occupation") || a.isA(n, "OccupationAggregationByEmployer") || ((a.isA(n, "Vehicle") || a.isA(n, "Car")) && a.has(n, "offers")),
    evaluate: () => [],
  },
];

export type FeatureVerdict = "eligible" | "warnings" | "invalid" | "not-shown";

export interface FeatureEvaluation {
  feature: RichResultFeature;
  rules: FieldRule[];
  verdict: FeatureVerdict;
}

/** Evaluates every feature that applies to a node. */
export function evaluateRichResults(node: unknown, a: NodeAccess, opts: { root: boolean }): FeatureEvaluation[] {
  const out: FeatureEvaluation[] = [];
  for (const feature of RICH_RESULT_FEATURES) {
    if (feature.rootOnly && !opts.root) continue;
    if (!feature.matches(node, a)) continue;
    const rules = feature.evaluate(node, a);
    const requiredOk = rules.filter((r) => r.weight === "required").every((r) => r.passed);
    const recommendedOk = rules.filter((r) => r.weight === "recommended").every((r) => r.passed);
    const verdict: FeatureVerdict = feature.availability === "retired" ? "not-shown" : !requiredOk ? "invalid" : recommendedOk ? "eligible" : "warnings";
    out.push({ feature, rules, verdict });
  }
  return out;
}
