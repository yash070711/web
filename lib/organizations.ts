import type {
  Organization,
  OrganizationStatus,
  OrganizationType,
  ParentCompany,
  SessionUser,
} from "./types";

export type OrgTypeMeta = {
  key: OrganizationType;
  label: string;
  singular: string;
  description: string;
  color: string;
  className: string;
  defaultRole: string;
  selectable?: boolean;
};

export const ORG_TYPES: OrgTypeMeta[] = [
  {
    key: "risk-carrier",
    label: "Risk Carriers",
    singular: "Risk Carrier",
    description: "Licensed insurers that assume risk and issue policies.",
    color: "#4ADE80",
    className: "org-type-carrier",
    defaultRole: "Carrier",
    selectable: false,
  },
  {
    key: "mgu",
    label: "MGUs",
    singular: "MGU",
    description: "Managing General Underwriters with delegated authority.",
    color: "#38BDF8",
    className: "org-type-mgu",
    defaultRole: "MGU",
  },
  {
    key: "mga",
    label: "MGAs",
    singular: "MGA",
    description: "Managing General Agents that bind business for carriers.",
    color: "#A78BFA",
    className: "org-type-mga",
    defaultRole: "MGA",
  },
  {
    key: "broker",
    label: "Brokers",
    singular: "Broker",
    description: "Intermediaries that place business with carriers.",
    color: "#F59E0B",
    className: "org-type-broker",
    defaultRole: "Broker",
  },
  {
    key: "market-company",
    label: "Market Companies",
    singular: "Market Company",
    description: "Markets that host or distribute products to buyers.",
    color: "#F472B6",
    className: "org-type-market",
    defaultRole: "Market Company",
  },
  {
    key: "ceding-company",
    label: "Ceding Companies",
    singular: "Ceding Company",
    description: "Companies that cede risk through reinsurance treaties.",
    color: "#22D3EE",
    className: "org-type-ceding",
    defaultRole: "Ceding Company",
  },
  {
    key: "courtesy-filing",
    label: "Courtesy Filings",
    singular: "Courtesy Filing",
    description: "Entities that file on behalf of other carriers as a courtesy.",
    color: "#A3E635",
    className: "org-type-courtesy",
    defaultRole: "Courtesy Filing",
  },
  {
    key: "finance-company",
    label: "Finance Companies",
    singular: "Finance Company",
    description: "Companies that finance premiums or provide funding.",
    color: "#FB923C",
    className: "org-type-finance",
    defaultRole: "Finance Company",
  },
  {
    key: "inspection-company",
    label: "Inspection Companies",
    singular: "Inspection Company",
    description: "Companies that perform risk inspections and surveys.",
    color: "#818CF8",
    className: "org-type-inspection",
    defaultRole: "Inspection Company",
  },
  {
    key: "risk-company",
    label: "Risk Companies",
    singular: "Risk Company",
    description: "Entities that hold or manage assumed risk.",
    color: "#F87171",
    className: "org-type-risk",
    defaultRole: "Risk Company",
  },
  {
    key: "tax-entity",
    label: "Tax Entities",
    singular: "Tax Entity",
    description: "Entities used for tax reporting and filing structures.",
    color: "#94A3B8",
    className: "org-type-tax",
    defaultRole: "Tax Entity",
  },
];

export const ORG_TYPE_KEYS: OrganizationType[] = ORG_TYPES.map((t) => t.key);
export const ORG_TYPE_OPTIONS: OrgTypeMeta[] = ORG_TYPES.filter((t) => t.selectable !== false);
export const ORG_STATUSES: OrganizationStatus[] = ["active", "inactive"];

export const FINANCIAL_RATINGS = [
  "A++", "A+", "A", "A-",
  "B++", "B+", "B", "B-",
  "C++", "C+", "C", "C-",
  "D", "E", "F",
] as const;

export function orgTypeMeta(type: string): OrgTypeMeta {
  return ORG_TYPES.find((t) => t.key === type) || ORG_TYPES[0];
}

export function orgTypeLabel(type: string) {
  return orgTypeMeta(type).label;
}

export function isOrganizationType(value: string): value is OrganizationType {
  return (ORG_TYPE_KEYS as string[]).includes(value);
}

export function organizationsByType(organizations: Organization[]) {
  const map = new Map<OrganizationType, Organization[]>();
  for (const type of ORG_TYPES) map.set(type.key, []);
  for (const org of organizations) {
    const list = map.get(org.type);
    if (list) list.push(org);
  }
  return map;
}

export function countByStatus(organizations: Organization[], status: OrganizationStatus) {
  return organizations.filter((o) => o.status === status).length;
}

export function parentCompanyFor(parentCompanies: ParentCompany[], organization: Organization) {
  return parentCompanies.find((p) => p.id === organization.parentCompanyId) || parentCompanies[0];
}

export function assignedProductCount(organization?: Organization) {
  return organization?.assignedProducts?.length || 0;
}

export const DEFAULT_PARENT_COMPANY_ID = "PTC-001";
export const DEFAULT_PARENT_COMPANY_NAME = "Southlake Holdings";
export const PARENT_COMPANY_ADMIN_ROLE = "Parent Company Admin";
export const DEFAULT_PARENT_ADMIN_EMAIL = "admin@southlakeholdings.com";

export function isParentCompanyAdmin(session: SessionUser) {
  return session.context === "parent" || session.role === PARENT_COMPANY_ADMIN_ROLE;
}
