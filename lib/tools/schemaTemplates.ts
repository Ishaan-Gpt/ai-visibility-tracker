export type SchemaType =
  | "organization"
  | "website"
  | "breadcrumb"
  | "faq"
  | "article"
  | "localBusiness"
  | "product"
  | "softwareApp"
  | "person"
  | "event"
  | "review"
  | "howTo"
  | "videoObject"
  | "recipe"
  | "jobPosting"
  | "course"
  | "service"
  | "qaPage"
  | "dataset"
  | "movie"
  | "book";

export interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  email: string;
  telephone: string;
  contactType: string;
}

export interface WebSiteData {
  name: string;
  url: string;
  description: string;
  /** Left blank to omit the SearchAction (only include if the site has a real search endpoint). */
  searchUrlTemplate: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbData {
  items: BreadcrumbItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQData {
  faqs: FAQItem[];
}

export interface ArticleData {
  headline: string;
  image: string;
  authorName: string;
  authorType: "Person" | "Organization";
  authorUrl: string;
  publisherName: string;
  publisherLogo: string;
  datePublished: string;
  dateModified: string;
  description: string;
  mainEntityOfPageUrl: string;
}

export interface LocalBusinessData {
  businessType: "LocalBusiness" | "Restaurant" | "Store" | "ProfessionalService";
  name: string;
  image: string;
  telephone: string;
  priceRange: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  latitude: string;
  longitude: string;
  url: string;
  openingHours: string;
}

export interface ProductReviewItem {
  authorName: string;
  reviewBody: string;
  ratingValue: string;
}

export interface ProductData {
  name: string;
  image: string;
  description: string;
  brand: string;
  sku: string;
  gtin: string;
  price: string;
  priceCurrency: string;
  priceValidUntil: string;
  availability: "InStock" | "OutOfStock" | "PreOrder" | "LimitedAvailability" | "Discontinued";
  ratingValue: string;
  reviewCount: string;
  reviews: ProductReviewItem[];
}

export interface SoftwareAppData {
  name: string;
  operatingSystem: string;
  applicationCategory: string;
  price: string;
  priceCurrency: string;
  ratingValue: string;
  ratingCount: string;
  description: string;
}

export interface PersonData {
  name: string;
  jobTitle: string;
  worksFor: string;
  url: string;
  image: string;
  sameAs: string[];
}

export interface EventData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  locationName: string;
  locationAddress: string;
  image: string;
  price: string;
  priceCurrency: string;
  availability: "InStock" | "SoldOut" | "PreOrder";
  performerName: string;
}

export interface ReviewData {
  itemName: string;
  itemType: string;
  authorName: string;
  reviewBody: string;
  ratingValue: string;
  bestRating: string;
  datePublished: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export interface HowToData {
  name: string;
  description: string;
  totalTime: string;
  supplies: string[];
  tools: string[];
  steps: HowToStep[];
}

export interface VideoObjectData {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl: string;
}

export interface RecipeData {
  name: string;
  image: string;
  authorName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  recipeYield: string;
  calories: string;
  ingredients: string[];
  instructions: string[];
}

export interface JobPostingData {
  title: string;
  description: string;
  datePosted: string;
  validThrough: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | "TEMPORARY" | "INTERN" | "VOLUNTEER";
  hiringOrgName: string;
  hiringOrgUrl: string;
  hiringOrgLogo: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  remote: "onsite" | "remote" | "hybrid";
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
}

export interface CourseData {
  name: string;
  description: string;
  providerName: string;
  providerUrl: string;
  courseMode: "Online" | "Onsite" | "Blended";
  startDate: string;
  endDate: string;
  price: string;
  priceCurrency: string;
}

export interface ServiceData {
  name: string;
  serviceType: string;
  description: string;
  providerName: string;
  areaServed: string;
  price: string;
  priceCurrency: string;
}

export interface QAPageData {
  question: string;
  questionBody: string;
  answerText: string;
  answerAuthorName: string;
  answerDateCreated: string;
  upvoteCount: string;
}

export interface DatasetData {
  name: string;
  description: string;
  url: string;
  license: string;
  creatorName: string;
  datePublished: string;
  keywords: string[];
}

export interface MovieData {
  name: string;
  image: string;
  description: string;
  director: string;
  actors: string[];
  datePublished: string;
  duration: string;
  ratingValue: string;
  ratingCount: string;
}

export interface BookData {
  name: string;
  authorName: string;
  isbn: string;
  image: string;
  description: string;
  datePublished: string;
  publisherName: string;
  bookFormat: "Hardcover" | "Paperback" | "EBook" | "AudiobookFormat";
  ratingValue: string;
  ratingCount: string;
}

export type SchemaFormData = {
  organization: OrganizationData;
  website: WebSiteData;
  breadcrumb: BreadcrumbData;
  faq: FAQData;
  article: ArticleData;
  localBusiness: LocalBusinessData;
  product: ProductData;
  softwareApp: SoftwareAppData;
  person: PersonData;
  event: EventData;
  review: ReviewData;
  howTo: HowToData;
  videoObject: VideoObjectData;
  recipe: RecipeData;
  jobPosting: JobPostingData;
  course: CourseData;
  service: ServiceData;
  qaPage: QAPageData;
  dataset: DatasetData;
  movie: MovieData;
  book: BookData;
};

export const initialFormData: SchemaFormData = {
  organization: {
    name: "eegnite Marketing Agency",
    url: "https://www.eegnite.com",
    logo: "https://www.eegnite.com/logo.png",
    description: "Data-driven digital marketing agency specializing in AI Visibility and SEO growth.",
    sameAs: ["https://twitter.com/eegnite", "https://linkedin.com/company/eegnite"],
    email: "contact@eegnite.com",
    telephone: "+1-800-555-0199",
    contactType: "customer service",
  },
  website: {
    name: "eegnite",
    url: "https://www.eegnite.com",
    description: "Data-driven digital marketing agency specializing in AI Visibility and SEO growth.",
    searchUrlTemplate: "",
  },
  breadcrumb: {
    items: [
      { name: "Home", url: "https://www.eegnite.com" },
      { name: "Tools", url: "https://www.eegnite.com/tools" },
      { name: "Schema Markup Generator", url: "https://www.eegnite.com/tools/schema-generator" },
    ],
  },
  faq: {
    faqs: [
      {
        question: "What is Schema Markup and why is it important for SEO?",
        answer:
          "Schema Markup is structured data (JSON-LD) added to a website to help search engines like Google and AI models like Gemini understand your content and render rich snippets.",
      },
      {
        question: "Does Schema Markup help with AI Search Visibility (GEO)?",
        answer:
          "Yes! AI search engines like ChatGPT Search, Perplexity, and Google AI Overviews rely heavily on structured data to accurately cite brand information, FAQs, and product details.",
      },
    ],
  },
  article: {
    headline: "How AI Search Engines Change SEO in 2026",
    image: "https://www.eegnite.com/images/ai-seo-blog.jpg",
    authorName: "Ishaan Gupta",
    authorType: "Person",
    authorUrl: "https://www.eegnite.com/authors/ishaan",
    publisherName: "eegnite",
    publisherLogo: "https://www.eegnite.com/logo.png",
    datePublished: "2026-08-01",
    dateModified: "2026-08-04",
    description: "A complete guide on optimizing your website for AI Visibility and Generative Engine Optimization.",
    mainEntityOfPageUrl: "https://www.eegnite.com/blog/ai-search-2026",
  },
  localBusiness: {
    businessType: "LocalBusiness",
    name: "eegnite Digital Studio",
    image: "https://www.eegnite.com/office.jpg",
    telephone: "+1-555-0199",
    priceRange: "$$",
    streetAddress: "100 Tech Boulevard, Suite 400",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94105",
    addressCountry: "US",
    latitude: "37.7749",
    longitude: "-122.4194",
    url: "https://www.eegnite.com",
    openingHours: "Mo-Fr 09:00-18:00",
  },
  product: {
    name: "AI Visibility Growth Suite",
    image: "https://www.eegnite.com/product.jpg",
    description: "Automated brand tracking for AI search engines including Gemini, ChatGPT, and Perplexity.",
    brand: "eegnite",
    sku: "EEG-AI-01",
    gtin: "",
    price: "49.00",
    priceCurrency: "USD",
    priceValidUntil: "2026-12-31",
    availability: "InStock",
    ratingValue: "4.9",
    reviewCount: "128",
    reviews: [],
  },
  softwareApp: {
    name: "OpenGeo",
    operatingSystem: "Web-based",
    applicationCategory: "BusinessApplication",
    price: "0.00",
    priceCurrency: "USD",
    ratingValue: "4.8",
    ratingCount: "94",
    description: "Track your brand mentions across LLM answer engines.",
  },
  person: {
    name: "Ishaan Gupta",
    jobTitle: "Founder & Lead Architect",
    worksFor: "eegnite",
    url: "https://www.eegnite.com",
    image: "https://www.eegnite.com/team/ishaan.jpg",
    sameAs: ["https://twitter.com/ishaangupta", "https://linkedin.com/in/ishaangupta"],
  },
  event: {
    name: "AI Search Summit 2026",
    description: "A gathering of SEO and GEO practitioners discussing the future of AI-driven search.",
    startDate: "2026-11-12T09:00",
    endDate: "2026-11-12T17:00",
    locationName: "Moscone Center",
    locationAddress: "747 Howard St, San Francisco, CA 94103",
    image: "https://www.eegnite.com/events/summit.jpg",
    price: "0",
    priceCurrency: "USD",
    availability: "InStock",
    performerName: "",
  },
  review: {
    itemName: "OpenGeo",
    itemType: "SoftwareApplication",
    authorName: "Priya Sharma",
    reviewBody: "OpenGeo showed us exactly why competitors were being cited by Gemini and we weren't.",
    ratingValue: "5",
    bestRating: "5",
    datePublished: "2026-07-15",
  },
  howTo: {
    name: "How to Add Schema Markup to Your Website",
    description: "A step-by-step guide to implementing JSON-LD structured data.",
    totalTime: "PT10M",
    supplies: ["Access to your site's <head> tag"],
    tools: ["Text editor"],
    steps: [
      { name: "Generate your JSON-LD", text: "Use a schema generator to build valid structured data for your page type." },
      { name: "Paste into <head>", text: "Copy the <script type=\"application/ld+json\"> tag into your page's <head>." },
      { name: "Validate", text: "Test the page with Google's Rich Results Test to confirm eligibility." },
    ],
  },
  videoObject: {
    name: "What Is Generative Engine Optimization?",
    description: "An explainer on optimizing content for AI answer engines.",
    thumbnailUrl: "https://www.eegnite.com/video/geo-thumb.jpg",
    uploadDate: "2026-06-01",
    duration: "PT4M32S",
    contentUrl: "https://www.eegnite.com/video/geo-explainer.mp4",
  },
  recipe: {
    name: "Sample Recipe",
    image: "https://www.eegnite.com/recipe.jpg",
    authorName: "eegnite Kitchen",
    description: "A placeholder recipe entity for testing Recipe rich results.",
    prepTime: "PT15M",
    cookTime: "PT30M",
    totalTime: "PT45M",
    recipeYield: "4 servings",
    calories: "350",
    ingredients: ["2 cups flour", "1 tsp salt"],
    instructions: ["Mix dry ingredients.", "Bake at 350F for 30 minutes."],
  },
  jobPosting: {
    title: "Senior Technical SEO Specialist",
    description: "Own structured data and AI-visibility strategy for a portfolio of client sites.",
    datePosted: "2026-08-01",
    validThrough: "2026-09-30",
    employmentType: "FULL_TIME",
    hiringOrgName: "eegnite",
    hiringOrgUrl: "https://www.eegnite.com",
    hiringOrgLogo: "https://www.eegnite.com/logo.png",
    streetAddress: "100 Tech Boulevard, Suite 400",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94105",
    addressCountry: "US",
    remote: "hybrid",
    salaryMin: "90000",
    salaryMax: "130000",
    salaryCurrency: "USD",
  },
  course: {
    name: "Generative Engine Optimization Fundamentals",
    description: "A practical course on optimizing content and structured data for AI answer engines.",
    providerName: "eegnite",
    providerUrl: "https://www.eegnite.com",
    courseMode: "Online",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    price: "0",
    priceCurrency: "USD",
  },
  service: {
    name: "AI Visibility Audit",
    serviceType: "SEO Consulting",
    description: "A full audit of how your brand shows up across Google rich results and AI answer engines.",
    providerName: "eegnite",
    areaServed: "United States",
    price: "499",
    priceCurrency: "USD",
  },
  qaPage: {
    question: "Does schema markup improve AI search visibility?",
    questionBody: "I've added JSON-LD to my site but I'm not sure it affects how AI models like Gemini cite my brand.",
    answerText: "Yes — structured data gives AI answer engines a clean, unambiguous source of facts about your brand, which increases the odds of accurate citation.",
    answerAuthorName: "Ishaan Gupta",
    answerDateCreated: "2026-07-20",
    upvoteCount: "12",
  },
  dataset: {
    name: "AI Search Citation Rates by Industry, 2026",
    description: "Aggregate data on how often brands are cited by Gemini, ChatGPT, and Perplexity across 20 industries.",
    url: "https://www.eegnite.com/data/ai-citation-rates-2026",
    license: "https://creativecommons.org/licenses/by/4.0/",
    creatorName: "eegnite",
    datePublished: "2026-07-01",
    keywords: ["AI search", "GEO", "structured data"],
  },
  movie: {
    name: "The Algorithm",
    image: "https://www.eegnite.com/media/the-algorithm-poster.jpg",
    description: "A documentary on how AI search is reshaping the web.",
    director: "Jordan Lane",
    actors: ["Priya Sharma", "Marcus Webb"],
    datePublished: "2026-05-15",
    duration: "PT1H32M",
    ratingValue: "4.6",
    ratingCount: "310",
  },
  book: {
    name: "Structured Data for the AI Search Era",
    authorName: "Ishaan Gupta",
    isbn: "978-1-234567-89-0",
    image: "https://www.eegnite.com/media/book-cover.jpg",
    description: "A practical guide to schema markup, JSON-LD, and AI visibility.",
    datePublished: "2026-03-01",
    publisherName: "eegnite Press",
    bookFormat: "EBook",
    ratingValue: "4.7",
    ratingCount: "58",
  },
};

/** Strips undefined-valued keys so callers can build objects with optional fields inline. */
function prune<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== "")) as T;
}

export function generateJsonLd(type: SchemaType, data: SchemaFormData): object {
  switch (type) {
    case "organization": {
      const d = data.organization;
      const validSocials = d.sameAs.filter((s) => s.trim() !== "");
      return prune({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: d.name,
        url: d.url,
        logo: d.logo,
        description: d.description,
        email: d.email,
        telephone: d.telephone,
        sameAs: validSocials.length > 0 ? validSocials : undefined,
        contactPoint: d.telephone
          ? prune({ "@type": "ContactPoint", telephone: d.telephone, contactType: d.contactType || "customer service" })
          : undefined,
      });
    }

    case "website": {
      const d = data.website;
      return prune({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: d.name,
        url: d.url,
        description: d.description,
        potentialAction: d.searchUrlTemplate
          ? {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: d.searchUrlTemplate },
              "query-input": "required name=search_term_string",
            }
          : undefined,
      });
    }

    case "breadcrumb": {
      const d = data.breadcrumb;
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: d.items
          .filter((i) => i.name.trim() !== "")
          .map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url || undefined,
          })),
      };
    }

    case "faq": {
      const d = data.faq;
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: d.faqs
          .filter((f) => f.question.trim() !== "" && f.answer.trim() !== "")
          .map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
      };
    }

    case "article": {
      const d = data.article;
      return prune({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: d.headline,
        image: d.image ? [d.image] : undefined,
        datePublished: d.datePublished,
        dateModified: d.dateModified || d.datePublished,
        description: d.description,
        mainEntityOfPage: d.mainEntityOfPageUrl
          ? { "@type": "WebPage", "@id": d.mainEntityOfPageUrl }
          : undefined,
        author: prune({ "@type": d.authorType, name: d.authorName, url: d.authorUrl }),
        publisher: prune({
          "@type": "Organization",
          name: d.publisherName,
          logo: d.publisherLogo ? { "@type": "ImageObject", url: d.publisherLogo, width: 112, height: 112 } : undefined,
        }),
      });
    }

    case "localBusiness": {
      const d = data.localBusiness;
      return prune({
        "@context": "https://schema.org",
        "@type": d.businessType,
        name: d.name,
        image: d.image,
        telephone: d.telephone,
        priceRange: d.priceRange,
        url: d.url,
        address: prune({
          "@type": "PostalAddress",
          streetAddress: d.streetAddress,
          addressLocality: d.addressLocality,
          addressRegion: d.addressRegion,
          postalCode: d.postalCode,
          addressCountry: d.addressCountry,
        }),
        geo: d.latitude && d.longitude ? { "@type": "GeoCoordinates", latitude: d.latitude, longitude: d.longitude } : undefined,
        openingHours: d.openingHours,
      });
    }

    case "product": {
      const d = data.product;
      const validReviews = d.reviews.filter((r) => r.authorName.trim() !== "");
      return prune({
        "@context": "https://schema.org",
        "@type": "Product",
        name: d.name,
        image: d.image ? [d.image] : undefined,
        description: d.description,
        sku: d.sku,
        gtin: d.gtin,
        brand: d.brand ? { "@type": "Brand", name: d.brand } : undefined,
        offers: prune({
          "@type": "Offer",
          price: d.price,
          priceCurrency: d.priceCurrency,
          priceValidUntil: d.priceValidUntil,
          availability: `https://schema.org/${d.availability}`,
        }),
        aggregateRating: d.ratingValue && d.reviewCount
          ? { "@type": "AggregateRating", ratingValue: d.ratingValue, reviewCount: d.reviewCount }
          : undefined,
        review:
          validReviews.length > 0
            ? validReviews.map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.authorName },
                reviewBody: r.reviewBody,
                reviewRating: { "@type": "Rating", ratingValue: r.ratingValue },
              }))
            : undefined,
      });
    }

    case "softwareApp": {
      const d = data.softwareApp;
      return prune({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: d.name,
        operatingSystem: d.operatingSystem,
        applicationCategory: d.applicationCategory,
        description: d.description,
        offers: prune({ "@type": "Offer", price: d.price, priceCurrency: d.priceCurrency }),
        aggregateRating: d.ratingValue && d.ratingCount
          ? { "@type": "AggregateRating", ratingValue: d.ratingValue, ratingCount: d.ratingCount }
          : undefined,
      });
    }

    case "person": {
      const d = data.person;
      const validSocials = d.sameAs.filter((s) => s.trim() !== "");
      return prune({
        "@context": "https://schema.org",
        "@type": "Person",
        name: d.name,
        jobTitle: d.jobTitle,
        worksFor: d.worksFor ? { "@type": "Organization", name: d.worksFor } : undefined,
        url: d.url,
        image: d.image,
        sameAs: validSocials.length > 0 ? validSocials : undefined,
      });
    }

    case "event": {
      const d = data.event;
      return prune({
        "@context": "https://schema.org",
        "@type": "Event",
        name: d.name,
        description: d.description,
        startDate: d.startDate,
        endDate: d.endDate,
        image: d.image ? [d.image] : undefined,
        location: prune({ "@type": "Place", name: d.locationName, address: d.locationAddress }),
        performer: d.performerName ? { "@type": "PerformingGroup", name: d.performerName } : undefined,
        offers: prune({
          "@type": "Offer",
          price: d.price,
          priceCurrency: d.priceCurrency,
          availability: `https://schema.org/${d.availability}`,
        }),
      });
    }

    case "review": {
      const d = data.review;
      return prune({
        "@context": "https://schema.org",
        "@type": "Review",
        itemReviewed: { "@type": d.itemType, name: d.itemName },
        author: { "@type": "Person", name: d.authorName },
        reviewBody: d.reviewBody,
        datePublished: d.datePublished,
        reviewRating: prune({ "@type": "Rating", ratingValue: d.ratingValue, bestRating: d.bestRating }),
      });
    }

    case "howTo": {
      const d = data.howTo;
      return prune({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: d.name,
        description: d.description,
        totalTime: d.totalTime,
        supply: d.supplies.filter((s) => s.trim() !== "").map((s) => ({ "@type": "HowToSupply", name: s })),
        tool: d.tools.filter((t) => t.trim() !== "").map((t) => ({ "@type": "HowToTool", name: t })),
        step: d.steps
          .filter((s) => s.name.trim() !== "")
          .map((s) => ({ "@type": "HowToStep", name: s.name, text: s.text })),
      });
    }

    case "videoObject": {
      const d = data.videoObject;
      return prune({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: d.name,
        description: d.description,
        thumbnailUrl: d.thumbnailUrl ? [d.thumbnailUrl] : undefined,
        uploadDate: d.uploadDate,
        duration: d.duration,
        contentUrl: d.contentUrl,
      });
    }

    case "recipe": {
      const d = data.recipe;
      return prune({
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: d.name,
        image: d.image ? [d.image] : undefined,
        author: { "@type": "Person", name: d.authorName },
        description: d.description,
        prepTime: d.prepTime,
        cookTime: d.cookTime,
        totalTime: d.totalTime,
        recipeYield: d.recipeYield,
        nutrition: d.calories ? { "@type": "NutritionInformation", calories: `${d.calories} calories` } : undefined,
        recipeIngredient: d.ingredients.filter((i) => i.trim() !== ""),
        recipeInstructions: d.instructions
          .filter((i) => i.trim() !== "")
          .map((text) => ({ "@type": "HowToStep", text })),
      });
    }

    case "jobPosting": {
      const d = data.jobPosting;
      return prune({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: d.title,
        description: d.description,
        datePosted: d.datePosted,
        validThrough: d.validThrough,
        employmentType: d.employmentType,
        hiringOrganization: prune({ "@type": "Organization", name: d.hiringOrgName, sameAs: d.hiringOrgUrl, logo: d.hiringOrgLogo }),
        jobLocationType: d.remote === "remote" ? "TELECOMMUTE" : undefined,
        jobLocation:
          d.remote === "remote"
            ? undefined
            : {
                "@type": "Place",
                address: prune({
                  "@type": "PostalAddress",
                  streetAddress: d.streetAddress,
                  addressLocality: d.addressLocality,
                  addressRegion: d.addressRegion,
                  postalCode: d.postalCode,
                  addressCountry: d.addressCountry,
                }),
              },
        baseSalary:
          d.salaryMin && d.salaryMax
            ? {
                "@type": "MonetaryAmount",
                currency: d.salaryCurrency,
                value: { "@type": "QuantitativeValue", minValue: d.salaryMin, maxValue: d.salaryMax, unitText: "YEAR" },
              }
            : undefined,
      });
    }

    case "course": {
      const d = data.course;
      return prune({
        "@context": "https://schema.org",
        "@type": "Course",
        name: d.name,
        description: d.description,
        provider: prune({ "@type": "Organization", name: d.providerName, url: d.providerUrl }),
        hasCourseInstance: prune({
          "@type": "CourseInstance",
          courseMode: d.courseMode,
          startDate: d.startDate,
          endDate: d.endDate,
        }),
        offers: d.price ? prune({ "@type": "Offer", price: d.price, priceCurrency: d.priceCurrency }) : undefined,
      });
    }

    case "service": {
      const d = data.service;
      return prune({
        "@context": "https://schema.org",
        "@type": "Service",
        name: d.name,
        serviceType: d.serviceType,
        description: d.description,
        provider: prune({ "@type": "Organization", name: d.providerName }),
        areaServed: d.areaServed,
        offers: d.price ? prune({ "@type": "Offer", price: d.price, priceCurrency: d.priceCurrency }) : undefined,
      });
    }

    case "qaPage": {
      const d = data.qaPage;
      return prune({
        "@context": "https://schema.org",
        "@type": "QAPage",
        mainEntity: prune({
          "@type": "Question",
          name: d.question,
          text: d.questionBody,
          answerCount: 1,
          acceptedAnswer: prune({
            "@type": "Answer",
            text: d.answerText,
            dateCreated: d.answerDateCreated,
            upvoteCount: d.upvoteCount,
            author: d.answerAuthorName ? { "@type": "Person", name: d.answerAuthorName } : undefined,
          }),
        }),
      });
    }

    case "dataset": {
      const d = data.dataset;
      return prune({
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: d.name,
        description: d.description,
        url: d.url,
        license: d.license,
        datePublished: d.datePublished,
        keywords: d.keywords.filter((k) => k.trim() !== ""),
        creator: d.creatorName ? { "@type": "Organization", name: d.creatorName } : undefined,
      });
    }

    case "movie": {
      const d = data.movie;
      const validActors = d.actors.filter((a) => a.trim() !== "");
      return prune({
        "@context": "https://schema.org",
        "@type": "Movie",
        name: d.name,
        image: d.image,
        description: d.description,
        duration: d.duration,
        datePublished: d.datePublished,
        director: d.director ? { "@type": "Person", name: d.director } : undefined,
        actor: validActors.length > 0 ? validActors.map((name) => ({ "@type": "Person", name })) : undefined,
        aggregateRating: d.ratingValue && d.ratingCount
          ? { "@type": "AggregateRating", ratingValue: d.ratingValue, ratingCount: d.ratingCount }
          : undefined,
      });
    }

    case "book": {
      const d = data.book;
      return prune({
        "@context": "https://schema.org",
        "@type": "Book",
        name: d.name,
        image: d.image,
        description: d.description,
        isbn: d.isbn,
        datePublished: d.datePublished,
        bookFormat: `https://schema.org/${d.bookFormat}`,
        author: d.authorName ? { "@type": "Person", name: d.authorName } : undefined,
        publisher: d.publisherName ? { "@type": "Organization", name: d.publisherName } : undefined,
        aggregateRating: d.ratingValue && d.ratingCount
          ? { "@type": "AggregateRating", ratingValue: d.ratingValue, ratingCount: d.ratingCount }
          : undefined,
      });
    }

    default:
      return {};
  }
}
