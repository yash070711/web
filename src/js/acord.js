import { api } from './api.js';
import { esc } from './form-render.js';
import { openBuilder } from './form-builder.js';

const forms = api('acord_forms');
const root = document.getElementById('view-acord');

let list = [];

function render() {
  root.innerHTML = `
    <div class="breadcrumb">Product Studio / Acord</div>
    <div class="page-header">
      <div><div class="eyebrow">Forms</div><h1>Acord Forms</h1><p>Build Acord forms from sections and questions of different types.</p></div>
    </div>
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

async function refresh() {
  list = await forms.list();
  render();
}

root.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act="view"]');
  if (!btn) return;
  openBuilder({ form: list.find((f) => f.id === btn.dataset.id), preview: true, returnTo: root });
});

refresh();
