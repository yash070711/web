// Account-level factor: the calculation, validation and data helpers (no screen code, so it can be tested alone).
//
// One account-level factor per product version, stored as version.accountFactor:
//   { min, max, factors: [ { id, name, behavior, dimensions: [ { id, type: 'question', source } ],
//                            rows: [ { id, keys: { [dimension id]: answer }, behavior: 'plus' | 'minus', adjustment } ] } ] }
// (`adjustment` is the row's factor value, e.g. 2.00; Plus or Minus decides whether it is added or subtracted.)
// Built like a rating factor: a factor names one question (an adjustment per answer) or several (an adjustment per valid
// combination of answers, with dependent answer lists coming from the questions themselves). `source` names the question
// in a way that survives copying a version: "product:<id>" | "coverage:<id>" | "form:<formId>:<id>". Every row has its
// own Plus / Minus; `behavior` on the factor is only what new rows start with.
//
// Calculation (additive, not the multiplication rating factors use): add the value of each applicable row, Plus rows as +value and
// Minus rows as -value (1.00 + 2.00 - 1.00 = 2.00), then keep the total between the minimum and maximum. The single resulting
// number is what the premium formula sees as AccountFactor. When no row applies there is nothing to add, so the factor is the
// neutral 1.00 (still kept between the limits).
import { newId } from './product-model.js';
import { collectGroups } from './eligibility.js';
import { comboQuestions, fieldOptions, tupleKey, isRangeDim, bandOf, bandProblems } from './combo-factor-calc.js';

export const ACCOUNT_CODE = 'AccountFactor';
export const ACCOUNT_LABEL = 'Account-Level Factor';
export const BASE_FACTOR = 1; // the factor when no row applies

const blank = (v) => v === '' || v == null;
const num = (v) => (blank(v) ? NaN : Number(v));
// Adding signed decimals leaves float noise (1 + 0.1 + 0.2); six places is far finer than any factor.
const tidy = (n) => Math.round(n * 1e6) / 1e6;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

// ---- Data ----
export const blankAccountFactor = () => ({ min: '', max: '', factors: [] });
export const blankFactor = (dimensions) => ({ id: newId(), name: '', behavior: 'plus', dimensions, rows: [] });
export const blankRow = (factor, keys = {}) => ({ id: newId(), keys, behavior: factor.behavior === 'minus' ? 'minus' : 'plus', adjustment: '' });
// Factors saved by an earlier condition-based screen have no questions or rows; they are not used any more.
const usable = (f) => Array.isArray(f?.dimensions) && Array.isArray(f?.rows);
// The version's account-level factor, created empty if it has none yet (older versions). Earlier condition-based factors are dropped.
export const accountOf = (version) => {
  const c = (version.accountFactor ??= blankAccountFactor());
  if (c.factors.some((f) => !usable(f))) c.factors = c.factors.filter(usable);
  return c;
};
// Only a version with at least one factor has an Account-Level Factor for the formula to use.
export const isConfigured = (config) => (config?.factors ?? []).some(usable);

// ---- Questions ----
// Question key (as the stages build them) -> a reference that survives copying a version.
export const refOfKey = (key) => (key.startsWith('p:') ? `product:${key.slice(2)}` : key.startsWith('c:') ? `coverage:${key.split(':')[2]}` : `form:${key.split(':').slice(2).join(':')}`);

// The questions a factor can use: choice, number and currency questions ticked as an account-level factor, wherever they
// are asked (product questions, coverage questions, and the questions of the forms attached to coverages). A number or
// currency question is sliced into ranges inside the factor (see combo-factor-calc.js). Account factors are not per
// coverage, so there are no coverages in the context.
export const accountContext = (version, acordForms) => ({ questions: comboQuestions(version, acordForms, [], 'account', true), coverages: [], all: [] });

// Every question ticked as an account-level factor, usable or not, so the list can say why one cannot be used.
//   [{ ref, label, group, type, usable }]
export const accountQuestionList = (version, acordForms) => {
  const usableRefs = accountContext(version, acordForms).questions;
  const out = new Map();
  collectGroups(version, acordForms).forEach((g) =>
    g.qs.forEach((q) => {
      const ref = refOfKey(q.key);
      if (!q.uses().account || out.has(ref)) return;
      out.set(ref, { ref, label: q.label?.trim() || 'Untitled question', group: g.title, type: q.type, usable: usableRefs.has(ref) });
    }),
  );
  return [...out.values()];
};

// ---- Calculation ----
export const rowBehavior = (factor, row) => ((row?.behavior ?? factor.behavior) === 'minus' ? 'minus' : 'plus');
// Plus or Minus belongs to the factor (the screen sets it on every row). Factors saved with different behaviours on their
// rows still calculate row by row; this reports them as 'mixed' until the person picks one for the whole factor.
export const factorBehavior = (factor) => {
  const set = new Set((factor.rows ?? []).map((r) => rowBehavior(factor, r)));
  return set.size > 1 ? 'mixed' : set.size === 1 ? [...set][0] : factor.behavior === 'minus' ? 'minus' : 'plus';
};
// The first row with a valid adjustment whose answers all match, or null. Blank answers never match.
export const matchingRow = (factor, answers) => {
  const dims = factor.dimensions ?? [];
  if (!dims.length) return null;
  const matches = (d, r) => {
    if (blank(answers?.[d.source])) return false;
    if (!isRangeDim(d)) return same(answers[d.source], r.keys?.[d.id]);
    // A number or currency answer matches the row whose range it falls in.
    const band = bandOf(d, answers[d.source]);
    return Boolean(band) && band.id === r.keys?.[d.id];
  };
  return (factor.rows ?? []).find((r) => num(r.adjustment) >= 0 && dims.every((d) => matches(d, r))) ?? null;
};

// Keep a factor between the limits. A limit that is not a number is ignored.
export const clampFactor = (value, min, max) => {
  let v = value;
  if (!Number.isNaN(num(max)) && v > num(max)) v = num(max);
  if (!Number.isNaN(num(min)) && v < num(min)) v = num(min);
  return v;
};

// answers: { [question ref]: answer }. Returns the consolidated factor and how it was reached. The adjustments are
// combined first (raw); the limits are applied to that total afterwards (value).
export const computeAccountFactor = (config, answers) => {
  const applied = [];
  (config?.factors ?? []).filter(usable).forEach((factor) => {
    const row = matchingRow(factor, answers);
    if (row) applied.push({ factor, row, amount: rowBehavior(factor, row) === 'minus' ? -num(row.adjustment) : num(row.adjustment) });
  });
  const raw = applied.length ? tidy(applied.reduce((sum, a) => sum + a.amount, 0)) : BASE_FACTOR;
  const value = tidy(clampFactor(raw, config?.min, config?.max));
  return { raw, value, applied, limited: value > raw ? 'min' : value < raw ? 'max' : null };
};

// ---- Validation ----
// Messages by "<owner id>:<field>" (so the screen can place them), plus how many problems each factor has.
export const accountFactorProblems = (config, ctx = { questions: new Map(), coverages: [], all: [] }) => {
  const byKey = new Map();
  const byOwner = new Map();
  const add = (owner, field, level, msg) => {
    const key = `${owner}:${field}`;
    byKey.set(key, [...(byKey.get(key) ?? []), { level, msg }]);
    if (level === 'error') byOwner.set(owner, (byOwner.get(owner) ?? 0) + 1);
  };
  // Outline a cell without a message of its own (the row shows one message).
  const mark = (owner, field) => byKey.set(`${owner}:${field}`, [...(byKey.get(`${owner}:${field}`) ?? []), { level: 'mark', msg: '' }]);

  const factors = (config?.factors ?? []).filter(usable);
  const min = num(config?.min);
  const max = num(config?.max);
  // Limits are required once there is a factor to limit; if someone typed one without factors it still has to make sense.
  [['min', 'minimum'], ['max', 'maximum']].forEach(([field, word]) => {
    const raw = config?.[field];
    const n = num(raw);
    if (blank(raw)) factors.length && add('limits', field, 'error', `Enter the ${word} factor.`);
    else if (Number.isNaN(n) || n < 0) add('limits', field, 'error', 'Enter a number of 0 or more, for example 0.85.');
  });
  if (min >= 0 && max >= 0 && min > max) add('limits', 'min', 'error', 'The minimum factor cannot be more than the maximum.');

  factors.forEach((f) => {
    if (!String(f.name ?? '').trim()) add(f.id, 'name', 'error', 'Enter a name.');
    const dims = f.dimensions;
    const rows = f.rows;
    if (!dims.length) add(f.id, 'general', 'error', 'Choose at least one question.');
    const missing = dims.filter((d) => !ctx.questions.has(d.source));
    if (missing.length) add(f.id, 'general', 'error', 'A question used here is no longer available, or no longer marked as an account-level factor. Remove it from the factor.');
    dims.forEach((d) => {
      const q = ctx.questions.get(d.source);
      if (!q) return;
      if ((q.kind === 'range') !== isRangeDim(d)) add(f.id, 'general', 'error', `“${q.label}” changed type. Remove it from the factor and add it again.`);
      // The ranges of a number or currency question; their messages sit under each range.
      else if (isRangeDim(d)) bandProblems(d, q, (id, field, level, msg) => add(f.id, id === 'general' ? 'general' : `band:${id}`, level, msg));
    });
    if (dims.length && !rows.length) add(f.id, 'general', 'error', 'Add at least one combination.');
    const seen = new Set();
    rows.forEach((r) => {
      const field = `row:${r.id}`;
      let complete = true;
      dims.forEach((d) => {
        const q = ctx.questions.get(d.source);
        if (!q) return;
        const v = r.keys?.[d.id];
        if (blank(v)) {
          add(f.id, field, 'error', `Choose ${q.label}.`);
          mark(f.id, `${field}:${d.id}`);
          complete = false;
          return;
        }
        const o = fieldOptions(d, f, r.keys, ctx);
        if (!o.options.some((x) => x.value === v)) {
          add(f.id, field, 'error', o.empty || o.waiting || `“${v}” is not a valid answer for ${q.label} here. Choose again.`);
          mark(f.id, `${field}:${d.id}`);
          complete = false;
        }
      });
      const n = num(r.adjustment);
      if (Number.isNaN(n) || n < 0) {
        add(f.id, field, 'error', 'Enter the factor value as a number of 0 or more, for example 1.00.');
        mark(f.id, `${field}:adj`);
      }
      if (complete && !missing.length) {
        const k = tupleKey(f, r.keys);
        if (seen.has(k)) {
          add(f.id, field, 'error', 'This combination is already configured above.');
          mark(f.id, `${field}:${dims[0].id}`);
        } else seen.add(k);
      }
    });
  });
  const all = [...byKey.values()].flat();
  return { byKey, byOwner, errors: all.filter((p) => p.level === 'error').length, warns: all.filter((p) => p.level === 'warn').length };
};

// What blocks publishing. No factors at all is fine: Account-Level Factor is optional.
export const accountFactorIssues = (version, acordForms) => {
  const config = version.accountFactor;
  if (!isConfigured(config) && blank(config?.min) && blank(config?.max)) return [];
  const p = accountFactorProblems(config, accountContext(version, acordForms));
  const nameOf = (id) => config.factors.find((f) => f.id === id)?.name?.trim() || 'a factor';
  return [...p.byOwner].map(([owner, n]) => `Account-level factors › ${owner === 'limits' ? 'minimum and maximum' : nameOf(owner)}: fix ${plural(n, 'error')}.`);
};
