import { api } from './api.js';
import { normalizeOptions, optionDef } from './product-model.js';

const coverages = api('coverages');

const el = (id) => document.getElementById(id);
const dom = {
  body: el('covBody'),
  pagerInfo: el('pagerInfo'),
  pagerControls: el('pagerControls'),
  statTotal: el('statTotal'),
  statActive: el('statActive'),
  statInactive: el('statInactive'),
  statForms: el('statForms'),
  q: el('q'),
  fStatus: el('fStatus'),
  fSize: el('fSize'),
  confirmModal: el('confirmModal'),
  confirmText: el('confirmText'),
  viewModal: el('viewModal'),
  viewTitle: el('viewTitle'),
  viewBody: el('viewBody'),
  viewNote: el('viewNote'),
  notice: el('notice'),
  noticeText: el('noticeText'),
  sidebar: el('sidebar'),
};

const state = {
  rows: [],
  q: '',
  status: '',
  page: 1,
  size: 10,
  deletingId: null,
  viewingId: null,
};

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const normalise = (value) => String(value ?? '').toLowerCase();
const isActive = (row) => normalise(row.status) === 'active';

const paginate = (rows) => {
  const totalPages = Math.max(1, Math.ceil(rows.length / state.size));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const start = (state.page - 1) * state.size;
  return { slice: rows.slice(start, start + state.size), totalPages, start };
};

const filterRows = () => {
  const tokens = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return state.rows.filter((row) => {
    if (!tokens.every((token) => normalise(row.name).includes(token))) return false;
    if (state.status && normalise(row.status) !== normalise(state.status)) return false;
    return true;
  });
};

const renderStats = () => {
  dom.statTotal.textContent = state.rows.length;
  dom.statActive.textContent = state.rows.filter(isActive).length;
  dom.statInactive.textContent = state.rows.filter((row) => !isActive(row)).length;
  dom.statForms.textContent = state.rows.filter((row) => (row.forms ?? []).length).length;
};

const renderFilters = () => {
  const options = (items) => items.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
  dom.fStatus.innerHTML = '<option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>';
  dom.fStatus.value = state.status;
  dom.fSize.value = String(state.size);
};

const badge = (row) => `<span class="badge">${isActive(row) ? 'Active' : 'Inactive'}</span>`;
const tags = (values, map = (v) => v) => asList(values).map((value) => `<span class="badge">${esc(map(value))}</span>`).join(' ');

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const configTags = (row) =>
  normalizeOptions(row.configOptions)
    .map((o) => `<span class="badge">${esc(optionDef(o.key).label)}${o.required ? ' *' : ''}</span>`)
    .join(' ');

const openView = (id) => {
  const row = state.rows.find((item) => item.id === id);
  if (!row) return;
  const item = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  dom.viewTitle.textContent = row.name;
  dom.viewBody.innerHTML = [
    item('Coverage Name', esc(row.name)),
    item('Record ID', esc(row.id)),
    item('Status', badge(row)),
    item('Description', esc(row.description) || '—'),
    item('Configuration', configTags(row) || '—'),
    item('Created', formatDate(row.createdAt)),
    item('Last Updated', formatDate(row.updatedAt)),
  ].join('');
  dom.viewNote.textContent = isActive(row) ? 'Active' : 'Inactive';
  state.viewingId = row.id;
  dom.viewModal.showModal();
};

const renderTable = (rows) => {
  if (!rows.length) {
    dom.body.innerHTML = `<tr><td colspan="6">No coverages match the current search and filters. <button class="action" type="button" data-action="reset">Clear filters</button></td></tr>`;
    return;
  }
  dom.body.innerHTML = rows
    .map(
      (row) => `<tr>
        <td><strong>${esc(row.name)}</strong></td>
        <td>${esc(row.description) || '<span class="muted">—</span>'}</td>
        <td>${normalizeOptions(row.configOptions).length} options</td>
        <td>${(row.forms ?? []).length}</td>
        <td>${badge(row)}</td>
        <td>
          <button class="mini" type="button" data-action="view" data-id="${esc(row.id)}">View</button>
          <button class="mini" type="button" data-action="edit" data-id="${esc(row.id)}">Edit</button>
          <button class="mini" type="button" data-action="delete" data-id="${esc(row.id)}">Delete</button>
        </td>
      </tr>`,
    )
    .join('');
};

const pageTokens = (totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const tokens = [1];
  const start = Math.max(2, state.page - 1);
  const end = Math.min(totalPages - 1, state.page + 1);
  if (start > 2) tokens.push('gap');
  for (let page = start; page <= end; page += 1) tokens.push(page);
  if (end < totalPages - 1) tokens.push('gap');
  tokens.push(totalPages);
  return tokens;
};

const renderPager = (total, start, rows) => {
  dom.pagerInfo.textContent = total ? `Showing ${start + 1}–${start + rows.length} of ${total} coverages` : 'No coverages to show';
  if (!total) {
    dom.pagerControls.innerHTML = '';
    return;
  }
  const totalPages = Math.max(1, Math.ceil(total / state.size));
  const page = state.page;
  const button = (label, target, disabled, active) =>
    `<button class="mini" type="button" data-page="${target}"${disabled ? ' disabled' : ''}${active ? ' aria-current="page"' : ''}>${active ? `<strong>${label}</strong>` : label}</button>`;
  const numbers = pageTokens(totalPages)
    .map((token) => (token === 'gap' ? '<span>…</span>' : button(token, token, false, token === page)))
    .join('');
  dom.pagerControls.innerHTML =
    button('«', 1, page === 1) + button('‹', page - 1, page === 1) +
    numbers + button('›', page + 1, page === totalPages) + button('»', totalPages, page === totalPages);
};

const render = () => {
  renderStats();
  renderFilters();
  const filtered = filterRows();
  const { slice, start } = paginate(filtered);
  renderTable(slice);
  renderPager(filtered.length, start, slice);
};

const resetFilters = () => {
  state.q = '';
  state.status = '';
  state.page = 1;
  dom.q.value = '';
};

let noticeTimer;
const toast = (message, kind = 'ok') => {
  dom.noticeText.textContent = message;
  dom.notice.hidden = false;
  dom.notice.dataset.kind = kind;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    dom.notice.hidden = true;
  }, 3500);
};

const editRow = (id) => {
  window.location.href = `/coverage-form.html?id=${encodeURIComponent(id)}`;
};

const askDelete = (id) => {
  const row = state.rows.find((item) => item.id === id);
  if (!row) return;
  state.deletingId = id;
  dom.confirmText.innerHTML = `Delete coverage <strong>${esc(row.name)}</strong>? This removes it from the coverage library.`;
  dom.confirmModal.showModal();
};

const remove = async () => {
  const row = state.rows.find((item) => item.id === state.deletingId);
  dom.confirmModal.close();
  if (!row) return;
  try {
    await coverages.remove(row.id);
    toast(`Coverage “${row.name}” deleted.`);
    await load();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    state.deletingId = null;
  }
};

const load = async () => {
  try {
    state.rows = await coverages.list();
  } catch (err) {
    state.rows = [];
    toast(`Unable to load coverages: ${err.message}`, 'err');
  }
  render();
};

let searchTimer;
dom.q.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = dom.q.value;
    state.page = 1;
    render();
  }, 180);
});
[['fStatus', 'status']].forEach(([id, key]) =>
  dom[id].addEventListener('change', () => {
    state[key] = dom[id].value;
    state.page = 1;
    render();
  }),
);
dom.fSize.addEventListener('change', () => {
  state.size = Number(dom.fSize.value) || 10;
  state.page = 1;
  render();
});

dom.body.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'view') openView(id);
  if (action === 'edit') editRow(id);
  if (action === 'delete') askDelete(id);
  if (action === 'reset') {
    resetFilters();
    render();
  }
});

dom.pagerControls.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-page]');
  if (!button || button.disabled) return;
  state.page = Number(button.dataset.page);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

el('addBtn').addEventListener('click', () => {
  window.location.href = '/coverage-form.html';
});
el('confirmCancel').addEventListener('click', () => dom.confirmModal.close());
el('confirmOk').addEventListener('click', remove);

el('viewCancel').addEventListener('click', () => dom.viewModal.close());
el('viewEdit').addEventListener('click', () => {
  if (state.viewingId) editRow(state.viewingId);
});
dom.viewModal.addEventListener('close', () => {
  state.viewingId = null;
});

window.toggleCollapse = () => dom.sidebar.classList.toggle('collapsed');
window.toggleMobile = () => dom.sidebar.classList.toggle('open');

try {
  const flash = sessionStorage.getItem('coverageToast');
  if (flash) {
    sessionStorage.removeItem('coverageToast');
    toast(flash);
  }
} catch {
  /* storage unavailable */
}

load();
