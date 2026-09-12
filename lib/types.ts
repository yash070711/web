export type ProductStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "superseded"
  | "retired";

export type Product = {
  id: string;
  name: string;
  family: string;
  version: string;
  status: ProductStatus;
  owner: string;
  lastModified: string;
  lastModifiedAt: string;
  lastModifiedBy?: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  description?: string;
  code?: string;
  segment?: string;
  businessType?: string;
  jurisdictions?: string[];
  sourceProductId?: string | null;
  pending?: boolean;
  [key: string]: unknown;
};

export type VersionRecord = {
  label: string;
  status: ProductStatus;
  from: string | null;
  to: string | null;
  by: string;
  on: string;
  gates?: number;
  sim?: string;
  [key: string]: unknown;
};

export type StudioLink = {
  id: string;
  name: string;
  href: string;
  status: "complete" | "partial" | "missing";
  summary: string;
};

export type Gate = {
  gate: string;
  approver: string;
  action: string;
  date: string;
  comment: string;
};

export type ProductDetail = {
  id: string;
  name: string;
  family: string;
  code: string;
  segment: string;
  riskType: string;
  jurisdictions: string[];
  distribution: string[];
  owner: string;
  description: string;
  notes: string;
  status: ProductStatus;
  activeVersion: string;
  versions: VersionRecord[];
  studios: StudioLink[];
  governance: Gate[];
  checklist: { studio: string; status: string; note: string }[];
  completion: number;
  lastSim: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type AuditEvent = {
  id: string;
  at: string;
  user: string;
  role: string;
  action: string;
  page: string;
  productId?: string;
  version?: string;
  description: string;
};

export type Notification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  read: boolean;
  at: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  products: string[];
};

export type PricingTemplate = {
  id: string;
  name: string;
  family: string;
  base: number;
  unit: string;
  status: string;
  [key: string]: unknown;
};

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  category: string;
};

export type Quote = {
  id: string;
  productId: string;
  version: string;
  premium: number;
  status: string;
  answers: Record<string, unknown>;
  at: string;
};

export type Workspace = {
  products: Product[];
  details: Record<string, ProductDetail>;
  collections: Record<string, unknown>;
  audit: AuditEvent[];
  notifications: Notification[];
  team: TeamMember[];
  pricing: PricingTemplate[];
  glossary: GlossaryTerm[];
  quotes: Quote[];
  webhooks: { id: string; name: string; url: string; events: string; status: string }[];
  settings: Record<string, unknown>;
};

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: string;
  productId?: string;
  version?: string;
};
