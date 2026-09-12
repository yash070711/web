export type NavLink = {
  id: string;
  label: string;
  href: string;
  icon: string;
  studio?: string;
};

export type NavItem = { group: string } | NavLink;

export const NAV: NavItem[] = [
  { group: "HOME" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "house" },
  { group: "PRODUCT STUDIO" },
  { id: "catalogue", label: "Product Catalogue", href: "/catalogue", icon: "book-open" },
  { id: "jurisdiction", label: "Define Jurisdiction", href: "/jurisdiction", icon: "map-pin", studio: "jurisdiction" },
  { id: "coverage", label: "Coverage Studio", href: "/coverage-studio", icon: "umbrella", studio: "coverage" },
  { id: "questionnaire", label: "Questionnaire Studio", href: "/questionnaire-studio", icon: "list-checks", studio: "questionnaire" },
  { id: "risk", label: "Risk Studio", href: "/risk-studio", icon: "warning", studio: "risk" },
  { id: "eligibility", label: "Eligibility Studio", href: "/eligibility-studio", icon: "user-check", studio: "eligibility" },
  { id: "rating", label: "Rating & Pricing Studio", href: "/rating-pricing", icon: "calculator", studio: "rating" },
  { id: "underwriting", label: "Underwriting Rules Studio", href: "/underwriting", icon: "shield-check", studio: "underwriting" },
  { id: "distribution", label: "Distribution Studio", href: "/distribution", icon: "tree-structure", studio: "distribution" },
  { id: "document", label: "Document Studio", href: "/document-studio", icon: "file-text", studio: "document" },
  { group: "GOVERNANCE" },
  { id: "simulation", label: "Simulation & Testing", href: "/simulation", icon: "flask" },
  { id: "governance", label: "Governance", href: "/governance", icon: "git-merge" },
  { id: "audit", label: "Audit Log", href: "/audit-log", icon: "clock-counter" },
  { group: "PLATFORM" },
  { id: "admin", label: "Admin Panel", href: "/admin", icon: "sliders" },
  { id: "pricing-library", label: "Central Pricing Library", href: "/pricing-library", icon: "calculator" },
  { id: "integration", label: "Integration Monitor", href: "/integration", icon: "plugs" },
  { id: "roles", label: "Roles & Access Control", href: "/roles", icon: "users" },
  { id: "glossary", label: "Glossary", href: "/glossary", icon: "book" },
];

export const STUDIO_META: Record<
  string,
  { title: string; collection: string; itemLabel: string; description: string }
> = {
  jurisdiction: {
    title: "Define Jurisdiction",
    collection: "jurisdictions",
    itemLabel: "State",
    description: "US states where this product may be quoted or bound.",
  },
  coverage: {
    title: "Coverage Studio",
    collection: "covers",
    itemLabel: "Cover",
    description: "Covers, limits, deductibles, exclusions and financial terms.",
  },
  questionnaire: {
    title: "Questionnaire Studio",
    collection: "questionGroups",
    itemLabel: "Question group",
    description: "Risk questions the customer answers at quote time.",
  },
  risk: {
    title: "Risk Studio",
    collection: "riskAttributes",
    itemLabel: "Risk attribute",
    description: "Trucking and commercial auto risk data captured at quote.",
  },
  eligibility: {
    title: "Eligibility Studio",
    collection: "eligibilityRules",
    itemLabel: "Rule",
    description: "Who can buy this product, and when a case is referred.",
  },
  rating: {
    title: "Rating & Pricing Studio",
    collection: "ratingComponents",
    itemLabel: "Rating group",
    description: "Base premium, factors, and rating tables.",
  },
  underwriting: {
    title: "Underwriting Rules Studio",
    collection: "underwritingRules",
    itemLabel: "Rule",
    description: "Accept, refer, decline, load, and evidence outcomes.",
  },
  distribution: {
    title: "Distribution Studio",
    collection: "channels",
    itemLabel: "Channel",
    description: "How the product is sold: web, broker, API.",
  },
  document: {
    title: "Document Studio",
    collection: "documents",
    itemLabel: "Document",
    description: "Policy wording, certificates, schedules, and endorsements.",
  },
};

export function productStudioPath(productId: string, studio: string, version?: string) {
  const q = version ? `?version=${encodeURIComponent(version)}` : "";
  if (studio === "simulation") return `/simulation${q}`;
  return `/products/${productId}/${studio}${q}`;
}
