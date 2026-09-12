import { PREMIUM_FORMULA } from "./blueprint";

export type Answers = Record<string, string | number | boolean | null | undefined>;
export type ConfigRow = Record<string, unknown>;

function asStr(value: unknown, fallback = "") {
  return value == null ? fallback : String(value);
}

export function evalCondition(left: unknown, operator: string, right: string): boolean {
  if (left == null || left === "") return false;
  const op = operator.trim().toLowerCase();
  const raw = String(left);
  const leftNum = Number(raw);
  const rightNum = Number(right);
  const listOps = ["in", "not in", "is one of"];
  const numeric = Number.isFinite(leftNum) && Number.isFinite(rightNum) && !listOps.includes(op);
  if (numeric) {
    if (op === "<") return leftNum < rightNum;
    if (op === "<=" || op === "≤") return leftNum <= rightNum;
    if (op === ">") return leftNum > rightNum;
    if (op === ">=" || op === "≥") return leftNum >= rightNum;
    if (op === "=" || op === "==" || op === "is") return leftNum === rightNum;
  }
  const list = right.split(",").map((s) => s.trim().toLowerCase());
  const needle = raw.toLowerCase();
  if (op === "in" || op === "is one of") return list.some((item) => needle.includes(item) || item === needle);
  if (op === "not in") return !list.some((item) => needle.includes(item) || item === needle);
  if (op === "is not" || op === "!=" || op === "≠") return needle !== right.toLowerCase();
  if (op === "=" || op === "==" || op === "is") return needle === right.toLowerCase();
  return false;
}

function conditionsOfRule(rule: ConfigRow) {
  const nested = Array.isArray(rule.conditions) ? rule.conditions as ConfigRow[] : [];
  if (nested.length) return nested;
  const tree = rule.condition;
  if (tree && typeof tree === "object" && Array.isArray((tree as ConfigRow).groups)) {
    return ((tree as ConfigRow).groups as ConfigRow[]).flatMap((g, gi) =>
      (Array.isArray(g.rows) ? (g.rows as ConfigRow[]) : []).map((r, ri) => ({
        field: r.f || r.field,
        op: r.op,
        operator: r.op,
        value: r.v ?? r.value,
        connector: gi > 0 || ri > 0 ? g.logic || "AND" : "",
      }))
    );
  }
  if (rule.field) return [{ field: rule.field, op: rule.operator || "=", value: rule.value }];
  return [];
}

export function ruleMatches(rule: ConfigRow, answers: Answers): boolean {
  const conds = conditionsOfRule(rule);
  if (!conds.length) return false;
  const logic = asStr(rule.logic, "and").toLowerCase();
  const results = conds.map((c) => evalCondition(answers[asStr(c.field)], asStr(c.op || c.operator, "="), asStr(c.value)));
  if (logic === "or") return results.some(Boolean);
  let acc = results[0] || false;
  for (let i = 1; i < conds.length; i++) {
    const conn = asStr(conds[i].connector, "AND").toUpperCase();
    acc = conn === "OR" ? acc || results[i] : acc && results[i];
  }
  return acc;
}

function rulePreview(rule: ConfigRow) {
  const outcome = asStr(rule.outcome || rule.direction).toUpperCase();
  const logic = asStr(rule.logic, "AND").toUpperCase();
  const conds = conditionsOfRule(rule);
  const body = conds.length
    ? conds.map((c) => `${asStr(c.field)} ${asStr(c.op || c.operator, "=")} ${asStr(c.value)}`).join(` ${logic} `)
    : `${asStr(rule.field)} ${asStr(rule.operator)} ${asStr(rule.value)}`;
  return `${outcome} when ${body}`;
}

export function runEligibility(rules: ConfigRow[], answers: Answers) {
  const ordered = [...rules].sort((a, b) => Number(a.priority || 100) - Number(b.priority || 100));
  const fired = ordered.filter((rule) => {
    if (asStr(rule.status, "active") !== "active") return false;
    return ruleMatches(rule, answers);
  });
  const block = fired.find((r) => {
    const outcome = asStr(r.outcome).toLowerCase();
    if (outcome === "decline") return true;
    if (outcome === "ineligible" && asStr(r.outcomeType) !== "soft") return true;
    return false;
  });
  const refer = fired.find((r) => asStr(r.outcome).toLowerCase() === "refer");
  return {
    eligible: !block,
    decision: block ? "ineligible" : refer ? "refer" : "eligible",
    fired: fired.map((r) => ({
      id: asStr(r.id),
      name: asStr(r.name),
      outcome: asStr(r.outcome),
      preview: rulePreview(r),
      customerMsg: asStr(r.customerMsg),
    })),
  };
}

const UW_RANK: Record<string, number> = {
  decline: 1,
  refer: 2,
  restrict: 3,
  load: 4,
  evidence: 5,
  accept: 9,
};

export function runUnderwriting(rules: ConfigRow[], answers: Answers) {
  const fired = rules.filter((rule) => {
    const outcome = asStr(rule.outcome || rule.type).toLowerCase();
    if (outcome === "accept") return false;
    return ruleMatches({ ...rule, outcome }, answers);
  });
  fired.sort((a, b) => (UW_RANK[asStr(a.outcome || a.type).toLowerCase()] || 8) - (UW_RANK[asStr(b.outcome || b.type).toLowerCase()] || 8));
  const top = fired[0];
  const outcome = top ? asStr(top.outcome || top.type).toLowerCase() : "accept";
  return {
    outcome,
    reason: top ? asStr(top.name) : "Standard commercial accept",
    message: top ? asStr(top.description) || asStr(top.restriction) || asStr(top.loading) : "Accept if no decline, refer, load, or restrict rule has fired.",
    fired: fired.map((r) => ({
      id: asStr(r.id),
      name: asStr(r.name),
      outcome: asStr(r.outcome || r.type),
      preview: rulePreview({ ...r, outcome: r.outcome || r.type }),
    })),
  };
}

function lookupTable1D(table: unknown, value: unknown): number | null {
  if (!Array.isArray(table) || !table.length) return null;
  const raw = String(value ?? "");
  const num = Number(raw);
  for (const row of table as ConfigRow[]) {
    const band = asStr(row.band);
    const multRaw = asStr(row.mult);
    if (multRaw.includes("%")) continue;
    const mult = Number(multRaw);
    if (!Number.isFinite(mult)) continue;
    if (!Number.isFinite(num)) {
      if (band && (raw.toLowerCase() === band.toLowerCase() || raw.toLowerCase().includes(band.split(" ")[0].toLowerCase()))) return mult;
      continue;
    }
    const range = band.match(/([\d.,]+)\s*[–-]\s*([\d.,]+)/);
    if (range && num >= Number(range[1].replace(",", "")) && num <= Number(range[2].replace(",", ""))) return mult;
    const lte = band.match(/[≤<=]+\s*([\d.,]+)/);
    if (lte && num <= Number(lte[1].replace(",", ""))) return mult;
    const gte = band.match(/[≥>=]+\s*([\d.,]+)/);
    if (gte && num >= Number(gte[1].replace(",", ""))) return mult;
    const plus = band.match(/([\d.,]+)\s*\+/);
    if (plus && num >= Number(plus[1].replace(",", ""))) return mult;
  }
  return null;
}

function parseMultiplier(bands: string, value: unknown, table?: unknown): number {
  const fromTable = lookupTable1D(table, value);
  if (fromTable != null) return fromTable;
  if (!bands) return 1;
  const raw = String(value ?? "");
  const num = Number(raw);
  const parts = bands.split("·").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const multMatch = part.match(/×\s*([0-9.]+)|x\s*([0-9.]+)|([0-9.]+)\s*$/i);
    const mult = Number(multMatch?.[1] || multMatch?.[2] || (part.match(/([0-9.]+)\s*$/) || [])[1] || 1);
    const label = part.replace(/×\s*[0-9.]+/i, "").replace(/\s+[0-9.]+\s*$/, "").trim();
    if (!Number.isFinite(num)) {
      if (label && raw.toLowerCase().includes(label.split(" ")[0].toLowerCase())) return Number.isFinite(mult) ? mult : 1;
      continue;
    }
    const range = label.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
    if (range && num >= Number(range[1]) && num <= Number(range[2])) return mult;
    const lte = label.match(/[≤<=]+\s*([\d.]+)/);
    if (lte && num <= Number(lte[1])) return mult;
    const gte = label.match(/[≥>=]+\s*([\d.]+)/);
    if (gte && num >= Number(gte[1])) return mult;
    const plus = label.match(/([\d.]+)\s*\+/);
    if (plus && num >= Number(plus[1])) return mult;
  }
  const last = parts[parts.length - 1]?.match(/×\s*([0-9.]+)/);
  return last ? Number(last[1]) : 1;
}

function moneyAmount(value: unknown): number {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function rateQuote(components: ConfigRow[], answers: Answers, addonCount = 0) {
  const trail: { id: string; name: string; type: string; effect: string }[] = [];
  const baseRow = components.find((c) => asStr(c.type) === "base");
  const base = moneyAmount(baseRow?.amount) || 0;
  if (baseRow) trail.push({ id: asStr(baseRow.id), name: asStr(baseRow.name), type: "base", effect: `$${base}` });

  let factor = 1;
  for (const row of components.filter((c) => asStr(c.type) === "factor")) {
    const lookup = asStr(row.field) || asStr(row.lookupAttr);
    const mult = parseMultiplier(asStr(row.bands), answers[lookup], row.table1D);
    factor *= mult;
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "factor", effect: `×${mult}` });
  }

  let loading = 0;
  for (const row of components.filter((c) => asStr(c.type) === "loading")) {
    const cond = asStr(row.condition);
    const field = cond.split("=")[0]?.trim();
    const expected = cond.split("=")[1]?.trim();
    const applies = !cond || (expected ? String(answers[field]).toLowerCase() === expected.toLowerCase() : true);
    if (!applies) continue;
    const amt = asStr(row.amount);
    if (amt.includes("%")) loading += base * factor * (moneyAmount(amt) / 100);
    else loading += moneyAmount(amt);
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "loading", effect: `+${amt}` });
  }

  let discount = 0;
  for (const row of components.filter((c) => asStr(c.type) === "discount")) {
    const amt = asStr(row.amount);
    if (amt.includes("%")) discount += base * factor * (moneyAmount(amt) / 100);
    else discount += moneyAmount(amt);
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "discount", effect: `−${amt}` });
  }

  const addons = Math.round(base * factor * addonCount * 0.1);
  if (addonCount) trail.push({ id: "ADDONS", name: "Optional add-ons", type: "addon", effect: `+$${addons}` });

  let fees = 0;
  for (const row of components.filter((c) => asStr(c.type) === "fee")) {
    fees += moneyAmount(row.amount);
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "fee", effect: `+$${moneyAmount(row.amount)}` });
  }

  const subtotal = Math.max(0, base * factor + loading - discount + addons + fees);
  let tax = 0;
  for (const row of components.filter((c) => asStr(c.type) === "tax")) {
    const amt = asStr(row.amount);
    tax += amt.includes("%") ? subtotal * (moneyAmount(amt) / 100) : moneyAmount(amt);
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "tax", effect: amt.includes("%") ? amt : `+$${moneyAmount(amt)}` });
  }

  const payable = Math.round(subtotal + tax);
  return {
    formula: PREMIUM_FORMULA,
    base,
    factor: Number(factor.toFixed(3)),
    loading: Math.round(loading),
    discount: Math.round(discount),
    addons,
    fees: Math.round(fees),
    tax: Math.round(tax),
    payable,
    trail,
  };
}

export function runQuote(input: {
  productId: string;
  version: string;
  answers: Answers;
  addonCount?: number;
  eligibility: ConfigRow[];
  underwriting: ConfigRow[];
  rating: ConfigRow[];
  covers?: ConfigRow[];
  documents?: ConfigRow[];
}) {
  const eligibility = runEligibility(input.eligibility, input.answers);
  const underwriting = eligibility.eligible
    ? runUnderwriting(input.underwriting, input.answers)
    : { outcome: "ineligible", reason: eligibility.fired[0]?.name || "Eligibility block", message: eligibility.fired[0]?.customerMsg || "", fired: [] as ReturnType<typeof runUnderwriting>["fired"] };
  const rating = eligibility.eligible ? rateQuote(input.rating, input.answers, input.addonCount || 0) : rateQuote(input.rating, input.answers, 0);
  if (!eligibility.eligible) rating.payable = 0;

  return {
    eligibility,
    underwriting,
    rating,
    snapshot: {
      productId: input.productId,
      version: input.version,
      answers: input.answers,
      covers: (input.covers || []).map((c) => ({
        id: asStr(c.id),
        name: asStr(c.name),
        sumInsured: asStr(c.sumInsured),
        deductible: asStr(c.deductibleAmount) || asStr(c.deductiblePct),
        basis: asStr(c.basisOfCoverage),
      })),
      documents: (input.documents || []).map((d) => ({ id: asStr(d.id), name: asStr(d.name), version: asStr(d.version) })),
      premium: rating,
      underwritingDecision: underwriting.outcome,
      at: new Date().toISOString(),
    },
  };
}
