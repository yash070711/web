export const LIFECYCLE = [
  { id: "draft", meaning: "Actively being designed.", actions: "Edit, clone, simulate, compare." },
  { id: "review", meaning: "Submitted for product / actuarial / compliance review.", actions: "Comment, approve, reject." },
  { id: "approved", meaning: "Governance complete; awaiting release.", actions: "Schedule publication, withdraw approval." },
  { id: "published", meaning: "Available to permitted channels from the effective date.", actions: "Quote/use; no destructive editing." },
  { id: "superseded", meaning: "Replaced for new business by a later version.", actions: "Historical servicing and renewal rules." },
  { id: "retired", meaning: "No longer offered.", actions: "Read/audit only; existing policies remain traceable." },
] as const;

export const APPROVAL_GATES = [
  { gate: "Product Owner", focus: "Commercial proposition and product completeness." },
  { gate: "Actuarial", focus: "Rates, assumptions, discounts, loadings and premium controls." },
  { gate: "Underwriting", focus: "Risk appetite, referrals, evidence and authority limits." },
  { gate: "Compliance", focus: "Wording, disclosures, jurisdictional and regulatory requirements." },
  { gate: "Ops/Tech", focus: "Operational readiness, integrations and downstream compatibility." },
] as const;

export const STUDIO_ROLES = [
  { role: "Product Manager", permissions: "Create/clone products, configure proposition, submit for approval." },
  { role: "Pricing Actuary", permissions: "Manage rates, factors, formulas, simulations and pricing approval." },
  { role: "Underwriting Manager", permissions: "Manage appetite, rules, referral logic and authority controls." },
  { role: "Compliance/Legal", permissions: "Review jurisdiction, disclosures, wording and regulatory artifacts." },
  { role: "Administrator", permissions: "Manage reusable dictionaries, permissions and platform configuration." },
  { role: "Publisher/Release Manager", permissions: "Schedule and execute controlled publication." },
  { role: "Auditor", permissions: "Read-only access to versions, approvals, changes and execution history." },
] as const;

export const PREMIUM_FORMULA = "Base Premium × Risk Factors + Loadings − Discounts + Add-ons + Fees + Taxes = Payable Premium";

export const SNAPSHOT_FIELDS = [
  "Product ID and product version ID",
  "Selected cover versions and financial terms",
  "Rating inputs, factors, premium components and calculation version",
  "Underwriting decisions, referrals, overrides and approvals",
  "Question/answer snapshot used for the decision",
  "Applicable wording/document versions",
  "Taxes, fees, commission basis and jurisdictional configuration",
];
