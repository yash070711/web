import { api } from './api.js';
import { esc } from './product-model.js';

const classesApi = api('class_of_business');

const el = (id) => document.getElementById(id);
const form = el('cobForm');

const state = { rows: [], versions: [], q: '', use: '', page: 1, size: 10, editingId: null, deletingId: null };

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

// ---- usage ----
const productsFor = (cls) => {
  const refs = new Set();
  state.versions.forEach((v) => {
    if ((v.components ?? []).some((c) => (c.classes ?? []).some((k) => k.classId === cls.id))) refs.add(v.productRef);
  });
  return refs.size;
};
const usage = (cls) => ({ products: productsFor(cls) });
const inUse = (cls) => {
  return usage(cls).products > 0;
};

// ---- feedback ----
let noticeTimer;
const toast = (message, kind = 'ok') => {
  el('noticeText').textContent = message;
  el('notice').hidden = false;
  el('notice').dataset.kind = kind;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    el('notice').hidden = true;
  }, 3500);
};

const showFormErrors = (messages) => {
  el('formErrors').hidden = !messages.length;
  el('formErrors').innerHTML = messages.length
    ? `<strong>Please fix the following:</strong><ul>${messages.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '';
};

// ---- rendering ----
const filtered = () => {
  const tokens = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return state.rows
    .filter((c) => tokens.every((t) => `${c.name} ${c.description ?? ''}`.toLowerCase().includes(t)))
    .filter((c) => !state.use || (state.use === 'used') === inUse(c))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const renderStats = () => {
  const withProducts = state.rows.filter((c) => usage(c).products > 0).length;
  el('mTotal').textContent = state.rows.length;
  el('mProd').textContent = withProducts;
  el('mUnused').textContent = state.rows.filter((c) => !inUse(c)).length;
};

const pageTokens = (totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const tokens = [1];
  const start = Math.max(2, state.page - 1);
  const end = Math.min(totalPages - 1, state.page + 1);
  if (start > 2) tokens.push('gap');
  for (let p = start; p <= end; p += 1) tokens.push(p);
  if (end < totalPages - 1) tokens.push('gap');
  tokens.push(totalPages);
  return tokens;
};

const render = () => {
  renderStats();
  const all = filtered();
  const totalPages = Math.max(1, Math.ceil(all.length / state.size));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const start = (state.page - 1) * state.size;
  const slice = all.slice(start, start + state.size);

  el('rows').innerHTML = slice.length
    ? slice
        .map((c) => {
          const u = usage(c);
          return `<tr>
            <td><strong>${esc(c.name)}</strong></td>
            <td>${esc(c.description) || '<span class="muted">No description</span>'}</td>
            <td><span class="badge">${u.products}</span></td>
            <td>
              <button class="mini" type="button" data-act="edit" data-id="${esc(c.id)}">Edit</button>
              <button class="mini" type="button" data-act="delete" data-id="${esc(c.id)}">Delete</button>
            </td>
          </tr>`;
        })
        .join('')
    : `<tr><td colspan="4">${
        state.rows.length
          ? 'No classes of business match your search. <button class="action" type="button" data-act="reset">Clear filters</button>'
          : 'No classes of business yet. <button class="action primary" type="button" data-act="new">+ Create the first one</button>'
      }</td></tr>`;

  el('pagerInfo').textContent = all.length ? `Showing ${start + 1}–${start + slice.length} of ${all.length} classes of business` : 'No classes of business to show';
  const btn = (label, target, disabled, active) =>
    `<button class="mini" type="button" data-page="${target}"${disabled ? ' disabled' : ''}${active ? ' aria-current="page"' : ''}>${active ? `<strong>${label}</strong>` : label}</button>`;
  el('pagerControls').innerHTML =
    all.length && totalPages > 1
      ? btn('‹', state.page - 1, state.page === 1) +
        pageTokens(totalPages).map((t) => (t === 'gap' ? '<span>…</span>' : btn(t, t, false, t === state.page))).join('') +
        btn('›', state.page + 1, state.page === totalPages)
      : '';
};

// ---- add / edit ----
const openForm = (cls) => {
  state.editingId = cls?.id ?? null;
  form.reset();
  showFormErrors([]);
  el('formTitle').textContent = cls ? 'Edit Class of Business' : 'New Class of Business';
  el('formSubmit').textContent = cls ? 'Save changes' : 'Add';
  form.elements.name.value = cls?.name ?? '';
  form.elements.description.value = cls?.description ?? '';
  el('renameNote').hidden = !(cls && inUse(cls));
  el('formModal').showModal();
  form.elements.name.focus();
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  const description = form.elements.description.value.trim();
  const duplicate = state.rows.find((c) => c.id !== state.editingId && c.name.toLowerCase() === name.toLowerCase());
  const errors = [];
  if (!name) errors.push('Name is required.');
  else if (duplicate) errors.push(`A class of business named “${duplicate.name}” already exists.`);
  showFormErrors(errors);
  if (errors.length) return;

  el('formSubmit').disabled = true;
  try {
    if (state.editingId) {
      const updated = await classesApi.update(state.editingId, { name, description });
      state.rows = state.rows.map((c) => (c.id === updated.id ? updated : c));
      toast(`“${name}” updated.`);
    } else {
      state.rows.push(await classesApi.create({ name, description, forms: [] }));
      toast(`“${name}” added.`);
    }
    el('formModal').close();
    render();
  } catch (err) {
    showFormErrors([err.message]);
  } finally {
    el('formSubmit').disabled = false;
  }
});

// ---- delete ----
const askDelete = (id) => {
  const cls = state.rows.find((c) => c.id === id);
  if (!cls) return;
  const { products } = usage(cls);
  if (products) {
    return toast(`“${cls.name}” can't be deleted — it is used by ${products} ${products === 1 ? 'product' : 'products'}. Remove it from those products first.`, 'err');
  }
  state.deletingId = id;
  el('confirmText').innerHTML = `Delete <strong>${esc(cls.name)}</strong>? This cannot be undone.`;
  el('confirmModal').showModal();
};

el('confirmOk').addEventListener('click', async () => {
  const cls = state.rows.find((c) => c.id === state.deletingId);
  el('confirmModal').close();
  if (!cls) return;
  try {
    await classesApi.remove(cls.id);
    state.rows = state.rows.filter((c) => c.id !== cls.id);
    toast(`“${cls.name}” deleted.`);
    render();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    state.deletingId = null;
  }
});
el('confirmCancel').addEventListener('click', () => el('confirmModal').close());
el('formCancel').addEventListener('click', () => el('formModal').close());

// ---- events ----
let searchTimer;
el('q').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = el('q').value;
    state.page = 1;
    render();
  }, 150);
});
el('fUse').addEventListener('change', () => {
  state.use = el('fUse').value;
  state.page = 1;
  render();
});
el('addBtn').addEventListener('click', () => openForm());

el('rows').addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-act]');
  if (!btn) return;
  const { act, id } = btn.dataset;
  if (act === 'edit') openForm(state.rows.find((c) => c.id === id));
  else if (act === 'delete') askDelete(id);
  else if (act === 'new') openForm();
  else if (act === 'reset') {
    state.q = '';
    state.use = '';
    state.page = 1;
    el('q').value = '';
    el('fUse').value = '';
    render();
  }
});

el('pagerControls').addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-page]');
  if (!btn || btn.disabled) return;
  state.page = Number(btn.dataset.page);
  render();
});

// ---- init ----
(async () => {
  try {
    [state.rows, state.versions] = await Promise.all([classesApi.list(), api('product_versions').list()]);
  } catch (err) {
    toast(`Unable to load classes of business: ${err.message}`, 'err');
  }
  render();
})();
