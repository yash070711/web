export const STUDIO_NAV_CHAIN = [
  { id: "jurisdiction", segment: "jurisdiction", title: "Define Jurisdiction" },
  { id: "coverage", segment: "coverage", title: "Coverage Guide" },
  { id: "questionnaire", segment: "questionnaire", title: "Questionnaire Guide" },
  { id: "risk", segment: "risk", title: "Risk Guide" },
  { id: "eligibility", segment: "eligibility", title: "Eligibility Guide" },
  { id: "rating", segment: "rating", title: "Rating & Pricing Guide" },
  { id: "underwriting", segment: "underwriting", title: "Underwriting Rules Guide" },
  { id: "distribution", segment: "distribution", title: "Distribution Guide" },
  { id: "document", segment: "document", title: "Document Guide" },
] as const;

export function getNextStudio(currentId: string, productId: string) {
  const idx = STUDIO_NAV_CHAIN.findIndex((row) => row.id === currentId);
  if (idx < 0) return null;
  if (idx >= STUDIO_NAV_CHAIN.length - 1) {
    return { href: `/products/${productId}#studios`, title: "Product Hub", finish: true as const };
  }
  const next = STUDIO_NAV_CHAIN[idx + 1];
  return { href: `/products/${productId}/${next.segment}`, title: next.title, finish: false as const };
}
