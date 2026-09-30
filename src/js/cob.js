import { api } from './api.js';
import { esc, renderPreviewSection, renderInstance, numberInstances } from './form-render.js';
import { openBuilder } from './form-builder.js';
import { createFormPicker } from './form-picker.js';

const cobs = api('class_of_business');
const acordForms = api('acord_forms');
const coverageApi = api('coverages');
const root = document.getElementById('view-cob');

const allQuestions = (f) => f.sections.flatMap((s) => s.questions);

let list = [];
let forms = [];
let coverages = [];
let draft = null; // COB being edited; null = list view
let error = '';
let view = null; // { cob, forms: [filtered forms], active }

const attachment = (formId) => draft.forms.find((a) => a.formId === formId);

const LIST_PAGE_SIZE = 8;
let lv = { q: '', filter: 'all', form: '', page: 1 };

const coverageCount = (cob) => coverages.filter((r) => (r.classOfBusiness || []).includes(cob.id)).length;
const formName = (id) => forms.find((f) => f.id === id)?.name || 'Deleted form';
const fieldTotals = (cob) => cob.forms.reduce((n, a) => {
  const f = forms.find((x) => x.id === a.formId);
  return f ? n + allQuestions(f).filter((q) => !a.excluded.includes(q.id)).length : n;
}, 0);

function filteredList() {
  const q = lv.q.trim().toLowerCase();
  return list.filter((c) => {
    if (lv.filter === 'with' && !c.forms.length) return false;
    if (lv.filter === 'without' && c.forms.length) return false;
    if (lv.form && !c.forms.some((a) => a.formId === lv.form)) return false;
    return !q || `${c.name} ${c.description || ''} ${c.forms.map((a) => formName(a.formId)).join(' ')}`.toLowerCase().includes(q);
  });
}

function renderListBody() {
  const rows = filteredList();
  const pages = Math.max(1, Math.ceil(rows.length / LIST_PAGE_SIZE));
  lv.page = Math.min(lv.page, pages);
  const start = (lv.page - 1) * LIST_PAGE_SIZE;
  root.querySelector('#cob-count').textContent = `${rows.length} of ${list.length}`;
  root.querySelector('#cob-rows').innerHTML = rows.length
    ? rows.slice(start, start + LIST_PAGE_SIZE).map((c) => `
      <tr>
        <td><div class="cob-name">${esc(c.name)}</div><div class="ac-hint">${esc(c.description) || 'No description'}</div></td>
        <td>${c.forms.length ? `${c.forms.slice(0, 2).map((a) => `<span class="badge info" style="margin:0 4px 4px 0">${esc(formName(a.formId))}</span>`).join('')}${c.forms.length > 2 ? `<span class="badge draft" title="${esc(c.forms.slice(2).map((a) => formName(a.formId)).join(', '))}">+${c.forms.length - 2} more</span>` : ''}` : '<span class="ac-hint">None</span>'}</td>
        <td>${c.forms.length}</td>
        <td>${fieldTotals(c)}</td>
        <td>${coverageCount(c)}</td>
        <td class="ac-list-actions"><button class="btn sm" data-act="view" data-id="${c.id}">Preview</button><button class="btn sm" data-act="edit" data-id="${c.id}">Edit</button><button class="btn sm" data-act="delete" data-id="${c.id}">Delete</button></td>
      </tr>`).join('')
    : `<tr><td colspan="6" class="ac-empty">${list.length ? 'No classes of business match your search.' : 'No classes of business yet.'}</td></tr>`;
  root.querySelector('#cob-pager').innerHTML = rows.length ? `
    <span class="ac-hint">Showing ${start + 1}–${Math.min(start + LIST_PAGE_SIZE, rows.length)} of ${rows.length}</span>
    <div class="cob-pages">
      <button type="button" class="btn sm" data-act="lpage" data-p="${lv.page - 1}"${lv.page === 1 ? ' disabled' : ''}>Prev</button>
      ${Array.from({ length: pages }, (_, i) => `<button type="button" class="btn sm${i + 1 === lv.page ? ' dark' : ''}" data-act="lpage" data-p="${i + 1}">${i + 1}</button>`).join('')}
      <button type="button" class="btn sm" data-act="lpage" data-p="${lv.page + 1}"${lv.page === pages ? ' disabled' : ''}>Next</button>
    </div>` : '';
}

function renderList() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Class of Business</div>
    <div class="page-header">
      <div><div class="eyebrow">Configuration</div><h1>Class of Business</h1><p>Group Acord forms under a class of business and choose which fields apply.</p></div>
      <div class="tools"><button class="btn primary" data-act="new">+ Create Class of Business</button></div>
    </div>
    <section class="card">
      <div class="card-header"><div class="card-title">All classes of business</div><span class="badge info" id="cob-count"></span></div>
      <div class="toolbar">
        <input class="ac-input" id="cob-search" style="flex:1;min-width:200px;width:auto" type="search" placeholder="Search by name, description or form…" value="${esc(lv.q)}">
        <select class="ac-select" id="cob-filter" style="width:170px">
          ${[['all', 'All'], ['with', 'With Acord forms'], ['without', 'No Acord forms']].map(([v, l]) => `<option value="${v}"${lv.filter === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
        <select class="ac-select" id="cob-form" style="width:200px">
          <option value="">Any Acord form</option>
          ${forms.map((f) => `<option value="${f.id}"${lv.form === f.id ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}
        </select>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Class of business</th><th>Acord forms</th><th>Forms</th><th>Fields</th><th>Coverages</th><th></th></tr></thead>
        <tbody id="cob-rows"></tbody>
      </table></div>
      <div class="cob-pager" id="cob-pager"></div>
    </section>`;
  renderListBody();
}

function editForm(existing) {
  const usedBy = existing ? list.filter((c) => c.id !== draft.id && c.forms.some((a) => a.formId === existing.id)).length : 0;
  openBuilder({
    form: existing,
    returnTo: root,
    notice: existing ? `Changes to this form apply everywhere it is used${usedBy ? ` (also attached to ${usedBy} other class${usedBy === 1 ? '' : 'es'} of business)` : ''}.` : '',
    onSaved: async (saved) => {
      forms = await acordForms.list();
      if (!existing && !attachment(saved.id)) draft.forms.push({ formId: saved.id, excluded: [] });
    },
    onExit: render,
  });
}

function mountPicker() {
  createFormPicker(root.querySelector('#picker-host'), {
    forms,
    selected: draft.forms,
    onCreateForm: () => editForm(null),
    onEditForm: (f) => editForm(f),
  }).render();
}

function renderEditor() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Class of Business / ${draft.id ? 'Edit' : 'New'}</div>
    <div class="page-header">
      <div><div class="eyebrow">Class of Business</div><h1>${draft.id ? 'Edit Class of Business' : 'New Class of Business'}</h1></div>
      <div class="tools"><button class="btn" data-act="back">Cancel</button><button class="btn primary" data-act="save">Save</button></div>
    </div>
    ${error ? `<div class="notice" style="margin:0 0 14px">${esc(error)}</div>` : ''}
    <section class="card" style="margin-bottom:16px">
      <div class="ac-field"><label>Name<span class="req">*</span></label><input class="ac-input" data-top="name" value="${esc(draft.name)}"></div>
      <div class="ac-field" style="margin:0"><label>Description</label><textarea class="ac-textarea" data-top="description">${esc(draft.description)}</textarea></div>
    </section>
    <section class="card" id="picker-host"></section>`;
  mountPicker();
}

function renderPreview() {
  const { cob, forms: fs, active } = view;
  const f = fs[active];
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Class of Business / ${esc(cob.name)} / Preview</div>
    <div class="page-header">
      <div><div class="eyebrow">Preview</div><h1>${esc(cob.name)}</h1><p>${esc(cob.description)}</p></div>
      <div class="tools"><button class="btn" data-act="back">Back</button></div>
    </div>
    ${fs.length ? `<div class="studio-nav" role="tablist">${fs.map((x, i) => `<button role="tab" aria-selected="${i === active}" class="${i === active ? 'active' : ''}" data-act="ftab" data-i="${i}">${esc(x.name)}</button>`).join('')}</div>
    <form onsubmit="return false">${f.sections.map((s, i) => renderPreviewSection(s, i)).join('')}</form>`
      : '<section class="card"><div class="ac-empty">No Acord forms attached to this class of business.</div></section>'}`;
  if (fs.length) root.querySelectorAll('.ac-repeat').forEach((el) => numberInstances(el, f.sections));
}

const render = () => {
  if (view) renderPreview();
  else if (draft) renderEditor();
  else renderList();
};

async function refresh() {
  [list, forms, coverages] = await Promise.all([cobs.list(), acordForms.list(), coverageApi.list()]);
  draft = null;
  view = null;
  render();
}

async function save() {
  if (!draft.name.trim()) { error = 'Name is required.'; render(); return; }
  error = '';
  const data = { name: draft.name.trim(), description: draft.description, forms: draft.forms };
  if (draft.id) await cobs.update(draft.id, data);
  else await cobs.create(data);
  await refresh();
}

root.addEventListener('input', (e) => {
  if (e.target.id === 'cob-search') { lv.q = e.target.value; lv.page = 1; return renderListBody(); }
  if (draft && e.target.dataset.top) draft[e.target.dataset.top] = e.target.value;
});

root.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'cob-filter') { lv.filter = t.value; lv.page = 1; return renderListBody(); }
  if (t.id === 'cob-form') { lv.form = t.value; lv.page = 1; return renderListBody(); }
});

root.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const cob = list.find((c) => c.id === btn.dataset.id);
  const act = btn.dataset.act;
  if (act === 'inst-add' || act === 'inst-del') {
    const sec = btn.closest('.ac-repeat');
    const sections = view.forms[view.active].sections;
    if (act === 'inst-add') sec.querySelector('.ac-instances').insertAdjacentHTML('beforeend', renderInstance(sections[sec.dataset.si], true));
    else btn.closest('.ac-instance').remove();
    return numberInstances(sec, sections);
  }
  if (act === 'lpage') { lv.page = +btn.dataset.p; return renderListBody(); }
  switch (act) {
    case 'view': view = { cob, active: 0, forms: cob.forms.map((a) => {
      const f = forms.find((x) => x.id === a.formId);
      if (!f) return null;
      return { ...f, sections: f.sections.map((s) => ({ ...s, questions: s.questions.filter((q) => !a.excluded.includes(q.id)) })).filter((s) => s.questions.length) };
    }).filter(Boolean) }; break;
    case 'ftab': view.active = +btn.dataset.i; break;
    case 'new': draft = { name: '', description: '', forms: [] }; error = ''; break;
    case 'edit': draft = structuredClone(cob); error = ''; break;
    case 'delete': {
      const n = coverageCount(cob);
      if (n) { alert(`“${cob.name}” is used by ${n} coverage${n === 1 ? '' : 's'}. Reassign or delete those coverages first.`); return; }
      if (confirm('Delete this class of business?')) { await cobs.remove(cob.id); return refresh(); }
      return;
    }
    case 'back': return refresh();
    case 'save': return save();
    default: return;
  }
  render();
});

refresh();
