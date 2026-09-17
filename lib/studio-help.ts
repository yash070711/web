export type ModuleHelp = {
  title: string;
  description: string;
  tips?: string[];
};

export const MODULES: Record<string, ModuleHelp> = {
  dashboard: {
    title: "Dashboard",
    description:
      "Your home screen for product lifecycle activity — active products, pending approvals, recent changes, and quick actions to create or test products.",
    tips: [
      "Use Quick Actions to start a new product or run a simulation without opening the catalogue.",
      "KPI cards link directly to filtered catalogue or governance views.",
    ],
  },
  catalogue: {
    title: "Product Catalogue",
    description:
      "Browse, search, and manage all insurance products. Create new products, clone existing ones, export data, and open any product version for configuration.",
    tips: [
      "Product names must be unique across the catalogue.",
      "Clone creates a new product ID while copying configuration from a source version.",
    ],
  },
  "product-detail": {
    title: "Product Detail",
    description:
      "The product hub for a single product version — overview, guide progress, version history, governance actions, and links to every configuration guide.",
    tips: [
      "Each guide shows 0% until you add at least one item, then 100% complete.",
      "Use Clone Version to edit a Published version without affecting live business.",
    ],
  },
  jurisdiction: {
    title: "Define Jurisdiction",
    description:
      "Set where this product may be sold — US states, cities or counties, and territory rules that constrain rating and eligibility downstream.",
    tips: [
      "Select states first; optionally narrow to specific cities within a state.",
      "Empty city selection means the entire state is in scope.",
    ],
  },
  coverage: {
    title: "Coverage Guide",
    description:
      "Define covers (benefits), financial terms, deductibles, sub-limits, dependencies, and claims behaviour for this product version.",
    tips: [
      "Import from the Cover Library to start from a standard template.",
      "Mandatory covers cannot be deselected at quote; optional covers can be add-ons.",
    ],
  },
  questionnaire: {
    title: "Questionnaire Guide",
    description:
      "Build the data capture flow for quoting and underwriting — question groups, field types, validation, evidence triggers, and channel visibility.",
    tips: [
      "Link questions to specific covers so they appear only when relevant.",
      "Evidence triggers prompt document upload when answers meet conditions.",
    ],
  },
  risk: {
    title: "Risk Guide",
    description:
      "Define risk attributes collected at quote or renewal — field types, groups, and sample values used by eligibility, rating, and underwriting rules.",
    tips: [
      "Attributes here become available as rule conditions in other guides.",
      "Use consistent naming so rules reference the same field across modules.",
    ],
  },
  eligibility: {
    title: "Eligibility Guide",
    description:
      "Author rules that accept, decline, refer, or restrict business based on risk data, cover selection, and jurisdiction.",
    tips: [
      "Lower priority numbers evaluate first; adjust when rules conflict.",
      "Use Test Eligibility to validate outcomes before publishing.",
    ],
  },
  rating: {
    title: "Rating & Pricing Guide",
    description:
      "Configure premium calculation — base rates, loadings, discounts, taxes, and rating components tied to covers and risk attributes.",
    tips: [
      "Each component can target a specific cover or apply policy-wide.",
      "Use Price Test to trace how inputs flow through the rating engine.",
    ],
  },
  underwriting: {
    title: "Underwriting Rules Guide",
    description:
      "Define automated underwriting outcomes — referrals, evidence requests, loadings, and restrictions triggered after rating.",
    tips: [
      "Rules complement Eligibility: eligibility gates entry; underwriting shapes terms.",
      "Referral rules route cases to human underwriters with context.",
    ],
  },
  distribution: {
    title: "Distribution Guide",
    description:
      "Configure how this product is sold — channels, broker access, commission structures, and binding authority by segment.",
  },
  document: {
    title: "Document Guide",
    description:
      "Manage policy documents, endorsements, and schedules generated at bind — templates, merge fields, and version alignment with product releases.",
  },
  simulation: {
    title: "Simulation & Testing",
    description:
      "Run end-to-end test scenarios through eligibility, rating, and underwriting without affecting production data.",
  },
  governance: {
    title: "Governance & Approval",
    description:
      "Track product versions awaiting review, approve or reject changes, and maintain a controlled path from Draft to Published.",
  },
  "audit-log": {
    title: "Audit Log",
    description:
      "Immutable record of platform and product actions — who changed what, when, and on which product version.",
  },
  glossary: {
    title: "Glossary",
    description:
      "Standard definitions for insurance and platform terms used across Product Guide screens and documentation.",
  },
  "pricing-library": {
    title: "Central Pricing Library",
    description:
      "Reusable rating tables, factors, and reference data shared across products — maintained centrally to ensure consistency.",
  },
  integration: {
    title: "Integration Monitor",
    description:
      "Health and status of external integrations — policy admin, CRM, document generation, and third-party data services.",
  },
  roles: {
    title: "Roles & Access Control",
    description:
      "Manage users, system roles, product assignments, and scope restrictions that govern who can view or edit products.",
  },
  admin: {
    title: "Admin Panel",
    description:
      "Platform configuration — product types, lines of business, custom fields, lookup catalogues, and global defaults.",
  },
};

export const FIELDS: Record<string, string> = {
  "product name": "Display name shown in the catalogue and to brokers. Must be unique across all products.",
  "product type": "High-level product classification (e.g. Commercial Auto). Drives available lines of business and default covers.",
  "line of business": "Insurance line this product belongs to (e.g. Auto Liability, Property). Filters library templates and reporting.",
  carrier: "The insurance carrier underwriting this product. Set from your signed-in organisation and cannot be changed here.",
  mga: "Managing General Agent(s) authorised to distribute this product on behalf of the carrier.",
  "product owner": "Person accountable for this product's configuration, approvals, and lifecycle.",
  "product description": "Internal summary of the product intent, target market, and key features.",
  "product code": "Unique internal identifier used in integrations and reporting. Auto-suggested from the product name.",
  "cover name": "Customer-facing name of the benefit or cover section on the policy schedule.",
  "cover code": "Unique cover identifier for integrations and documents. Suggested automatically when created.",
  "cover type": "Standard cover classification from the library (e.g. Third Party Property Damage).",
  availability: "Whether this cover is mandatory, default-on, optional, or sold as an add-on at quote time.",
  description: "Underwriter-facing explanation of scope, exclusions, and intent for this cover or rule.",
  "limit basis": "How the limit is expressed — fixed dollar amount or percentage of sum insured.",
  "deductible type": "Flat amount, percentage of loss, or hybrid structure.",
  "rule name": "Short label identifying this eligibility or underwriting rule in lists and audit.",
  category: "Groups rules for filtering and conflict detection (e.g. Driver, Vehicle, Territory).",
  priority: "Evaluation order — lower numbers run first when multiple rules could apply.",
  "question label": "Text shown to the user answering the question on the quote journey.",
  "field type": "Input control — text, number, date, dropdown, etc.",
  "question group": "Section heading that groups related questions on the form.",
  "linked coverages": "Questions appear only when at least one linked cover is selected.",
  "help text": "Guidance shown beneath the question to assist accurate answers.",
  "attribute name": "Risk field name used in rules and rating (e.g. driver_age).",
  states: "US states included in this jurisdiction or territorial rule.",
  "cities / counties": "Optional narrowing within selected states. Leave empty to include the whole state.",
};

function normalizeLabel(text: string) {
  return String(text || "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function helpForLabel(label: string) {
  return FIELDS[normalizeLabel(label)] || "";
}

export function getModuleHelp(moduleId: string): ModuleHelp | undefined {
  return MODULES[moduleId];
}
