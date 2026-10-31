import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyCoverage, coverageIssues, hydrateCoverage, DOCUMENT_GROUPS, ALL_DOCUMENTS, documentLabel } from '../public/js/product-model.js';

const cov = (required) => {
  const c = emptyCoverage({ id: 'lib', name: 'GL', configOptions: [{ key: 'documents', required }] });
  c.party = 'First party';
  return c;
};

test('document keys are unique and every document has a label', () => {
  const keys = ALL_DOCUMENTS.map((d) => d.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(DOCUMENT_GROUPS.every((g) => g.docs.length && g.docs.every(([k, l]) => k && l)));
});

test('an optional documents section never blocks, a required one needs a document', () => {
  assert.deepEqual(coverageIssues(cov(false)), []);
  assert.deepEqual(coverageIssues(cov(true)), ['documents required']);
  const c = cov(true);
  c.documents.push({ key: 'loss-runs', required: true });
  assert.deepEqual(coverageIssues(c), []);
});

test('an added document needs a name', () => {
  const c = cov(false);
  c.documents.push({ key: 'custom-1', name: '  ', required: true });
  assert.deepEqual(coverageIssues(c), ['documents required']);
  c.documents[0].name = 'Franchise agreement';
  assert.deepEqual(coverageIssues(c), []);
  assert.equal(documentLabel(c.documents[0]), 'Franchise agreement');
});

test('older coverages get an empty document list', () => {
  const old = { id: 'x', coverageId: 'lib', name: 'GL' };
  hydrateCoverage(old, { id: 'lib', name: 'GL' });
  assert.deepEqual(old.documents, []);
});
