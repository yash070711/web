import { api } from './api.js';
import {
  LOBS,
  esc,
  emptyComponent,
  emptyClass,
  componentIssues,
  normalizeComponents,
  startNextVersion,
} from './product-model.js';

const el = (id) => document.getElementById(id);
const versionId = new URLSearchParams(location.search).get('id');

const state = { product: null, version: null, library: [], classes: [], open: new Set(), dirty: false };
const readOnly = () => state.version?.status === 'Published';
const components = () => state.version.components;

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

const showErrors = (messages) => {
  el('errors').hidden = !messages.length;
  el('errors').innerHTML = messages.length
    ? `<strong>Please fix the following:</strong><ul>${messages.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '';
  if (messages.length) window.scrollTo({ top: 0, behavior: 'smooth' });
};

const showSaveState = () => {
  const node = el('saveState');
  if (readOnly()) node.textContent = 'Published · read-only';
  else if (state.dirty) node.innerHTML = '<span class="dirty">● Unsaved changes</span>';
  else node.textContent = 'All changes saved';
};
const markDirty = () => {
  state.dirty = true;
  showSaveState();
};
const markClean = () => {
  state.dirty = false;
  showSaveState();
};

// ---- rendering ----
// Every active library coverage as a tick-box; ticking attaches it to the class, unticking removes it.
// `attached` is the coverage already on the class (or undefined). Attached coverages can be marked mandatory to sell.
const pickItem = (lib, ci, ki, attached, klass) =>
  `<div class="pick${attached ? ' on' : ''}">
    <label class="pick-main">
      <input type="checkbox" data-pick data-ci="${ci}" data-ki="${ki}" value="${esc(lib.id)}"${attached ? ' checked' : ''}>
      <span>${esc(lib.name)}</span>
    </label>
    ${attached ? `<label class="pick-req" title="Mandatory to sell: this coverage must be included on every policy sold from this product."><input type="checkbox" data-mandatory data-ci="${ci}" data-ki="${ki}" value="${esc(lib.id)}"${attached.mandatory ? ' checked' : ''}> Required</label>` : ''}
    ${attached ? relationRow(attached, klass, ci, ki) : ''}
  </div>`;

// "Requires" relationships: if this coverage is bought, the chosen coverages (same class) must be bought too.
// It is one-way: a required coverage can still be sold on its own.
const relationRow = (cov, klass, ci, ki) => {
  const required = cov.requires ?? [];
  const names = (id) => klass.coverages.find((c) => c.coverageId === id)?.name ?? 'Unknown coverage';
  const options = klass.coverages.filter((c) => c.coverageId !== cov.coverageId && !required.includes(c.coverageId));
  return `<div class="pick-rel">
    <span class="rel-label">If bought, also requires:</span>
    ${required.map((id) => `<span class="rel-chip">${esc(names(id))}<button type="button" class="rel-x" data-act="rel-del" data-ci="${ci}" data-ki="${ki}" data-cov="${esc(cov.coverageId)}" data-target="${esc(id)}" aria-label="Remove requirement ${esc(names(id))}">✕</button></span>`).join('')}
    ${
      options.length
        ? `<select class="rel-add" data-rel-add data-ci="${ci}" data-ki="${ki}" data-cov="${esc(cov.coverageId)}" aria-label="Add a required coverage">
            <option value="">+ Add…</option>${options.map((c) => `<option value="${esc(c.coverageId)}">${esc(c.name)}</option>`).join('')}</select>`
        : required.length
          ? ''
          : '<span class="muted" style="margin:0;font-size:10px">Tick other coverages in this class of business to link them.</span>'
    }
  </div>`;
};

const classBox = (klass, ci, ki) => {
  const attached = new Map(klass.coverages.map((c) => [c.coverageId, c]));
  // Global coverages aren't tied to a class; any active coverage can be attached under any class.
  const linked = state.library;
  const other = [];
  const orphans = klass.coverages.filter((c) => !state.library.some((l) => l.id === c.coverageId));
  const item = (l) => pickItem(l, ci, ki, attached.get(l.id), klass);
  const moreKey = `more-${klass.id}`;
  return `<div class="card section-card">
    <div class="section-head">
      <h3>${esc(klass.name)}</h3>
      <span class="badge ${klass.coverages.length ? 'ok' : 'warn'}">${klass.coverages.length} ${klass.coverages.length === 1 ? 'coverage' : 'coverages'}</span>
      ${readOnly() ? '' : `<button class="mini move-controls" type="button" data-act="del-class" data-ci="${ci}" data-ki="${ki}" aria-label="Remove ${esc(klass.name)}">Remove</button>`}
    </div>
    ${
      state.library.length
        ? `<p class="muted" style="margin:0">Tick the coverages that apply to this class of business.</p>
           <div class="pick-list">${linked.map(item).join('')}</div>
           ${linked.length ? '' : `<p class="muted">No library coverages are linked to ${esc(klass.name)}. You can still tick any coverage below.</p>`}
           ${other.length ? `<details class="more-box" data-key="${moreKey}"${state.open.has(moreKey) || !linked.length ? ' open' : ''}><summary>${linked.length ? `Other coverages (${other.length})` : 'All coverages'}</summary><div class="pick-list">${other.map(item).join('')}</div></details>` : ''}
           ${orphans.map((c) => `<p class="muted">“${esc(c.name)}” is no longer in the library. <button class="mini" type="button" data-act="del-orphan" data-ci="${ci}" data-ki="${ki}" data-id="${esc(c.id)}">Remove</button></p>`).join('')}`
        : '<div class="wiz-note">The coverage library is empty. <a href="/coverage-form.html">Create coverages</a> first.</div>'
    }
  </div>`;
};

const addClassBar = (comp, ci) => {
  const free = state.classes.filter((c) => !comp.classes.some((k) => k.classId === c.id));
  return `<div class="field-group">
    <label for="newclass-${ci}" style="font-size:10px;font-weight:600">Add a class of business</label>
    <div class="toolbar" style="margin-top:6px">
      <input class="search-box" id="newclass-${ci}" data-classinput="${ci}" list="classes-${ci}" maxlength="60" autocomplete="off" placeholder="Type to search classes of business, or enter a new name">
      <datalist id="classes-${ci}">${free.map((c) => `<option value="${esc(c.name)}"></option>`).join('')}</datalist>
      <button class="action primary" type="button" data-act="add-class" data-ci="${ci}">+ Add class of business</button>
    </div>
    <p class="hint-line" id="classhint-${ci}">${free.length ? `${free.length} existing ${free.length === 1 ? 'class of business' : 'classes of business'} available. A name that doesn't exist yet creates a new class of business.` : 'A name that doesn\'t exist yet creates a new class of business.'}</p>
  </div>`;
};

const componentCard = (comp, ci) => {
  const issues = componentIssues(comp);
  const covs = comp.classes.reduce((n, k) => n + k.coverages.length, 0);
  return `<details class="comp-box" data-key="${esc(comp.id)}"${state.open.has(comp.id) ? ' open' : ''}>
    <summary>
      <strong>${esc(comp.name) || 'Untitled component'}</strong>
      ${comp.lob ? `<span class="badge">${esc(comp.lob)}</span>` : ''}
      <span class="badge ${issues.length ? 'warn' : 'ok'}">${issues.length ? `Needs ${esc(issues[0])}` : 'Ready'}</span>
      <span class="sum-meta">${comp.classes.length} ${comp.classes.length === 1 ? 'class of business' : 'classes of business'} · ${covs} ${covs === 1 ? 'coverage' : 'coverages'}</span>
    </summary>
    <div class="comp-body">
      <div class="comp-head" style="margin-top:14px">
        <div class="field"><label for="cn-${ci}">Component name *</label>
          <input class="search-box" id="cn-${ci}" data-comp="${ci}" data-f="name" maxlength="60" value="${esc(comp.name)}"></div>
        <div class="field"><label for="cl-${ci}">Line of business *</label>
          <select class="search-box" id="cl-${ci}" data-comp="${ci}" data-f="lob">
            <option value="">Select line of business</option>
            ${LOBS.map((l) => `<option${comp.lob === l ? ' selected' : ''}>${l}</option>`).join('')}
          </select></div>
        ${readOnly() ? '' : `<button class="action" type="button" data-act="del-comp" data-ci="${ci}">Remove component</button>`}
      </div>
      <h3>Classes of business</h3>
      ${comp.classes.map((k, ki) => classBox(k, ci, ki)).join('') || '<div class="wiz-note">Add the classes of business this component covers. Then tick the coverages for each one.</div>'}
      ${readOnly() ? '' : addClassBar(comp, ci)}
    </div>
  </details>`;
};

const render = () => {
  const { product, version } = state;
  document.title = `${product.name} ${version.label} · VeriDex Product Studio`;
  el('crumbProduct').textContent = product.name;
  el('crumbVersion').textContent = version.label;
  el('title').textContent = `${product.name} · ${version.label}`;
  el('subtitle').textContent = `${product.productId} · ${product.carrier} · ${product.arrangement}`;
  el('status').textContent = version.status;
  el('saveDraft').hidden = readOnly();
  el('newVersion').hidden = !readOnly();
  el('addComponent').hidden = readOnly();
  el('toConfig').textContent = readOnly() ? 'View coverage configuration →' : 'Continue to coverage configuration →';
  el('components').innerHTML =
    (readOnly() ? '<div class="notice-bar"><div class="notice-content"><strong>This version is published and read-only.</strong><p>Create a new version to make changes.</p></div></div>' : '') +
    (components().map(componentCard).join('') ||
      '<div class="card"><div class="wiz-note">No components yet. Add your first one above — for example “Auto Liability” on Commercial Auto.</div></div>');
  showSaveState();
};

// ---- persistence ----
const save = async () => {
  state.version = await api('product_versions').update(state.version.id, { components: components(), jurisdiction: state.version.jurisdiction, updatedAt: new Date().toISOString() });
  normalizeComponents(components());
  if (state.product.status === 'Draft') {
    const lobs = [...new Set(components().map((c) => c.lob).filter(Boolean))].join(', ');
    state.product = await api('products').update(state.product.id, { lineOfBusiness: lobs, version: state.version.label });
  }
  markClean();
};

const validate = () => {
  const errors = [];
  if (!components().length) errors.push('Add at least one component.');
  components().forEach((c, i) => {
    const issues = componentIssues(c);
    if (issues.length) errors.push(`${c.name.trim() || `Component ${i + 1}`} needs ${issues.join(', ')}.`);
    if (issues.length) state.open.add(c.id);
  });
  return errors;
};

const guarded = (fn) => async () => {
  try {
    await fn();
  } catch (err) {
    showErrors([err.message]);
  }
};

const configUrl = () => `/coverage-config.html?id=${encodeURIComponent(state.version.id)}`;
// True once the user has entered anything for a coverage, so removing it deserves a confirmation.
const isConfigured = (cov) =>
  Boolean(cov.limits?.some((l) => l.name || l.amount) || cov.deductibles?.length || cov.terms || cov.questions?.length || cov.forms?.length || cov.riskObjectTypes?.length);

// ---- events ----
const host = el('components');

host.addEventListener('input', (event) => {
  const t = event.target;
  if (t.dataset.f === 'name') {
    components()[t.dataset.comp].name = t.value;
    markDirty();
  } else if (t.dataset.classinput !== undefined) {
    const ci = t.dataset.classinput;
    const name = t.value.trim().toLowerCase();
    const comp = components()[ci];
    const match = state.classes.find((c) => c.name.toLowerCase() === name);
    el(`classhint-${ci}`).textContent = !name
      ? ''
      : match
        ? comp.classes.some((k) => k.classId === match.id)
          ? 'Already in this component.'
          : `Existing class of business “${match.name}” will be added.`
        : `“${t.value.trim()}” doesn't exist yet — it will be created as a new class of business.`;
  }
});

host.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.dataset.classinput !== undefined) {
    event.preventDefault();
    host.querySelector(`[data-act="add-class"][data-ci="${event.target.dataset.classinput}"]`).click();
  }
});

host.addEventListener('change', (event) => {
  const t = event.target;
  if (t.dataset.f === 'lob') {
    components()[t.dataset.comp].lob = t.value;
    markDirty();
    render();
  } else if (t.dataset.relAdd !== undefined) {
    const klass = components()[Number(t.dataset.ci)].classes[Number(t.dataset.ki)];
    const cov = klass.coverages.find((c) => c.coverageId === t.dataset.cov);
    if (cov && t.value) {
      cov.requires = [...new Set([...(cov.requires ?? []), t.value])];
      markDirty();
      render();
    }
  } else if (t.dataset.mandatory !== undefined) {
    // Mandatory to sell: no re-render needed, just record it.
    const klass = components()[Number(t.dataset.ci)].classes[Number(t.dataset.ki)];
    const cov = klass.coverages.find((c) => c.coverageId === t.value);
    if (cov) cov.mandatory = t.checked;
    markDirty();
  } else if (t.dataset.pick !== undefined) {
    const klass = components()[Number(t.dataset.ci)].classes[Number(t.dataset.ki)];
    const lib = state.library.find((l) => l.id === t.value);
    if (t.checked) {
      klass.coverages.push({ id: crypto.randomUUID(), coverageId: lib.id, name: lib.name, mandatory: false });
    } else {
      const cov = klass.coverages.find((c) => c.coverageId === t.value);
      const dependents = klass.coverages.filter((c) => c.coverageId !== t.value && (c.requires ?? []).includes(t.value));
      const notes = [];
      if (cov && isConfigured(cov)) notes.push('Its configuration will be lost.');
      if (dependents.length) notes.push(`${dependents.map((d) => d.name).join(', ')} currently ${dependents.length === 1 ? 'requires' : 'require'} it; that requirement will be removed.`);
      if (cov && notes.length && !confirm(`Remove “${cov.name}” from ${klass.name}? ${notes.join(' ')}`)) {
        t.checked = true;
        return;
      }
      klass.coverages = klass.coverages.filter((c) => c.coverageId !== t.value);
      klass.coverages.forEach((c) => {
        c.requires = (c.requires ?? []).filter((id) => id !== t.value);
      });
    }
    markDirty();
    render();
  }
});

host.addEventListener(
  'toggle',
  (event) => {
    const key = event.target.dataset?.key;
    if (!key) return;
    event.target.open ? state.open.add(key) : state.open.delete(key);
  },
  true,
);

host.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-act]');
  if (!btn) return;
  const ci = Number(btn.dataset.ci);
  const ki = Number(btn.dataset.ki);
  const comp = components()[ci];
  try {
    switch (btn.dataset.act) {
      case 'del-comp':
        if (comp.classes.length && !confirm(`Remove “${comp.name || 'this component'}” and everything inside it?`)) return;
        components().splice(ci, 1);
        break;
      case 'rel-del': {
        const cov = comp.classes[ki].coverages.find((c) => c.coverageId === btn.dataset.cov);
        if (cov) cov.requires = (cov.requires ?? []).filter((id) => id !== btn.dataset.target);
        break;
      }
      case 'del-class': {
        const klass = comp.classes[ki];
        if (klass.coverages.some(isConfigured) && !confirm(`Remove class of business “${klass.name}” and its coverages?`)) return;
        comp.classes.splice(ki, 1);
        break;
      }
      case 'del-orphan':
        comp.classes[ki].coverages = comp.classes[ki].coverages.filter((c) => c.id !== btn.dataset.id);
        break;
      case 'add-class': {
        const name = el(`newclass-${ci}`).value.trim();
        if (!name) return showErrors(['Type a class of business name to add or create.']);
        let cls = state.classes.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (cls && comp.classes.some((k) => k.classId === cls.id)) return showErrors([`“${cls.name}” is already in this component.`]);
        if (!cls) {
          cls = await api('class_of_business').create({ name, description: '', forms: [] });
          state.classes.push(cls);
          state.classes.sort((a, b) => a.name.localeCompare(b.name));
          toast(`New class of business “${cls.name}” created.`);
        }
        comp.classes.push(emptyClass(cls));
        break;
      }
      default:
        return;
    }
    showErrors([]);
    markDirty();
    render();
  } catch (err) {
    showErrors([err.message]);
  }
});

el('addComp').addEventListener('click', () => {
  const name = el('compName').value.trim();
  const lob = el('compLob').value;
  if (!name || !lob) return showErrors(['Enter a component name and choose a line of business.']);
  showErrors([]);
  const comp = emptyComponent(name, lob);
  components().push(comp);
  state.open.add(comp.id);
  el('compName').value = '';
  el('compLob').value = '';
  markDirty();
  render();
  host.querySelector(`[data-key="${comp.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

el('compName').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    el('addComp').click();
  }
});

el('saveDraft').addEventListener(
  'click',
  guarded(async () => {
    showErrors([]);
    await save();
    toast('Draft saved.');
  }),
);

el('toConfig').addEventListener(
  'click',
  guarded(async () => {
    if (!readOnly()) {
      const errors = validate();
      showErrors(errors);
      if (errors.length) return render();
      await save();
    }
    location.href = configUrl();
  }),
);

el('newVersion').addEventListener(
  'click',
  guarded(async () => {
    const all = await api('product_versions').list();
    const { version, existing } = await startNextVersion(api, state.product.id, all, state.version);
    if (existing && !confirm(`${state.product.name} already has an open draft (${version.label}). Open it?`)) return;
    location.href = `/product-version.html?id=${encodeURIComponent(version.id)}`;
  }),
);

window.addEventListener('beforeunload', (event) => {
  if (state.dirty) event.preventDefault();
});

// ---- init ----
(async () => {
  try {
    if (!versionId) throw new Error('No product version specified.');
    state.version = await api('product_versions').get(versionId);
    const [product, coverages, classes] = await Promise.all([
      api('products').get(state.version.productRef),
      api('coverages').list(),
      api('class_of_business').list(),
    ]);
    normalizeComponents(components());
    state.version.jurisdiction ??= { excludedStates: [] };
    state.product = product;
    state.classes = classes.sort((a, b) => a.name.localeCompare(b.name));
    state.library = coverages.filter((c) => String(c.status ?? 'active').toLowerCase() === 'active');
    el('compLob').innerHTML = ['<option value="">Select line of business</option>', ...LOBS.map((l) => `<option>${l}</option>`)].join('');
    // Open the first component, plus any that still need attention.
    components().forEach((c, i) => {
      if (i === 0 || componentIssues(c).length) state.open.add(c.id);
    });
    render();
  } catch (err) {
    el('title').textContent = 'Product version not found';
    showErrors([err.message]);
  }
})();
