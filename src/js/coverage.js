import { api } from './api.js';

const coverages = api('coverages');
const cobApi = api('class_of_business');
const formsApi = api('acord_forms');

const el = (id) => document.getElementById(id);
const dom = {
  body: el('covBody'),
  pagerInfo: el('pagerInfo'),
  pagerControls: el('pagerControls'),
  statTotal: el('statTotal'),
  statActive: el('statActive'),
  statInactive: el('statInactive'),
  statLines: el('statLines'),
  statClasses: el('statClasses'),
  q: el('q'),
  fStatus: el('fStatus'),
  fLine: el('fLine'),
  fClass: el('fClass'),
  fSize: el('fSize'),
  confirmModal: el('confirmModal'),
  confirmText: el('confirmText'),
  viewModal: el('viewModal'),
  viewTitle: el('viewTitle'),
  viewBody: el('viewBody'),
  viewNote: el('viewNote'),
  toast: el('toast'),
  sidebar: el('sidebar'),
};

const state = {
  rows: [],
  cobs: [],
  forms: [],
  q: '',
  status: '',
  line: '',
  klass: '',
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
const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const normalise = (value) => String(value ?? '').toLowerCase();

const isActive = (row) => normalise(row.status) === 'active';

const cobName = (id) => state.cobs.find((c) => c.id === id)?.name ?? 'Unknown class';
const cobNames = (ids) => asList(ids).map(cobName);
const usedCobIds = () => [...new Set(state.rows.flatMap((row) => asList(row.classOfBusiness)))];

const distinct = (key) => uniqueSorted(state.rows.flatMap((row) => asList(row[key])));

const COVERAGE_LINES = ['Commercial Line', 'Personal Line', 'Professional Line', 'Transportation Line'];

const lineOptions = () => [...COVERAGE_LINES];

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
    if (state.line && !asList(row.coverageLines).includes(state.line)) return false;
    if (state.klass && !asList(row.classOfBusiness).includes(state.klass)) return false;
    return true;
  });
};

const renderStats = () => {
  dom.statTotal.textContent = state.rows.length;
  dom.statActive.textContent = state.rows.filter(isActive).length;
  dom.statInactive.textContent = state.rows.filter((row) => !isActive(row)).length;
  dom.statLines.textContent = lineOptions().length;
  dom.statClasses.textContent = `${usedCobIds().length} of ${state.cobs.length} classes of business in use`;
};

const renderFilters = () => {
  const options = (values) => values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  dom.fStatus.innerHTML = '<option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>';
  dom.fLine.innerHTML = '<option value="">All coverage lines</option>' + options(lineOptions());
  dom.fClass.innerHTML = '<option value="">All classes of business</option>' + state.cobs.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  dom.fStatus.value = state.status;
  dom.fLine.value = state.line;
  dom.fClass.value = state.klass;
  dom.fSize.value = String(state.size);
};

const badge = (row) =>
  isActive(row)
    ? '<span class="badge live">Active</span>'
    : '<span class="badge draft">Inactive</span>';

const tags = (values) => asList(values).map((value) => `<span class="tag">${esc(value)}</span>`).join('');

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const openView = (id) => {
  const row = state.rows.find((item) => item.id === id);
  if (!row) return;
  const item = (label, value, wide) => `<div${wide ? ' class="full"' : ''}><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  const optional = (label, value) => (value ? item(label, esc(value)) : '');
  dom.viewTitle.textContent = row.name;
  dom.viewBody.innerHTML = [
    item('Coverage Name', esc(row.name)),
    item('Record ID', `<span class="mono">${esc(row.id)}</span>`),
    item('Status', badge(row)),
    item('Coverage Lines', tags(row.coverageLines) || '—'),
    item('Coverage Type', row.coverageType ? esc(row.coverageType) : '—'),
    item('Class of Business', tags(cobNames(row.classOfBusiness)) || '—'),
    item('Acord Forms', tags(asList(row.forms).map((a) => state.forms.find((f) => f.id === a.formId)?.name ?? 'Deleted form')) || '—', true),
    item('Description', esc(row.description) || '—', true),
    item('Created', formatDate(row.createdAt)),
    item('Last Updated', formatDate(row.updatedAt)),
  ].join('');
  dom.viewNote.textContent = `${asList(row.coverageLines).length} coverage line(s) · ${isActive(row) ? 'Active' : 'Inactive'}`;
  state.viewingId = row.id;
  dom.viewModal.showModal();
};

const renderTable = (rows) => {
  if (!rows.length) {
    dom.body.innerHTML = `<tr><td colspan="6"><div class="empty">No coverages match the current search and filters.<br><button class="btn sm" type="button" data-action="reset">Clear filters</button></div></td></tr>`;
    return;
  }
  dom.body.innerHTML = rows
    .map(
      (row) => `<tr>
        <td><strong>${esc(row.name)}</strong><div class="sub mono">${esc(row.id)}</div></td>
        <td><div class="tags">${tags(row.coverageLines)}</div></td>
        <td>${row.coverageType ? `<span class="badge info">${esc(row.coverageType)}</span>` : '—'}</td>
        <td><div class="tags">${tags(cobNames(row.classOfBusiness))}</div></td>
        <td>${badge(row)}</td>
        <td class="right nowrap">
          <button class="btn sm" type="button" data-action="view" data-id="${esc(row.id)}">View</button>
          <button class="btn sm" type="button" data-action="edit" data-id="${esc(row.id)}">Edit</button>
          <button class="btn sm danger" type="button" data-action="delete" data-id="${esc(row.id)}">Delete</button>
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
  const end = start + rows.length;
  dom.pagerInfo.textContent = total ? `Showing ${start + 1}–${end} of ${total} coverages` : 'No coverages to show';
  if (!total) {
    dom.pagerControls.innerHTML = '';
    return;
  }
  const totalPages = Math.max(1, Math.ceil(total / state.size));
  const page = state.page;
  const button = (label, target, disabled, active) =>
    `<button class="pg${active ? ' active' : ''}" type="button" data-page="${target}"${disabled ? ' disabled' : ''}>${label}</button>`;
  const numbers = pageTokens(totalPages)
    .map((token) => (token === 'gap' ? '<span class="pg-gap">…</span>' : button(token, token, false, token === page)))
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
  state.line = '';
  state.klass = '';
  state.page = 1;
  dom.q.value = '';
  dom.fStatus.value = '';
  dom.fLine.value = '';
  dom.fClass.value = '';
};

let toastTimer;
const toast = (message, kind = 'ok') => {
  dom.toast.textContent = message;
  dom.toast.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.className = 'toast';
  }, 2800);
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
    [state.rows, state.cobs, state.forms] = await Promise.all([coverages.list(), cobApi.list(), formsApi.list()]);
    state.cobs.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    state.rows = [];
    state.cobs = [];
    state.forms = [];
    toast(`Unable to load coverages: ${err.message}`, 'err');
  }
  render();
};

let searchTimer;
const onSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = dom.q.value;
    state.page = 1;
    render();
  }, 180);
};

dom.q.addEventListener('input', onSearch);
dom.fStatus.addEventListener('change', () => {
  state.status = dom.fStatus.value;
  state.page = 1;
  render();
});
dom.fLine.addEventListener('change', () => {
  state.line = dom.fLine.value;
  state.page = 1;
  render();
});
dom.fClass.addEventListener('change', () => {
  state.klass = dom.fClass.value;
  state.page = 1;
  render();
});
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
  if (action === 'edit') location.href = `/coverage-form.html?id=${encodeURIComponent(id)}`;
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

el('confirmClose').addEventListener('click', () => dom.confirmModal.close());
el('confirmCancel').addEventListener('click', () => dom.confirmModal.close());
el('confirmOk').addEventListener('click', remove);

el('viewClose').addEventListener('click', () => dom.viewModal.close());
el('viewCancel').addEventListener('click', () => dom.viewModal.close());
el('viewEdit').addEventListener('click', () => {
  const id = state.viewingId;
  dom.viewModal.close();
  if (id) location.href = `/coverage-form.html?id=${encodeURIComponent(id)}`;
});
dom.viewModal.addEventListener('close', () => {
  state.viewingId = null;
});


try {
  const flash = sessionStorage.getItem('coverageToast');
  if (flash) {
    sessionStorage.removeItem('coverageToast');
    toast(flash);
  }
} catch { /* storage unavailable */ }

load();
