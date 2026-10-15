import { api } from './api.js';
import { createFormPicker } from './form-picker.js';
import { renderControl } from './form-render.js';
import { openBuilder } from './form-builder.js';
import {
  QUESTION_TYPES,
  QUESTION_HAS_OPTIONS,
  blankQuestion,
  US_STATES,
  DEDUCTIBLE_TYPES,
  DEDUCTIBLE_BASES,
  LOSS_BASES,
  BENEFIT_BASES,
  NOTICE_UNITS,
  PARTIES,
  DEFAULT_OPTIONS,
  esc,
  clone,
  lobsOf,
  hydrateCoverage,
  optionDef,
  parseZips,
  coverageIssues,
  allCoverages,
  normalizeComponents,
  validateVersion,
  startNextVersion,
  CONFIG_OPTIONS,
} from './product-model.js';

const el = (id) => document.getElementById(id);
const versionId = new URLSearchParams(location.search).get('id');

const state = { product: null, version: null, library: [], acordForms: [], release: null, open: new Set(), dirty: false };
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
  refreshStatus();
};
const markClean = () => {
  state.dirty = false;
  showSaveState();
};

// Update the per-coverage badges and the overall progress without re-rendering (keeps input focus).
const refreshStatus = () => {
  const all = allCoverages(components());
  let done = 0;
  all.forEach((cov) => {
    const issues = coverageIssues(cov);
    if (!issues.length) done += 1;
    const badge = host.querySelector(`[data-status="${CSS.escape(cov.id)}"]`);
    if (!badge) return;
    badge.className = `badge sum-status ${issues.length ? 'warn' : 'ok'}`;
    badge.textContent = issues.length ? `Needs ${issues[0]}${issues.length > 1 ? ` +${issues.length - 1}` : ''}` : 'Complete';
  });
  el('progress').textContent = all.length ? `${done} of ${all.length} coverages complete` : '';
};

// ---- path helpers: "components.0.classes.1.coverages.2.limit" ----
const walk = (path) => path.split('.').reduce((obj, key) => obj[key], state.version);
const setPath = (path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((obj, key) => obj[key], state.version)[last] = value;
};

// ---- small renderers ----
const money = (v) => (v === '' || v == null || Number.isNaN(+v) ? '' : Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }));

const addRowBtn = (path, template, label) =>
  `<button class="action" type="button" data-act="add-row" data-path="${path}" data-row="${esc(JSON.stringify(template))}">+ ${label}</button>`;

const checkList = (path, options, selected) =>
  `<div class="check-cols">${options
    .map(([value, label]) => `<label><input type="checkbox" data-check="${path}" value="${esc(value)}"${selected.includes(value) ? ' checked' : ''}> ${esc(label)}</label>`)
    .join('')}</div>`;

// Segmented Yes / No control.
const segmented = (path, value, choices) =>
  `<div class="seg" role="radiogroup">${choices
    .map(([val, label]) => `<label><input type="radio" name="${path}" data-path="${path}" value="${val}"${value === val ? ' checked' : ''}><span>${label}</span></label>`)
    .join('')}</div>`;

// "Underwriter can override" switch; when on, the admin sets the minimum and maximum the underwriter may use.
const overrideControl = (togglePath, minPath, maxPath, o, unit) => {
  const pct = unit === '%';
  const field = (path, value, label) => `<label class="ov-field"><span>${label}</span>
      <input data-path="${path}" type="number" min="0" ${pct ? 'max="100" step="any"' : 'inputmode="numeric"'} placeholder="${pct ? 'Percent' : 'Amount'}" aria-label="Override ${label.toLowerCase()}" value="${esc(value)}">
      <span class="fmt" ${pct ? '' : 'data-fmt'}>${pct ? '%' : esc(money(value))}</span></label>`;
  return `<div class="override">
    <label class="switch"><input type="checkbox" data-flag="${togglePath}" data-rerender${o.enabled ? ' checked' : ''}><span class="slider"></span><span class="switch-label">Underwriter can override</span></label>
    ${
      o.enabled
        ? `<div class="ov-range">${field(minPath, o.min, 'Minimum')}${field(maxPath, o.max, 'Maximum')}</div>
          <p class="hint-line">The underwriter can set this anywhere between the minimum and maximum. The value above must sit inside that range.</p>`
        : ''
    }
  </div>`;
};

const amountChips = (path, amounts) =>
  `<div class="chips" style="margin:6px 0 10px"><span class="muted" style="margin:0 4px 0 0;align-self:center">Quick pick:</span>${amounts
    .map(([label, amount]) => `<button type="button" class="chip" data-act="set-amount" data-path="${path}" data-amount="${amount}">${label}</button>`)
    .join('')}</div>`;

const jurisdictionSummary = (j) => {
  const included = US_STATES.length - j.excludedStates.length;
  const { valid, invalid } = parseZips(j.excludedZips);
  const parts = [
    included === US_STATES.length ? `All ${US_STATES.length} states included` : `${included} of ${US_STATES.length} states included`,
    valid.length ? `${valid.length} zip ${valid.length === 1 ? 'exclusion' : 'exclusions'}` : 'all zip codes included',
  ];
  if (invalid.length) parts.push(`⚠ not valid: ${invalid.join(', ')}`);
  if (included === 0) parts.push('⚠ at least one state must be included');
  return parts.join(' · ');
};

// A question card, configured the same way as in the Acord form builder.
const questionCard = (q, i, path, count) => {
  const p = `${path}.${i}`;
  return `<div class="ac-q q-card" data-qi="${i}">
    <div class="ac-q-row">
      <input class="ac-input" data-path="${p}.label" placeholder="Question text" aria-label="Question text" value="${esc(q.label)}">
      <select class="ac-select" data-path="${p}.type" aria-label="Answer type">${QUESTION_TYPES.map((t) => `<option value="${t.value}"${t.value === q.type ? ' selected' : ''}>${t.label}</option>`).join('')}</select>
    </div>
    <input class="ac-input" data-path="${p}.help" style="margin-top:8px" placeholder="Help text (optional)" aria-label="Help text" value="${esc(q.help)}">
    ${
      QUESTION_HAS_OPTIONS.includes(q.type)
        ? `<div class="ac-q-options"><div class="ac-hint">Options — one per line</div>
            <textarea class="ac-textarea" data-qopts="${p}.options" placeholder="Option 1&#10;Option 2" aria-label="Options">${esc(q.options.join('\n'))}</textarea></div>`
        : ''
    }
    <div class="ac-q-meta">
      <label class="ac-choice"><input type="checkbox" data-flag="${p}.required"${q.required ? ' checked' : ''}> Required</label>
      <span class="spacer"></span>
      <button type="button" class="ac-icon" data-act="q-move" data-path="${path}" data-i="${i}" data-d="-1"${i === 0 ? ' disabled' : ''} aria-label="Move up">↑</button>
      <button type="button" class="ac-icon" data-act="q-move" data-path="${path}" data-i="${i}" data-d="1"${i === count - 1 ? ' disabled' : ''} aria-label="Move down">↓</button>
      <button type="button" class="ac-icon danger" data-act="del-row" data-path="${path}" data-i="${i}">Remove</button>
    </div>
  </div>`;
};

const questionPreview = (questions) =>
  questions
    .map(
      (q) => `<div class="ac-preview-q ac-field">
        ${q.type === 'checkbox' ? '' : `<label class="ac-label">${esc(q.label || 'Untitled question')}${q.required ? '<span class="req">*</span>' : ''}</label>`}
        ${renderControl({ ...q, options: q.options ?? [] }, `_${q.id}`)}
        ${q.help ? `<div class="ac-help">${esc(q.help)}</div>` : ''}
      </div>`,
    )
    .join('');

// The input(s) for one configuration option.
const optionBody = (cov, def, base) => {
  const path = `${base}.${def.field}`;
  const value = cov[def.field];
  switch (def.kind) {
    case 'jurisdiction':
      return `<div class="juris" data-jpath="${path}">
        <p class="juris-sum" data-jsum>${esc(jurisdictionSummary(value))}</p>
        <p class="muted" style="margin:0 0 6px">Untick a state to exclude it.
          <button type="button" class="mini" data-act="states-all" data-path="${path}.excludedStates">Include all</button>
          <button type="button" class="mini" data-act="states-none" data-path="${path}.excludedStates">Exclude all</button></p>
        <div class="check-cols states">${US_STATES.map((st) => `<label><input type="checkbox" data-incl="${path}.excludedStates" value="${st}"${value.excludedStates.includes(st) ? '' : ' checked'}> ${st}</label>`).join('')}</div>
        <label class="mini-label" for="zip-${esc(cov.id)}">Exclude zip codes <span class="muted" style="margin:0">(optional)</span></label>
        <textarea class="search-box" id="zip-${esc(cov.id)}" data-path="${path}.excludedZips" rows="2" placeholder="e.g. 90210, 10001, 33101-33199" aria-label="Excluded zip codes">${esc(value.excludedZips)}</textarea>
        <p class="hint-line">Separate with commas, spaces or new lines. Use a range like 33101-33199 for a block of codes.</p>
      </div>`;
    case 'amount':
      return `${amountChips(path, [['$100K', 100000], ['$250K', 250000], ['$500K', 500000], ['$1M', 1000000], ['$2M', 2000000]])}
        <div class="row-line" style="max-width:360px">
          <input data-path="${path}" type="number" min="0" inputmode="numeric" placeholder="Amount" aria-label="Limit amount" value="${esc(value)}">
          <span class="fmt" data-fmt>${esc(money(value))}</span>
        </div>
        ${overrideControl(`${base}.limitOverride.enabled`, `${base}.limitOverride.min`, `${base}.limitOverride.max`, cov.limitOverride, '$')}`;
    case 'deductible': {
      const type = value.type;
      return `<div class="row-line" style="max-width:520px">
        <select data-path="${path}.type" aria-label="Deductible type" style="max-width:200px">
          <option value="">Select type</option>
          ${DEDUCTIBLE_TYPES.map((t) => `<option${type === t ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
        ${type === 'Fixed' ? `<input data-path="${path}.value" type="number" min="0" inputmode="numeric" placeholder="Amount" aria-label="Deductible amount" value="${esc(value.value)}"><span class="fmt" data-fmt>${esc(money(value.value))}</span>` : ''}
        ${
          type === 'Percentage'
            ? `<input data-path="${path}.value" type="number" min="0" max="100" step="any" placeholder="Percent" aria-label="Deductible percent" value="${esc(value.value)}"><span class="fmt">%</span>
               <label class="ov-field"><span>of</span><select data-path="${path}.basis" aria-label="Deductible basis">
                 <option value="">Select basis</option>${DEDUCTIBLE_BASES.map((b) => `<option${value.basis === b ? ' selected' : ''}>${b}</option>`).join('')}</select></label>`
            : ''
        }
        ${type === 'None' ? '<span class="muted" style="margin:0">No deductible — zero.</span>' : ''}
      </div>
      ${type === 'Fixed' || type === 'Percentage' ? overrideControl(`${path}.override.enabled`, `${path}.override.min`, `${path}.override.max`, value.override, type === 'Fixed' ? '$' : '%') : ''}`;
    }
    case 'claims': {
      const sel = (field, label, choices) => `<div class="field"><label>${label}</label>
        <select class="search-box" data-path="${path}.${field}" aria-label="${label}"><option value="">Select ${label.toLowerCase()}</option>
        ${choices.map((c) => `<option${value[field] === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>`;
      return `<div class="fields">
        ${sel('lossBasis', 'Loss basis', LOSS_BASES)}
        ${sel('benefitBasis', 'Benefit basis', BENEFIT_BASES)}
        <div class="field"><label>Claims notification period</label>
          <div class="row-line" style="margin:0">
            <input data-path="${path}.notice.value" type="number" min="0" inputmode="numeric" placeholder="e.g. 14" aria-label="Claims notification period" value="${esc(value.notice.value)}" style="max-width:110px">
            <select data-path="${path}.notice.unit" aria-label="Notification period unit" style="max-width:120px">${NOTICE_UNITS.map((u) => `<option${value.notice.unit === u ? ' selected' : ''}>${u}</option>`).join('')}</select>
          </div></div>
      </div>
      <div class="ov-card">
        <div><strong>Underwriter can override claims behaviour</strong><span class="muted" style="display:block;margin:2px 0 0">Allows the underwriter to change the claims behaviour for this cover at quote time.</span></div>
        <label class="switch"><input type="checkbox" data-flag="${path}.override.enabled" data-rerender${value.override.enabled ? ' checked' : ''}><span class="slider"></span><span class="switch-label">${value.override.enabled ? 'Enabled' : 'Disabled'}</span></label>
      </div>`;
    }
    case 'yesno':
      return segmented(path, value, [['Yes', 'Yes'], ['No', 'No']]);
    case 'select':
      return `<select class="search-box" data-path="${path}" aria-label="${esc(def.label)}" style="max-width:360px">
        <option value="">Select ${esc(def.label.toLowerCase())}</option>
        ${def.choices.map((c) => { const [v, l] = Array.isArray(c) ? c : [c, c]; return `<option value="${esc(v)}"${value === v ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}
      </select>`;
    case 'multi':
      return `<p class="muted" style="margin:0 0 6px">
          <button type="button" class="mini" data-act="multi-all" data-path="${path}" data-key="${def.key}">Select all</button>
          <button type="button" class="mini" data-act="multi-none" data-path="${path}">Clear</button></p>
        ${checkList(path, def.choices.map((c) => [c, c]), value)}`;
    case 'text':
      return `<textarea class="search-box" data-path="${path}" rows="3" maxlength="500" placeholder="Conditions, exclusions or waiting periods" aria-label="Terms">${esc(value)}</textarea>`;
    case 'questions':
      return `<div data-qroot data-qpath="${path}">
        ${value.map((q, i) => questionCard(q, i, path, value.length)).join('')}
        <button class="action" type="button" data-act="q-add" data-path="${path}">+ Add question</button>
        ${value.length ? `<details class="q-preview"><summary>Preview how these questions look</summary><div data-qpreview>${questionPreview(value)}</div></details>` : ''}
      </div>`;
    case 'forms':
      if (readOnly()) {
        // Controls inside the read-only fieldset are disabled, so use links for Preview.
        return value.length
          ? `<div class="opt-list">${value
              .map((a) => {
                const f = state.acordForms.find((x) => x.id === a.formId);
                return f ? `<div class="opt-row" style="cursor:default"><div class="opt-main"><strong>${esc(f.name)}</strong></div><a class="action" href="#" role="button" data-preview-form="${esc(a.formId)}" data-cov="${esc(cov.id)}">Preview</a></div>` : '';
              })
              .join('')}</div>`
          : '<p class="muted">No forms attached.</p>';
      }
      return `<div data-forms-host="${esc(cov.id)}"></div>`;
    default:
      return '';
  }
};

const hasValue = (cov, def) => {
  const v = cov[def.field];
  switch (def.kind) {
    case 'amount':
      return v !== '';
    case 'deductible':
      return Boolean(v?.type);
    case 'jurisdiction':
      return false;
    case 'claims':
      return Boolean(v?.lossBasis || v?.benefitBasis || v?.notice?.value !== '');
    case 'yesno':
    case 'select':
    case 'text':
      return Boolean(v);
    default:
      return Array.isArray(v) && v.length > 0;
  }
};

// Other coverages that have been started, offered as a copy source.
const copySources = (cov) =>
  state.version.components.flatMap((c) =>
    c.classes.flatMap((k) =>
      k.coverages.filter((x) => x.id !== cov.id && x.party).map((x) => ({ id: x.id, label: `${c.name} › ${k.name} › ${x.name}` })),
    ),
  );

// Fields that "Copy settings" carries over.
const COPY_FIELDS = ['party', 'limitOverride', ...CONFIG_OPTIONS.map((o) => o.field)];

// One separate, numbered section per configuration option, in catalogue order.
const panel = (cov, def, required, n, base) => {
  const head = `<span class="cfg-num">${n}</span>
    <span class="cfg-title"><strong>${esc(def.label)}</strong><span class="muted">${esc(def.hint)}</span></span>
    <span class="cfg-tag ${required ? 'req-tag' : 'opt-tag'}">${required ? 'Required' : 'Optional'}</span>`;
  if (required) return `<section class="cfg-panel"><div class="cfg-head">${head}</div><div class="cfg-body">${optionBody(cov, def, base)}</div></section>`;
  const k = `opt-${cov.id}-${def.key}`;
  return `<details class="cfg-panel" data-key="${k}"${state.open.has(k) || hasValue(cov, def) ? ' open' : ''}>
    <summary class="cfg-head">${head}</summary><div class="cfg-body">${optionBody(cov, def, base)}</div></details>`;
};

// "Requires A, B" badge from the same-class relationships set on the Components page.
const requiresBadge = (cov, ci, ki) => {
  const siblings = components()[ci].classes[ki].coverages;
  const names = (cov.requires ?? []).map((id) => siblings.find((c) => c.coverageId === id)?.name).filter(Boolean);
  return names.length ? `<span class="badge" title="If this coverage is bought, these must be bought too">Requires ${esc(names.join(', '))}</span>` : '';
};

const coverageBox = (cov, ci, ki, vi) => {
  const base = `components.${ci}.classes.${ki}.coverages.${vi}`;
  const sources = readOnly() ? [] : copySources(cov);
  // Third-party coverages don't attach to a risk object, so that section is left out.
  const options = (cov.configOptions ?? DEFAULT_OPTIONS).filter((o) => !(o.key === 'riskObjects' && cov.party === 'Third party'));

  const partyPanel = `<section class="cfg-panel start"><div class="cfg-head">
      <span class="cfg-num">★</span>
      <span class="cfg-title"><strong>Who does this coverage protect?</strong><span class="muted">${cov.party ? 'You can change this at any time.' : 'Answer this first — the rest of the configuration depends on it.'}</span></span>
      <span class="cfg-tag req-tag">Required</span></div>
    <div class="cfg-body"><div class="wiz-options">${PARTIES.map(
      (p) => `<label class="wiz-option${cov.party === p.value ? ' selected' : ''}"><input type="radio" name="${base}.party" data-path="${base}.party" value="${p.value}"${cov.party === p.value ? ' checked' : ''}>
        <span><strong>${p.value}</strong><br>${esc(p.hint)}</span></label>`,
    ).join('')}</div></div></section>`;

  const panels = options
    .map((o, i) => {
      const def = optionDef(o.key);
      return def ? panel(cov, def, o.required, i + 1, base) : '';
    })
    .join('');

  const bits = [];
  if (cov.limit !== '' && cov.limit != null) bits.push(`${money(cov.limit)} limit`);
  bits.push(`${options.length} ${options.length === 1 ? 'section' : 'sections'}`);

  return `<details class="cov-box" data-key="${esc(cov.id)}"${state.open.has(cov.id) ? ' open' : ''}>
    <summary>
      <strong>${esc(cov.name)}</strong>
      ${cov.party ? `<span class="badge">${esc(cov.party)}</span>` : ''}
      ${cov.mandatory ? '<span class="badge warn" title="Mandatory to sell">Required to sell</span>' : ''}
      ${requiresBadge(cov, ci, ki)}
      <span class="sum-meta">${bits.join(' · ')}</span>
      <span class="badge sum-status" data-status="${esc(cov.id)}"></span>
    </summary>
    <div class="cov-body">
      ${
        sources.length
          ? `<div class="copy-bar"><span class="muted" style="margin:0">Save time: start from another coverage's settings.</span>
              <select class="search-box" id="copy-${esc(cov.id)}" aria-label="Copy settings from"><option value="">Choose a coverage…</option>${sources.map((x) => `<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('')}</select>
              <button class="action" type="button" data-act="copy" data-id="${esc(cov.id)}">Copy settings</button></div>`
          : ''
      }
      <div class="cfg-stack">
        ${partyPanel}
        ${cov.party ? panels : ''}
        ${cov.party && !options.length ? '<div class="wiz-note">This coverage has no configuration sections. Choose some on the Coverage page if it needs any.</div>' : ''}
        ${cov.party ? '<div class="plan-note">Rating plan: attached in the next phase.</div>' : ''}
      </div>
    </div>
  </details>`;
};

const componentCard = (comp, ci) => `<section class="card comp-card">
  <div class="page-header" style="margin-bottom:6px">
    <div><h2 style="margin:0">${esc(comp.name)}</h2><span class="badge">${esc(comp.lob)}</span></div>
  </div>
  ${
    comp.classes
      .map(
        (k, ki) => `<div class="card section-card">
          <div class="section-head"><h3>Class of business: ${esc(k.name)}</h3><span class="badge">${k.coverages.length} ${k.coverages.length === 1 ? 'coverage' : 'coverages'}</span></div>
          ${k.coverages.map((cov, vi) => coverageBox(cov, ci, ki, vi)).join('') || '<div class="wiz-note">No coverages attached to this class of business.</div>'}
        </div>`,
      )
      .join('') || '<div class="wiz-note">No classes of business yet. Go back to Components to add some.</div>'
  }
</section>`;

// ---- Acord forms: preview and edit ----
const mainEl = el('main');

// Preview shows the form as this coverage will use it (fields left out for this product are hidden).
const previewForm = (formId, cov) => {
  const f = state.acordForms.find((x) => x.id === formId);
  if (!f) return;
  const excluded = cov?.forms.find((a) => a.formId === formId)?.excluded ?? [];
  const shown = { ...f, sections: f.sections.map((s) => ({ ...s, questions: s.questions.filter((q) => !excluded.includes(q.id)) })).filter((s) => s.questions.length) };
  openBuilder({ form: shown, preview: true, returnTo: mainEl, onExit: render });
};

// Editing changes the form itself, so it applies everywhere the form is used.
const editForm = (f) =>
  openBuilder({
    form: f,
    returnTo: mainEl,
    notice: 'Changes to this form apply everywhere it is used, including other coverages and products.',
    onSaved: async () => {
      state.acordForms = await api('acord_forms').list();
    },
    onExit: render,
  });

// The forms picker needs real DOM hosts, so it is mounted after each render.
const mountPickers = () => {
  const covs = allCoverages(components());
  host.querySelectorAll('[data-forms-host]').forEach((node) => {
    const cov = covs.find((c) => c.id === node.dataset.formsHost);
    if (!cov) return;
    createFormPicker(node, {
      forms: state.acordForms,
      selected: cov.forms,
      onChange: markDirty,
      onPreviewForm: (f) => previewForm(f.id, cov),
      onEditForm: (f) => editForm(f),
    }).render();
  });
};

const render = () => {
  const { product, version } = state;
  const back = `/product-version.html?id=${encodeURIComponent(version.id)}`;
  document.title = `Coverage configuration · ${product.name} ${version.label}`;
  el('crumbProduct').textContent = product.name;
  el('crumbVersion').textContent = version.label;
  el('crumbVersionLink').href = back;
  el('backStep').href = back;
  el('backBtn').href = back;
  el('title').textContent = `${product.name} · ${version.label}`;
  el('subtitle').textContent = `${product.productId} · ${product.carrier} · ${product.arrangement}`;
  el('status').textContent = version.status;
  el('saveDraft').hidden = el('publish').hidden = readOnly();
  el('bulkBar').hidden = !components().length;
  el('newVersion').hidden = !readOnly();
  el('components').innerHTML =
    (readOnly()
      ? `<div class="notice-bar"><div class="notice-content"><strong>This version is published and read-only.</strong><p>Published as release ${esc(state.release?.releaseNumber ?? '')}. Create a new version to make changes.</p></div></div>`
      : '') +
    `<fieldset class="plain"${readOnly() ? ' disabled' : ''}>${components().map(componentCard).join('') || '<div class="card"><div class="wiz-note">No components yet.</div></div>'}</fieldset>`;
  mountPickers();
  showSaveState();
  refreshStatus();
};

// ---- persistence ----
const saveDraft = async () => {
  state.version = await api('product_versions').update(state.version.id, { components: components(), updatedAt: new Date().toISOString() });
  if (state.product.status === 'Draft') {
    state.product = await api('products').update(state.product.id, { lineOfBusiness: lobsOf(components()).join(', '), version: state.version.label });
  }
  markClean();
};

const publish = async () => {
  const errors = validateVersion(components());
  showErrors(errors);
  if (errors.length) {
    // Open every coverage that still needs work so the gaps are visible.
    components().forEach((c) => c.classes.forEach((k) => k.coverages.forEach((cov) => coverageIssues(cov).length && state.open.add(cov.id))));
    render();
    return;
  }
  if (!confirm(`Publish ${state.product.name} ${state.version.label} as a release? It becomes read-only.`)) return;
  const now = new Date().toISOString();
  const { product, version } = state;
  const release = await api('product_releases').create({
    productRef: product.id,
    versionId: version.id,
    label: version.label,
    releaseNumber: `${product.productId}-${version.label}`,
    snapshot: { components: clone(components()) },
    publishedAt: now,
  });
  state.version = await api('product_versions').update(version.id, {
    components: components(),
    status: 'Published',
    publishedAt: now,
    updatedAt: now,
    releaseId: release.id,
  });
  state.product = await api('products').update(product.id, {
    status: 'Published',
    version: version.label,
    lineOfBusiness: lobsOf(components()).join(', '),
    effectiveDate: now.slice(0, 10),
  });
  state.release = release;
  markClean();
  render();
  toast(`Published as release ${release.releaseNumber}.`);
};

const guarded = (fn) => async () => {
  try {
    await fn();
  } catch (err) {
    showErrors([err.message]);
  }
};

// ---- events ----
const host = el('components');
// The ACORD forms picker manages its own events inside its host.
const inPicker = (t) => Boolean(t.closest('[data-forms-host]'));

// Keep the jurisdiction summary and zip message live without re-rendering.
const refreshJurisdiction = (t) => {
  const box = t.closest('.juris');
  if (!box) return;
  box.querySelector('[data-jsum]').textContent = jurisdictionSummary(walk(box.dataset.jpath));
};

// Keep the question preview in step with what is typed, without re-rendering.
const refreshQuestionPreview = (t) => {
  const root = t.closest('[data-qroot]');
  const node = root?.querySelector('[data-qpreview]');
  if (node) node.innerHTML = questionPreview(walk(root.dataset.qpath));
};

host.addEventListener('input', (event) => {
  const t = event.target;
  if (inPicker(t)) return;
  if (t.dataset.qopts) {
    setPath(t.dataset.qopts, t.value.split('\n').map((o) => o.trim()).filter(Boolean));
    refreshQuestionPreview(t);
    markDirty();
  } else if (t.dataset.path && t.type !== 'checkbox') {
    setPath(t.dataset.path, t.value);
    const fmt = t.parentElement.querySelector('[data-fmt]');
    if (fmt && t.type === 'number') fmt.textContent = money(t.value);
    refreshJurisdiction(t);
    refreshQuestionPreview(t);
    markDirty();
  }
});

host.addEventListener('change', (event) => {
  const t = event.target;
  if (inPicker(t)) return;
  if (t.dataset.check) {
    const list = new Set(walk(t.dataset.check));
    t.checked ? list.add(t.value) : list.delete(t.value);
    setPath(t.dataset.check, [...list]);
    markDirty();
  } else if (t.dataset.incl) {
    // Ticked = included, so the stored list is the excluded states.
    const excluded = new Set(walk(t.dataset.incl));
    t.checked ? excluded.delete(t.value) : excluded.add(t.value);
    setPath(t.dataset.incl, US_STATES.filter((st) => excluded.has(st)));
    refreshJurisdiction(t);
    markDirty();
  } else if (t.dataset.flag) {
    setPath(t.dataset.flag, t.checked);
    markDirty();
    if ('rerender' in t.dataset) render();
  } else if (t.type === 'radio' && t.dataset.path?.endsWith('.party')) {
    setPath(t.dataset.path, t.value);
    // Third-party coverages have no risk objects; drop any that were picked.
    if (t.value === 'Third party') setPath(t.dataset.path.replace(/\.party$/, '.riskObjectTypes'), []);
    markDirty();
    render();
  } else if (t.dataset.path?.endsWith('.deductible.type')) {
    setPath(t.dataset.path, t.value);
    setPath(t.dataset.path.replace(/\.type$/, '.value'), '');
    setPath(t.dataset.path.replace(/\.type$/, '.basis'), t.value === 'Percentage' ? 'Claim Amount' : '');
    setPath(t.dataset.path.replace(/\.type$/, '.override.min'), '');
    setPath(t.dataset.path.replace(/\.type$/, '.override.max'), '');
    markDirty();
    render();
  } else if (t.tagName === 'SELECT' && t.dataset.path) {
    setPath(t.dataset.path, t.value);
    markDirty();
    if (t.closest('.q-card') && t.dataset.path.endsWith('.type')) render();
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

host.addEventListener('click', (event) => {
  const link = event.target.closest('[data-preview-form]');
  if (link) {
    event.preventDefault();
    const cov = allCoverages(components()).find((c) => c.id === link.dataset.cov);
    return previewForm(link.dataset.previewForm, cov);
  }
  const btn = event.target.closest('[data-act]');
  if (!btn || inPicker(btn)) return;
  const { act, path } = btn.dataset;
  if (act === 'add-row') walk(path).push(JSON.parse(btn.dataset.row));
  else if (act === 'del-row') walk(path).splice(Number(btn.dataset.i), 1);
  else if (act === 'q-add') walk(path).push(blankQuestion());
  else if (act === 'q-move') {
    const list = walk(path);
    const i = Number(btn.dataset.i);
    const j = i + Number(btn.dataset.d);
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  } else if (act === 'set-amount') setPath(path, btn.dataset.amount);
  else if (act === 'states-all') setPath(path, []);
  else if (act === 'states-none') setPath(path, [...US_STATES]);
  else if (act === 'multi-all') setPath(path, [...optionDef(btn.dataset.key).choices]);
  else if (act === 'multi-none') setPath(path, []);
  else if (act === 'copy') {
    const target = allCoverages(components()).find((c) => c.id === btn.dataset.id);
    const source = allCoverages(components()).find((c) => c.id === el(`copy-${btn.dataset.id}`).value);
    if (!source) return showErrors(['Choose a coverage to copy from.']);
    showErrors([]);
    Object.assign(target, clone(Object.fromEntries(COPY_FIELDS.map((f) => [f, source[f]]))));
    toast(`Copied settings from ${source.name}. Review and adjust as needed.`);
  } else return;
  markDirty();
  render();
});

const setAllOpen = (open) => {
  components().forEach((c) => c.classes.forEach((k) => k.coverages.forEach((cov) => (open ? state.open.add(cov.id) : state.open.delete(cov.id)))));
  render();
};
el('expandAll').addEventListener('click', () => setAllOpen(true));
el('collapseAll').addEventListener('click', () => setAllOpen(false));

el('saveDraft').addEventListener(
  'click',
  guarded(async () => {
    showErrors([]);
    await saveDraft();
    toast('Draft saved.');
  }),
);

el('publish').addEventListener(
  'click',
  guarded(async () => {
    if (state.dirty) await saveDraft();
    await publish();
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
    const [product, coverages, acordForms, release] = await Promise.all([
      api('products').get(state.version.productRef),
      api('coverages').list(),
      api('acord_forms').list(),
      state.version.releaseId ? api('product_releases').get(state.version.releaseId) : null,
    ]);
    state.library = coverages;
    state.acordForms = acordForms;
    normalizeComponents(components());
    Object.assign(state, { product, release });
    components().forEach((c) =>
      c.classes.forEach((k) => k.coverages.forEach((cov) => hydrateCoverage(cov, state.library.find((l) => l.id === cov.coverageId), !readOnly()))),
    );
    // Open the first coverage so the page isn't a wall of collapsed rows.
    const first = components().flatMap((c) => c.classes.flatMap((k) => k.coverages))[0];
    if (first) state.open.add(first.id);
    render();
  } catch (err) {
    el('title').textContent = 'Product version not found';
    showErrors([err.message]);
  }
})();
