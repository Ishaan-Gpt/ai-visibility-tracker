"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SchemaType } from "@/lib/tools/schemaTemplates";
import { SectionShell } from "@/components/tools/shared/layout/SectionShell";
import { RevealText } from "@/components/tools/shared/motion/RevealText";
import { TypeCard } from "@/components/tools/schema-generator/onboarding/TypeCard";
import {
  OrganizationIcon,
  LocalBusinessIcon,
  ArticleIcon,
  FaqIcon,
  HowToIcon,
  ProductIcon,
  PersonIcon,
  GraphIcon,
  EventIcon,
  ReviewIcon,
  VideoIcon,
  RecipeIcon,
  WebsiteIcon,
  JobPostingIcon,
  CourseIcon,
  ServiceIcon,
  QAPageIcon,
  DatasetIcon,
  MovieIcon,
  BookIcon,
} from "@/components/tools/shared/icons/SchemaIcons";

type OnboardingPickerProps = {
  onSelect: (types: SchemaType[], opts?: { withReviews?: boolean }) => void;
  onValidateExisting: () => void;
};

const GROUPS: {
  id: string;
  label: string;
  cards: { type: SchemaType; icon: typeof OrganizationIcon; title: string; description: string }[];
}[] = [
  {
    id: "business",
    label: "I run a business",
    cards: [
      { type: "organization", icon: OrganizationIcon, title: "Organization", description: "Your company's core identity entity." },
      { type: "localBusiness", icon: LocalBusinessIcon, title: "LocalBusiness", description: "Physical location, hours, and address." },
      { type: "service", icon: ServiceIcon, title: "Service", description: "A service you offer, with provider and area served." },
    ],
  },
  {
    id: "content",
    label: "I publish content",
    cards: [
      { type: "article", icon: ArticleIcon, title: "Article", description: "Blog posts, news, and long-form writing." },
      { type: "faq", icon: FaqIcon, title: "FAQPage", description: "Question-and-answer content blocks." },
      { type: "howTo", icon: HowToIcon, title: "HowTo", description: "Step-by-step instructional content." },
      { type: "course", icon: CourseIcon, title: "Course", description: "An online, onsite, or blended course." },
      { type: "qaPage", icon: QAPageIcon, title: "QAPage", description: "A single question with a community-style answer." },
    ],
  },
  {
    id: "hiring",
    label: "I'm hiring",
    cards: [{ type: "jobPosting", icon: JobPostingIcon, title: "JobPosting", description: "Role, location, salary, and employment type." }],
  },
  {
    id: "person",
    label: "I'm a person or brand",
    cards: [{ type: "person", icon: PersonIcon, title: "Person", description: "Founder, author, or public profile." }],
  },
  {
    id: "more",
    label: "Something else",
    cards: [
      { type: "website", icon: WebsiteIcon, title: "WebSite", description: "Site-wide entity with search action." },
      { type: "event", icon: EventIcon, title: "Event", description: "Dates, location, and ticketing." },
      { type: "review", icon: ReviewIcon, title: "Review", description: "A standalone review of an entity." },
      { type: "videoObject", icon: VideoIcon, title: "VideoObject", description: "Hosted or embedded video content." },
      { type: "recipe", icon: RecipeIcon, title: "Recipe", description: "Ingredients, steps, and nutrition." },
      { type: "dataset", icon: DatasetIcon, title: "Dataset", description: "A downloadable or referenced data collection." },
      { type: "movie", icon: MovieIcon, title: "Movie", description: "Cast, director, and rating for a film." },
      { type: "book", icon: BookIcon, title: "Book", description: "Author, ISBN, and format details." },
    ],
  },
];

export function OnboardingPicker({ onSelect, onValidateExisting }: OnboardingPickerProps) {
  const [productExpanded, setProductExpanded] = useState(false);

  return (
    <SectionShell height="full" className="items-center">
      <div className="mb-14 max-w-xl">
        <p className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-primary md:whitespace-nowrap">
          Step 1 of 2
        </p>
        <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
          <RevealText text="What are you marking up?" />
        </h1>
      </div>

      <div className="space-y-10">
        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">
            I want the full site foundation
          </p>
          <TypeCard
            layoutId="type-card-foundation"
            icon={GraphIcon}
            title="Organization + WebSite + Breadcrumb"
            description="The composed @graph bundle most sites should start with — linked, not duplicated."
            onClick={() => onSelect(["organization", "website", "breadcrumb"])}
          />
        </div>

        {GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-4 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">{group.label}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.cards.map((card) => (
                <TypeCard
                  key={card.type}
                  layoutId={`type-card-${card.type}`}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  onClick={() => onSelect([card.type])}
                />
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-4 font-body text-xs uppercase tracking-[0.1em] text-foreground/40">I sell things</p>
          <AnimatePresence mode="wait">
            {!productExpanded ? (
              <motion.div key="collapsed" exit={{ opacity: 0 }}>
                <TypeCard
                  layoutId="type-card-product"
                  icon={ProductIcon}
                  title="Product"
                  description="Price, availability, brand, and reviews."
                  onClick={() => setProductExpanded(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                <TypeCard
                  layoutId="type-card-product-basic"
                  icon={ProductIcon}
                  title="Just the product"
                  description="Name, price, availability, and image."
                  onClick={() => onSelect(["product"])}
                />
                <TypeCard
                  layoutId="type-card-product-reviews"
                  icon={ReviewIcon}
                  title="Product + reviews"
                  description="Adds a rating and review block for star eligibility."
                  onClick={() => onSelect(["product"], { withReviews: true })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-foreground/10 pt-8">
          <button
            type="button"
            onClick={onValidateExisting}
            className="font-body text-sm text-foreground/50 hover:text-primary"
          >
            Already have JSON-LD? Validate it instead →
          </button>
        </div>
      </div>
    </SectionShell>
  );
}
