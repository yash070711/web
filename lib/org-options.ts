import type { OrgFieldOption, OrgOptionSource } from "./org-fields";
import type { Organization, OrganizationType, Product } from "./types";

export type OrgOptionsContext = {
  products: Product[];
  coverages: OrgFieldOption[];
  organizations: Organization[];
};

const ORG_TYPE_SOURCES: Partial<Record<OrgOptionSource, OrganizationType[]>> = {
  carriers: ["risk-company", "risk-carrier"],
  "mgas-mgus": ["mga", "mgu"],
  brokers: ["broker"],
};

export function orgOptionsFor(
  source: OrgOptionSource | undefined,
  ctx: OrgOptionsContext
): OrgFieldOption[] {
  if (!source) return [];
  switch (source) {
    case "product-families": {
      const families = [...new Set(ctx.products.map((p) => p.family).filter(Boolean))].sort();
      return families.map((family) => ({ value: family, label: family }));
    }
    case "products":
      return ctx.products.map((p) => ({ value: p.name, label: p.name }));
    case "coverages":
      return ctx.coverages;
    case "carriers":
    case "mgas-mgus":
    case "brokers": {
      const types = ORG_TYPE_SOURCES[source] || [];
      const seen = new Set<string>();
      const out: OrgFieldOption[] = [];
      for (const organization of ctx.organizations) {
        if (!types.includes(organization.type)) continue;
        const key = organization.name;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({ value: key, label: key });
      }
      return out.sort((a, b) => a.label.localeCompare(b.label));
    }
    default:
      return [];
  }
}