import { isSubtypeOf } from "@/lib/audit/vocab";
import type {
  BookData,
  CourseData,
  EventData,
  JobPostingData,
  LocalBusinessData,
  ProductData,
  SchemaFormData,
  SchemaType,
} from "@/lib/tools/schemaTemplates";

/**
 * Maps real markup (JSON-LD or converted microdata/RDFa) back onto the generator's form
 * templates, so a detected item can be opened in the builder ("Edit in generator").
 * Lossy by design: the generator covers the fields Google uses most.
 */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** Optional resolver for @id references (the validator passes its graph). */
export type Resolve = (v: unknown) => unknown;
const identity: Resolve = (v) => v;

const ORDER: [string, SchemaType][] = [
  ["Recipe", "recipe"],
  ["ProductGroup", "product"],
  ["Product", "product"],
  ["JobPosting", "jobPosting"],
  ["Event", "event"],
  ["LocalBusiness", "localBusiness"],
  ["SoftwareApplication", "softwareApp"],
  ["VideoObject", "videoObject"],
  ["Course", "course"],
  ["Dataset", "dataset"],
  ["Movie", "movie"],
  ["Book", "book"],
  ["QAPage", "qaPage"],
  ["FAQPage", "faq"],
  ["HowTo", "howTo"],
  ["Review", "review"],
  ["Article", "article"],
  ["BreadcrumbList", "breadcrumb"],
  ["WebSite", "website"],
  ["Service", "service"],
  ["Person", "person"],
  ["Organization", "organization"],
];

/** The generator template that best matches a list of schema.org types, or null. */
export function templateForTypes(types: string[]): SchemaType | null {
  for (const [schemaType, template] of ORDER) {
    if (types.some((t) => isSubtypeOf(t, schemaType))) {
      // Social posts are Articles in schema.org but not in the generator's sense.
      if (template === "article" && types.some((t) => isSubtypeOf(t, "SocialMediaPosting"))) return null;
      return template;
    }
  }
  return null;
}

function getRaw(node: unknown, key: string): unknown {
  if (!isObj(node)) return undefined;
  if (key in node) return node[key];
  for (const k of [`schema:${key}`, `https://schema.org/${key}`, `http://schema.org/${key}`]) if (k in node) return node[k];
  return undefined;
}

function list(v: unknown): unknown[] {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.flatMap(list);
  if (isObj(v) && "@value" in v) return [v["@value"]];
  if (isObj(v) && "@list" in v) return list(v["@list"]);
  return [v];
}

function makeReader(resolve: Resolve) {
  const all = (node: unknown, path: string): unknown[] => {
    let cur: unknown[] = [resolve(node)];
    for (const seg of path.split(".")) cur = cur.flatMap((c) => list(getRaw(c, seg)).map(resolve));
    return cur;
  };
  const str = (node: unknown, path: string): string => {
    for (const v of all(node, path)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v).trim();
    }
    return "";
  };
  /** A name: the string itself, or the object's name. */
  const name = (node: unknown, path: string): string => {
    for (const v of all(node, path)) {
      if (typeof v === "string") return v.trim();
      if (isObj(v)) {
        const n = str(v, "name");
        if (n) return n;
      }
    }
    return "";
  };
  const names = (node: unknown, path: string): string[] =>
    all(node, path)
      .map((v) => (typeof v === "string" ? v.trim() : isObj(v) ? str(v, "name") : ""))
      .filter(Boolean);
  /** A URL: the string itself, or an ImageObject/WebPage's url / contentUrl / @id. */
  const url = (node: unknown, path: string): string => {
    for (const v of all(node, path)) {
      if (typeof v === "string") return v.trim();
      if (isObj(v)) {
        const u = str(v, "url") || str(v, "contentUrl") || (typeof v["@id"] === "string" ? (v["@id"] as string) : "");
        if (u) return u;
      }
    }
    return "";
  };
  const strings = (node: unknown, path: string): string[] =>
    all(node, path)
      .map((v) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : ""))
      .filter(Boolean);
  const typeName = (node: unknown): string => {
    const t = isObj(node) ? (node["@type"] as unknown) : undefined;
    const first = Array.isArray(t) ? t[0] : t;
    return typeof first === "string" ? first.replace(/^https?:\/\/schema\.org\//, "") : "";
  };
  return { all, str, name, names, url, strings, typeName };
}

const tail = (s: string) => s.replace(/^https?:\/\/(www\.)?schema\.org\//i, "").replace(/^schema:/, "");
function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  const v = tail(value);
  return (allowed.find((a) => a.toLowerCase() === v.toLowerCase()) ?? fallback) as T;
}

function formatAddress(r: ReturnType<typeof makeReader>, node: unknown, path: string): string {
  const raw = r.all(node, path)[0];
  if (typeof raw === "string") return raw;
  if (!isObj(raw)) return "";
  return ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"].map((k) => r.str(raw, k) || r.name(raw, k)).filter(Boolean).join(", ");
}

function instructionTexts(r: ReturnType<typeof makeReader>, node: unknown): string[] {
  const out: string[] = [];
  const visit = (v: unknown) => {
    if (typeof v === "string") v.split(/\n+/).map((x) => x.trim()).filter(Boolean).forEach((x) => out.push(x));
    else if (isObj(v)) {
      const items = r.all(v, "itemListElement");
      if (items.length) items.forEach(visit);
      else {
        const t = r.str(v, "text") || r.str(v, "name");
        if (t) out.push(t);
      }
    }
  };
  r.all(node, "recipeInstructions").forEach(visit);
  return out;
}

/** Converts a detected item into the generator's form data for `type`. */
export function importToForm<T extends SchemaType>(type: T, node: unknown, resolve: Resolve = identity): SchemaFormData[T] {
  const r = makeReader(resolve);
  const n = resolve(node);
  const offer = r.all(n, "offers")[0];
  const price = (o: unknown) => r.str(o, "price") || r.str(o, "lowPrice") || r.str(o, "priceSpecification.price");
  const currency = (o: unknown) => r.str(o, "priceCurrency") || r.str(o, "priceSpecification.priceCurrency");

  const build: { [K in SchemaType]: () => SchemaFormData[K] } = {
    organization: () => ({
      name: r.str(n, "name"),
      url: r.str(n, "url"),
      logo: r.url(n, "logo"),
      description: r.str(n, "description"),
      sameAs: r.strings(n, "sameAs"),
      email: r.str(n, "email") || r.str(n, "contactPoint.email"),
      telephone: r.str(n, "telephone") || r.str(n, "contactPoint.telephone"),
      contactType: r.str(n, "contactPoint.contactType"),
    }),
    website: () => ({
      name: r.str(n, "name"),
      url: r.str(n, "url"),
      description: r.str(n, "description"),
      searchUrlTemplate: r.str(n, "potentialAction.target.urlTemplate") || r.str(n, "potentialAction.target"),
    }),
    breadcrumb: () => ({
      items: r
        .all(n, "itemListElement")
        .filter(isObj)
        .sort((a, b) => Number(r.str(a, "position") || 0) - Number(r.str(b, "position") || 0))
        .map((li) => ({ name: r.str(li, "name") || r.name(li, "item"), url: r.url(li, "item") })),
    }),
    faq: () => ({
      faqs: r
        .all(n, "mainEntity")
        .filter(isObj)
        .map((q) => ({ question: r.str(q, "name"), answer: r.str(q, "acceptedAnswer.text") })),
    }),
    article: () => {
      const author = r.all(n, "author")[0];
      return {
        headline: r.str(n, "headline") || r.str(n, "name"),
        image: r.url(n, "image"),
        authorName: r.name(n, "author"),
        authorType: r.typeName(author) === "Organization" ? "Organization" : "Person",
        authorUrl: isObj(author) ? r.str(author, "url") : "",
        publisherName: r.name(n, "publisher"),
        publisherLogo: r.url(n, "publisher.logo"),
        datePublished: r.str(n, "datePublished"),
        dateModified: r.str(n, "dateModified"),
        description: r.str(n, "description"),
        mainEntityOfPageUrl: r.url(n, "mainEntityOfPage"),
      };
    },
    localBusiness: () => {
      const t = r.typeName(n);
      const businessType: LocalBusinessData["businessType"] = ["Restaurant", "Store", "ProfessionalService"].includes(t)
        ? (t as LocalBusinessData["businessType"])
        : isSubtypeOf(t, "FoodEstablishment")
          ? "Restaurant"
          : isSubtypeOf(t, "Store")
            ? "Store"
            : isSubtypeOf(t, "ProfessionalService")
              ? "ProfessionalService"
              : "LocalBusiness";
      const addr = r.all(n, "address")[0];
      const hours = r.strings(n, "openingHours");
      const spec = r
        .all(n, "openingHoursSpecification")
        .filter(isObj)
        .map((s) => `${r.strings(s, "dayOfWeek").map((d) => tail(d).slice(0, 2)).join(",")} ${r.str(s, "opens").slice(0, 5)}-${r.str(s, "closes").slice(0, 5)}`.trim());
      return {
        businessType,
        name: r.str(n, "name"),
        image: r.url(n, "image"),
        telephone: r.str(n, "telephone"),
        priceRange: r.str(n, "priceRange"),
        streetAddress: typeof addr === "string" ? addr : r.str(addr, "streetAddress"),
        addressLocality: r.str(addr, "addressLocality"),
        addressRegion: r.str(addr, "addressRegion"),
        postalCode: r.str(addr, "postalCode"),
        addressCountry: r.str(addr, "addressCountry") || r.name(addr, "addressCountry"),
        latitude: r.str(n, "geo.latitude"),
        longitude: r.str(n, "geo.longitude"),
        url: r.str(n, "url"),
        openingHours: (hours.length ? hours : spec).join(", "),
      };
    },
    product: () => {
      // A ProductGroup's first variant carries the offer.
      const variant = r.all(n, "hasVariant")[0];
      const o = offer ?? r.all(variant, "offers")[0];
      return {
        name: r.str(n, "name"),
        image: r.url(n, "image") || r.url(variant, "image"),
        description: r.str(n, "description"),
        brand: r.name(n, "brand"),
        sku: r.str(n, "sku") || r.str(variant, "sku"),
        gtin: r.str(n, "gtin13") || r.str(n, "gtin") || r.str(n, "gtin12") || r.str(n, "gtin14") || r.str(n, "gtin8"),
        price: price(o),
        priceCurrency: currency(o),
        priceValidUntil: r.str(o, "priceValidUntil"),
        availability: pick(r.str(o, "availability"), ["InStock", "OutOfStock", "PreOrder", "LimitedAvailability", "Discontinued"] as const, "InStock") as ProductData["availability"],
        ratingValue: r.str(n, "aggregateRating.ratingValue"),
        reviewCount: r.str(n, "aggregateRating.reviewCount") || r.str(n, "aggregateRating.ratingCount"),
        reviews: r
          .all(n, "review")
          .filter(isObj)
          .slice(0, 10)
          .map((rv) => ({ authorName: r.name(rv, "author"), reviewBody: r.str(rv, "reviewBody") || r.str(rv, "description"), ratingValue: r.str(rv, "reviewRating.ratingValue") })),
      };
    },
    softwareApp: () => ({
      name: r.str(n, "name"),
      operatingSystem: r.str(n, "operatingSystem"),
      applicationCategory: tail(r.str(n, "applicationCategory")),
      price: price(offer),
      priceCurrency: currency(offer),
      ratingValue: r.str(n, "aggregateRating.ratingValue"),
      ratingCount: r.str(n, "aggregateRating.ratingCount") || r.str(n, "aggregateRating.reviewCount"),
      description: r.str(n, "description"),
    }),
    person: () => ({
      name: r.str(n, "name"),
      jobTitle: r.name(n, "jobTitle"),
      worksFor: r.name(n, "worksFor"),
      url: r.str(n, "url"),
      image: r.url(n, "image"),
      sameAs: r.strings(n, "sameAs"),
    }),
    event: () => ({
      name: r.str(n, "name"),
      description: r.str(n, "description"),
      startDate: r.str(n, "startDate"),
      endDate: r.str(n, "endDate"),
      locationName: r.name(n, "location"),
      locationAddress: formatAddress(r, r.all(n, "location")[0], "address"),
      image: r.url(n, "image"),
      price: price(offer),
      priceCurrency: currency(offer),
      availability: pick(r.str(offer, "availability"), ["InStock", "SoldOut", "PreOrder"] as const, "InStock") as EventData["availability"],
      performerName: r.name(n, "performer"),
    }),
    review: () => ({
      itemName: r.name(n, "itemReviewed"),
      itemType: r.typeName(r.all(n, "itemReviewed")[0]) || "Product",
      authorName: r.name(n, "author"),
      reviewBody: r.str(n, "reviewBody") || r.str(n, "description"),
      ratingValue: r.str(n, "reviewRating.ratingValue"),
      bestRating: r.str(n, "reviewRating.bestRating"),
      datePublished: r.str(n, "datePublished"),
    }),
    howTo: () => {
      const steps: { name: string; text: string }[] = [];
      const visit = (v: unknown) => {
        if (typeof v === "string") steps.push({ name: v, text: "" });
        else if (isObj(v)) {
          const inner = r.all(v, "itemListElement");
          if (inner.length && r.typeName(v) === "HowToSection") inner.forEach(visit);
          else steps.push({ name: r.str(v, "name") || r.str(v, "text").slice(0, 80), text: r.str(v, "text") });
        }
      };
      r.all(n, "step").forEach(visit);
      return {
        name: r.str(n, "name"),
        description: r.str(n, "description"),
        totalTime: r.str(n, "totalTime"),
        supplies: r.names(n, "supply"),
        tools: r.names(n, "tool"),
        steps,
      };
    },
    videoObject: () => ({
      name: r.str(n, "name"),
      description: r.str(n, "description"),
      thumbnailUrl: r.url(n, "thumbnailUrl") || r.url(n, "thumbnail"),
      uploadDate: r.str(n, "uploadDate"),
      duration: r.str(n, "duration"),
      contentUrl: r.str(n, "contentUrl") || r.str(n, "embedUrl"),
    }),
    recipe: () => ({
      name: r.str(n, "name"),
      image: r.url(n, "image"),
      authorName: r.name(n, "author"),
      description: r.str(n, "description"),
      prepTime: r.str(n, "prepTime"),
      cookTime: r.str(n, "cookTime"),
      totalTime: r.str(n, "totalTime"),
      recipeYield: r.str(n, "recipeYield"),
      calories: r.str(n, "nutrition.calories").replace(/\s*(k?cal(ories)?)\s*$/i, ""),
      ingredients: r.strings(n, "recipeIngredient").length ? r.strings(n, "recipeIngredient") : r.strings(n, "ingredients"),
      instructions: instructionTexts(r, n),
    }),
    jobPosting: () => {
      const addr = r.all(n, "jobLocation.address")[0];
      const remote = /telecommute/i.test(r.str(n, "jobLocationType"));
      const salary = r.all(n, "baseSalary")[0];
      const types = ["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER"] as const;
      return {
        title: r.str(n, "title"),
        description: r.str(n, "description"),
        datePosted: r.str(n, "datePosted"),
        validThrough: r.str(n, "validThrough"),
        employmentType: pick(r.str(n, "employmentType").replace(/[\s-]/g, "_").toUpperCase(), types, "FULL_TIME") as JobPostingData["employmentType"],
        hiringOrgName: r.name(n, "hiringOrganization"),
        hiringOrgUrl: r.str(n, "hiringOrganization.sameAs") || r.str(n, "hiringOrganization.url"),
        hiringOrgLogo: r.url(n, "hiringOrganization.logo"),
        streetAddress: typeof addr === "string" ? addr : r.str(addr, "streetAddress"),
        addressLocality: r.str(addr, "addressLocality"),
        addressRegion: r.str(addr, "addressRegion"),
        postalCode: r.str(addr, "postalCode"),
        addressCountry: r.str(addr, "addressCountry") || r.name(addr, "addressCountry"),
        remote: remote ? "remote" : "onsite",
        salaryMin: r.str(salary, "value.minValue") || r.str(salary, "value.value") || r.str(salary, "value"),
        salaryMax: r.str(salary, "value.maxValue") || r.str(salary, "value.value") || r.str(salary, "value"),
        salaryCurrency: r.str(salary, "currency"),
      };
    },
    course: () => {
      const inst = r.all(n, "hasCourseInstance")[0];
      const mode = r.str(inst, "courseMode").toLowerCase();
      return {
        name: r.str(n, "name"),
        description: r.str(n, "description"),
        providerName: r.name(n, "provider"),
        providerUrl: r.str(n, "provider.url") || r.str(n, "provider.sameAs"),
        courseMode: (/online/.test(mode) ? "Online" : /blend|hybrid/.test(mode) ? "Blended" : mode ? "Onsite" : "Online") as CourseData["courseMode"],
        startDate: r.str(inst, "startDate"),
        endDate: r.str(inst, "endDate"),
        price: price(offer),
        priceCurrency: currency(offer),
      };
    },
    service: () => ({
      name: r.str(n, "name"),
      serviceType: r.str(n, "serviceType") || r.name(n, "serviceType"),
      description: r.str(n, "description"),
      providerName: r.name(n, "provider"),
      areaServed: r.name(n, "areaServed"),
      price: price(offer),
      priceCurrency: currency(offer),
    }),
    qaPage: () => {
      const q = r.all(n, "mainEntity")[0];
      const ans = r.all(q, "acceptedAnswer")[0] ?? r.all(q, "suggestedAnswer")[0];
      return {
        question: r.str(q, "name"),
        questionBody: r.str(q, "text"),
        answerText: r.str(ans, "text"),
        answerAuthorName: r.name(ans, "author"),
        answerDateCreated: r.str(ans, "dateCreated") || r.str(ans, "datePublished"),
        upvoteCount: r.str(ans, "upvoteCount"),
      };
    },
    dataset: () => {
      const kw = r.strings(n, "keywords");
      return {
        name: r.str(n, "name"),
        description: r.str(n, "description"),
        url: r.str(n, "url"),
        license: r.url(n, "license"),
        creatorName: r.name(n, "creator"),
        datePublished: r.str(n, "datePublished"),
        keywords: kw.length === 1 ? kw[0].split(/\s*,\s*/).filter(Boolean) : kw,
      };
    },
    movie: () => ({
      name: r.str(n, "name"),
      image: r.url(n, "image"),
      description: r.str(n, "description"),
      director: r.name(n, "director"),
      actors: r.names(n, "actor").slice(0, 20),
      datePublished: r.str(n, "datePublished") || r.str(n, "dateCreated"),
      duration: r.str(n, "duration"),
      ratingValue: r.str(n, "aggregateRating.ratingValue"),
      ratingCount: r.str(n, "aggregateRating.ratingCount") || r.str(n, "aggregateRating.reviewCount"),
    }),
    book: () => ({
      name: r.str(n, "name"),
      authorName: r.name(n, "author"),
      isbn: r.str(n, "isbn") || r.str(n, "workExample.isbn"),
      image: r.url(n, "image"),
      description: r.str(n, "description"),
      datePublished: r.str(n, "datePublished"),
      publisherName: r.name(n, "publisher"),
      bookFormat: pick(r.str(n, "bookFormat") || r.str(n, "workExample.bookFormat"), ["Hardcover", "Paperback", "EBook", "AudiobookFormat"] as const, "Hardcover") as BookData["bookFormat"],
      ratingValue: r.str(n, "aggregateRating.ratingValue"),
      ratingCount: r.str(n, "aggregateRating.ratingCount") || r.str(n, "aggregateRating.reviewCount"),
    }),
  };
  return build[type]() as SchemaFormData[T];
}
