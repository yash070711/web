import { esc } from './form-render.js';

// Reusable "pick Acord forms" panel: search, filter, pagination, multi-select,
// per-form field customisation, plus optional create / edit-form hooks.
//
//   const picker = createFormPicker(host, {
//     forms,                 // all available Acord forms
//     selected,              // array of { formId, excluded: [questionId] } — mutated in place
//     onChange,              // called after any selection / field change
//     onCreateForm,          // optional: show "+ Create new form"
//     onEditForm(form),      // optional: show "Edit form" on each row
//   });
//   picker.setForms(newForms);  picker.render();

const PAGE_SIZE = 5;

export function createFormPicker(host, opts) {
  let forms = opts.forms;
  const selected = opts.selected;
  const state = { q: '', filter: 'all', page: 1, open: new Set() };

  const attachment = (id) => selected.find((a) => a.formId === id);
  const questions = (f) => f.sections.flatMap((s) => s.questions);
  const included = (f) => questions(f).filter((q) => !attachment(f.id).excluded.includes(q.id)).length;
  const changed = () => opts.onChange?.();

  const filtered = () => {
    const q = state.q.trim().toLowerCase();
    return forms.filter((f) => {
      const on = !!attachment(f.id);
      if (state.filter === 'selected' && !on) return false;
      if (state.filter === 'unselected' && on) return false;
      return !q || `${f.name} ${f.description || ''} ${f.status}`.toLowerCase().includes(q);
    });
  };

  const rowHtml = (f) => {
    const a = attachment(f.id);
    const total = questions(f).length;
    const open = a && state.open.has(f.id);
    return `
      <div class="cob-row${a ? ' on' : ''}" data-form="${esc(f.id)}">
        <div class="cob-row-main">
          <input type="checkbox" data-attach aria-label="Add ${esc(f.name)}"${a ? ' checked' : ''}>
          <div class="cob-row-info">
            <div class="cob-row-name">${esc(f.name)} <span class="badge draft">${esc(f.status)}</span></div>
            <div class="ac-hint">${f.sections.length} section${f.sections.length === 1 ? '' : 's'} · <span data-count>${a ? `${included(f)} of ${total} fields included` : `${total} fields`}</span></div>
          </div>
          ${opts.onEditForm ? `<button type="button" class="btn sm" data-act="form-edit" data-id="${esc(f.id)}" title="Add, remove or change this form's fields">Edit form</button>` : ''}
          ${a ? `<button type="button" class="btn sm" data-act="toggle-open" data-id="${esc(f.id)}">${open ? 'Hide fields' : 'Customize fields'}</button>` : ''}
        </div>
        ${open ? `<div class="cob-fields">
          <div class="cob-fields-tools"><button type="button" class="ac-icon" data-act="fields-all" data-id="${esc(f.id)}">Select all</button><button type="button" class="ac-icon" data-act="fields-none" data-id="${esc(f.id)}">Clear all</button></div>
          ${f.sections.map((s) => `<div class="cob-sec"><div class="cob-sec-title">${esc(s.title)}</div>
            <div class="cob-sec-fields">${s.questions.map((q) => `<label class="ac-choice"><input type="checkbox" data-field="${esc(q.id)}"${a.excluded.includes(q.id) ? '' : ' checked'}> ${esc(q.label)}</label>`).join('')}</div></div>`).join('')}
        </div>` : ''}
      </div>`;
  };

  function renderList() {
    const rows = filtered();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PAGE_SIZE;
    host.querySelector('[data-summary]').textContent = `${selected.length} of ${forms.length} selected`;
    host.querySelector('[data-list]').innerHTML = rows.length
      ? rows.slice(start, start + PAGE_SIZE).map(rowHtml).join('')
      : '<div class="ac-empty">No Acord forms match your search.</div>';
    host.querySelector('[data-pager]').innerHTML = rows.length ? `
      <span class="ac-hint">Showing ${start + 1}–${Math.min(start + PAGE_SIZE, rows.length)} of ${rows.length}</span>
      <div class="cob-pages">
        <button type="button" class="btn sm" data-act="page" data-p="${state.page - 1}"${state.page === 1 ? ' disabled' : ''}>Prev</button>
        ${Array.from({ length: pages }, (_, i) => `<button type="button" class="btn sm${i + 1 === state.page ? ' dark' : ''}" data-act="page" data-p="${i + 1}">${i + 1}</button>`).join('')}
        <button type="button" class="btn sm" data-act="page" data-p="${state.page + 1}"${state.page === pages ? ' disabled' : ''}>Next</button>
      </div>` : '';
  }

  function render() {
    host.innerHTML = `
      <div class="card-header"><div><div class="card-title">Acord forms</div><div class="card-subtitle">Tick the forms that apply. “Customize fields” leaves fields out here only${opts.onEditForm ? '; “Edit form” adds, removes or changes fields on the form itself' : ''}.</div></div><span class="badge info" data-summary></span></div>
      <div class="toolbar">
        ${opts.onCreateForm ? '<button type="button" class="btn primary" data-act="form-new">+ Create new form</button>' : ''}
        <input class="ac-input" data-search style="flex:1;min-width:200px;width:auto" type="search" placeholder="Search Acord forms…" value="${esc(state.q)}">
        <select class="ac-select" data-filter style="width:170px">
          ${[['all', 'All forms'], ['selected', 'Selected'], ['unselected', 'Not selected']].map(([v, l]) => `<option value="${v}"${state.filter === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div data-list></div>
      <div class="cob-pager" data-pager></div>`;
    renderList();
  }

  host.addEventListener('input', (e) => {
    if (!e.target.matches('[data-search]')) return;
    state.q = e.target.value;
    state.page = 1;
    renderList();
  });

  host.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-filter]')) {
      state.filter = t.value;
      state.page = 1;
      return renderList();
    }
    const card = t.closest('[data-form]');
    if (!card) return;
    const f = forms.find((x) => x.id === card.dataset.form);
    if (t.hasAttribute('data-attach')) {
      if (t.checked) selected.push({ formId: f.id, excluded: [] });
      else {
        selected.splice(selected.findIndex((a) => a.formId === f.id), 1);
        state.open.delete(f.id);
      }
      changed();
      renderList();
    } else if (t.dataset.field) {
      const a = attachment(f.id);
      a.excluded = t.checked ? a.excluded.filter((id) => id !== t.dataset.field) : [...a.excluded, t.dataset.field];
      card.querySelector('[data-count]').textContent = `${included(f)} of ${questions(f).length} fields included`;
      changed();
    }
  });

  host.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'form-new') return opts.onCreateForm();
    if (act === 'page') {
      state.page = +btn.dataset.p;
      return renderList();
    }
    const f = forms.find((x) => x.id === btn.dataset.id);
    if (!f) return;
    if (act === 'form-edit') return opts.onEditForm(f);
    if (act === 'toggle-open') state.open.has(f.id) ? state.open.delete(f.id) : state.open.add(f.id);
    else if (act === 'fields-all') { attachment(f.id).excluded = []; changed(); }
    else if (act === 'fields-none') { attachment(f.id).excluded = questions(f).map((q) => q.id); changed(); }
    else return;
    renderList();
  });

  return {
    render,
    setForms(next) { forms = next; },
  };
}
