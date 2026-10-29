// Combination factors: the data, dependent answer lists, validation and matching (no screen code, so it can be tested alone).
//
// A rating factor on a single question (factors.js) gives one value per answer. A combination factor gives one value per
// COMBINATION of answers to several questions, optionally also per coverage:
//
//   version.comboFactors = [ { id, name, code, coverageIds, fallback,
//                              dimensions: [ { id, type: 'question' | 'coverage', source } ],
//                              rows: [ { id, keys: { [dimension id]: answer | library coverage id }, value } ] } ]
//
// `source` names a question the same way ratings do: "product:<id>", "coverage:<id>" or "form:<formId>:<id>".
// `coverageIds` (library coverage ids) limit the factor to those coverages; empty = every coverage may use it.
//
// A number or currency question is a column too. It owns its ranges, because a range only means something next to the
// question it slices: dimension = { id, type: 'question', source, bands: [ { id, min, max } ] }, and a row picks one of
// them (keys[dimension id] = band id). A range includes its From value and stops just before its To value, like the
// ranges of a single-question factor. A dimension without `bands` is a choice column.
//
// Dependent dropdowns come from the questions themselves. A choice question may say which answers of another question
// it is valid with (set in the form builder):
//   question.dependsOn = { question: <id of the other question>, allowed: { "<its answer>": ["<this question's valid answers>"] } }
// Nothing here knows any answer text; the lists are whatever the questions say.
import { newId, coverageChoices, scopeIds, inScope } from './product-model.js';
import { formFor } from './form-versions.js';
import { questionHandle, formHandle } from './question-uses.js';
import { CODE, RESERVED, codeCounts, codeClashes, collectFactorGroups } from './factors.js';

const CHOICE_TYPES = ['dropdown', 'radio', 'yesno', 'checkbox'];
const RANGE_TYPES = ['number', 'currency'];
const blank = (v) => v === '' || v == null;
const num = (v) => (blank(v) ? NaN : Number(v));
const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const fmt = (v) => (Number.isNaN(num(v)) ? String(v ?? '') : Number(v).toLocaleString('en-US'));

// ---- Data ----
export const comboOf = (version) => (version.comboFactors ??= []);
export const blankCombo = () => ({ id: newId(), name: '', code: '', coverageIds: [], fallback: '1.00', dimensions: [], rows: [] });
export const blankRow = () => ({ id: newId(), keys: {}, value: '' });

// ---- Ranges (number and currency questions) ----
export const isRangeDim = (d) => Array.isArray(d?.bands);
export const blankBand = (min = '') => ({ id: newId(), min, max: '' });
// A column for a question. `kind` is the question's kind in the Rating factors list: 'choice' | 'range'.
export const newQuestionDim = (source, kind) => ({ id: newId(), type: 'question', source, ...(kind === 'range' ? { bands: [blankBand('0')] } : {}) });
const bandStart = (b) => (Number.isNaN(num(b.min)) ? Infinity : num(b.min));
export const sortedBands = (d) => [...(d.bands ?? [])].sort((a, b) => (bandStart(a) === bandStart(b) ? 0 : bandStart(a) < bandStart(b) ? -1 : 1));
export const bandLabel = (b, currency = false) => {
  const cur = currency ? '$' : '';
  return `${blank(b.min) ? '…' : `${cur}${fmt(b.min)}`} to ${blank(b.max) ? 'and above' : `${cur}${fmt(b.max)}`}`;
};
// The range an answer falls in, or null: From is included, To is not.
export const bandOf = (d, answer) => {
  const v = num(answer);
  if (Number.isNaN(v)) return null;
  return sortedBands(d).find((b) => v >= num(b.min) && (blank(b.max) || v < num(b.max))) ?? null;
};

// ---- Questions a combination can use ----
// Choice questions of a version (or of the coverages with this library id), keyed like ratings key them.
//   Map(key -> { key, label, group, options, parentKey, allowed })
// parentKey/allowed are set when the question depends on another question of the same source.
// `use` is the category a question must be ticked for: 'rating' (rating factors) or 'account' (account-level factor).
// `ranges`: also offer number and currency questions (kind 'range'); the account-level factor has no ranges, so it leaves this off.
export const comboQuestions = (version, acordForms, scope = [], use = 'rating', ranges = false) => {
  const out = new Map();
  // Same list as the Rating factors tab: only questions ticked as a rating factor (Questions step, form builder, or
  // “Add question” on the rating stages) can be used.
  const add = (q, key, group, handle) => {
    const range = ranges && RANGE_TYPES.includes(q.type);
    if (!(CHOICE_TYPES.includes(q.type) || range) || !handle.uses()[use] || out.has(key)) return;
    const prefix = key.slice(0, key.lastIndexOf(':') + 1);
    out.set(key, {
      key,
      group,
      type: q.type,
      kind: range ? 'range' : 'choice',
      label: q.label?.trim() || 'Untitled question',
      options: range ? [] : q.type === 'yesno' || q.type === 'checkbox' ? ['Yes', 'No'] : [...new Set((q.options ?? []).filter(Boolean))],
      parentKey: q.dependsOn?.question ? `${prefix}${q.dependsOn.question}` : '',
      allowed: q.dependsOn?.question ? q.dependsOn.allowed ?? {} : null,
    });
  };
  (version.questions ?? []).forEach((q) => add(q, `product:${q.id}`, 'Product questions', questionHandle(q)));
  version.components.forEach((c) =>
    c.classes.forEach((k) =>
      k.coverages.forEach((cov) => {
        if (scope.length && !scope.includes(cov.coverageId)) return;
        (cov.questions ?? []).forEach((q) => add(q, `coverage:${q.id}`, `Coverage › ${cov.name}`, questionHandle(q)));
        (cov.forms ?? []).forEach((att) => {
          const form = formFor(att, acordForms);
          if (!form) return;
          const excluded = att.excluded ?? [];
          form.sections.flatMap((s) => s.questions).filter((q) => !excluded.includes(q.id)).forEach((q) => add(q, `form:${form.id}:${q.id}`, `Form › ${form.name}`, formHandle(cov, `${form.id}:${q.id}`, q)));
        });
      }),
    ),
  );
  return out;
};

// The context every function below needs.
export const comboContext = (version, acordForms, combo) => ({
  questions: comboQuestions(version, acordForms, combo ? scopeIds(combo) : [], 'rating', true),
  // The coverages a row can name: the factor's own when it is limited to some, else every coverage of the product.
  coverages: coverageChoices(version.components).filter((c) => !combo || inScope(combo, c.id)),
  all: coverageChoices(version.components),
});

// ---- Dependent answer lists ----
// The dimension of the question this one depends on, when the factor uses both.
const parentDim = (dim, combo, ctx) => {
  const q = ctx.questions.get(dim.source);
  return q?.parentKey ? combo.dimensions.find((d) => d.source === q.parentKey) : undefined;
};

// What one field of a row can be set to, given the other fields of the same row (keys).
//   { options: [{ value, label }], waiting: 'Choose X first' | '', empty: 'why there is nothing to choose' | '', missing }
export const fieldOptions = (dim, combo, keys, ctx) => {
  if (dim.type === 'coverage') {
    const list = ctx.coverages.map((c) => ({ value: c.id, label: c.name }));
    return { options: list, waiting: '', empty: list.length ? '' : 'This product has no coverages yet.' };
  }
  const q = ctx.questions.get(dim.source);
  if (!q) return { options: [], waiting: '', empty: '', missing: true };
  // A number or currency question offers its own ranges.
  if (q.kind === 'range' || isRangeDim(dim)) {
    const list = sortedBands(dim).map((b) => ({ value: b.id, label: bandLabel(b, q.type === 'currency') }));
    return { options: list, waiting: '', empty: list.length ? '' : `Add ranges for “${q.label}” first.` };
  }
  const all =q.options.map((o) => ({ value: o, label: o }));
  const parent = parentDim(dim, combo, ctx);
  if (!parent) return { options: all, waiting: '', empty: all.length ? '' : `“${q.label}” has no answer options.` };
  const parentLabel = ctx.questions.get(parent.source)?.label ?? 'the other question';
  const chosen = keys?.[parent.id];
  if (blank(chosen)) return { options: [], waiting: `Choose ${parentLabel} first`, empty: '' };
  const allowed = q.allowed?.[chosen] ?? null;
  const list = allowed ? all.filter((o) => allowed.some((a) => same(a, o.value))) : [];
  return { options: list, waiting: '', empty: list.length ? '' : `No “${q.label}” answers are configured for “${chosen}”. Set them in the form builder.` };
};

// After something changed, clear every field whose value is no longer one of its options (a changed upstream answer
// invalidates the downstream ones). Repeats until nothing changes because dependencies can chain.
// Returns the labels of the fields that were cleared.
export const settleKeys = (combo, keys, ctx) => {
  const cleared = [];
  for (let pass = 0; pass <= combo.dimensions.length; pass += 1) {
    let changed = false;
    combo.dimensions.forEach((d) => {
      if (blank(keys[d.id])) return;
      const { options, missing } = fieldOptions(d, combo, keys, ctx);
      if (!missing && !options.some((o) => o.value === keys[d.id])) {
        keys[d.id] = '';
        cleared.push(d.type === 'coverage' ? 'Coverage' : ctx.questions.get(d.source)?.label ?? 'a field');
        changed = true;
      }
    });
    if (!changed) break;
  }
  return cleared;
};

// ---- Generating every valid combination ----
// All combinations of the factor's columns that its dependencies allow: a dependent question only takes the answers
// valid for the answer chosen in the question it depends on, and Coverage takes the coverages that apply.
// Stops at `limit` rows. Returns { list: [{ [dimension id]: answer }], truncated }.
export const allCombinations = (combo, ctx, limit = 2000) => {
  const order = [];
  const seen = new Set();
  const visit = (d) => {
    if (seen.has(d.id)) return;
    seen.add(d.id);
    const parent = parentDim(d, combo, ctx);
    if (parent) visit(parent);
    order.push(d); // a question comes after the one it depends on
  };
  combo.dimensions.forEach(visit);
  const list = [];
  let truncated = false;
  const walk = (i, keys) => {
    if (truncated) return;
    if (i === order.length) {
      if (list.length >= limit) truncated = true;
      else list.push({ ...keys });
      return;
    }
    fieldOptions(order[i], combo, keys, ctx).options.forEach((o) => walk(i + 1, { ...keys, [order[i].id]: o.value }));
  };
  if (order.length) walk(0, {});
  return { list, truncated };
};

// ---- Validation ----
export const tupleKey = (combo, keys) => combo.dimensions.map((d) => String(keys?.[d.id] ?? '').trim().toLowerCase()).join('\u0001');

// The ranges of one column: each one needs a From and a To (the last may stay open), and they cannot overlap.
// Messages go under the range's id, in the field 'min' or 'max'.
export const bandProblems = (dim, q, add) => {
  const rows = sortedBands(dim);
  if (!rows.length) add('general', 'general', 'error', `Add at least one range for “${q.label}”.`);
  rows.forEach((b, i) => {
    const min = num(b.min);
    const max = num(b.max);
    const prev = rows[i - 1];
    if (!(min >= 0)) add(b.id, 'min', 'error', `${q.label}: enter a From value of 0 or more.`);
    if (blank(b.max)) {
      if (i < rows.length - 1) add(b.id, 'max', 'error', `${q.label}: only the last range can have no upper limit.`);
    } else if (!(max >= 0)) add(b.id, 'max', 'error', `${q.label}: enter a valid To value.`);
    else if (min >= 0 && max <= min) add(b.id, 'max', 'error', `${q.label}: To must be greater than From.`);
    if (prev && min >= 0 && !Number.isNaN(num(prev.max))) {
      if (num(prev.max) > min) add(b.id, 'min', 'error', `${q.label}: starts before range ${i} ends (${fmt(prev.max)}).`);
      else if (num(prev.max) < min) add(b.id, 'min', 'warn', `${q.label}: values from ${fmt(prev.max)} up to ${fmt(min)} use the fallback value.`);
    }
  });
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (first && num(first.min) > 0) add(first.id, 'min', 'warn', `${q.label}: values below ${fmt(first.min)} use the fallback value.`);
  if (last && !blank(last.max) && !Number.isNaN(num(last.max))) add(last.id, 'max', 'warn', `${q.label}: values of ${fmt(last.max)} and above use the fallback value. Leave To blank to cover them.`);
};

// Messages keyed by row id (field id inside `field`) or 'general'/'name'/'code'/'fallback'.
export const comboProblems = (combo, ctx, counts = new Map(), version) => {
  const byId = new Map();
  const add = (id, field, level, msg) => byId.set(id, [...(byId.get(id) ?? []), { field, level, msg }]);

  if (!String(combo.name ?? '').trim()) add('name', 'name', 'error', 'Enter a name.');
  const code = String(combo.code ?? '').trim();
  if (!code) add('code', 'code', 'error', 'Enter a code.');
  else if (!CODE.test(code)) add('code', 'code', 'error', 'Use letters, digits and underscore, starting with a letter.');
  else if (RESERVED.includes(code.toLowerCase())) add('code', 'code', 'error', 'This code is reserved by the premium formula (BaseRate, AccountFactor). Choose another code.');
  else if (codeClashes(counts, combo).length) add('code', 'code', 'error', `The code ${code} is already used by another factor for the same coverage. Use another code, or limit the factors to different coverages.`);

  const fb = num(combo.fallback);
  if (Number.isNaN(fb)) add('fallback', 'fallback', 'error', 'Enter a number, for example 1.00.');
  else if (fb < 0) add('fallback', 'fallback', 'error', 'Values cannot be negative.');

  if (version && scopeIds(combo).some((id) => !ctx.all.some((c) => c.id === id))) add('coverageId', 'coverageId', 'error', 'The coverage this factor is for is no longer in the product. Remove the factor.');
  else if (scopeIds(combo).length !== 1) add('coverageId', 'coverageId', 'error', scopeIds(combo).length ? 'A factor belongs to one coverage. Set up a separate factor for each coverage.' : 'Choose the coverage this factor is for.');

  const dims = combo.dimensions;
  if (!dims.length) add('general', 'general', 'error', 'Choose at least one question the factor depends on.');
  dims.forEach((d) => {
    if (d.type !== 'question') return;
    const q = ctx.questions.get(d.source);
    if (!q) add('general', 'general', 'error', 'A question used here is no longer available, or is no longer marked as a rating factor. Remove it, or mark it again.');
    else if ((q.kind === 'range') !== isRangeDim(d)) add('general', 'general', 'error', `“${q.label}” changed type. Remove its column and add the question again.`);
    else if (isRangeDim(d)) bandProblems(d, q, add);
  });
  const usable = dims.every((d) => d.type === 'coverage' || ctx.questions.has(d.source));

  if (usable && dims.length && !combo.rows.length) add('general', 'general', 'error', 'Add at least one combination.');
  const seen = new Map();
  combo.rows.forEach((r) => {
    let complete = true;
    dims.forEach((d) => {
      const v = r.keys?.[d.id];
      const label = d.type === 'coverage' ? 'Coverage' : ctx.questions.get(d.source)?.label ?? 'question';
      if (blank(v)) {
        add(r.id, d.id, 'error', `Choose ${label}.`);
        complete = false;
        return;
      }
      const f = fieldOptions(d, combo, r.keys, ctx);
      if (f.missing) return;
      if (!f.options.some((o) => o.value === v)) {
        add(r.id, d.id, 'error', f.empty || f.waiting || `“${v}” is not a valid answer here. Choose again.`);
        complete = false;
      }
    });
    const val = num(r.value);
    if (Number.isNaN(val)) add(r.id, 'value', 'error', 'Enter a number, for example 1.15.');
    else if (val < 0) add(r.id, 'value', 'error', 'Values cannot be negative.');
    else if (val < 0.25 || val > 3) add(r.id, 'value', 'warn', 'This could zero out or triple a premium. Check it is intended.');
    if (complete && usable) {
      const k = tupleKey(combo, r.keys);
      if (seen.has(k)) add(r.id, dims[0].id, 'error', 'This combination is already configured above.');
      else seen.set(k, r.id);
    }
  });
  const all = [...byId.values()].flat();
  return { byId, errors: all.filter((p) => p.level === 'error').length, warns: all.filter((p) => p.level === 'warn').length };
};

// What blocks publishing. Combination factors are optional, so none at all is fine.
export const comboIssues = (version, acordForms) => {
  const list = version.comboFactors ?? [];
  if (!list.length) return [];
  const counts = codeCounts(collectFactorGroups(version, acordForms), version);
  return list.flatMap((combo) => {
    const { errors } = comboProblems(combo, comboContext(version, acordForms, combo), counts, version);
    return errors ? [`Combination factors › ${combo.name?.trim() || combo.code || 'a factor'}: fix ${plural(errors, 'error')}.`] : [];
  });
};

// ---- Using a combination factor ----
// answers: { [question key]: answer }. coverageId: library id of the coverage being rated.
// Returns { value, how }; value is NaN when the factor does not apply to this coverage.
export const comboValue = (combo, answers, coverageId) => {
  if (!inScope(combo, coverageId)) return { value: NaN, how: 'it does not apply to this coverage' };
  const hit = combo.rows.find(
    (r) => !Number.isNaN(num(r.value)) && combo.dimensions.every((d) => {
      if (d.type === 'coverage') return r.keys?.[d.id] === coverageId;
      if (blank(answers?.[d.source])) return false;
      // A number or currency answer matches the row whose range it falls in.
      if (!isRangeDim(d)) return same(answers[d.source], r.keys?.[d.id]);
      const band = bandOf(d, answers[d.source]);
      return Boolean(band) && band.id === r.keys?.[d.id];
    }),
  );
  return hit ? { value: num(hit.value), how: 'the matching combination' } : { value: num(combo.fallback), how: 'the fallback value' };
};
