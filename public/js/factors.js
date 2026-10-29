// Rating factors (step 6 of the product version workspace).
// A factor is a named number that depends on the answer to a question: "Radius of operation" gives 1.00,
// 1.15 or 1.35. This step only defines factors. A later step lets each coverage use them in a formula.
//
// Choice questions (dropdown, multiple choice, Yes / No) get one value per answer. Number and currency
// questions get value ranges: a range includes its From value and stops just before its To value.
//
// Storage (so factors survive copying a version):
//   product + coverage questions -> question.factors
//   form questions               -> coverage.formFactors["<formId>:<questionId>"]
// A factor is { id, name, code, mode: 'choice' | 'range', byAnswer: [ { id, answer, value, note } ],
//               bands: [ { id, min, max, value } ], fallback, coverageIds }. A question holds a list; the screen shows the
//               one that belongs to the coverage being set up.
// coverageIds holds exactly one coverage (library coverage id): a factor is set up per coverage, and it can only use the
// questions of that coverage (its own questions, the forms attached to it) plus the product-level questions.
// Factors that depend on several questions at once live in combo-factors.js.
import { formFor } from './form-versions.js';
import { esc, newId, coverageChoices, scopeIds, inScope } from './product-model.js';
import { questionHandle, formHandle } from './question-uses.js';
import { openAddQuestion } from './question-add.js';
import { refOfKey } from './account-factor-calc.js';
import { newQuestionDim, comboQuestions } from './combo-factor-calc.js';

const TYPE_LABEL = { text: 'Short text', textarea: 'Long text', number: 'Number', currency: 'Currency', date: 'Date', yesno: 'Yes / No', radio: 'Multiple choice', checkboxes: 'Checkboxes', dropdown: 'Dropdown', checkbox: 'Single checkbox' };
const YESNO = ['yesno', 'checkbox'];
const CHOICE = ['dropdown', 'radio', ...YESNO];
const RANGE = ['number', 'currency'];
export const factorKind = (type) => (CHOICE.includes(type) ? 'choice' : RANGE.includes(type) ? 'range' : null);
const answersOf = (q) => (YESNO.includes(q.type) ? ['Yes', 'No'] : (q.options ?? []).filter(Boolean));
export const CODE = /^[A-Za-z][A-Za-z0-9_]*$/;
export const RESERVED = ['baserate', 'accountfactor']; // names the premium formula already uses

const blank = (v) => v === '' || v == null;
const num = (v) => (blank(v) ? NaN : Number(v));
const fmt = (v) => Number(v).toLocaleString('en-US');
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const sortKey = (b) => (Number.isNaN(num(b.min)) ? Infinity : num(b.min));
const byMin = (a, b) => (sortKey(a) === sortKey(b) ? 0 : sortKey(a) < sortKey(b) ? -1 : 1);

// ---- Collecting the questions of a version ----
// Each entry: { key, label, type, kind, answers, group, coverageId, factors() -> array, setFactors(array) }
// coverageId is the library coverage the question belongs to (null for a product question, which every coverage may use).
// With `onlyCoverage` (a library coverage id), the questions of other coverages are left out.
export const collectFactorGroups = (version, acordForms, onlyCoverage = null) => {
  const groups = [];
  const own = (q, key, group, coverageId = null) => ({
    key, group, coverageId, label: q.label?.trim() || 'Untitled question', type: q.type, kind: factorKind(q.type), answers: answersOf(q),
    factors: () => q.factors ?? [],
    setFactors: (list) => (q.factors = list),
    ...questionHandle(q),
  });
  const product = version.questions ?? [];
  if (product.length) groups.push({ id: 'product', title: 'Product questions', sub: 'Asked for the whole product', qs: product.map((q) => ({ ...own(q, `p:${q.id}`), group: 'Product questions' })) });
  version.components.forEach((c) =>
    c.classes.forEach((k) =>
      k.coverages.forEach((cov) => {
        if (onlyCoverage && cov.coverageId !== onlyCoverage) return;
        if ((cov.questions ?? []).length) {
          groups.push({ id: `c:${cov.id}`, title: `Coverage › ${cov.name}`, sub: `${c.name} › ${k.name}`, qs: cov.questions.map((q) => ({ ...own(q, `c:${cov.id}:${q.id}`, '', cov.coverageId), group: `Coverage › ${cov.name}` })) });
        }
        (cov.forms ?? []).forEach((att) => {
          const form = formFor(att, acordForms);
          if (!form) return;
          const excluded = att.excluded ?? [];
          const qs = form.sections.flatMap((s) => s.questions).filter((q) => !excluded.includes(q.id));
          if (!qs.length) return;
          groups.push({
            id: `f:${cov.id}:${form.id}`,
            title: `Form › ${form.name}`,
            sub: `Attached to ${cov.name}`,
            qs: qs.map((q) => {
              const rk = `${form.id}:${q.id}`;
              return { ...own(q, `f:${cov.id}:${rk}`, '', cov.coverageId), group: `Form › ${form.name}`, factors: () => cov.formFactors?.[rk] ?? [], setFactors: (list) => ((cov.formFactors ??= {})[rk] = list), ...formHandle(cov, rk, q) };
            }),
          });
        });
      }),
    ),
  );
  return groups;
};

// ---- One coverage per factor ----
// Factors saved before this rule may cover several coverages, none (= all), or use a question of another coverage.
// Brings them in line, in place: a factor for several coverages becomes one factor per coverage (each keeping its own
// value), and a factor on a question of coverage A that was meant for coverage B is dropped, because B must not
// rate on A's questions. Returns { split, dropped } counts; both 0 when nothing needed fixing.
const forCoverage = (f, id, keepId) => {
  const copy = structuredClone(f);
  if (!keepId) copy.id = newId();
  copy.coverageIds = [id];
  delete copy.coverageId;
  [...(copy.byAnswer ?? []), ...(copy.bands ?? [])].forEach((r) => {
    if (r.values?.[id] != null) r.value = r.values[id];
    delete r.values;
  });
  return copy;
};

const comboForCoverage = (version, acordForms, c, id, keepId) => {
  const copy = structuredClone(c);
  if (!keepId) copy.id = newId();
  copy.coverageIds = [id];
  delete copy.coverageId;
  // The coverage is no longer a column: keep the rows of this coverage only.
  const covDims = copy.dimensions.filter((d) => d.type === 'coverage');
  copy.rows = copy.rows.filter((r) => covDims.every((d) => r.keys?.[d.id] === id));
  // Columns on questions of other coverages go too.
  const everywhere = comboQuestions(version, acordForms, [], 'rating', true);
  const here = comboQuestions(version, acordForms, [id], 'rating', true);
  const gone = copy.dimensions.filter((d) => d.type === 'coverage' || (everywhere.has(d.source) && !here.has(d.source)));
  copy.dimensions = copy.dimensions.filter((d) => !gone.includes(d));
  copy.rows.forEach((r) => gone.forEach((d) => delete r.keys?.[d.id]));
  return copy;
};

export const scopeFactorsToCoverages = (version, acordForms) => {
  const all = coverageChoices(version.components).map((c) => c.id);
  const tally = { split: 0, dropped: 0 };
  // ownId: the coverage a list of factors sits on (its own questions and forms); null for product questions.
  const fix = (list, ownId) => (list ?? []).flatMap((f) => {
    const ids = scopeIds(f);
    if (ownId && ids.length && !ids.includes(ownId)) {
      tally.dropped += 1;
      return [];
    }
    const targets = [...new Set(ownId ? [ownId] : ids.length ? ids : all)];
    if (!targets.length || (ids.length === 1 && ids[0] === targets[0])) return [f];
    if (targets.length > 1) tally.split += 1;
    return targets.map((id, i) => forCoverage(f, id, i === 0));
  });
  (version.questions ?? []).forEach((q) => q.factors?.length && (q.factors = fix(q.factors, null)));
  version.components.forEach((c) =>
    c.classes.forEach((k) =>
      k.coverages.forEach((cov) => {
        (cov.questions ?? []).forEach((q) => q.factors?.length && (q.factors = fix(q.factors, cov.coverageId)));
        Object.keys(cov.formFactors ?? {}).forEach((rk) => (cov.formFactors[rk] = fix(cov.formFactors[rk], cov.coverageId)));
      }),
    ),
  );
  version.comboFactors = (version.comboFactors ?? []).flatMap((c) => {
    const ids = scopeIds(c);
    const targets = ids.length ? ids : all;
    if (!targets.length || ids.length === 1) return [c];
    tally.split += 1;
    return [...new Set(targets)].map((id, i) => comboForCoverage(version, acordForms, c, id, i === 0));
  });
  return tally;
};

// ---- Validation ----
const collector = () => {
  const byId = new Map();
  return { byId, add: (id, field, level, msg) => byId.set(id, [...(byId.get(id) ?? []), { field, level, msg }]) };
};
const tally = (byId) => {
  const all = [...byId.values()].flat();
  return { errors: all.filter((p) => p.level === 'error').length, warns: all.filter((p) => p.level === 'warn').length };
};
// With two or more coverages ticked, every row holds one value per coverage (row.values[coverage id]); a coverage
// without its own value uses row.value. With one or none, row.value alone is used.
export const matrixIds = (f) => (scopeIds(f).length >= 2 ? scopeIds(f) : []);
export const valueFor = (row, f, coverageId) => (matrixIds(f).length ? row.values?.[coverageId] ?? row.value : row.value);
// The value fields a factor has: one per ticked coverage, or the single value.
const valueFields = (f) => (matrixIds(f).length ? matrixIds(f).map((id) => [`value:${id}`, id]) : [['value', undefined]]);

const checkValue = (add, id, v, field = 'value') => {
  const n = num(v);
  if (Number.isNaN(n)) add(id, field, 'error', 'Enter a number, for example 1.15.');
  else if (n < 0) add(id, field, 'error', 'Values cannot be negative.');
  else if (n < 0.25 || n > 3) add(id, field, 'warn', 'This could zero out or triple a premium. Check it is intended.');
};

// Every factor that uses each code (any case): code -> [factor]. Combination factors share the same code space, so pass
// the version to include them. The same code may be used again only by a factor limited to other coverages.
export const codeCounts = (groups, version) => {
  const counts = new Map();
  const count = (f) => {
    const code = String(f.code ?? '').trim().toLowerCase();
    counts.set(code, [...(counts.get(code) ?? []), f]);
  };
  groups.forEach((g) => g.qs.forEach((q) => q.factors().forEach(count)));
  (version?.comboFactors ?? []).forEach(count);
  return counts;
};

// A coverage-limited factor can use only a coverage that is still in the product.
export const coverageProblem = (f, version) => (scopeIds(f).some((id) => !coverageChoices(version.components).some((c) => c.id === id)) ? 'A coverage this factor is limited to is no longer in the product. Untick it.' : '');

// Do two factors apply to a common coverage? (No coverage ticked means all of them.)
export const scopesOverlap = (a, b) => {
  const x = scopeIds(a);
  const y = scopeIds(b);
  return !x.length || !y.length || x.some((id) => y.includes(id));
};
// Other factors with the same code that apply to a common coverage.
export const codeClashes = (counts, f) => (counts.get(String(f.code ?? '').trim().toLowerCase()) ?? []).filter((x) => x !== f && scopesOverlap(x, f));

// Does a factor limited to some coverages apply to this coverage?
export const appliesTo = (f, cov) => inScope(f, cov.coverageId);

// Messages for one factor, keyed by the id of the row or field they belong to.
export const factorProblems = (entry, f, counts, version) => {
  const { byId, add } = collector();
  const gone = version && coverageProblem(f, version);
  const ids = scopeIds(f);
  if (gone) add('coverageId', 'coverageId', 'error', gone);
  else if (ids.length !== 1) add('coverageId', 'coverageId', 'error', ids.length ? 'A factor belongs to one coverage. Set up a separate factor for each coverage.' : 'Choose the coverage this factor is for.');
  else if (entry.coverageId && ids[0] !== entry.coverageId) add('coverageId', 'coverageId', 'error', 'This question belongs to a different coverage. A factor can only use the questions of its own coverage.');
  // A question has at most one factor per coverage.
  const sibling = (entry.factors?.() ?? []).find((x) => x !== f && scopesOverlap(x, f));
  if (sibling) add('coverageId', 'coverageId', 'error', `This overlaps the ${sibling.code || sibling.name || 'other'} factor on this question. A question has one factor per coverage, so tick different coverages.`);
  if (!f.name?.trim()) add('name', 'name', 'error', 'Enter a name.');
  const code = String(f.code ?? '').trim();
  if (!code) add('code', 'code', 'error', 'Enter a code.');
  else if (!CODE.test(code)) add('code', 'code', 'error', 'Use letters, digits and underscore, starting with a letter.');
  else if (RESERVED.includes(code.toLowerCase())) add('code', 'code', 'error', 'This code is reserved by the premium formula (BaseRate, AccountFactor). Choose another code.');
  else if (codeClashes(counts, f).length) add('code', 'code', 'error', `The code ${code} is already used by another factor for the same coverage. Use another code, or limit the factors to different coverages.`);
  checkValue(add, 'fallback', f.fallback, 'fallback');
  if (f.mode !== entry.kind) add('general', 'general', 'error', 'This factor no longer fits the question type. Remove it and define it again.');
  else if (f.mode === 'choice') {
    if (!entry.answers.length) add('general', 'general', 'error', 'This question has no options yet. Add some on the Questions step.');
    const rows = f.byAnswer ?? [];
    entry.answers.filter((a) => !rows.some((r) => r.answer === a)).forEach((a) => add('general', 'general', 'error', `No value for “${a}”.`));
    rows.forEach((r) => {
      if (!entry.answers.includes(r.answer)) add(r.id, 'answer', 'error', 'This option no longer exists. Remove the row.');
      else valueFields(f).forEach(([field, id]) => checkValue(add, r.id, valueFor(r, f, id), field));
    });
  } else {
    const bands = f.bands ?? [];
    if (!bands.length) add('general', 'general', 'error', 'Add at least one range.');
    const rows = [...bands].sort(byMin);
    rows.forEach((b, i) => {
      const min = num(b.min), max = num(b.max);
      const prev = rows[i - 1];
      if (!(min >= 0)) add(b.id, 'min', 'error', 'Enter a From value of 0 or more.');
      if (blank(b.max)) {
        if (i < rows.length - 1) add(b.id, 'max', 'error', 'Only the last range can have no upper limit.');
      } else if (!(max >= 0)) add(b.id, 'max', 'error', 'Enter a valid To value.');
      else if (min >= 0 && max <= min) add(b.id, 'max', 'error', 'To must be greater than From.');
      valueFields(f).forEach(([field, id]) => checkValue(add, b.id, valueFor(b, f, id), field));
      if (prev && min >= 0 && !Number.isNaN(num(prev.max))) {
        const pmax = num(prev.max);
        if (pmax > min) add(b.id, 'min', 'error', `Starts before range ${i} ends (${fmt(pmax)}).`);
        else if (pmax < min) add(b.id, 'min', 'warn', `Values from ${fmt(pmax)} up to ${fmt(min)} use the fallback value.`);
      }
    });
    const first = rows[0], last = rows[rows.length - 1];
    if (first && num(first.min) > 0) add(first.id, 'min', 'warn', `Values below ${fmt(first.min)} use the fallback value.`);
    if (last && !blank(last.max) && !Number.isNaN(num(last.max))) add(last.id, 'max', 'warn', `Values of ${fmt(last.max)} and above use the fallback value. Leave To blank to cover them.`);
  }
  return { byId, ...tally(byId) };
};

// What still blocks publishing: factors that are not finished. Factors are optional, so none at all is fine.
export const factorIssues = (version, acordForms) => {
  const groups = collectFactorGroups(version, acordForms);
  const counts = codeCounts(groups, version);
  return groups.flatMap((g) =>
    g.qs.flatMap((q) =>
      q.factors().flatMap((f) => {
        const { errors } = factorProblems(q, f, counts, version);
        return errors ? [`Rating factors › ${q.label}: fix ${plural(errors, 'error')} in the ${f.code || 'factor'} factor.`] : [];
      }),
    ),
  );
};

// ---- Using a factor ----
// coverageId: the coverage being rated, so a factor with a value per coverage gives that coverage's value.
export const factorValue = (f, answer, coverageId) => {
  const fallback = { value: num(f.fallback), how: 'the fallback value' };
  const val = (r) => num(valueFor(r, f, coverageId));
  if (f.mode === 'choice') {
    const row = (f.byAnswer ?? []).find((r) => r.answer === answer && !Number.isNaN(val(r)));
    return row ? { value: val(row), how: `the answer “${answer}”` } : fallback;
  }
  const v = num(answer);
  if (Number.isNaN(v)) return fallback;
  const band = [...(f.bands ?? [])].sort(byMin).find((b) => v >= num(b.min) && (blank(b.max) || v < num(b.max)) && !Number.isNaN(val(b)));
  return band ? { value: val(band), how: `the range ${fmt(band.min)} to ${blank(band.max) ? 'and above' : fmt(band.max)}` } : fallback;
};
const suggestCode = (label, counts) => {
  let base = String(label).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) || 'FACTOR';
  if (/^\d/.test(base)) base = `F_${base}`;
  let code = base, n = 2;
  while (counts.has(code.toLowerCase()) || RESERVED.includes(code.toLowerCase())) code = `${base}_${n++}`;
  return code;
};
const effect = (v) => {
  const n = num(v);
  if (Number.isNaN(n)) return '';
  if (n === 1) return '<span class="fc-pill">no change</span>';
  return n > 1 ? `<span class="fc-pill up">+${Math.round((n - 1) * 100)}%</span>` : `<span class="fc-pill down">−${Math.round((1 - n) * 100)}%</span>`;
};

// ---- The page ----
// `combo` (from the step) mounts and checks the multi-question factors that sit in the same list:
//   combo.mount(host, comboId, { onChange, onRemoved })   combo.errors(factor) -> number
export const mountFactors = (host, { getVersion, getForms, readOnly, onChange, combo, coverage }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { selected: null, filter: 'all', query: '', test: '', multi: new Set(), cov: coverage?.get() ?? '', mode: 'single', tab: 'values', building: false };
  const $ = (sel) => root.querySelector(sel);
  const changed = () => onChange?.();
  const covs = () => coverageChoices(getVersion().components);
  if (!covs().length) {
    root.innerHTML = '<div class="el-none" style="margin:16px">Add coverages to the product first. Rating factors are set up one coverage at a time.</div>';
    return;
  }
  // Factors are set up for one coverage at a time, and can only use that coverage's questions.
  const covId = () => {
    if (!covs().some((c) => c.id === ui.cov)) ui.cov = covs()[0].id;
    return ui.cov;
  };
  const covName = () => covs().find((c) => c.id === covId())?.name ?? '';
  const allGroups = () => collectFactorGroups(getVersion(), getForms());
  const groups = () => collectFactorGroups(getVersion(), getForms(), covId());
  // Only the questions marked as rating factors are part of this stage.
  const inStage = (q) => q.uses().rating;
  const entries = () => groups().flatMap((g) => g.qs.filter(inStage).map((q) => ({ ...q, g })));
  const current = () => entries().find((q) => q.key === ui.selected);
  // A question has at most one factor per coverage: this is the one for the coverage being set up.
  const mine = (e) => e.factors().filter((f) => scopeIds(f).includes(covId()));
  const sel = (e) => mine(e)[0];
  const first = sel;
  const problemsFor = (e, f) => factorProblems(e, f, codeCounts(allGroups(), getVersion()), getVersion());
  const errorsOf = (e) => mine(e).reduce((n, f) => n + problemsFor(e, f).errors, 0);
  const status = (e) => {
    const list = mine(e);
    if (!e.kind) return { tone: 'warn', text: 'Not factorable', title: 'This question type cannot carry a factor' };
    if (!list.length) return { tone: 'warn', text: 'No factor', title: '' };
    const errors = errorsOf(e);
    const text = list.length === 1 ? list[0].code || 'Incomplete' : `${list.length} factors`;
    return errors ? { tone: 'senior', text, title: `${plural(errors, 'error')} to fix` } : { tone: 'ok', text, title: 'Ready' };
  };

  const cell = (probs, field) => {
    const p = probs.filter((x) => x.field === field);
    return p.some((x) => x.level === 'error') ? ' bad' : p.length ? ' warnc' : '';
  };
  const messages = (probs) => probs.map((p) => `<span class="${p.level === 'error' ? 'e' : 'w'}">${esc(p.msg)}</span>`).join('');
  const summary = (p) => (p.errors || p.warns
    ? `${p.errors ? `<span class="e">${plural(p.errors, 'error')}</span>` : ''}${p.warns ? `<span class="w">${plural(p.warns, 'warning')}</span>` : ''}`
    : '<span class="ok">Everything is valid</span>');

  // Errors in the factors of one coverage (single-question and combination), for the coverage tabs.
  const coverageErrors = (id) => {
    const v = getVersion();
    const counts = codeCounts(allGroups(), v);
    const single = collectFactorGroups(v, getForms(), id).flatMap((g) => g.qs.filter(inStage))
      .reduce((n, q) => n + q.factors().filter((f) => scopeIds(f).includes(id)).reduce((m, f) => m + factorProblems(q, f, counts, v).errors, 0), 0);
    return single + (v.comboFactors ?? []).filter((c) => scopeIds(c).includes(id)).reduce((n, c) => n + combo.errors(c), 0);
  };

  const comboList = () => (getVersion().comboFactors ?? []).filter((c) => scopeIds(c).includes(covId()));
  const isCombo = () => String(ui.selected ?? '').startsWith('combo:');

  // The coverage tabs, the Single question / Combinations switch, and what the left panel offers in each mode.
  const renderStrip = () => {
    const combos = comboList();
    const single = ui.mode === 'single';
    $('#fc-covtabs').innerHTML = covs().map((c) => {
      const bad = coverageErrors(c.id);
      return `<button type="button" role="tab" class="class-tab" data-f-cov="${esc(c.id)}" aria-selected="${c.id === covId()}">${esc(c.name)}${bad ? `<span class="count fc-bad">${bad} to fix</span>` : ''}</button>`;
    }).join('');
    $('#fc-mode').innerHTML = [['single', 'Single question'], ['combos', `Combinations${combos.length ? ` (${combos.length})` : ''}`]]
      .map(([k, l]) => `<button type="button" data-f-mode="${k}" aria-pressed="${ui.mode === k}">${l}</button>`).join('');
    const all = entries().filter((e) => e.kind);
    const done = all.filter((e) => first(e)).length;
    $('#fc-ltitle').textContent = single ? 'Questions' : 'Combination factors';
    $('#fc-count').textContent = single ? `${done} of ${plural(all.length, 'question')} ${done === 1 ? 'has' : 'have'} a factor` : `${plural(combos.length, 'factor')} for ${covName()}`;
    $('#fc-filter').hidden = !single;
    $('#fc-addq').hidden = !single;
    $('#fc-newcombo').hidden = single;
    $('#fc-newcombo').disabled = readOnly();
  };

  // Building a combination: tick two or more questions of this coverage.
  const renderMultiBar = () => {
    const bar = $('#fc-multibar');
    if (!bar) return;
    const n = ui.multi.size;
    bar.innerHTML = `<span class="muted">${n >= 2 ? `${plural(n, 'question')} ticked` : n ? 'Tick one more question.' : 'Tick two or more questions (choice, number or currency).'}</span>
      <button type="button" class="action primary" id="fc-combine"${n >= 2 && !readOnly() ? '' : ' disabled'}>Create combination</button><button type="button" class="action" id="fc-cancelbuild">Cancel</button>`;
  };

  const renderList = () => {
    const term = ui.query.trim().toLowerCase();
    if (ui.mode === 'combos') {
      if (ui.building) {
        const pickable = entries().filter((q) => q.kind && (!term || q.label.toLowerCase().includes(term)));
        $('#fc-list').innerHTML = `<div class="el-grp"><strong>New combination for ${esc(covName())}</strong><small>One value per combination of answers</small></div>`
          + (pickable.length
            ? pickable.map((q) => `<label class="fc-qrow fc-pick"><input type="checkbox" data-f-multi="${esc(q.key)}"${ui.multi.has(q.key) ? ' checked' : ''}><span class="el-qmain"><span class="el-qlabel">${esc(q.label)}</span><span class="el-qtype">${TYPE_LABEL[q.type] ?? 'Text'} · ${esc(q.g.title)}</span></span></label>`).join('')
            : '<div class="el-empty">No questions of this coverage can be combined yet.<br>Add them on the Single question view first.</div>')
          + '<div class="fc-multibar" id="fc-multibar"></div>';
        return renderMultiBar();
      }
      const items = comboList().filter((c) => !term || `${c.name} ${c.code}`.toLowerCase().includes(term));
      $('#fc-list').innerHTML = items.length
        ? items.map((c) => {
            const bad = combo.errors(c);
            return `<button type="button" class="el-q" data-f-combo="${esc(c.id)}" aria-current="${ui.selected === `combo:${c.id}`}"><span class="el-qmain"><span class="el-qlabel">${esc(c.name) || 'Untitled factor'}</span><span class="el-qtype">${plural(c.dimensions.length, 'question')} · ${plural(c.rows.length, 'combination')}</span></span><span class="el-pills"><span class="el-pill t-${bad ? 'senior' : 'ok'}" title="${bad ? `${plural(bad, 'error')} to fix` : 'Ready'}">${esc(c.code || 'Incomplete')}</span></span></button>`;
          }).join('')
        : `<div class="el-empty">${comboList().length ? 'No factors match.' : `No combination factors for ${esc(covName())} yet.<br>Use “New combination” when a value depends on several answers at once.`}</div>`;
      return;
    }
    let html = '';
    let shown = 0;
    groups().forEach((g) => {
      const items = g.qs.filter((q) => {
        if (!inStage(q)) return false;
        if (term && !q.label.toLowerCase().includes(term)) return false;
        if (ui.filter === 'all') return true;
        if (!q.kind) return false;
        return ui.filter === 'with' ? Boolean(first(q)) : errorsOf(q) > 0;
      });
      if (!items.length) return;
      shown += items.length;
      html += `<div class="el-grp"><strong>${esc(g.title)}</strong><small>${esc(g.sub)}</small></div>` + items.map((q) => {
        const s = status(q);
        const label = `<span class="el-qmain"><span class="el-qlabel">${esc(q.label)}</span><span class="el-qtype">${TYPE_LABEL[q.type] ?? 'Text'}</span></span><span class="el-pills"><span class="el-pill t-${s.tone}" title="${esc(s.title)}">${esc(s.text)}</span></span>`;
        return q.kind
          ? `<button type="button" class="el-q" data-f-q="${esc(q.key)}" aria-current="${q.key === ui.selected}">${label}</button>`
          : `<div class="el-q fc-off">${label}</div>`;
      }).join('');
    });
    $('#fc-list').innerHTML = shown ? html : `<div class="el-empty">${entries().length ? 'No questions match.' : 'No questions in this stage yet.<br>Use “Add question” to bring one in.'}</div>`;
  };

  // ---- editor ----
  // Make sure every current answer has a row; removed answers stay (flagged) until the owner removes them.
  const syncAnswers = (e, f) => {
    if (f.mode !== 'choice' || f.mode !== e.kind) return;
    const rows = f.byAnswer ?? [];
    const kept = e.answers.map((a) => rows.find((r) => r.answer === a) ?? { id: newId(), answer: a, value: '', note: '' });
    f.byAnswer = [...kept, ...rows.filter((r) => !e.answers.includes(r.answer))];
  };

  const valueCell = (r, probs, label) => `<td class="num"><input class="el-f num${cell(probs, 'value')}" type="number" min="0" step="0.01" data-f-in="value" data-f-row="${r.id}" value="${esc(r.value)}" aria-label="Value for ${esc(label)}"></td>`;
  const readsCell = (r) => `<td class="num" data-f-fx="${r.id}">${effect(r.value)}</td>`;

  const choiceRow = (e, f, r, probs) => {
    const stale = !e.answers.includes(r.answer);
    const width = 4;
    return `<tr data-f-row="${r.id}">
      <td>${esc(r.answer)}${stale ? ' <span class="chip">removed</span>' : ''}</td>
      ${valueCell(r, probs, r.answer)}
      ${readsCell(r)}
      <td><input class="el-f" type="text" data-f-in="note" data-f-row="${r.id}" value="${esc(r.note)}" placeholder="Optional" aria-label="Note for ${esc(r.answer)}"></td>
      <td class="rt-act">${stale ? `<button type="button" class="el-del" data-f-act="delrow" data-f-row="${r.id}">Remove</button>` : ''}</td>
    </tr>
    <tr class="rt-msgrow"><td></td><td colspan="${width - 1}" class="rt-msg" data-f-msg="${r.id}"${probs.length ? '' : ' hidden'}>${messages(probs)}</td></tr>`;
  };
  const rangeRow = (f, b, i, probs, currency) => {
    const width = 5;
    return `<tr data-f-row="${b.id}">
      <td><div class="rt-cell">${currency ? '$' : ''}<input class="el-f num${cell(probs, 'min')}" type="number" min="0" step="any" data-f-in="min" data-f-row="${b.id}" value="${esc(b.min)}" aria-label="From, range ${i + 1}"></div></td>
      <td><div class="rt-cell">${currency ? '$' : ''}<input class="el-f num${cell(probs, 'max')}" type="number" min="0" step="any" data-f-in="max" data-f-row="${b.id}" value="${esc(b.max)}" placeholder="and above" aria-label="To, range ${i + 1}"></div></td>
      ${valueCell(b, probs, `range ${i + 1}`)}
      ${readsCell(b)}
      <td class="rt-act"><button type="button" class="el-del" data-f-act="next" data-f-row="${b.id}" title="Add a range that starts where this one ends">Add after</button><button type="button" class="el-del" data-f-act="delrow" data-f-row="${b.id}">Remove</button></td>
    </tr>
    <tr class="rt-msgrow"><td colspan="${width}" class="rt-msg" data-f-msg="${b.id}"${probs.length ? '' : ' hidden'}>${messages(probs)}</td></tr>`;
  };

  // Which coverage formulas already use this code.
  const usedIn = (f) => {
    const code = String(f.code ?? '').trim().toLowerCase();
    const using = code ? coverageNames().filter(({ cov }) => new RegExp(String.raw`\b${code}\b`, 'i').test(cov.formula?.expression ?? '')).map((x) => x.name) : [];
    return using.length ? `Used in the formula of: ${esc(using.join(', '))}.` : 'Not used in any formula yet. Coverage formulas are set up in the next step.';
  };
  const coverageNames = () => getVersion().components.flatMap((c) => c.classes.flatMap((k) => k.coverages.map((cov) => ({ cov, name: cov.name }))));

  // ---- the editor: Values, Name and code, Try it out ----
  const TABS = [['values', 'Values'], ['name', 'Name and code'], ['try', 'Try it out']];
  const NAME_FIELDS = ['name', 'code', 'coverageId'];
  // Does a tab hold an error? (Name and code fields on their tab, everything else on Values.)
  const tabErr = (p, k) => {
    const errs = [...p.byId.values()].flat().filter((x) => x.level === 'error');
    return k === 'name' ? errs.some((x) => NAME_FIELDS.includes(x.field)) : k === 'values' ? errs.some((x) => !NAME_FIELDS.includes(x.field)) : false;
  };
  const tabButtons = (p) => TABS.map(([k, l], i) => `<button type="button" role="tab" class="fc-tab" data-f-tab="${k}" aria-selected="${ui.tab === k}">${i + 1} · ${l}${tabErr(p, k) ? '<span class="fc-dot" title="Needs attention"></span>' : ''}</button>`).join('');
  // The tab to open for a question: stay on the current one unless another has the problem.
  const tabFor = (e) => {
    const f = e && sel(e);
    if (!f) return ui.tab;
    const p = problemsFor(e, f);
    return tabErr(p, ui.tab) ? ui.tab : TABS.map((t) => t[0]).find((k) => tabErr(p, k)) ?? ui.tab;
  };
  const select = (key) => {
    ui.selected = key;
    ui.test = '';
    ui.tab = tabFor(current());
  };

  const testAnswer = (e, f) => {
    if (f.mode === 'choice') return `<select class="el-f" data-f-test aria-label="Sample answer"><option value="">Pick an answer…</option>${e.answers.map((a) => `<option${a === ui.test ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select>`;
    return `<input class="el-f num" type="number" min="0" step="any" data-f-test value="${esc(ui.test)}" placeholder="e.g. 3" aria-label="Sample answer">`;
  };
  const testResult = (e, f) => {
    if (blank(ui.test)) return '<div class="el-result">Pick or enter a sample answer to see its value.</div>';
    const hit = factorValue(f, ui.test, covId());
    if (Number.isNaN(hit.value)) return '<div class="el-result t-senior">No value yet.<small>Fill in the value or the fallback.</small></div>';
    return `<div class="el-result t-ok">${esc(f.code || 'FACTOR')} = ${hit.value.toFixed(2)}<small>From ${esc(hit.how)}.</small></div>`;
  };

  const factorBody = (e, f, p) => {
    const get = (id) => p.byId.get(id) ?? [];
    const field = (label, key, extra = '') => `<div class="fc-field"><label for="fc-${key}">${label}</label>
        <input id="fc-${key}" class="el-f${cell(get(key), key)}${key === 'fallback' ? ' num' : ''}" ${extra} data-f-in="${key}" value="${esc(f[key])}">
        <div class="rt-msg" data-f-msg="${key}"${get(key).length ? '' : ' hidden'}>${messages(get(key))}</div></div>`;
    if (ui.tab === 'name') {
      return `<div class="fc-field"><label>Coverage</label>
          <p class="rt-note" style="margin:0"><strong>${esc(covName())}</strong>. This factor is used only in the premium formula of this coverage. Set up its own factor for each other coverage.</p>
          <div class="rt-msg" data-f-msg="coverageId"${get('coverageId').length ? '' : ' hidden'}>${messages(get('coverageId'))}</div></div>
        ${field('Name', 'name', 'type="text" maxlength="60"')}
        ${field('Code, used in formulas', 'code', 'type="text" maxlength="30" spellcheck="false" style="font-family:var(--mono,monospace)"')}
        <div class="rt-note">${usedIn(f)}</div>`;
    }
    if (ui.tab === 'try') {
      return `<p class="rt-note" style="margin:0">Pick or enter a sample answer to see the value this factor gives for ${esc(covName())}.</p>
        <div class="el-row" id="fc-testrow">${testAnswer(e, f)}</div><div id="fc-testres">${testResult(e, f)}</div>`;
    }
    const rows = f.mode === 'choice'
      ? (f.byAnswer ?? []).map((r) => choiceRow(e, f, r, get(r.id))).join('')
      : [...(f.bands ?? [])].map((b, i) => rangeRow(f, b, i, get(b.id), e.type === 'currency')).join('');
    const head = f.mode === 'choice'
      ? '<tr><th>Answer</th><th class="num">Value</th><th class="num">Reads as</th><th>Note</th><th></th></tr>'
      : '<tr><th>From <small>included</small></th><th>To <small>not included</small></th><th class="num">Value</th><th class="num">Reads as</th><th></th></tr>';
    return `<p class="rt-note" style="margin:0">Give each ${f.mode === 'choice' ? 'answer' : 'range'} a value. 1.00 means no change to the premium.</p>
      <div class="rt-wrap"><table class="rt-table fc-table"><thead>${head}</thead><tbody>${rows || '<tr><td colspan="5"><div class="el-none">No ranges yet.</div></td></tr>'}</tbody></table></div>
      ${f.mode === 'range' ? '<div class="rt-foot"><button type="button" class="action el-add" data-f-act="add">+ Add a range</button></div><p class="rt-note">Each range includes its From value and stops just before its To value. Leave the last To blank to cover every higher value.</p>' : ''}
      <div class="fc-fields">${field('Fallback value', 'fallback', 'type="number" min="0" step="0.01"')}</div>
      <p class="rt-note" style="margin-top:-6px">The fallback is used when the question is unanswered${f.mode === 'range' ? ' or the answer falls outside every range' : ''}.</p>
      <div class="rt-msg" data-f-msg="general"${get('general').length ? '' : ' hidden'}>${messages(get('general'))}</div>`;
  };

  const statusPill = (e) => {
    const s = status(e);
    return `<span class="el-pill t-${s.tone}" title="${esc(s.title)}">${esc(s.text)}</span>`;
  };

  const renderEditor = () => {
    if (ui.mode === 'combos') {
      const id = isCombo() ? ui.selected.slice(6) : '';
      if (id && comboList().some((c) => c.id === id)) {
        $('#fc-editor').innerHTML = '<div id="fc-combo" style="padding:4px 2px"></div>';
        return combo.mount($('#fc-combo'), id, {
          onChange: () => {
            changed();
            renderStrip();
            renderList();
          },
          onRemoved: () => {
            select(firstOfMode());
            changed();
            refreshAll();
          },
        });
      }
      $('#fc-editor').innerHTML = `<div class="el-none" style="margin:16px">${comboList().length ? 'Select a combination factor to edit it.' : `Add a combination factor when the value depends on several answers at once, for example vehicle type together with radius. It will be for ${esc(covName())} only.`}</div>`;
      return;
    }
    const e = current();
    if (!e) {
      $('#fc-editor').innerHTML = '<div class="el-none" style="margin:16px">There are no rating-factor questions for this coverage yet. Use “Add question” to bring one in from the form or the product, or create a new one.</div>';
      return;
    }
    const f = sel(e);
    if (f) syncAnswers(e, f);
    const p = f && problemsFor(e, f);
    const at = TABS.findIndex((t) => t[0] === ui.tab);
    const nav = f
      ? `${at > 0 ? `<button type="button" class="action" data-f-tab="${TABS[at - 1][0]}">Back</button>` : ''}${at < TABS.length - 1 ? `<button type="button" class="action primary" data-f-tab="${TABS[at + 1][0]}">Next: ${TABS[at + 1][1]}</button>` : ''}`
      : '';
    $('#fc-editor').innerHTML = `
      <div class="el-edh"><div class="fc-eh"><h2>${esc(e.label)}</h2><span id="fc-estatus">${statusPill(e)}</span></div>
        <div class="el-meta"><span class="el-tag">${TYPE_LABEL[e.type] ?? 'Text'}</span><span>${esc(e.g.title)} · ${esc(e.g.sub)}</span></div></div>
      ${f ? `<div class="fc-tabs" role="tablist" id="fc-tabs" aria-label="Factor settings">${tabButtons(p)}</div>` : ''}
      <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}>
        ${f
          ? factorBody(e, f, p)
          : `<div class="el-none">No factor on this question for ${esc(covName())}.<br>A factor gives each answer a value that the premium formula of this coverage can use.</div>
             <button type="button" class="action primary el-add" data-f-act="create">+ Define a factor for ${esc(covName())}</button>`}
      </fieldset>
      ${f ? `<div class="fc-foot"><span class="rt-sum" id="fc-sum">${summary(p)}</span><button type="button" class="el-del" data-f-act="remove"${readOnly() ? ' disabled' : ''}>Remove this factor</button><span class="fc-nav">${nav}</span></div>` : ''}`;
  };

  // Light refresh keeps typing focus: only messages, outlines, counts, tab dots and the tester change.
  const refreshLight = () => {
    const e = current();
    const f = sel(e);
    if (!f) return;
    const p = problemsFor(e, f);
    const rows = f.mode === 'choice' ? f.byAnswer ?? [] : f.bands ?? [];
    ['name', 'code', 'fallback', 'general', 'coverageId'].forEach((id) => {
      const list = p.byId.get(id) ?? [];
      const msg = $(`[data-f-msg="${id}"]`);
      if (msg) {
        msg.innerHTML = messages(list);
        msg.hidden = !list.length;
      }
      const input = $(`#fc-${id}`);
      if (input) input.className = `el-f${cell(list, id)}${id === 'fallback' ? ' num' : ''}`;
    });
    rows.forEach((r) => {
      const list = p.byId.get(r.id) ?? [];
      const msg = $(`[data-f-msg="${r.id}"]`);
      if (msg) {
        msg.innerHTML = messages(list);
        msg.hidden = !list.length;
      }
      root.querySelectorAll(`[data-f-row="${r.id}"][data-f-in]`).forEach((input) => {
        if (input.type === 'number') input.className = `el-f num${cell(list, input.dataset.fIn)}`;
      });
      const fx = $(`[data-f-fx="${r.id}"]`);
      if (fx) fx.innerHTML = effect(r.value);
    });
    $('#fc-tabs').innerHTML = tabButtons(p);
    $('#fc-estatus').innerHTML = statusPill(e);
    $('#fc-sum').innerHTML = summary(p);
    const res = $('#fc-testres');
    if (res) res.innerHTML = testResult(e, f);
    renderStrip();
    renderList();
  };
  const refreshAll = () => {
    renderStrip();
    renderList();
    renderEditor();
  };

  const pickFirst = () => {
    const all = entries().filter((e) => e.kind);
    return (all.find((e) => first(e) && problemsFor(e, first(e)).errors) ?? all.find((e) => first(e)) ?? all[0])?.key ?? null;
  };
  const firstOfMode = () => (ui.mode === 'combos' ? (comboList()[0] ? `combo:${comboList()[0].id}` : null) : pickFirst());
  // Open on the first coverage that has something to fix, unless the person was already working on one.
  if (!ui.cov) ui.cov = covs().find((c) => coverageErrors(c.id))?.id ?? covs()[0].id;
  select(firstOfMode());

  root.innerHTML = `
    <div class="fc-covbar">
      <div class="class-tabs fc-covtabs" role="tablist" id="fc-covtabs" aria-label="Coverages"></div>
      <div class="el-seg fc-mode" id="fc-mode"></div>
    </div>
    <p class="rt-note fc-covnote">Each coverage has its own factors and can only use its own questions and the product questions.</p>
    <div class="el-grid">
      <section class="el-panel" aria-label="Questions">
        <div class="el-panelh">
          <div class="fc-lh"><div><h3 class="el-title" id="fc-ltitle">Questions</h3><small class="muted" id="fc-count"></small></div>
            <button type="button" class="action" id="fc-addq"${readOnly() ? ' disabled' : ''}>+ Add question</button>
            <button type="button" class="action" id="fc-newcombo" hidden>+ New combination</button></div>
          <input class="el-search" id="fc-search" type="search" placeholder="Search" aria-label="Search">
          <div class="el-seg" id="fc-filter">
            <button type="button" data-f-f="all" aria-pressed="true">All</button>
            <button type="button" data-f-f="with" aria-pressed="false">With a factor</button>
            <button type="button" data-f-f="bad" aria-pressed="false">Needs attention</button>
          </div>
        </div>
        <div class="el-list" id="fc-list"></div>
      </section>
      <section class="el-panel" id="fc-editor" aria-live="polite"></section>
    </div>`;
  refreshAll();

  // Another coverage: its own questions, its own factors.
  const switchCoverage = (id) => {
    ui.cov = id;
    coverage?.set(id);
    ui.multi.clear();
    ui.building = false;
    ui.query = '';
    $('#fc-search').value = '';
    select(firstOfMode());
    refreshAll();
  };

  root.addEventListener('click', (ev) => {
    const t = ev.target;
    const cv = t.closest('[data-f-cov]');
    if (cv) return cv.dataset.fCov === covId() ? undefined : switchCoverage(cv.dataset.fCov);
    const md = t.closest('[data-f-mode]');
    if (md) {
      if (ui.mode === md.dataset.fMode) return;
      ui.mode = md.dataset.fMode;
      ui.building = false;
      ui.multi.clear();
      select(firstOfMode());
      return refreshAll();
    }
    if (t.closest('#fc-newcombo')) {
      if (readOnly()) return;
      ui.building = true;
      ui.multi.clear();
      return renderList();
    }
    if (t.closest('#fc-cancelbuild')) {
      ui.building = false;
      ui.multi.clear();
      return renderList();
    }
    if (t.closest('#fc-combine')) {
      if (readOnly()) return;
      // Only questions that still exist and can be combined.
      const picked = entries().filter((q) => ui.multi.has(q.key) && q.kind);
      if (picked.length < 2) return;
      const name = picked.map((q) => q.label).join(' + ').slice(0, 60);
      const made = {
        id: newId(),
        name,
        code: suggestCode(name, codeCounts(allGroups(), getVersion())),
        coverageIds: [covId()],
        fallback: '1.00',
        dimensions: picked.map((q) => newQuestionDim(refOfKey(q.key), q.kind)),
        rows: [],
      };
      (getVersion().comboFactors ??= []).push(made);
      ui.multi.clear();
      ui.building = false;
      ui.selected = `combo:${made.id}`;
      changed();
      return refreshAll();
    }
    if (t.closest('#fc-addq')) {
      return openAddQuestion({
        use: 'rating',
        groups: groups(),
        getVersion,
        coverageId: covId(),
        onAdded: (keys) => {
          ui.filter = 'all';
          root.querySelectorAll('#fc-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fF === 'all')));
          select(keys[0]);
          changed();
          refreshAll();
        },
      });
    }
    const el = t.closest('[data-f-q],[data-f-act],[data-f-f],[data-f-combo],[data-f-tab]');
    if (!el) return;
    const d = el.dataset;
    if (d.fCombo) {
      ui.selected = `combo:${d.fCombo}`;
      renderList();
      return renderEditor();
    }
    if (d.fTab) {
      ui.tab = d.fTab;
      return renderEditor();
    }
    if (d.fF) {
      ui.filter = d.fF;
      root.querySelectorAll('#fc-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      return renderList();
    }
    if (d.fQ) {
      select(d.fQ);
      renderList();
      return renderEditor();
    }
    if (readOnly()) return;
    const e = current();
    const f = sel(e);
    let focus = null;
    if (d.fAct === 'create') {
      const counts = codeCounts(allGroups(), getVersion());
      const base = { id: newId(), name: e.label, code: suggestCode(e.label, counts), mode: e.kind, byAnswer: [], bands: [], fallback: '1.00', coverageIds: [covId()] };
      if (e.kind === 'choice') base.byAnswer = e.answers.map((a) => ({ id: newId(), answer: a, value: '1.00', note: '' }));
      else base.bands = [{ id: newId(), min: '0', max: '', value: '1.00' }];
      e.setFactors([...e.factors(), base]);
      ui.tab = 'values';
    } else if (d.fAct === 'remove') {
      if (!confirm(`Remove the ${f.code || 'factor'} factor for ${covName()} from this question?`)) return;
      e.setFactors(e.factors().filter((x) => x !== f));
      ui.test = '';
    } else if (d.fAct === 'add') {
      const last = [...f.bands].sort(byMin).pop();
      const band = { id: newId(), min: last && !blank(last.max) ? last.max : '', max: '', value: '1.00' };
      f.bands.push(band);
      focus = band.id;
    } else if (d.fAct === 'next') {
      const at = f.bands.findIndex((b) => b.id === d.fRow);
      if (at < 0) return;
      const band = { id: newId(), min: f.bands[at].max, max: '', value: f.bands[at].value };
      f.bands.splice(at + 1, 0, band);
      focus = band.id;
    } else if (d.fAct === 'delrow') {
      const list = f.mode === 'choice' ? f.byAnswer : f.bands;
      const at = list.findIndex((r) => r.id === d.fRow);
      if (at >= 0) list.splice(at, 1);
    } else return;
    changed();
    refreshAll();
    if (focus) $(`[data-f-row="${focus}"] [data-f-in="min"]`)?.focus();
  });

  root.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.fMulti !== undefined) {
      t.checked ? ui.multi.add(t.dataset.fMulti) : ui.multi.delete(t.dataset.fMulti);
      return renderMultiBar();
    }
    if (readOnly() || t.dataset.fIn === undefined || !['min', 'max'].includes(t.dataset.fIn)) return;
    const f = sel(current());
    // Keep ranges in From order, but only redraw when a row actually moved so Tab keeps working.
    const before = f.bands.map((b) => b.id).join();
    f.bands.sort(byMin);
    if (f.bands.map((b) => b.id).join() !== before) {
      changed();
      refreshAll();
    }
  });

  root.addEventListener('input', (ev) => {
    const t = ev.target;
    const d = t.dataset;
    if (d.fTest !== undefined) {
      ui.test = t.value;
      const e = current();
      return ($('#fc-testres').innerHTML = testResult(e, sel(e)));
    }
    if (t.id === 'fc-search') {
      ui.query = t.value;
      return renderList();
    }
    if (readOnly()) return;
    if (d.fIn === undefined) return;
    const f = sel(current());
    if (['name', 'code', 'fallback'].includes(d.fIn)) f[d.fIn] = t.value;
    else (f.mode === 'choice' ? f.byAnswer : f.bands).find((r) => r.id === d.fRow)[d.fIn] = t.value;
    changed();
    refreshLight();
  });
};
