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

const COND_OPERATORS = ["!=", ">=", "<=", "==", "=", "<", ">"];

function parseSimpleCondition(cond: string): { field: string; op: string; value: string } | null {
  const trimmed = cond.trim();
  if (!trimmed) return null;
  for (const op of COND_OPERATORS) {
    const idx = trimmed.indexOf(op);
    if (idx > 0) return { field: trimmed.slice(0, idx).trim(), op, value: trimmed.slice(idx + op.length).trim() };
  }
  return null;
}

function conditionApplies(row: ConfigRow, answers: Answers): boolean {
  const cond = asStr(row.condition);
  if (!cond) return true;
  const parsed = parseSimpleCondition(cond);
  if (!parsed) return true;
  return evalCondition(answers[parsed.field], parsed.op, parsed.value);
}

function behaviorApply(acc: number, behavior: string, value: number): number {
  if (behavior === "divide") return value === 0 ? acc : acc / value;
  if (behavior === "plus") return acc + value;
  if (behavior === "minus") return acc - value;
  return acc * value;
}

function behaviorSymbol(behavior: string): string {
  if (behavior === "divide") return "÷";
  if (behavior === "plus") return "+";
  if (behavior === "minus") return "−";
  return "×";
}

// Tokens available to a custom formula: BASE, FACTORS, LOADINGS, DISCOUNTS, ADDONS, FEES, TAXES
// (each an aggregate of its component type) plus every component's own id for fine-grained formulas.
export const DEFAULT_PREMIUM_EXPRESSION = "BASE * FACTORS + LOADINGS - DISCOUNTS + ADDONS + FEES + TAXES";

type FormulaToken = { type: "num" | "id" | "op"; value: string };

// Known token names (component ids, e.g. "RAT-CT-FAC-001") are matched greedily before "-" is
// treated as the subtraction operator, so hyphenated ids never get split apart.
function tokenizeFormula(expr: string, knownTokens: string[]): FormulaToken[] {
  const sorted = [...new Set(knownTokens.filter(Boolean))].sort((a, b) => b.length - a.length);
  const tokens: FormulaToken[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    const known = sorted.find((t) => expr.startsWith(t, i));
    if (known) { tokens.push({ type: "id", value: known }); i += known.length; continue; }
    if ("+-*/()".includes(ch)) { tokens.push({ type: "op", value: ch }); i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ type: "num", value: expr.slice(i, j) });
      i = j;
      continue;
    }
    let j = i;
    while (j < expr.length && !/[\s+\-*/()]/.test(expr[j])) j++;
    tokens.push({ type: "id", value: expr.slice(i, Math.max(j, i + 1)) });
    i = Math.max(j, i + 1);
  }
  return tokens;
}

// Small recursive-descent evaluator for +,-,*,/ and parentheses over known tokens.
// Deliberately not eval()/Function() — formulas are user-authored data, not trusted code.
export function evalFormula(expression: string, tokenValues: Record<string, number>): number {
  const raw = (expression || "").trim();
  if (!raw) throw new Error("Formula is empty");
  const tokens = tokenizeFormula(raw, Object.keys(tokenValues));
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpr(): number {
    let value = parseTerm();
    while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
      const op = consume().value;
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseUnary();
    while (peek() && peek().type === "op" && (peek().value === "*" || peek().value === "/")) {
      const op = consume().value;
      const rhs = parseUnary();
      if (op === "/") {
        if (rhs === 0) throw new Error("Division by zero in formula");
        value = value / rhs;
      } else value = value * rhs;
    }
    return value;
  }
  function parseUnary(): number {
    if (peek()?.type === "op" && peek().value === "-") { consume(); return -parseUnary(); }
    if (peek()?.type === "op" && peek().value === "+") { consume(); return parseUnary(); }
    return parsePrimary();
  }
  function parsePrimary(): number {
    const t = peek();
    if (!t) throw new Error("Unexpected end of formula");
    if (t.type === "num") { consume(); return Number(t.value); }
    if (t.type === "id") {
      consume();
      if (!(t.value in tokenValues)) throw new Error(`Unknown token "${t.value}"`);
      return tokenValues[t.value];
    }
    if (t.type === "op" && t.value === "(") {
      consume();
      const value = parseExpr();
      const close = consume();
      if (!close || close.value !== ")") throw new Error("Missing closing parenthesis");
      return value;
    }
    throw new Error(`Unexpected token "${t.value}"`);
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error(`Unexpected token "${tokens[pos].value}"`);
  if (!Number.isFinite(result)) throw new Error("Formula did not evaluate to a number");
  return result;
}

export function rateQuote(components: ConfigRow[], answers: Answers, addonCount = 0) {
  const trail: { id: string; name: string; type: string; effect: string }[] = [];
  const tokens: Record<string, number> = {};

  const baseRow = components.find((c) => asStr(c.type) === "base");
  let base = moneyAmount(baseRow?.amount) || 0;
  if (baseRow) {
    const stateMode = asStr(baseRow.stateMode, "uniform");
    const userState = asStr(answers.state || answers.jurisdiction || answers.operating_state).toUpperCase();
    if (stateMode === "multi_state" && Array.isArray(baseRow.stateRates)) {
      const stateRates = baseRow.stateRates as ConfigRow[];
      const matched = stateRates.find((r) => asStr(r.state).toUpperCase() === userState) || stateRates.find((r) => asStr(r.state).toUpperCase() === "DEFAULT");
      if (matched && moneyAmount(matched.amount)) {
        base = moneyAmount(matched.amount);
        trail.push({ id: asStr(baseRow.id), name: `${asStr(baseRow.name)} (${asStr(matched.name || matched.state)} Base Rate)`, type: "base", effect: `$${base}` });
      } else {
        trail.push({ id: asStr(baseRow.id), name: `${asStr(baseRow.name)} (Default Uniform Rate)`, type: "base", effect: `$${base}` });
      }
    } else {
      trail.push({ id: asStr(baseRow.id), name: asStr(baseRow.name), type: "base", effect: `$${base}` });
    }
    tokens[asStr(baseRow.id)] = base;
  }
  tokens.BASE = base;

  let factor = 1;
  for (const row of components.filter((c) => asStr(c.type) === "factor")) {
    const lookup = asStr(row.field) || asStr(row.lookupAttr);
    const mult = parseMultiplier(asStr(row.bands), answers[lookup], row.table1D);
    const behavior = asStr(row.behavior, "multiply");
    factor = behaviorApply(factor, behavior, mult);
    tokens[asStr(row.id)] = mult;
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "factor", effect: `${behaviorSymbol(behavior)}${mult}` });
  }
  tokens.FACTORS = factor;

  let loading = 0;
  for (const row of components.filter((c) => asStr(c.type) === "loading")) {
    if (!conditionApplies(row, answers)) continue;
    const amt = asStr(row.amount);
    const value = amt.includes("%") ? base * factor * (moneyAmount(amt) / 100) : moneyAmount(amt);
    loading += value;
    tokens[asStr(row.id)] = value;
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "loading", effect: `+${amt}` });
  }
  tokens.LOADINGS = loading;

  let discount = 0;
  for (const row of components.filter((c) => asStr(c.type) === "discount")) {
    if (!conditionApplies(row, answers)) continue;
    const amt = asStr(row.amount);
    const value = amt.includes("%") ? base * factor * (moneyAmount(amt) / 100) : moneyAmount(amt);
    discount += value;
    tokens[asStr(row.id)] = value;
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "discount", effect: `−${amt}` });
  }
  tokens.DISCOUNTS = discount;

  const addons = Math.round(base * factor * addonCount * 0.1);
  tokens.ADDONS = addons;
  if (addonCount) trail.push({ id: "ADDONS", name: "Optional add-ons", type: "addon", effect: `+$${addons}` });

  let fees = 0;
  for (const row of components.filter((c) => asStr(c.type) === "fee")) {
    const value = moneyAmount(row.amount);
    fees += value;
    tokens[asStr(row.id)] = value;
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "fee", effect: `+$${value}` });
  }
  tokens.FEES = fees;

  const preTax = Math.max(0, base * factor + loading - discount + addons + fees);

  let tax = 0;
  for (const row of components.filter((c) => asStr(c.type) === "tax")) {
    const amt = asStr(row.amount);
    const value = amt.includes("%") ? preTax * (moneyAmount(amt) / 100) : moneyAmount(amt);
    tax += value;
    tokens[asStr(row.id)] = value;
    trail.push({ id: asStr(row.id), name: asStr(row.name), type: "tax", effect: amt.includes("%") ? amt : `+$${value}` });
  }
  tokens.TAXES = tax;

  const formulaRow = components.find((c) => asStr(c.type) === "formula");
  const expression = asStr(formulaRow?.expression) || DEFAULT_PREMIUM_EXPRESSION;
  let payable: number;
  let formulaError: string | undefined;
  try {
    payable = Math.round(Math.max(0, evalFormula(expression, tokens)));
  } catch (err) {
    formulaError = err instanceof Error ? err.message : "Invalid formula";
    try {
      payable = Math.round(Math.max(0, evalFormula(DEFAULT_PREMIUM_EXPRESSION, tokens)));
    } catch {
      payable = 0;
    }
  }

  return {
    formula: expression,
    base,
    factor: Number(factor.toFixed(3)),
    loading: Math.round(loading),
    discount: Math.round(discount),
    addons,
    fees: Math.round(fees),
    tax: Math.round(tax),
    payable,
    trail,
    tokens,
    formulaError,
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
