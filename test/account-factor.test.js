import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAccountFactor,
  clampFactor,
  factorApplies,
  accountFactorProblems,
  accountFactorIssues,
  accountQuestions,
  refOfKey,
  isConfigured,
  blankAccountFactor,
  ACCOUNT_CODE,
} from '../public/js/account-factor-calc.js';
import { factorsFor, formulaProblems, formulaIssues } from '../public/js/formula.js';
import { factorProblems } from '../public/js/factors.js';
import { startNextVersion, remapQuestionRefs } from '../public/js/product-model.js';

// ---- helpers ----
const yesNo = (ref) => [ref, { ref, label: ref, type: 'yesno', options: [], tagged: true }];
const questions = (...refs) => new Map(refs.map(yesNo));
const cond = (id, ref, value = 'Yes') => ({ id, ref, op: 'is', value, value2: '' });
const factor = (id, behavior, adjustment, conditions, logic = 'any') => ({ id, name: id, behavior, adjustment, logic, conditions });
const config = (factors, min = '0.80', max = '1.50') => ({ min, max, factors });
const yes = (...refs) => Object.fromEntries(refs.map((r) => [r, 'Yes']));

// ---- calculation: the three scenarios from the requirements ----
test('adjustments above the maximum are limited to the maximum', () => {
  const c = config([factor('a', 'plus', '0.40', [cond('1', 'product:q1')]), factor('b', 'plus', '0.30', [cond('2', 'product:q2')])]);
  const r = computeAccountFactor(c, questions('product:q1', 'product:q2'), yes('product:q1', 'product:q2'));
  assert.equal(r.raw, 1.7);
  assert.equal(r.value, 1.5);
  assert.equal(r.limited, 'max');
});

test('adjustments below the minimum are limited to the minimum', () => {
  const c = config([factor('a', 'minus', '0.20', [cond('1', 'product:q1')]), factor('b', 'minus', '0.20', [cond('2', 'product:q2')])]);
  const r = computeAccountFactor(c, questions('product:q1', 'product:q2'), yes('product:q1', 'product:q2'));
  assert.equal(r.raw, 0.6);
  assert.equal(r.value, 0.8);
  assert.equal(r.limited, 'min');
});

test('adjustments within the limits are used as calculated', () => {
  const c = config([factor('a', 'plus', '0.20', [cond('1', 'product:q1')])]);
  const r = computeAccountFactor(c, questions('product:q1'), yes('product:q1'));
  assert.equal(r.value, 1.2);
  assert.equal(r.limited, null);
});

test('plus and minus combine additively from 1.00 and decimals stay clean', () => {
  const c = config([factor('a', 'plus', '0.10', [cond('1', 'product:q1')]), factor('b', 'plus', '0.20', [cond('2', 'product:q2')]), factor('c', 'minus', '0.05', [cond('3', 'product:q3')])]);
  const r = computeAccountFactor(c, questions('product:q1', 'product:q2', 'product:q3'), yes('product:q1', 'product:q2', 'product:q3'));
  assert.equal(r.raw, 1.25);
  assert.deepEqual(r.applied.map((a) => a.amount), [0.1, 0.2, -0.05]);
});

test('no applicable adjustment leaves the factor at 1.00', () => {
  const c = config([factor('a', 'plus', '0.40', [cond('1', 'product:q1')])]);
  assert.equal(computeAccountFactor(c, questions('product:q1'), { 'product:q1': 'No' }).value, 1);
});

test('clampFactor ignores a limit that is not a number', () => {
  assert.equal(clampFactor(2, '', ''), 2);
  assert.equal(clampFactor(2, '0.8', '1.5'), 1.5);
  assert.equal(clampFactor(0.1, '0.8', ''), 0.8);
});

// ---- conditions ----
test('missing or blank answers never satisfy a condition', () => {
  const f = factor('a', 'plus', '0.1', [cond('1', 'product:q1', 'No')]);
  assert.equal(factorApplies(f, questions('product:q1'), {}), false);
  assert.equal(factorApplies(f, questions('product:q1'), { 'product:q1': '' }), false);
});

test('any / all logic', () => {
  const q = questions('product:q1', 'product:q2');
  const conds = [cond('1', 'product:q1'), cond('2', 'product:q2')];
  assert.equal(factorApplies(factor('a', 'plus', '0.1', conds, 'any'), q, yes('product:q1')), true);
  assert.equal(factorApplies(factor('a', 'plus', '0.1', conds, 'all'), q, yes('product:q1')), false);
  assert.equal(factorApplies(factor('a', 'plus', '0.1', conds, 'all'), q, yes('product:q1', 'product:q2')), true);
});

test('a factor without conditions, or on an unknown question, never applies', () => {
  assert.equal(factorApplies(factor('a', 'plus', '0.1', []), questions(), {}), false);
  assert.equal(factorApplies(factor('a', 'plus', '0.1', [cond('1', 'product:gone')]), questions(), yes('product:gone')), false);
});

test('number and choice conditions use the same operators as eligibility rules', () => {
  const q = new Map([
    ['product:n', { ref: 'product:n', type: 'number', options: [], tagged: true }],
    ['product:c', { ref: 'product:c', type: 'dropdown', options: ['A', 'B'], tagged: true }],
  ]);
  const num = factor('n', 'plus', '0.1', [{ id: '1', ref: 'product:n', op: 'gte', value: '5', value2: '' }]);
  const choice = factor('c', 'plus', '0.1', [{ id: '2', ref: 'product:c', op: 'in', value: ['A'], value2: '' }]);
  assert.equal(factorApplies(num, q, { 'product:n': '7' }), true);
  assert.equal(factorApplies(num, q, { 'product:n': '3' }), false);
  assert.equal(factorApplies(choice, q, { 'product:c': 'A' }), true);
  assert.equal(factorApplies(choice, q, { 'product:c': 'B' }), false);
});

// ---- validation ----
const goodFactor = () => factor('a', 'plus', '0.2', [cond('1', 'product:q1')]);
const owners = (p) => [...p.byOwner.keys()];

test('a valid configuration has no errors', () => {
  assert.equal(accountFactorProblems(config([goodFactor()]), questions('product:q1')).errors, 0);
});

test('minimum cannot exceed maximum', () => {
  const p = accountFactorProblems(config([goodFactor()], '1.6', '1.2'), questions('product:q1'));
  assert.ok(p.byKey.get('limits:min').some((m) => m.level === 'error'));
});

test('limits are required once there is a factor, and must be numbers of 0 or more', () => {
  const missing = accountFactorProblems(config([goodFactor()], '', ''), questions('product:q1'));
  assert.ok(missing.byKey.has('limits:min') && missing.byKey.has('limits:max'));
  const negative = accountFactorProblems(config([goodFactor()], '-1', 'x'), questions('product:q1'));
  assert.equal(negative.errors >= 2, true);
});

test('factor needs a name, an adjustment and a condition', () => {
  const p = accountFactorProblems(config([factor('a', 'plus', '', [])]), questions());
  assert.ok(p.byKey.has('a:adjustment') && p.byKey.has('a:conditions'));
  const unnamed = { ...goodFactor(), name: ' ' };
  assert.ok(accountFactorProblems(config([unnamed]), questions('product:q1')).byKey.has('a:name'));
});

test('a condition on a missing, untagged or unfinished question is an error', () => {
  const gone = accountFactorProblems(config([factor('a', 'plus', '0.2', [cond('1', 'product:gone')])]), questions());
  assert.ok(gone.byKey.has('a:1'));
  const untagged = new Map([['product:q1', { ref: 'product:q1', type: 'yesno', options: [], tagged: false }]]);
  assert.ok(accountFactorProblems(config([goodFactor()]), untagged).byKey.has('a:1'));
  const unfinished = factor('a', 'plus', '0.2', [{ id: '1', ref: 'product:q1', op: 'is', value: '', value2: '' }]);
  assert.ok(accountFactorProblems(config([unfinished]), questions('product:q1')).byKey.has('a:1'));
  assert.deepEqual(owners(accountFactorProblems(config([goodFactor()]), questions('product:q1'))), []);
});

test('Account-Level Factor is optional: no factors, no issues', () => {
  assert.deepEqual(accountFactorIssues({ components: [], questions: [] }, []), []);
  assert.deepEqual(accountFactorIssues({ components: [], questions: [], accountFactor: blankAccountFactor() }, []), []);
});

// ---- questions: the existing question system, not a new one ----
const account = { eligibility: false, rating: false, account: true };
const version = () => ({
  questions: [
    { id: 'pq', label: 'Prior losses', type: 'yesno', options: [], uses: { ...account } },
    { id: 'pq2', label: 'Other', type: 'yesno', options: [] },
  ],
  components: [{ id: 'c', name: 'C', classes: [{ id: 'k', name: 'K', coverages: [
    { id: 'cov1', name: 'Cov', questions: [{ id: 'cq', label: 'Fleet size', type: 'number', options: [], uses: { ...account } }], forms: [{ formId: 'f1', excluded: [] }], formUses: { 'f1:fq': { ...account } } },
  ] }] }],
});
const forms = [{ id: 'f1', name: 'Form', sections: [{ questions: [{ id: 'fq', label: 'Years in business', type: 'number', options: [] }] }] }];

test('questions ticked as account-level factors are found by stable reference', () => {
  const found = accountQuestions(version(), forms);
  assert.equal(found.get('product:pq').tagged, true);
  assert.equal(found.get('product:pq2').tagged, false);
  assert.equal(found.get('coverage:cq').tagged, true);
  assert.equal(found.get('form:f1:fq').tagged, true);
});

test('question keys become references that do not depend on coverage ids', () => {
  assert.equal(refOfKey('p:abc'), 'product:abc');
  assert.equal(refOfKey('c:cov1:abc'), 'coverage:abc');
  assert.equal(refOfKey('f:cov1:f1:fq'), 'form:f1:fq');
});

// ---- formula integration ----
const withAccount = () => ({ ...version(), accountFactor: config([goodFactor(), factor('b', 'minus', '0.1', [cond('2', 'product:pq')])]) });

test('the formula gets one consolidated Account-Level Factor, not one per adjustment', () => {
  const v = withAccount();
  const available = factorsFor(v, v.components[0].classes[0].coverages[0], forms);
  assert.deepEqual([...available.keys()], [ACCOUNT_CODE.toLowerCase()]);
  assert.equal(available.get('accountfactor').account, true);
});

test('a formula can use AccountFactor next to BaseRate', () => {
  const v = withAccount();
  const cov = v.components[0].classes[0].coverages[0];
  cov.formula = { expression: 'BaseRate * AccountFactor' };
  const p = formulaProblems(cov, factorsFor(v, cov, forms));
  assert.deepEqual(p.errors, []);
  assert.equal(p.empty, false);
  assert.deepEqual(formulaIssues(v, forms), []);
});

test('a formula can use AccountFactor together with a regular rating factor', () => {
  const v = withAccount();
  v.questions[1].factors = [{ id: 'rf', name: 'Other', code: 'OTHER', mode: 'choice', byAnswer: [{ id: 'r', answer: 'Yes', value: '1.10' }], bands: [], fallback: '1.00' }];
  const cov = v.components[0].classes[0].coverages[0];
  cov.formula = { expression: 'BaseRate * OTHER * AccountFactor' };
  const available = factorsFor(v, cov, forms);
  assert.deepEqual([...available.keys()].sort(), ['accountfactor', 'other']);
  assert.deepEqual(formulaProblems(cov, available).errors, []);
});

test('AccountFactor is not available until at least one factor is set up', () => {
  const v = { ...version(), accountFactor: blankAccountFactor() };
  const cov = v.components[0].classes[0].coverages[0];
  cov.formula = { expression: 'BaseRate * AccountFactor' };
  assert.equal(isConfigured(v.accountFactor), false);
  const p = formulaProblems(cov, factorsFor(v, cov, forms));
  assert.ok(p.errors[0].includes('Account-Level Factor'));
});

test('a regular rating factor cannot take the AccountFactor code', () => {
  const entry = { kind: 'choice', answers: ['Yes'] };
  const f = { id: 'f', name: 'x', code: 'AccountFactor', mode: 'choice', byAnswer: [{ id: 'r', answer: 'Yes', value: '1.00' }], fallback: '1.00' };
  assert.ok(factorProblems(entry, f, new Map([['accountfactor', 1]])).byId.get('code').some((m) => m.level === 'error'));
});

// ---- persistence ----
test('copying a version keeps account-level factors and follows renamed product questions', async () => {
  const from = { ...withAccount(), label: '2026.01', createdAt: '2026-01-01' };
  from.accountFactor.factors[0].conditions[0].ref = 'product:pq';
  const api = () => ({ create: async (data) => ({ id: 'new', ...data }) });
  const existing = [{ productRef: 'prod', label: '2026.01', status: 'Published', createdAt: '2026-01-01' }];
  const { version: copy } = await startNextVersion(api, 'prod', existing, from);
  const newId = copy.questions.find((q) => q.label === 'Prior losses').id;
  assert.notEqual(newId, 'pq');
  assert.equal(copy.accountFactor.factors[0].conditions[0].ref, `product:${newId}`);
  assert.equal(from.accountFactor.factors[0].conditions[0].ref, 'product:pq', 'the source version is not changed');
  assert.equal(copy.accountFactor.min, '0.80');
  assert.equal(copy.accountFactor.factors.length, 2);
});

test('remapQuestionRefs leaves coverage and form references alone', () => {
  const a = config([factor('a', 'plus', '0.1', [cond('1', 'coverage:cq'), cond('2', 'form:f1:fq'), cond('3', 'product:old')])]);
  remapQuestionRefs([], a, new Map([['old', 'fresh']]));
  assert.deepEqual(a.factors[0].conditions.map((c) => c.ref), ['coverage:cq', 'form:f1:fq', 'product:fresh']);
});

test('a version saved before account-level factors existed still works', async () => {
  const old = version();
  assert.equal(old.accountFactor, undefined);
  assert.deepEqual(accountFactorIssues(old, forms), []);
  assert.equal(computeAccountFactor(old.accountFactor, new Map(), {}).value, 1);
  const api = () => ({ create: async (d) => ({ id: 'n', ...d }) });
  const { version: copy } = await startNextVersion(api, 'p', [], { ...old, label: '1', createdAt: 'x' });
  assert.equal(copy.accountFactor, null);
});
