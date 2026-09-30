import { api } from './api.js';
import { esc, renderPreviewSection, renderInstance, numberInstances } from './form-render.js';

const forms = api('acord_forms');
const root = document.getElementById('view-acord');

const TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'date', label: 'Date' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'radio', label: 'Multiple choice (one answer)' },
  { value: 'checkboxes', label: 'Checkboxes (many answers)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Single checkbox' },
];
const HAS_OPTIONS = ['radio', 'checkboxes', 'dropdown'];

const uid = () => Math.random().toString(36).slice(2, 9);
const newQuestion = () => ({ id: uid(), type: 'text', label: '', help: '', required: false, options: [] });
const newSection = () => ({ id: uid(), title: 'New section', columns: 1, questions: [newQuestion()] });
const blankForm = () => ({ name: '', description: '', status: 'Draft', layout: 'stacked', sections: [newSection()] });

let list = [];
let draft = null; // form being edited
let mode = 'list'; // list | edit | preview
let error = '';
let activeTab = 0;

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

/* ---------- list view ---------- */
function renderList() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Acord</div>
    <div class="page-header">
      <div><div class="eyebrow">Forms</div><h1>Acord Forms</h1><p>Build Acord forms from sections and questions of different types.</p></div>    </div>
    <section class="card"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Form</th><th>Sections</th><th>Questions</th><th>Status</th><th>Updated</th><th></th></tr></thead>
      <tbody>${list.length ? list.map((f) => `
        <tr><td><strong>${esc(f.name)}</strong></td>
        <td>${(f.sections || []).length}</td>
        <td>${(f.sections || []).reduce((n, s) => n + s.questions.length, 0)}</td>
        <td><span class="badge draft">${esc(f.status)}</span></td>
        <td>${new Date(f.updatedAt || f.createdAt).toLocaleString()}</td>
        <td class="ac-list-actions"><button class="btn sm" data-act="view" data-id="${f.id}">Preview</button></td></tr>`).join('')
        : '<tr><td colspan="6" class="ac-empty">No Acord forms yet.</td></tr>'}</tbody>
    </table></div></section>`;
}

/* ---------- editor ---------- */
const typeOptions = (sel) => TYPES.map((t) => `<option value="${t.value}"${t.value === sel ? ' selected' : ''}>${t.label}</option>`).join('');

function renderQuestion(q, qi, count) {
  return `
    <div class="ac-q" data-q="${qi}">
      <div class="ac-q-row">
        <input class="ac-input" data-f="label" placeholder="Question text" value="${esc(q.label)}">
        <select class="ac-select" data-f="type">${typeOptions(q.type)}</select>
      </div>
      <input class="ac-input" data-f="help" style="margin-top:8px" placeholder="Help text (optional)" value="${esc(q.help)}">
      ${HAS_OPTIONS.includes(q.type) ? `<div class="ac-q-options"><div class="ac-hint">Options — one per line</div>
        <textarea class="ac-textarea" data-f="options" placeholder="Option 1&#10;Option 2">${esc(q.options.join('\n'))}</textarea></div>` : ''}
      <div class="ac-q-meta">
        <label class="ac-choice"><input type="checkbox" data-f="required"${q.required ? ' checked' : ''}> Required</label>
        <span class="spacer"></span>
        <button class="ac-icon" data-act="q-up"${qi === 0 ? ' disabled' : ''}>↑</button>
        <button class="ac-icon" data-act="q-down"${qi === count - 1 ? ' disabled' : ''}>↓</button>
        <button class="ac-icon danger" data-act="q-del">Remove</button>
      </div>
    </div>`;
}

function renderEditor() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Acord / ${draft.id ? 'Edit' : 'New'} form</div>
    <div class="page-header">
      <div><div class="eyebrow">Form builder</div><h1>${draft.id ? 'Edit Acord Form' : 'New Acord Form'}</h1></div>
      <div class="tools"><button class="btn" data-act="back">Back</button><button class="btn" data-act="preview">Preview</button><button class="btn primary" data-act="save">Save Form</button></div>
    </div>
    ${error ? `<div class="notice" style="margin:0 0 14px">${esc(error)}</div>` : ''}
    <section class="card" style="margin-bottom:16px">
      <div class="ac-field"><label>Form name<span class="req">*</span></label><input class="ac-input" data-top="name" placeholder="e.g. ACORD 127 – Business Auto Section" value="${esc(draft.name)}"></div>
      <div class="ac-field"><label>Section layout</label>
        <select class="ac-select" data-top="layout" style="max-width:300px">
          <option value="stacked"${draft.layout !== 'tabs' ? ' selected' : ''}>Stacked (vertical)</option>
          <option value="tabs"${draft.layout === 'tabs' ? ' selected' : ''}>Tabs (horizontal)</option>
        </select></div>
      <div class="ac-field" style="margin:0"><label>Description</label><textarea class="ac-textarea" data-top="description">${esc(draft.description)}</textarea></div>
    </section>
    ${draft.sections.map((s, si) => `
      <section class="card ac-section" data-s="${si}">
        <div class="ac-section-head">
          <input class="ac-input" data-sf="title" placeholder="Section title" value="${esc(s.title)}">
          <select class="ac-select" data-sf="columns" style="width:130px" title="Columns in preview">
            ${[1, 2, 3, 4].map((n) => `<option value="${n}"${(s.columns || 1) === n ? ' selected' : ''}>${n} column${n > 1 ? 's' : ''}</option>`).join('')}
          </select>
          <label class="ac-choice" title="Let the user add this section multiple times"><input type="checkbox" data-sf="repeatable"${s.repeatable ? ' checked' : ''}> Repeatable</label>
          ${s.repeatable ? `<input class="ac-input" data-sf="itemLabel" style="width:110px" placeholder="Item name" value="${esc(s.itemLabel || '')}">` : ''}
          <button class="ac-icon" data-act="s-up"${si === 0 ? ' disabled' : ''}>↑</button>
          <button class="ac-icon" data-act="s-down"${si === draft.sections.length - 1 ? ' disabled' : ''}>↓</button>
          <button class="ac-icon danger" data-act="s-del"${draft.sections.length === 1 ? ' disabled' : ''}>Remove</button>
        </div>
        ${s.questions.map((q, qi) => renderQuestion(q, qi, s.questions.length)).join('')}
        <button class="btn sm" data-act="q-add">+ Add question</button>
      </section>`).join('')}
    <button class="btn" data-act="s-add">+ Add section</button>`;
}

/* ---------- preview ---------- */
function renderPreview() {
  const tabs = draft.layout === 'tabs';
  if (activeTab >= draft.sections.length) activeTab = 0;
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Acord / Preview</div>
    <div class="page-header">
      <div><div class="eyebrow">Preview</div><h1>${esc(draft.name || 'Untitled form')}</h1><p>${esc(draft.description)}</p></div>
      <div class="tools"><button class="btn" data-act="${draft.id ? 'back' : 'edit-draft'}">${draft.id ? 'Back' : 'Back to editor'}</button></div>
    </div>
    ${tabs ? `<div class="studio-nav" role="tablist">${draft.sections.map((s, i) => `<button role="tab" aria-selected="${i === activeTab}" class="${i === activeTab ? 'active' : ''}" data-act="tab" data-i="${i}">${esc(s.title || 'Untitled')}</button>`).join('')}</div>` : ''}
    <form onsubmit="return false">
      ${tabs ? renderPreviewSection(draft.sections[activeTab], activeTab) : draft.sections.map((sec, i) => renderPreviewSection(sec, i)).join('')}
    </form>`;
}

/* ---------- actions ---------- */
const render = () => {
  ({ list: renderList, edit: renderEditor, preview: renderPreview }[mode])();
  if (mode === 'preview') root.querySelectorAll('.ac-repeat').forEach((el) => numberInstances(el, draft.sections));
};

async function refresh() {
  list = await forms.list();
  mode = 'list';
  render();
}

async function save() {
  if (!draft.name.trim()) { error = 'Form name is required.'; render(); return; }
  for (const s of draft.sections) {
    s.questions = s.questions.filter((q) => q.label.trim());
    for (const q of s.questions) {
      if (HAS_OPTIONS.includes(q.type) && !q.options.length) { error = `Add options for “${q.label}”.`; render(); return; }
    }
  }
  error = '';
  const payload = { ...draft, updatedAt: new Date().toISOString() };
  if (draft.id) await forms.update(draft.id, payload);
  else await forms.create({ ...payload, createdAt: payload.updatedAt });
  await refresh();
}

root.addEventListener('input', (e) => {
  const t = e.target;
  if (mode !== 'edit') return;
  if (t.dataset.top) return void (draft[t.dataset.top] = t.value);
  const sec = t.closest('[data-s]');
  if (!sec) return;
  const s = draft.sections[sec.dataset.s];
  if (t.dataset.sf) {
    const k = t.dataset.sf;
    s[k] = k === 'columns' ? +t.value : k === 'repeatable' ? t.checked : t.value;
    if (k === 'repeatable') render();
    return;
  }
  const qEl = t.closest('.ac-q');
  if (!qEl || !t.dataset.f) return;
  const q = s.questions[qEl.dataset.q];
  const f = t.dataset.f;
  if (f === 'required') q.required = t.checked;
  else if (f === 'options') q.options = t.value.split('\n').map((o) => o.trim()).filter(Boolean);
  else q[f] = t.value;
  if (f === 'type') render();
});

root.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  const si = btn.closest('[data-s]')?.dataset.s;
  const qi = btn.closest('.ac-q')?.dataset.q;
  const s = si !== undefined ? draft?.sections[si] : null;
  if (act === 'inst-add' || act === 'inst-del') {
    const sec = btn.closest('.ac-repeat');
    if (act === 'inst-add') {
      sec.querySelector('.ac-instances').insertAdjacentHTML('beforeend', renderInstance(draft.sections[sec.dataset.si], true));
    } else btn.closest('.ac-instance').remove();
    return numberInstances(sec, draft.sections);
  }
  const find = () => list.find((f) => f.id === btn.dataset.id);

  switch (act) {
    case 'new': draft = blankForm(); mode = 'edit'; error = ''; break;
    case 'edit': draft = structuredClone(find()); mode = 'edit'; error = ''; break;
    case 'view': draft = structuredClone(find()); mode = 'preview'; activeTab = 0; break;
    case 'delete': if (confirm('Delete this form?')) { await forms.remove(btn.dataset.id); return refresh(); } return;
    case 'back': return refresh();
    case 'preview': mode = 'preview'; activeTab = 0; break;
    case 'tab': activeTab = +btn.dataset.i; break;
    case 'edit-draft': mode = 'edit'; break;
    case 'save': return save();
    case 's-add': draft.sections.push(newSection()); break;
    case 's-del': draft.sections.splice(si, 1); break;
    case 's-up': move(draft.sections, +si, -1); break;
    case 's-down': move(draft.sections, +si, 1); break;
    case 'q-add': s.questions.push(newQuestion()); break;
    case 'q-del': s.questions.splice(qi, 1); break;
    case 'q-up': move(s.questions, +qi, -1); break;
    case 'q-down': move(s.questions, +qi, 1); break;
    default: return;
  }
  render();
});

refresh();
