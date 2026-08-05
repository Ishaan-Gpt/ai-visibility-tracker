"use client";

import type { SchemaFormData, SchemaType } from "@/lib/tools/schemaTemplates";
import {
  FieldGroup,
  TextField,
  TextAreaField,
  SelectField,
  StringListField,
} from "@/components/tools/schema-generator/workspace/fields/FormFields";

type SchemaFieldFormProps<T extends SchemaType> = {
  type: T;
  data: SchemaFormData[T];
  onChange: (next: SchemaFormData[T]) => void;
};

export function SchemaFieldForm<T extends SchemaType>({ type, data, onChange }: SchemaFieldFormProps<T>) {
  switch (type) {
    case "organization": {
      const d = data as SchemaFormData["organization"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="URL" value={d.url} onChange={(v) => set({ url: v })} />
            <div className="sm:col-span-2">
              <TextField label="Logo URL" value={d.logo} onChange={(v) => set({ logo: v })} hint="Minimum 112×112px for the Knowledge Panel." />
            </div>
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Email" value={d.email} onChange={(v) => set({ email: v })} />
            <TextField label="Telephone" value={d.telephone} onChange={(v) => set({ telephone: v })} />
            <div className="sm:col-span-2">
              <StringListField label="Social profiles (sameAs)" values={d.sameAs} onChange={(v) => set({ sameAs: v })} placeholder="https://twitter.com/yourbrand" />
            </div>
          </FieldGroup>
        </>
      );
    }

    case "website": {
      const d = data as SchemaFormData["website"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="URL" value={d.url} onChange={(v) => set({ url: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextField
                label="Site search URL template"
                value={d.searchUrlTemplate}
                onChange={(v) => set({ searchUrlTemplate: v })}
                placeholder="https://yoursite.com/search?q={search_term_string}"
                hint="Leave blank to omit the SearchAction — only include if this URL pattern really works."
              />
            </div>
          </FieldGroup>
        </>
      );
    }

    case "breadcrumb": {
      const d = data as SchemaFormData["breadcrumb"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <FieldGroup title="Trail (in order)">
          <div className="sm:col-span-2 space-y-3">
            {d.items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item.name}
                  placeholder="Page name"
                  onChange={(e) => {
                    const items = [...d.items];
                    items[i] = { ...items[i], name: e.target.value };
                    set({ items });
                  }}
                  className="w-1/3 rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                />
                <input
                  value={item.url}
                  placeholder="URL"
                  onChange={(e) => {
                    const items = [...d.items];
                    items[i] = { ...items[i], url: e.target.value };
                    set({ items });
                  }}
                  className="flex-1 rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                />
                <button
                  type="button"
                  onClick={() => set({ items: d.items.filter((_, idx) => idx !== i) })}
                  className="shrink-0 rounded-lg border border-foreground/15 px-3 text-foreground/50 hover:text-foreground"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ items: [...d.items, { name: "", url: "" }] })}
              className="font-body text-xs text-primary hover:underline"
            >
              + Add level
            </button>
          </div>
        </FieldGroup>
      );
    }

    case "faq": {
      const d = data as SchemaFormData["faq"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <FieldGroup title="Questions">
          <div className="sm:col-span-2 space-y-4">
            {d.faqs.map((faq, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-foreground/10 p-4">
                <div className="flex items-start gap-2">
                  <input
                    value={faq.question}
                    placeholder="Question"
                    onChange={(e) => {
                      const faqs = [...d.faqs];
                      faqs[i] = { ...faqs[i], question: e.target.value };
                      set({ faqs });
                    }}
                    className="flex-1 rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => set({ faqs: d.faqs.filter((_, idx) => idx !== i) })}
                    className="shrink-0 rounded-lg border border-foreground/15 px-3 text-foreground/50 hover:text-foreground"
                  >
                    &times;
                  </button>
                </div>
                <textarea
                  value={faq.answer}
                  placeholder="Answer"
                  rows={2}
                  onChange={(e) => {
                    const faqs = [...d.faqs];
                    faqs[i] = { ...faqs[i], answer: e.target.value };
                    set({ faqs });
                  }}
                  className="w-full resize-none rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ faqs: [...d.faqs, { question: "", answer: "" }] })}
              className="font-body text-xs text-primary hover:underline"
            >
              + Add question
            </button>
          </div>
        </FieldGroup>
      );
    }

    case "article": {
      const d = data as SchemaFormData["article"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <div className="sm:col-span-2">
              <TextField label="Headline" value={d.headline} onChange={(v) => set({ headline: v })} />
            </div>
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} hint="Minimum 1200px wide." />
            <TextField label="Author name" value={d.authorName} onChange={(v) => set({ authorName: v })} />
            <TextField label="Date published" value={d.datePublished} onChange={(v) => set({ datePublished: v })} placeholder="YYYY-MM-DD" />
            <SelectField label="Author type" value={d.authorType} onChange={(v) => set({ authorType: v as typeof d.authorType })} options={["Person", "Organization"]} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Publisher name" value={d.publisherName} onChange={(v) => set({ publisherName: v })} />
            <TextField label="Publisher logo URL" value={d.publisherLogo} onChange={(v) => set({ publisherLogo: v })} />
            <TextField label="Date modified" value={d.dateModified} onChange={(v) => set({ dateModified: v })} />
            <TextField label="Canonical page URL" value={d.mainEntityOfPageUrl} onChange={(v) => set({ mainEntityOfPageUrl: v })} />
          </FieldGroup>
        </>
      );
    }

    case "localBusiness": {
      const d = data as SchemaFormData["localBusiness"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <SelectField
              label="Business subtype"
              value={d.businessType}
              onChange={(v) => set({ businessType: v as typeof d.businessType })}
              options={["LocalBusiness", "Restaurant", "Store", "ProfessionalService"]}
              hint="Pick a specific subtype where possible — Google keys rich results off it."
            />
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Street address" value={d.streetAddress} onChange={(v) => set({ streetAddress: v })} />
            <TextField label="City" value={d.addressLocality} onChange={(v) => set({ addressLocality: v })} />
            <TextField label="Region/State" value={d.addressRegion} onChange={(v) => set({ addressRegion: v })} />
            <TextField label="Postal code" value={d.postalCode} onChange={(v) => set({ postalCode: v })} />
            <TextField label="Country" value={d.addressCountry} onChange={(v) => set({ addressCountry: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <TextField label="Phone" value={d.telephone} onChange={(v) => set({ telephone: v })} />
            <TextField label="Price range" value={d.priceRange} onChange={(v) => set({ priceRange: v })} placeholder="$$" />
            <TextField label="Latitude" value={d.latitude} onChange={(v) => set({ latitude: v })} />
            <TextField label="Longitude" value={d.longitude} onChange={(v) => set({ longitude: v })} />
            <TextField label="Opening hours" value={d.openingHours} onChange={(v) => set({ openingHours: v })} placeholder="Mo-Fr 09:00-18:00" />
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} />
          </FieldGroup>
        </>
      );
    }

    case "product": {
      const d = data as SchemaFormData["product"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} />
            <TextField label="Price" value={d.price} onChange={(v) => set({ price: v })} />
            <TextField label="Currency" value={d.priceCurrency} onChange={(v) => set({ priceCurrency: v })} placeholder="USD" />
            <SelectField
              label="Availability"
              value={d.availability}
              onChange={(v) => set({ availability: v as typeof d.availability })}
              options={["InStock", "OutOfStock", "PreOrder", "LimitedAvailability", "Discontinued"]}
            />
            <TextField label="Rating value" value={d.ratingValue} onChange={(v) => set({ ratingValue: v })} hint="Or add a review below — one is required." />
            <TextField label="Review count" value={d.reviewCount} onChange={(v) => set({ reviewCount: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Brand" value={d.brand} onChange={(v) => set({ brand: v })} />
            <TextField label="SKU" value={d.sku} onChange={(v) => set({ sku: v })} />
            <TextField label="GTIN" value={d.gtin} onChange={(v) => set({ gtin: v })} />
            <TextField label="Price valid until" value={d.priceValidUntil} onChange={(v) => set({ priceValidUntil: v })} placeholder="YYYY-MM-DD" />
          </FieldGroup>
          <FieldGroup title="Reviews">
            <div className="sm:col-span-2 space-y-3">
              {d.reviews.map((r, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-foreground/10 p-3 sm:grid-cols-3">
                  <input
                    value={r.authorName}
                    placeholder="Reviewer name"
                    onChange={(e) => {
                      const reviews = [...d.reviews];
                      reviews[i] = { ...reviews[i], authorName: e.target.value };
                      set({ reviews });
                    }}
                    className="rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                  />
                  <input
                    value={r.ratingValue}
                    placeholder="Rating (1-5)"
                    onChange={(e) => {
                      const reviews = [...d.reviews];
                      reviews[i] = { ...reviews[i], ratingValue: e.target.value };
                      set({ reviews });
                    }}
                    className="rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                  />
                  <input
                    value={r.reviewBody}
                    placeholder="Review text"
                    onChange={(e) => {
                      const reviews = [...d.reviews];
                      reviews[i] = { ...reviews[i], reviewBody: e.target.value };
                      set({ reviews });
                    }}
                    className="rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ reviews: [...d.reviews, { authorName: "", reviewBody: "", ratingValue: "" }] })}
                className="font-body text-xs text-primary hover:underline"
              >
                + Add review
              </button>
            </div>
          </FieldGroup>
        </>
      );
    }

    case "softwareApp": {
      const d = data as SchemaFormData["softwareApp"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Operating system" value={d.operatingSystem} onChange={(v) => set({ operatingSystem: v })} />
            <TextField label="Application category" value={d.applicationCategory} onChange={(v) => set({ applicationCategory: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Price" value={d.price} onChange={(v) => set({ price: v })} />
            <TextField label="Currency" value={d.priceCurrency} onChange={(v) => set({ priceCurrency: v })} />
            <TextField label="Rating value" value={d.ratingValue} onChange={(v) => set({ ratingValue: v })} />
            <TextField label="Rating count" value={d.ratingCount} onChange={(v) => set({ ratingCount: v })} />
          </FieldGroup>
        </>
      );
    }

    case "person": {
      const d = data as SchemaFormData["person"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <TextField label="Job title" value={d.jobTitle} onChange={(v) => set({ jobTitle: v })} />
            <TextField label="Works for" value={d.worksFor} onChange={(v) => set({ worksFor: v })} />
            <TextField label="URL" value={d.url} onChange={(v) => set({ url: v })} />
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} />
            <div className="sm:col-span-2">
              <StringListField label="Social profiles (sameAs)" values={d.sameAs} onChange={(v) => set({ sameAs: v })} />
            </div>
          </FieldGroup>
        </>
      );
    }

    case "event": {
      const d = data as SchemaFormData["event"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Start date" value={d.startDate} onChange={(v) => set({ startDate: v })} placeholder="YYYY-MM-DDThh:mm" />
            <TextField label="Location name" value={d.locationName} onChange={(v) => set({ locationName: v })} />
            <TextField label="Location address" value={d.locationAddress} onChange={(v) => set({ locationAddress: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="End date" value={d.endDate} onChange={(v) => set({ endDate: v })} />
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} />
            <TextField label="Price" value={d.price} onChange={(v) => set({ price: v })} />
            <TextField label="Currency" value={d.priceCurrency} onChange={(v) => set({ priceCurrency: v })} />
          </FieldGroup>
        </>
      );
    }

    case "review": {
      const d = data as SchemaFormData["review"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Item being reviewed" value={d.itemName} onChange={(v) => set({ itemName: v })} />
            <TextField label="Item type" value={d.itemType} onChange={(v) => set({ itemType: v })} placeholder="Product, SoftwareApplication…" />
            <TextField label="Author" value={d.authorName} onChange={(v) => set({ authorName: v })} />
            <TextField label="Rating value" value={d.ratingValue} onChange={(v) => set({ ratingValue: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Review body" value={d.reviewBody} onChange={(v) => set({ reviewBody: v })} />
            </div>
            <TextField label="Best rating" value={d.bestRating} onChange={(v) => set({ bestRating: v })} />
            <TextField label="Date published" value={d.datePublished} onChange={(v) => set({ datePublished: v })} />
          </FieldGroup>
        </>
      );
    }

    case "howTo": {
      const d = data as SchemaFormData["howTo"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <div className="sm:col-span-2">
              <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            </div>
            <div className="sm:col-span-2 space-y-3">
              {d.steps.map((step, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-foreground/10 p-3">
                  <input
                    value={step.name}
                    placeholder={`Step ${i + 1} title`}
                    onChange={(e) => {
                      const steps = [...d.steps];
                      steps[i] = { ...steps[i], name: e.target.value };
                      set({ steps });
                    }}
                    className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                  />
                  <textarea
                    value={step.text}
                    placeholder="Step detail"
                    rows={2}
                    onChange={(e) => {
                      const steps = [...d.steps];
                      steps[i] = { ...steps[i], text: e.target.value };
                      set({ steps });
                    }}
                    className="w-full resize-none rounded-lg border border-foreground/15 bg-background px-3 py-2 font-body text-sm"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ steps: [...d.steps, { name: "", text: "" }] })}
                className="font-body text-xs text-primary hover:underline"
              >
                + Add step
              </button>
            </div>
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Total time" value={d.totalTime} onChange={(v) => set({ totalTime: v })} placeholder="PT10M" />
            <div className="sm:col-span-2">
              <StringListField label="Supplies" values={d.supplies} onChange={(v) => set({ supplies: v })} />
            </div>
            <div className="sm:col-span-2">
              <StringListField label="Tools" values={d.tools} onChange={(v) => set({ tools: v })} />
            </div>
          </FieldGroup>
        </>
      );
    }

    case "videoObject": {
      const d = data as SchemaFormData["videoObject"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Thumbnail URL" value={d.thumbnailUrl} onChange={(v) => set({ thumbnailUrl: v })} />
            <TextField label="Upload date" value={d.uploadDate} onChange={(v) => set({ uploadDate: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Duration" value={d.duration} onChange={(v) => set({ duration: v })} placeholder="PT4M32S" />
            <TextField label="Content URL" value={d.contentUrl} onChange={(v) => set({ contentUrl: v })} />
          </FieldGroup>
        </>
      );
    }

    case "recipe": {
      const d = data as SchemaFormData["recipe"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} />
            <div className="sm:col-span-2">
              <StringListField label="Ingredients" values={d.ingredients} onChange={(v) => set({ ingredients: v })} />
            </div>
            <div className="sm:col-span-2">
              <StringListField label="Instructions" values={d.instructions} onChange={(v) => set({ instructions: v })} />
            </div>
          </FieldGroup>
          <FieldGroup title="Recommended">
            <TextField label="Author" value={d.authorName} onChange={(v) => set({ authorName: v })} />
            <TextField label="Total time" value={d.totalTime} onChange={(v) => set({ totalTime: v })} placeholder="PT45M" />
            <TextField label="Prep time" value={d.prepTime} onChange={(v) => set({ prepTime: v })} />
            <TextField label="Cook time" value={d.cookTime} onChange={(v) => set({ cookTime: v })} />
            <TextField label="Yield" value={d.recipeYield} onChange={(v) => set({ recipeYield: v })} />
            <TextField label="Calories" value={d.calories} onChange={(v) => set({ calories: v })} />
          </FieldGroup>
        </>
      );
    }

    case "jobPosting": {
      const d = data as SchemaFormData["jobPosting"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <div className="sm:col-span-2">
              <TextField label="Job title" value={d.title} onChange={(v) => set({ title: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Date posted" value={d.datePosted} onChange={(v) => set({ datePosted: v })} placeholder="YYYY-MM-DD" />
            <TextField label="Hiring organization" value={d.hiringOrgName} onChange={(v) => set({ hiringOrgName: v })} />
            <SelectField
              label="Work location"
              value={d.remote}
              onChange={(v) => set({ remote: v as typeof d.remote })}
              options={["onsite", "remote", "hybrid"]}
            />
            {d.remote !== "remote" ? (
              <>
                <TextField label="City" value={d.addressLocality} onChange={(v) => set({ addressLocality: v })} />
                <TextField label="Country" value={d.addressCountry} onChange={(v) => set({ addressCountry: v })} />
              </>
            ) : null}
          </FieldGroup>
          <FieldGroup title="Recommended">
            <SelectField
              label="Employment type"
              value={d.employmentType}
              onChange={(v) => set({ employmentType: v as typeof d.employmentType })}
              options={["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER"]}
            />
            <TextField label="Valid through" value={d.validThrough} onChange={(v) => set({ validThrough: v })} />
            <TextField label="Min salary" value={d.salaryMin} onChange={(v) => set({ salaryMin: v })} />
            <TextField label="Max salary" value={d.salaryMax} onChange={(v) => set({ salaryMax: v })} />
            <TextField label="Salary currency" value={d.salaryCurrency} onChange={(v) => set({ salaryCurrency: v })} />
          </FieldGroup>
        </>
      );
    }

    case "course": {
      const d = data as SchemaFormData["course"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Provider" value={d.providerName} onChange={(v) => set({ providerName: v })} />
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
          </FieldGroup>
          <FieldGroup title="Recommended">
            <SelectField
              label="Course mode"
              value={d.courseMode}
              onChange={(v) => set({ courseMode: v as typeof d.courseMode })}
              options={["Online", "Onsite", "Blended"]}
            />
            <TextField label="Provider URL" value={d.providerUrl} onChange={(v) => set({ providerUrl: v })} />
            <TextField label="Start date" value={d.startDate} onChange={(v) => set({ startDate: v })} />
            <TextField label="End date" value={d.endDate} onChange={(v) => set({ endDate: v })} />
            <TextField label="Price" value={d.price} onChange={(v) => set({ price: v })} />
            <TextField label="Currency" value={d.priceCurrency} onChange={(v) => set({ priceCurrency: v })} />
          </FieldGroup>
        </>
      );
    }

    case "service": {
      const d = data as SchemaFormData["service"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Service type" value={d.serviceType} onChange={(v) => set({ serviceType: v })} />
            <TextField label="Provider" value={d.providerName} onChange={(v) => set({ providerName: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Area served" value={d.areaServed} onChange={(v) => set({ areaServed: v })} />
            <TextField label="Price" value={d.price} onChange={(v) => set({ price: v })} />
            <TextField label="Currency" value={d.priceCurrency} onChange={(v) => set({ priceCurrency: v })} />
          </FieldGroup>
        </>
      );
    }

    case "qaPage": {
      const d = data as SchemaFormData["qaPage"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <div className="sm:col-span-2">
              <TextField label="Question" value={d.question} onChange={(v) => set({ question: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Accepted answer" value={d.answerText} onChange={(v) => set({ answerText: v })} />
            </div>
          </FieldGroup>
          <FieldGroup title="Recommended">
            <TextAreaField label="Question detail" value={d.questionBody} onChange={(v) => set({ questionBody: v })} />
            <TextField label="Answer author" value={d.answerAuthorName} onChange={(v) => set({ answerAuthorName: v })} />
            <TextField label="Date created" value={d.answerDateCreated} onChange={(v) => set({ answerDateCreated: v })} />
            <TextField label="Upvote count" value={d.upvoteCount} onChange={(v) => set({ upvoteCount: v })} />
          </FieldGroup>
        </>
      );
    }

    case "dataset": {
      const d = data as SchemaFormData["dataset"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
          </FieldGroup>
          <FieldGroup title="Recommended">
            <TextField label="URL" value={d.url} onChange={(v) => set({ url: v })} />
            <TextField label="License URL" value={d.license} onChange={(v) => set({ license: v })} />
            <TextField label="Creator" value={d.creatorName} onChange={(v) => set({ creatorName: v })} />
            <TextField label="Date published" value={d.datePublished} onChange={(v) => set({ datePublished: v })} />
            <div className="sm:col-span-2">
              <StringListField label="Keywords" values={d.keywords} onChange={(v) => set({ keywords: v })} />
            </div>
          </FieldGroup>
        </>
      );
    }

    case "movie": {
      const d = data as SchemaFormData["movie"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="Director" value={d.director} onChange={(v) => set({ director: v })} />
            <TextField label="Date published" value={d.datePublished} onChange={(v) => set({ datePublished: v })} />
            <TextField label="Duration" value={d.duration} onChange={(v) => set({ duration: v })} placeholder="PT1H32M" />
            <TextField label="Rating value" value={d.ratingValue} onChange={(v) => set({ ratingValue: v })} />
            <TextField label="Rating count" value={d.ratingCount} onChange={(v) => set({ ratingCount: v })} />
            <div className="sm:col-span-2">
              <StringListField label="Actors" values={d.actors} onChange={(v) => set({ actors: v })} />
            </div>
          </FieldGroup>
        </>
      );
    }

    case "book": {
      const d = data as SchemaFormData["book"];
      const set = (patch: Partial<typeof d>) => onChange({ ...d, ...patch } as SchemaFormData[T]);
      return (
        <>
          <FieldGroup title="Required">
            <TextField label="Name" value={d.name} onChange={(v) => set({ name: v })} />
            <TextField label="Author" value={d.authorName} onChange={(v) => set({ authorName: v })} />
          </FieldGroup>
          <FieldGroup title="Recommended">
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={d.description} onChange={(v) => set({ description: v })} />
            </div>
            <TextField label="ISBN" value={d.isbn} onChange={(v) => set({ isbn: v })} />
            <TextField label="Image URL" value={d.image} onChange={(v) => set({ image: v })} />
            <TextField label="Publisher" value={d.publisherName} onChange={(v) => set({ publisherName: v })} />
            <TextField label="Date published" value={d.datePublished} onChange={(v) => set({ datePublished: v })} />
            <SelectField
              label="Format"
              value={d.bookFormat}
              onChange={(v) => set({ bookFormat: v as typeof d.bookFormat })}
              options={["Hardcover", "Paperback", "EBook", "AudiobookFormat"]}
            />
            <TextField label="Rating value" value={d.ratingValue} onChange={(v) => set({ ratingValue: v })} />
            <TextField label="Rating count" value={d.ratingCount} onChange={(v) => set({ ratingCount: v })} />
          </FieldGroup>
        </>
      );
    }

    default:
      return null;
  }
}
