"use client";

import type { SchemaFormData, SchemaType } from "@/lib/tools/schemaTemplates";
import { CheckRingIcon } from "@/components/tools/shared/icons/SchemaIcons";

type PreviewModel = {
  title: string;
  url: string;
  description: string;
  rating?: { value: string; count: string };
  price?: string;
  faqRows?: { question: string; answer: string }[];
  breadcrumb?: string[];
};

function buildPreview<T extends SchemaType>(type: T, data: SchemaFormData[T]): PreviewModel {
  switch (type) {
    case "product": {
      const d = data as SchemaFormData["product"];
      return {
        title: d.name || "Your Product",
        url: "yourbrand.com › products",
        description: d.description || "Product description appears here.",
        rating: d.ratingValue && d.reviewCount ? { value: d.ratingValue, count: d.reviewCount } : undefined,
        price: d.price ? `${d.priceCurrency} ${d.price}` : undefined,
      };
    }
    case "localBusiness": {
      const d = data as SchemaFormData["localBusiness"];
      return {
        title: d.name || "Your Business",
        url: "yourbrand.com",
        description: [d.streetAddress, d.addressLocality, d.priceRange].filter(Boolean).join(" · ") || "Business address appears here.",
      };
    }
    case "article": {
      const d = data as SchemaFormData["article"];
      return {
        title: d.headline || "Your Headline",
        url: "yourbrand.com › blog",
        description: d.description || `By ${d.authorName || "Author"}`,
      };
    }
    case "faq": {
      const d = data as SchemaFormData["faq"];
      const rows = d.faqs.filter((f) => f.question.trim() !== "").slice(0, 3);
      return {
        title: "Your Page",
        url: "yourbrand.com",
        description: "Frequently asked questions appear as an expandable list.",
        faqRows: rows.map((f) => ({ question: f.question, answer: f.answer })),
      };
    }
    case "breadcrumb": {
      const d = data as SchemaFormData["breadcrumb"];
      return {
        title: d.items[d.items.length - 1]?.name || "Your Page",
        url: "yourbrand.com",
        description: "Breadcrumb trail appears above the result title.",
        breadcrumb: d.items.filter((i) => i.name.trim() !== "").map((i) => i.name),
      };
    }
    case "organization": {
      const d = data as SchemaFormData["organization"];
      return { title: d.name || "Your Organization", url: d.url || "yourbrand.com", description: d.description || "Organization description appears here." };
    }
    case "review": {
      const d = data as SchemaFormData["review"];
      return {
        title: d.itemName || "Item Being Reviewed",
        url: "yourbrand.com",
        description: d.reviewBody || "Review text appears here.",
        rating: d.ratingValue ? { value: d.ratingValue, count: "1" } : undefined,
      };
    }
    case "event": {
      const d = data as SchemaFormData["event"];
      return { title: d.name || "Your Event", url: "yourbrand.com › events", description: [d.startDate, d.locationName].filter(Boolean).join(" · ") };
    }
    case "recipe": {
      const d = data as SchemaFormData["recipe"];
      return { title: d.name || "Your Recipe", url: "yourbrand.com › recipes", description: [d.totalTime, d.calories && `${d.calories} cal`].filter(Boolean).join(" · ") };
    }
    case "jobPosting": {
      const d = data as SchemaFormData["jobPosting"];
      return { title: d.title || "Your Job Posting", url: "yourbrand.com › careers", description: [d.hiringOrgName, d.remote].filter(Boolean).join(" · ") };
    }
    case "course": {
      const d = data as SchemaFormData["course"];
      return { title: d.name || "Your Course", url: "yourbrand.com › courses", description: d.providerName || "Course provider appears here." };
    }
    default: {
      const generic = data as { name?: string; description?: string };
      return { title: generic.name || "Your Page", url: "yourbrand.com", description: generic.description || "Description appears here." };
    }
  }
}

export function RichResultPreview<T extends SchemaType>({ type, data }: { type: T; data: SchemaFormData[T] }) {
  const preview = buildPreview(type, data);

  return (
    <div className="rounded-2xl border border-foreground/10 bg-white p-5">
      <p className="mb-3 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-foreground/40">
        Search result preview
      </p>

      {preview.breadcrumb && preview.breadcrumb.length > 0 ? (
        <p className="mb-1 font-body text-xs text-foreground/50">{preview.breadcrumb.join(" › ")}</p>
      ) : (
        <p className="mb-1 font-body text-xs text-foreground/40">{preview.url}</p>
      )}

      <p className="font-body text-lg text-[#1a0dab]">{preview.title}</p>

      {preview.rating ? (
        <div className="my-1 flex items-center gap-1 text-primary">
          {Array.from({ length: 5 }).map((_, i) => (
            <CheckRingIcon key={i} className="h-3.5 w-3.5" />
          ))}
          <span className="ml-1 font-body text-xs text-foreground/50">
            {preview.rating.value} · {preview.rating.count} reviews
          </span>
          {preview.price ? <span className="ml-2 font-body text-xs text-foreground/50">{preview.price}</span> : null}
        </div>
      ) : null}

      <p className="font-body text-sm text-foreground/60">{preview.description}</p>

      {preview.faqRows && preview.faqRows.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t border-foreground/10 pt-3">
          {preview.faqRows.map((row, i) => (
            <p key={i} className="font-body text-sm text-foreground">
              {row.question} <span className="text-foreground/30">›</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
