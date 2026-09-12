import type { Product, ProductDetail, Workspace } from "./types";
import { nowIso, displayDate, todayIso } from "./format";
import { TRUCK_DESCRIPTION, TRUCK_ID, truckCollections } from "./truck-demo";
import { privateCarQuestionGroups, truckingQuestionGroups } from "./questionnaire-seed";

const CATALOGUE: Array<Partial<Product> & { id: string; name: string; family: string; version: string; status: Product["status"]; owner: string }> = [
  { id: "PRD-015", name: "Commercial Truck Comprehensive", family: "Trucking", version: "2026.08", status: "published", owner: "Sunita Pillai", effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
  { id: "PRD-011", name: "Commercial Vehicle Fleet", family: "Trucking", version: "2026.05-DRAFT", status: "draft", owner: "Anika Sharma" },
];

function studios(id: string) {
  return [
    { id: "coverage", name: "Coverage Studio", href: `/products/${id}/coverage`, status: "complete" as const, summary: "Configured" },
    { id: "questionnaire", name: "Questionnaire Studio", href: `/products/${id}/questionnaire`, status: "complete" as const, summary: "Configured" },
    { id: "eligibility", name: "Eligibility Studio", href: `/products/${id}/eligibility`, status: "complete" as const, summary: "Configured" },
    { id: "rating", name: "Rating & Pricing Studio", href: `/products/${id}/rating`, status: "partial" as const, summary: "Base rate set" },
    { id: "underwriting", name: "Underwriting Rules Studio", href: `/products/${id}/underwriting`, status: "partial" as const, summary: "Core rules" },
    { id: "distribution", name: "Distribution Studio", href: `/products/${id}/distribution`, status: "complete" as const, summary: "Direct + broker" },
    { id: "document", name: "Document Studio", href: `/products/${id}/document`, status: "complete" as const, summary: "Wording pack" },
  ];
}

export function productDetailFrom(product: Product): ProductDetail {
  return {
    id: product.id,
    name: product.name,
    family: product.family,
    code: product.code || `${product.family.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${product.id.slice(-3)}`,
    segment: String(product.segment || (product.id === TRUCK_ID ? "Commercial Lines" : "Personal Lines")),
    riskType: product.id === TRUCK_ID ? "Truck + Driver + Cargo" : "Risk + Policyholder",
    jurisdictions: product.jurisdictions || (product.id === TRUCK_ID ? ["India", "UAE", "UK"] : ["India"]),
    distribution: product.id === TRUCK_ID
      ? ["Commercial Broker Portal", "Direct (Web) — Owner Operators", "Fleet TMS API"]
      : ["Direct (Web)", "Broker Portal"],
    owner: product.owner,
    description: product.id === TRUCK_ID ? TRUCK_DESCRIPTION : product.description || `${product.name} configuration.`,
    notes: product.id === TRUCK_ID
      ? "Version 2026.08: Commercial truck demo — 8 covers, HGV eligibility, GVW/radius rating, broker/TMS distribution."
      : `Version ${product.version}: managed in Veridex Product Studio.`,
    status: product.status,
    activeVersion: product.version,
    versions: [
      {
        label: product.version,
        status: product.status,
        from: product.effectiveFrom,
        to: product.effectiveTo,
        by: product.owner,
        on: product.lastModified,
        gates: product.status === "published" ? 5 : 0,
        sim: product.status === "published" ? "Passed" : "Not Run",
      },
    ],
    studios: studios(product.id),
    governance: ["Product Owner", "Actuarial", "Underwriting", "Compliance", "Ops/Tech"].map((gate) => ({
      gate,
      approver: product.status === "published" ? product.owner : "—",
      action: product.status === "published" ? "Approved" : "Pending",
      date: product.status === "published" ? product.lastModified : "—",
      comment: product.status === "published" ? "Approved in seeded workspace." : "—",
    })),
    checklist: studios(product.id).map((s) => ({
      studio: s.name,
      status: s.status === "complete" ? "done" : s.status === "partial" ? "warn" : "empty",
      note: s.summary,
    })),
    completion: product.status === "published" ? 100 : product.status === "draft" ? 35 : 70,
    lastSim: null,
  };
}

function col(id: string, version: string, name: string) {
  return `${id}::${version}::${name}`;
}

function motorCovers() {
  return [
    { id: "COV-AL", name: "Auto Liability", code: "COV-AL", availability: "mandatory", complete: true, type: "Commercial Auto Liability", description: "Third-party bodily injury and property damage for commercial auto use.", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", deductibleType: "none", deductibleAmount: "0", defaultSelected: true },
    { id: "COV-UIM", name: "Uninsured / Underinsured Motorist", code: "COV-UIM", availability: "default", complete: true, type: "Third Party Liability", description: "Protection when the other driver lacks adequate insurance.", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", deductibleType: "none", deductibleAmount: "0", defaultSelected: true },
    { id: "COV-MP", name: "Medical Payments / PIP", code: "COV-MP", availability: "default", complete: true, type: "Benefit — Personal Accident", description: "Medical expenses and personal injury protection for occupants.", basisOfCoverage: "Agreed Value", sumInsured: "25000", deductibleType: "none", deductibleAmount: "0", defaultSelected: true },
    { id: "COV-MTC", name: "Motor Truck Cargo", code: "COV-MTC", availability: "default", complete: true, type: "First Party — Cargo", description: "Loss or damage to lawful cargo while in transit.", basisOfCoverage: "Declared Value", sumInsured: "250000", deductibleType: "none", deductibleAmount: "0", defaultSelected: true },
    { id: "COV-TI", name: "Trailer Interchange", code: "COV-TI", availability: "optional", complete: true, type: "First Party — Property Damage", description: "Damage to non-owned trailers under interchange agreements.", basisOfCoverage: "Stated Amount", sumInsured: "80000", deductibleType: "none", deductibleAmount: "0", defaultSelected: true },
    { id: "COV-NTL", name: "Non-Trucking Liability", code: "COV-NTL", availability: "addon", complete: true, type: "Commercial Auto Liability", description: "Liability when operating without a trailer, not under dispatch.", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", deductibleType: "none", deductibleAmount: "0", defaultSelected: false },
    { id: "COV-PD", name: "Physical Damage", code: "COV-PD", availability: "mandatory", complete: true, type: "First Party — Property Damage", description: "Collision and comprehensive damage to insured vehicles.", basisOfCoverage: "Stated Amount", sumInsured: "180000", deductibleType: "fixed", deductibleAmount: "1000", defaultSelected: true },
  ];
}

export function starterQuestionGroups(family: string) {
  if (family === "Trucking" || family === "Motor" || family === "Commercial Auto") return truckingQuestionGroups();
  return [
    {
      id: "GRP-001",
      name: "Risk details",
      label: "Risk details",
      questions: [
        { id: "Q-001", label: "Full name", type: "text", typeLabel: "Text", fieldType: "text", required: true, internalName: "full_name", displayOrder: 1, channels: "Web, Mobile, Agent, API", validations: [], conditions: [], evidence: [] },
        { id: "Q-002", label: "Age", type: "number", typeLabel: "Number", fieldType: "number", required: true, internalName: "age", displayOrder: 2, channels: "Web, Mobile, Agent, API", validations: [], conditions: [], evidence: [] },
        { id: "Q-003", label: "Sum insured", type: "currency", typeLabel: "Currency", fieldType: "currency", required: true, internalName: "sum_insured", displayOrder: 3, channels: "Web, Mobile, Agent, API", validations: [], conditions: [], evidence: [] },
      ],
    },
  ];
}

export function starterCovers(family: string) {
  const familyDefaults: Record<string, ReturnType<typeof motorCovers>> = {
    Trucking: motorCovers(),
    Motor: motorCovers(),
    "Commercial Auto": motorCovers(),
    Cyber: [{ id: "COV-CYB-001", name: "Network Security Liability", code: "COV-NSL-001", availability: "mandatory", complete: true, type: "Third Party Liability", description: "Failure to prevent unauthorised access or malware.", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", deductibleType: "fixed", deductibleAmount: "10000", defaultSelected: true }],
    "Cyber Liability": [{ id: "COV-CYB-001", name: "Cyber Liability", code: "COV-CYB-001", availability: "mandatory", complete: true, type: "Third Party Liability", description: "Failure to prevent unauthorised access or malware.", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", deductibleType: "fixed", deductibleAmount: "10000", defaultSelected: true }],
  };
  return familyDefaults[family] || familyDefaults["Commercial Auto"];
}

function defaultCollections(product: Product) {
  const k = (name: string) => col(product.id, product.version, name);
  const familyDefaults: Record<string, unknown[]> = {
    Trucking: motorCovers(),
    Motor: motorCovers(),
    Cyber: [{ id: "COV-CYB-001", name: "Network Security Liability", availability: "mandatory", description: "Unauthorized access and malware liability.", sumInsured: "1000000", defaultSelected: true }],
  };
  return {
    [k("covers")]: familyDefaults[product.family] || familyDefaults.Trucking,
    [k("questionGroups")]: product.id === TRUCK_ID ? truckingQuestionGroups() : [
      {
        id: "GRP-001",
        name: "Risk details",
        label: "Risk details",
        questions: [
          { id: "Q-001", label: "Full name", type: "text", typeLabel: "Text", fieldType: "text", required: true, internalName: "full_name", displayOrder: 1, channels: "Web, Mobile, Agent, API", validations: [], conditions: [], evidence: [] },
          { id: "Q-002", label: "Age", type: "number", typeLabel: "Number", fieldType: "number", required: true, internalName: "age", displayOrder: 2, channels: "Web, Mobile, Agent, API", validations: [], conditions: [], evidence: [] },
          { id: "Q-003", label: "Sum insured", type: "currency", typeLabel: "Currency", fieldType: "currency", required: true, internalName: "sum_insured", displayOrder: 3, channels: "Web, Mobile, Agent, API", validations: [], conditions: [], evidence: [] },
        ],
      },
    ],
    [k("eligibilityRules")]: [
    { id: "ELG-001", name: "Minimum age", field: "driver_age", operator: "<", value: "18", outcome: "ineligible", category: "Product Eligibility", cover: "All Covers", priority: 10, status: "active", description: "Policyholder must be at least 18.", conditions: [{ field: "driver_age", op: "<", value: "18" }], reasonCode: "ELIG-MIN-AGE", effectiveFrom: "01-Apr-2026", effectiveTo: "30-Sep-2026" },
    { id: "ELG-002", name: "Maximum age", field: "driver_age", operator: ">", value: "70", outcome: "refer", category: "Product Eligibility", cover: "All Covers", priority: 20, status: "active", description: "Drivers over 70 are referred.", conditions: [{ field: "driver_age", op: ">", value: "70" }], reasonCode: "ELIG-MAX-AGE", effectiveFrom: "01-Apr-2026", effectiveTo: "30-Sep-2026" },
    ],
    [k("ratingComponents")]: [
      { id: "RATE-001", name: "Base premium", type: "base", amount: product.family === "Trucking" || product.family === "Motor" ? 350 : 2400, unit: "per year" },
      { id: "RATE-002", name: "Age factor", type: "factor", field: "Age", amount: 1 },
    ],
    [k("underwritingRules")]: [
      { id: "UW-001", name: "High sum insured refer", field: "sum_insured", operator: ">", value: "100000", outcome: "refer", conditions: [{ field: "sum_insured", op: ">", value: "100000" }] },
    ],
    [k("channels")]: [
      { id: "CHAN-001", name: "Direct (Web)", accessModel: "Open Access", status: "active" },
      { id: "CHAN-002", name: "Broker Portal", accessModel: "Restricted", status: "active" },
    ],
    [k("documents")]: [
      { id: "DOC-001", name: "Policy Wording", type: "wording", version: product.version },
      { id: "DOC-002", name: "Certificate of Insurance", type: "certificate", version: product.version },
    ],
    [k("testCases")]: [
      { id: "TEST-001", name: "Standard quote", expected: "accept", premium: 350, result: "not-run" },
    ],
  };
}

export function applyTruckDemo(workspace: Workspace) {
  const product = workspace.products.find((p) => p.id === TRUCK_ID);
  if (product) {
    product.description = TRUCK_DESCRIPTION;
    product.segment = "Commercial Lines";
    product.name = "Commercial Truck Comprehensive";
    product.family = "Trucking";
    const others = workspace.products.filter((p) => p.id !== TRUCK_ID);
    workspace.products = [product, ...others];
  }
  const seedRev = Number(workspace.settings?.truckSeed || 0);
  const TRUCK_SEED_REV = 6;
  if (seedRev < TRUCK_SEED_REV) {
    Object.assign(workspace.collections, truckCollections());
    workspace.settings = { ...workspace.settings, truckSeed: TRUCK_SEED_REV };
  }
  const carSeed = Number(workspace.settings?.carSeed || 0);
  if (carSeed < 1) {
    const truck = workspace.products.find((p) => p.id === TRUCK_ID);
    if (truck) {
      workspace.collections[col(truck.id, truck.version, "questionGroups")] = truckingQuestionGroups();
    }
    workspace.settings = { ...workspace.settings, carSeed: 1 };
  }
  const detail = workspace.details[TRUCK_ID];
  if (detail) {
    Object.assign(detail, {
      name: "Commercial Truck Comprehensive",
      segment: "Commercial Lines",
      riskType: "Truck + Driver + Cargo",
      description: TRUCK_DESCRIPTION,
      notes: "Version 2026.08: Commercial truck demo — 8 covers, HGV eligibility, GVW/radius rating.",
      jurisdictions: ["India", "UAE", "UK"],
      distribution: ["Commercial Broker Portal", "Direct (Web) — Owner Operators", "Fleet TMS API"],
    });
  } else if (product) {
    workspace.details[TRUCK_ID] = productDetailFrom(product);
  }
  return workspace;
}

export function emptyWorkspace(ownerName: string): Workspace {
  const products: Product[] = CATALOGUE.map((row) => ({
    ...row,
    effectiveFrom: row.effectiveFrom ?? null,
    effectiveTo: row.effectiveTo ?? null,
    lastModified: displayDate(todayIso()) || todayIso(),
    lastModifiedAt: nowIso(),
    lastModifiedBy: row.owner,
    description: row.id === TRUCK_ID ? TRUCK_DESCRIPTION : `${row.name} — seeded into your workspace. Edit or delete any field.`,
    pending: row.status === "draft" || row.status === "review",
  }));
  const details: Record<string, ProductDetail> = {};
  const collections: Record<string, unknown> = {};
  for (const product of products) {
    details[product.id] = productDetailFrom(product);
    Object.assign(collections, defaultCollections(product));
    if (product.id === TRUCK_ID) Object.assign(collections, truckCollections());
  }
  return {
    products,
    details,
    collections,
    audit: [
      {
        id: "EVT-seed",
        at: nowIso(),
        user: ownerName,
        role: "Product Manager",
        action: "SEEDED",
        page: "workspace",
        description: "Workspace created with Commercial Truck Comprehensive as the featured demo.",
      },
    ],
    notifications: [
      {
        id: "NTF-welcome",
        title: "Commercial truck demo is live",
        detail: "Open Coverage Studio and Questionnaire (risk) on Commercial Truck Comprehensive — 8 covers, GVW, HGV licence, cargo class.",
        href: "/products/PRD-015/coverage",
        read: false,
        at: nowIso(),
      },
    ],
    team: [
      { id: "U001", name: ownerName, email: "", role: "Product Manager", status: "ACTIVE", products: products.map((p) => p.id) },
      { id: "U002", name: "Rajan Mehta", email: "rajan@veridex.local", role: "Pricing Actuary", status: "ACTIVE", products: ["PRD-015", "PRD-020"] },
      { id: "U003", name: "Sunita Pillai", email: "sunita@veridex.local", role: "Underwriting Manager", status: "ACTIVE", products: ["PRD-015"] },
    ],
    pricing: [
      { id: "TPL-001", name: "Commercial truck · Comprehensive", family: "Trucking", base: 1850, unit: "per year", status: "active" },
      { id: "TPL-002", name: "Cyber liability · SME", family: "Cyber", base: 2400, unit: "per year", status: "active" },
    ],
    glossary: [
      { id: "GLS-001", term: "Effective From", definition: "The first date the version may be sold.", category: "Lifecycle" },
      { id: "GLS-002", term: "Deductible", definition: "Amount the insured pays before the insurer pays a claim.", category: "Coverage" },
      { id: "GLS-003", term: "Refer", definition: "Underwriting outcome that requires a human decision.", category: "Underwriting" },
    ],
    quotes: [],
    webhooks: [
      { id: "WH-001", name: "Quote issued", url: "https://hooks.example.com/quote", events: "quote.created", status: "active" },
    ],
    settings: { orgName: "Veridex", timezone: "Asia/Kolkata", truckSeed: 4 },
  };
}
