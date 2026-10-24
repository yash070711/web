// Account-level factor: the calculation, validation and data helpers (no screen code, so it can be tested alone).
//
// One account-level factor per product version, stored as version.accountFactor:
//   { min, max, factors: [ { id, name, behavior: 'plus' | 'minus', adjustment, logic: 'any' | 'all',
//                            conditions: [ { id, ref, op, value, value2 } ] } ] }
// A condition is the same kind of test an eligibility rule uses (same operators, same matching), on one question.
// `ref` points at the question in a way that survives copying a version:
//   "product:<questionId>" | "coverage:<questionId>" | "form:<formId>:<questionId>"
//
// Calculation (additive): start at 1.00, add each applicable adjustment (plus adds, minus subtracts), then keep the result
// between the minimum and maximum. The single resulting number is what the premium formula sees as AccountFactor.
import { newId } from './product-model.js';
import { collectGroups, family, matches, ruleDone, defaultRule, OPS } from './eligibility.js';

export const ACCOUNT_CODE = 'AccountFactor';
export const ACCOUNT_LABEL = 'Account-Level Factor';
export const BASE_FACTOR = 1;

const blank = (v) => v === '' || v == null;
const num = (v) => (blank(v) ? NaN : Number(v));
// Adding signed decimals leaves float noise (1 + 0.1 + 0.2); six places is far finer than any factor.
const tidy = (n) => Math.round(n * 1e6) / 1e6;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ---- Data ----
export const blankAccountFactor = () => ({ min: '', max: '', factors: [] });
export const blankFactor = () => ({ id: newId(), name: '', behavior: 'plus', adjustment: '', logic: 'any', conditions: [] });
export const blankCondition = (ref, question) => {
  const { op, value, value2 } = defaultRule(question);
  return { id: newId(), ref, op, value, value2 };
};
// The version's account-level factor, created empty if it has none yet (older versions).
export const accountOf = (version) => (version.accountFactor ??= blankAccountFactor());
// Only a version with at least one factor has an Account-Level Factor for the formula to use.
export const isConfigured = (config) => (config?.factors ?? []).length > 0;

// ---- Questions ----
// Question key (as the stages build them) -> a reference that survives copying a version.
export const refOfKey = (key) => (key.startsWith('p:') ? `product:${key.slice(2)}` : key.startsWith('c:') ? `coverage:${key.split(':')[2]}` : `form:${key.split(':').slice(2).join(':')}`);

// Every question of the version by reference. `tagged` is true when it is ticked as an account-level factor, which is
// what makes it selectable for a condition; conditions on questions that were untagged later are reported, not dropped.
export const accountQuestions = (version, acordForms) => {
  const out = new Map();
  collectGroups(version, acordForms).forEach((g) =>
    g.qs.forEach((q) => {
      const ref = refOfKey(q.key);
      const tagged = q.uses().account;
      const have = out.get(ref);
      if (have) have.tagged ||= tagged;
      else out.set(ref, { ref, label: q.label, type: q.type, options: q.options, group: g.title, sub: g.sub, tagged });
    }),
  );
  return out;
};

// ---- Calculation ----
const conditionMet = (c, questions, answers) => {
  const q = questions.get(c.ref);
  return Boolean(q) && ruleDone(c, q) && Boolean(matches(q, c, answers?.[c.ref]));
};

// A factor with no conditions never applies. Missing or blank answers never satisfy a condition.
export const factorApplies = (factor, questions, answers) => {
  const list = factor.conditions ?? [];
  if (!list.length) return false;
  return factor.logic === 'all' ? list.every((c) => conditionMet(c, questions, answers)) : list.some((c) => conditionMet(c, questions, answers));
};

// Keep a factor between the limits. A limit that is not a number is ignored.
export const clampFactor = (value, min, max) => {
  let v = value;
  if (!Number.isNaN(num(max)) && v > num(max)) v = num(max);
  if (!Number.isNaN(num(min)) && v < num(min)) v = num(min);
  return v;
};

// answers: { [question ref]: answer }. Returns the consolidated factor and how it was reached.
export const computeAccountFactor = (config, questions, answers) => {
  const applied = [];
  (config?.factors ?? []).forEach((factor) => {
    const amount = num(factor.adjustment);
    if (!(amount >= 0) || !factorApplies(factor, questions, answers)) return;
    applied.push({ factor, amount: factor.behavior === 'minus' ? -amount : amount });
  });
  const raw = tidy(BASE_FACTOR + applied.reduce((sum, a) => sum + a.amount, 0));
  const value = tidy(clampFactor(raw, config?.min, config?.max));
  return { raw, value, applied, limited: value > raw ? 'min' : value < raw ? 'max' : null };
};

// ---- Validation ----
// Messages by "<owner id>:<field>" (so the screen can place them), plus how many problems each factor has.
export const accountFactorProblems = (config, questions) => {
  const byKey = new Map();
  const byOwner = new Map();
  const add = (owner, field, level, msg) => {
    const key = `${owner}:${field}`;
    byKey.set(key, [...(byKey.get(key) ?? []), { level, msg }]);
    if (level === 'error') byOwner.set(owner, (byOwner.get(owner) ?? 0) + 1);
  };
  const factors = config?.factors ?? [];
  const min = num(config?.min);
  const max = num(config?.max);
  // Limits are required once there is a factor to limit; if someone typed one without factors it still has to make sense.
  [['min', 'minimum'], ['max', 'maximum']].forEach(([field, word]) => {
    const raw = config?.[field];
    const n = num(raw);
    if (blank(raw)) factors.length && add('limits', field, 'error', `Enter the ${word} factor.`);
    else if (Number.isNaN(n) || n < 0) add('limits', field, 'error', 'Enter a number of 0 or more, for example 0.80.');
  });
  if (min >= 0 && max >= 0 && min > max) add('limits', 'min', 'error', 'The minimum factor cannot be more than the maximum.');
  if (factors.length && min > BASE_FACTOR) add('limits', 'min', 'warn', 'The minimum is above 1.00, so a quote with no adjustments is still raised to it.');
  if (factors.length && max < BASE_FACTOR) add('limits', 'max', 'warn', 'The maximum is below 1.00, so a quote with no adjustments is still lowered to it.');

  factors.forEach((f) => {
    if (!String(f.name ?? '').trim()) add(f.id, 'name', 'error', 'Enter a name.');
    const amount = num(f.adjustment);
    if (Number.isNaN(amount) || amount < 0) add(f.id, 'adjustment', 'error', 'Enter the adjustment as a number of 0 or more, for example 0.10.');
    else if (amount > 1) add(f.id, 'adjustment', 'warn', 'An adjustment above 1.00 will almost always reach a limit. Check it is intended.');
    const list = f.conditions ?? [];
    if (!list.length) add(f.id, 'conditions', 'error', 'Add at least one condition.');
    list.forEach((c) => {
      const q = questions.get(c.ref);
      if (!c.ref) add(f.id, `${c.id}`, 'error', 'Choose a question.');
      else if (!q) add(f.id, `${c.id}`, 'error', 'This question no longer exists. Choose another.');
      else if (!q.tagged) add(f.id, `${c.id}`, 'error', 'This question is no longer marked as an account-level factor. Mark it again or choose another.');
      else if (!OPS[family(q.type)].some((o) => o[0] === c.op)) add(f.id, `${c.id}`, 'error', 'This condition no longer fits the question’s answer type. Choose it again.');
      else if (!ruleDone(c, q)) add(f.id, `${c.id}`, 'error', 'Finish the condition: choose the answer or enter a value.');
    });
  });
  const all = [...byKey.values()].flat();
  return { byKey, byOwner, errors: all.filter((p) => p.level === 'error').length, warns: all.filter((p) => p.level === 'warn').length };
};

// What blocks publishing. No factors at all is fine: Account-Level Factor is optional.
export const accountFactorIssues = (version, acordForms) => {
  const config = version.accountFactor;
  if (!isConfigured(config) && blank(config?.min) && blank(config?.max)) return [];
  const p = accountFactorProblems(config, accountQuestions(version, acordForms));
  const nameOf = (id) => config.factors.find((f) => f.id === id)?.name?.trim() || 'a factor';
  return [...p.byOwner].map(([owner, n]) => `Account-level factors › ${owner === 'limits' ? 'minimum and maximum' : nameOf(owner)}: fix ${plural(n, 'error')}.`);
};
