import { api } from './api.js';
import { esc } from './form-render.js';
import { openBuilder } from './form-builder.js';

const forms = api('acord_forms');
const root = document.getElementById('view-acord');

let list = [];

let toastTimer;
const toast = (message, kind = 'ok') => {
  const node = document.getElementById('toast');
  node.textContent = message;
  node.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.className = 'toast';
  }, 2800);
};

const questionCount = (f) => (f.sections || []).reduce((n, s) => n + s.questions.length, 0);

function render() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Acord</div>
    <div class="page-header">
      <div><div class="eyebrow">Forms</div><h1>Acord Forms</h1><p class="muted">Build Acord forms from sections and questions. Attach them to coverages on the Coverage page.</p></div>
      <div class="tools"><button class="btn primary" data-act="new">+ Create form</button></div>
    </div>
    <section class="card"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Form</th><th>Sections</th><th>Questions</th><th>Status</th><th>Updated</th><th></th></tr></thead>
      <tbody>${
        list.length
          ? list
              .map(
                (f) => `<tr><td><strong>${esc(f.name)}</strong></td>
        <td>${(f.sections || []).length}</td>
        <td>${questionCount(f)}</td>
        <td><span class="badge draft">${esc(f.status)}</span></td>
        <td>${f.updatedAt || f.createdAt ? new Date(f.updatedAt || f.createdAt).toLocaleString() : '—'}</td>
        <td class="ac-list-actions"><button class="btn sm" data-act="view" data-id="${esc(f.id)}">Preview</button><button class="btn sm" data-act="edit" data-id="${esc(f.id)}">Edit</button><button class="btn sm danger" data-act="delete" data-id="${esc(f.id)}">Delete</button></td></tr>`,
              )
              .join('')
          : '<tr><td colspan="6" class="ac-empty">No Acord forms yet.</td></tr>'
      }</tbody>
    </table></div></section>`;
}

async function refresh() {
  list = await forms.list();
  render();
}

const open = (opts) => openBuilder({ returnTo: root, onExit: refresh, ...opts });

root.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const f = list.find((x) => x.id === btn.dataset.id);
  if (btn.dataset.act === 'new') open({});
  else if (btn.dataset.act === 'view') open({ form: f, preview: true });
  else if (btn.dataset.act === 'edit') open({ form: f, notice: 'Changes to this form apply everywhere it is used.' });
  else if (btn.dataset.act === 'delete') {
    if (!f) return;
    // Forms attached to coverages or classes would be left dangling, so block deleting those.
    const [coverages, cobs] = await Promise.all([api('coverages').list(), api('class_of_business').list()]);
    const used = coverages.filter((c) => (c.forms || []).some((a) => a.formId === f.id)).length + cobs.filter((c) => (c.forms || []).some((a) => a.formId === f.id)).length;
    if (used) return toast(`“${f.name}” is attached to ${used} ${used === 1 ? 'item' : 'items'} and can't be deleted.`, 'err');
    if (!confirm(`Delete “${f.name}”?`)) return;
    try {
      await forms.remove(f.id);
      await refresh();
      toast(`“${f.name}” deleted.`);
    } catch (err) {
      toast(err.message, 'err');
    }
  }
});

refresh().catch((err) => toast(`Unable to load forms: ${err.message}`, 'err'));
