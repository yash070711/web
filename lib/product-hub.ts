import { STUDIO_META } from "./nav";
import { getCollection } from "./store";
import type { AuditEvent, Workspace } from "./types";

export { getNextStudio, STUDIO_NAV_CHAIN } from "./studio-nav";

export type HubStudioState = "complete" | "progress" | "incomplete" | "empty";

export type HubStudio = {
  id: string;
  title: string;
  description: string;
  href: string;
  countLabel: string;
  pct: number;
  state: HubStudioState;
  tone: string;
};

const STUDIO_ROWS: Array<{
  id: string;
  collection?: string;
  countNoun: [string, string];
  expected: number;
  tone: string;
  href?: (id: string) => string;
  count?: (items: Record<string, unknown>[]) => number;
}> = [
  { id: "coverage", collection: "covers", countNoun: ["Coverage", "Coverages"], expected: 6, tone: "#3B82F6" },
  {
    id: "questionnaire",
    collection: "questionGroups",
    countNoun: ["Question", "Questions"],
    expected: 10,
    tone: "#8B5CF6",
    count: (items) =>
      items.reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 1), 0),
  },
  { id: "risk", collection: "riskAttributes", countNoun: ["Attribute", "Attributes"], expected: 122, tone: "#F97316" },
  { id: "eligibility", collection: "eligibilityRules", countNoun: ["Rule", "Rules"], expected: 4, tone: "#10B981" },
  { id: "rating", collection: "ratingComponents", countNoun: ["Component", "Components"], expected: 5, tone: "#C09553" },
  { id: "underwriting", collection: "underwritingRules", countNoun: ["Rule", "Rules"], expected: 16, tone: "#F59E0B" },
  { id: "distribution", collection: "channels", countNoun: ["Channel", "Channels"], expected: 2, tone: "#06B6D4" },
  { id: "document", collection: "documents", countNoun: ["Document", "Documents"], expected: 20, tone: "#94A3B8" },
  {
    id: "simulation",
    collection: "testCases",
    countNoun: ["Scenario", "Scenarios"],
    expected: 3,
    tone: "#A78BFA",
    href: () => "/simulation",
  },
];

function stateFor(pct: number): HubStudioState {
  if (pct <= 0) return "empty";
  return "complete";
}

export function buildHubStudios(workspace: Workspace, productId: string, version: string): HubStudio[] {
  return STUDIO_ROWS.map((row) => {
    const items = row.collection
      ? getCollection<Record<string, unknown>>(workspace, productId, version, row.collection)
      : [];
    const count = row.count ? row.count(items) : items.length;
    const pct = count === 0 ? 0 : 100;
    const noun = count === 1 ? row.countNoun[0] : row.countNoun[1];
    const meta = STUDIO_META[row.id];
    return {
      id: row.id,
      title: meta?.title || "Simulation & Testing",
      description:
        meta?.description || "Scenario library, rule trace, premium breakdown and version checks.",
      href: row.href ? row.href(productId) : `/products/${productId}/${row.id}`,
      countLabel: `${count} ${noun}`,
      pct,
      state: stateFor(pct),
      tone: row.tone,
    };
  });
}

export function hubSummary(studios: HubStudio[]) {
  const overall = studios.length
    ? Math.round(studios.reduce((n, s) => n + s.pct, 0) / studios.length)
    : 0;
  return {
    overall,
    complete: studios.filter((s) => s.state === "complete").length,
    progress: studios.filter((s) => s.state === "progress").length,
    empty: studios.filter((s) => s.state === "empty").length,
    incomplete: studios.filter((s) => s.state === "incomplete").length,
  };
}

export function productActivity(audit: AuditEvent[], productId: string, limit = 3) {
  return audit.filter((e) => e.productId === productId).slice(0, limit);
}
