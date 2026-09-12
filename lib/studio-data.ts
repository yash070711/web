import type { Row } from "@/components/studios/shared";

export type Condition = {
  field?: string;
  op?: string;
  operator?: string;
  value?: string;
  connector?: string;
};

export function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

export function opOf(c: Condition | Row) {
  return String(c.op || c.operator || "=");
}

export function conditionsOf(rule: Row | undefined): Condition[] {
  if (!rule) return [];
  const nested = asRows(rule.conditions);
  if (nested.length) {
    return nested.map((c) => ({
      field: String(c.field || ""),
      op: opOf(c),
      operator: opOf(c),
      value: String(c.value ?? ""),
      connector: String(c.connector || ""),
    }));
  }
  const tree = rule.condition;
  if (tree && typeof tree === "object" && !Array.isArray(tree) && Array.isArray((tree as Row).groups)) {
    const groups = asRows((tree as Row).groups);
    const out: Condition[] = [];
    groups.forEach((g, gi) => {
      asRows(g.rows).forEach((r, ri) => {
        out.push({
          field: String(r.f || r.field || ""),
          op: String(r.op || "="),
          operator: String(r.op || "="),
          value: String(r.v ?? r.value ?? ""),
          connector: gi > 0 || ri > 0 ? String(g.logic || "AND") : "",
        });
      });
    });
    if (out.length) return out;
  }
  if (rule.field) {
    return [{ field: String(rule.field), op: String(rule.operator || "="), operator: String(rule.operator || "="), value: String(rule.value ?? "") }];
  }
  return [];
}

export function conditionText(rule: Row | undefined) {
  const conds = conditionsOf(rule);
  if (!conds.length) return "—";
  return conds
    .map((c, i) => `${i && c.connector ? `${c.connector} ` : ""}${c.field} ${opOf(c)} ${c.value}`)
    .join(" ");
}

export function previewRule(rule: Row | undefined, fallbackOutcome = "ineligible") {
  if (!rule) return "";
  const outcome = String(rule.outcome || rule.direction || fallbackOutcome).toUpperCase();
  const logic = String(rule.logic || "AND").toUpperCase();
  const conds = conditionsOf(rule);
  const body = conds.length
    ? conds.map((c) => `${c.field} ${opOf(c)} ${c.value}`).join(` ${logic} `)
    : "no condition";
  return `${outcome} when ${body}`;
}

export function withSyncedConditions(rule: Row, conditions: Condition[]): Row {
  const first = conditions[0];
  return {
    ...rule,
    conditions,
    field: first?.field || "",
    operator: first ? opOf(first) : "=",
    value: first?.value || "",
  };
}

export function table1DOf(row: Row | undefined): Row[] {
  return asRows(row?.table1D);
}

export function bandsFromTable(table: Row[]) {
  return table.map((r) => `${r.band} ×${r.mult}`).join(" · ");
}

export function constraintsOf(cover: Row | undefined): Row[] {
  if (!cover) return [];
  const nested = asRows(cover.constraints);
  if (nested.length && typeof nested[0] === "object") return nested;
  const text = String(cover.constraints || "");
  if (!text) return [];
  return text.split("·").map((s) => s.trim()).filter(Boolean).map((value) => ({ field: value, operator: "", value: "" }));
}

export function dependenciesOf(cover: Row | undefined): Row[] {
  if (!cover) return [];
  const nested = asRows(cover.dependencies);
  if (nested.length) return nested;
  const requires = String(cover.requiresCover || "");
  if (!requires) return [];
  return [{ type: "Requires", dependsOn: requires, condition: "Always" }];
}

const DEFAULT_LINKED_WORDING = [
  { name: "Own Damage Clause — Standard", version: "v2026.04", code: "DOC-OD-CL-001" },
  { name: "General Exclusions Endorsement", version: "v2026.01", code: "DOC-GEN-EX-001" },
];

export function defaultLinkedWordingDocs(): Row[] {
  return DEFAULT_LINKED_WORDING.map((d) => ({ ...d }));
}

export function wordingDocsOf(cover: Row | undefined): Row[] {
  if (!cover) return [];
  const nested = asRows(cover.wordingDocs);
  if (nested.length) return nested;
  const name = String(cover.wordingDoc || "");
  if (name) return [{ name, version: "", code: "" }];
  return defaultLinkedWordingDocs();
}

export function constraintSummary(cover: Row | undefined) {
  const rows = constraintsOf(cover);
  if (!rows.length) return "";
  return rows.map((r) => (r.operator ? `${r.field} ${r.operator} ${r.value}` : String(r.field || r.value || ""))).join(" · ");
}
