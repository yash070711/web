import { api } from './api.js';
import { esc } from './form-render.js';
import { openBuilder } from './form-builder.js';
import { createFormPicker } from './form-picker.js';
import { CONFIG_OPTIONS, DEFAULT_OPTIONS, normalizeOptions, clone } from './product-model.js';

const coverages = api('coverages');
const formsApi = api('acord_forms');

const el = (id) => document.getElementById(id);
const form = el('coverageForm');

const editingId = new URLSearchParams(location.search).get('id');
const state = { rows: [], forms: [], existing: null, selectedForms: [], options: clone(DEFAULT_OPTIONS) };

const normalise = (value) => String(value ?? '').toLowerCase();

let toastTimer;
const toast = (message, kind = 'ok') => {
  const node = el('toast');
  node.textContent = message;
  node.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.className = 'toast';
  }, 2800);
};

const showErrors = (messages) => {
  el('formErrors').hidden = !messages.length;
  el('formErrors').innerHTML = messages.length
    ? `<strong>Please fix the following:</strong><ul>${messages.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '';
  if (messages.length) window.scrollTo({ top: 0, behavior: 'smooth' });
};

const readForm = () => ({
  name: form.elements.name.value.trim(),
  description: form.elements.description.value.trim(),
  status: form.elements.status.value,
  forms: state.selectedForms,
  configOptions: normalizeOptions(state.options),
});

const validate = (payload) => {
  const errors = [];
  if (!payload.name) errors.push('Coverage name is required.');
  const duplicate = state.rows.find((row) => row.id !== editingId && normalise(row.name) === normalise(payload.name));
  if (payload.name && duplicate) errors.push(`A coverage named “${duplicate.name}” already exists.`);
  if (!payload.configOptions.length) errors.push('Choose at least one configuration option.');
  showErrors(errors);
  return errors.length === 0;
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
    try {
      sessionStorage.setItem('coverageToast', `Coverage “${payload.name}” ${editingId ? 'updated' : 'added'}.`);
    } catch {
      /* storage unavailable */
    }
    location.href = '/coverage.html';
  } catch (err) {
    showErrors([err.message]);
    el('submitBtn').disabled = false;
  }
};

/* ---------- Acord forms for this coverage ---------- */
const editForm = (existing) => {
  openBuilder({
    form: existing,
    returnTo: el('main'),
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
  // The picker binds listeners to its host; use a fresh host each time so returning from the builder doesn't double them up.
  const old = el('picker-host');
  const host = old.cloneNode(false);
  old.replaceWith(host);
  const picker = createFormPicker(host, {
    forms: state.forms,
    selected: state.selectedForms,
    onCreateForm: () => editForm(null),
    onPreviewForm: (f) => openBuilder({ form: f, preview: true, returnTo: el('main'), onExit: mountPicker }),
    onEditForm: (f) => editForm(f),
  });
  picker.render();
}

/* ---------- configuration options ---------- */
const optionOn = (key) => state.options.find((o) => o.key === key);

const renderOptions = () => {
  el('optList').innerHTML = `<div class="opt-grid">${CONFIG_OPTIONS.map((o) => {
    const on = optionOn(o.key);
    return `<div class="opt-item${on ? ' on' : ''}">
      <label class="opt-main"><input type="checkbox" data-opt="${o.key}"${on ? ' checked' : ''}>
        <span><strong>${esc(o.label)}</strong><small>${esc(o.hint)}</small></span></label>
      ${on ? `<label class="opt-req"><input type="checkbox" data-req="${o.key}"${on.required ? ' checked' : ''}> Required</label>` : ''}
    </div>`;
  }).join('')}</div>`;
  el('optCount').textContent = `${state.options.length} of ${CONFIG_OPTIONS.length} selected`;
};

el('optList').addEventListener('change', (event) => {
  const t = event.target;
  if (t.dataset.opt) {
    if (t.checked) state.options.push({ key: t.dataset.opt, required: CONFIG_OPTIONS.find((o) => o.key === t.dataset.opt).required });
    else state.options = state.options.filter((o) => o.key !== t.dataset.opt);
    state.options = normalizeOptions(state.options);
  } else if (t.dataset.req) {
    optionOn(t.dataset.req).required = t.checked;
  } else return;
  renderOptions();
});
el('optRecommended').addEventListener('click', () => {
  state.options = clone(DEFAULT_OPTIONS);
  renderOptions();
});
el('optAll').addEventListener('click', () => {
  state.options = CONFIG_OPTIONS.map((o) => ({ key: o.key, required: o.required }));
  renderOptions();
});
el('optNone').addEventListener('click', () => {
  state.options = [];
  renderOptions();
});

/* ---------- init ---------- */
form.addEventListener('submit', save);
form.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.tagName === 'INPUT') event.preventDefault();
});

const init = async () => {
  try {
    [state.rows, state.forms] = await Promise.all([coverages.list(), formsApi.list()]);
  } catch (err) {
    showErrors([`Unable to load data: ${err.message}`]);
  }

  if (editingId) {
    state.existing = state.rows.find((row) => row.id === editingId) ?? null;
    if (!state.existing) {
      showErrors(['That coverage no longer exists.']);
      setTimeout(() => {
        location.href = '/coverage.html';
      }, 1500);
      return;
    }
    const row = state.existing;
    el('pageTitle').textContent = `Edit ${row.name}`;
    el('crumb').textContent = row.name;
    el('submitBtn').textContent = 'Save Changes';
    form.elements.name.value = row.name ?? '';
    form.elements.description.value = row.description ?? '';
    form.elements.status.value = normalise(row.status) || 'active';
    state.selectedForms = structuredClone(row.forms ?? []);
    state.options = normalizeOptions(row.configOptions);
  }
  renderOptions();
  mountPicker();
  form.elements.name.focus();
};

init();
