import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAccountFactor,
  clampFactor,
  accountFactorProblems,
  accountFactorIssues,
  accountContext,
  accountQuestionList,
  accountOf,
  blankAccountFactor,
  blankFactor,
  blankRow,
  matchingRow,
  rowBehavior,
  isConfigured,
  refOfKey,
  ACCOUNT_CODE,
} from '../public/js/account-factor-calc.js';
import { allCombinations, settleKeys } from '../public/js/combo-factor-calc.js';
import { factorsFor, formulaProblems, formulaIssues } from '../public/js/formula.js';
import { factorProblems } from '../public/js/factors.js';
import { startNextVersion } from '../public/js/product-model.js';

// Vehicle type -> Radius (dependent) and Garaging, all ticked as account-level factors.
const account = { eligibility: false, rating: false, account: true };
const version = (extra = {}) => ({
  questions: [
    { id: 'vt', label: 'Vehicle Type', type: 'dropdown', options: ['Trucker', 'Tractor', 'Bus'], uses: { ...account } },
    { id: 'rad', label: 'Radius', type: 'dropdown', options: ['0-50', '51-200', '200+'], uses: { ...account }, dependsOn: { question: 'vt', allowed: { Trucker: ['0-50', '200+'], Tractor: ['51-200'] } } },
    { id: 'gar', label: 'Garaging', type: 'yesno', options: [], uses: { ...account } },
    { id: 'no', label: 'Not tagged', type: 'dropdown', options: ['A'], uses: { eligibility: true, rating: true, account: false } },
    { id: 'num', label: 'Fleet size', type: 'number', options: [], uses: { ...account } },
    { id: 'txt', label: 'Notes', type: 'text', options: [], uses: { ...account } },
  ],
  components: [{ id: 'c', name: 'C', classes: [{ id: 'k', name: 'K', coverages: [{ id: 'cov1', coverageId: 'lib1', name: 'Cov', questions: [], forms: [] }] }] }],
  ...extra,
});
const ctx = () => accountContext(version(), []);
const dimsOf = (...ids) => ids.map((id) => ({ id: `d-${id}`, type: 'question', source: `product:${id}` }));
const factor = (ids, rows = [], id = 'cf') => ({ ...blankFactor(dimsOf(...ids)), id, name: id, rows });
const row = (id, keys, adjustment, behavior = 'plus') => ({ id, keys, adjustment, behavior });
const cfg = (factors, min = '0.85', max = '1.50') => ({ min, max, factors });

// ---- questions ----
test('choice, number and currency questions ticked as account-level factors can be used', () => {
  assert.deepEqual([...ctx().questions.keys()].sort(), ['product:gar', 'product:num', 'product:rad', 'product:vt']);
  assert.equal(ctx().questions.get('product:num').kind, 'range');
  assert.equal(ctx().questions.get('product:vt').kind, 'choice');
});

test('the list shows every ticked question and says which can be used', () => {
  const list = accountQuestionList(version(), []);
  assert.deepEqual(list.map((q) => q.ref).sort(), ['product:gar', 'product:num', 'product:rad', 'product:txt', 'product:vt']);
  assert.equal(list.find((q) => q.ref === 'product:txt').usable, false);
  assert.equal(list.find((q) => q.ref === 'product:num').usable, true);
  assert.equal(list.find((q) => q.ref === 'product:vt').usable, true);
});

// ---- number and currency questions: an adjustment per range ----
const bandOfSize = (id, min, max) => ({ id, min, max });
const sizeFactor = (rows = [], bands = [bandOfSize('s1', '0', '10'), bandOfSize('s2', '10', '')]) => {
  const f = factor(['vt', 'num'], rows);
  f.dimensions[1].bands = bands;
  return f;
};

test('a number question adds one adjustment per range, found from the number entered', () => {
  const f = sizeFactor([row('a', { 'd-vt': 'Trucker', 'd-num': 's1' }, '0.20'), row('b', { 'd-vt': 'Trucker', 'd-num': 's2' }, '0.50', 'minus')]);
  const at = (n) => computeAccountFactor(cfg([f]), { 'product:vt': 'Trucker', 'product:num': n }).raw;
  assert.equal(at(9.99), 0.2);
  assert.equal(at(10), -0.5);
  assert.equal(at(500), -0.5);
  assert.equal(at(''), 1); // nothing applies: the neutral factor
  assert.equal(at('x'), 1);
  assert.equal(at(-5), 1);
  assert.equal(matchingRow(f, { 'product:vt': 'Bus', 'product:num': 5 }), null);
});

test('Configure All Combinations crosses the choices with the ranges', () => {
  const f = sizeFactor();
  assert.equal(allCombinations(f, ctx()).list.length, 3 * 2);
});

test('ranges are validated, and a row must name a range that exists', () => {
  const ok = sizeFactor([row('a', { 'd-vt': 'Trucker', 'd-num': 's1' }, '0.2')]);
  assert.equal(accountFactorProblems(cfg([ok]), ctx()).errors, 0);
  const overlap = sizeFactor([row('a', { 'd-vt': 'Trucker', 'd-num': 's1' }, '0.2')], [bandOfSize('s1', '0', '20'), bandOfSize('s2', '10', '')]);
  assert.ok(accountFactorProblems(cfg([overlap]), ctx()).byKey.get('cf:band:s2').some((x) => x.level === 'error'));
  const none = sizeFactor([], []);
  assert.ok(accountFactorProblems(cfg([none]), ctx()).byKey.get('cf:general').some((x) => /at least one range/.test(x.msg)));
  const stale = sizeFactor([row('a', { 'd-vt': 'Trucker', 'd-num': 'gone' }, '0.2')]);
  assert.ok(accountFactorProblems(cfg([stale]), ctx()).errors > 0);
  const retyped = sizeFactor([]);
  delete retyped.dimensions[1].bands; // the question is a number but the column has no ranges
  assert.ok(accountFactorProblems(cfg([retyped]), ctx()).byKey.get('cf:general').some((x) => /changed type/.test(x.msg)));
});

test('a form question ticked as an account-level factor is listed and usable', () => {
  const forms = [{ id: 'f1', name: 'App form', sections: [{ questions: [
    { id: 'fq', label: 'Operates at night', type: 'yesno', options: [], uses: { ...account } },
    { id: 'fq2', label: 'Hazard class', type: 'dropdown', options: ['Low', 'High'] },
    { id: 'fq3', label: 'Years in business', type: 'number', options: [], uses: { ...account } },
    { id: 'fq4', label: 'Trade name', type: 'text', options: [], uses: { ...account } },
  ] }] }];
  const v = version();
  v.components[0].classes[0].coverages[0].forms = [{ formId: 'f1', excluded: [] }];
  assert.ok(accountContext(v, forms).questions.has('form:f1:fq'));
  assert.ok(!accountContext(v, forms).questions.has('form:f1:fq2'), 'not ticked, so not listed');
  const listed = accountQuestionList(v, forms);
  assert.equal(listed.find((q) => q.ref === 'form:f1:fq').group, 'Form › App form');
  assert.equal(listed.find((q) => q.ref === 'form:f1:fq3').usable, true);
  assert.equal(listed.find((q) => q.ref === 'form:f1:fq4').usable, false);
  // ticking it on the coverage (instead of in the form builder) works too
  v.components[0].classes[0].coverages[0].formUses = { 'f1:fq2': { ...account } };
  assert.ok(accountContext(v, forms).questions.has('form:f1:fq2'));
});

test('question keys become references that do not depend on coverage ids', () => {
  assert.equal(refOfKey('p:abc'), 'product:abc');
  assert.equal(refOfKey('c:cov1:abc'), 'coverage:abc');
  assert.equal(refOfKey('f:cov1:f1:fq'), 'form:f1:fq');
});

// ---- combinations ----
test('a single question gives one row per answer', () => {
  assert.deepEqual(allCombinations(factor(['vt']), ctx()).list.map((k) => k['d-vt']), ['Trucker', 'Tractor', 'Bus']);
});

test('Configure All Combinations follows the dependent dropdowns', () => {
  const { list } = allCombinations(factor(['vt', 'rad']), ctx());
  assert.deepEqual(list.map((k) => `${k['d-vt']}/${k['d-rad']}`).sort(), ['Tractor/51-200', 'Trucker/0-50', 'Trucker/200+']);
});

test('changing the first answer clears a dependent answer that no longer fits', () => {
  const keys = { 'd-vt': 'Tractor', 'd-rad': '200+' };
  assert.deepEqual(settleKeys(factor(['vt', 'rad']), keys, ctx()), ['Radius']);
  assert.equal(keys['d-rad'], '');
});

// ---- calculation ----
test('the matching row gives the adjustment; Plus adds and Minus subtracts per row', () => {
  const f = factor(['vt', 'rad'], [row('1', { 'd-vt': 'Trucker', 'd-rad': '200+' }, '0.20'), row('2', { 'd-vt': 'Tractor', 'd-rad': '51-200' }, '0.05', 'minus')]);
  assert.equal(computeAccountFactor(cfg([f]), { 'product:vt': 'Trucker', 'product:rad': '200+' }).raw, 0.2);
  assert.equal(computeAccountFactor(cfg([f]), { 'product:vt': 'tractor', 'product:rad': '51-200' }).raw, -0.05);
});

test('a row applies only when every question matches; blank answers never match', () => {
  const f = factor(['vt', 'rad'], [row('1', { 'd-vt': 'Trucker', 'd-rad': '200+' }, '0.2')]);
  assert.equal(matchingRow(f, { 'product:vt': 'Trucker', 'product:rad': '0-50' }), null);
  assert.equal(matchingRow(f, { 'product:vt': 'Trucker' }), null);
  assert.equal(matchingRow(f, {}), null);
});

test('a row without a valid adjustment is ignored, and no match leaves the factor at 1.00', () => {
  assert.equal(computeAccountFactor(cfg([factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '')])]), { 'product:gar': 'Yes' }).value, 1);
  assert.equal(computeAccountFactor(cfg([factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.2')])]), { 'product:gar': 'No' }).value, 1);
});

test('a row without its own direction follows the factor', () => {
  assert.equal(rowBehavior({ behavior: 'minus' }, {}), 'minus');
  assert.equal(rowBehavior({ behavior: 'plus' }, { behavior: 'minus' }), 'minus');
  assert.equal(blankRow({ behavior: 'minus' }).behavior, 'minus');
});

test('adjustments of several factors add up and decimals stay clean', () => {
  const a = factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.10')], 'a');
  const b = factor(['vt'], [row('2', { 'd-vt': 'Bus' }, '0.20')], 'b');
  const c = factor(['rad'], [row('3', { 'd-rad': '0-50' }, '0.05', 'minus')], 'c');
  const r = computeAccountFactor(cfg([a, b, c]), { 'product:gar': 'Yes', 'product:vt': 'Bus', 'product:rad': '0-50' });
  assert.equal(r.raw, 0.25);
  assert.deepEqual(r.applied.map((x) => x.amount), [0.1, 0.2, -0.05]);
});

// ---- minimum and maximum ----
test('clampFactor ignores a limit that is not a number', () => {
  assert.equal(clampFactor(2, '', ''), 2);
  assert.equal(clampFactor(2, '0.8', '1.5'), 1.5);
  assert.equal(clampFactor(0.1, '0.8', ''), 0.8);
});

test('values are added with Plus as + and Minus as -: 1.00 + 2.00 - 1.00 = 2.00, kept between 0.80 and 2.20', () => {
  const a = factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '1.00')], 'a');
  const b = factor(['vt'], [row('2', { 'd-vt': 'Bus' }, '2.00')], 'b');
  const c = factor(['rad'], [row('3', { 'd-rad': '0-50' }, '1.00', 'minus')], 'c');
  const answers = { 'product:gar': 'Yes', 'product:vt': 'Bus', 'product:rad': '0-50' };
  const r = computeAccountFactor(cfg([a, b, c], '0.80', '2.20'), answers);
  assert.equal(r.raw, 2);
  assert.equal(r.value, 2);
  assert.equal(r.limited, null);
});

test('a total above the maximum becomes the maximum, below the minimum becomes the minimum', () => {
  const a = factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '2.00')], 'a');
  const b = factor(['vt'], [row('2', { 'd-vt': 'Bus' }, '1.00')], 'b');
  const answers = { 'product:gar': 'Yes', 'product:vt': 'Bus' };
  const over = computeAccountFactor(cfg([a, b], '0.80', '2.20'), answers);
  assert.equal(over.raw, 3);
  assert.equal(over.value, 2.2);
  assert.equal(over.limited, 'max');
  const under = computeAccountFactor(cfg([factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.30')])], '0.80', '2.20'), answers);
  assert.equal(under.value, 0.8);
  assert.equal(under.limited, 'min');
});

test('limits are applied to the total only, never to the individual values', () => {
  const a = factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '5.00')], 'a');
  const b = factor(['vt'], [row('2', { 'd-vt': 'Bus' }, '4.00', 'minus')], 'b');
  const r = computeAccountFactor(cfg([a, b], '0.80', '2.20'), { 'product:gar': 'Yes', 'product:vt': 'Bus' });
  assert.equal(r.raw, 1);
  assert.equal(r.value, 1);
});

test('when no row applies the factor is the neutral 1.00 (still kept between the limits)', () => {
  const a = factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '2.00')]);
  assert.equal(computeAccountFactor(cfg([a], '0.80', '2.20'), { 'product:gar': 'No' }).value, 1);
  assert.equal(computeAccountFactor(cfg([a], '1.20', '2.20'), {}).value, 1.2);
});

// ---- validation ----
const problems = (f, c = cfg([f])) => accountFactorProblems(c, ctx());

test('a complete, valid factor has no errors', () => {
  assert.equal(problems(factor(['vt', 'rad'], [row('1', { 'd-vt': 'Trucker', 'd-rad': '200+' }, '0.2')])).errors, 0);
});

test('missing answer, invalid dependent answer, bad adjustment, duplicate, empty table, no name', () => {
  const missing = factor(['vt', 'rad'], [row('1', { 'd-vt': 'Trucker' }, '0.2')]);
  assert.ok(problems(missing).byKey.has('cf:row:1'));
  assert.ok(problems(missing).byKey.has('cf:row:1:d-rad'));
  assert.ok(problems(factor(['vt', 'rad'], [row('1', { 'd-vt': 'Tractor', 'd-rad': '200+' }, '0.2')])).byKey.has('cf:row:1:d-rad'));
  assert.ok(problems(factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '')])).byKey.has('cf:row:1:adj'));
  assert.ok(problems(factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '-1')])).errors > 0);
  assert.ok(problems(factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.1'), row('2', { 'd-gar': 'yes' }, '0.2')])).byKey.has('cf:row:2'));
  assert.ok(problems(factor(['gar'])).byKey.has('cf:general'));
  assert.ok(problems({ ...factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.1')]), name: '' }).byKey.has('cf:name'));
});

test('a question that is no longer an account-level factor is reported', () => {
  assert.ok(problems(factor(['no'], [row('1', { 'd-no': 'A' }, '0.1')])).byKey.has('cf:general'));
});

test('limits are required once there is a factor, must be numbers of 0 or more, and min cannot exceed max', () => {
  const f = factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.1')]);
  assert.ok(problems(f, cfg([f], '1.6', '1.5')).byKey.has('limits:min'));
  assert.ok(problems(f, cfg([f], '', '')).byKey.has('limits:max'));
  assert.ok(problems(f, cfg([f], '-1', '1.5')).byKey.has('limits:min'));
  assert.equal(problems(f, cfg([], '', '')).errors, 0);
});

test('Account-Level Factor is optional; publishing is blocked only by an incomplete one', () => {
  assert.deepEqual(accountFactorIssues({ components: [], questions: [] }, []), []);
  assert.deepEqual(accountFactorIssues({ components: [], questions: [], accountFactor: blankAccountFactor() }, []), []);
  const f = factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '')]);
  const v = version({ accountFactor: cfg([f]) });
  assert.equal(accountFactorIssues(v, []).length, 1);
  f.rows[0].adjustment = '0.1';
  assert.deepEqual(accountFactorIssues(v, []), []);
});

// ---- earlier condition-based factors ----
test('factors saved by the earlier condition-based screen are dropped and never calculated', () => {
  const old = { id: 'o', name: 'Old', behavior: 'plus', adjustment: '0.30', logic: 'any', conditions: [{ id: 'c', ref: 'product:gar', op: 'is', value: 'Yes' }] };
  assert.equal(isConfigured({ factors: [old] }), false);
  assert.equal(computeAccountFactor(cfg([old]), { 'product:gar': 'Yes' }).value, 1);
  const v = version({ accountFactor: cfg([old, factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.1')])]) });
  assert.equal(accountOf(v).factors.length, 1);
});

// ---- formula integration ----
const withAccount = () => version({ accountFactor: cfg([factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.1')], 'a'), factor(['vt'], [row('2', { 'd-vt': 'Bus' }, '0.1')], 'b')]) });

test('the formula gets one consolidated Account-Level Factor, not one per factor', () => {
  const v = withAccount();
  const available = factorsFor(v, v.components[0].classes[0].coverages[0], []);
  assert.deepEqual([...available.keys()], [ACCOUNT_CODE.toLowerCase()]);
  assert.equal(available.get('accountfactor').account, true);
});

test('a formula can use AccountFactor next to BaseRate', () => {
  const v = withAccount();
  const cov = v.components[0].classes[0].coverages[0];
  cov.formula = { expression: 'BaseRate * AccountFactor' };
  assert.deepEqual(formulaProblems(cov, factorsFor(v, cov, [])).errors, []);
  assert.deepEqual(formulaIssues(v, []), []);
});

test('AccountFactor is not available until at least one factor is set up', () => {
  const v = version({ accountFactor: blankAccountFactor() });
  const cov = v.components[0].classes[0].coverages[0];
  cov.formula = { expression: 'BaseRate * AccountFactor' };
  assert.equal(isConfigured(v.accountFactor), false);
  assert.ok(formulaProblems(cov, factorsFor(v, cov, [])).errors[0].includes('Account-Level Factor'));
});

test('a regular rating factor cannot take the AccountFactor code', () => {
  const entry = { kind: 'choice', answers: ['Yes'] };
  const f = { id: 'f', name: 'x', code: 'AccountFactor', mode: 'choice', byAnswer: [{ id: 'r', answer: 'Yes', value: '1.00' }], fallback: '1.00' };
  assert.ok(factorProblems(entry, f, new Map([['accountfactor', 1]])).byId.get('code').some((m) => m.level === 'error'));
});

// ---- persistence ----
test('copying a version keeps the factors and follows renamed product questions', async () => {
  const from = { ...withAccount(), label: '2026.01', createdAt: '2026-01-01' };
  const api = () => ({ create: async (data) => ({ id: 'new', ...data }) });
  const { version: copy } = await startNextVersion(api, 'prod', [{ productRef: 'prod', label: '2026.01', status: 'Published', createdAt: '2026-01-01' }], from);
  const fresh = copy.questions.find((q) => q.label === 'Garaging').id;
  assert.notEqual(fresh, 'gar');
  assert.equal(copy.accountFactor.factors[0].dimensions[0].source, `product:${fresh}`);
  assert.equal(from.accountFactor.factors[0].dimensions[0].source, 'product:gar', 'the source version is not changed');
  assert.equal(copy.accountFactor.factors[0].rows[0].adjustment, '0.1');
  assert.equal(copy.accountFactor.min, '0.85');
});

test('a version saved before account-level factors existed still works', async () => {
  const old = version();
  assert.equal(old.accountFactor, undefined);
  assert.deepEqual(accountFactorIssues(old, []), []);
  assert.equal(computeAccountFactor(old.accountFactor, {}).value, 1);
  const api = () => ({ create: async (d) => ({ id: 'n', ...d }) });
  const { version: copy } = await startNextVersion(api, 'p', [], { ...old, label: '1', createdAt: 'x' });
  assert.equal(copy.accountFactor, null);
});

// ---- “+ Add question” ----
test('the Add question dialog offers account-level factors only the answer types they can use', async () => {
  const { typesFor, ACCOUNT_TYPES } = await import('../public/js/question-uses.js');
  assert.deepEqual(typesFor('account'), ACCOUNT_TYPES);
  assert.ok(!ACCOUNT_TYPES.includes('text') && !ACCOUNT_TYPES.includes('date') && ACCOUNT_TYPES.includes('number') && ACCOUNT_TYPES.includes('currency'));
  assert.equal(typesFor('eligibility'), null);
  // everything the dialog can create for this stage is usable by a factor
  const q = { id: 'n', label: 'New', type: ACCOUNT_TYPES[0], options: ['A', 'B'], uses: { ...account } };
  const v = version();
  v.questions.push(q);
  assert.ok(accountContext(v, []).questions.has('product:n'));
});

test('Plus or Minus belongs to the factor; older rows with different behaviours are reported as mixed', async () => {
  const { factorBehavior, computeAccountFactor: calc } = await import('../public/js/account-factor-calc.js');
  const f = { ...factor(['gar'], [row('1', { 'd-gar': 'Yes' }, '0.5', 'minus'), row('2', { 'd-gar': 'No' }, '0.2', 'minus')]), behavior: 'minus' };
  assert.equal(factorBehavior(f), 'minus');
  assert.equal(factorBehavior({ ...f, rows: [] }), 'minus');
  assert.equal(factorBehavior({ ...f, behavior: 'plus', rows: [] }), 'plus');
  assert.equal(factorBehavior({ ...f, rows: [row('1', { 'd-gar': 'Yes' }, '0.5', 'plus'), row('2', { 'd-gar': 'No' }, '0.2', 'minus')] }), 'mixed');
  // changing the factor's behaviour on every row (what the screen does) changes the sign of what is applied
  const answers = { 'product:gar': 'Yes' };
  assert.equal(calc(cfg([f], '0', '5'), answers).applied[0].amount, -0.5);
  f.behavior = 'plus';
  f.rows.forEach((r) => (r.behavior = 'plus'));
  assert.equal(calc(cfg([f], '0', '5'), answers).applied[0].amount, 0.5);
});
