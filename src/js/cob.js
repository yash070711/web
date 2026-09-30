import { api } from './api.js';
import { esc, renderPreviewSection, renderInstance, numberInstances } from './form-render.js';

const cobs = api('class_of_business');
const acordForms = api('acord_forms');
const root = document.getElementById('view-cob');

const allQuestions = (f) => f.sections.flatMap((s) => s.questions);

let list = [];
let forms = [];
let draft = null; // COB being edited; null = list view
let error = '';
const PAGE_SIZE = 5;
let picker = { q: '', filter: 'all', page: 1, open: new Set() };
let view = null; // { cob, forms: [filtered forms], active }

const attachment = (formId) => draft.forms.find((a) => a.formId === formId);
const includedCount = (f) => {
  const a = attachment(f.id);
  return allQuestions(f).filter((q) => !a.excluded.includes(q.id)).length;
};

const LIST_PAGE_SIZE = 8;
let lv = { q: '', filter: 'all', form: '', page: 1 };

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
        <td class="ac-list-actions"><button class="btn sm" data-act="view" data-id="${c.id}">Preview</button><button class="btn sm" data-act="edit" data-id="${c.id}">Edit</button><button class="btn sm" data-act="delete" data-id="${c.id}">Delete</button></td>
      </tr>`).join('')
    : `<tr><td colspan="5" class="ac-empty">${list.length ? 'No classes of business match your search.' : 'No classes of business yet.'}</td></tr>`;
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
        <thead><tr><th>Class of business</th><th>Acord forms</th><th>Forms</th><th>Fields</th><th></th></tr></thead>
        <tbody id="cob-rows"></tbody>
      </table></div>
      <div class="cob-pager" id="cob-pager"></div>
    </section>`;
  renderListBody();
}

const resetPicker = () => { picker = { q: '', filter: 'all', page: 1, open: new Set() }; };

function filteredForms() {
  const q = picker.q.trim().toLowerCase();
  return forms.filter((f) => {
    const on = !!attachment(f.id);
    if (picker.filter === 'selected' && !on) return false;
    if (picker.filter === 'unselected' && on) return false;
    return !q || `${f.name} ${f.description || ''} ${f.status}`.toLowerCase().includes(q);
  });
}

function renderFormRow(f) {
  const a = attachment(f.id);
  const total = allQuestions(f).length;
  const open = a && picker.open.has(f.id);
  return `
    <div class="cob-row${a ? ' on' : ''}" data-form="${f.id}">
      <div class="cob-row-main">
        <input type="checkbox" data-attach aria-label="Add ${esc(f.name)}"${a ? ' checked' : ''}>
        <div class="cob-row-info">
          <div class="cob-row-name">${esc(f.name)} <span class="badge draft">${esc(f.status)}</span></div>
          <div class="ac-hint">${f.sections.length} section${f.sections.length === 1 ? '' : 's'} · <span data-count>${a ? `${includedCount(f)} of ${total} fields included` : `${total} fields`}</span></div>
        </div>
        ${a ? `<button type="button" class="btn sm" data-act="toggle-open" data-id="${f.id}">${open ? 'Hide fields' : 'Customize fields'}</button>` : ''}
      </div>
      ${open ? `<div class="cob-fields">
        <div class="cob-fields-tools"><button type="button" class="ac-icon" data-act="fields-all" data-id="${f.id}">Select all</button><button type="button" class="ac-icon" data-act="fields-none" data-id="${f.id}">Clear all</button></div>
        ${f.sections.map((s) => `<div class="cob-sec"><div class="cob-sec-title">${esc(s.title)}</div>
          <div class="cob-sec-fields">${s.questions.map((q) => `<label class="ac-choice"><input type="checkbox" data-field="${q.id}"${a.excluded.includes(q.id) ? '' : ' checked'}> ${esc(q.label)}</label>`).join('')}</div></div>`).join('')}
      </div>` : ''}
    </div>`;
}

function renderPicker() {
  const rows = filteredForms();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  picker.page = Math.min(picker.page, pages);
  const start = (picker.page - 1) * PAGE_SIZE;
  root.querySelector('#picker-summary').textContent = `${draft.forms.length} of ${forms.length} selected`;
  root.querySelector('#picker-list').innerHTML = rows.length
    ? rows.slice(start, start + PAGE_SIZE).map(renderFormRow).join('')
    : '<div class="ac-empty">No Acord forms match your search.</div>';
  root.querySelector('#picker-pager').innerHTML = rows.length ? `
    <span class="ac-hint">Showing ${start + 1}–${Math.min(start + PAGE_SIZE, rows.length)} of ${rows.length}</span>
    <div class="cob-pages">
      <button type="button" class="btn sm" data-act="page" data-p="${picker.page - 1}"${picker.page === 1 ? ' disabled' : ''}>Prev</button>
      ${Array.from({ length: pages }, (_, i) => `<button type="button" class="btn sm${i + 1 === picker.page ? ' dark' : ''}" data-act="page" data-p="${i + 1}">${i + 1}</button>`).join('')}
      <button type="button" class="btn sm" data-act="page" data-p="${picker.page + 1}"${picker.page === pages ? ' disabled' : ''}>Next</button>
    </div>` : '';
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
    <section class="card">
      <div class="card-header"><div><div class="card-title">Acord forms</div><div class="card-subtitle">Tick the forms that apply. Use “Customize fields” to leave out any field for this class of business.</div></div><span class="badge info" id="picker-summary"></span></div>
      <div class="toolbar">
        <input class="ac-input" id="picker-search" style="flex:1;min-width:200px;width:auto" type="search" placeholder="Search Acord forms…" value="${esc(picker.q)}">
        <select class="ac-select" id="picker-filter" style="width:170px">
          ${[['all', 'All forms'], ['selected', 'Selected'], ['unselected', 'Not selected']].map(([v, l]) => `<option value="${v}"${picker.filter === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div id="picker-list"></div>
      <div class="cob-pager" id="picker-pager"></div>
    </section>`;
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
  else if (draft) { renderEditor(); renderPicker(); } else renderList();
};

async function refresh() {
  [list, forms] = await Promise.all([cobs.list(), acordForms.list()]);
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
  if (!draft) return;
  if (e.target.id === 'picker-search') { picker.q = e.target.value; picker.page = 1; return renderPicker(); }
  if (e.target.dataset.top) draft[e.target.dataset.top] = e.target.value;
});

root.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'cob-filter') { lv.filter = t.value; lv.page = 1; return renderListBody(); }
  if (t.id === 'cob-form') { lv.form = t.value; lv.page = 1; return renderListBody(); }
  if (draft && t.id === 'picker-filter') { picker.filter = t.value; picker.page = 1; return renderPicker(); }
  const card = t.closest('[data-form]');
  if (!draft || !card) return;
  const f = forms.find((x) => x.id === card.dataset.form);
  if (t.hasAttribute('data-attach')) {
    if (t.checked) draft.forms.push({ formId: f.id, excluded: [] });
    else draft.forms = draft.forms.filter((a) => a.formId !== f.id);
    if (!t.checked) picker.open.delete(f.id);
    renderPicker();
  } else if (t.dataset.field) {
    const a = attachment(f.id);
    a.excluded = t.checked ? a.excluded.filter((id) => id !== t.dataset.field) : [...a.excluded, t.dataset.field];
    card.querySelector('[data-count]').textContent = `${includedCount(f)} of ${allQuestions(f).length} fields included`;
  }
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
  if (draft && ['toggle-open', 'fields-all', 'fields-none', 'page'].includes(act)) {
    const f = forms.find((x) => x.id === btn.dataset.id);
    if (act === 'toggle-open') picker.open.has(f.id) ? picker.open.delete(f.id) : picker.open.add(f.id);
    else if (act === 'fields-all') attachment(f.id).excluded = [];
    else if (act === 'fields-none') attachment(f.id).excluded = allQuestions(f).map((q) => q.id);
    else picker.page = +btn.dataset.p;
    return renderPicker();
  }
  switch (act) {
    case 'view': view = { cob, active: 0, forms: cob.forms.map((a) => {
      const f = forms.find((x) => x.id === a.formId);
      if (!f) return null;
      return { ...f, sections: f.sections.map((s) => ({ ...s, questions: s.questions.filter((q) => !a.excluded.includes(q.id)) })).filter((s) => s.questions.length) };
    }).filter(Boolean) }; break;
    case 'ftab': view.active = +btn.dataset.i; break;
    case 'new': resetPicker(); draft = { name: '', description: '', forms: [] }; error = ''; break;
    case 'edit': resetPicker(); draft = structuredClone(cob); error = ''; break;
    case 'delete': if (confirm('Delete this class of business?')) { await cobs.remove(cob.id); return refresh(); } return;
    case 'back': return refresh();
    case 'save': return save();
    default: return;
  }
  render();
});

refresh();
