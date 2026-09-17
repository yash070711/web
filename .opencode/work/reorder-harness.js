const fs = require('fs');
const vm = require('vm');

const app = fs.readFileSync('public/ps/assets/prototype-app.js', 'utf8');
const start = app.indexOf('const legacyReorderModal = window.openReorderModal;');
const end = app.indexOf('window.importSelectedLibraryItems = function () {');
if (start < 0 || end < 0) throw new Error('markers not found');
const block = app.slice(start, end);

const COVERS = [
  { id: 'COV-001', name: 'Own Damage' },
  { id: 'COV-002', name: 'Third Party Liability' },
  { id: 'COV-003', name: 'Motor Truck Cargo' }
];

const storage = {};
let rows = [];

const listObj = {
  insertBefore(node, ref) {
    const from = rows.indexOf(node);
    if (from >= 0) rows.splice(from, 1);
    const i = rows.indexOf(ref);
    if (i < 0) return;
    rows.splice(i, 0, node);
    link();
  }
};

function link() {
  rows.forEach((r, k) => {
    r.nextElementSibling = rows[k + 1] || null;
    r.previousElementSibling = rows[k - 1] || null;
    r.parentElement = listObj;
  });
}

function makeRow(cover) {
  const row = {
    dataset: { coverId: cover.id },
    style: {},
    listeners: {},
    addEventListener(ev, fn) { this.listeners[ev] = fn; },
    appendChild() {},
    previousElementSibling: null,
    nextElementSibling: null,
    parentElement: listObj
  };
  return row;
}

const sandbox = {
  console,
  localStorage: {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); }
  },
  context: () => ({ productId: 'PRD-015' }),
  persistCollection: () => {},
  COVERS,
  PS: { closeModal() {} },
  renderCoverTable: () => {},
  renderCoverList: () => {},
  showResult: () => {},
  document: {
    createElement(tag) {
      const el = {
        tag,
        style: {},
        dataset: {},
        children: [],
        innerHTML: '',
        addEventListener() {},
        appendChild(c) { this.children.push(c); },
        querySelectorAll() { return []; }
      };
      const html = '<button class="btn btn-icon btn-sm" type="button" aria-label="Move up">\u2191</button><button class="btn btn-icon btn-sm" type="button" aria-label="Move down">\u2193</button>';
      el.querySelectorAll = () => Array.from(el.innerHTML.matchAll(/<button/g)).map(() => ({ onclick: null }));
      el.innerHTML = html;
      return el;
    },
    querySelectorAll(sel) { return sel === '#reorder-list > div' ? rows.slice() : []; }
  }
};
sandbox.window = sandbox;
sandbox.openReorderModal = function legacyReorderModal() {
  rows = COVERS.map(makeRow);
  link();
};
vm.createContext(sandbox);
vm.runInContext(block, sandbox);
const win = sandbox.window;
if (typeof win.openReorderModal !== 'function' || typeof win.saveCoverOrder !== 'function') {
  throw new Error('functions not installed');
}

rows = COVERS.map(makeRow);
link();
win.openReorderModal();

function fire(row, ev, e) {
  const fn = row.listeners && row.listeners[ev];
  if (fn) fn(e);
}

fire(rows[0], 'dragstart', { dataTransfer: { effectAllowed: '', setData() {}, types: ['text/plain'] } });
fire(rows[2], 'dragover', { preventDefault() {} });
fire(rows[2], 'drop', { preventDefault() {} });

win.saveCoverOrder();

const assert = (cond, msg) => { if (!cond) throw new Error('ASSERT FAILED: ' + msg); console.log('ok - ' + msg); };
assert(COVERS[0].id === 'COV-002', 'drag moved COV-002 to top -> ' + COVERS.map(c => c.id).join(','));
assert(storage['ps-cover-order-custom-PRD-015'] === '1', 'custom-order flag persisted');

const html = fs.readFileSync('public/ps/coverage-studio.html', 'utf8');
const f = html.indexOf('function coverReorderCustomized');
const g = html.indexOf('function isTruckingCoverageProduct');
const sandbox2 = {
  localStorage: { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
  productId: 'PRD-015',
  TRUCKING_DEFAULT_COVER_CATALOG: [],
  COVERS
};
vm.createContext(sandbox2);
vm.runInContext(html.slice(f, g), sandbox2);

assert(sandbox2.coverReorderCustomized() === true, 'coverReorderCustomized() reads flag');
assert(sandbox2.sortedCoversForSidebar().map(c => c.id).join(',') === COVERS.map(c => c.id).join(','), 'sidebar uses saved order when flag set');

delete storage['ps-cover-order-custom-PRD-015'];
assert(sandbox2.coverReorderCustomized() === false, 'flag clears');

console.log('ALL PASS');