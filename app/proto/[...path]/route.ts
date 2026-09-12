import { redirect } from "next/navigation";

const MAP: Record<string, string> = {
  "index.html": "/dashboard",
  "catalogue.html": "/catalogue",
  "coverage-studio.html": "/coverage-studio",
  "questionnaire-studio.html": "/questionnaire-studio",
  "risk-studio.html": "/risk-studio",
  "eligibility-studio.html": "/eligibility-studio",
  "rating-studio.html": "/rating-pricing",
  "underwriting-studio.html": "/underwriting",
  "distribution-studio.html": "/distribution",
  "distribution-create.html": "/distribution",
  "document-studio.html": "/document-studio",
  "jurisdiction-studio.html": "/jurisdiction",
  "pricing-library.html": "/pricing-library",
  "simulation-studio.html": "/simulation",
  "audit-log.html": "/audit-log",
  "governance.html": "/governance",
  "integration-monitor.html": "/integration",
  "admin-panel.html": "/admin",
  "roles-access.html": "/roles",
  "product-detail.html": "/catalogue",
  "product-view.html": "/catalogue",
  "glossary.html": "/glossary",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const file = path.join("/");
  const target = MAP[file] || MAP[`${file}.html`];
  if (target) {
    const url = new URL(target, request.url);
    const incoming = new URL(request.url);
    incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));
    const product = url.searchParams.get("product") || url.searchParams.get("id");
    const studio = Object.entries({
      "coverage-studio.html": "coverage",
      "questionnaire-studio.html": "questionnaire",
      "risk-studio.html": "risk",
      "eligibility-studio.html": "eligibility",
      "rating-studio.html": "rating",
      "underwriting-studio.html": "underwriting",
      "distribution-studio.html": "distribution",
      "document-studio.html": "document",
      "jurisdiction-studio.html": "jurisdiction",
      "product-detail.html": "",
      "product-view.html": "view",
    }).find(([k]) => k === file)?.[1];
    if (product && studio === "view") {
      redirect(`/products/${product}/view`);
    }
    if (product && file === "distribution-create.html") {
      redirect(`/distribution/create?product=${encodeURIComponent(product)}`);
    }
    if (product && studio === "") {
      redirect(`/products/${product}`);
    }
    if (product && studio) {
      redirect(`/products/${product}/${studio}`);
    }
    redirect(`${url.pathname}${url.search}`);
  }
  redirect("/dashboard");
}
