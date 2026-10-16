import { api } from './api.js';
import { cloneComponents, cloneQuestions, lobsOf } from './product-model.js';

const productsApi = api('products');
const orgsApi = api('organisations');
const distApi = api('distributions');
const versionsApi = api('distributed_versions');
const releasesApi = api('product_releases');

const el = (id) => document.getElementById(id);

const ORG_TYPES = ['All', 'MGU', 'MGA', 'Broker'];
const CURRENCIES = ['USD', 'CAD', 'GBP', 'EUR'];
const AUTHORITIES = [
  ['Binding', 'May bind eligible risks within delegated limits.'],
  ['Brokerage', 'May place or broker business.'],
  ['Bind Rating', 'May apply approved rating factors.'],
];
const PERMISSIONS = [
  ['canQuote', 'Can Quote', 'Generate quotes for eligible risks.'],
  ['canBind', 'Can Bind', 'Bind policies within delegated authority.'],
  ['canEndorse', 'Can Endorse', 'Make permitted policy changes.'],
];
const STEPS = [
  ['Select product', 'Product and version'],
  ['Choose partner', 'Organisation type and name'],
  ['Configure terms', 'Authority, coverages and rules'],
];

const termsDefaults = () => ({
  from: new Date().toISOString().slice(0, 10),
  to: '',
  policyLimit: '1000000',
  policyCurrency: 'USD',
  authority: ['Binding', 'Brokerage', 'Bind Rating'],
  canQuote: true,
  canBind: true,
  canEndorse: false,
  claimAuth: 'No',
  claimLimit: '',
  claimCurrency: 'USD',
  grossPeriod: 'Year',
  grossLimit: '5000000',
  grossCurrency: 'USD',
  commissionType: 'Percentage',
  basis: 'Written Premium',
  newCommission: '10',
  renewCommission: '5',
  commissionCurrency: 'USD',
});

const defaults = () => ({
  product: '',
  pSearch: '',
  pLob: '',
  pStatus: '',
  pCarrier: '',
  orgs: [],
  type: 'All',
  search: '',
  status: 'All',
  mode: 'same', // 'same' | 'different'
  active: '', // organisation tab shown in 'different' mode
  terms: {}, // 'shared' and/or organisation id -> termsDefaults()
});

const state = { products: [], orgs: [], saved: [], versions: [], releases: [], page: 1, d: defaults() };
const d = () => state.d;

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

const product = () => state.products.find((p) => p.id === d().product);
// Only a published release can be distributed; the newest one is used.
const releaseOf = (p) =>
  state.releases.filter((r) => r.productRef === p?.id).sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))[0];
const selectedOrgs = () => state.orgs.filter((o) => d().orgs.includes(o.id));
const currencyOptions = (current) => CURRENCIES.map((c) => `<option${c === current ? ' selected' : ''}>${c}</option>`).join('');
const money = (value, currency) => `${currency} ${Number(value).toLocaleString()}`;

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

// ---- Stepper ----
const renderSteps = () => {
  el('steps').innerHTML = STEPS.map(
    ([title, sub], i) =>
      `${i ? '<span class="step-divider">›</span>' : ''}<div class="step${state.page === i + 1 ? ' active' : ''}"><i>${i + 1}</i><span><strong>${title}</strong> · ${sub}</span></div>`,
  ).join('');
};

// ---- Step 1: product ----
const filteredProducts = () => {
  const { pSearch, pLob, pStatus, pCarrier } = d();
  const tokens = pSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return state.products.filter(
    (p) =>
      tokens.every((t) => [p.name, p.productId, p.lineOfBusiness, p.carrier].join(' ').toLowerCase().includes(t)) &&
      (!pLob || p.lineOfBusiness === pLob) &&
      (!pStatus || p.status === pStatus) &&
      (!pCarrier || p.carrier === pCarrier),
  );
};

const productTable = () => {
  const rows = filteredProducts();
  if (!state.products.length) return '<div class="wiz-note">No published products yet. Publish a product version in the Product Catalogue first.</div>';
  if (!rows.length) return '<div class="wiz-note">No products match your search and filters.</div>';
  return `<div class="tbl-wrap"><table>
    <thead><tr><th></th><th>Product</th><th>Product ID</th><th>Carrier</th><th>Line of Business</th><th>Version</th><th>Status</th></tr></thead>
    <tbody>${rows
      .map(
        (p) => `<tr class="opt-row${d().product === p.id ? ' selected' : ''}" tabindex="0" data-product="${esc(p.id)}" aria-selected="${d().product === p.id}">
          <td><input type="radio" name="product" tabindex="-1" aria-label="Select ${esc(p.name)}"${d().product === p.id ? ' checked' : ''}></td>
          <td><strong>${esc(p.name)}</strong></td>
          <td>${esc(p.productId)}</td>
          <td>${esc(p.carrier)}</td>
          <td>${esc(p.lineOfBusiness)}</td>
          <td>${esc(p.version)}</td>
          <td><span class="badge">${esc(p.status)}</span></td>
        </tr>`,
      )
      .join('')}</tbody></table></div>`;
};

const refreshProducts = () => {
  if (!el('productTable')) return;
  el('productTable').innerHTML = productTable();
  el('productCount').textContent = `${filteredProducts().length} of ${state.products.length} products`;
  el('toOrgs').disabled = !d().product;
};

const filterSelect = (id, label, key, values) =>
  `<select class="search-box" id="${id}" aria-label="Filter by ${label}">
    <option value="">All ${label}</option>
    ${values.map((v) => `<option value="${esc(v)}"${d()[key] === v ? ' selected' : ''}>${esc(v)}</option>`).join('')}
  </select>`;

const uniq = (key) => [...new Set(state.products.map((p) => p[key]).filter(Boolean))].sort();

const renderProductStep = () => `<div class="section-meta">Step 1 of 3</div>
  <h2>Select a product</h2>
  <p class="muted">Search and filter the product list, then select one product. The product itself is not modified; each organisation receives its own version of it.</p>
  <div class="toolbar field-group">
    <input class="search-box" id="productSearch" type="search" placeholder="Search by name, ID, carrier or line of business…" value="${esc(d().pSearch)}" aria-label="Search products">
    ${filterSelect('pCarrier', 'carriers', 'pCarrier', uniq('carrier'))}
    ${filterSelect('pLob', 'lines of business', 'pLob', uniq('lineOfBusiness'))}
    ${filterSelect('pStatus', 'statuses', 'pStatus', uniq('status'))}
  </div>
  <div id="productTable">${productTable()}</div>
  <div class="step-actions">
    <span class="muted" id="productCount">${filteredProducts().length} of ${state.products.length} products</span>
    <button class="action primary" type="button" id="toOrgs" data-go="2"${d().product ? '' : ' disabled'}>Continue to organisations →</button>
  </div>`;

// ---- Step 2: organisations ----
const filteredOrgs = () => {
  const q = d().search.trim().toLowerCase();
  return state.orgs.filter(
    (o) =>
      (d().type === 'All' || o.type === d().type) &&
      (d().status === 'All' || o.status === d().status) &&
      [o.name, o.legalName, o.type, o.lineOfBusiness, o.states].join(' ').toLowerCase().includes(q),
  );
};

const orgTable = () => {
  const rows = filteredOrgs();
  if (!rows.length) return '<div class="wiz-note">No organisations match your filters.</div>';
  const allOn = rows.every((o) => d().orgs.includes(o.id));
  return `<div class="tbl-wrap"><table>
    <thead><tr>
      <th><input type="checkbox" data-all aria-label="Select all visible"${allOn ? ' checked' : ''}></th>
      <th>Organisation</th><th>Type</th><th>Class of business</th><th>Licensed states</th><th>Status</th>
    </tr></thead>
    <tbody>${rows
      .map(
        (o) => `<tr>
          <td><input type="checkbox" data-org="${esc(o.id)}" aria-label="Select ${esc(o.name)}"${d().orgs.includes(o.id) ? ' checked' : ''}></td>
          <td><strong>${esc(o.name)}</strong><br><span class="muted">${esc(o.legalName)}</span></td>
          <td><span class="badge">${esc(o.type)}</span></td>
          <td>${esc(o.lineOfBusiness)}</td>
          <td>${esc(o.states)}</td>
          <td><span class="badge">${esc(o.status)}</span></td>
        </tr>`,
      )
      .join('')}</tbody></table></div>`;
};

const refreshOrgs = () => {
  if (!el('orgTable')) return;
  el('orgTable').innerHTML = orgTable();
  el('orgCount').textContent = `${d().orgs.length} selected`;
  el('toConfig').disabled = !d().orgs.length;
  document.querySelectorAll('[data-type]').forEach((b) => b.classList.toggle('active', b.dataset.type === d().type));
};

const renderOrgStep = () => `<div class="section-meta">Step 2 of 3</div>
  <h2>Select organisations</h2>
  <p class="muted">Select one or more MGUs, MGAs and Brokers to distribute the product to.</p>
  <div class="summary-strip">
    <div>Selected product<strong>${esc(product()?.name)}</strong></div>
    <div>Base version<strong>${esc(product()?.version)}</strong></div>
  </div>
  <div class="chips">${ORG_TYPES.map(
    (t) => `<button type="button" class="chip${d().type === t ? ' active' : ''}" data-type="${t}">${t === 'All' ? 'All organisations' : t}</button>`,
  ).join('')}</div>
  <div class="toolbar field-group">
    <input class="search-box" id="orgSearch" type="search" placeholder="Search organisation, type or state…" value="${esc(d().search)}" aria-label="Search organisations">
    <select class="search-box" id="orgStatus" aria-label="Filter by status">
      ${['All', 'Active', 'Review'].map((s) => `<option value="${s}"${d().status === s ? ' selected' : ''}>${s === 'All' ? 'All statuses' : s}</option>`).join('')}
    </select>
  </div>
  <div id="orgTable">${orgTable()}</div>
  <div class="pagination"><span>Selections remain when you search or filter.</span><span id="orgCount">${d().orgs.length} selected</span></div>
  <div class="step-actions">
    <button class="action" type="button" data-go="1">← Back to product list</button>
    <button class="action primary" type="button" id="toConfig" data-go="3"${d().orgs.length ? '' : ' disabled'}>Continue to configuration →</button>
  </div>`;

// ---- Step 3: configuration ----
const termsKey = () => (d().mode === 'same' || selectedOrgs().length < 2 ? 'shared' : d().active);
const terms = (key) => (d().terms[key] ??= termsDefaults());

// Give every selected organisation its own copy of the shared terms the first time they're needed.
const ensureOrgTerms = () => {
  const orgs = selectedOrgs();
  orgs.forEach((o) => {
    d().terms[o.id] ??= structuredClone(terms('shared'));
  });
  if (!orgs.some((o) => o.id === d().active)) d().active = orgs[0]?.id ?? '';
};

const termsForm = (t) => {
  const pct = t.commissionType === 'Percentage';
  const claim = t.claimAuth === 'Yes';
  return `<div class="fields">
    <div class="field"><label for="from">Effective from *</label><input id="from" type="date" value="${esc(t.from)}"></div>
    <div class="field"><label for="to">Effective to</label><input id="to" type="date" value="${esc(t.to)}"><span class="hint">Leave blank for an open-ended assignment.</span></div>
  </div>
  <div class="cfg-grid">
    <div class="cfg-box">
      <h3>Delegated authority</h3>
      <p class="muted">Set the organisation's permitted policy actions.</p>
      ${AUTHORITIES.map(([v, s]) => `<label class="check-row"><input type="checkbox" data-authority value="${v}"${t.authority.includes(v) ? ' checked' : ''}><span><strong>${v}</strong><small>${s}</small></span></label>`).join('')}
      <div class="field-group"></div>
      ${PERMISSIONS.map(([id, title, s]) => `<label class="check-row"><input type="checkbox" id="${id}"${t[id] ? ' checked' : ''}><span><strong>${title}</strong><small>${s}</small></span></label>`).join('')}
    </div>

    <div class="cfg-box">
      <h3>Policy authority</h3>
      <p class="muted">Set the per-policy limit independently.</p>
      <div class="fields">
        <div class="field"><label for="policyLimit">Per-policy limit *</label><input id="policyLimit" type="number" min="0" value="${esc(t.policyLimit)}"></div>
        <div class="field"><label for="policyCurrency">Currency</label><select id="policyCurrency">${currencyOptions(t.policyCurrency)}</select></div>
      </div>
    </div>

    <div class="cfg-box">
      <h3>Claim authority</h3>
      <p class="muted">Claim authority is separate from policy authority.</p>
      <div class="field"><label>Does this organisation have claim authority?</label>
        <div class="radio-row">
          <label><input type="radio" name="claimAuth" value="Yes"${claim ? ' checked' : ''}> Yes</label>
          <label><input type="radio" name="claimAuth" value="No"${claim ? '' : ' checked'}> No</label>
        </div>
      </div>
      <div class="fields${claim ? '' : ' hidden'}" id="claimFields" style="margin-top:12px">
        <div class="field"><label for="claimLimit">Claim authority limit *</label><input id="claimLimit" type="number" min="0" value="${esc(t.claimLimit)}"></div>
        <div class="field"><label for="claimCurrency">Currency</label><select id="claimCurrency">${currencyOptions(t.claimCurrency)}</select></div>
      </div>
    </div>

    <div class="cfg-box">
      <h3>Gross premium limit</h3>
      <p class="muted">Maximum gross premium permitted during the selected period.</p>
      <div class="fields">
        <div class="field"><label for="grossPeriod">Limit period</label><select id="grossPeriod">${['Month', 'Quarter', 'Year'].map((v) => `<option${t.grossPeriod === v ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label for="grossLimit">Gross premium limit *</label><input id="grossLimit" type="number" min="0" value="${esc(t.grossLimit)}"></div>
        <div class="field full"><label for="grossCurrency">Currency</label><select id="grossCurrency">${currencyOptions(t.grossCurrency)}</select></div>
      </div>
    </div>

    <div class="cfg-box">
      <h3>Commission</h3>
      <p class="muted">Configure new business and renewal commissions.</p>
      <div class="field"><label>Commission type</label>
        <div class="radio-row">
          <label><input type="radio" name="commissionType" value="Percentage"${pct ? ' checked' : ''}> Percentage</label>
          <label><input type="radio" name="commissionType" value="Amount"${pct ? '' : ' checked'}> Fixed amount</label>
        </div>
      </div>
      <div class="fields" style="margin-top:12px">
        <div class="field"><label for="newCommission" data-unit>New business (${pct ? '%' : 'amount'})</label><input id="newCommission" type="number" min="0" step=".01" value="${esc(t.newCommission)}"></div>
        <div class="field"><label for="renewCommission" data-unit>Renewal (${pct ? '%' : 'amount'})</label><input id="renewCommission" type="number" min="0" step=".01" value="${esc(t.renewCommission)}"></div>
        <div class="field full${pct ? ' hidden' : ''}" id="commissionCurrencyWrap"><label for="commissionCurrency">Amount currency</label><select id="commissionCurrency">${currencyOptions(t.commissionCurrency)}</select></div>
        <div class="field full"><label>Commission basis</label>
          <div class="radio-row">
            <label><input type="radio" name="basis" value="Written Premium"${t.basis === 'Written Premium' ? ' checked' : ''}> Written premium</label>
            <label><input type="radio" name="basis" value="Earned Premium"${t.basis === 'Earned Premium' ? ' checked' : ''}> Earned premium</label>
          </div>
        </div>
      </div>
    </div>
  </div>`;
};

const renderConfigStep = () => {
  const orgs = selectedOrgs();
  const multi = orgs.length > 1;
  if (multi && d().mode === 'different') ensureOrgTerms();
  const key = termsKey();
  state.formKey = key;
  const different = multi && d().mode === 'different';
  return `<div class="section-meta">Step 3 of 3</div>
  <h2>Distribution configuration</h2>
  <p class="muted">Configure authority and terms for the selected product. Each selected organisation will receive its own new version of this product.</p>
  <div class="summary-strip">
    <div>Product<strong>${esc(product()?.name)}</strong></div>
    <div>Base version<strong>${esc(product()?.version)}</strong></div>
    <div>Organisations<strong>${orgs.map((o) => `${esc(o.name)} (${esc(o.type)})`).join(', ')}</strong></div>
  </div>
  ${
    multi
      ? `<div class="wiz-options">
          <label class="wiz-option${different ? '' : ' selected'}"><input type="radio" name="termsMode" value="same"${different ? '' : ' checked'}><span><strong>Same terms for all</strong><br>One configuration applied to all ${orgs.length} organisations.</span></label>
          <label class="wiz-option${different ? ' selected' : ''}"><input type="radio" name="termsMode" value="different"${different ? ' checked' : ''}><span><strong>Different terms per organisation</strong><br>Configure each organisation separately.</span></label>
        </div>`
      : ''
  }
  ${
    different
      ? `<div class="chips">${orgs.map((o) => `<button type="button" class="chip${o.id === key ? ' active' : ''}" data-tab="${esc(o.id)}">${esc(o.name)}</button>`).join('')}
          <button type="button" class="chip" data-copy-all title="Copy these terms to every other organisation">Copy to all others</button></div>
         <p class="muted">Configuring <strong>${esc(orgs.find((o) => o.id === key)?.name)}</strong></p>`
      : ''
  }
  <div class="field-group" id="termsForm">${termsForm(terms(key))}</div>
  <div class="step-actions">
    <button class="action" type="button" data-go="2">← Back to organisations</button>
    <button class="action primary" type="button" id="save">Save ${multi ? `${orgs.length} distributions` : 'distribution'}</button>
  </div>`;
};

// Copy the config form's current values into the terms they were rendered for.
const collect = () => {
  if (state.page !== 3 || !el('policyLimit')) return;
  const t = terms(state.formKey);
  ['from', 'to', 'policyLimit', 'policyCurrency', 'claimLimit', 'claimCurrency', 'grossPeriod', 'grossLimit', 'grossCurrency', 'newCommission', 'renewCommission', 'commissionCurrency'].forEach((id) => {
    t[id] = el(id).value;
  });
  t.authority = [...document.querySelectorAll('[data-authority]:checked')].map((x) => x.value);
  PERMISSIONS.forEach(([id]) => {
    t[id] = el(id).checked;
  });
  ['claimAuth', 'commissionType', 'basis'].forEach((name) => {
    const checked = document.querySelector(`#termsForm [name=${name}]:checked`);
    if (checked) t[name] = checked.value;
  });
};

const render = () => {
  renderSteps();
  el('stage').innerHTML = [renderProductStep, renderOrgStep, renderConfigStep][state.page - 1]();
};

const goPage = (n) => {
  collect();
  showErrors([]);
  if (n >= 2 && !d().product) return showErrors(['Select a product first.']);
  if (n >= 3 && !d().orgs.length) return showErrors(['Select at least one organisation first.']);
  state.page = n;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ---- Save ----
const validateTerms = (t, prefix = '') => {
  const errors = [];
  const bad = (x) => x === '' || Number.isNaN(+x) || +x < 0;
  const add = (m) => errors.push(prefix + m);
  if (!t.from) add('Choose an effective-from date.');
  if (t.to && t.to < t.from) add('Effective-to date must be after effective-from date.');
  if (bad(t.policyLimit)) add('Enter a valid policy limit.');
  if (t.canBind && !t.authority.includes('Binding')) add('Can Bind requires Binding authority.');
  if (t.claimAuth === 'Yes' && bad(t.claimLimit)) add('Enter a valid claim authority limit.');
  if (bad(t.grossLimit)) add('Enter a valid gross premium limit.');
  if (bad(t.newCommission) || bad(t.renewCommission)) add('Enter valid commission values.');
  else if (t.commissionType === 'Percentage' && (+t.newCommission > 100 || +t.renewCommission > 100)) add('Commission percentages cannot exceed 100.');
  return errors;
};

const isDifferent = () => selectedOrgs().length > 1 && d().mode === 'different';

// One entry per organisation: its own terms in "different" mode, the shared terms otherwise.
const termsPerOrg = () => selectedOrgs().map((o) => [o, isDifferent() ? terms(o.id) : terms('shared')]);

const validate = () => {
  const errors = [];
  if (!d().product) errors.push('Select a product.');
  if (!d().orgs.length) errors.push('Select at least one organisation.');
  if (isDifferent()) termsPerOrg().forEach(([o, t]) => errors.push(...validateTerms(t, `${o.name}: `)));
  else errors.push(...validateTerms(terms('shared')));
  showErrors(errors);
  return !errors.length;
};

const buildRecord = (p, o, t, batch, mode, version) => ({
  product: { id: p.id, productId: p.productId, name: p.name, version: p.version },
  version: { id: version.id, version: version.version },
  status: 'Active',
  organisation: { id: o.id, name: o.name, type: o.type },
  termsMode: mode,
  batchId: batch,
  effectiveFrom: t.from,
  effectiveTo: t.to || null,
  delegatedAuthority: { authorities: t.authority, canQuote: t.canQuote, canBind: t.canBind, canEndorse: t.canEndorse },
  policyAuthority: { limit: +t.policyLimit, currency: t.policyCurrency },
  claimAuthority: {
    enabled: t.claimAuth === 'Yes',
    limit: t.claimAuth === 'Yes' ? +t.claimLimit : null,
    currency: t.claimCurrency,
  },
  grossPremiumLimit: { period: t.grossPeriod, amount: +t.grossLimit, currency: t.grossCurrency },
  commission: {
    type: t.commissionType,
    basis: t.basis,
    currency: t.commissionType === 'Amount' ? t.commissionCurrency : null,
    newBusiness: +t.newCommission,
    renewal: +t.renewCommission,
  },
  savedAt: new Date().toISOString(),
});

// Each organisation gets its own snapshot of the product. Redistributing supersedes the previous one.
const orgSlug = (o) => o.name.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 10);

const versionLabel = (p, o) => {
  const n = state.versions.filter((v) => v.productRef === p.id && v.organisationId === o.id).length;
  return `${p.version}-${orgSlug(o)}${n ? `-R${n + 1}` : ''}`;
};

// A distributed version is a deep copy of the product's published release (components, coverages, rating).
const buildVersion = (p, o) => ({
  productRef: p.id,
  productId: p.productId,
  name: p.name,
  carrier: p.carrier,
  lineOfBusiness: p.lineOfBusiness,
  arrangement: p.arrangement,
  components: cloneComponents(p.release.snapshot.components),
  questions: cloneQuestions(p.release.snapshot.questions),
  jurisdiction: structuredClone(p.release.snapshot.jurisdiction ?? { excludedStates: [] }),
  sourceReleaseId: p.release.id,
  sourceVersionId: p.release.versionId,
  baseVersion: p.release.label,
  version: versionLabel(p, o),
  organisationId: o.id,
  status: 'Active',
  createdAt: new Date().toISOString(),
});

const supersede = async (p, o, newVersion) => {
  const prior = state.versions.find((v) => v.productRef === p.id && v.organisationId === o.id && v.status === 'Active' && v.id !== newVersion.id);
  if (!prior) return;
  Object.assign(prior, await versionsApi.update(prior.id, { status: 'Superseded', supersededBy: newVersion.id }));
  const dist = state.saved.find((s) => s.version?.id === prior.id);
  if (dist) Object.assign(dist, await distApi.update(dist.id, { status: 'Superseded' }));
};

const save = async () => {
  collect();
  if (!validate()) return;
  const p = product();
  const btn = el('save');
  const mode = isDifferent() ? 'different' : 'same';
  const batch = crypto.randomUUID();
  btn.disabled = true;
  let done = 0;
  try {
    // Sequential: the server rewrites the whole JSON file per request, so parallel writes would drop records.
    for (const [o, t] of termsPerOrg()) {
      const version = await versionsApi.create(buildVersion(p, o));
      state.versions.push(version);
      const dist = await distApi.create(buildRecord(p, o, t, batch, mode, version));
      state.saved.push(dist);
      await supersede(p, o, version);
      done += 1;
    }
    state.d = defaults();
    state.page = 1;
    render();
    renderSaved();
    toast(`${done} new product ${done === 1 ? 'version' : 'versions'} created and distributed.`);
  } catch (err) {
    renderSaved();
    showErrors([`${err.message}${done ? ` (${done} saved before the error)` : ''}`]);
    btn.disabled = false;
  }
};

// ---- Saved list ----
const renderSaved = () => {
  el('saved').innerHTML =
    [...state.saved]
      .reverse()
      .map(
        (s) => `<tr>
          <td><strong>${esc(s.product?.name)}</strong><br><span class="muted">Base ${esc(s.product?.version)}</span></td>
          <td><strong>${esc(s.organisation?.name)}</strong> <span class="badge">${esc(s.organisation?.type)}</span></td>
          <td>${esc(s.version?.version ?? s.product?.version)}</td>
          <td>${esc(s.effectiveFrom)}</td>
          <td>${esc(s.effectiveTo || 'Open-ended')}</td>
          <td>${esc(money(s.policyAuthority?.limit ?? 0, s.policyAuthority?.currency))}</td>
          <td><span class="badge">${esc(s.status ?? 'Active')}</span></td>
          <td><button class="mini" type="button" data-delete="${esc(s.id)}" aria-label="Delete distribution">🗑</button></td>
        </tr>`,
      )
      .join('') || '<tr><td colspan="8">No distributions saved yet</td></tr>';
};

// ---- Events ----
el('stage').addEventListener('click', (event) => {
  const row = event.target.closest('[data-product]');
  if (row) {
    d().product = row.dataset.product;
    return refreshProducts();
  }
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    collect();
    d().active = tab.dataset.tab;
    return render();
  }
  if (event.target.closest('[data-copy-all]')) {
    collect();
    const src = terms(d().active);
    selectedOrgs().forEach((o) => {
      if (o.id !== d().active) d().terms[o.id] = structuredClone(src);
    });
    toast('Terms copied to all other organisations.');
    return render();
  }
  const go = event.target.closest('[data-go]');
  if (go && !go.disabled) return goPage(Number(go.dataset.go));
  const type = event.target.closest('[data-type]');
  if (type) {
    d().type = type.dataset.type;
    return refreshOrgs();
  }
  if (event.target.closest('#save')) save();
});

el('stage').addEventListener('keydown', (event) => {
  const row = event.target.closest('[data-product]');
  if (row && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    row.click();
  }
});

el('stage').addEventListener('input', (event) => {
  if (event.target.id === 'productSearch') {
    d().pSearch = event.target.value;
    refreshProducts();
  } else if (event.target.id === 'orgSearch') {
    d().search = event.target.value;
    refreshOrgs();
  }
});

el('stage').addEventListener('change', (event) => {
  const t = event.target;
  if (['pCarrier', 'pLob', 'pStatus'].includes(t.id)) {
    d()[t.id] = t.value;
    refreshProducts();
  } else if (t.id === 'orgStatus') {
    d().status = t.value;
    refreshOrgs();
  } else if (t.dataset.org) {
    d().orgs = t.checked ? [...new Set([...d().orgs, t.dataset.org])] : d().orgs.filter((id) => id !== t.dataset.org);
    refreshOrgs();
  } else if ('all' in t.dataset) {
    const ids = filteredOrgs().map((o) => o.id);
    d().orgs = t.checked ? [...new Set([...d().orgs, ...ids])] : d().orgs.filter((id) => !ids.includes(id));
    refreshOrgs();
  } else if (t.name === 'termsMode') {
    collect();
    d().mode = t.value;
    render();
  } else if (t.name === 'claimAuth') {
    el('claimFields').classList.toggle('hidden', t.value !== 'Yes');
  } else if (t.name === 'commissionType') {
    const pct = t.value === 'Percentage';
    el('commissionCurrencyWrap').classList.toggle('hidden', pct);
    const [a, b] = document.querySelectorAll('[data-unit]');
    a.textContent = `New business (${pct ? '%' : 'amount'})`;
    b.textContent = `Renewal (${pct ? '%' : 'amount'})`;
  }
});

el('saved').addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-delete]');
  if (!btn || !confirm('Delete this distribution and the product version created for it?')) return;
  try {
    const dist = state.saved.find((s) => s.id === btn.dataset.delete);
    await distApi.remove(btn.dataset.delete);
    state.saved = state.saved.filter((s) => s.id !== btn.dataset.delete);
    if (dist?.version?.id) {
      await versionsApi.remove(dist.version.id);
      state.versions = state.versions.filter((v) => v.id !== dist.version.id);
    }
    renderSaved();
    toast('Distribution deleted.');
  } catch (err) {
    toast(err.message, 'err');
  }
});

el('startOver').addEventListener('click', () => {
  state.d = defaults();
  state.page = 1;
  showErrors([]);
  render();
});

// ---- Init ----
(async () => {
  try {
    const [products, orgs, saved, versions, releases] = await Promise.all([productsApi.list(), orgsApi.list(), distApi.list(), versionsApi.list(), releasesApi.list()]);
    Object.assign(state, { orgs, saved, versions, releases });
    // Only products with a published release can be distributed.
    state.products = products.flatMap((p) => {
      const release = releaseOf({ id: p.id });
      return release ? [{ ...p, release, version: release.label, lineOfBusiness: lobsOf(release.snapshot.components).join(', ') }] : [];
    });
  } catch (err) {
    showErrors([`Unable to load data: ${err.message}`]);
  }
  render();
  renderSaved();
})();
