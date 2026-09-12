import { redirect } from "next/navigation";

export const PROTO_STUDIOS: Record<string, string> = {
  coverage: "coverage-studio.html",
  questionnaire: "questionnaire-studio.html",
  risk: "risk-studio.html",
  eligibility: "eligibility-studio.html",
  rating: "rating-studio.html",
  underwriting: "underwriting-studio.html",
  distribution: "distribution-studio.html",
  document: "document-studio.html",
};

export function protoUrl(file: string, query: Record<string, string | undefined | null> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const q = params.toString();
  return `/proto/${file}${q ? `?${q}` : ""}`;
}

export function goProto(file: string, query: Record<string, string | undefined | null> = {}): never {
  redirect(protoUrl(file, query));
}
