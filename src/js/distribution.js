import { api } from './api.js';

const organizationsApi = api('organizations');
const productsApi = api('products');
const statesApi = api('states');
const distributionApi = api('distribution');

/* ---------- option lists shared by the form ---------- */
const ORGANIZATION_TYPES = ['Risk Carrier', 'MGU', 'MGA', 'Broker'];
const ARRANGEMENTS = ['Fronting', 'Non-Fronting'];
const AUTHORITIES = ['Binding', 'Binding + Rating'];
const COMMISSION_BASES = ['Earned Premium', 'Written Premium'];
const SCOPE_LEVELS = [
  { value: 'ALL', label: 'All coverages', hint: 'Every coverage and additional coverage on the product.' },
  { value: 'COVERAGE', label: 'Entire individual coverage', hint: 'Whole coverages, including all of their additional coverages.' },
  { value: 'ADDITIONAL', label: 'Additional coverage', hint: 'Individual additional / sub-coverages under a coverage.' },
];
// Unit separator keeps composite keys unambiguous even when names contain dashes or colons.
const SEP = '␟';

const el = (id) => document.getElementById(id);
const dom = {
  form: el('distributionForm'),
  organizationType: el('organizationType'),
  organizationId: el('organizationId'),
  orgHint: el('orgHint'),
  productId: el('productId'),
  productHint: el('productHint'),
  arrangement: el('arrangement'),
  arrangementHint: el('arrangementHint'),
  stateSearch: el('stateSearch'),
  stateList: el('stateList'),
  footprint: el('footprint'),
  scopeLevels: el('scopeLevels'),
  coverageTree: el('coverageTree'),
  scopeSummary: el('scopeSummary'),
  authority: el('authority'),
  bindingLimitField: el('bindingLimitField'),
  bindingLimit: el('bindingLimit'),
  commissionPercent: el('commissionPercent'),
  commissionBasis: el('commissionBasis'),
  authorityHint: el('authorityHint'),
  status: el('formStatus'),
  save: el('saveBtn'),
  reset: el('resetBtn'),
  toast: el('toast'),
  sumOrg: el('sumOrg'),
  sumOrgHint: el('sumOrgHint'),
  sumProduct: el('sumProduct'),
  sumProductHint: el('sumProductHint'),
  sumScope: el('sumScope'),
  sumScopeHint: el('sumScopeHint'),
};

const blankDraft = () => ({
  organizationType: '',
  organizationId: '',
  productId: '',
  licensedStates: {},
  scopeLevel: '',
  coverages: [],
  additions: [],
  authority: '',
  bindingLimit: '',
  commissionPercent: '',
  commissionBasis: '',
});

const state = {
  organizations: [],
  products: [],
  states: [],
  stateByCode: new Map(),
  records: [],
  search: '',
  draft: blankDraft(),
};

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const normalise = (value) => String(value ?? '').toLowerCase();
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usd = (value) => money.format(Number(value) || 0);

const covKey = (classOfBusiness, coverage) => `${classOfBusiness}${SEP}${coverage}`;
const addKey = (classOfBusiness, coverage, addition) => `${covKey(classOfBusiness, coverage)}${SEP}${addition}`;
const splitKey = (key) => {
  const [classOfBusiness, coverage, addition] = key.split(SEP);
  return { classOfBusiness, coverage, addition };
};

/* ---------- lookups derived from the loaded JSON ---------- */
const currentOrganization = () => state.organizations.find((row) => row.id === state.draft.organizationId) ?? null;
const currentProduct = () => state.products.find((row) => row.id === state.draft.productId) ?? null;
const activeProducts = () => state.products.filter((row) => normalise(row.status) !== 'archived');

// Coverages are read straight off the Product Studio record: { classOfBusiness: { coverage: [additionalCoverage] } }.
const coverageGroups = () => {
  const map = currentProduct()?.coverages;
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map).map(([classOfBusiness, coverages]) => ({
    classOfBusiness,
    coverages: Object.entries(coverages || {}).map(([coverage, additions]) => ({
      coverage,
      additions: asList(additions),
    })),
  }));
};

const coverageCount = () => coverageGroups().reduce((sum, group) => sum + group.coverages.length, 0);
const additionCount = () =>
  coverageGroups().reduce(
    (sum, group) => sum + group.coverages.reduce((inner, row) => inner + row.additions.length, 0),
    0,
  );

// Products own the arrangement, so it is normalised for display only and never stored from this page.
const arrangementOf = (product) => {
  const raw = normalise(product?.arrangement).replace(/[\s_]+/g, '-');
  return ARRANGEMENTS.find((value) => normalise(value) === raw) ?? '';
};

const organizationLabel = (row) => (row.rating ? `${row.name} · ${row.rating}` : row.name);
const productLabel = (row) =>
  [row.productId, row.name, row.version].filter(Boolean).join(' · ');

const licensedStateRows = () => {
  const org = currentOrganization();
  return asList(org?.licensedStates).map((code) =>
    state.stateByCode.get(code) ?? { code, name: code, cities: [] },
  );
};

const alreadyDistributed = (productId) =>
  state.records.filter(
    (row) => row.organizationId === state.draft.organizationId && row.productId === productId,
  ).length;

const isApproved = (row) => ['active', 'approved'].includes(normalise(row.status));

/* ---------- feedback ---------- */
let toastTimer;
const toast = (message, kind = 'ok') => {
  dom.toast.textContent = message;
  dom.toast.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.className = 'toast';
  }, 2800);
};

let statusKind = '';
const setStatus = (message, kind = '') => {
  statusKind = kind;
  dom.status.className = `status-line ${kind}`.trim();
  dom.status.textContent = message;
};

const clearErrors = () => {
  dom.form.querySelectorAll('.err').forEach((node) => {
    node.textContent = '';
  });
  dom.form.querySelectorAll('.invalid').forEach((node) => node.classList.remove('invalid'));
  dom.form.querySelectorAll('.is-invalid').forEach((node) => node.classList.remove('is-invalid'));
};

const setError = (name, message) => {
  const slot = dom.form.querySelector(`[data-err="${name}"]`);
  if (slot) slot.textContent = message;
  const input = dom.form.elements[name];
  if (input && input.classList.contains('input')) input.classList.add('invalid');
  if (slot && message) slot.classList.add('is-invalid');
};

const optionHtml = (values, placeholder) =>
  [
    `<option value="">${esc(placeholder)}</option>`,
    ...values.map((value) => `<option value="${esc(value.value ?? value)}">${esc(value.label ?? value)}</option>`),
  ].join('');

const setSelectValue = (select, value) => {
  select.value = value ?? '';
};

/* ---------- render: organization ---------- */
const renderOrganizations = () => {
  const type = dom.organizationType.value;
  const rows = state.organizations.filter((row) => normalise(row.type) === normalise(type));
  dom.organizationId.disabled = !type;
  dom.organizationId.innerHTML = rows.length
    ? optionHtml(
        rows.map((row) => ({ value: row.id, label: organizationLabel(row) })),
        'Select organization',
      )
    : `<option value="">${type ? 'No organizations of this type' : 'Select organization type first'}</option>`;
  setSelectValue(dom.organizationId, state.draft.organizationId);
};

const renderOrgHint = () => {
  const org = currentOrganization();
  if (!org) {
    dom.orgHint.textContent = 'Licensed states available for selection come from the selected organization.';
    return;
  }
  const count = asList(org.licensedStates).length;
  const parts = [
    `Licensed in <strong>${count}</strong> state${count === 1 ? '' : 's'}.`,
    org.rating ? `Financial strength ${esc(org.rating)}.` : '',
    isApproved(org) ? '' : 'Approval pending — confirm before granting binding authority.',
  ];
  dom.orgHint.innerHTML = parts.filter(Boolean).join(' ');
};

/* ---------- render: product + arrangement ---------- */
const renderProducts = () => {
  const rows = activeProducts();
  dom.productId.innerHTML = rows.length
    ? optionHtml(rows.map((row) => ({ value: row.id, label: productLabel(row) })), 'Select product')
    : '<option value="">No products available</option>';
  dom.productId.disabled = !rows.length;
  setSelectValue(dom.productId, state.draft.productId);
};

const renderArrangement = () => {
  const arrangement = arrangementOf(currentProduct());
  dom.arrangement.textContent = arrangement || '—';
  dom.arrangementHint.textContent = arrangement
    ? 'Read-only · configured in Product Studio'
    : 'Fronting or Non-Fronting · not set on this product';
};

const renderProductHint = () => {
  const product = currentProduct();
  if (!product) {
    dom.productHint.textContent = 'Coverages are loaded automatically from the selected product.';
    return;
  }
  const existing = alreadyDistributed(product.id);
  const parts = [`${coverageCount()} coverages and ${additionCount()} additional coverages available.`];
  if (existing) parts.push(`Already distributed to this organization in ${existing} existing configuration${existing === 1 ? '' : 's'}.`);
  dom.productHint.textContent = parts.join(' ');
};

/* ---------- render: licensed states ---------- */
const renderStateList = () => {
  const rows = licensedStateRows();
  if (!currentOrganization()) {
    dom.stateList.innerHTML = '<div class="empty">Select an organization to see the states it is licensed in.</div>';
    return;
  }
  const needle = state.search.trim().toLowerCase();
  const visible = rows.filter(
    (row) => !needle || normalise(row.name).includes(needle) || normalise(row.code).includes(needle),
  );
  if (!rows.length) {
    dom.stateList.innerHTML = '<div class="empty">This organization has no licensed states on file.</div>';
    return;
  }
  if (!visible.length) {
    dom.stateList.innerHTML = '<div class="empty">No states match this search.</div>';
    return;
  }
  dom.stateList.innerHTML = visible
    .map((row) => {
      const on = Boolean(state.draft.licensedStates[row.code]);
      return `<label class="state-row${on ? ' checked' : ''}">
        <input type="checkbox" data-state="${esc(row.code)}"${on ? ' checked' : ''}>
        <span class="state-code">${esc(row.code)}</span>
        <span class="state-name">${esc(row.name)}</span>
        <span class="state-meta">${row.cities.length} cities</span>
      </label>`;
    })
    .join('');
};

const renderFootprint = () => {
  const selected = Object.values(state.draft.licensedStates);
  if (!selected.length) {
    dom.footprint.innerHTML = '<div class="empty">No states selected yet.</div>';
    return;
  }
  dom.footprint.innerHTML = selected
    .map((row) => {
      const cities = state.stateByCode.get(row.code)?.cities ?? [];
      const chips = cities.length
        ? cities
            .map((city) => {
              const excluded = row.excludedCities.includes(city);
              return `<button type="button" class="city-chip${excluded ? ' excluded' : ''}" data-action="toggle-city" data-state="${esc(row.code)}" data-city="${esc(city)}" aria-pressed="${excluded}">${esc(city)}</button>`;
            })
            .join('')
        : '<div class="hint">No city list on file for this state.</div>';
      const excluded = row.excludedCities.length;
      return `<div class="footprint-state">
        <div class="footprint-head">
          <span class="state-code">${esc(row.code)}</span>
          <strong>${esc(row.name)}</strong>
          <span class="tag${excluded ? ' warn' : ''}">${excluded ? `${excluded} excluded` : 'All cities'}</span>
          ${excluded ? `<button type="button" class="btn sm danger" data-action="reset-cities" data-state="${esc(row.code)}">Clear exclusions</button>` : ''}
        </div>
        <div class="city-chips">${chips}</div>
      </div>`;
    })
    .join('');
};

/* ---------- render: coverage scope ---------- */
const renderScopeLevels = () => {
  dom.scopeLevels.innerHTML = SCOPE_LEVELS.map((level) => {
    const on = state.draft.scopeLevel === level.value;
    return `<button type="button" role="radio" aria-checked="${on}" class="scope-level${on ? ' active' : ''}" data-level="${level.value}">
      <strong>${esc(level.label)}</strong>
      <span>${esc(level.hint)}</span>
    </button>`;
  }).join('');
};

const coverageRow = (group, row, level) => {
  const key = covKey(group.classOfBusiness, row.coverage);
  const additions = row.additions.length;
  const additionNames = additions ? row.additions.map((name) => `<span class="tag">${esc(name)}</span>`).join('') : '';
  if (level === 'ADDITIONAL') {
    const boxes = additions
      ? row.additions
          .map(
            (name) => `<label class="addition-row">
              <input type="checkbox" data-add="${esc(addKey(group.classOfBusiness, row.coverage, name))}">
              <span>${esc(name)}</span>
            </label>`,
          )
          .join('')
      : '<div class="hint">This coverage has no additional coverages configured.</div>';
    return `<div class="coverage-card">
      <div class="coverage-head">
        <strong>${esc(row.coverage)}</strong>
        ${additions ? `<button type="button" class="btn sm" data-action="all-additions" data-cov="${esc(key)}">Select all</button>` : ''}
      </div>
      <div class="addition-list">${boxes}</div>
    </div>`;
  }
  const meta =
    level === 'COVERAGE'
      ? `${additions} additional coverage${additions === 1 ? '' : 's'} included`
      : `${additions} additional`;
  return `<label class="coverage-row">
    <input type="checkbox" data-cov="${esc(key)}"${level === 'ALL' ? ' checked disabled' : ''}>
    <span class="coverage-main">
      <strong>${esc(row.coverage)}</strong>
      ${additionNames ? `<span class="tags">${additionNames}</span>` : ''}
    </span>
    <span class="state-meta">${meta}</span>
  </label>`;
};

const renderCoverageTree = () => {
  const level = state.draft.scopeLevel;
  if (!currentProduct()) {
    dom.coverageTree.innerHTML = '<div class="empty">Select a product to load its coverages.</div>';
    return;
  }
  const groups = coverageGroups();
  if (!groups.length) {
    dom.coverageTree.innerHTML = '<div class="empty">This product has no coverages configured in Product Studio.</div>';
    return;
  }
  if (!level) {
    dom.coverageTree.innerHTML = '<div class="empty">Select a distribution level to choose the coverage scope.</div>';
    return;
  }
  dom.coverageTree.innerHTML = groups
    .map(
      (group) => `<div class="coverage-group">
        <div class="section-label">${esc(group.classOfBusiness)} · ${group.coverages.length} coverage${group.coverages.length === 1 ? '' : 's'}</div>
        ${group.coverages.map((row) => coverageRow(group, row, level)).join('')}
      </div>`,
    )
    .join('');
  syncScopeChecks();
};

const syncScopeChecks = () => {
  const draft = state.draft;
  dom.coverageTree.querySelectorAll('input[data-cov]').forEach((box) => {
    const on = draft.scopeLevel === 'ALL' || draft.coverages.includes(box.dataset.cov);
    box.checked = on;
    box.closest('.coverage-row')?.classList.toggle('checked', on);
  });
  dom.coverageTree.querySelectorAll('input[data-add]').forEach((box) => {
    const on = draft.additions.includes(box.dataset.add);
    box.checked = on;
    box.closest('.addition-row')?.classList.toggle('checked', on);
  });
};

const scopeSummaryText = () => {
  const draft = state.draft;
  const level = SCOPE_LEVELS.find((row) => row.value === draft.scopeLevel);
  if (!level) return '';
  if (draft.scopeLevel === 'ALL') {
    return `${coverageCount()} coverages and ${additionCount()} additional coverages across ${coverageGroups().length} classes of business.`;
  }
  if (draft.scopeLevel === 'COVERAGE') {
    if (!draft.coverages.length) return 'No coverage selected yet.';
    const covered = draft.coverages.reduce((sum, key) => {
      const parts = splitKey(key);
      const group = coverageGroups().find((row) => row.classOfBusiness === parts.classOfBusiness);
      const found = group?.coverages.find((row) => row.coverage === parts.coverage);
      return sum + (found?.additions.length ?? 0);
    }, 0);
    return `${draft.coverages.length} of ${coverageCount()} coverages selected, carrying ${covered} additional coverages.`;
  }
  if (!draft.additions.length) return 'No additional coverage selected yet.';
  const parents = new Set(draft.additions.map((key) => covKey(splitKey(key).classOfBusiness, splitKey(key).coverage)));
  return `${draft.additions.length} additional coverage${draft.additions.length === 1 ? '' : 's'} under ${parents.size} coverage${parents.size === 1 ? '' : 's'}.`;
};

const renderScopeSummary = () => {
  const text = scopeSummaryText();
  dom.scopeSummary.textContent = text;
  dom.scopeSummary.hidden = !text;
};

/* ---------- render: authority ---------- */
const renderAuthority = () => {
  // Both authority values grant binding, so the binding limit is always required once one is chosen.
  const granted = Boolean(dom.authority.value);
  dom.bindingLimitField.hidden = !granted;
  dom.bindingLimit.required = granted;
  dom.authorityHint.textContent = granted
    ? `${dom.authority.value} authority — enter the permitted binding limit.`
    : 'Binding Limit is required whenever the organization holds binding authority.';
};

/* ---------- render: summary strip ---------- */
const renderSummary = () => {
  const draft = state.draft;
  const org = currentOrganization();
  const product = currentProduct();

  dom.sumOrg.textContent = org ? org.name : '—';
  dom.sumOrgHint.textContent = org
    ? [org.type, org.rating].filter(Boolean).join(' · ') || '—'
    : 'Select an organization';

  dom.sumProduct.textContent = product ? product.name : '—';
  dom.sumProductHint.textContent = product
    ? [product.productId, product.version, arrangementOf(product)].filter(Boolean).join(' · ')
    : 'Select a product';

  const level = SCOPE_LEVELS.find((row) => row.value === draft.scopeLevel);
  dom.sumScope.textContent = level ? level.label : '—';
  dom.sumScopeHint.textContent = level ? scopeSummaryText() : 'Select a distribution level';
};

/* ---------- master render ---------- */
const render = () => {
  clearErrors();
  // Own all three selects from the draft so a Reset never depends on form.reset() alone.
  setSelectValue(dom.organizationType, state.draft.organizationType);
  renderOrganizations();
  renderProducts();
  renderOrgHint();
  renderProductHint();
  renderArrangement();
  renderStateList();
  renderFootprint();
  renderScopeLevels();
  renderCoverageTree();
  renderScopeSummary();
  renderAuthority();
  renderSummary();
  updateStatus();
};

// Selects and number inputs keep their value across a re-render; checkboxes live in the draft.
const syncInputs = () => {
  const draft = state.draft;
  draft.organizationType = dom.organizationType.value;
  draft.organizationId = dom.organizationId.value;
  draft.productId = dom.productId.value;
  draft.authority = dom.authority.value;
  draft.bindingLimit = dom.bindingLimit.value;
  draft.commissionPercent = dom.commissionPercent.value;
  draft.commissionBasis = dom.commissionBasis.value;
};

/* ---------- validation ---------- */
const collectErrors = () => {
  const draft = state.draft;
  const errors = {};

  if (!draft.organizationType) errors.organizationType = 'Select an organization type.';
  if (!draft.organizationId) errors.organizationId = 'Select an organization.';
  if (!draft.productId) errors.productId = 'Select a product.';
  if (!Object.keys(draft.licensedStates).length) {
    errors.licensedStates = 'Select at least one licensed state.';
  }

  if (!draft.scopeLevel) {
    errors.coverageScope = 'Select a distribution level.';
  } else if (!coverageGroups().length) {
    errors.coverageScope = 'The selected product has no coverages configured.';
  } else if (draft.scopeLevel === 'COVERAGE' && !draft.coverages.length) {
    errors.coverageScope = 'Select at least one coverage to distribute.';
  } else if (draft.scopeLevel === 'ADDITIONAL' && !draft.additions.length) {
    errors.coverageScope = 'Select at least one additional coverage to distribute.';
  }

  if (!draft.authority) errors.authority = 'Select an authority.';
  if (draft.authority && !(Number(draft.bindingLimit) > 0)) {
    errors.bindingLimit = 'Enter the permitted binding limit.';
  }

  const percent = Number(draft.commissionPercent);
  if (draft.commissionPercent === '' || Number.isNaN(percent)) {
    errors.commissionPercent = 'Enter a commission percentage.';
  } else if (percent < 0 || percent > 100) {
    errors.commissionPercent = 'Commission must be between 0 and 100.';
  }
  if (!draft.commissionBasis) errors.commissionBasis = 'Select a commission basis.';

  return errors;
};

const validate = () => {
  const errors = collectErrors();
  clearErrors();
  Object.entries(errors).forEach(([name, message]) => setError(name, message));
  return errors;
};

// Keeps the "n fields need attention" line honest as the user works through the form.
const updateStatus = () => {
  if (statusKind !== 'invalid') return;
  const count = Object.keys(collectErrors()).length;
  setStatus(
    count
      ? `${count} field${count === 1 ? ' needs' : 's need'} attention before saving.`
      : 'All required fields are complete — ready to save.',
    count ? 'invalid' : 'ok',
  );
};

// Every edit to the draft refreshes the summary strip and the live validation count.
const refresh = () => {
  renderSummary();
  updateStatus();
};

const focusFirstError = (errors) => {
  const [name] = Object.keys(errors);
  const slot = dom.form.querySelector(`[data-err="${name}"]`);
  if (slot) slot.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const input = dom.form.elements[name];
  if (input && typeof input.focus === 'function') input.focus({ preventScroll: true });
};

/* ---------- save ---------- */
const buildRecord = (existing) => {
  const draft = state.draft;
  const product = currentProduct();
  const org = currentOrganization();
  const now = new Date().toISOString();
  return {
    ...(existing ?? {}),
    status: 'active',
    organizationType: draft.organizationType,
    organizationId: org.id,
    organizationName: org.name,
    productId: product.id,
    productCode: product.productId ?? null,
    productName: product.name,
    productVersion: product.version ?? null,
    arrangement: arrangementOf(product),
    licensedStates: Object.values(draft.licensedStates).map((row) => ({
      code: row.code,
      name: row.name,
      excludedCities: [...row.excludedCities],
    })),
    coverageScope: {
      level: draft.scopeLevel,
      coverages: draft.scopeLevel === 'COVERAGE' ? [...draft.coverages] : [],
      additions:
        draft.scopeLevel === 'ADDITIONAL'
          ? draft.additions.map((key) => {
              const parts = splitKey(key);
              return {
                classOfBusiness: parts.classOfBusiness,
                coverage: parts.coverage,
                addition: parts.addition,
              };
            })
          : [],
    },
    authority: draft.authority,
    bindingLimit: draft.authority ? Number(draft.bindingLimit) : null,
    commission: {
      percent: round(draft.commissionPercent),
      basis: draft.commissionBasis,
    },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
};

const save = async (event) => {
  event.preventDefault();
  syncInputs();
  const errors = validate();
  const count = Object.keys(errors).length;
  if (count) {
    setStatus(`${count} field${count === 1 ? ' needs' : 's need'} attention before saving.`, 'invalid');
    toast('Complete the highlighted fields before saving.', 'err');
    focusFirstError(errors);
    return;
  }

  const org = currentOrganization();
  const product = currentProduct();
  const existing = state.records.find(
    (row) => row.organizationId === org.id && row.productId === product.id,
  );
  dom.save.disabled = true;
  try {
    const record = await (existing
      ? distributionApi.update(existing.id, buildRecord(existing))
      : distributionApi.create(buildRecord(null)));
    const index = state.records.findIndex((row) => row.id === record.id);
    if (index < 0) state.records.push(record);
    else state.records[index] = record;
    const states = Object.keys(state.draft.licensedStates).length;
    setStatus(
      `Saved ${record.productCode ?? record.productName} to ${record.organizationName} · ${states} state${states === 1 ? '' : 's'} · ${usd(record.bindingLimit)} binding · ${record.commission.percent}% ${record.commission.basis}.`,
      'ok',
    );
    toast('Distribution saved.');
    render();
  } catch (err) {
    setStatus(`Unable to save distribution: ${err.message}`, 'err');
    toast(`Unable to save distribution: ${err.message}`, 'err');
  } finally {
    dom.save.disabled = false;
  }
};

/* ---------- draft transitions ---------- */
const resetScope = () => {
  state.draft.scopeLevel = '';
  state.draft.coverages = [];
  state.draft.additions = [];
};

const resetFootprint = () => {
  state.draft.licensedStates = {};
};

const resetAll = () => {
  state.draft = blankDraft();
  state.search = '';
  dom.stateSearch.value = '';
  dom.form.reset();
  dom.bindingLimit.value = '';
  dom.commissionPercent.value = '';
  render();
  setStatus('Cleared. Select an organization type to begin.');
};

/* ---------- events ---------- */
// Selects and number inputs are the source of truth for those fields, so pull them into the
// draft before invalidating everything downstream of the control that just changed.
const commit = (reset) => {
  syncInputs();
  reset?.();
  render();
};

dom.organizationType.addEventListener('change', () =>
  commit(() => {
    state.draft.organizationId = '';
    state.draft.productId = '';
    resetFootprint();
    resetScope();
  }),
);

dom.organizationId.addEventListener('change', () =>
  commit(() => {
    state.draft.productId = '';
    resetFootprint();
    resetScope();
  }),
);

dom.productId.addEventListener('change', () => commit(resetScope));

dom.stateSearch.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderStateList();
});

dom.stateList.addEventListener('change', (event) => {
  const code = event.target.dataset.state;
  if (!code) return;
  const row = state.stateByCode.get(code);
  if (event.target.checked) state.draft.licensedStates[code] = { code, name: row?.name ?? code, excludedCities: [] };
  else delete state.draft.licensedStates[code];
  event.target.closest('.state-row')?.classList.toggle('checked', event.target.checked);
  setError('licensedStates', '');
  renderFootprint();
  refresh();
});

dom.footprint.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const entry = state.draft.licensedStates[button.dataset.state];
  if (!entry) return;
  if (button.dataset.action === 'toggle-city') {
    const city = button.dataset.city;
    const at = entry.excludedCities.indexOf(city);
    if (at < 0) entry.excludedCities.push(city);
    else entry.excludedCities.splice(at, 1);
  }
  if (button.dataset.action === 'reset-cities') entry.excludedCities = [];
  renderFootprint();
  refresh();
});

dom.scopeLevels.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-level]');
  if (!button) return;
  state.draft.scopeLevel = state.draft.scopeLevel === button.dataset.level ? '' : button.dataset.level;
  if (state.draft.scopeLevel !== 'COVERAGE') state.draft.coverages = [];
  if (state.draft.scopeLevel !== 'ADDITIONAL') state.draft.additions = [];
  setError('coverageScope', '');
  render();
});

dom.coverageTree.addEventListener('change', (event) => {
  const box = event.target;
  if (box.dataset.cov) {
    const key = box.dataset.cov;
    const at = state.draft.coverages.indexOf(key);
    if (box.checked && at < 0) state.draft.coverages.push(key);
    if (!box.checked && at >= 0) state.draft.coverages.splice(at, 1);
  }
  if (box.dataset.add) {
    const key = box.dataset.add;
    const at = state.draft.additions.indexOf(key);
    if (box.checked && at < 0) state.draft.additions.push(key);
    if (!box.checked && at >= 0) state.draft.additions.splice(at, 1);
  }
  box.closest('label')?.classList.toggle('checked', box.checked);
  setError('coverageScope', '');
  renderScopeSummary();
  refresh();
});

dom.coverageTree.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="all-additions"]');
  if (!button) return;
  const { classOfBusiness, coverage } = splitKey(button.dataset.cov);
  const group = coverageGroups().find((row) => row.classOfBusiness === classOfBusiness);
  const row = group?.coverages.find((item) => item.coverage === coverage);
  const keys = (row?.additions ?? []).map((name) => addKey(classOfBusiness, coverage, name));
  const complete = keys.every((key) => state.draft.additions.includes(key));
  state.draft.additions = complete
    ? state.draft.additions.filter((key) => !keys.includes(key))
    : [...new Set([...state.draft.additions, ...keys])];
  button.textContent = complete ? 'Select all' : 'Clear';
  syncScopeChecks();
  renderScopeSummary();
  refresh();
});

dom.authority.addEventListener('change', () => {
  syncInputs();
  setError('authority', '');
  setError('bindingLimit', '');
  renderAuthority();
  refresh();
});

// Group-level errors have no input to mark, so they are cleared as soon as the group becomes valid.
[dom.bindingLimit, dom.commissionPercent].forEach((input) =>
  input.addEventListener('input', () => {
    syncInputs();
    setError(input.name, '');
    refresh();
  }),
);
dom.commissionBasis.addEventListener('change', () => {
  syncInputs();
  setError('commissionBasis', '');
  refresh();
});

dom.form.addEventListener('submit', save);
dom.reset.addEventListener('click', resetAll);

/* ---------- boot ---------- */
const load = async () => {
  try {
    const [organizations, products, states, records] = await Promise.all([
      organizationsApi.list(),
      productsApi.list(),
      statesApi.list(),
      distributionApi.list(),
    ]);
    state.organizations = organizations;
    state.products = products;
    state.states = states;
    state.records = records;
    state.stateByCode = new Map(states.map((row) => [row.code, row]));
  } catch (err) {
    toast(`Unable to load distribution data: ${err.message}`, 'err');
    setStatus('Distribution data could not be loaded. Refresh to try again.', 'err');
    return;
  }

  dom.organizationType.innerHTML = optionHtml(ORGANIZATION_TYPES, 'Select organization type');
  dom.authority.innerHTML = optionHtml(AUTHORITIES, 'Select authority');
  dom.commissionBasis.innerHTML = optionHtml(COMMISSION_BASES, 'Select commission basis');

  render();
  setStatus('Select an organization type to begin configuring distribution.');
};

load();