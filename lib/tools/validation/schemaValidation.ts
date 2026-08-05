import type { SchemaFormData, SchemaType } from "@/lib/tools/schemaTemplates";
import { WEIGHT_POINTS, type FieldRule } from "@/lib/tools/validation/googleRichResultRules";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function filled(value: string | undefined | null): boolean {
  return !!value && value.trim() !== "";
}

function filledArr(arr: string[] | undefined): boolean {
  return !!arr && arr.some((v) => v.trim() !== "");
}

type RuleBuilder<T> = (d: T) => FieldRule[];

const rulesByType: { [K in SchemaType]: RuleBuilder<SchemaFormData[K]> } = {
  organization: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "URL", weight: "required", passed: filled(d.url) },
    { label: "Logo", weight: "required", passed: filled(d.logo), hint: "Google requires a logo ≥112×112px for the Knowledge Panel." },
    { label: "Description", weight: "recommended", passed: filled(d.description) },
    { label: "Contact info (email or phone)", weight: "recommended", passed: filled(d.email) || filled(d.telephone) },
    { label: "Social profiles (sameAs)", weight: "recommended", passed: d.sameAs.some((s) => filled(s)) },
  ],
  website: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "URL", weight: "required", passed: filled(d.url) },
    { label: "Description", weight: "recommended", passed: filled(d.description) },
  ],
  breadcrumb: (d) => [
    { label: "At least 2 breadcrumb levels", weight: "required", passed: d.items.filter((i) => filled(i.name)).length >= 2 },
    { label: "Every item has a URL", weight: "recommended", passed: d.items.every((i) => !filled(i.name) || filled(i.url)) },
  ],
  faq: (d) => {
    const valid = d.faqs.filter((f) => filled(f.question) && filled(f.answer));
    return [
      { label: "At least one Q&A pair", weight: "required", passed: valid.length > 0 },
      {
        label: "Genuine site FAQ content",
        weight: "recommended",
        passed: valid.length > 0,
        hint: "Google narrowed FAQ rich results in 2023 to well-known/government sites — most others won't get the visual snippet even with valid markup, but it still helps AI answer engines.",
      },
    ];
  },
  article: (d) => [
    { label: "Headline", weight: "required", passed: filled(d.headline) },
    { label: "Image", weight: "required", passed: filled(d.image), hint: "Google requires an image at least 1200px wide." },
    { label: "datePublished (ISO 8601)", weight: "required", passed: ISO_DATE.test(d.datePublished || "") },
    { label: "Author", weight: "required", passed: filled(d.authorName) },
    { label: "Publisher + logo", weight: "recommended", passed: filled(d.publisherName) && filled(d.publisherLogo) },
    { label: "dateModified", weight: "recommended", passed: filled(d.dateModified) },
  ],
  localBusiness: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Address (street, locality, region, postal, country)", weight: "required", passed: [d.streetAddress, d.addressLocality, d.addressRegion, d.postalCode, d.addressCountry].every(filled) },
    { label: "Specific subtype (not generic LocalBusiness)", weight: "recommended", passed: d.businessType !== "LocalBusiness", hint: "Google keys business rich results off specific subtypes like Restaurant or Store." },
    { label: "Geo coordinates", weight: "recommended", passed: filled(d.latitude) && filled(d.longitude) },
    { label: "Phone", weight: "recommended", passed: filled(d.telephone) },
  ],
  product: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Image", weight: "required", passed: filled(d.image) },
    { label: "Offer price + currency", weight: "required", passed: filled(d.price) && filled(d.priceCurrency) },
    { label: "Availability", weight: "required", passed: filled(d.availability) },
    {
      label: "Rating or review present",
      weight: "required",
      passed: (filled(d.ratingValue) && filled(d.reviewCount)) || d.reviews.some((r) => filled(r.authorName)),
      hint: "Google requires at least an aggregateRating or a review to show star ratings.",
    },
    { label: "priceValidUntil", weight: "recommended", passed: filled(d.priceValidUntil) },
    { label: "SKU or GTIN", weight: "recommended", passed: filled(d.sku) || filled(d.gtin) },
  ],
  softwareApp: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Operating system", weight: "required", passed: filled(d.operatingSystem) },
    { label: "Application category", weight: "required", passed: filled(d.applicationCategory) },
    { label: "Rating", weight: "recommended", passed: filled(d.ratingValue) && filled(d.ratingCount) },
    { label: "Offer/price", weight: "recommended", passed: filled(d.price) },
  ],
  person: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Job title or affiliation", weight: "recommended", passed: filled(d.jobTitle) || filled(d.worksFor) },
    { label: "Social profiles (sameAs)", weight: "recommended", passed: d.sameAs.some((s) => filled(s)) },
  ],
  event: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Start date", weight: "required", passed: filled(d.startDate) },
    { label: "Location", weight: "required", passed: filled(d.locationName) },
    { label: "Image", weight: "recommended", passed: filled(d.image) },
    { label: "Offer/ticket info", weight: "recommended", passed: filled(d.price) },
  ],
  review: (d) => [
    { label: "Item being reviewed", weight: "required", passed: filled(d.itemName) },
    { label: "Author", weight: "required", passed: filled(d.authorName) },
    { label: "Rating value", weight: "required", passed: filled(d.ratingValue) },
    { label: "Review body", weight: "recommended", passed: filled(d.reviewBody) },
  ],
  howTo: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "At least 2 steps", weight: "required", passed: d.steps.filter((s) => filled(s.name)).length >= 2 },
    { label: "Total time", weight: "recommended", passed: filled(d.totalTime) },
    { label: "Supplies or tools listed", weight: "recommended", passed: filledArr(d.supplies) || filledArr(d.tools) },
  ],
  videoObject: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Thumbnail URL", weight: "required", passed: filled(d.thumbnailUrl) },
    { label: "Upload date", weight: "required", passed: filled(d.uploadDate) },
    { label: "Description", weight: "recommended", passed: filled(d.description) },
    { label: "Duration (ISO 8601)", weight: "recommended", passed: filled(d.duration) },
  ],
  recipe: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Image", weight: "required", passed: filled(d.image) },
    { label: "At least 2 ingredients", weight: "required", passed: d.ingredients.filter(filled).length >= 2 },
    { label: "At least 1 instruction step", weight: "required", passed: d.instructions.filter(filled).length >= 1 },
    { label: "Total time", weight: "recommended", passed: filled(d.totalTime) },
    { label: "Calories", weight: "recommended", passed: filled(d.calories) },
  ],
  jobPosting: (d) => [
    { label: "Title", weight: "required", passed: filled(d.title) },
    { label: "Description", weight: "required", passed: filled(d.description) },
    { label: "Date posted (ISO 8601)", weight: "required", passed: ISO_DATE.test(d.datePosted || "") },
    { label: "Hiring organization", weight: "required", passed: filled(d.hiringOrgName) },
    {
      label: "Job location or remote flag",
      weight: "required",
      passed: d.remote === "remote" || [d.streetAddress, d.addressLocality, d.addressCountry].every(filled),
      hint: "Google requires a jobLocation, or jobLocationType: TELECOMMUTE for fully remote roles.",
    },
    { label: "Valid through", weight: "recommended", passed: filled(d.validThrough) },
    { label: "Base salary range", weight: "recommended", passed: filled(d.salaryMin) && filled(d.salaryMax) },
  ],
  course: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Description", weight: "required", passed: filled(d.description) },
    { label: "Provider", weight: "required", passed: filled(d.providerName) },
    { label: "Course instance (mode + dates)", weight: "recommended", passed: filled(d.startDate) && filled(d.endDate) },
    { label: "Offer/price", weight: "recommended", passed: filled(d.price) },
  ],
  service: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Service type", weight: "required", passed: filled(d.serviceType) },
    { label: "Provider", weight: "required", passed: filled(d.providerName) },
    { label: "Description", weight: "recommended", passed: filled(d.description) },
    { label: "Area served", weight: "recommended", passed: filled(d.areaServed) },
  ],
  qaPage: (d) => [
    { label: "Question", weight: "required", passed: filled(d.question) },
    { label: "Accepted answer", weight: "required", passed: filled(d.answerText) },
    { label: "Answer author", weight: "recommended", passed: filled(d.answerAuthorName) },
    { label: "Date created", weight: "recommended", passed: filled(d.answerDateCreated) },
  ],
  dataset: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Description", weight: "required", passed: filled(d.description) },
    { label: "License", weight: "recommended", passed: filled(d.license), hint: "Google recommends declaring a license so the dataset can be marked reusable." },
    { label: "Creator", weight: "recommended", passed: filled(d.creatorName) },
    { label: "Keywords", weight: "recommended", passed: filledArr(d.keywords) },
  ],
  movie: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Image", weight: "required", passed: filled(d.image) },
    { label: "Director", weight: "recommended", passed: filled(d.director) },
    { label: "Actors", weight: "recommended", passed: filledArr(d.actors) },
    { label: "Rating", weight: "recommended", passed: filled(d.ratingValue) && filled(d.ratingCount) },
  ],
  book: (d) => [
    { label: "Name", weight: "required", passed: filled(d.name) },
    { label: "Author", weight: "required", passed: filled(d.authorName) },
    { label: "ISBN", weight: "recommended", passed: filled(d.isbn) },
    { label: "Publisher", weight: "recommended", passed: filled(d.publisherName) },
    { label: "Rating", weight: "recommended", passed: filled(d.ratingValue) && filled(d.ratingCount) },
  ],
};

export type SchemaScore = {
  score: number;
  rules: FieldRule[];
  eligible: boolean;
};

/**
 * Weighted completeness/eligibility score — not "is this JSON parseable" but
 * "does this satisfy the fields Google and the underlying vocabulary
 * actually weight for rich-result eligibility." Required fields count far
 * more than recommended ones, and the UI surfaces exactly what's missing.
 */
export function scoreSchema<T extends SchemaType>(type: T, data: SchemaFormData[T]): SchemaScore {
  const builder = rulesByType[type] as RuleBuilder<SchemaFormData[T]>;
  const rules = builder(data);

  const maxPoints = rules.reduce((sum, r) => sum + WEIGHT_POINTS[r.weight], 0);
  const earned = rules.reduce((sum, r) => sum + (r.passed ? WEIGHT_POINTS[r.weight] : 0), 0);
  const score = maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 0;

  const eligible = rules.filter((r) => r.weight === "required").every((r) => r.passed);

  return { score, rules, eligible };
}
