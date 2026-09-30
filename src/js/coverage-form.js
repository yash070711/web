import { api } from './api.js';
import { esc, renderPreviewSection, renderInstance, numberInstances } from './form-render.js';
import { openBuilder } from './form-builder.js';
import { createFormPicker } from './form-picker.js';

const coverages = api('coverages');
const cobApi = api('class_of_business');
const formsApi = api('acord_forms');

const el = (id) => document.getElementById(id);
const form = el('coverageForm');
const eye = el('cobEye');
const cobSelect = form.elements.classOfBusiness;

const editingId = new URLSearchParams(location.search).get('id');
const state = { rows: [], cobs: [], forms: [], existing: null, preview: null, selectedForms: [] };

const normalise = (value) => String(value ?? '').toLowerCase();

let toastTimer;
const toast = (message, kind = 'ok') => {
  const node = el('toast');
  node.textContent = message;
  node.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.className = 'toast'; }, 2800);
};

/* ---------- form ---------- */
const clearErrors = () => {
  form.querySelectorAll('.err').forEach((node) => { node.textContent = ''; });
  form.querySelectorAll('.input.invalid').forEach((node) => node.classList.remove('invalid'));
};

const setError = (name, message) => {
  const slot = form.querySelector(`[data-err="${name}"]`);
  if (slot) slot.textContent = message;
  const input = form.elements[name];
  if (input && input.classList.contains('input')) input.classList.add('invalid');
};

const readForm = () => ({
  name: form.elements.name.value.trim(),
  description: form.elements.description.value.trim(),
  coverageType: form.elements.coverageType.value,
  status: form.elements.status.value,
  classOfBusiness: [cobSelect.value].filter(Boolean),
  forms: state.selectedForms,
});

const validate = (payload) => {
  clearErrors();
  const errors = {};
  if (!payload.name) errors.name = 'Coverage name is required.';
  const duplicate = state.rows.find((row) => row.id !== editingId && normalise(row.name) === normalise(payload.name));
  if (payload.name && duplicate) errors.name = `A coverage named “${duplicate.name}” already exists.`;
  if (!payload.coverageType) errors.coverageType = 'Select a coverage type.';
  if (!payload.classOfBusiness.length) errors.classOfBusiness = 'Select a class of business.';
  Object.entries(errors).forEach(([name, message]) => setError(name, message));
  return Object.keys(errors).length === 0;
};

const save = async (event) => {
  event.preventDefault();
  const payload = readForm();
  if (!validate(payload)) return;
  el('submitBtn').disabled = true;
  const now = new Date().toISOString();
  try {
    if (editingId) {
      await coverages.update(editingId, { ...payload, createdAt: state.existing?.createdAt ?? now, updatedAt: now });
    } else {
      await coverages.create({ ...payload, createdAt: now, updatedAt: now });
    }
    try { sessionStorage.setItem('coverageToast', `Coverage “${payload.name}” ${editingId ? 'updated' : 'added'}.`); } catch { /* storage unavailable */ }
    location.href = '/coverage.html';
  } catch (err) {
    toast(err.message, 'err');
    el('submitBtn').disabled = false;
  }
};

/* ---------- preview of the forms attached to the selected class of business ---------- */
const cobFormsBody = el('cobFormsBody');

const formsForCob = (cob) =>
  cob.forms
    .map((attached) => {
      const f = state.forms.find((x) => x.id === attached.formId);
      if (!f) return null;
      const sections = f.sections
        .map((s) => ({ ...s, questions: s.questions.filter((q) => !attached.excluded.includes(q.id)) }))
        .filter((s) => s.questions.length);
      return { ...f, sections };
    })
    .filter(Boolean);

const renderCobPreview = () => {
  const { forms, active } = state.preview;
  if (!forms.length) {
    cobFormsBody.innerHTML = '<div class="empty">No Acord forms are attached to this class of business.</div>';
    return;
  }
  const current = forms[active];
  cobFormsBody.innerHTML = `
    <div class="studio-nav" role="tablist">${forms
      .map((f, i) => `<button type="button" role="tab" aria-selected="${i === active}" class="${i === active ? 'active' : ''}" data-ftab="${i}">${esc(f.name)}</button>`)
      .join('')}</div>
    <form onsubmit="return false">${current.sections.map((s, i) => renderPreviewSection(s, i)).join('')}</form>`;
  cobFormsBody.querySelectorAll('.ac-repeat').forEach((section) => numberInstances(section, current.sections));
};

const openCobForms = () => {
  const cob = state.cobs.find((c) => c.id === cobSelect.value);
  if (!cob) return;
  el('cobFormsTitle').textContent = `${cob.name} — attached forms`;
  state.preview = { forms: formsForCob(cob), active: 0 };
  renderCobPreview();
  el('cobFormsModal').showModal();
};

eye.addEventListener('click', openCobForms);
cobSelect.addEventListener('change', () => { eye.disabled = !cobSelect.value; });
el('cobFormsClose').addEventListener('click', () => el('cobFormsModal').close());
el('cobFormsDone').addEventListener('click', () => el('cobFormsModal').close());
cobFormsBody.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-ftab]');
  if (tab) {
    state.preview.active = Number(tab.dataset.ftab);
    return renderCobPreview();
  }
  const btn = event.target.closest('[data-act]');
  if (!btn) return;
  const section = btn.closest('.ac-repeat');
  const sections = state.preview.forms[state.preview.active].sections;
  if (btn.dataset.act === 'inst-add') {
    section.querySelector('.ac-instances').insertAdjacentHTML('beforeend', renderInstance(sections[section.dataset.si], true));
  } else if (btn.dataset.act === 'inst-del') {
    btn.closest('.ac-instance').remove();
  } else return;
  numberInstances(section, sections);
});

/* ---------- Acord forms for this coverage ---------- */
const editForm = (existing) => {
  openBuilder({
    form: existing,
    returnTo: el('formPage'),
    notice: existing ? 'Changes to this form apply everywhere it is used.' : '',
    onSaved: async (saved) => {
      state.forms = await formsApi.list();
      if (!existing && !state.selectedForms.some((a) => a.formId === saved.id)) {
        state.selectedForms.push({ formId: saved.id, excluded: [] });
      }
    },
    onExit: mountPicker,
  });
};

function mountPicker() {
  createFormPicker(el('picker-host'), {
    forms: state.forms,
    selected: state.selectedForms,
    onCreateForm: () => editForm(null),
    onEditForm: (f) => editForm(f),
  }).render();
}

/* ---------- init ---------- */
form.addEventListener('submit', save);
form.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.tagName === 'INPUT') event.preventDefault();
});

const init = async () => {
  try {
    [state.rows, state.cobs, state.forms] = await Promise.all([coverages.list(), cobApi.list(), formsApi.list()]);
  } catch (err) {
    toast(`Unable to load data: ${err.message}`, 'err');
  }
  state.cobs.sort((a, b) => a.name.localeCompare(b.name));
  cobSelect.innerHTML = [
    '<option value="">Select class of business</option>',
    ...state.cobs.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`),
  ].join('');

  if (editingId) {
    state.existing = state.rows.find((row) => row.id === editingId) ?? null;
    if (!state.existing) {
      toast('That coverage no longer exists.', 'err');
      setTimeout(() => { location.href = '/coverage.html'; }, 1200);
      return;
    }
    const row = state.existing;
    el('pageTitle').textContent = `Edit ${row.name}`;
    el('crumb').textContent = row.name;
    el('submitBtn').textContent = 'Save Changes';
    form.elements.name.value = row.name ?? '';
    form.elements.description.value = row.description ?? '';
    form.elements.coverageType.value = row.coverageType ?? '';
    form.elements.status.value = normalise(row.status) || 'active';
    const first = (Array.isArray(row.classOfBusiness) ? row.classOfBusiness : [row.classOfBusiness])[0] ?? '';
    cobSelect.value = state.cobs.some((c) => c.id === first) ? first : '';
    eye.disabled = !cobSelect.value;
    state.selectedForms = structuredClone(row.forms ?? []);
  }
  mountPicker();
  form.elements.name.focus();
};

init();
