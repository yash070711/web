import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  comboQuestions,
  comboContext,
  fieldOptions,
  settleKeys,
  comboProblems,
  comboIssues,
  comboValue,
  allCombinations,
  blankCombo,
  newQuestionDim,
  bandOf,
} from '../public/js/combo-factor-calc.js';
import { factorsFor, formulaProblems } from '../public/js/formula.js';
import { codeCounts, collectFactorGroups, factorProblems, factorIssues, factorValue, valueFor, matrixIds, scopeFactorsToCoverages } from '../public/js/factors.js';
import { cloneQuestions, remapQuestionRefs, coverageChoices } from '../public/js/product-model.js';

// ---- fixture: one form with a question and a second question that depends on it ----
const opt = (id, label, options, extra = {}) => ({ id, type: 'dropdown', label, options, help: '', required: false, uses: { rating: true }, ...extra });
const form = {
  id: 'f1',
  name: 'Form',
  sections: [
    {
      id: 's',
      title: 'S',
      questions: [
        opt('kind', 'Kind', ['K1', 'K2', 'K3']),
        opt('range', 'Range', ['R1', 'R2', 'R3'], { dependsOn: { question: 'kind', allowed: { K1: ['R1', 'R2'], K2: ['R3'] } } }),
        opt('plain', 'Plain', ['P1', 'P2']),
      ],
    },
  ],
};
const cov = (id, coverageId, name, extra = {}) => ({ id, coverageId, name, forms: [{ formId: 'f1', excluded: [] }], questions: [], formula: { expression: '' }, ...extra });
const version = () => ({
  questions: [],
  components: [{ id: 'c', name: 'Comp', classes: [{ id: 'k', name: 'Class', coverages: [cov('i1', 'L-APD', 'APD'), cov('i2', 'L-LIA', 'Liability')] }] }],
});
const forms = [form];
const key = (q) => `form:f1:${q}`;
const dims = (...sources) => sources.map((s, i) => ({ id: `d${i}`, type: s === 'coverage' ? 'coverage' : 'question', source: s === 'coverage' ? '' : key(s) }));
const combo = (sources, rows, extra = {}) => ({ ...blankCombo(), id: 'cb', name: 'Combo', code: 'COMBO', coverageIds: ['L-APD'], dimensions: dims(...sources), rows, ...extra });
const row = (id, keys, value = '1.10') => ({ id, keys, value });
const problems = (v, c) => comboProblems(c, comboContext(v, forms, c), codeCounts(collectFactorGroups(v, forms), { comboFactors: [c] }), v);

// ---- questions and dependent dropdowns ----
test('questions come from the configured forms, with their dependency', () => {
  const qs = comboQuestions(version(), forms);
  assert.deepEqual([...qs.keys()].sort(), [key('kind'), key('plain'), key('range')]);
  assert.equal(qs.get(key('range')).parentKey, key('kind'));
  assert.deepEqual(qs.get(key('kind')).options, ['K1', 'K2', 'K3']);
});

test('a dependent dropdown offers only the answers allowed for the parent answer', () => {
  const c = combo(['kind', 'range'], []);
  const ctx = comboContext(version(), forms, c);
  const [kind, range] = c.dimensions;
  assert.deepEqual(fieldOptions(range, c, { [kind.id]: 'K1' }, ctx).options.map((o) => o.value), ['R1', 'R2']);
  assert.deepEqual(fieldOptions(range, c, { [kind.id]: 'K2' }, ctx).options.map((o) => o.value), ['R3']);
});

test('the dependent dropdown waits for the parent, and reports a parent answer with nothing configured', () => {
  const c = combo(['kind', 'range'], []);
  const ctx = comboContext(version(), forms, c);
  const [kind, range] = c.dimensions;
  assert.match(fieldOptions(range, c, {}, ctx).waiting, /Choose Kind first/);
  const none = fieldOptions(range, c, { [kind.id]: 'K3' }, ctx);
  assert.equal(none.options.length, 0);
  assert.match(none.empty, /No “Range” answers are configured for “K3”/);
});

test('without the parent in the factor, the question keeps all its answers', () => {
  const c = combo(['range'], []);
  assert.deepEqual(fieldOptions(c.dimensions[0], c, {}, comboContext(version(), forms, c)).options.map((o) => o.value), ['R1', 'R2', 'R3']);
});

test('changing the parent clears a downstream answer that is no longer valid, and keeps one that still is', () => {
  const c = combo(['kind', 'range'], []);
  const ctx = comboContext(version(), forms, c);
  const keys = { d0: 'K1', d1: 'R1' };
  keys.d0 = 'K2';
  assert.deepEqual(settleKeys(c, keys, ctx), ['Range']);
  assert.equal(keys.d1, '');
  const keep = { d0: 'K1', d1: 'R2' };
  assert.deepEqual(settleKeys(c, keep, ctx), []);
  assert.equal(keep.d1, 'R2');
});

// ---- validation ----
test('a complete, valid factor has no errors', () => {
  const c = combo(['kind', 'range'], [row('r1', { d0: 'K1', d1: 'R1' }), row('r2', { d0: 'K2', d1: 'R3' })]);
  assert.equal(problems(version(), c).errors, 0);
});

test('an answer that is not valid for its parent is an error', () => {
  const c = combo(['kind', 'range'], [row('r1', { d0: 'K2', d1: 'R1' })]);
  const p = problems(version(), c);
  assert.equal(p.errors, 1);
  assert.equal(p.byId.get('r1')[0].field, 'd1');
});

test('incomplete rows, duplicate combinations and bad values are errors', () => {
  const c = combo(['kind', 'range'], [row('r1', { d0: 'K1', d1: '' }), row('r2', { d0: 'K1', d1: 'R1' }), row('r3', { d0: 'k1', d1: 'r1' }), row('r4', { d0: 'K2', d1: 'R3' }, '-1')]);
  const p = problems(version(), c);
  assert.ok(p.byId.get('r1').some((x) => /Choose Range/.test(x.msg)));
  assert.ok(p.byId.get('r4').some((x) => x.field === 'value' && x.level === 'error'));
  assert.equal(p.byId.get('r2'), undefined);
});

test('the same combination twice is an error', () => {
  const c = combo(['kind', 'range'], [row('r1', { d0: 'K1', d1: 'R1' }), row('r2', { d0: 'K1', d1: 'R1' })]);
  const p = problems(version(), c);
  assert.equal(p.byId.get('r1'), undefined);
  assert.ok(p.byId.get('r2').some((x) => /already configured/.test(x.msg)));
});

test('needs a name, a code, a question and a combination', () => {
  const c = { ...blankCombo(), id: 'x' };
  const p = problems(version(), c);
  assert.ok(p.byId.has('name') && p.byId.has('code') && p.byId.has('general'));
  assert.ok(problems(version(), combo(['kind'], [])).byId.get('general').some((x) => /at least one combination/.test(x.msg)));
});

test('the code cannot repeat another factor or be reserved', () => {
  const v = version();
  const c = combo(['kind'], [row('r1', { d0: 'K1' })], { code: 'AccountFactor' });
  assert.ok(problems(v, c).byId.get('code'));
  const single = { name: 'x', code: 'COMBO', mode: 'choice', byAnswer: [], fallback: '1' };
  const counts = codeCounts([{ qs: [{ factors: () => [single] }] }], { comboFactors: [combo(['kind'], [])] });
  assert.ok(factorProblems({ kind: 'choice', answers: [] }, single, counts).byId.get('code'));
});

test('a coverage-limited factor must point at a coverage that is still in the product', () => {
  const v = version();
  assert.equal(problems(v, combo(['kind'], [row('r1', { d0: 'K1' })], { coverageIds: ['L-APD'] })).errors, 0);
  assert.ok(problems(v, combo(['kind'], [row('r1', { d0: 'K1' })], { coverageIds: ['GONE'] })).byId.has('coverageId'));
  const bad = { ...version(), comboFactors: [combo(['kind'], [], { coverageIds: ['GONE'] })] };
  assert.equal(comboIssues(bad, forms).length, 1);
  assert.deepEqual(comboIssues({ ...version(), comboFactors: [] }, forms), []);
});

test('a combination factor is for exactly one coverage', () => {
  const v = version();
  const rows = [row('r1', { d0: 'K1' })];
  assert.equal(problems(v, combo(['kind'], rows)).errors, 0);
  assert.ok(problems(v, combo(['kind'], rows, { coverageIds: [] })).byId.has('coverageId'));
  assert.ok(problems(v, combo(['kind'], rows, { coverageIds: ['L-APD', 'L-LIA'] })).byId.has('coverageId'));
  assert.deepEqual(coverageChoices(v.components).map((x) => x.name), ['APD', 'Liability']);
});

// ---- matching (the rating step) ----
test('the submitted answers and coverage select the configured value', () => {
  const c = combo(['coverage', 'kind', 'range'], [row('a', { d0: 'L-APD', d1: 'K1', d2: 'R1' }, '1.25'), row('b', { d0: 'L-LIA', d1: 'K1', d2: 'R1' }, '0.90')], { fallback: '1.00', coverageIds: [] });
  const answers = { [key('kind')]: 'K1', [key('range')]: 'R1' };
  assert.equal(comboValue(c, answers, 'L-APD').value, 1.25);
  assert.equal(comboValue(c, answers, 'L-LIA').value, 0.9);
  assert.equal(comboValue(c, { ...answers, [key('range')]: 'R2' }, 'L-APD').value, 1);
  assert.equal(comboValue(c, { [key('kind')]: 'k1', [key('range')]: ' r1 ' }, 'L-APD').value, 1.25);
  assert.equal(comboValue(c, {}, 'L-APD').how, 'the fallback value');
});

test('a factor limited to one coverage does not apply to another', () => {
  const c = combo(['kind'], [row('a', { d0: 'K1' }, '1.5')], { coverageIds: ['L-APD'] });
  assert.equal(comboValue(c, { [key('kind')]: 'K1' }, 'L-APD').value, 1.5);
  assert.ok(Number.isNaN(comboValue(c, { [key('kind')]: 'K1' }, 'L-LIA').value));
});

test('older single-coverage factors still work, and several coverages are an error', () => {
  const v = version();
  const both = combo(['kind'], [row('a', { d0: 'K1' }, '1.5')], { coverageIds: ['L-APD', 'L-LIA'] });
  assert.equal(comboValue(both, { [key('kind')]: 'K1' }, 'L-LIA').value, 1.5);
  assert.ok(problems(v, both).byId.has('coverageId'));
  assert.ok(problems(v, { ...both, coverageIds: ['L-APD', 'GONE'] }).byId.has('coverageId'));
  const legacy = { ...combo(['kind'], [row('a', { d0: 'K1' })]), coverageIds: undefined, coverageId: 'L-APD' };
  assert.equal(comboValue(legacy, { [key('kind')]: 'K1' }, 'L-APD').value, 1.1);
  assert.ok(Number.isNaN(comboValue(legacy, { [key('kind')]: 'K1' }, 'L-LIA').value));
});

test('a single-question factor is for exactly one coverage', () => {
  const v = version();
  const q = { id: 'pq', type: 'dropdown', label: 'Pick', options: ['A'], uses: { rating: true }, factors: [{ id: 'f', name: 'Pick', code: 'PICK', mode: 'choice', byAnswer: [{ id: '1', answer: 'A', value: '1.2' }], fallback: '1', coverageIds: ['L-APD'] }] };
  v.questions = [q];
  assert.deepEqual(factorIssues(v, forms), []);
  q.factors[0].coverageIds = ['L-APD', 'L-LIA'];
  assert.equal(factorIssues(v, forms).length, 1);
  q.factors[0].coverageIds = [];
  assert.equal(factorIssues(v, forms).length, 1);
  q.factors[0].coverageIds = ['GONE'];
  assert.equal(factorIssues(v, forms).length, 1);
});

// ---- formula integration ----
test('formulas can use a combination factor, only for the coverages it applies to', () => {
  const v = version();
  v.comboFactors = [combo(['kind'], [row('a', { d0: 'K1' })], { coverageIds: ['L-APD'] })];
  const [apd, lia] = v.components[0].classes[0].coverages;
  assert.ok(factorsFor(v, apd, forms).has('combo'));
  assert.ok(!factorsFor(v, lia, forms).has('combo'));
  apd.formula.expression = 'BaseRate * COMBO';
  assert.equal(formulaProblems(apd, factorsFor(v, apd, forms)).errors.length, 0);
  lia.formula.expression = 'BaseRate * COMBO';
  assert.equal(formulaProblems(lia, factorsFor(v, lia, forms)).errors.length, 1);
});

test('single-question factors keep working, and can be limited to a coverage', () => {
  const v = version();
  const q = { id: 'pq', type: 'dropdown', label: 'Pick', options: ['A', 'B'], uses: { rating: true }, factors: [{ id: 'f', name: 'Pick', code: 'PICK', mode: 'choice', byAnswer: [{ id: '1', answer: 'A', value: '1.2' }, { id: '2', answer: 'B', value: '1' }], fallback: '1' }] };
  v.questions = [q];
  const [apd, lia] = v.components[0].classes[0].coverages;
  assert.ok(factorsFor(v, apd, forms).has('pick') && factorsFor(v, lia, forms).has('pick'));
  q.factors[0].coverageIds = ['L-LIA'];
  assert.ok(!factorsFor(v, apd, forms).has('pick'));
  assert.ok(factorsFor(v, lia, forms).has('pick'));
  assert.deepEqual(factorIssues(v, forms), []);
  q.factors[0].coverageIds = ['GONE'];
  assert.equal(factorIssues(v, forms).length, 1);
});

// ---- copying a version ----
test('copying product questions keeps dependencies and combination factors pointing at the new ids', () => {
  const a = { id: 'qa', type: 'dropdown', label: 'A', options: ['x'], help: '', required: false };
  const b = { id: 'qb', type: 'dropdown', label: 'B', options: ['y'], help: '', required: false, dependsOn: { question: 'qa', allowed: { x: ['y'] } } };
  const copies = cloneQuestions([a, b]);
  assert.equal(copies[1].dependsOn.question, copies[0].id);
  assert.equal(b.dependsOn.question, 'qa');
  const combos = [combo([], [])];
  combos[0].dimensions = [{ id: 'd', type: 'question', source: 'product:qa' }, { id: 'e', type: 'question', source: key('kind') }, { id: 'g', type: 'coverage', source: '' }];
  remapQuestionRefs([], null, new Map([['qa', copies[0].id]]), combos);
  assert.deepEqual(combos[0].dimensions.map((d) => d.source), [`product:${copies[0].id}`, key('kind'), '']);
});

// ---- several factors on one question, each for different coverages ----
test('a question can have a different factor on each coverage, even with the same code', () => {
  const v = version();
  const mk = (id, ids, value) => ({ id, name: 'Pick', code: 'PICK', mode: 'choice', coverageIds: ids, byAnswer: [{ id: `${id}a`, answer: 'A', value }], fallback: '1' });
  const q = { id: 'pq', type: 'dropdown', label: 'Pick', options: ['A'], uses: { rating: true }, factors: [mk('f1', ['L-APD'], '1.2'), mk('f2', ['L-LIA'], '0.9')] };
  v.questions = [q];
  const [apd, lia] = v.components[0].classes[0].coverages;
  assert.equal(factorsFor(v, apd, forms).get('pick').factor.id, 'f1');
  assert.equal(factorsFor(v, lia, forms).get('pick').factor.id, 'f2');
  assert.deepEqual(factorIssues(v, forms), []);
});

test('two factors on one question cannot share a coverage, or a code on a shared coverage', () => {
  const v = version();
  const mk = (id, code, ids) => ({ id, name: 'Pick', code, mode: 'choice', coverageIds: ids, byAnswer: [{ id: `${id}a`, answer: 'A', value: '1' }], fallback: '1' });
  const q = { id: 'pq', type: 'dropdown', label: 'Pick', options: ['A'], uses: { rating: true }, factors: [mk('f1', 'ONE', ['L-APD']), mk('f2', 'TWO', ['L-APD', 'L-LIA'])] };
  v.questions = [q];
  assert.equal(factorIssues(v, forms).length, 2);
  q.factors = [mk('f1', 'ONE', []), mk('f2', 'TWO', ['L-LIA'])];
  assert.ok(factorIssues(v, forms).length > 0);
  q.factors = [mk('f1', 'SAME', ['L-APD']), mk('f2', 'SAME', ['L-LIA'])];
  assert.deepEqual(factorIssues(v, forms), []);
});

// ---- one question, a different value on each coverage ----
const ageEntry = { kind: 'range', answers: [], factors: () => [] };
const ageFactor = (extra = {}) => ({
  id: 'age', name: 'Age', code: 'AGE', mode: 'range', fallback: '1',
  coverageIds: ['L-APD', 'L-LIA'],
  bands: [
    { id: 'b1', min: '0', max: '25', value: '1.00', values: { 'L-APD': '1.09', 'L-LIA': '2.08' } },
    { id: 'b2', min: '25', max: '', value: '1.00', values: { 'L-APD': '0.95', 'L-LIA': '1.10' } },
  ],
  ...extra,
});

test('a range factor gives each coverage its own value for the same range', () => {
  const f = ageFactor();
  assert.deepEqual(matrixIds(f), ['L-APD', 'L-LIA']);
  assert.equal(factorValue(f, 20, 'L-APD').value, 1.09);
  assert.equal(factorValue(f, 20, 'L-LIA').value, 2.08);
  assert.equal(factorValue(f, 40, 'L-APD').value, 0.95);
  assert.equal(factorValue(f, 40, 'L-LIA').value, 1.1);
});

test('a choice factor gives each coverage its own value for the same answer', () => {
  const f = { id: 'c', name: 'C', code: 'C', mode: 'choice', fallback: '1', coverageIds: ['L-APD', 'L-LIA'], byAnswer: [{ id: 'r', answer: 'Yes', value: '1', values: { 'L-APD': '1.5', 'L-LIA': '0.5' } }] };
  assert.equal(factorValue(f, 'Yes', 'L-APD').value, 1.5);
  assert.equal(factorValue(f, 'Yes', 'L-LIA').value, 0.5);
  assert.equal(factorValue(f, 'No', 'L-LIA').value, 1);
});

test('a coverage without its own value, and factors with one or no coverage, use the single value', () => {
  const f = ageFactor();
  delete f.bands[0].values['L-LIA'];
  assert.equal(factorValue(f, 20, 'L-LIA').value, 1);
  const single = ageFactor({ coverageIds: ['L-APD'] });
  assert.equal(valueFor(single.bands[0], single, 'L-APD'), '1.00');
  assert.equal(factorValue(ageFactor({ coverageIds: [] }), 20, 'L-APD').value, 1);
  assert.equal(factorValue({ ...ageFactor(), coverageIds: undefined }, 20).value, 1);
});

test('every coverage value is validated on its own', () => {
  const f = ageFactor();
  f.bands[1].values['L-LIA'] = '';
  f.bands[0].values['L-APD'] = '-1';
  const p = factorProblems(ageEntry, f, codeCounts([], { comboFactors: [] }));
  assert.ok(p.byId.get('b1').some((x) => x.field === 'value:L-APD' && x.level === 'error'));
  assert.ok(p.byId.get('b2').some((x) => x.field === 'value:L-LIA' && x.level === 'error'));
  assert.equal(p.byId.get('b1').filter((x) => x.field === 'value:L-LIA').length, 0);
});


test('only questions marked as rating factors can be used, like the Rating factors tab', () => {
  const v = version();
  const untagged = { ...form, sections: [{ ...form.sections[0], questions: form.sections[0].questions.map((q) => (q.id === 'plain' ? { ...q, uses: { rating: false } } : q)) }] };
  const keys = [...comboQuestions(v, [untagged]).keys()];
  assert.ok(keys.includes(key('kind')) && !keys.includes(key('plain')));
  const c = combo(['plain'], [row('r1', { d0: 'P1' })]);
  assert.ok(comboProblems(c, comboContext(v, [untagged], c), new Map(), v).byId.get('general'));
});

// ---- Configure All Combinations ----
test('every valid combination is generated, following the dependencies', () => {
  const v = version();
  const c = combo(['kind', 'range'], []);
  const { list, truncated } = allCombinations(c, comboContext(v, forms, c));
  assert.equal(truncated, false);
  // K1 has 2 ranges, K2 has 1, K3 has none
  assert.equal(list.length, 3);
  assert.equal(new Set(list.map((k) => Object.values(k).join('|'))).size, 3);
  assert.ok(list.every((k) => !(k.d0 === 'K1' && k.d1 === 'R3') && !(k.d0 === 'K2' && k.d1 !== 'R3') && k.d0 !== 'K3'));
  const filled = { ...c, rows: list.map((keys, i) => row(`g${i}`, keys, '1.05')) };
  assert.equal(problems(v, filled).errors, 0);
  const empty = { ...c, rows: list.map((keys, i) => row(`g${i}`, keys, '')) };
  assert.equal(problems(v, empty).errors, 3);
});

test('a dependent column listed before its parent still gets only valid answers, and limits are respected', () => {
  const v = version();
  const c = combo(['range', 'kind'], []);
  const { list } = allCombinations(c, comboContext(v, forms, c));
  assert.equal(list.length, 3);
  assert.ok(list.every((k) => (k.d0 === 'R3') === (k.d1 === 'K2')));
  const big = combo(['kind', 'range', 'plain'], []);
  const capped = allCombinations(big, comboContext(v, forms, big), 2);
  assert.equal(capped.list.length, 2);
  assert.equal(capped.truncated, true);
  assert.deepEqual(allCombinations(combo([], []), comboContext(v, forms, combo([], []))).list, []);
});

// ---- number and currency questions as columns ----
const numQ = (id, label, type = 'number') => ({ id, type, label, help: '', required: false, uses: { rating: true } });
const rangeForm = { ...form, sections: [{ ...form.sections[0], questions: [...form.sections[0].questions, numQ('age', 'Age'), numQ('val', 'Value', 'currency')] }] };
const rforms = [rangeForm];
const rkey = (q) => `form:f1:${q}`;
const band = (id, min, max) => ({ id, min, max });
// a choice column "kind" plus a range column "age" with two ranges: 0 to 25, and 25 and above
const rangeCombo = (rows, extra = {}) => ({
  ...blankCombo(),
  id: 'rc',
  name: 'Age by kind',
  code: 'AGEKIND',
  coverageIds: ['L-APD'],
  dimensions: [
    { id: 'd0', type: 'question', source: rkey('kind') },
    { id: 'd1', type: 'question', source: rkey('age'), bands: [band('b1', '0', '25'), band('b2', '25', '')] },
  ],
  rows,
  ...extra,
});
const rproblems = (c) => comboProblems(c, comboContext(version(), rforms, c), new Map(), version());
const withBands = (c, bands) => ((c.dimensions[1].bands = bands), c);

test('number and currency questions are offered as columns, but only when ranges are asked for', () => {
  const withRanges = comboQuestions(version(), rforms, [], 'rating', true);
  assert.equal(withRanges.get(rkey('age')).kind, 'range');
  assert.equal(withRanges.get(rkey('val')).type, 'currency');
  assert.equal(withRanges.get(rkey('kind')).kind, 'choice');
  assert.ok(!comboQuestions(version(), rforms).has(rkey('age')));
  assert.ok(comboContext(version(), rforms, null).questions.has(rkey('age')));
});

test('a new column for a number question starts with a range, a choice question with none', () => {
  assert.equal(newQuestionDim('x', 'range').bands.length, 1);
  assert.equal(newQuestionDim('x', 'choice').bands, undefined);
});

test('a range column offers its own ranges as the row choices', () => {
  const c = rangeCombo([]);
  const o = fieldOptions(c.dimensions[1], c, {}, comboContext(version(), rforms, c));
  assert.deepEqual(o.options.map((x) => x.value), ['b1', 'b2']);
  assert.deepEqual(o.options.map((x) => x.label), ['0 to 25', '25 to and above']);
  const cur = { ...c, dimensions: [{ id: 'd1', type: 'question', source: rkey('val'), bands: [band('v1', '1000', '5000')] }] };
  assert.equal(fieldOptions(cur.dimensions[0], cur, {}, comboContext(version(), rforms, cur)).options[0].label, '$1,000 to $5,000');
});

test('a valid mix of a choice column and a range column has no errors', () => {
  const rows = [row('r1', { d0: 'K1', d1: 'b1' }), row('r2', { d0: 'K1', d1: 'b2' }), row('r3', { d0: 'K2', d1: 'b1' })];
  assert.equal(rproblems(rangeCombo(rows)).errors, 0);
});

test('ranges must be complete and must not overlap', () => {
  const r1 = [row('r1', { d0: 'K1', d1: 'b1' })];
  assert.ok(rproblems(withBands(rangeCombo([]), [])).byId.get('general').some((x) => /Add at least one range/.test(x.msg)));
  assert.ok(rproblems(withBands(rangeCombo(r1), [band('b1', '0', '30'), band('b2', '25', '')])).byId.get('b2').some((x) => x.field === 'min' && x.level === 'error'));
  assert.ok(rproblems(withBands(rangeCombo(r1), [band('b1', '30', '10')])).byId.get('b1').some((x) => x.field === 'max' && /greater than From/.test(x.msg)));
  assert.ok(rproblems(withBands(rangeCombo(r1), [band('b1', '0', ''), band('b2', '25', '')])).byId.get('b1').some((x) => /only the last range/.test(x.msg)));
  const gap = rproblems(withBands(rangeCombo(r1), [band('b1', '0', '10'), band('b2', '20', '')]));
  assert.ok(gap.byId.get('b2').some((x) => x.level === 'warn'));
  assert.equal(gap.errors, 0);
});

test('a row cannot name a range that was removed, and the same combination twice is an error', () => {
  assert.ok(rproblems(rangeCombo([row('r1', { d0: 'K1', d1: 'gone' })])).byId.get('r1').some((x) => x.field === 'd1' && x.level === 'error'));
  const dup = rproblems(rangeCombo([row('r1', { d0: 'K1', d1: 'b1' }), row('r2', { d0: 'K1', d1: 'b1' })]));
  assert.ok(dup.byId.get('r2').some((x) => /already configured/.test(x.msg)));
});

test('a question that changed type asks for the column to be added again', () => {
  const c = rangeCombo([]);
  c.dimensions[0] = { id: 'd0', type: 'question', source: rkey('age') }; // a number question with no ranges
  assert.ok(rproblems(c).byId.get('general').some((x) => /changed type/.test(x.msg)));
});

test('the answer is matched to the range it falls in: From included, To not', () => {
  const c = rangeCombo([row('a', { d0: 'K1', d1: 'b1' }, '1.30'), row('b', { d0: 'K1', d1: 'b2' }, '0.80')], { fallback: '1.00' });
  const at = (age, kind = 'K1') => comboValue(c, { [rkey('kind')]: kind, [rkey('age')]: age }, 'L-APD');
  assert.equal(at(0).value, 1.3);
  assert.equal(at('24.99').value, 1.3);
  assert.equal(at(25).value, 0.8);
  assert.equal(at(90).value, 0.8);
  ['', 'abc', -1].forEach((bad) => assert.equal(at(bad).how, 'the fallback value'));
  assert.equal(at(10, 'K2').how, 'the fallback value');
  assert.equal(bandOf(c.dimensions[1], 25).id, 'b2');
});

test('Configure All Combinations crosses the choices with the ranges', () => {
  const c = rangeCombo([]);
  const { list } = allCombinations(c, comboContext(version(), rforms, c));
  assert.equal(list.length, 3 * 2); // K1, K2, K3 x two ranges
  const filled = { ...c, rows: list.map((keys, i) => row(`g${i}`, keys, '1.05')) };
  assert.equal(rproblems(filled).errors, 0);
});

test('removing a range clears the answers that used it when the keys are settled', () => {
  const c = withBands(rangeCombo([]), [band('b2', '25', '')]);
  assert.deepEqual(settleKeys(c, { d0: 'K1', d1: 'b1' }, comboContext(version(), rforms, c)), ['Age']);
});

test('copying a version keeps the ranges and re-points the question', () => {
  const c = rangeCombo([row('a', { d0: 'K1', d1: 'b1' })]);
  c.dimensions[1].source = 'product:old';
  const combos = [JSON.parse(JSON.stringify(c))];
  remapQuestionRefs([], null, new Map([['old', 'new']]), combos);
  assert.equal(combos[0].dimensions[1].source, 'product:new');
  assert.equal(combos[0].dimensions[1].bands.length, 2);
  assert.equal(combos[0].rows[0].keys.d1, 'b1');
});


// ---- one coverage per factor, and only that coverage's questions ----
// Two coverages, each with its own form: APD asks "Kind"; Liability has a question of its own.
const own = (id, label, factors) => ({ id, type: 'dropdown', label, options: ['A', 'B'], uses: { rating: true }, factors });
const pf = (id, code, ids, extra = {}) => ({ id, name: code, code, mode: 'choice', coverageIds: ids, byAnswer: [{ id: `${id}a`, answer: 'A', value: '1.2', values: { 'L-APD': '1.3', 'L-LIA': '0.7' } }, { id: `${id}b`, answer: 'B', value: '1' }], fallback: '1', ...extra });

test('only the questions of the chosen coverage, plus product questions, are listed', () => {
  const v = version();
  const [apd, lia] = v.components[0].classes[0].coverages;
  apd.forms = [];
  lia.forms = [];
  apd.questions = [own('qa', 'APD only', [])];
  lia.questions = [own('ql', 'Liability only', [])];
  v.questions = [own('qp', 'Whole product', [])];
  const labels = (id) => collectFactorGroups(v, forms, id).flatMap((g) => g.qs.map((q) => q.label)).sort();
  assert.deepEqual(labels('L-APD'), ['APD only', 'Whole product']);
  assert.deepEqual(labels('L-LIA'), ['Liability only', 'Whole product']);
  assert.deepEqual(labels(null), ['APD only', 'Liability only', 'Whole product']);
});

test('a factor on a question of one coverage cannot be for another coverage', () => {
  const v = version();
  const [apd, lia] = v.components[0].classes[0].coverages;
  apd.forms = [];
  lia.forms = [];
  apd.questions = [own('qa', 'APD only', [pf('f', 'APDF', ['L-LIA'])])];
  assert.equal(factorIssues(v, forms).length, 1);
  apd.questions[0].factors[0].coverageIds = ['L-APD'];
  assert.deepEqual(factorIssues(v, forms), []);
});

test('older factors are brought to one coverage each: split, narrowed, or dropped', () => {
  const v = version();
  const [apd, lia] = v.components[0].classes[0].coverages;
  apd.forms = [];
  lia.forms = [];
  // product question: one factor for both coverages, another for none (= all)
  v.questions = [own('qp', 'Whole product', [pf('both', 'BOTH', ['L-APD', 'L-LIA'])]), own('qq', 'Other', [pf('all', 'ALL', [])])];
  // APD's own question: meant for both coverages -> APD only; one meant for Liability only -> removed
  apd.questions = [own('qa', 'APD only', [pf('mine', 'MINE', ['L-APD', 'L-LIA'])]), own('qb', 'APD other', [pf('foreign', 'FOREIGN', ['L-LIA'])])];
  const done = scopeFactorsToCoverages(v, forms);
  assert.deepEqual(done, { split: 2, dropped: 1 });
  const [both] = v.questions[0].factors.length === 2 ? [v.questions[0].factors] : [];
  assert.deepEqual(both.map((f) => f.coverageIds), [['L-APD'], ['L-LIA']]);
  assert.equal(both[0].id, 'both');
  assert.notEqual(both[1].id, 'both');
  // each coverage keeps its own value
  assert.deepEqual(both.map((f) => f.byAnswer[0].value), ['1.3', '0.7']);
  assert.ok(both.every((f) => f.byAnswer.every((r) => r.values === undefined)));
  assert.deepEqual(v.questions[1].factors.map((f) => f.coverageIds), [['L-APD'], ['L-LIA']]);
  assert.deepEqual(apd.questions[0].factors.map((f) => f.coverageIds), [['L-APD']]);
  assert.equal(apd.questions[1].factors.length, 0);
  assert.deepEqual(factorIssues(v, forms), []);
  // the same code on two coverages is fine now, and each formula sees only its own
  assert.equal(factorsFor(v, apd, forms).get('both').factor.coverageIds[0], 'L-APD');
  assert.equal(factorsFor(v, lia, forms).get('both').factor.coverageIds[0], 'L-LIA');
  // nothing left to fix the second time
  assert.deepEqual(scopeFactorsToCoverages(v, forms), { split: 0, dropped: 0 });
});

test('a combination factor for several coverages is split, and loses the columns of other coverages', () => {
  const v = version();
  const [apd, lia] = v.components[0].classes[0].coverages;
  apd.forms = [{ formId: 'f1', excluded: [] }];
  lia.forms = [];
  lia.questions = [own('ql', 'Liability only', [])];
  const c = combo(['coverage', 'kind'], [row('a', { d0: 'L-APD', d1: 'K1' }, '1.5'), row('b', { d0: 'L-LIA', d1: 'K1' }, '0.5')], { coverageIds: [] });
  c.dimensions.push({ id: 'd2', type: 'question', source: 'coverage:ql' });
  v.comboFactors = [c];
  assert.deepEqual(scopeFactorsToCoverages(v, forms), { split: 1, dropped: 0 });
  assert.equal(v.comboFactors.length, 2);
  const [a, l] = v.comboFactors;
  assert.deepEqual([a.coverageIds, l.coverageIds], [['L-APD'], ['L-LIA']]);
  assert.deepEqual(a.dimensions.map((d) => d.id), ['d1']);
  assert.deepEqual(a.rows.map((r) => [r.id, r.value]), [['a', '1.5']]);
  assert.deepEqual(l.dimensions.map((d) => d.id), ['d2']);
  assert.deepEqual(l.rows.map((r) => r.id), ['b']);
});
