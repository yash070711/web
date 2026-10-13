import { api } from './api.js';

const organizationsApi = api('organizations');
const productsApi = api('products');
const statesApi = api('states');
const distributionApi = api('distribution');

/* ---------- option lists shared by the form ---------- */
const ORGANIZATION_TYPES = ['Risk Carrier', 'MGU', 'MGA', 'Broker'];
const ARRANGEMENTS = ['Fronting', 'Non-Fronting'];
const AUTHORITIES = ['Binding', 'Binding + Rating'];
const BUSINESS_TYPES = ['New', 'Renew'];
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
  productId: el('productId'),
  productHint: el('productHint'),
  arrangement: el('arrangement'),
  stateSearch: el('stateSearch'),
  stateList: el('stateList'),
  footprint: el('footprint'),
  scopeLevel: el('coverageScope'),
  scopeLevelHint: el('scopeLevelHint'),
  coverageTree: el('coverageTree'),
  scopeSummary: el('scopeSummary'),
  authority: el('authority'),
  businessType: el('businessType'),
  bindingLimitField: el('bindingLimitField'),
  bindingLimit: el('bindingLimit'),
  commissionPercent: el('commissionPercent'),
  commissionBasis: el('commissionBasis'),
  ruleCoverage: el('ruleCoverage'),
  ruleLocation: el('ruleLocation'),
  writtenCoverageLimit: el('writtenCoverageLimit'),
  referToUnderwriter: el('referToUnderwriter'),
  addReferralRule: el('addReferralRule'),
  referralSummary: el('referralSummary'),
  listSearch: el('distributionSearch'),
  listRows: el('distributionRows'),
  listCount: el('distributionListCount'),
  listPager: el('distributionPager'),
  listTable: el('distributionTable'),
  clearFilters: el('clearDistributionFilters'),
  detailDialog: el('distributionDetailDialog'),
  detailBody: el('distributionDetailBody'),
  closeDetail: el('closeDistributionDetail'),
  status: el('formStatus'),
  save: el('saveBtn'),
  reset: el('resetBtn'),
  configureBtn: el('configureBtn'),
  backToListBtn: el('backToListBtn'),
  listView: el('listView'),
  configView: el('configView'),
  pageTitle: el('pageTitle'),
  toast: el('toast'),
};

const blankDraft = () => ({
  organizationType: '',
  organizationId: '',
  productId: '',
  licensedStates: {},
  scopeLevel: '',
  coverages: [],
  additions: [],
  businessType: '',
  referralRules: [],
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
  list: { page: 1, size: 8, sort: 'updatedAt', direction: 'desc' },
  editingId: '',
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

const requiresBindingLimit = () => state.draft.authority === 'Binding';

const coverageRuleOptions = () =>
  coverageGroups().flatMap((group) =>
    group.coverages.map((row) => ({ value: covKey(group.classOfBusiness, row.coverage), label: `${group.classOfBusiness} · ${row.coverage}` })),
  );

const locationRuleOptions = () =>
  Object.values(state.draft.licensedStates).flatMap((row) => {
    const cities = state.stateByCode.get(row.code)?.cities ?? [];
    return [
      { value: `${row.code}|`, label: `${row.code} · Entire state` },
      ...cities.map((city) => ({ value: `${row.code}|${city}`, label: `${row.code} · ${city}` })),
    ];
  });

const enforceReferralThresholds = () => {
  const requestedLimit = Number(state.draft.bindingLimit);
  if (!requiresBindingLimit() || !(requestedLimit > 0)) return;
  state.draft.referralRules.forEach((rule) => {
    if (requestedLimit > Number(rule.writtenLimit)) rule.referToUnderwriter = true;
  });
};

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

/* ---------- render: product + arrangement ---------- */
const renderProducts = () => {
  const rows = activeProducts();
  const organizationSelected = Boolean(state.draft.organizationId);
  dom.productId.innerHTML = !organizationSelected
    ? '<option value="">Select an organization first</option>'
    : rows.length
    ? optionHtml(rows.map((row) => ({ value: row.id, label: productLabel(row) })), 'Select product')
    : '<option value="">No products available</option>';
  dom.productId.disabled = !organizationSelected || !rows.length;
  setSelectValue(dom.productId, state.draft.productId);
};

const renderArrangement = () => {
  const arrangement = arrangementOf(currentProduct());
  dom.arrangement.textContent = arrangement || '—';
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
// One dropdown carries all three distribution levels; the hint spells out what the choice means.
const renderScopeLevel = () => {
  const level = SCOPE_LEVELS.find((row) => row.value === state.draft.scopeLevel);
  dom.scopeLevel.innerHTML = optionHtml(
    SCOPE_LEVELS.map((row) => ({ value: row.value, label: row.label })),
    'Select distribution level',
  );
  // Nothing to scope until a product supplies the coverage tree.
  dom.scopeLevel.disabled = !state.draft.productId;
  setSelectValue(dom.scopeLevel, state.draft.scopeLevel);
  dom.scopeLevelHint.textContent = level
    ? level.hint
    : 'All coverages, entire individual coverage, or additional coverage under a particular coverage.';
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
  const required = requiresBindingLimit();
  dom.bindingLimitField.hidden = !required;
  dom.bindingLimit.required = required;
};

const renderReferralRules = () => {
  const coverages = coverageRuleOptions();
  const locations = locationRuleOptions();
  dom.ruleCoverage.innerHTML = optionHtml(coverages, coverages.length ? 'Select coverage' : 'Select a product first');
  dom.ruleLocation.innerHTML = optionHtml(locations, locations.length ? 'Select licensed location' : 'Select a licensed state first');
  dom.addReferralRule.disabled = !coverages.length || !locations.length;
  dom.referralSummary.innerHTML = state.draft.referralRules.length
    ? state.draft.referralRules
        .map((rule, index) => `<div class="referral-rule"><div><strong>${esc(rule.coverageLabel)}</strong><span>${esc(rule.locationLabel)}</span><span>Written limit: ${usd(rule.writtenLimit)}</span><span class="tag${rule.referToUnderwriter ? ' warn' : ''}">${rule.referToUnderwriter ? 'Refer to Underwriter' : 'No referral'}</span></div><button class="btn sm danger" type="button" data-remove-referral="${index}">Remove</button></div>`)
        .join('')
    : '<div class="hint">No location-specific coverage rules configured.</div>';
};

const listFilters = () => ({
  organizationType: el('filterOrganizationType').value,
  organizationName: el('filterOrganization').value,
  productName: el('filterProduct').value,
  arrangement: el('filterArrangement').value,
  coverage: el('filterCoverage').value,
  state: el('filterState').value,
  authority: el('filterAuthority').value,
  commissionBasis: el('filterCommissionBasis').value,
  status: el('filterStatus').value,

  search: dom.listSearch.value.trim().toLowerCase(),
});

const scopeLabel = (row) => ({ ALL: 'All Coverages', COVERAGE: 'Specific Coverage', ADDITIONAL: 'Additional Coverage/Sub-Coverage' }[row.coverageScope?.level] ?? '—');
const effectiveDate = (row) => String(row.effectiveDate || row.createdAt || '').slice(0, 10);
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
};
const locationSummary = (row) => {
  const states = row.licensedStates ?? [];
  const cities = states.reduce((sum, item) => sum + (item.excludedCities?.length ?? 0), 0);
  return `${states.length} state${states.length === 1 ? '' : 's'}${cities ? `, ${cities} ${cities === 1 ? 'city' : 'cities'} excluded` : ''}`;
};
const excludedCitiesSummary = (row) => {
  const cities = (row.licensedStates ?? []).flatMap((item) => (item.excludedCities ?? []).map((city) => `${item.code}: ${city}`));
  return cities.length ? `${cities.slice(0, 2).join(', ')}${cities.length > 2 ? ` +${cities.length - 2}` : ''}` : '—';
};

const fillListFilter = (id, values, placeholder) => {
  const node = el(id); const selected = node.value;
  node.innerHTML = optionHtml([...new Set(values.filter(Boolean))].sort(), placeholder);
  node.value = selected;
};

const renderListFilters = () => {
  fillListFilter('filterOrganizationType', state.records.map((row) => row.organizationType), 'All organization types');
  fillListFilter('filterOrganization', state.records.map((row) => row.organizationName), 'All organizations');
  fillListFilter('filterProduct', state.records.map((row) => row.productName), 'All products');
  fillListFilter('filterArrangement', state.records.map((row) => row.arrangement), 'All arrangements');
  fillListFilter('filterCoverage', state.records.map(scopeLabel), 'All coverage scopes');
  fillListFilter('filterState', state.records.flatMap((row) => (row.licensedStates ?? []).map((item) => item.code)), 'All states');
  fillListFilter('filterAuthority', state.records.map((row) => row.authority), 'All authorities');
  fillListFilter('filterCommissionBasis', state.records.map((row) => row.commission?.basis), 'All commission bases');
  fillListFilter('filterStatus', state.records.map((row) => row.status), 'All statuses');
};

const filteredDistributions = () => {
  const f = listFilters();
  return state.records.filter((row) => {
    const matches = (value, filter) => !filter || value === filter;
    const search = !f.search || `${row.organizationName} ${row.productName}`.toLowerCase().includes(f.search);
    return search && matches(row.organizationType, f.organizationType) && matches(row.organizationName, f.organizationName) && matches(row.productName, f.productName) && matches(row.arrangement, f.arrangement) && matches(scopeLabel(row), f.coverage) && matches(row.authority, f.authority) && matches(row.commission?.basis, f.commissionBasis) && matches(row.status, f.status) && (!f.state || (row.licensedStates ?? []).some((item) => item.code === f.state));
  });
};

const renderDistributionList = () => {
  const rows = filteredDistributions(); const { sort, direction, size } = state.list;
  const sortValue = (row) => sort === 'coverage' ? scopeLabel(row) : sort === 'commission' ? row.commission?.percent : sort === 'effectiveDate' ? effectiveDate(row) : row[sort] ?? '';
  rows.sort((a, b) => String(sortValue(a)).localeCompare(String(sortValue(b)), undefined, { numeric: true }) * (direction === 'asc' ? 1 : -1));
  const pages = Math.max(1, Math.ceil(rows.length / size)); state.list.page = Math.min(state.list.page, pages);
  const visible = rows.slice((state.list.page - 1) * size, state.list.page * size);
  dom.listCount.textContent = `${rows.length} saved configuration${rows.length === 1 ? '' : 's'}`;
  dom.listRows.innerHTML = visible.length ? visible.map((row) => `<tr><td>${esc(row.organizationType)}</td><td>${esc(row.organizationName)}</td><td>${esc(row.productName)}</td><td>${esc(row.arrangement || '—')}</td><td>${esc(scopeLabel(row))}</td><td><button class="btn sm" data-action="view" data-id="${esc(row.id)}">${esc(locationSummary(row))}</button></td><td>${esc(excludedCitiesSummary(row))}</td><td>${esc(row.authority || '—')}</td><td class="right">${row.bindingLimit ? usd(row.bindingLimit) : '—'}</td><td>${row.commission?.percent ?? '—'}%<div class="sub">${esc(row.commission?.basis || '')}</div></td><td><span class="badge ${row.status === 'active' ? 'live' : 'draft'}">${esc(row.status || 'draft')}</span></td><td>${formatDate(effectiveDate(row))}</td><td>${formatDate(row.updatedAt)}</td><td><div class="tools"><button class="btn sm" data-action="view" data-id="${esc(row.id)}">View</button><button class="btn sm" data-action="edit" data-id="${esc(row.id)}">Edit</button><button class="btn sm" data-action="duplicate" data-id="${esc(row.id)}">Duplicate</button><button class="btn sm danger" data-action="${row.status === 'disabled' ? 'delete' : 'disable'}" data-id="${esc(row.id)}">${row.status === 'disabled' ? 'Delete' : 'Disable'}</button></div></td></tr>`).join('') : '<tr><td colspan="14"><div class="empty">No distributions match the selected filters.</div></td></tr>';
  dom.listPager.innerHTML = `<span class="pager-info">Page ${state.list.page} of ${pages}</span><div class="pager-controls"><button class="pg" data-page="prev" ${state.list.page === 1 ? 'disabled' : ''}>Previous</button><button class="pg" data-page="next" ${state.list.page === pages ? 'disabled' : ''}>Next</button></div>`;
};

const showDistributionDetail = (row) => {
  const locations = (row.licensedStates ?? []).map((item) => `<li><strong>${esc(item.name || item.code)}</strong>${item.excludedCities?.length ? ` — excluded: ${esc(item.excludedCities.join(', '))}` : ''}</li>`).join('') || '<li>No states selected</li>';
  dom.detailBody.innerHTML = `<dl class="detail-list"><div><dt>Organization</dt><dd>${esc(row.organizationType)} · ${esc(row.organizationName)}</dd></div><div><dt>Product</dt><dd>${esc(row.productName)} · ${esc(row.arrangement || '—')}</dd></div><div><dt>Coverage Scope</dt><dd>${esc(scopeLabel(row))}</dd></div><div><dt>Authority</dt><dd>${esc(row.authority || '—')}${row.bindingLimit ? ` · ${usd(row.bindingLimit)}` : ''}</dd></div><div><dt>Commission</dt><dd>${row.commission?.percent ?? '—'}% · ${esc(row.commission?.basis || '—')}</dd></div><div><dt>Status</dt><dd>${esc(row.status || 'draft')}</dd></div><div class="full"><dt>Licensed States / Excluded Cities</dt><dd><ul class="location-detail">${locations}</ul></dd></div></dl>`;
  dom.detailDialog.showModal();
};

const editDistribution = (row) => {
  const scope = row.coverageScope ?? {};
  state.editingId = row.id;
  state.draft = {
    ...blankDraft(),
    organizationType: row.organizationType || '', organizationId: row.organizationId || '', productId: row.productId || '', authority: row.authority || '', bindingLimit: row.bindingLimit ?? '', businessType: row.businessType || '', commissionPercent: row.commission?.percent ?? '', commissionBasis: row.commission?.basis || '', scopeLevel: scope.level || '',
    coverages: [...(scope.coverages ?? [])],
    additions: (scope.additions ?? []).map((item) => addKey(item.classOfBusiness, item.coverage, item.addition)),
    referralRules: [...(row.coverageReferralRules ?? [])],
    licensedStates: Object.fromEntries((row.licensedStates ?? []).map((item) => [
      item.code,
      { code: item.code, name: item.name || item.code, excludedCities: [...(item.excludedCities ?? [])] },
    ])),
  };
  dom.bindingLimit.value = state.draft.bindingLimit;
  dom.commissionPercent.value = state.draft.commissionPercent;
  if (dom.listView) dom.listView.style.display = 'none';
  if (dom.configView) dom.configView.style.display = 'block';
  if (dom.configureBtn) dom.configureBtn.style.display = 'none';
  if (dom.backToListBtn) dom.backToListBtn.style.display = 'inline-block';
  if (dom.pageTitle) dom.pageTitle.textContent = 'Distribution Configuration';
  render();
  document.querySelector('.page-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus(`Editing ${row.productName} for ${row.organizationName}.`, 'ok');
};

const refreshDistributionList = () => { renderListFilters(); renderDistributionList(); };

/* ---------- master render ---------- */
const render = () => {
  clearErrors();
  // Own all three selects from the draft so a Reset never depends on form.reset() alone.
  setSelectValue(dom.organizationType, state.draft.organizationType);
  setSelectValue(dom.businessType, state.draft.businessType);
  renderOrganizations();
  renderProducts();
  renderProductHint();
  renderArrangement();
  renderStateList();
  renderFootprint();
  renderScopeLevel();
  renderCoverageTree();
  renderScopeSummary();
  renderAuthority();
  renderReferralRules();
  updateStatus();
};

// Selects and number inputs keep their value across a re-render; checkboxes live in the draft.
const syncInputs = () => {
  const draft = state.draft;
  draft.organizationType = dom.organizationType.value;
  draft.organizationId = dom.organizationId.value;
  draft.productId = dom.productId.value;
  draft.scopeLevel = dom.scopeLevel.value;
  draft.businessType = dom.businessType.value;
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
  if (!draft.businessType) errors.businessType = 'Select a business type.';
  if (requiresBindingLimit() && !(Number(draft.bindingLimit) > 0)) {
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

// Every edit refreshes the live validation count.
const refresh = () => {
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
  enforceReferralThresholds();
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
    businessType: draft.businessType,
    bindingLimit: requiresBindingLimit() ? Number(draft.bindingLimit) : null,
    coverageReferralRules: draft.referralRules.map((rule) => ({ ...rule })),
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
  const existing = state.editingId
    ? state.records.find((row) => row.id === state.editingId)
    : state.records.find((row) => row.organizationId === org.id && row.productId === product.id);
  dom.save.disabled = true;
  try {
    const record = await (existing
      ? distributionApi.update(existing.id, buildRecord(existing))
      : distributionApi.create(buildRecord(null)));
    const index = state.records.findIndex((row) => row.id === record.id);
    if (index < 0) state.records.push(record);
    else state.records[index] = record;
    state.editingId = record.id;
    refreshDistributionList();
    const states = Object.keys(state.draft.licensedStates).length;
    const binding = record.bindingLimit ? ` · ${usd(record.bindingLimit)} binding` : '';
    setStatus(
      `Saved ${record.productCode ?? record.productName} to ${record.organizationName} · ${states} state${states === 1 ? '' : 's'}${binding} · ${record.commission.percent}% ${record.commission.basis}.`,
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
  state.draft.referralRules = [];
};

const resetFootprint = () => {
  state.draft.licensedStates = {};
  state.draft.referralRules = [];
};

const resetAll = () => {
  state.editingId = '';
  state.draft = blankDraft();
  state.search = '';
  dom.stateSearch.value = '';
  if (dom.form) dom.form.reset();
  dom.bindingLimit.value = '';
  dom.commissionPercent.value = '';
  render();
  setStatus('');
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
  else {
    delete state.draft.licensedStates[code];
    state.draft.referralRules = state.draft.referralRules.filter((rule) => rule.state !== code);
  }
  event.target.closest('.state-row')?.classList.toggle('checked', event.target.checked);
  setError('licensedStates', '');
  renderFootprint();
  renderReferralRules();
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

// Changing the level invalidates anything that no longer applies, but keeps the user's pick.
dom.scopeLevel.addEventListener('change', () => {
  state.draft.scopeLevel = dom.scopeLevel.value;
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
  if (!requiresBindingLimit()) {
    state.draft.bindingLimit = '';
    dom.bindingLimit.value = '';
  }
  setError('authority', '');
  setError('bindingLimit', '');
  renderAuthority();
  refresh();
});

dom.businessType.addEventListener('change', () => {
  syncInputs();
  setError('businessType', '');
  refresh();
});

dom.addReferralRule.addEventListener('click', () => {
  const coverage = coverageRuleOptions().find((row) => row.value === dom.ruleCoverage.value);
  const location = locationRuleOptions().find((row) => row.value === dom.ruleLocation.value);
  const writtenLimit = Number(dom.writtenCoverageLimit.value);
  if (!coverage || !location || !(writtenLimit > 0)) {
    setError('referralRules', 'Select a coverage and location, then enter a written coverage limit.');
    return;
  }
  const [stateCode, city] = location.value.split('|');
  const referToUnderwriter = dom.referToUnderwriter.checked || Number(state.draft.bindingLimit) > writtenLimit;
  state.draft.referralRules.push({
    coverage: coverage.value,
    coverageLabel: coverage.label,
    state: stateCode,
    city: city || null,
    locationLabel: location.label,
    writtenLimit,
    referToUnderwriter,
  });
  dom.writtenCoverageLimit.value = '';
  dom.referToUnderwriter.checked = true;
  setError('referralRules', '');
  renderReferralRules();
  refresh();
});

dom.referralSummary.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-remove-referral]');
  if (!button) return;
  state.draft.referralRules.splice(Number(button.dataset.removeReferral), 1);
  renderReferralRules();
  refresh();
});

['filterOrganizationType', 'filterOrganization', 'filterProduct', 'filterArrangement', 'filterCoverage', 'filterState', 'filterAuthority', 'filterCommissionBasis', 'filterStatus'].forEach((id) => el(id).addEventListener('change', () => { state.list.page = 1; renderDistributionList(); }));
dom.listSearch.addEventListener('input', () => { state.list.page = 1; renderDistributionList(); });
dom.clearFilters.addEventListener('click', () => {
  dom.listSearch.value = '';
  ['filterOrganizationType', 'filterOrganization', 'filterProduct', 'filterArrangement', 'filterCoverage', 'filterState', 'filterAuthority', 'filterCommissionBasis', 'filterStatus'].forEach((id) => { el(id).value = ''; });
  state.list.page = 1; renderDistributionList();
});
dom.listTable.querySelector('thead').addEventListener('click', (event) => {
  const head = event.target.closest('th[data-sort]'); if (!head) return;
  const key = head.dataset.sort;
  state.list.direction = state.list.sort === key && state.list.direction === 'asc' ? 'desc' : 'asc'; state.list.sort = key; renderDistributionList();
});
dom.listPager.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-page]'); if (!button) return;
  state.list.page += button.dataset.page === 'next' ? 1 : -1; renderDistributionList();
});
dom.listRows.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const row = state.records.find((item) => item.id === button.dataset.id); if (!row) return;
  if (button.dataset.action === 'view') return showDistributionDetail(row);
  if (button.dataset.action === 'edit') return editDistribution(row);
  if (button.dataset.action === 'duplicate') {
    const copy = await distributionApi.create({ ...row, status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    state.records.push(copy); refreshDistributionList(); toast('Distribution duplicated.'); return;
  }
  if (button.dataset.action === 'disable') {
    const updated = await distributionApi.update(row.id, { ...row, status: 'disabled', updatedAt: new Date().toISOString() });
    state.records[state.records.findIndex((item) => item.id === row.id)] = updated; refreshDistributionList(); toast('Distribution disabled.'); return;
  }
  if (button.dataset.action === 'delete') {
    await distributionApi.remove(row.id); state.records = state.records.filter((item) => item.id !== row.id); refreshDistributionList(); toast('Distribution deleted.');
  }
});
dom.closeDetail.addEventListener('click', () => dom.detailDialog.close());

// Group-level errors have no input to mark, so they are cleared as soon as the group becomes valid.
[dom.bindingLimit, dom.commissionPercent].forEach((input) =>
  input.addEventListener('input', () => {
    syncInputs();
    if (input === dom.bindingLimit) {
      enforceReferralThresholds();
      renderReferralRules();
    }
    setError(input.name, '');
    refresh();
  }),
);
dom.commissionBasis.addEventListener('change', () => {
  syncInputs();
  setError('commissionBasis', '');
  refresh();
});

if (dom.form) dom.form.addEventListener('submit', save);
if (dom.reset) dom.reset.addEventListener('click', resetAll);
if (dom.configureBtn) {
  dom.configureBtn.addEventListener('click', () => {
    state.editingId = '';
    state.draft = blankDraft();
    state.search = '';
    if (dom.stateSearch) dom.stateSearch.value = '';
    if (dom.form) dom.form.reset();
    dom.bindingLimit.value = '';
    dom.commissionPercent.value = '';
    if (dom.listView) dom.listView.style.display = 'none';
    if (dom.configView) dom.configView.style.display = 'block';
    if (dom.configureBtn) dom.configureBtn.style.display = 'none';
    if (dom.backToListBtn) dom.backToListBtn.style.display = 'inline-block';
    if (dom.pageTitle) dom.pageTitle.textContent = 'Distribution Configuration';
    render();
    setStatus('');
    document.querySelector('.page-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
if (dom.backToListBtn) {
  dom.backToListBtn.addEventListener('click', () => {
    if (dom.configView) dom.configView.style.display = 'none';
    if (dom.listView) dom.listView.style.display = 'block';
    if (dom.configureBtn) dom.configureBtn.style.display = 'inline-block';
    if (dom.backToListBtn) dom.backToListBtn.style.display = 'none';
    if (dom.pageTitle) dom.pageTitle.textContent = 'My Distributions';
    refreshDistributionList();
  });
}

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
  dom.businessType.innerHTML = optionHtml(BUSINESS_TYPES, 'Select business type');
  dom.authority.innerHTML = optionHtml(AUTHORITIES, 'Select authority');
  dom.commissionBasis.innerHTML = optionHtml(COMMISSION_BASES, 'Select commission basis');

  render();
  refreshDistributionList();
  if (dom.listView) dom.listView.style.display = 'block';
  if (dom.configView) dom.configView.style.display = 'none';
  if (dom.configureBtn) dom.configureBtn.style.display = 'inline-block';
  if (dom.backToListBtn) dom.backToListBtn.style.display = 'none';
  if (dom.pageTitle) dom.pageTitle.textContent = 'My Distributions';
};

load();
