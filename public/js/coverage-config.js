import { api } from './api.js';
import { createFormPicker } from './form-picker.js';
import { renderControl } from './form-render.js';
import { openBuilder } from './form-builder.js';
import { loadFormVersions, formFor, versionLabel } from './form-versions.js';
import { mountEligibility, eligibilityIssues } from './eligibility.js';
import { mountRater, raterIssues } from './rater.js';
import { mountFactors, factorIssues, codeCounts, collectFactorGroups, scopeFactorsToCoverages } from './factors.js';
import { mountAccountFactors } from './account-factors.js';
import { mountComboFactors } from './combo-factors.js';
import { comboIssues, comboProblems, comboContext } from './combo-factor-calc.js';
import { accountFactorIssues } from './account-factor-calc.js';
import { mountFormula, formulaIssues } from './formula.js';
import { getRole } from './role.js';
import { USES, questionHandle, formHandle, toggleUse, confirmUntick } from './question-uses.js';
import {
  QUESTION_TYPES,
  QUESTION_HAS_OPTIONS,
  blankQuestion,
  US_STATES,
  productStates,
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
const params = new URLSearchParams(location.search);
// ?id= opens a product version (the carrier's draft); ?dv= opens a version distributed to an organisation.
const versionId = params.get('id');
const distId = params.get('dv');
const isDist = Boolean(distId);
const versionApi = () => api(isDist ? 'distributed_versions' : 'product_versions');

const state = { product: null, version: null, library: [], acordForms: [], release: null, open: new Set(), dirty: false };
// A distributed version is read-only, except that the MGU it was distributed to sets up the rating (steps 5-8) of a fronting product.
const canRate = () => {
  const role = getRole();
  return isDist && fronting() && role.role === 'MGU' && role.orgId === state.version?.organisationId && state.version?.status === 'Active';
};
const readOnly = () => (isDist ? !(canRate() && stepNow() >= 5) : state.version?.status === 'Published');
// Step 2 = coverage configuration, step 3 = questions, step 4 = eligibility rules, step 5 = rater setup, step 6 = rating factors, step 7 = account-level factors, step 8 = premium formula.
const stepNow = () => state.step ?? 2;
// A fronting product is rated by the MGU, so the carrier never sets up the rater, factors or formula.
const fronting = () => state.product?.arrangement === 'Fronting';
// The carrier's own version of a fronting product stops before the rater; the MGU's distributed copy has it.
const skipRating = () => fronting() && !isDist;
const lastStep = () => (skipRating() ? 4 : 8);
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
  if (readOnly()) node.textContent = isDist ? 'Read-only' : 'Published · read-only';
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
const paintStrip = () => {
  const all = allCoverages(components());
  const done = all.filter((cov) => !coverageIssues(cov, allowedStates()).length).length;
  el('bulkBar').innerHTML = `<div class="grow"><div class="line"><strong>${done} of ${all.length} coverages complete</strong><span class="muted" style="margin:0">${all.length - done} to go</span></div>
      <div class="ws-bar" style="height:8px;margin:0"><div id="progressBar" style="width:${all.length ? Math.round((done / all.length) * 100) : 0}%"></div></div></div>
    <label><input type="checkbox" id="attOnly"${state.attention ? ' checked' : ''}> Show only coverages that need attention</label>`;
};
const refreshStatus = () => {
  const all = allCoverages(components());
  all.forEach((cov) => {
    const { ok, tag } = nodeInfo(cov);
    const node = host.querySelector(`[data-node="${CSS.escape(cov.id)}"]`);
    if (node) {
      node.querySelector('.dot').className = `dot${ok ? ' ok' : ''}`;
      const t = node.querySelector('.tag');
      t.className = `tag${ok ? ' ok' : ''}`;
      t.textContent = tag;
    }
    const pill = host.querySelector(`[data-status="${CSS.escape(cov.id)}"]`);
    if (pill) {
      pill.className = `pill ${ok ? 'ok' : 'warn'}`;
      pill.textContent = ok ? 'Complete' : tag;
    }
    if (cov.id === state.selCov) {
      tabsFor(cov).forEach((t) => {
        const dot = host.querySelector(`[data-tabkey="${t.key}"] .dot`);
        if (dot) dot.className = `dot ${tabTone(cov, t)}`;
      });
    }
  });
  if (stepNow() === 2 && el('bulkBar').querySelector('#progressBar')) paintStrip();
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

// A coverage can only use the states its product version is available in.
const allowedStates = () => productStates(state.version);

const jurisdictionSummary = (j) => {
  const allowed = allowedStates();
  const included = allowed.filter((st) => !j.excludedStates.includes(st)).length;
  const { valid, invalid } = parseZips(j.excludedZips);
  const parts = [
    included === allowed.length ? `All ${allowed.length} product ${allowed.length === 1 ? 'state' : 'states'} included` : `${included} of ${allowed.length} product states included`,
    valid.length ? `${valid.length} zip ${valid.length === 1 ? 'exclusion' : 'exclusions'}` : 'all zip codes included',
  ];
  if (invalid.length) parts.push(`⚠ not valid: ${invalid.join(', ')}`);
  if (included === 0) parts.push('⚠ at least one state must be included');
  return parts.join(' · ');
};

// A question card, configured the same way as in the Acord form builder.
const questionCard = (q, i, path, count, scope = '') => {
  const p = `${path}.${i}`;
  return `<div class="ac-q q-card" data-qi="${i}">
    <div class="ac-q-row">
      <input class="ac-input" data-path="${p}.label" placeholder="Question text" aria-label="Question text" value="${esc(q.label)}">
      <select class="ac-select" data-path="${p}.type" aria-label="Answer type">${QUESTION_TYPES.map((t) => `<option value="${t.value}"${t.value === q.type ? ' selected' : ''}>${t.label}</option>`).join('')}</select>
    </div>
    <input class="ac-input" data-path="${p}.help" style="margin-top:8px" placeholder="Help text (optional)" aria-label="Help text" value="${esc(q.help)}">
    ${scope}
    ${
      QUESTION_HAS_OPTIONS.includes(q.type)
        ? `<div class="ac-q-options"><div class="ac-hint">Options — one per line</div>
            <textarea class="ac-textarea" data-qopts="${p}.options" placeholder="Option 1&#10;Option 2" aria-label="Options">${esc(q.options.join('\n'))}</textarea></div>`
        : ''
    }
    <div class="ac-q-meta">
      <label class="ac-choice"><input type="checkbox" data-flag="${p}.required"${q.required ? ' checked' : ''}> Required</label>
      ${USES.map((u) => `<label class="ac-choice" title="${esc(u.hint)}"><input type="checkbox" data-quse="${p}" data-use="${u.key}"${questionHandle(q).uses()[u.key] ? ' checked' : ''}> ${u.short}</label>`).join('')}
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
        <p class="muted" style="margin:0 0 6px">Only the ${allowedStates().length} ${allowedStates().length === 1 ? 'state' : 'states'} this product version is available in ${allowedStates().length === 1 ? 'is' : 'are'} listed. Untick a state to exclude it.
          <button type="button" class="mini" data-act="states-all" data-path="${path}.excludedStates">Include all</button>
          <button type="button" class="mini" data-act="states-none" data-path="${path}.excludedStates">Exclude all</button></p>
        <div class="check-cols states">${allowedStates().map((st) => `<label><input type="checkbox" data-incl="${path}.excludedStates" value="${st}"${value.excludedStates.includes(st) ? '' : ' checked'}> ${st}</label>`).join('')}</div>
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
    case 'forms':
      if (readOnly()) {
        // Controls inside the read-only fieldset are disabled, so use links for Preview.
        return value.length
          ? `<div class="opt-list">${value
              .map((a) => {
                const f = formFor(a, state.acordForms);
                return f ? `<div class="opt-row" style="cursor:default"><div class="opt-main"><strong>${esc(f.name)}</strong> <span class="badge">${esc(versionLabel(a))}</span></div><a class="action" href="#" role="button" data-preview-form="${esc(a.formId)}" data-cov="${esc(cov.id)}">Preview</a></div>` : '';
              })
              .join('')}</div>`
          : '<p class="muted">No forms attached.</p>';
      }
      return `<div data-forms-host="${esc(cov.id)}"></div>`;
    default:
      return '';
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

// ---- Step 2: coverage tree on the left, the selected coverage's settings in tabs on the right ----
state.selCov = null;
state.cfgTab = 'party';
state.attention = false;
state.covFilter = '';

const covRefs = () =>
  components().flatMap((comp, ci) => comp.classes.flatMap((klass, ki) => klass.coverages.map((cov, vi) => ({ cov, comp, klass, ci, ki, vi }))));

// The tabs of one coverage: who it protects first, then each configuration section it uses.
const tabsFor = (cov) => {
  const options = (cov.configOptions ?? DEFAULT_OPTIONS).filter((o) => !(o.key === 'riskObjects' && cov.party === 'Third party'));
  return [{ key: 'party', label: 'Who is protected?' }, ...options.map((o) => ({ key: o.key, label: optionDef(o.key)?.label ?? o.key, required: o.required })).filter((t) => optionDef(t.key))];
};

// A tab shows a warning dot while the coverage still needs something in that section.
const tabTone = (cov, tab) => {
  const issues = coverageIssues(cov, allowedStates());
  if (tab.key === 'party') return cov.party ? 'ok' : 'warn';
  if (!cov.party) return 'off';
  const label = tab.label.toLowerCase();
  return issues.some((i) => i === label || i === `${label} override`) ? 'warn' : 'ok';
};

const nodeInfo = (cov) => {
  const issues = coverageIssues(cov, allowedStates());
  return { ok: !issues.length, tag: issues.length ? `Needs ${issues[0]}` : 'Done' };
};

const treeNode = (r) => {
  const { ok, tag } = nodeInfo(r.cov);
  return `<button type="button" class="cc-node" data-act="sel-cov" data-id="${esc(r.cov.id)}" data-node="${esc(r.cov.id)}" data-name="${esc(r.cov.name.toLowerCase())}" aria-current="${r.cov.id === state.selCov}">
    <span class="dot${ok ? ' ok' : ''}"></span><span class="nm">${esc(r.cov.name)}</span><span class="tag${ok ? ' ok' : ''}">${esc(tag)}</span></button>`;
};

const coverageTree = () => {
  const term = state.covFilter.trim().toLowerCase();
  const html = components()
    .map((comp, ci) => {
      const classes = comp.classes
        .map((klass, ki) => {
          const nodes = klass.coverages
            .map((cov, vi) => ({ cov, comp, klass, ci, ki, vi }))
            .filter((r) => (!state.attention || !nodeInfo(r.cov).ok) && (!term || r.cov.name.toLowerCase().includes(term)));
          return nodes.length ? `<div class="cc-cls"><div class="ws-sub">${esc(klass.name)}</div>${nodes.map(treeNode).join('')}</div>` : '';
        })
        .join('');
      return classes ? `<div><div class="cc-comp">${esc(comp.name)} <span>· ${esc(comp.lob)}</span></div>${classes}</div>` : '';
    })
    .join('');
  return `<nav class="cc-tree" aria-label="Coverages"><input class="search-box" type="search" data-ccsearch placeholder="Find a coverage…" aria-label="Find a coverage" value="${esc(state.covFilter)}">
    <div data-cctree>${html || '<div class="cc-empty" style="padding:12px">No coverages match.</div>'}</div></nav>`;
};

const partyBody = (cov, base) => `<div class="cc-intro"><strong>Who is protected?</strong><span>${cov.party ? 'You can change this at any time.' : 'Asked first. The rest of the configuration depends on it.'}</span></div>
  <div class="wiz-options">${PARTIES.map(
    (p) => `<label class="wiz-option${cov.party === p.value ? ' selected' : ''}"><input type="radio" name="${base}.party" data-path="${base}.party" value="${p.value}"${cov.party === p.value ? ' checked' : ''}>
      <span><strong>${p.value}</strong><br>${esc(p.hint)}</span></label>`,
  ).join('')}</div>`;

const coverageDetail = (r) => {
  const { cov, comp, klass, ci, ki, vi } = r;
  const base = `components.${ci}.classes.${ki}.coverages.${vi}`;
  const tabs = tabsFor(cov);
  if (!tabs.some((t) => t.key === state.cfgTab) || !cov.party) state.cfgTab = 'party';
  const idx = tabs.findIndex((t) => t.key === state.cfgTab);
  const tab = tabs[idx];
  const next = tabs[idx + 1];
  const def = optionDef(tab.key);
  const sources = readOnly() ? [] : copySources(cov);
  const { ok, tag } = nodeInfo(cov);
  const body = tab.key === 'party'
    ? partyBody(cov, base)
    : `<div class="cc-intro"><strong>${esc(def.label)} <span class="cfg-tag ${tab.required ? 'req-tag' : 'opt-tag'}" style="margin-left:6px">${tab.required ? 'Required' : 'Optional'}</span></strong><span>${esc(def.hint)}</span></div>${optionBody(cov, def, base)}`;
  return `<section class="cc-detail" aria-label="Coverage settings">
    <div class="cc-head">
      <div><h2>${esc(cov.name)}</h2><div class="sub">${esc(comp.name)} › ${esc(klass.name)}${cov.mandatory ? ' · Required to sell' : ''}${(cov.requires ?? []).length ? ' · ' + requiresText(cov, ci, ki) : ''}</div></div>
      <div class="actions"><span class="pill ${ok ? 'ok' : 'warn'}" data-status="${esc(cov.id)}">${esc(ok ? 'Complete' : tag)}</span></div>
    </div>
    <div class="cc-tabs" role="tablist" aria-label="Settings">${tabs
      .map((t) => `<button type="button" role="tab" class="cc-tab" data-act="cfg-tab" data-tab="${t.key}" data-tabkey="${t.key}" aria-selected="${t.key === state.cfgTab}"${!cov.party && t.key !== 'party' ? ' disabled' : ''}><span class="dot ${tabTone(cov, t)}"></span>${esc(t.label)}</button>`)
      .join('')}</div>
    <div class="cc-body"><fieldset class="plain" style="margin:0;padding:0;border:0;min-width:0"${readOnly() ? ' disabled' : ''}>
      ${sources.length && tab.key === 'party'
        ? `<div class="copy-bar" style="margin-bottom:16px"><span class="muted" style="margin:0">Save time: start from another coverage's settings.</span>
            <select class="search-box" id="copy-${esc(cov.id)}" aria-label="Copy settings from"><option value="">Choose a coverage…</option>${sources.map((x) => `<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('')}</select>
            <button class="action" type="button" data-act="copy" data-id="${esc(cov.id)}">Copy settings</button></div>`
        : ''}
      ${body}
    </fieldset></div>
    <div class="cc-foot"><span class="muted">Changes in this panel save with the draft</span>
      ${next && cov.party ? `<button type="button" class="action" style="border-color:#b84804;color:#b84804;font-weight:600" data-act="next-tab" data-tab="${next.key}">Next: ${esc(next.label)} →</button>` : ''}</div>
  </section>`;
};

const requiresText = (cov, ci, ki) => {
  const siblings = components()[ci].classes[ki].coverages;
  const names = (cov.requires ?? []).map((id) => siblings.find((c) => c.coverageId === id)?.name).filter(Boolean);
  return names.length ? `Requires ${esc(names.join(', '))}` : '';
};

const coverageWorkspace = () => {
  const refs = covRefs();
  if (!refs.length) return '<div class="card"><div class="wiz-note">No coverages attached. Go back to Components to add some.</div></div>';
  if (!refs.some((r) => r.cov.id === state.selCov)) state.selCov = (refs.find((r) => !nodeInfo(r.cov).ok) ?? refs[0]).cov.id;
  const cur = refs.find((r) => r.cov.id === state.selCov);
  return `<div class="ws-cols">${coverageTree()}${coverageDetail(cur)}</div>`;
};

// ---- Questions: product-level and coverage-specific ----
const coverageScopes = () =>
  components().flatMap((c, ci) =>
    c.classes.flatMap((k, ki) =>
      k.coverages.map((cov, vi) => ({ cov, label: `${c.name} › ${k.name} › ${cov.name}`, path: `components.${ci}.classes.${ki}.coverages.${vi}.questions` })),
    ),
  );

// "Applies to" moves a question between the whole product and a single coverage.
const scopeSelect = (current, srcPath, i) =>
  `<label class="q-scope"><span>Applies to</span><select data-qsrc="${srcPath}" data-i="${i}" aria-label="Question applies to">
    <option value="product"${current === 'product' ? ' selected' : ''}>Whole product</option>
    ${coverageScopes().map((s) => `<option value="${esc(s.cov.id)}"${current === s.cov.id ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}
  </select></label>`;

const questionList = (path, list, current) => `<div data-qroot data-qpath="${path}">
  ${list.map((q, i) => questionCard(q, i, path, list.length, scopeSelect(current, path, i))).join('') || '<div class="wiz-note">No questions yet.</div>'}
  <button class="action" type="button" data-act="q-add" data-path="${path}">+ Add question</button>
  ${list.length ? `<details class="q-preview"><summary>Preview how these questions look</summary><div data-qpreview>${questionPreview(list)}</div></details>` : ''}
</div>`;

const questionsSection = () => {
  const product = state.version.questions;
  const groups = coverageScopes();
  const total = product.length + groups.reduce((n, g) => n + g.cov.questions.length, 0);
  return `<section class="card" id="questionsSection">
    <div class="section-meta">Step 3</div>
    <h2>Questions <span class="badge">${total}</span></h2>
    <p class="muted">Questions asked when this product is quoted. Attach a question to the <strong>whole product</strong>, or to <strong>one coverage</strong> so it is only asked when that coverage is selected. Use “Applies to” on a question to move it. Tick what each question is used for: <strong>Eligibility</strong> questions appear in Eligibility rules, <strong>Rating factor</strong> questions in Rating factors. Stages can also add questions themselves.</p>
    <fieldset class="plain"${readOnly() ? ' disabled' : ''}>
      <div class="cfg-stack">
        <section class="cfg-panel start"><div class="cfg-head">
          <span class="cfg-num">★</span>
          <span class="cfg-title"><strong>Product-level questions</strong><span class="muted">Asked for every quote on this product, whichever coverages are chosen.</span></span>
          <span class="badge ${product.length ? 'ok' : ''}">${product.length}</span></div>
          <div class="cfg-body">${questionList('questions', product, 'product')}</div></section>
        <h3 style="margin:14px 0 0">Coverage-specific questions</h3>
        ${
          groups.length
            ? groups
                .map(({ cov, label, path }) => {
                  const key = `q-${cov.id}`;
                  return `<details class="cfg-panel" data-key="${key}"${state.open.has(key) || cov.questions.length ? ' open' : ''}>
                    <summary class="cfg-head"><span class="cfg-num">${cov.questions.length}</span>
                      <span class="cfg-title"><strong>${esc(cov.name)}</strong><span class="muted">${esc(label)}</span></span></summary>
                    <div class="cfg-body">${questionList(path, cov.questions, cov.id)}</div></details>`;
                })
                .join('')
            : '<div class="wiz-note">Attach coverages on the Components page to add coverage-specific questions.</div>'
        }
      </div>
    </fieldset>
  </section>`;
};

// ---- Acord forms: preview and edit ----
const mainEl = el('main');

// Preview shows the form as this coverage will use it (fields left out for this product are hidden).
const previewForm = (formId, cov) => {
  const att = cov?.forms.find((a) => a.formId === formId);
  const f = att ? formFor(att, state.acordForms) : state.acordForms.find((x) => x.id === formId);
  if (!f) return;
  const excluded = att?.excluded ?? [];
  const shown = { ...f, sections: f.sections.map((s) => ({ ...s, questions: s.questions.filter((q) => !excluded.includes(q.id)) })).filter((s) => s.questions.length) };
  openBuilder({ form: shown, preview: true, returnTo: mainEl, onExit: render });
};

// Editing changes the form itself, not the versions coverages already use. This coverage keeps its version
// until it is updated from the picker.
const editForm = (f) =>
  openBuilder({
    form: f,
    returnTo: mainEl,
    notice: 'Saving changes the form itself. Coverages already using it keep the version they have until updated.',
    onSaved: async () => {
      state.acordForms = await api('acord_forms').list();
      await loadFormVersions();
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
      useHandle: (formId, questionId) => formHandle(cov, `${formId}:${questionId}`, formFor(cov.forms.find((a) => a.formId === formId), state.acordForms)?.sections.flatMap((s) => s.questions).find((q) => q.id === questionId)),
      onPreviewForm: (f) => previewForm(f.id, cov),
      onEditForm: (f) => editForm(f),
    }).render();
  });
};

// The banner above a read-only view.
const lockNotice = (step) => {
  const bar = (title, text) => `<div class="notice-bar"><div class="notice-content"><strong>${title}</strong><p>${text}</p></div></div>`;
  if (isDist) {
    if (!canRate()) return bar('This distributed version is read-only.', 'Only the MGU it was distributed to can set up its rating.');
    return step < 5 ? bar('Set by the carrier.', 'You can view this part. Set up the rater, rating factors, account-level factors and premium formula in steps 5 to 8.') : '';
  }
  return readOnly()
    ? bar('This version is published and read-only.', `Published as release ${esc(state.release?.releaseNumber ?? '')}. Create a new version to make changes.`)
    : '';
};

// Step 6 is the rating factors (per question, or per combination of several questions). Step 7 is the single account-level factor.
const stepOpts = () => ({ getVersion: () => state.version, getForms: () => state.acordForms, readOnly, onChange: markDirty, coverage: { get: () => state.factorCov, set: (id) => (state.factorCov = id) } });
const mountFactorStep = () => {
  const opts = stepOpts();
  // Multi-question factors are part of the Rating Factors step: they sit in its Combinations view.
  opts.combo = {
    mount: (pane, id, extra) => mountComboFactors(pane, { ...opts, only: id, ...extra }),
    errors: (c) => comboProblems(c, comboContext(state.version, state.acordForms, c), codeCounts(collectFactorGroups(state.version, state.acordForms), state.version), state.version).errors,
  };
  mountFactors(el('factorsHost'), opts);
};

const render = () => {
  const { product, version } = state;
  const back = isDist ? '/' : `/product-version.html?id=${encodeURIComponent(version.id)}`;
  document.title = `Coverage configuration · ${product.name} ${version.label}`;
  el('crumbProduct').textContent = product.name;
  el('crumbVersion').textContent = version.label;
  el('crumbVersionLink').href = back;
  el('backStep').href = back;
  el('backBtn').href = back;
  if (isDist) el('backBtn').textContent = '← Catalogue';
  el('title').textContent = `${product.name} · ${version.label}`;
  el('subtitle').textContent = `${product.productId} · ${product.carrier} · ${product.arrangement}`;
  el('status').textContent = version.status;
  const step = stepNow();
  el('saveDraft').hidden = readOnly();
  el('publish').hidden = (isDist ? !canRate() : readOnly()) || step !== lastStep();
  el('publish').textContent = isDist ? 'Validate & complete rating' : 'Validate & publish';
  el('toQuestions').hidden = step !== 2;
  el('toEligibility').hidden = step !== 3;
  el('backToConfig').hidden = step !== 3;
  el('backToQuestions').hidden = step !== 4;
  el('toRater').hidden = step !== 4 || skipRating();
  ['stepR', 'stepF', 'stepA', 'stepX'].forEach((id) => {
    el(id).hidden = skipRating();
    el(id).previousElementSibling.hidden = skipRating();
  });
  el('backToEligibility').hidden = step !== 5;
  el('toFactors').hidden = step !== 5;
  el('toAccount').hidden = step !== 6;
  el('toFormula').hidden = step !== 7;
  el('backToFactors').hidden = step !== 7;
  el('backToAccount').hidden = step !== 8;
  el('backToRater').hidden = step !== 6;
  el('backBtn').hidden = step !== 2;
  el('stepCfg').classList.toggle('active', step === 2);
  el('stepQ').classList.toggle('active', step === 3);
  el('stepE').classList.toggle('active', step === 4);
  el('stepR').classList.toggle('active', step === 5);
  el('stepF').classList.toggle('active', step === 6);
  el('stepA').classList.toggle('active', step === 7);
  el('stepX').classList.toggle('active', step === 8);
  const stepName = { 2: 'Coverage configuration', 3: 'Questions', 4: 'Eligibility rules', 5: 'Rater setup', 6: 'Rating factors', 7: 'Account-level factors', 8: 'Premium formula' }[step];
  el('stepMeta').textContent = stepName;
  document.title = `${stepName} · ${product.name} ${version.label}`;
  el('bulkBar').hidden = !components().length || step !== 2;
  if (step === 2) paintStrip();
  [...document.querySelectorAll('.steps-row .step')].forEach((node, i) => node.classList.toggle('done', i + 1 < step));
  el('newVersion').hidden = isDist || !readOnly();
  el('components').innerHTML =
    lockNotice(step) +
    (step >= 4
      ? ''
      : step === 3
      ? questionsSection()
      : coverageWorkspace());
  el('eligibilityHost').hidden = step !== 4;
  if (step === 4) {
    mountEligibility(el('eligibilityHost'), { getVersion: () => state.version, getForms: () => state.acordForms, readOnly, onChange: markDirty });
  } else {
    el('eligibilityHost').innerHTML = '';
  }
  el('raterHost').hidden = step !== 5;
  if (step === 5) {
    mountRater(el('raterHost'), { getVersion: () => state.version, getForms: () => state.acordForms, readOnly, onChange: markDirty });
  } else {
    el('raterHost').innerHTML = '';
  }
  el('factorsHost').hidden = step !== 6;
  if (step === 6) {
    mountFactorStep();
  } else {
    el('factorsHost').innerHTML = '';
  }
  el('accountHost').hidden = step !== 7;
  if (step === 7) {
    mountAccountFactors(el('accountHost'), stepOpts());
  } else {
    el('accountHost').innerHTML = '';
  }
  el('formulaHost').hidden = step !== 8;
  if (step === 8) {
    mountFormula(el('formulaHost'), { getVersion: () => state.version, getForms: () => state.acordForms, readOnly, onChange: markDirty });
  } else {
    el('formulaHost').innerHTML = '';
  }
  mountPickers();
  showSaveState();
  refreshStatus();
};

// ---- persistence ----
// Distributed versions carry their name in `version`; the page shows it where a product version shows its label.
const withLabel = (v) => ((v.label ??= v.version), v);

const saveDraft = async () => {
  const updatedAt = new Date().toISOString();
  // The MGU only changes the rating; the carrier's questions stay as distributed. Editing again reopens a completed rating.
  const changes = isDist
    ? { components: components(), territories: state.version.territories, accountFactor: state.version.accountFactor, comboFactors: state.version.comboFactors, ratingStatus: 'In progress', updatedAt }
    : { components: components(), questions: state.version.questions, territories: state.version.territories, accountFactor: state.version.accountFactor, comboFactors: state.version.comboFactors, updatedAt };
  state.version = withLabel(await versionApi().update(state.version.id, changes));
  normalizeComponents(components());
  state.version.questions ??= [];
  state.version.territories ??= [];
  if (!isDist && state.product.status === 'Draft') {
    state.product = await api('products').update(state.product.id, { lineOfBusiness: lobsOf(components()).join(', '), version: state.version.label });
  }
  markClean();
};

const publish = async () => {
  const eligibility = eligibilityIssues(state.version, state.acordForms);
  const rater = fronting() ? [] : raterIssues(state.version, state.acordForms);
  const factors = fronting() ? [] : factorIssues(state.version, state.acordForms);
  const formulas = fronting() ? [] : formulaIssues(state.version, state.acordForms);
  const account = fronting() ? [] : accountFactorIssues(state.version, state.acordForms);
  const combos = fronting() ? [] : comboIssues(state.version, state.acordForms);
  const errors = [...validateVersion(components(), state.version.questions, allowedStates()), ...eligibility, ...rater, ...factors, ...combos, ...account, ...formulas];
  showErrors(errors);
  if (errors.length) {
    // Open every coverage that still needs work so the gaps are visible.
    components().forEach((c) => c.classes.forEach((k) => k.coverages.forEach((cov) => coverageIssues(cov, allowedStates()).length && state.open.add(cov.id))));
    // Coverage problems are fixed on step 2; question problems on step 3.
    if (allCoverages(components()).some((cov) => coverageIssues(cov, allowedStates()).length)) state.step = 2;
    else if (eligibility.length) state.step = 4;
    else if (rater.length) state.step = 5;
    else if (factors.length || combos.length) state.step = 6;
    else if (account.length) state.step = 7;
    else if (formulas.length) state.step = 8;
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
    snapshot: { components: clone(components()), questions: clone(state.version.questions ?? []), territories: clone(state.version.territories ?? []), accountFactor: clone(state.version.accountFactor ?? null), comboFactors: clone(state.version.comboFactors ?? []), jurisdiction: clone(state.version.jurisdiction ?? { excludedStates: [] }) },
    publishedAt: now,
  });
  state.version = await api('product_versions').update(version.id, {
    components: components(),
    questions: state.version.questions,
    territories: state.version.territories,
    accountFactor: state.version.accountFactor,
    comboFactors: state.version.comboFactors,
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

// The MGU finishes its rating: only steps 5-7 are checked, the carrier's part was already complete when it was published.
const completeRating = async () => {
  const rater = raterIssues(state.version, state.acordForms);
  const factors = factorIssues(state.version, state.acordForms);
  const formulas = formulaIssues(state.version, state.acordForms);
  const account = accountFactorIssues(state.version, state.acordForms);
  const combos = comboIssues(state.version, state.acordForms);
  showErrors([...rater, ...factors, ...combos, ...account, ...formulas]);
  if (rater.length || factors.length || combos.length || account.length || formulas.length) {
    state.step = rater.length ? 5 : factors.length || combos.length ? 6 : account.length ? 7 : 8;
    return render();
  }
  if (!confirm(`Mark the rating of ${state.version.name} ${state.version.label} as complete?`)) return;
  const now = new Date().toISOString();
  state.version = withLabel(await versionApi().update(state.version.id, { components: components(), territories: state.version.territories, accountFactor: state.version.accountFactor, comboFactors: state.version.comboFactors, ratingStatus: 'Complete', ratedAt: now, updatedAt: now }));
  markClean();
  render();
  toast('Rating complete.');
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
  if (t.dataset.ccsearch !== undefined) {
    state.covFilter = t.value;
    const term = t.value.trim().toLowerCase();
    host.querySelectorAll('.cc-node').forEach((n) => (n.hidden = Boolean(term) && !n.dataset.name.includes(term)));
    return;
  }
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
  if (t.dataset.quse) {
    // Ticks say which stages list the question; unticking one also removes what was set up there.
    const handle = questionHandle(walk(t.dataset.quse));
    if (!t.checked && !confirmUntick(handle, t.dataset.use)) {
      t.checked = true;
      return;
    }
    toggleUse(handle, t.dataset.use, t.checked);
    markDirty();
  } else if (t.dataset.check) {
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
  } else if (t.dataset.qsrc !== undefined) {
    const list = walk(t.dataset.qsrc);
    const [q] = list.splice(Number(t.dataset.i), 1);
    const target = t.value === 'product' ? state.version.questions : allCoverages(components()).find((c) => c.id === t.value)?.questions;
    (target ?? list).push(q);
    if (t.value !== 'product') state.open.add(`q-${t.value}`);
    markDirty();
    render();
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
  if (act === 'sel-cov') {
    state.selCov = btn.dataset.id;
    state.cfgTab = 'party';
    return render();
  }
  if (act === 'cfg-tab' || act === 'next-tab') {
    state.cfgTab = btn.dataset.tab;
    render();
    return window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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
  else if (act === 'states-none') setPath(path, [...allowedStates()]);
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

el('bulkBar').addEventListener('change', (event) => {
  if (event.target.id !== 'attOnly') return;
  state.attention = event.target.checked;
  render();
});

// Move between the coverage configuration step and the questions step.
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-step]');
  if (!link) return;
  event.preventDefault();
  guarded(async () => {
    const step = Number(link.dataset.step);
    if (step === stepNow()) return;
    if (!readOnly() && state.dirty) await saveDraft();
    showErrors([]);
    state.step = step;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  })();
});

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
    await (isDist ? completeRating() : publish());
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
    if (!versionId && !distId) throw new Error('No product version specified.');
    const role = getRole();
    if (role.role === 'MGU' && !isDist) return location.replace('/');
    state.version = await versionApi().get(distId ?? versionId);
    if (isDist) {
      withLabel(state.version);
      if (role.role === 'MGU' && state.version.organisationId !== role.orgId) throw new Error('This version was not distributed to your organisation.');
    }
    const [product, coverages, acordForms, release] = await Promise.all([
      api('products').get(state.version.productRef),
      api('coverages').list(),
      api('acord_forms').list(),
      state.version.releaseId ? api('product_releases').get(state.version.releaseId) : null,
    ]);
    await loadFormVersions();
    state.library = coverages;
    state.acordForms = acordForms;
    normalizeComponents(components());
    state.version.questions ??= [];
    state.version.territories ??= [];
    Object.assign(state, { product, release });
    components().forEach((c) =>
      c.classes.forEach((k) => k.coverages.forEach((cov) => hydrateCoverage(cov, state.library.find((l) => l.id === cov.coverageId), !isDist && !readOnly()))),
    );
    // Factors are set up per coverage. Older ones that cover several coverages are split, and ones that use another
    // coverage's questions are dropped; the person is told, and nothing is saved until they save.
    const fixed = scopeFactorsToCoverages(state.version, state.acordForms);
    if ((fixed.split || fixed.dropped) && !readOnly()) {
      state.dirty = true;
      state.notice = [fixed.split && `${fixed.split} rating factor${fixed.split === 1 ? '' : 's'} covering several coverages ${fixed.split === 1 ? 'was' : 'were'} split into one per coverage.`, fixed.dropped && `${fixed.dropped} factor${fixed.dropped === 1 ? '' : 's'} that used another coverage's questions ${fixed.dropped === 1 ? 'was' : 'were'} removed.`].filter(Boolean).join(' ');
    }
    const wanted = Number(new URLSearchParams(location.search).get('step'));
    if (wanted >= 2 && wanted <= lastStep()) state.step = wanted;
    else if (canRate()) state.step = 5;
    render();
    if (state.notice) toast(state.notice, 'warn');
  } catch (err) {
    el('title').textContent = 'Product version not found';
    showErrors([err.message]);
  }
})();
