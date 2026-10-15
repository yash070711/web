import { api } from './api.js';
import { esc, coverageCount, startNextVersion, CARRIERS } from './product-model.js';

const $ = (id) => document.getElementById(id);
const state = { products: [], versions: [], distributed: [], orgs: [], dists: [] };
const expanded = new Set();

const versionsOf = (p) =>
  state.versions.filter((v) => v.productRef === p.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
const distributedOf = (p) =>
  state.distributed.filter((v) => v.productRef === p.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
const date = (value) => (value ? new Date(value).toLocaleDateString() : '—');

function authoredPanel(p) {
  const rows = versionsOf(p)
    .map(
      (v) => `<tr>
        <td><strong>${esc(v.label)}</strong></td>
        <td><span class="badge">${esc(v.status)}</span></td>
        <td>${v.components.length}</td>
        <td>${coverageCount(v.components)}</td>
        <td>${esc(date(v.updatedAt))}</td>
        <td><a class="action" href="/product-version.html?id=${encodeURIComponent(v.id)}">${v.status === 'Draft' ? 'Edit' : 'View'}</a></td>
      </tr>`,
    )
    .join('');
  return `<div class="section-meta">Product versions · ${esc(p.name)}</div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Version</th><th>Status</th><th>Components</th><th>Coverages</th><th>Updated</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="actions field-group"><button class="action primary" type="button" data-newver="${esc(p.id)}">+ New version</button></div>`;
}

function distributedPanel(p) {
  const list = distributedOf(p);
  if (!list.length) return '<div class="section-meta">Distributed versions</div><p class="muted">Not distributed to any organisation yet.</p>';
  const rows = list
    .map((v) => {
      const org = state.orgs.find((o) => o.id === v.organisationId);
      const dist = state.dists.find((d) => d.version?.id === v.id);
      return `<tr>
        <td><strong>${esc(v.version)}</strong></td>
        <td>${esc(org?.name ?? v.organisationId)} ${org ? `<span class="badge">${esc(org.type)}</span>` : ''}</td>
        <td><span class="badge">${esc(v.status)}</span></td>
        <td>${esc(dist?.effectiveFrom ?? '—')}</td>
        <td>${esc(dist ? dist.effectiveTo || 'Open-ended' : '—')}</td>
        <td>${esc(date(v.createdAt))}</td>
      </tr>`;
    })
    .join('');
  return `<div class="section-meta">Distributed versions</div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Version</th><th>Organisation</th><th>Status</th><th>Effective from</th><th>Effective to</th><th>Created</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function render() {
  const q = $('search').value.trim().toLowerCase();
  const shown = state.products.filter((p) =>
    [p.name, p.productId, p.lineOfBusiness].some((v) => String(v ?? '').toLowerCase().includes(q)),
  );
  const count = (status) => state.products.filter((p) => p.status === status).length;

  $('m-total').textContent = state.products.length;
  $('m-published').textContent = count('Published');
  $('m-draft').textContent = count('Draft');
  $('m-review').textContent = count('Needs Review');
  $('count').textContent = `${shown.length} of ${state.products.length} products`;

  $('rows').innerHTML =
    shown
      .map((p) => {
        const dist = distributedOf(p).length;
        const open = expanded.has(p.id);
        return `<tr>
          <td><button class="mini" data-toggle="${esc(p.id)}" aria-expanded="${open}" aria-label="${open ? 'Hide' : 'Show'} versions of ${esc(p.name)}">${open ? '▾' : '▸'}</button></td>
          <td><strong>${esc(p.name)}</strong></td>
          <td>${esc(p.productId)}</td>
          <td>${esc(p.lineOfBusiness) || '—'}</td>
          <td>${esc(p.version)}</td>
          <td><span class="badge">${dist} ${dist === 1 ? 'version' : 'versions'}</span></td>
          <td><span class="badge">${esc(p.status)}</span></td>
          <td>${esc(p.effectiveDate) || "—"}</td>
          <td>
            <button class="mini" data-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}">Edit</button>
            <button class="mini" data-delete="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">🗑</button>
          </td>
        </tr>${open ? `<tr class="ver-row"><td colspan="9"><div class="ver-panel">${authoredPanel(p)}<div class="field-group"></div>${distributedPanel(p)}</div></td></tr>` : ''}`;
      })
      .join('') || '<tr><td colspan="9">No products yet</td></tr>';
}

// Open the product's draft version in the editor; if it only has published versions, start a new draft from the latest.
async function openConfig(p, confirmExisting = false) {
  const source = versionsOf(p).find((v) => v.status === 'Published') ?? versionsOf(p)[0];
  try {
    const { version, existing } = await startNextVersion(api, p.id, state.versions, source);
    if (existing && confirmExisting && !confirm(`${p.name} already has an open draft (${version.label}). Open it?`)) return;
    window.location.href = `/product-version.html?id=${encodeURIComponent(version.id)}`;
  } catch (err) {
    alert(err.message);
  }
}

// ---- edit product details ----
let editing = null;
const editForm = $('editForm');
$('eCarrier').innerHTML = CARRIERS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');

function showEditErrors(messages) {
  $('editErrors').hidden = !messages.length;
  $('editErrors').innerHTML = messages.length
    ? `<strong>Please fix the following:</strong><ul>${messages.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '';
}

function openEdit(p) {
  editing = p;
  showEditErrors([]);
  $('editTitle').textContent = `Edit ${p.name}`;
  editForm.elements.name.value = p.name ?? '';
  editForm.elements.description.value = p.description ?? '';
  // Keep a carrier that isn't in the standard list selectable.
  if (p.carrier && !CARRIERS.includes(p.carrier)) $('eCarrier').insertAdjacentHTML('beforeend', `<option value="${esc(p.carrier)}">${esc(p.carrier)}</option>`);
  editForm.elements.carrier.value = p.carrier ?? CARRIERS[0];
  editForm.elements.arrangement.value = p.arrangement ?? 'Non-fronting';
  $('editModal').showModal();
  editForm.elements.name.focus();
}

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = editForm.elements.name.value.trim();
  const errors = [];
  if (!name) errors.push('Product name is required.');
  else if (state.products.some((p) => p.id !== editing.id && p.name.toLowerCase() === name.toLowerCase())) errors.push(`A product named “${name}” already exists.`);
  showEditErrors(errors);
  if (errors.length) return;
  $('editSave').disabled = true;
  try {
    const updated = await api('products').update(editing.id, {
      name,
      description: editForm.elements.description.value.trim(),
      carrier: editForm.elements.carrier.value,
      arrangement: editForm.elements.arrangement.value,
    });
    state.products = state.products.map((p) => (p.id === updated.id ? updated : p));
    $('editModal').close();
    render();
  } catch (err) {
    showEditErrors([err.message]);
  } finally {
    $('editSave').disabled = false;
  }
});
$('editCancel').addEventListener('click', () => $('editModal').close());
$('editConfig').addEventListener('click', () => {
  $('editModal').close();
  openConfig(editing);
});

$('search').addEventListener('input', render);
$('menu-btn').addEventListener('click', () => $('sidebar').classList.toggle('open'));
$('add-btn').addEventListener('click', () => {
  window.location.href = '/create-product.html';
});

$('rows').addEventListener('click', async (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const id = toggle.dataset.toggle;
    expanded.has(id) ? expanded.delete(id) : expanded.add(id);
    return render();
  }

  const newVer = e.target.closest('[data-newver]');
  if (newVer) {
    const p = state.products.find((x) => x.id === newVer.dataset.newver);
    return openConfig(p, true);
  }

  const edit = e.target.closest('[data-edit]');
  if (edit) return openEdit(state.products.find((x) => x.id === edit.dataset.edit));

  const btn = e.target.closest('[data-delete]');
  if (!btn) return;
  const p = state.products.find((x) => x.id === btn.dataset.delete);
  if (distributedOf(p).length) {
    return alert(`${p.name} has been distributed to organisations. Delete its distributions first.`);
  }
  if (!confirm(`Delete ${p.name} and all of its versions and releases?`)) return;
  try {
    // Sequential: the server rewrites the whole JSON file per request, so parallel deletes would drop each other.
    const releases = (await api('product_releases').list()).filter((r) => r.productRef === p.id);
    for (const v of versionsOf(p)) await api('product_versions').remove(v.id);
    for (const r of releases) await api('product_releases').remove(r.id);
    await api('products').remove(p.id);
    state.products = state.products.filter((x) => x.id !== p.id);
    state.versions = state.versions.filter((v) => v.productRef !== p.id);
    render();
  } catch (err) {
    alert(err.message);
  }
});

Promise.all([
  api('products').list(),
  api('product_versions').list(),
  api('distributed_versions').list(),
  api('organisations').list(),
  api('distributions').list(),
])
  .then(([products, versions, distributed, orgs, dists]) => {
    Object.assign(state, { products, versions, distributed, orgs, dists });
    render();
  })
  .catch(console.error);
