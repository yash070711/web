import { api } from './api.js';
import { esc, renderPreviewSection, renderInstance, numberInstances } from './form-render.js';
import { USES } from './question-uses.js';

// Shared Acord form builder. Any page can open it with openBuilder(); it takes over
// the #view-builder container and hands control back to `returnTo` when finished.

const forms = api('acord_forms');
const root = document.getElementById('view-builder');

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
export const blankForm = () => ({ name: '', description: '', status: 'Draft', layout: 'stacked', sections: [newSection()] });

let draft = null;
let mode = 'edit'; // edit | preview
let error = '';
let activeTab = 0;
let fromEdit = false;
let ctx = {}; // { returnTo, onSaved, onExit, notice }

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

/* ---------- editor ---------- */
const typeOptions = (sel) => TYPES.map((t) => `<option value="${t.value}"${t.value === sel ? ' selected' : ''}>${t.label}</option>`).join('');

/* ---------- answer dependencies ---------- */
// A choice question can say which of its answers are valid for each answer of another question of the form
// (question.dependsOn = { question: <id>, allowed: { "<other answer>": ["<this answer>", ...] } }).
// Rating factors that combine the two questions use it to filter their dropdowns.
const allQuestions = () => draft.sections.flatMap((s) => s.questions);
const optionsOf = (q) => (HAS_OPTIONS.includes(q.type) ? q.options ?? [] : []);
// Would choosing `candidate` as the parent of `q` make a loop (candidate already depends, directly or not, on q)?
const loops = (candidate, q) => {
  const seen = new Set();
  for (let cur = candidate; cur && !seen.has(cur.id); cur = allQuestions().find((x) => x.id === cur.dependsOn?.question)) {
    if (cur.id === q.id) return true;
    seen.add(cur.id);
  }
  return false;
};

function renderDependency(q) {
  const parents = allQuestions().filter((c) => c.id !== q.id && optionsOf(c).length && !loops(c, q));
  const parent = q.dependsOn && allQuestions().find((c) => c.id === q.dependsOn.question);
  const own = optionsOf(q);
  return `<div class="ac-q-options"><div class="ac-hint">Answers depend on another question <span class="muted">(optional)</span></div>
    <select class="ac-select" data-f="dep-parent" aria-label="Depends on">
      <option value="">No — every answer is always valid</option>
      ${parents.map((c) => `<option value="${esc(c.id)}"${c.id === q.dependsOn?.question ? ' selected' : ''}>${esc(c.label || 'Untitled question')}</option>`).join('')}
    </select>
    ${parent ? `<div class="ac-hint" style="margin-top:8px">For each answer to “${esc(parent.label)}”, tick the answers of this question that are valid with it.</div>
      ${optionsOf(parent).map((po) => `<div class="cob-sec"><div class="cob-sec-title">${esc(po)}</div><div class="cob-sec-fields">${
        own.length
          ? own.map((o) => `<label class="ac-choice"><input type="checkbox" data-dep-p="${esc(po)}" data-dep-c="${esc(o)}"${(q.dependsOn.allowed?.[po] ?? []).includes(o) ? ' checked' : ''}> ${esc(o)}</label>`).join('')
          : '<span class="muted">Add options above first.</span>'
      }</div></div>`).join('')}` : ''}
  </div>`;
}

// Remove dependencies that no longer make sense (parent deleted, options renamed or removed, type changed).
function cleanDependencies() {
  const questions = allQuestions();
  questions.forEach((q) => {
    if (!q.dependsOn) return;
    const parent = questions.find((c) => c.id === q.dependsOn.question && c.id !== q.id);
    if (!parent || !HAS_OPTIONS.includes(q.type) || !optionsOf(parent).length) return void delete q.dependsOn;
    const allowed = {};
    optionsOf(parent).forEach((po) => {
      const kept = (q.dependsOn.allowed?.[po] ?? []).filter((o) => q.options.includes(o));
      allowed[po] = kept;
    });
    q.dependsOn = { question: parent.id, allowed };
  });
}

function renderQuestion(q, qi, count) {
  return `
    <div class="ac-q" data-q="${qi}">
      <div class="ac-q-row">
        <input class="ac-input" data-f="label" placeholder="Question text" value="${esc(q.label)}">
        <select class="ac-select" data-f="type">${typeOptions(q.type)}</select>
      </div>
      <input class="ac-input" data-f="help" style="margin-top:8px" placeholder="Help text (optional)" value="${esc(q.help)}">
      ${HAS_OPTIONS.includes(q.type) ? `<div class="ac-q-options"><div class="ac-hint">Options — one per line</div>
        <textarea class="ac-textarea" data-f="options" placeholder="Option 1&#10;Option 2">${esc(q.options.join('\n'))}</textarea></div>${renderDependency(q)}` : ''}
      <div class="ac-q-meta">
        <label class="ac-choice"><input type="checkbox" data-f="required"${q.required ? ' checked' : ''}> Required</label>
        ${USES.map((u) => `<label class="ac-choice" title="${esc(u.hint)}"><input type="checkbox" data-f="use-${u.key}"${q.uses?.[u.key] ? ' checked' : ''}> ${u.label}</label>`).join('')}
        <span class="spacer"></span>
        <button class="ac-icon" data-act="q-up"${qi === 0 ? ' disabled' : ''}>↑</button>
        <button class="ac-icon" data-act="q-down"${qi === count - 1 ? ' disabled' : ''}>↓</button>
        <button class="ac-icon danger" data-act="q-del">Remove</button>
      </div>
    </div>`;
}

function renderEditor() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / ${draft.id ? 'Edit' : 'New'} Acord form</div>
    <div class="page-header">
      <div><div class="eyebrow">Form builder</div><h1>${draft.id ? 'Edit Acord Form' : 'New Acord Form'}</h1></div>
      <div class="tools"><button class="btn" data-act="cancel">Cancel</button><button class="btn" data-act="preview">Preview</button><button class="btn primary" data-act="save">Save Form</button></div>
    </div>
    ${ctx.notice ? `<div class="notice" style="margin:0 0 14px">${esc(ctx.notice)}</div>` : ''}
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
      <div class="tools"><button class="btn" data-act="${fromEdit ? 'edit-draft' : 'cancel'}">${fromEdit ? 'Back to editor' : 'Back'}</button></div>
    </div>
    ${tabs ? `<div class="studio-nav" role="tablist">${draft.sections.map((s, i) => `<button role="tab" aria-selected="${i === activeTab}" class="${i === activeTab ? 'active' : ''}" data-act="tab" data-i="${i}">${esc(s.title || 'Untitled')}</button>`).join('')}</div>` : ''}
    <form onsubmit="return false">
      ${tabs ? renderPreviewSection(draft.sections[activeTab], activeTab) : draft.sections.map((sec, i) => renderPreviewSection(sec, i)).join('')}
    </form>`;
}

const render = () => {
  (mode === 'edit' ? renderEditor : renderPreview)();
  if (mode === 'preview') root.querySelectorAll('.ac-repeat').forEach((el) => numberInstances(el, draft.sections));
};

/* ---------- open / close ---------- */
export function openBuilder({ form, preview = false, returnTo, onSaved, onExit, notice = '' }) {
  draft = structuredClone(form || blankForm());
  mode = preview ? 'preview' : 'edit';
  fromEdit = false;
  error = '';
  activeTab = 0;
  ctx = { returnTo, onSaved, onExit, notice };
  returnTo.hidden = true;
  root.hidden = false;
  render();
  window.scrollTo(0, 0);
}

function close() {
  root.hidden = true;
  root.innerHTML = '';
  ctx.returnTo.hidden = false;
  window.scrollTo(0, 0);
  ctx.onExit?.();
}

async function save() {
  if (!draft.name.trim()) { error = 'Form name is required.'; render(); return; }
  for (const s of draft.sections) {
    s.questions = s.questions.filter((q) => q.label.trim());
    for (const q of s.questions) {
      if (HAS_OPTIONS.includes(q.type) && !q.options.length) { error = `Add options for “${q.label}”.`; render(); return; }
    }
  }
  cleanDependencies();
  error = '';
  const now = new Date().toISOString();
  const payload = { ...draft, updatedAt: now };
  try {
    const saved = draft.id ? await forms.update(draft.id, payload) : await forms.create({ ...payload, createdAt: now });
    await ctx.onSaved?.(saved);
    close();
  } catch (err) {
    error = err.message;
    render();
  }
}

/* ---------- events ---------- */
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
  if (qEl && t.dataset.depC !== undefined) {
    const q = s.questions[qEl.dataset.q];
    const list = new Set(q.dependsOn.allowed[t.dataset.depP] ?? []);
    t.checked ? list.add(t.dataset.depC) : list.delete(t.dataset.depC);
    q.dependsOn.allowed[t.dataset.depP] = q.options.filter((o) => list.has(o));
    return;
  }
  if (!qEl || !t.dataset.f) return;
  const q = s.questions[qEl.dataset.q];
  const f = t.dataset.f;
  if (f === 'dep-parent') {
    if (t.value) q.dependsOn = { question: t.value, allowed: q.dependsOn?.question === t.value ? q.dependsOn.allowed : {} };
    else delete q.dependsOn;
    return render();
  }
  if (f.startsWith('use-')) (q.uses ??= { eligibility: false, rating: false, account: false })[f.slice(4)] = t.checked;
  else if (f === 'required') q.required = t.checked;
  else if (f === 'options') q.options = t.value.split('\n').map((o) => o.trim()).filter(Boolean);
  else q[f] = t.value;
  if (f === 'type') render();
});

// Leaving the options box refreshes the dependency choices that are listed from them.
root.addEventListener('change', (e) => {
  if (mode === 'edit' && e.target.dataset.f === 'options') {
    cleanDependencies();
    render();
  }
});

root.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  const si = btn.closest('[data-s]')?.dataset.s;
  const qi = btn.closest('.ac-q')?.dataset.q;
  const s = si !== undefined ? draft.sections[si] : null;
  if (act === 'inst-add' || act === 'inst-del') {
    const sec = btn.closest('.ac-repeat');
    if (act === 'inst-add') {
      sec.querySelector('.ac-instances').insertAdjacentHTML('beforeend', renderInstance(draft.sections[sec.dataset.si], true));
    } else btn.closest('.ac-instance').remove();
    return numberInstances(sec, draft.sections);
  }

  switch (act) {
    case 'cancel': return close();
    case 'save': return save();
    case 'preview': mode = 'preview'; fromEdit = true; activeTab = 0; break;
    case 'edit-draft': mode = 'edit'; break;
    case 'tab': activeTab = +btn.dataset.i; break;
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
