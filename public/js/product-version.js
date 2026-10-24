import { api } from './api.js';
import {
  LOBS,
  US_STATES,
  productStates,
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
state.selComp = null;
state.selClass = {};
state.adding = false;
state.covQuery = '';

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const selectedKi = (comp) => {
  const i = comp.classes.findIndex((k) => k.id === state.selClass[comp.id]);
  return i >= 0 ? i : comp.classes.length ? 0 : -1;
};

// "Requires" relationships: if this coverage is bought, the chosen coverages (same class) must be bought too.
// It is one-way: a required coverage can still be sold on its own.
const relationCell = (cov, klass, ci, ki) => {
  const required = cov.requires ?? [];
  const names = (id) => klass.coverages.find((c) => c.coverageId === id)?.name ?? 'Unknown coverage';
  const options = klass.coverages.filter((c) => c.coverageId !== cov.coverageId && !required.includes(c.coverageId));
  return `<span class="att-rel">
    ${required.map((id) => `<span class="rel-chip">${esc(names(id))}<button type="button" class="rel-x" data-act="rel-del" data-ci="${ci}" data-ki="${ki}" data-cov="${esc(cov.coverageId)}" data-target="${esc(id)}" aria-label="Remove requirement ${esc(names(id))}">✕</button></span>`).join('')}
    ${options.length
      ? `<select data-rel-add data-ci="${ci}" data-ki="${ki}" data-cov="${esc(cov.coverageId)}" aria-label="Add a required coverage"><option value="">+ Add</option>${options.map((c) => `<option value="${esc(c.coverageId)}">${esc(c.name)}</option>`).join('')}</select>`
      : ''}
  </span>`;
};

const coverageCards = (klass, ci, ki) => {
  const attached = new Map(klass.coverages.map((c) => [c.coverageId, c]));
  if (!state.library.length) return '<div class="wiz-note">The coverage library is empty. <a href="/coverage-form.html">Create coverages</a> first.</div>';
  const term = state.covQuery.trim().toLowerCase();
  return `<div class="cov-grid" data-covgrid>${state.library
    .map((l) => {
      const on = attached.has(l.id);
      return `<label class="cov-card${on ? ' on' : ''}" data-name="${esc(l.name.toLowerCase())}"${term && !l.name.toLowerCase().includes(term) ? ' hidden' : ''}>
        <input type="checkbox" data-pick data-ci="${ci}" data-ki="${ki}" value="${esc(l.id)}"${on ? ' checked' : ''}><span class="box" aria-hidden="true"></span>
        <b>${esc(l.name)}</b></label>`;
    })
    .join('')}</div>`;
};

const attachedTable = (klass, ci, ki) => {
  const orphans = klass.coverages.filter((c) => !state.library.some((l) => l.id === c.coverageId));
  const rows = klass.coverages.map(
    (cov) => `<div class="att-row">
      <span><strong>${esc(cov.name)}</strong>${orphans.includes(cov) ? ' <span class="muted" style="margin:0">no longer in the library</span>' : ''}</span>
      <label class="att-req" title="Mandatory to sell: this coverage must be included on every policy sold from this product."><input type="checkbox" data-mandatory data-ci="${ci}" data-ki="${ki}" value="${esc(cov.coverageId)}"${cov.mandatory ? ' checked' : ''}><span class="track"></span><span>${cov.mandatory ? 'Required' : 'Optional'}</span></label>
      ${relationCell(cov, klass, ci, ki)}
      <button type="button" class="att-del" data-act="${orphans.includes(cov) ? 'del-orphan' : 'unpick'}" data-ci="${ci}" data-ki="${ki}" data-id="${esc(cov.id)}" data-cov="${esc(cov.coverageId)}" aria-label="Remove ${esc(cov.name)}">Remove</button>
    </div>`,
  );
  return `<div>
    <div class="ws-h"><h3>Attached to ${esc(klass.name)} <span class="badge">${klass.coverages.length}</span></h3><span>Required coverages must be on every policy sold</span></div>
    ${rows.length
      ? `<div class="att-table"><div class="att-row head"><span>Coverage</span><span>Required</span><span>If bought, also requires</span><span></span></div>${rows.join('')}</div>`
      : '<div class="ws-empty">No coverages yet. Pick some from the cards above.</div>'}
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
    <p class="hint-line" id="classhint-${ci}">${free.length ? `${plural(free.length, 'existing class of business', 'existing classes of business')} available. A name that doesn't exist yet creates a new class of business.` : 'A name that doesn\'t exist yet creates a new class of business.'}</p>
  </div>`;
};

const componentTile = (comp, ci) => {
  const issues = componentIssues(comp);
  const covs = comp.classes.reduce((n, k) => n + k.coverages.length, 0);
  return `<button type="button" class="comp-tile" data-act="sel-comp" data-ci="${ci}" aria-pressed="${comp.id === state.selComp}">
    <span class="row"><strong>${esc(comp.name) || 'Untitled component'}</strong><span class="pill ${issues.length ? 'warn' : 'ok'}">${issues.length ? `Needs ${esc(issues[0])}` : 'Ready'}</span></span>
    <span class="meta">${esc(comp.lob || 'No line of business')} · ${plural(comp.classes.length, 'class', 'classes')} · ${plural(covs, 'coverage')}</span>
  </button>`;
};

const classSection = (comp, ci, ki) => {
  const klass = comp.classes[ki];
  return `<div>
      <div class="ws-h"><h3>Pick coverages for ${esc(klass.name)}</h3><span>Click a card to attach or remove it${readOnly() ? '' : ` · <button class="att-del" type="button" data-act="del-class" data-ci="${ci}" data-ki="${ki}">Remove this class</button>`}</span></div>
      <input class="search-box" type="search" data-covsearch placeholder="Search coverages…" aria-label="Search coverages" value="${esc(state.covQuery)}" style="width:100%;margin-bottom:14px">
      ${coverageCards(klass, ci, ki)}
    </div>
    ${attachedTable(klass, ci, ki)}`;
};

const componentEditor = (comp, ci) => {
  const ki = selectedKi(comp);
  return `<section class="comp-edit" aria-label="${esc(comp.name)}"><fieldset class="plain"${readOnly() ? ' disabled' : ''} style="margin:0;padding:0;border:0;min-width:0">
    <div class="comp-edit-head">
      <div class="field"><label for="cn-${ci}">Component name *</label>
        <input class="search-box" id="cn-${ci}" data-comp="${ci}" data-f="name" maxlength="60" value="${esc(comp.name)}" style="width:100%"></div>
      <div class="field"><label for="cl-${ci}">Line of business *</label>
        <select class="search-box" id="cl-${ci}" data-comp="${ci}" data-f="lob" style="width:100%">
          <option value="">Select line of business</option>
          ${LOBS.map((l) => `<option${comp.lob === l ? ' selected' : ''}>${l}</option>`).join('')}
        </select></div>
      ${readOnly() ? '' : `<button class="action" type="button" data-act="del-comp" data-ci="${ci}">Remove component</button>`}
    </div>
    <div class="class-tabs" role="tablist" aria-label="Classes of business">
      ${comp.classes.map((k, i) => `<button type="button" role="tab" class="class-tab" aria-selected="${i === ki && !state.adding}" data-act="sel-class" data-ci="${ci}" data-ki="${i}">${esc(k.name)}<span class="count">${k.coverages.length}</span></button>`).join('')}
      ${readOnly() ? '' : `<button type="button" class="class-tab" style="color:#b84804;font-weight:600" data-act="toggle-add-class" aria-selected="${state.adding}">+ Add class of business</button>`}
    </div>
    <div class="comp-edit-body">
      ${state.adding && !readOnly() ? addClassBar(comp, ci) : ''}
      ${ki >= 0 && !state.adding ? classSection(comp, ci, ki) : !state.adding ? '<div class="wiz-note">Add the classes of business this component covers. Then pick the coverages for each one.</div>' : ''}
    </div>
  </fieldset></section>`;
};

const rail = () => {
  const states = productStates(state.version).length;
  const items = [
    `<li><span class="dot">✓</span><span>States selected<small>${states === US_STATES.length ? `All ${states} states` : plural(states, 'state')}</small></span></li>`,
  ];
  components().forEach((c) => {
    if (!c.classes.length) items.push(`<li><span class="dot warn">!</span><span>${esc(c.name) || 'Untitled component'}<small class="warn-t">Add a class of business and coverages</small></span></li>`);
    c.classes.forEach((k) => {
      items.push(k.coverages.length
        ? `<li><span class="dot">✓</span><span>${esc(c.name)} · ${esc(k.name)}<small>${plural(k.coverages.length, 'coverage')} attached</small></span></li>`
        : `<li><span class="dot warn">!</span><span>${esc(c.name)} · ${esc(k.name)}<small class="warn-t">Attach at least one coverage</small></span></li>`);
    });
  });
  const pct = Math.round((states / US_STATES.length) * 100);
  return `<aside class="ws-rail" aria-label="Version summary">
    <section class="ws-panel"><h3>Jurisdiction</h3><div class="muted" style="margin:0">States this version is available in</div>
      <div class="ws-big"><b>${states}</b><span class="muted" style="margin:0">of ${US_STATES.length} states</span></div><div class="ws-bar"><div style="width:${pct}%"></div></div></section>
    <section class="ws-panel"><h3>Ready for configuration?</h3><ul class="ws-check">${items.join('')}</ul></section>
  </aside>`;
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
  // Fronting products are rated by the MGU: no rater, factors or formula steps for the carrier.
  document.querySelectorAll('[data-goto]').forEach((link) => {
    if (Number(link.dataset.goto) < 5 || product.arrangement !== 'Fronting') return;
    const step = link.closest('.step');
    step.hidden = true;
    step.previousElementSibling.hidden = true;
  });
  el('toConfig').textContent = readOnly() ? 'View coverage configuration →' : 'Continue to coverage configuration →';
  if (!components().some((c) => c.id === state.selComp)) state.selComp = components()[0]?.id ?? null;
  const ci = components().findIndex((c) => c.id === state.selComp);
  el('components').innerHTML =
    (readOnly() ? '<div class="notice-bar"><div class="notice-content"><strong>This version is published and read-only.</strong><p>Create a new version to make changes.</p></div></div>' : '') +
    `<div class="ws-cols"><div class="ws-main">
      <section class="comp-switch" aria-label="Components">${components().map(componentTile).join('')}${readOnly() ? '' : '<button type="button" class="comp-add" data-act="add-comp">+ Add component</button>'}</section>
      ${ci >= 0 ? componentEditor(components()[ci], ci) : '<div class="ws-panel"><div class="wiz-note">No components yet. Add your first one — for example “Auto Liability” on Commercial Auto.</div></div>'}
    </div>${rail()}</div>`;
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

// Removes a coverage from a class, asking first when that would lose work or break a requirement. False if cancelled.
const detach = (klass, coverageId) => {
  const cov = klass.coverages.find((c) => c.coverageId === coverageId);
  const dependents = klass.coverages.filter((c) => c.coverageId !== coverageId && (c.requires ?? []).includes(coverageId));
  const notes = [];
  if (cov && isConfigured(cov)) notes.push('Its configuration will be lost.');
  if (dependents.length) notes.push(`${dependents.map((d) => d.name).join(', ')} currently ${dependents.length === 1 ? 'requires' : 'require'} it; that requirement will be removed.`);
  if (cov && notes.length && !confirm(`Remove “${cov.name}” from ${klass.name}? ${notes.join(' ')}`)) return false;
  klass.coverages = klass.coverages.filter((c) => c.coverageId !== coverageId);
  klass.coverages.forEach((c) => {
    c.requires = (c.requires ?? []).filter((id) => id !== coverageId);
  });
  return true;
};

const configUrl = () => `/coverage-config.html?id=${encodeURIComponent(state.version.id)}`;
// True once the user has entered anything for a coverage, so removing it deserves a confirmation.
const isConfigured = (cov) =>
  Boolean(cov.limits?.some((l) => l.name || l.amount) || cov.deductibles?.length || cov.terms || cov.questions?.length || cov.forms?.length || cov.riskObjectTypes?.length);

// ---- events ----
const host = el('components');

host.addEventListener('input', (event) => {
  const t = event.target;
  if (t.dataset.covsearch !== undefined) {
    state.covQuery = t.value;
    const term = t.value.trim().toLowerCase();
    host.querySelectorAll('.cov-card').forEach((card) => (card.hidden = Boolean(term) && !card.dataset.name.includes(term)));
  } else if (t.dataset.f === 'name') {
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
  if (t.dataset.f === 'name') {
    render();
  } else if (t.dataset.f === 'lob') {
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
    t.closest('.att-req').lastElementChild.textContent = t.checked ? 'Required' : 'Optional';
    markDirty();
  } else if (t.dataset.pick !== undefined) {
    const klass = components()[Number(t.dataset.ci)].classes[Number(t.dataset.ki)];
    const lib = state.library.find((l) => l.id === t.value);
    if (t.checked) klass.coverages.push({ id: crypto.randomUUID(), coverageId: lib.id, name: lib.name, mandatory: false });
    else if (!detach(klass, t.value)) {
      t.checked = true;
      return;
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
      case 'sel-comp':
        state.selComp = comp.id;
        state.adding = false;
        state.covQuery = '';
        return render();
      case 'sel-class':
        state.selClass[comp.id] = comp.classes[ki].id;
        state.adding = false;
        state.covQuery = '';
        return render();
      case 'toggle-add-class':
        state.adding = !state.adding;
        render();
        return host.querySelector('[data-classinput]')?.focus();
      case 'add-comp': {
        const fresh = emptyComponent('New component', '');
        components().push(fresh);
        state.selComp = fresh.id;
        state.adding = false;
        markDirty();
        render();
        const input = host.querySelector('[data-f="name"]');
        input?.focus();
        return input?.select();
      }
      case 'unpick':
        if (!detach(comp.classes[ki], btn.dataset.cov)) return;
        break;
      case 'del-comp':
        if (comp.classes.length && !confirm(`Remove “${comp.name || 'this component'}” and everything inside it?`)) return;
        components().splice(ci, 1);
        state.selComp = null;
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
        const added = emptyClass(cls);
        comp.classes.push(added);
        state.selClass[comp.id] = added.id;
        state.adding = false;
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

el('saveDraft').addEventListener(
  'click',
  guarded(async () => {
    showErrors([]);
    await save();
    toast('Draft saved.');
  }),
);

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-goto]');
  if (!link) return;
  event.preventDefault();
  guarded(async () => {
    if (!readOnly()) {
      const errors = validate();
      showErrors(errors);
      if (errors.length) return render();
      if (state.dirty) await save();
    }
    location.href = `${configUrl()}&step=${link.dataset.goto}`;
  })();
});

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
    // Open the first component, plus any that still need attention.
    components().forEach((c, i) => {
    });
    render();
  } catch (err) {
    el('title').textContent = 'Product version not found';
    showErrors([err.message]);
  }
})();
