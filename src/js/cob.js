import { api } from './api.js';
import { esc } from './form-render.js';

const cobs = api('class_of_business');
const coverageApi = api('coverages');
const root = document.getElementById('view-cob');

const PAGE_SIZE = 8;

let list = [];
let coverages = [];
let editingId = null;
const lv = { q: '', filter: 'all', page: 1 };

const coverageCount = (cob) => coverages.filter((r) => (r.classOfBusiness || []).includes(cob.id)).length;

function filteredList() {
  const q = lv.q.trim().toLowerCase();
  return list.filter((c) => {
    const n = coverageCount(c);
    if (lv.filter === 'used' && !n) return false;
    if (lv.filter === 'unused' && n) return false;
    return !q || `${c.name} ${c.description || ''}`.toLowerCase().includes(q);
  });
}

function renderListBody() {
  const rows = filteredList();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  lv.page = Math.min(lv.page, pages);
  const start = (lv.page - 1) * PAGE_SIZE;
  root.querySelector('#cob-count').textContent = `${rows.length} of ${list.length}`;
  root.querySelector('#cob-rows').innerHTML = rows.length
    ? rows.slice(start, start + PAGE_SIZE).map((c) => `
      <tr>
        <td><div class="cob-name">${esc(c.name)}</div></td>
        <td>${esc(c.description) || '<span class="ac-hint">No description</span>'}</td>
        <td>${coverageCount(c)}</td>
        <td class="ac-list-actions"><button class="btn sm" data-act="edit" data-id="${esc(c.id)}">Edit</button><button class="btn sm" data-act="delete" data-id="${esc(c.id)}">Delete</button></td>
      </tr>`).join('')
    : `<tr><td colspan="4" class="ac-empty">${list.length ? 'No classes of business match your search.' : 'No classes of business yet.'}</td></tr>`;
  root.querySelector('#cob-pager').innerHTML = rows.length ? `
    <span class="ac-hint">Showing ${start + 1}–${Math.min(start + PAGE_SIZE, rows.length)} of ${rows.length}</span>
    <div class="cob-pages">
      <button type="button" class="btn sm" data-act="lpage" data-p="${lv.page - 1}"${lv.page === 1 ? ' disabled' : ''}>Prev</button>
      ${Array.from({ length: pages }, (_, i) => `<button type="button" class="btn sm${i + 1 === lv.page ? ' dark' : ''}" data-act="lpage" data-p="${i + 1}">${i + 1}</button>`).join('')}
      <button type="button" class="btn sm" data-act="lpage" data-p="${lv.page + 1}"${lv.page === pages ? ' disabled' : ''}>Next</button>
    </div>` : '';
}

function render() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Class of Business</div>
    <div class="page-header">
      <div><div class="eyebrow">Configuration</div><h1>Class of Business</h1><p>Classes of business that coverages are grouped under.</p></div>
      <div class="tools"><button class="btn primary" data-act="new">+ Create Class of Business</button></div>
    </div>
    <section class="card">
      <div class="card-header"><div class="card-title">All classes of business</div><span class="badge info" id="cob-count"></span></div>
      <div class="toolbar">
        <input class="ac-input" id="cob-search" style="flex:1;min-width:200px;width:auto" type="search" placeholder="Search by name or description…" value="${esc(lv.q)}">
        <select class="ac-select" id="cob-filter" style="width:190px">
          ${[['all', 'All'], ['used', 'Used by coverages'], ['unused', 'Not used']].map(([v, l]) => `<option value="${v}"${lv.filter === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Class of business</th><th>Description</th><th>Coverages</th><th></th></tr></thead>
        <tbody id="cob-rows"></tbody>
      </table></div>
      <div class="cob-pager" id="cob-pager"></div>
    </section>
    <dialog class="modal" id="cob-dialog" aria-labelledby="cob-dialog-title">
      <form id="cob-add-form" novalidate>
        <div class="modal-head">
          <div><div class="modal-title" id="cob-dialog-title">Add Class of Business</div></div>
          <button type="button" class="icon-btn" data-act="dialog-cancel" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label for="cob-name">Name <span class="req">*</span></label>
            <input class="input" id="cob-name" name="name" maxlength="80" autocomplete="off" placeholder="e.g. Trucking">
            <div class="err" data-err></div>
          </div>
          <div class="field">
            <label for="cob-desc">Description</label>
            <textarea class="input" id="cob-desc" name="description" rows="3" maxlength="300" placeholder="What this class of business covers"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <div class="tools">
            <button type="button" class="btn" data-act="dialog-cancel">Cancel</button>
            <button type="submit" class="btn primary" id="cob-submit">Add</button>
          </div>
        </div>
      </form>
    </dialog>`;
  renderListBody();
}

function openDialog(cob) {
  editingId = cob?.id ?? null;
  const form = root.querySelector('#cob-add-form');
  form.reset();
  form.querySelector('[data-err]').textContent = '';
  form.elements.name.classList.remove('invalid');
  root.querySelector('#cob-dialog-title').textContent = cob ? 'Edit Class of Business' : 'Add Class of Business';
  root.querySelector('#cob-submit').textContent = cob ? 'Save' : 'Add';
  form.elements.name.value = cob?.name ?? '';
  form.elements.description.value = cob?.description ?? '';
  root.querySelector('#cob-dialog').showModal();
  form.elements.name.focus();
}

async function refresh() {
  [list, coverages] = await Promise.all([cobs.list(), coverageApi.list()]);
  render();
}

root.addEventListener('submit', async (e) => {
  if (e.target.id !== 'cob-add-form') return;
  e.preventDefault();
  const form = e.target;
  const name = form.elements.name.value.trim();
  const fail = (msg) => {
    form.querySelector('[data-err]').textContent = msg;
    form.elements.name.classList.add('invalid');
  };
  if (!name) return fail('Name is required.');
  if (list.some((c) => c.id !== editingId && c.name.toLowerCase() === name.toLowerCase())) return fail(`“${name}” already exists.`);
  const data = { name, description: form.elements.description.value.trim() };
  root.querySelector('#cob-submit').disabled = true;
  try {
    if (editingId) await cobs.update(editingId, data);
    else await cobs.create({ ...data, forms: [] });
    await refresh();
  } catch (err) {
    fail(err.message);
    root.querySelector('#cob-submit').disabled = false;
  }
});

root.addEventListener('input', (e) => {
  if (e.target.id !== 'cob-search') return;
  lv.q = e.target.value;
  lv.page = 1;
  renderListBody();
});

root.addEventListener('change', (e) => {
  if (e.target.id !== 'cob-filter') return;
  lv.filter = e.target.value;
  lv.page = 1;
  renderListBody();
});

root.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const cob = list.find((c) => c.id === btn.dataset.id);
  switch (btn.dataset.act) {
    case 'new': return openDialog(null);
    case 'edit': return openDialog(cob);
    case 'dialog-cancel': return root.querySelector('#cob-dialog').close();
    case 'lpage': lv.page = +btn.dataset.p; return renderListBody();
    case 'delete': {
      const n = coverageCount(cob);
      if (n) { alert(`“${cob.name}” is used by ${n} coverage${n === 1 ? '' : 's'}. Reassign or delete those coverages first.`); return; }
      if (confirm('Delete this class of business?')) { await cobs.remove(cob.id); await refresh(); }
      return;
    }
    default:
  }
});

refresh();
