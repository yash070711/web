export type ProfileKey = "vikram" | "southlake";

const PROFILE_STORAGE_KEY = "ps-profile";

export function getActiveProfile(): ProfileKey {
  if (typeof window === "undefined") return "vikram";
  return window.localStorage.getItem(PROFILE_STORAGE_KEY) === "southlake" ? "southlake" : "vikram";
}

export function profilePrefix(): string {
  return getActiveProfile() === "southlake" ? "/ps-southlake" : "/ps";
}

export const HTML_PAGES: Record<string, string> = {
  dashboard: "index.html",
  catalogue: "catalogue.html",
  jurisdiction: "jurisdiction-studio.html",
  coverage: "coverage-studio.html",
  questionnaire: "questionnaire-studio.html",
  risk: "risk-studio.html",
  eligibility: "eligibility-studio.html",
  rating: "rating-studio.html",
  underwriting: "underwriting-studio.html",
  distribution: "distribution-studio.html",
  "distribution-create": "distribution-create.html",
  document: "document-studio.html",
  simulation: "simulation-studio.html",
  audit: "audit-log.html",
  governance: "governance.html",
  admin: "admin-panel.html",
  "pricing-library": "pricing-library.html",
  integration: "integration-monitor.html",
  roles: "roles-access.html",
  glossary: "glossary.html",
  "product-detail": "product-detail.html",
  "product-view": "product-view.html",
};

export const STUDIO_HTML: Record<string, string> = {
  jurisdiction: "jurisdiction-studio.html",
  coverage: "coverage-studio.html",
  questionnaire: "questionnaire-studio.html",
  risk: "risk-studio.html",
  eligibility: "eligibility-studio.html",
  rating: "rating-studio.html",
  underwriting: "underwriting-studio.html",
  distribution: "distribution-studio.html",
  document: "document-studio.html",
};

export function htmlHrefToNext(href: string, fallbackProductId?: string): string {
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return href;
  if (/^(mailto:|tel:)/i.test(href)) return href;

  let file = "";
  let qs: URLSearchParams;
  try {
    const url = new URL(href, "http://local.invalid/ps/");
    file = (url.pathname.split("/").pop() || "").split("?")[0];
    qs = url.searchParams;
  } catch {
    return href;
  }

  if (/^https?:/i.test(href) && !file.endsWith(".html")) return href;

  const id = qs.get("product") || qs.get("id") || fallbackProductId || "";
  const version = qs.get("version") || "";
  const rest = new URLSearchParams(qs);
  if (id) {
    rest.set("product", id);
    rest.set("id", id);
  }
  if (version) rest.set("version", version);
  const q = rest.toString();
  const suffix = q ? `?${q}` : "";

  if (file === "index.html" || file === "") return `/dashboard${suffix}`;
  if (file === "catalogue.html") return `/catalogue${suffix}`;
  if (file === "product-detail.html") return id ? `/products/${id}${suffix}` : `/catalogue${suffix}`;
  if (file === "product-view.html") return id ? `/products/${id}/view${suffix}` : `/catalogue${suffix}`;
  if (file === "coverage-studio.html") return id ? `/products/${id}/coverage${suffix}` : `/coverage-studio${suffix}`;
  if (file === "questionnaire-studio.html") return id ? `/products/${id}/questionnaire${suffix}` : `/questionnaire-studio${suffix}`;
  if (file === "risk-studio.html") return id ? `/products/${id}/risk${suffix}` : `/risk-studio${suffix}`;
  if (file === "eligibility-studio.html") return id ? `/products/${id}/eligibility${suffix}` : `/eligibility-studio${suffix}`;
  if (file === "rating-studio.html") return id ? `/products/${id}/rating${suffix}` : `/rating-pricing${suffix}`;
  if (file === "underwriting-studio.html") return id ? `/products/${id}/underwriting${suffix}` : `/underwriting${suffix}`;
  if (file === "distribution-studio.html") return id ? `/products/${id}/distribution${suffix}` : `/distribution${suffix}`;
  if (file === "distribution-create.html") return `/distribution/create${suffix}`;
  if (file === "document-studio.html") return id ? `/products/${id}/document${suffix}` : `/document-studio${suffix}`;
  if (file === "jurisdiction-studio.html") return id ? `/products/${id}/jurisdiction${suffix}` : `/jurisdiction${suffix}`;
  if (file === "simulation-studio.html") return `/simulation${suffix}`;
  if (file === "audit-log.html") return `/audit-log${suffix}`;
  if (file === "governance.html") return `/governance${suffix}`;
  if (file === "admin-panel.html") return `/admin${suffix}`;
  if (file === "pricing-library.html") return `/pricing-library${suffix}`;
  if (file === "integration-monitor.html") return `/integration${suffix}`;
  if (file === "roles-access.html") return `/roles${suffix}`;
  if (file === "glossary.html") return `/glossary${suffix}`;
  return href;
}

export function rewriteAsset(url: string): string {
  if (!url) return url;
  if (/^(https?:|data:)/i.test(url)) return url;
  if (url.startsWith("/ps/") || url.startsWith("/ps-southlake/")) return url;
  const prefix = profilePrefix();
  const clean = url.replace(/^\.\//, "").replace(/^\//, "");
  if (clean.startsWith("assets/")) return `${prefix}/${clean}`;
  if (clean.endsWith(".css") || clean.endsWith(".js")) {
    const mapped = `${prefix}/assets/${clean.replace(/^assets\//, "")}`;
    if (mapped.endsWith("nav.js") || mapped.endsWith("prototype-app.js")) return `${mapped}?v=next-routes`;
    return mapped;
  }
  return url;
}
