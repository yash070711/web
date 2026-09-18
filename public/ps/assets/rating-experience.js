/* Rating Guide — guided, browser-only pricing experience for non-technical users. */
(function () {
  'use strict';

  const STORE_KEY = 'insurance-product-studio-rating-gui-v1';
  const STEPS = [
    { id:'base', name:'Base Price', desc:'Product starting price' },
    { id:'state', name:'State Pricing', desc:'State-specific pricing' },
    { id:'coverage', name:'Coverage Pricing', desc:'Coverage adjustments' },
    { id:'risk', name:'Risk Rating', desc:'Risk Rating Factors' },
    { id:'discounts', name:'Discounts', desc:'Approved savings' },
    { id:'fees', name:'Fees & taxes', desc:'Required charges' },
    { id:'preview', name:'Price Preview', desc:'Test a customer scenario' },
    { id:'review', name:'Review', desc:'Check the complete pricing setup' }
  ];
  const US_STATES = [
    ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
    ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
    ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
    ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
    ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
    ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
    ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
    ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
    ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
    ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
    ['DC','District of Columbia']
  ];
  function stateName(code) { return (US_STATES.find(s => s[0] === code) || [code, code])[1]; }
  const FALLBACK_TEMPLATES = [
    { id:'motor-truck', family:'Trucking', match:'Commercial Truck', name:'Commercial truck · Comprehensive', base:1850, unit:'per year', source:'Trucking pricing library', evidence:'Based on 18 comparable heavy-vehicle products', updated:'12 Aug 2026', fit:'Best match' },
    { id:'cyber-sme', family:'Cyber', match:'Cyber', name:'Cyber liability · SME', base:2400, unit:'per year', source:'Cyber pricing library', evidence:'Based on 24 comparable cyber products', updated:'20 Aug 2026', fit:'Best match' },
    { id:'property-sme', family:'Property', name:'Small business property', base:740, unit:'per year', source:'Commercial pricing library', evidence:'Based on 27 comparable products', updated:'11 Aug 2026', fit:'Best match' },
    { id:'marine-cargo', family:'Marine', name:'Marine cargo · Open cover', base:520, unit:'per shipment', source:'Marine pricing library', evidence:'Based on 16 comparable products', updated:'07 Aug 2026', fit:'Best match' },
    { id:'travel-annual', family:'Travel', name:'Worldwide annual travel', base:145, unit:'per traveller / year', source:'Travel pricing library', evidence:'Based on 36 comparable products', updated:'15 Aug 2026', fit:'Best match' },
    { id:'general', family:'General', name:'General insurance starter', base:300, unit:'per year', source:'Central pricing library', evidence:'Conservative portfolio benchmark', updated:'18 Aug 2026', fit:'Available' }
  ];
  let TEMPLATES = [];
  const FIELD_OPTIONS = {
    driverAge:{ label:'Driver age', type:'number', placeholder:'e.g. 25' },
    vehicleAge:{ label:'Vehicle age', type:'number', placeholder:'e.g. 5' },
    location:{ label:'Where the vehicle is kept', type:'select', values:[['metro','Large city'],['town','Town or small city'],['rural','Rural area']] },
    use:{ label:'How the vehicle is used', type:'select', values:[['personal','Personal trips only'],['commute','Personal trips and commuting'],['business','Business use']] },
    claims:{ label:'Claims in the last 3 years', type:'number', placeholder:'e.g. 1' },
    claimFreeYears:{ label:'Claim-free years', type:'number', placeholder:'e.g. 3' },
    vehicleValue:{ label:'Vehicle value', type:'number', placeholder:'e.g. 25000' },
    convictions:{ label:'Driving convictions', type:'select', values:[['yes','Yes'],['no','No']] }
  };
  let root;
  let activeStep = 'base';
  let pageResult = null;
  let lastEstimate = null;
  let context;
  let product;
  let record;
  let stateSearch = '';
  let stateFilter = 'all';
  let previewState = '';
  let previewInputs = {};

  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const money = value => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:2 }).format(Number(value) || 0);
  const round = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const clone = value => JSON.parse(JSON.stringify(value));

  function centralLibraryHref() {
    if (location.pathname.includes('/proto')) return '/proto/pricing-library.html';
    return 'pricing-library.html';
  }

  function libraryLink(label = 'Open central library') {
    return `<a class="btn btn-ghost btn-sm" href="${esc(centralLibraryHref())}" data-rating-link="library">${esc(label)}</a>`;
  }

  function getContext() {
    const query = new URLSearchParams(location.search);
    const id = query.get('product') || query.get('id') || 'PRD-015';
    const known = window.PS?.prototypeApp?.productById(id) || window.PS?.data?.products?.find(item => item.id === id);
    return { productId:id, version:query.get('version') || known?.version || '2026.04' };
  }

  function refreshTemplatesFromCentral() {
    const central = window.PS?.centralPricing?.getState?.();
    const source = central?.templates?.length ? central.templates : FALLBACK_TEMPLATES;
    TEMPLATES = source.filter(item => !item.status || item.status === 'active').map(item => ({
      id: item.id,
      family: item.family || 'General',
      match: item.match || '',
      name: item.name,
      base: Number(item.base) || 0,
      unit: item.unit || 'per year',
      source: item.source || 'Central pricing library',
      evidence: item.evidence || 'Portfolio benchmark',
      updated: item.updated || item.reviewed || 'Not set',
      reviewed: item.reviewed,
      fit: item.fit || 'Approved central template',
      status: item.status || 'active'
    }));
  }

  function centralItemApplies(item) {
    if (!item) return false;
    if (item.status && item.status !== 'active') return false;
    const ids = item.linkedProductIds;
    if (!Array.isArray(ids) || !ids.length) return true;
    return ids.includes(context.productId);
  }

  function productDiscountKeys() {
    const map = [
      ['claimFree', 'discount-claim-free'],
      ['loyalty', 'discount-loyalty'],
      ['multi', 'discount-multi']
    ];
    return map.filter(([localKey, centralId]) => {
      const central = centralDiscount(centralId);
      return central && centralItemApplies(central) && record.discounts[localKey];
    });
  }

  function findProduct() {
    return window.PS?.prototypeApp?.productById(context.productId)
      || window.PS?.data?.products?.find(item => item.id === context.productId)
      || { id:context.productId, name:'Insurance product', family:'General', version:context.version, status:'draft' };
  }

  function automaticTemplate() {
    const family = String(product.family || 'General').toLowerCase();
    const name = String(product.name || '').toLowerCase();
    const matches = TEMPLATES.filter(template => (!template.status || template.status === "active") && template.family.toLowerCase() === family);
    const named = matches.filter(template => template.match && name.includes(template.match.toLowerCase()))
      .sort((a, b) => String(b.match).length - String(a.match).length);
    return named[0] || matches.find(template => !template.match) || matches[0] || TEMPLATES.at(-1);
  }

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (_) { return {}; }
  }

  function defaultRecord() {
    const template = automaticTemplate();
    return {
      templateId:template.id,
      lastSaved:new Date().toISOString(),
      bands:{
        driver:[{ label:'Under 25', action:'increase', value:25 },{ label:'25 to 69', action:'same', value:0 },{ label:'70 and over', action:'increase', value:15 }],
        vehicle:[{ label:'Up to 3 years old', action:'reduce', value:5 },{ label:'4 to 8 years old', action:'same', value:0 },{ label:'9 years or older', action:'increase', value:12 }],
        location:[{ label:'Large city', action:'increase', value:10 },{ label:'Town or small city', action:'same', value:0 },{ label:'Rural area', action:'reduce', value:5 }],
        use:[{ label:'Personal trips only', action:'same', value:0 },{ label:'Personal trips and commuting', action:'increase', value:5 },{ label:'Business use', action:'increase', value:15 }]
      },
      discounts:{ claimFree:{ enabled:true, name:'Claim-free reward', summary:'More claim-free years earn a larger saving.' }, loyalty:{ enabled:true, name:'Renewing customer', summary:'Existing customers receive a 5% saving.' }, multi:{ enabled:true, name:'More than one policy', summary:'Customers with another policy receive an 8% saving.' } },
      charges:{ admin:{ enabled:true, name:'Policy administration', kind:'fixed', value:18, managed:true }, stamp:{ enabled:true, name:'Stamp duty', kind:'fixed', value:6, managed:true }, tax:{ enabled:true, name:'Insurance tax', kind:'percent', value:18, managed:true } },
      customRules:[],
      riskRatingFactors:[],
      basePrice: null,
      pricingBasis: 'annual',
      statePricing: {},
      coveragePricing: {}
    };
  }
function ensureDefaultRiskRatingFactors(record) {
  record.riskRatingFactors = Array.isArray(record.riskRatingFactors)
    ? record.riskRatingFactors
    : [];

  // Every Risk Guide attribute automatically gets a Risk Rating Factor to
  // configure — no hardcoded attribute names, no dependency on specific
  // coverage names existing. Coverage assignment is left for the user to
  // set via Edit, since not every attribute maps to a single coverage.
  const attrs = getRiskAttributeOptions();

  attrs.forEach(attr => {
    const exists = record.riskRatingFactors.some(f => String(f.riskAttributeId) === String(attr.id));
    if (exists) return;

    record.riskRatingFactors.push({
      id: generateFactorId(record),
      name: `${attr.name} Factor`,
      type: 'factor',
      status: 'draft',
      coverage: '',
      coverageId: '',
      riskAttribute: attr.name,
      riskAttributeId: attr.id,
      ratingMethod: 'table',
      amount: 1,
      table: {
        id: '',
        sourceSheet: '',
        data: []
      },
      configured: false
    });
  });

  return record;
}
  function syncChargesFromCentral(loaded) {
    const central = window.PS?.centralPricing?.getState?.();
    if (!central) return loaded;
    const discountIds = { claimFree:'discount-claim-free', loyalty:'discount-loyalty', multi:'discount-multi' };
    Object.entries(discountIds).forEach(([localKey, centralId]) => {
      const source = central.discounts.find(item => item.id === centralId);
      if (source && loaded.discounts[localKey]) {
        loaded.discounts[localKey].name = source.name;
        loaded.discounts[localKey].centralScope = centralItemApplies(source);
      }
    });
    ['admin','stamp','tax'].forEach(localKey => {
      const source = central.charges.find(item => item.key === localKey && item.status === 'active');
      if (source && loaded.charges[localKey]) {
        const applies = centralItemApplies(source);
        Object.assign(loaded.charges[localKey], { name:source.name, kind:source.kind, value:source.value, managed:true, centralId:source.id, enabled: applies && loaded.charges[localKey].enabled !== false });
      }
    });
    return loaded;
  }

  function loadRecord() {
    const store = loadStore();
    const key = `${context.productId}::${context.version}`;
    const loaded = syncChargesFromCentral(Object.assign(defaultRecord(), store[key] || {}));
    // Backward compatibility: older saved records were created before Risk
    // Rating Factors existed, so they will not have this property at all.
if (!Array.isArray(loaded.riskRatingFactors))
  loaded.riskRatingFactors = [];

ensureDefaultRiskRatingFactors(loaded);

// Backward compatibility: older saved records predate explicit Base
// Price / State Pricing / Coverage Pricing configuration.
if (loaded.basePrice === undefined) loaded.basePrice = null;
if (!loaded.pricingBasis) loaded.pricingBasis = 'annual';
if (!loaded.statePricing || typeof loaded.statePricing !== 'object') loaded.statePricing = {};
if (!loaded.coveragePricing || typeof loaded.coveragePricing !== 'object') loaded.coveragePricing = {};

return loaded;
  }

  function centralDiscount(id) {
    return window.PS?.centralPricing?.getState?.().discounts.find(item => item.id === id && item.status === 'active') || null;
  }

  function linkCentralTemplate(templateId) {
    if (!window.PS?.centralPricing) return;
    const central = window.PS.centralPricing.getState();
    central.templates.forEach(item => { item.linkedProductIds = (item.linkedProductIds || []).filter(id => id !== context.productId); });
    const selected = central.templates.find(item => item.id === templateId);
    if (selected && !selected.linkedProductIds.includes(context.productId)) selected.linkedProductIds.push(context.productId);
    window.PS.centralPricing.addHistory(central, { action:'Linked', record:selected?.name || templateId, before:context.productId, after:`${context.productId} uses this template` });
    window.PS.centralPricing.replace(central, { type:'template-link', id:templateId });
  }

  function saveRecord(message) {
    // Keep the selected CPL template as the authoritative pricing reference.
    // Product Guide can consume this from the persisted rating record.
    const selectedTemplate = template();
    if (selectedTemplate?.id) record.templateId = selectedTemplate.id;
    record.lastSaved = new Date().toISOString();
    const store = loadStore();
    store[`${context.productId}::${context.version}`] = record;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('rating-pricing-template-updated', {
      detail: {
        productId: context.productId,
        version: context.version,
        templateId: record.templateId || null
      }
    }));
    syncRatingBundle();
    window.PS?.prototypeApp?.addAudit('MODIFIED', message || 'Updated guided pricing setup', { productId:context.productId, version:context.version });
  }

  function syncRatingBundle() {
  const app = window.PS?.prototypeApp;
  if (!app?.persistCollection) return;

  const tpl = template();

  /*
   * ------------------------------------------------------------
   * CUSTOM PRICING RULES
   * ------------------------------------------------------------
   */
  const customItems = (record.customRules || [])
    .filter(item => item.enabled !== false)
    .map(item => ({
      id: item.id,
      name: item.name,
      type: 'loading',
      status: 'done',
      value: item.action === 'fixed'
        ? `$${item.amount}`
        : `${item.amount}%`
    }));

  /*
   * ------------------------------------------------------------
   * STRUCTURED RISK RATING FACTORS
   *
   * Only completely configured factors are exported.
   *
   * Each factor owns its own coverage. The coverage/group heading
   * is NOT used to determine which coverage the factor belongs to.
   * ------------------------------------------------------------
   */
  const riskFactorsByCoverage = {};

  (record.riskRatingFactors || [])
    .filter(factor => {
      if (factor.configured !== true) return false;

      if (!factor.id) return false;
      if (!factor.name) return false;

      if (!factor.coverage) return false;
      if (!factor.coverageId) return false;

      if (!factor.riskAttribute) return false;
      if (!factor.riskAttributeId) return false;

      if (!factor.ratingMethod) return false;

      if (
        factor.amount === null ||
        factor.amount === undefined ||
        Number.isNaN(Number(factor.amount)) ||
        Number(factor.amount) <= 0
      ) {
        return false;
      }

      /*
       * Fixed factor:
       * only the default factor is required.
       */
      if (factor.ratingMethod === 'fixed') {
        return true;
      }

      /*
       * Table factor:
       * Table ID, Source Sheet and at least one valid row
       * are required.
       */
      if (factor.ratingMethod === 'table') {
        const rows = currentRiskFactorRows(factor);
        return Boolean(
          factor.table &&
          factor.table.id &&
          factor.table.sourceSheet &&
          rows.length > 0 &&
          rows.every(row =>
            row &&
            row.value !== undefined &&
            row.value !== null &&
            String(row.value).trim() !== '' &&
            !Number.isNaN(Number(row.factor)) &&
            Number(row.factor) > 0
          )
        );
      }

      return false;
    })
    .forEach(factor => {
      const groupName = factor.coverage;
      const sourceAttribute = getRiskAttributeOptions().find(item => String(item.id) === String(factor.riskAttributeId));
      const tableRows = currentRiskFactorRows(factor);

      if (!riskFactorsByCoverage[groupName]) {
        riskFactorsByCoverage[groupName] = [];
      }

      const exportedFactor = {
        id: factor.id,
        name: sourceAttribute ? `${sourceAttribute.name} Factor` : factor.name,
        type: 'factor',
        status: factor.status || 'done',

        /*
         * Coverage
         */
        coverage: factor.coverage,
        coverageId: factor.coverageId,

        /*
         * Risk Attribute
         */
        riskAttribute: sourceAttribute?.name || factor.riskAttribute,
        riskAttributeId: factor.riskAttributeId,
        riskCategory: sourceAttribute?.category || factor.riskCategory || '',

        /*
         * Rating Method
         */
        ratingMethod: factor.ratingMethod,

        /*
         * Default Factor
         */
        amount: Number(factor.amount),

        /*
         * Table configuration
         *
         * Fixed factors do not carry a table.
         */
        table: factor.ratingMethod === 'table'
          ? {
              id: factor.table.id,
              sourceSheet: factor.table.sourceSheet,
              data: tableRows.map(row => ({
                value: row.value,
                value2: row.value2 || '',
                operator: row.operator || '=',
                riskLevel: row.riskLevel || '',
                ratingImpact: row.ratingImpact || 'apply',
                factor: Number(row.factor)
              }))
            }
          : null,

        configured: true
      };

      riskFactorsByCoverage[groupName].push(exportedFactor);
    });

  /*
   * ------------------------------------------------------------
   * RISK FACTOR GROUPS
   * ------------------------------------------------------------
   */
  const riskFactorGroups = Object.entries(riskFactorsByCoverage)
    .map(([group, items]) => ({
      group,
      items
    }));

  /*
   * ------------------------------------------------------------
   * COMPLETE RATING COMPONENTS
   * ------------------------------------------------------------
   */
  const groups = [
{
  group: 'BASE PREMIUM',
  templateId: tpl.id,
  items: [
    hasBasePrice()
      ? {
          id: 'RAT-BR-GUI',
          name: 'Base Price',
          type: 'base',
          status: 'done',
          value: `${money(Number(record.basePrice))}/${record.pricingBasis === 'monthly' ? 'mo' : record.pricingBasis === 'per_unit' ? 'unit' : 'yr'}`,
          amount: String(record.basePrice),
          templateId: tpl.id,
          configured: true
        }
      : {
          id: 'RAT-BR-GUI',
          name: 'Base Price',
          type: 'base',
          status: 'draft',
          value: 'Not configured',
          amount: '',
          templateId: tpl.id,
          configured: false
        }
  ]
},

    /*
     * Structured Risk Rating Factors
     */
    ...riskFactorGroups,

    /*
     * Existing custom rules
     */
    ...(customItems.length
      ? [
          {
            group: 'CUSTOM RULES',
            items: customItems
          }
        ]
      : [])
  ];

  /*
   * ------------------------------------------------------------
   * PERSIST
   * ------------------------------------------------------------
   */
  app.persistCollection('ratingComponents', groups);
syncRatingFormulas();
  /*
   * Keep in-memory COMPONENTS synchronized.
   */
  if (typeof COMPONENTS !== 'undefined') {
    COMPONENTS.splice(
      0,
      COMPONENTS.length,
      ...groups
    );
  }
}
function syncRatingFormulas() {
  const app = window.PS?.prototypeApp;
  if (!app?.persistCollection) return;

  const formulas = [
    {
      name: 'Commercial Auto — Auto Liability',
      cob: 'Auto Liability',
      status: 'Active',
      tokens: ['BasePremium', 'RemainingFactors'],
      expression: 'BasePremium × RemainingFactors'
    },
    {
      name: 'Commercial Auto — Physical Damage',
      cob: 'Physical Damage',
      status: 'Active',
      tokens: ['BasePremium', 'RemainingFactors'],
      expression: 'BasePremium × RemainingFactors'
    }
  ];

  app.persistCollection('formulas', formulas);
}
  function hasBasePrice() {
    return record.basePrice !== null && record.basePrice !== undefined && record.basePrice !== '' && Number.isFinite(Number(record.basePrice)) && Number(record.basePrice) >= 0;
  }
  function isStateConfigured(cfg) {
    if (!cfg || !cfg.type || cfg.type === 'none') return false;
    return cfg.value !== null && cfg.value !== undefined && cfg.value !== '' && Number.isFinite(Number(cfg.value));
  }
  function isCoverageConfigured(cfg) {
    if (!cfg || !cfg.method || cfg.method === 'none') return false;
    return cfg.value !== null && cfg.value !== undefined && cfg.value !== '' && Number.isFinite(Number(cfg.value));
  }
  function calculateStateBase(code) {
    const base = Number(record.basePrice);
    if (!Number.isFinite(base)) return null;
    const cfg = record.statePricing[code];
    if (!isStateConfigured(cfg)) return base;
    const val = Number(cfg.value);
    if (cfg.type === 'override') return round(val);
    if (cfg.type === 'percentage') return round(base + (base * val / 100));
    if (cfg.type === 'flat') return round(base + val);
    return base;
  }

  function stepComplete(stepId) {
    if (stepId === 'base') return hasBasePrice();
    if (stepId === 'state') return getStateOptions().some(([code]) => isStateConfigured(record.statePricing[code]));
    if (stepId === 'coverage') return getCoverageOptions().some(cover => isCoverageConfigured(record.coveragePricing[cover.id]));
    if (stepId === 'risk') return true;
    if (stepId === 'discounts') return productDiscountKeys().some(([id]) => record.discounts[id]?.enabled);
    if (stepId === 'fees') return Object.values(record.charges).some(item => item.enabled !== false);
    if (stepId === 'preview') return Boolean(lastEstimate);
    return stepId === 'review';
  }

  function template() { return TEMPLATES.find(item => item.id === record.templateId) || automaticTemplate(); }
  function canEdit() { return window.PS?.prototypeApp ? window.PS.prototypeApp.canEditVersion() : /draft/i.test(context.version || product.status || ''); }
  function statusLabel() { return canEdit() ? 'Draft' : 'Published'; }
  function statusDetail() { return canEdit() ? 'Rating' : 'View only'; }
  function enabledRuleCount() {
    const activeDiscounts = productDiscountKeys().filter(([id]) => record.discounts[id]?.enabled).length;
    const activeCustom = record.customRules.filter(item => item.enabled !== false).length;
    const activeRiskFactors = (record.riskRatingFactors || []).filter(f => f.configured).length;
    const activeCoverage = getCoverageOptions().filter(c => isCoverageConfigured(record.coveragePricing[c.id])).length;
    const activeStates = getStateOptions().filter(([code]) => isStateConfigured(record.statePricing[code])).length;
    return activeDiscounts + activeCustom + activeRiskFactors + activeCoverage + activeStates;
  }

  function resultHtml() {
    if (!pageResult) return '<div id="rating-page-result"></div>';
    return `<div id="rating-page-result" class="rating-inline-result ${pageResult.type === 'error' ? 'error' : ''}" role="status"><div>${pageResult.type === 'error' ? '!' : '✓'}</div><div><strong>${esc(pageResult.title)}</strong><span>${esc(pageResult.detail)}</span></div><button class="btn btn-icon" data-rating-action="dismiss-result" aria-label="Dismiss">×</button></div>`;
  }

  function setResult(title, detail, type = 'success') {
    pageResult = { title, detail, type };
    render();
    document.getElementById('rating-page-result')?.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function refreshContextBar() {
    const ctx = document.getElementById('ctx-count');
    if (!ctx) return;
    const priceLabel = hasBasePrice() ? `${money(Number(record.basePrice))} base price` : 'Base price not configured';
    ctx.innerHTML = `<span class="studio-context-pill">${esc(context.productId)} · v${esc(context.version)}</span><span class="cs-stat">${esc(product.name || context.productId)}</span><span class="cs-stat">${esc(priceLabel)}</span><span class="cs-stat">${enabledRuleCount()} active decisions</span>`;
    const back = document.getElementById('ctx-back-link');
    if (back) back.href = `product-detail.html?id=${encodeURIComponent(context.productId)}&version=${encodeURIComponent(context.version)}`;
    document.getElementById('view-product-btn')?.remove();
    document.getElementById('customer-view-btn')?.remove();
    const readonly = document.getElementById('readonly-band');
    if (readonly) readonly.style.display = canEdit() ? 'none' : '';
    PS.prototypeApp?.refreshStudioNav?.();
  }

  function render() {
    refreshTemplatesFromCentral();
    const edit = canEdit();
    root.innerHTML = `<div class="rating-page">
      <div class="page-header rating-page-header">
        <div class="page-header-left">
          <h1 class="page-title">Rating &amp; Pricing Guide</h1>
          <p class="page-subtitle">Configure the product's real base price, state pricing, coverage pricing, and risk rating factors.</p>
        </div>
        <div class="page-header-actions rating-page-actions">
          <button class="btn btn-ghost" type="button" data-rating-action="explain">How pricing works</button>
          <button class="btn btn-secondary" type="button" data-rating-action="preview">Preview a price</button>
          ${edit ? '<button class="btn btn-primary" type="button" data-rating-action="add-rule">＋ Add pricing rule</button>' : `<a class="btn btn-primary" href="product-detail.html?id=${encodeURIComponent(context.productId)}&version=${encodeURIComponent(context.version)}#versions">Create editable copy</a>`}
        </div>
      </div>
      ${resultHtml()}
      <div class="rating-workspace">
        <aside class="rating-steps">
          <div class="rating-steps-head"><div class="rating-steps-title">Price-building journey</div><div class="rating-steps-subtitle">Select a step to view or change it</div></div>
          ${STEPS.map((step, index) => `<button class="rating-step ${step.id === activeStep ? 'active' : ''}" data-rating-action="step" data-step="${step.id}"><span class="rating-step-number">${index + 1}</span><span class="rating-step-copy"><span class="rating-step-name">${step.name}</span><span class="rating-step-desc">${step.desc}</span></span><span class="rating-step-status ${stepComplete(step.id) ? 'is-done' : 'is-pending'}">${stepComplete(step.id) ? '✓' : '○'}</span></button>`).join('')}
        </aside>
        <section class="rating-panel">${renderPanel(edit)}</section>
      </div>
    </div>`;
    refreshContextBar();
    if (activeStep === 'state') {
      const searchEl = document.getElementById('state-search');
      if (searchEl) { const pos = stateSearch.length; searchEl.focus(); try { searchEl.setSelectionRange(pos, pos); } catch (_) {} }
    }
  }

  function panelShell(title, copy, action, body) {
    const actions = action ? `<div class="rating-panel-actions">${action}</div>` : '';
    return `<section class="rating-panel-card"><div class="rating-panel-head"><div class="rating-panel-head-copy"><div class="rating-panel-title">${esc(title)}</div><div class="rating-panel-copy">${esc(copy)}</div></div>${actions}</div><div class="rating-panel-body">${body}</div></section>`;
  }

  function renderPanel(edit) {
    if (activeStep === 'base') return renderBase(edit);
    if (activeStep === 'state') return renderStatePricing(edit);
    if (activeStep === 'coverage') return renderCoveragePricing(edit);
    if (activeStep === 'risk') return renderRisk(edit);
    if (activeStep === 'discounts') return renderDiscounts(edit);
    if (activeStep === 'fees') return renderFees(edit);
    if (activeStep === 'preview') return renderPricePreviewStep(edit);
    return renderReview(edit);
  }

  function renderBase(edit) {
    const priceDisplay = hasBasePrice() ? `${money(Number(record.basePrice))} / ${record.pricingBasis === 'monthly' ? 'month' : record.pricingBasis === 'per_unit' ? 'unit' : 'year'}` : 'Not configured';
    const tpl = template();
    const form = edit ? `<div class="form-grid-2">
        <div>
          <label class="form-label">Annual Base Premium</label>
          <div style="display:flex;align-items:center;gap:6px"><span>$</span><input class="form-control" id="rating-base-price" type="number" min="0" step="0.01" value="${record.basePrice != null ? esc(record.basePrice) : ''}" placeholder="Not configured"></div>
        </div>
        <div>
          <label class="form-label">Pricing Basis</label>
          <select class="form-control" id="rating-pricing-basis">
            <option value="annual" ${record.pricingBasis === 'annual' ? 'selected' : ''}>Annual</option>
            <option value="monthly" ${record.pricingBasis === 'monthly' ? 'selected' : ''}>Monthly</option>
            <option value="per_unit" ${record.pricingBasis === 'per_unit' ? 'selected' : ''}>Per unit</option>
          </select>
        </div>
      </div>
      <div style="margin-top:14px"><button class="btn btn-primary btn-sm" type="button" data-rating-action="save-base-price">Save Base Price</button></div>` : '';
    const summary = `<div class="rating-summary-card" style="max-width:320px;margin-top:${edit ? '18px' : '0'}">
        <div class="rating-summary-label">Base Price</div>
        <div class="rating-summary-value">${esc(priceDisplay)}</div>
        <div class="rating-summary-detail">${hasBasePrice() ? 'Explicitly configured for this product' : 'No value has been entered yet'}</div>
      </div>`;
    const templateNote = `<div class="callout callout-info" style="margin-top:16px"><div class="callout-body"><strong>Central Template (reference only):</strong> ${esc(tpl.name)} suggests ${money(tpl.base)} ${esc(tpl.unit)} from the Central Pricing Library. This is informational — it is never used as the product's Base Price automatically. ${libraryLink('Open central library')}${edit ? ' <button class="btn btn-ghost btn-sm" type="button" data-rating-action="change-template">Change template</button>' : ''}</div></div>`;
    return panelShell('1. Base Price', 'Set the starting annual premium for this product.', '', form + summary + templateNote);
  }

  function renderStatePricing(edit) {
    const states = getStateOptions();
    const configuredCount = states.filter(([code]) => isStateConfigured(record.statePricing[code])).length;
    const term = stateSearch.trim().toLowerCase();
    const visible = states.filter(([code, name]) => {
      if (term && !name.toLowerCase().includes(term) && !code.toLowerCase().includes(term)) return false;
      const configured = isStateConfigured(record.statePricing[code]);
      if (stateFilter === 'configured' && !configured) return false;
      if (stateFilter === 'not-configured' && configured) return false;
      return true;
    });
    const baseConfigured = hasBasePrice();
    const rows = visible.map(([code, name]) => {
      const cfg = record.statePricing[code] || { type: 'none', value: '' };
      const configured = isStateConfigured(cfg);
      const finalPrice = baseConfigured ? calculateStateBase(code) : null;
      return `<tr>
        <td>${esc(name)}</td>
        <td>${baseConfigured ? money(Number(record.basePrice)) : '—'}</td>
        <td>${edit ? `<select class="form-control" data-state-type="${code}">
            <option value="none" ${!cfg.type || cfg.type === 'none' ? 'selected' : ''}>Not configured</option>
            <option value="percentage" ${cfg.type === 'percentage' ? 'selected' : ''}>Percentage</option>
            <option value="flat" ${cfg.type === 'flat' ? 'selected' : ''}>Flat amount</option>
            <option value="override" ${cfg.type === 'override' ? 'selected' : ''}>Override</option>
          </select>` : esc(cfg.type && cfg.type !== 'none' ? cfg.type : '—')}</td>
        <td>${edit ? `<input class="form-control" type="number" step="0.01" data-state-value="${code}" value="${cfg.value != null ? esc(cfg.value) : ''}" placeholder="value">` : (configured ? (cfg.type === 'percentage' ? `${esc(cfg.value)}%` : money(Number(cfg.value))) : '—')}</td>
        <td>${finalPrice != null ? money(finalPrice) : '—'}</td>
        <td><span class="badge ${configured ? 'badge-published' : 'badge-draft'}">${configured ? 'Configured' : 'Not configured'}</span></td>
        <td>${edit ? `<div class="table-actions"><button class="btn btn-ghost btn-sm" type="button" data-rating-action="save-state" data-state="${code}">Save</button>${configured ? `<button class="btn btn-ghost btn-sm" type="button" data-rating-action="clear-state" data-state="${code}">Clear</button>` : ''}</div>` : ''}</td>
      </tr>`;
    }).join('');
    const body = `
      ${!baseConfigured ? `<div class="callout callout-warning" style="margin-bottom:14px"><div class="callout-body">⚠ Set a Base Price before configuring state pricing.</div></div>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
        <input class="form-control" style="max-width:240px" id="state-search" placeholder="Search state..." value="${esc(stateSearch)}">
        <div style="display:flex;gap:6px">
          <button type="button" class="btn btn-sm ${stateFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}" data-rating-action="state-filter" data-filter="all">All</button>
          <button type="button" class="btn btn-sm ${stateFilter === 'configured' ? 'btn-secondary' : 'btn-ghost'}" data-rating-action="state-filter" data-filter="configured">Configured</button>
          <button type="button" class="btn btn-sm ${stateFilter === 'not-configured' ? 'btn-secondary' : 'btn-ghost'}" data-rating-action="state-filter" data-filter="not-configured">Not Configured</button>
        </div>
        <div style="margin-left:auto;font-size:13px;color:var(--color-muted)">State Pricing · ${configuredCount} / ${states.length} configured</div>
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>State</th><th>Base Price</th><th>Adjustment Type</th><th>Adjustment</th><th>Final Base Price</th><th>Status</th>${edit ? '<th>Actions</th>' : ''}</tr></thead>
        <tbody>${rows || `<tr><td colspan="7" style="text-align:center;color:var(--color-muted)">${states.length ? 'No states match your search.' : 'No states are assigned to the Futuristic Class of Business covers.'}</td></tr>`}</tbody></table>
      </div>`;
    return panelShell('2. State Pricing', 'The Base Price is the default for each state assigned to Futuristic in Class of Business.', '', body);
  }

  function renderCoveragePricing(edit) {
    const covers = getCoverageOptions();
    const rows = covers.map(c => {
      const cfg = record.coveragePricing[c.id] || { method: 'none', value: '' };
      const configured = isCoverageConfigured(cfg);
      return `<tr>
        <td>${esc(c.name)}</td>
        <td>${edit ? `<select class="form-control" data-coverage-method="${esc(c.id)}">
            <option value="none" ${!cfg.method || cfg.method === 'none' ? 'selected' : ''}>None</option>
            <option value="multiplier" ${cfg.method === 'multiplier' ? 'selected' : ''}>Multiplier</option>
            <option value="percentage" ${cfg.method === 'percentage' ? 'selected' : ''}>Percentage</option>
            <option value="flat" ${cfg.method === 'flat' ? 'selected' : ''}>Flat Amount</option>
          </select>` : esc(cfg.method && cfg.method !== 'none' ? cfg.method : 'None')}</td>
        <td>${edit ? `<input class="form-control" type="number" step="0.01" data-coverage-value="${esc(c.id)}" value="${cfg.value != null ? esc(cfg.value) : ''}" placeholder="${cfg.method === 'multiplier' ? 'e.g. 1.10' : cfg.method === 'percentage' ? 'e.g. 10' : 'e.g. 50'}">` : (configured ? (cfg.method === 'percentage' ? `${esc(cfg.value)}%` : cfg.method === 'flat' ? money(Number(cfg.value)) : esc(cfg.value)) : '—')}</td>
        <td><span class="badge ${configured ? 'badge-published' : 'badge-draft'}">${configured ? 'Configured' : 'Not configured'}</span></td>
        ${edit ? `<td><button class="btn btn-ghost btn-sm" type="button" data-rating-action="save-coverage-pricing" data-coverage="${esc(c.id)}">Save</button></td>` : ''}
      </tr>`;
    }).join('');
    const body = covers.length
      ? `<div class="table-wrap"><table><thead><tr><th>Coverage</th><th>Pricing Method</th><th>Pricing Value</th><th>Status</th>${edit ? '<th>Actions</th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div>`
      : `<div class="callout callout-info"><div class="callout-body">No parent covers are assigned to Futuristic in Class of Business yet.</div></div>`;
    return panelShell('3. Coverage Pricing', 'Adjust pricing only for parent covers assigned to Futuristic in Class of Business.', '', body);
  }

  function impactText(item) {
    if (item.action === 'same' || Number(item.value) === 0) return '<span class="impact-pill impact-same">No change</span>';
    return `<span class="impact-pill ${item.action === 'reduce' ? 'impact-down' : 'impact-up'}">${item.action === 'reduce' ? 'Reduce' : 'Increase'} ${esc(item.value)}%</span>`;
  }

  function ruleCard(id, icon, name, summary, bands, edit) {
    return `<article class="rule-card"><div class="rule-card-top"><div class="rule-icon">${icon}</div><div><div class="rule-card-name">${esc(name)}</div><div class="rule-card-summary">${esc(summary)}</div></div>${edit ? `<button class="btn btn-ghost btn-sm rule-card-action" data-rating-action="edit-bands" data-band="${id}">Edit choices</button>` : ''}</div><div class="impact-list">${bands.map(item => `<div class="impact-row"><span>${esc(item.label)}</span>${impactText(item)}</div>`).join('')}</div></article>`;
  }
function customRuleCard(rule, edit) {
  const field = FIELD_OPTIONS[rule.field]?.label || rule.field;
  const operator = operatorLabel(rule.operator);
  const value = displayRuleValue(rule.field, rule.value);

  let effect = '';

  if (rule.action === 'reduce') {
    effect = `Reduce price by ${rule.amount}%`;
  } else if (rule.action === 'fixed') {
    effect = `Add ${money(rule.amount)}`;
  } else {
    effect = `Increase price by ${rule.amount}%`;
  }

  return `
    <article class="rule-card">

      <div class="rule-card-top">

        <div class="rule-icon">✨</div>

        <div style="flex:1;min-width:0">

          <div class="rule-card-name">
            ${esc(rule.name)}
          </div>

          <div class="rule-card-summary">
            When ${esc(field.toLowerCase())}
            ${esc(operator)}
            ${esc(value)}
          </div>

        </div>

        ${
          edit
            ? `
              <div style="
                display:flex;
                gap:6px;
                align-items:center;
                flex-shrink:0;
              ">

                <button
                  class="btn btn-ghost btn-sm"
                  type="button"
                  data-rating-action="edit-rule"
                  data-rule="${esc(rule.id)}"
                >
                  Edit
                </button>

                <button
                  class="btn btn-icon btn-sm"
                  type="button"
                  data-rating-action="delete-rule"
                  data-rule="${esc(rule.id)}"
                  aria-label="Remove ${esc(rule.name)}"
                  title="Remove"
                >
                  ×
                </button>

              </div>
            `
            : ''
        }

      </div>

      <div class="impact-list">

        <div class="impact-row">

          <span>
            ${esc(field)} ${esc(operator)} ${esc(value)}
          </span>

          <span class="impact-pill ${
            rule.action === 'reduce'
              ? 'impact-down'
              : 'impact-up'
          }">
            ${esc(effect)}
          </span>

        </div>

      </div>

    </article>
  `;
}
function riskRatingFactorCard(factor, edit, validIds) {
  const orphaned = !!(validIds && factor.riskAttributeId && !validIds.has(String(factor.riskAttributeId)));
  const sourceAttribute = getRiskAttributeOptions().find(item => String(item.id) === String(factor.riskAttributeId));
  const conditionCount = sourceAttribute ? riskConditionRows(sourceAttribute).length : (factor.table?.data?.length || 0);
  const factorName = sourceAttribute ? `${sourceAttribute.name} Factor` : (factor.name || 'Untitled factor');

  return `
    <article class="rule-card">
      <div class="rule-card-top">
        <div class="rule-icon">📊</div>
        <div style="flex:1;min-width:0">
          <div class="rule-card-name">${esc(factorName)}</div>
          <div class="rule-card-summary">${esc(factor.coverage || 'No coverage selected')}</div>
        </div>
        ${
          edit
            ? `<div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
                <button class="btn btn-ghost btn-sm" type="button" data-rating-action="edit-risk-factor" data-factor="${esc(factor.id)}">Edit</button>
                <button class="btn btn-icon btn-sm" type="button" data-rating-action="delete-risk-factor" data-factor="${esc(factor.id)}" aria-label="Remove ${esc(factor.name)}" title="Remove">×</button>
              </div>`
            : ''
        }
      </div>
      ${orphaned ? `<div class="callout callout-warning" style="margin-bottom:10px"><div class="callout-body" style="font-size:12px">⚠ Risk no longer available in Risk Guide</div></div>` : ''}
      <div class="impact-list">
        <div class="impact-row"><span>Risk Attribute</span><strong>${esc(sourceAttribute?.name || factor.riskAttribute || 'Not set')}</strong></div>
        <div class="impact-row"><span>Risk Category</span><strong>${esc(sourceAttribute?.category || factor.riskCategory || 'Not set')}</strong></div>
        <div class="impact-row"><span>Risk Guide Conditions</span><strong>${conditionCount}</strong></div>
      </div>
    </article>
  `;
}

function renderRiskRatingFactorsSection(edit) {
  ensureDefaultRiskRatingFactors(record);
  const factors = record.riskRatingFactors || [];
  const validIds = new Set(getRiskAttributeOptions().map(a => String(a.id)));
  const body = factors.length
    ? `<div class="rule-grid">${factors.map(factor => riskRatingFactorCard(factor, edit, validIds)).join('')}</div>`
    : `<div class="callout callout-info"><div class="callout-body">No Risk Rating Factors have been configured yet. Add a Risk in Risk Guide to configure how it affects rating.</div></div>`;
  const action = edit ? '<button class="btn btn-primary btn-sm" type="button" data-rating-action="add-risk-factor">＋ Add Risk Rating Factor</button>' : '';
  return panelShell(
    'Risk Rating Factors',
    'Configure how Risk Guide attributes affect the premium for each coverage, ready for the rating engine.',
    action,
    body
  );
}
function renderRisk(edit) {
  const enabledCustomRules = record.customRules.filter(rule => rule.enabled !== false);
  const cards = enabledCustomRules.length
    ? `<div class="rule-grid">${enabledCustomRules.map(rule => customRuleCard(rule, edit)).join('')}</div>`
    : `<div class="callout callout-info"><div class="callout-body">No custom pricing rules have been added yet.</div></div>`;

  const action = edit
    ? '<button class="btn btn-primary btn-sm" data-rating-action="add-rule">＋ Add pricing rule</button>'
    : '';

  return panelShell(
    '4. Risk Rating',
    'Additional pricing rules and the Risk Rating Factors that feed the rating engine for this product.',
    action,
    cards
  ) + renderRiskRatingFactorsSection(edit);
}

  function customRuleHtml(rule, edit) {
    const field = FIELD_OPTIONS[rule.field]?.label || rule.field;
    const operator = operatorLabel(rule.operator);
    const value = displayRuleValue(rule.field, rule.value);
    const effect = rule.action === 'reduce' ? `Reduce price by ${rule.amount}${rule.unit === 'percent' ? '%' : ''}` : rule.action === 'fixed' ? `Add ${money(rule.amount)}` : `Increase price by ${rule.amount}%`;
    return `<div class="plain-rule"><span class="rule-icon">✨</span><div class="plain-rule-when"><strong>${esc(rule.name)}</strong><br>When ${esc(field.toLowerCase())} ${esc(operator)} ${esc(value)}</div><div class="plain-rule-then">${esc(effect)}</div>${edit ? `<div class="plain-rule-controls"><button class="btn btn-ghost btn-sm" data-rating-action="toggle-rule" data-rule="${esc(rule.id)}">${rule.enabled === false ? 'Resume' : 'Pause'}</button><button class="btn btn-ghost btn-sm" data-rating-action="edit-rule" data-rule="${esc(rule.id)}">Edit</button><button class="btn btn-icon btn-sm" data-rating-action="delete-rule" data-rule="${esc(rule.id)}" aria-label="Delete ${esc(rule.name)}">×</button></div>` : ''}</div>`;
  }

  function renderDiscounts(edit) {
    const keys = productDiscountKeys();
    if (!keys.length) {
      return panelShell('5. Discounts', 'No centrally approved savings are linked to this product yet. Open the Central Pricing Library to assign discounts.', libraryLink(), `<p style="font-size:13px;color:var(--color-muted);margin:0">This product is not in scope for any active central discount. Product users cannot create independent discount amounts here.</p>`);
    }
    const icons = { claimFree:'🛡️', loyalty:'🤝', multi:'⊕' };
    const html = keys.map(([id]) => {
      const item = record.discounts[id];
      const central = centralDiscount({ claimFree:'discount-claim-free', loyalty:'discount-loyalty', multi:'discount-multi' }[id]);
      const value = central?.displayValue || (central?.value ? `${central.value}%` : '');
      const detail = central?.eligibility || item.summary || '';
      return `<div class="plain-rule"><span class="rule-icon">${icons[id] || '💰'}</span><div class="plain-rule-when"><strong>${esc(item.name)}</strong><br>${esc(detail)}</div><div class="plain-rule-then">${item.enabled ? `Reduce ${esc(value)}` : 'Not used'}</div>${edit ? `<button class="btn ${item.enabled ? 'btn-secondary' : 'btn-primary'} btn-sm" type="button" data-rating-action="toggle-discount" data-discount="${id}">${item.enabled ? 'Turn off' : 'Turn on'}</button>` : ''}</div>`;
    }).join('');
    return panelShell('5. Discounts', 'Turn approved customer savings on or off. Amounts come from the Central Pricing Library and cannot be changed on this product.', libraryLink(), html);
  }

  function renderFees(edit) {
    const html = Object.entries(record.charges).filter(([, item]) => item.enabled !== false).map(([id, item]) => `<div class="plain-rule"><span class="rule-icon">${id === 'tax' ? '🏛️' : '🧾'}</span><div class="plain-rule-when"><strong>${esc(item.name)}</strong><br>${item.managed ? 'Maintained by the central finance and compliance teams' : 'Maintained for this product'}</div><div class="plain-rule-then">${item.kind === 'percent' ? `${item.value}%` : money(item.value)}</div><span class="managed-badge">🔒 Centrally managed</span></div>`).join('')
      || `<p style="font-size:13px;color:var(--color-muted);margin:0">No centrally managed charges are linked to this product.</p>`;
    return panelShell('6. Fees & taxes', 'Required charges are brought in automatically from the approved jurisdiction setup. Product users can review them but do not need to maintain them.', libraryLink(), html);
  }

  function renderPricePreviewStep() {
    const fields = previewInputFields();
    const allFields = [...fields.riskAttrs, ...fields.customFields, ...fields.discountFields];
    const stateOptions = `<option value="">No state adjustment</option>` + getStateOptions().map(([code, name]) => `<option value="${code}" ${previewState === code ? 'selected' : ''}>${esc(name)}</option>`).join('');
    const body = `
      <div class="form-grid-2">
        <div><label class="form-label">State</label><select class="form-control" id="preview-state-select">${stateOptions}</select></div>
      </div>
      ${allFields.length ? `<div style="margin-top:14px"><div class="rating-panel-copy" style="margin-bottom:8px">Risk information</div><div class="form-grid-2">${allFields.map(renderPreviewInput).join('')}</div></div>` : ''}
      <button class="btn btn-primary" type="button" style="margin-top:16px" data-rating-action="run-preview">Calculate price</button>
      <div id="preview-result" style="margin-top:20px">${lastEstimate ? previewResultHtml(lastEstimate) : ''}</div>
    `;
    return panelShell('7. Price Preview', 'Test a customer scenario using the configured base price, state pricing, coverage pricing, and risk rating factors.', '', body);
  }

  function renderReview(edit) {
    const coverOptions = getCoverageOptions();
    const stateOptions = getStateOptions();
    const stateConfiguredCount = stateOptions.filter(([code]) => isStateConfigured(record.statePricing[code])).length;
    const coverageConfiguredCount = coverOptions.filter(c => isCoverageConfigured(record.coveragePricing[c.id])).length;
    const riskFactorConfiguredCount = (record.riskRatingFactors || []).filter(f => f.configured).length;
    const activeDiscountCount = productDiscountKeys().filter(([id]) => record.discounts[id]?.enabled).length;
    const activeFeeCount = Object.values(record.charges).filter(c => c.enabled !== false).length;
    const rows = [
      ['Base Price', hasBasePrice() ? `✓ ${money(Number(record.basePrice))} / ${record.pricingBasis}` : '⚠ Not configured'],
      ['State Pricing', `${stateConfiguredCount} / ${stateOptions.length} configured`],
      ['Coverage Pricing', `${coverageConfiguredCount} / ${coverOptions.length} configured`],
      ['Risk Rating Factors', `${riskFactorConfiguredCount} configured`],
      ['Eligibility', 'Connected'],
      ['Discounts', `${activeDiscountCount} active`],
      ['Fees & Taxes', `${activeFeeCount} active`],
      ['Price Preview', lastEstimate ? 'Available' : 'Not run yet']
    ];
    const warnings = [];
    if (!hasBasePrice()) warnings.push('Base price has not been configured.');
    if (coverOptions.length && !coverageConfiguredCount) warnings.push('No coverage pricing has been configured yet.');
    if (!riskFactorConfiguredCount) warnings.push('No Risk Rating Factors have been configured yet.');
    const list = rows.map(([label, value]) => `<div class="review-check"><div class="review-check-icon">${String(value).startsWith('⚠') ? '⚠' : '✓'}</div><div><div class="review-check-title">${esc(label)}</div><div class="review-check-copy">${esc(value)}</div></div></div>`).join('');
    const warnHtml = warnings.length ? `<div class="callout callout-warning" style="margin-top:14px">${warnings.map(w => `<div class="callout-body">⚠ ${esc(w)}</div>`).join('')}</div>` : '';
    const actions = `<div style="display:flex;gap:9px;margin-top:18px;flex-wrap:wrap"><button class="btn btn-primary" type="button" data-rating-action="preview">Preview a customer price</button><button class="btn btn-secondary" type="button" data-rating-action="download-summary">Download pricing summary</button>${edit ? '<button class="btn btn-secondary" type="button" data-rating-action="save">Save changes</button>' : ''}</div>`;
    return panelShell('8. Review the complete pricing setup', 'Everything below is written as a business decision, so product, operations, and compliance teams can review it together.', '', list + warnHtml + actions);
  }

  function openTemplateModal() {
    // Always reload the latest templates from the Central Pricing Library
    // before showing the selector so newly created/updated CPL templates appear.
    refreshTemplatesFromCentral();

    const current = template();

    // Show every ACTIVE template maintained in the CPL.
    // Do not restrict the list by the current product family; users can
    // intentionally choose any approved central template.
    const choices = TEMPLATES
      .filter(item => !item.status || item.status === 'active')
      .sort((a, b) => {
        const aRecommended = a.id === automaticTemplate().id ? 0 : 1;
        const bRecommended = b.id === automaticTemplate().id ? 0 : 1;
        return aRecommended - bRecommended || String(a.name).localeCompare(String(b.name));
      });

    const body = choices.length
      ? choices.map(item => `
          <label class="template-option">
            <input type="radio" name="pricing-template" value="${esc(item.id)}" ${item.id === current.id ? 'checked' : ''}>
            <div>
              <div class="template-name">${esc(item.name)} · ${money(item.base)} ${esc(item.unit)}</div>
              <div class="template-copy">
                ${esc(item.evidence)}. Maintained in the ${esc(item.source)}.
              </div>
              <div class="template-meta">
                ${item.id === automaticTemplate().id ? 'Recommended for this product' : 'Available from CPL'}
                · ${esc(item.family || 'General')} family
                · Reviewed ${esc(item.updated || item.reviewed || 'Not set')}
              </div>
            </div>
          </label>
        `).join('')
      : `<div class="callout callout-info"><div class="callout-body">No active pricing templates are currently available in the Central Pricing Library.</div></div>`;

    window.PS.openModal(`
      <div class="modal-header">
        <div>
          <h2 class="modal-title">Choose a pricing template</h2>
          <div class="rating-panel-copy">
            All active templates from the Central Pricing Library are available here. Select the template you want this product to use.
          </div>
        </div>
        <button class="btn btn-icon" data-rating-action="close-modal" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <div id="rating-modal-result"></div>
        <div class="callout callout-info" style="margin-bottom:12px">
          <div class="callout-body">
            Template prices are centrally managed. Creating or editing a template in CPL updates the value available here.
          </div>
        </div>
        ${body}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-rating-action="close-modal">Cancel</button>
        ${choices.length ? '<button class="btn btn-primary" data-rating-action="apply-template">Use selected template</button>' : ''}
      </div>
    `, 'modal-lg');
  }

 function openBandsModal(kind) {
  const labels = {
    driver: 'Driver age',
    vehicle: 'Vehicle age',
    location: 'Where the vehicle is kept',
    use: 'How the vehicle is used'
  };

  // Keep a temporary editable copy while the modal is open.
  if (
    !window.__ratingBandDraft ||
    window.__ratingBandDraft.kind !== kind
  ) {
    window.__ratingBandDraft = {
      kind,
      rows: JSON.parse(JSON.stringify(record.bands[kind] || []))
    };
  }

  const rows = window.__ratingBandDraft.rows;

  const rowsHtml = rows.map((row, index) => `
    <div class="range-row"
         data-band-row="${index}"
         style="
           display:grid;
           grid-template-columns:minmax(160px,1fr) minmax(130px,0.7fr) 90px auto;
           gap:8px;
           align-items:center;
           margin-bottom:8px;
         ">

      <div>
        <label class="form-label" style="display:none">
          ${index === 0 ? 'Customer group' : ''}
        </label>

        <input
          class="form-control"
          value="${esc(row.label || '')}"
          data-band-label="${index}"
          aria-label="Customer group"
          placeholder="e.g. Under 25"
        >
      </div>

      <select
        class="form-control"
        data-band-action="${index}"
        aria-label="Outcome"
      >
        <option value="increase" ${row.action === 'increase' ? 'selected' : ''}>
          Increase price
        </option>

        <option value="same" ${row.action === 'same' ? 'selected' : ''}>
          No change
        </option>

        <option value="reduce" ${row.action === 'reduce' ? 'selected' : ''}>
          Reduce price
        </option>
      </select>

      <div style="display:flex;align-items:center;gap:4px">
        <input
          class="form-control"
          type="number"
          min="0"
          max="100"
          value="${esc(row.value ?? 0)}"
          data-band-value="${index}"
          aria-label="Percentage"
          placeholder="0"
        >
        <span>%</span>
      </div>

      <button
        type="button"
        class="btn btn-ghost btn-sm"
        style="
          color:#d92d20;
          white-space:nowrap;
          padding:6px 8px;
        "
        data-rating-action="remove-band"
        data-band="${kind}"
        data-band-index="${index}"
        title="Remove this choice"
      >
        🗑 Remove
      </button>
    </div>
  `).join('');

  window.PS.openModal(`
    <div class="modal-header">
      <div>
        <h2 class="modal-title">
          Edit ${esc(labels[kind])} choices
        </h2>

        <div class="rating-panel-copy">
          Choose the outcome for each customer group. No calculations are required.
        </div>
      </div>

      <button
        class="btn btn-icon"
        data-rating-action="close-modal"
        aria-label="Close"
      >
        ×
      </button>
    </div>

    <div class="modal-body">

      <div id="rating-modal-result"></div>

      <div
        style="
          display:grid;
          grid-template-columns:minmax(160px,1fr) minmax(130px,0.7fr) 90px auto;
          gap:8px;
          padding:0 0 6px;
          font-size:11px;
          font-weight:700;
          color:var(--color-muted);
        "
      >
        <div>Customer group</div>
        <div>Outcome</div>
        <div>Percentage</div>
        <div></div>
      </div>

      <div id="rating-band-editor">
        ${rowsHtml}
      </div>

      <button
        type="button"
        class="btn btn-secondary"
        style="
          width:100%;
          margin-top:4px;
          border-style:dashed;
        "
        data-rating-action="add-band"
        data-band="${kind}"
      >
        ＋ Add another ${esc(
          kind === 'location'
            ? 'location type'
            : kind === 'use'
              ? 'vehicle use'
              : kind === 'driver'
                ? 'age group'
                : 'vehicle age group'
        )}
      </button>

      <div
        class="callout callout-info"
        style="margin-top:14px"
      >
        <div class="callout-body">
          Example: choosing “Increase price” and “25%” means a customer in that group pays 25% more than the starting price.
        </div>
      </div>

    </div>

    <div class="modal-footer">
      <button
        class="btn btn-secondary"
        data-rating-action="close-modal"
      >
        Cancel
      </button>

      <button
        class="btn btn-primary"
        data-rating-action="save-bands"
        data-band="${kind}"
      >
        Save choices
      </button>
    </div>
  `);
}
function getRatingBandDraft(kind) {
  if (
    !window.__ratingBandDraft ||
    window.__ratingBandDraft.kind !== kind
  ) {
    window.__ratingBandDraft = {
      kind,
      rows: JSON.parse(JSON.stringify(record.bands[kind] || []))
    };
  }

  return window.__ratingBandDraft.rows;
}
function addRatingBand(kind) {
  const rows = getRatingBandDraft(kind);

  const defaults = {
    driver: {
      label: 'New age group',
      action: 'same',
      value: 0
    },

    vehicle: {
      label: 'New vehicle age',
      action: 'same',
      value: 0
    },

    location: {
      label: 'New location type',
      action: 'same',
      value: 0
    },

    use: {
      label: 'New vehicle use',
      action: 'same',
      value: 0
    }
  };

  rows.push({
    ...(defaults[kind] || {
      label: 'New choice',
      action: 'same',
      value: 0
    })
  });

  openBandsModal(kind);
}
function removeRatingBand(kind, index) {
  const rows = getRatingBandDraft(kind);

  if (index < 0 || index >= rows.length) {
    return;
  }

  // Do not allow the editor to become completely empty.
  if (rows.length === 1) {
    return modalError(
      'Cannot remove choice',
      'At least one customer group is required.'
    );
  }

  rows.splice(index, 1);

  openBandsModal(kind);
}

  // ------------------------------------------------------------------
  // Risk Rating Factors
  //
  // Structured rating-engine configuration, separate from the simple
  // "Risk adjustments" business cards above. Each factor connects a
  // Risk Guide attribute to a coverage and a rating method (table or
  // fixed factor) in the shape the rating engine/export layer expects.
  // ------------------------------------------------------------------

  function generateFactorId(targetRecord) {
  const sourceRecord =
    targetRecord ||
    (typeof record !== 'undefined' && record) ||
    { riskRatingFactors: [] };

  const existing = new Set(
    (Array.isArray(sourceRecord.riskRatingFactors)
      ? sourceRecord.riskRatingFactors
      : []
    ).map(item => item && item.id).filter(Boolean)
  );

  let n = 1;
  let id;

  do {
    id = `RAT-FACTOR-${String(n).padStart(3, '0')}`;
    n += 1;
  } while (existing.has(id));

  return id;
}
  // Risk Attributes must come from Risk Guide via existing Product Guide
  // application/state rather than a second independent database. The exact
  // integration point was not present in the existing code, so this reads
  // from the most likely existing locations and falls back to an empty
  // list (surfaced as a clear empty-state message) rather than inventing
  // attributes. See the assumptions note for details.
  function normalizeOptionList(source, nestedKeys = []) {
  if (Array.isArray(source)) return source;

  if (!source || typeof source !== 'object') {
    return [];
  }

  for (const key of nestedKeys) {
    if (Array.isArray(source[key])) {
      return source[key];
    }
  }

  return [];
}

function getRiskAttributeOptions() {
  const app = window.PS?.prototypeApp;

  // Risk Guide attributes are stored in the product bundle as `risk`.
  const bundle = app?.getProductBundle?.(context.productId, context.version);
  const source = Array.isArray(bundle?.risk) ? bundle.risk : [];

  return source
    .map(item => ({
      id:
        item.id ||
        item.attributeId ||
        item.riskAttributeId ||
        item.code ||
        item.key ||
        item.name,

      name:
        item.name ||
        item.label ||
        item.title ||
        item.attributeName ||
        String(item),

      category:
        item.questionGroup ||
        item.category ||
        item.riskCategory ||
        'Uncategorized',

      conditions: Array.isArray(item.riskConditions)
        ? clone(item.riskConditions)
        : []
    }))
    .filter(item => item.id && item.name);
}

  // Coverage must come from the existing Product Guide Coverage collection.
  // As with Risk Attributes, the exact field was not present in the existing
  // code, so this checks the most likely existing locations and otherwise
  // shows a clear empty-state message instead of hard-coding coverage names.
function getScopedCoverageRecords() {
  const app = window.PS?.prototypeApp;

  // Product Guide coverages are available from the product bundle as `covers`.
  const bundle = app?.getProductBundle?.(context.productId, context.version);
  const source = Array.isArray(bundle?.covers) ? bundle.covers : [];

  // SouthLake Distribution owns which parent Classes of Business are granted
  // to Futuristic. Reuse that scope instead of exposing every product cover.
  return typeof app?.distributionScopedCovers === 'function'
    ? app.distributionScopedCovers(context.productId, source)
    : source;
}

function getStateOptions() {
  const scope = window.PS?.distributionCoverScope?.(context.productId);

  // A configured SouthLake distribution (including one with no grants) is
  // authoritative. Build the state list from the territory of the parent
  // covers granted specifically to Futuristic.
  if (scope) {
    const codes = new Set();
    getScopedCoverageRecords().forEach(cover => {
      (window.PS?.distributionTerritoryForCover?.(context.productId, cover) || [])
        .forEach(row => {
          const code = String(row?.state || '').trim().toUpperCase();
          if (code) codes.add(code);
        });
    });
    return US_STATES.filter(([code]) => codes.has(code));
  }

  // Preserve the existing prototype behavior for products that have not yet
  // been configured in SouthLake Distribution.
  return US_STATES;
}

function getCoverageOptions() {
  return getScopedCoverageRecords()

    .map(item => ({
      id:
        item.id ||
        item.coverageId ||
        item.code ||
        item.key ||
        item.name,

      name:
        item.name ||
        item.label ||
        item.title ||
        item.coverageName ||
        String(item)
    }))
    .filter(item => item.id && item.name);
}

  function riskConditionRows(attribute) {
    return (Array.isArray(attribute?.conditions) ? attribute.conditions : [])
      .map(condition => ({
        operator: condition.operator || '=',
        value: condition.value ?? '',
        value2: condition.value2 ?? '',
        riskLevel: condition.riskLevel || 'Not set',
        ratingImpact: condition.ratingImpact === 'none' ? 'none' : 'apply',
        factor: condition.ratingImpact === 'none' ? 1 : Number(condition.ratingFactor)
      }))
      .filter(row => String(row.value).trim() !== '');
  }

  function currentRiskFactorRows(factor) {
    const attribute = getRiskAttributeOptions().find(item => String(item.id) === String(factor?.riskAttributeId));
    return attribute
      ? riskConditionRows(attribute)
      : (Array.isArray(factor?.table?.data) ? factor.table.data : []);
  }

  function riskConditionOperatorLabel(operator) {
    return ({
      '=':'Equals', '!=':'Not equals', '>':'Greater than', '>=':'Greater than or equal',
      '<':'Less than', '<=':'Less than or equal', between:'Between', contains:'Contains',
      not_contains:'Does not contain', in:'In', not_in:'Not in', yes:'Is Yes', no:'Is No',
      before:'Before', after:'After', on_or_before:'On or before', on_or_after:'On or after'
    })[operator] || operator || 'Equals';
  }

  function riskConditionValueLabel(row) {
    return row.operator === 'between' && String(row.value2 || '').trim()
      ? `${row.value} to ${row.value2}`
      : String(row.value ?? '');
  }

  function renderRiskFactorRows() {
    const rows = window.__riskFactorDraft?.rows || [];
    if (!rows.length) {
      return `<div class="callout callout-warning"><div class="callout-body">No saved Risk Guide conditions are available for this attribute. Add and save its conditions in Risk Guide first.</div></div>`;
    }
    return `<div class="table-wrap"><table>
      <thead><tr><th>Operator</th><th>Risk value</th><th>Risk level</th><th>Rating factor</th></tr></thead>
      <tbody>${rows.map(row => `<tr>
        <td>${esc(riskConditionOperatorLabel(row.operator))}</td>
        <td>${esc(riskConditionValueLabel(row))}</td>
        <td>${esc(row.riskLevel)}</td>
        <td>${row.ratingImpact === 'none' ? 'No rating impact (1.00)' : esc(Number(row.factor).toFixed(2))}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

 function openRiskFactorModal(existing) {
  const attrOptions = getRiskAttributeOptions();
  const coverageOptions = getCoverageOptions();
  const factor = existing || { id:'', coverage:'', coverageId:'', riskAttribute:'', riskAttributeId:'', configured:false };
  const selectedAttribute = attrOptions.find(item =>
    String(item.id) === String(factor.riskAttributeId) || item.name === factor.riskAttribute
  );
  const factorName = selectedAttribute ? `${selectedAttribute.name} Factor` : (factor.name || '');

  window.__riskFactorDraft = {
    id: factor.id,
    attributeId: selectedAttribute?.id || '',
    rows: riskConditionRows(selectedAttribute)
  };

  const attrField = attrOptions.length
    ? `<select class="form-control" id="risk-factor-attribute" ${existing ? 'disabled' : ''}>
        <option value="">Select Risk Attribute</option>
        ${attrOptions.map(item => `<option value="${esc(item.id)}" data-name="${esc(item.name)}" ${String(item.id) === String(selectedAttribute?.id) ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}
      </select>`
    : `<div class="callout callout-info"><div class="callout-body">No Risk Attributes are available from Risk Guide yet. Add attributes in Risk Guide before creating a rating factor.</div></div>`;

  const coverageField = coverageOptions.length
    ? `<select class="form-control" id="risk-factor-coverage">
        <option value="">Select Coverage</option>
        ${coverageOptions.map(item => `<option value="${esc(item.id)}" data-name="${esc(item.name)}" ${String(item.id) === String(factor.coverageId) || item.name === factor.coverage ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}
      </select>`
    : `<div class="callout callout-info"><div class="callout-body">No parent covers are assigned to Futuristic in Class of Business yet.</div></div>`;

  window.PS.openModal(`
    <div class="modal-header">
      <div>
        <h2 class="modal-title">${existing ? 'Edit' : 'Add'} Risk Rating Factor</h2>
        <div class="rating-panel-copy">Risk values, levels, and factors are synchronized from Futuristic Risk Guide. Select only the parent coverage used by Rating.</div>
      </div>
      <button class="btn btn-icon" data-rating-action="close-modal" aria-label="Close">×</button>
    </div>
    <div class="modal-body">
      <div id="rating-modal-result"></div>
      <div class="form-grid-2">
        <div><label class="form-label">Factor ID</label><input class="form-control" value="${esc(factor.id || 'Generated automatically')}" readonly disabled></div>
        <div><label class="form-label">Factor Name</label><input class="form-control" id="risk-factor-name" value="${esc(factorName)}" readonly></div>
      </div>
      <div class="form-grid-2" style="margin-top:12px">
        <div><label class="form-label">Risk Attribute</label>${attrField}</div>
        <div><label class="form-label">Coverage</label>${coverageField}</div>
      </div>
      <div class="form-grid-2" style="margin-top:12px">
        <div><label class="form-label">Risk Category</label><input class="form-control" id="risk-factor-category" value="${esc(selectedAttribute?.category || '')}" readonly></div>
        <div><label class="form-label">Source</label><input class="form-control" value="Futuristic Risk Guide" readonly></div>
      </div>
      <div style="margin-top:18px">
        <div class="rating-panel-copy" style="margin-bottom:8px"><strong>Risk Guide conditions</strong> — update these values in Risk Guide.</div>
        <div id="risk-factor-rows">${renderRiskFactorRows()}</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-rating-action="close-modal">Cancel</button>
      <button class="btn btn-primary" data-rating-action="save-risk-factor" data-factor-id="${esc(factor.id || '')}">${existing ? 'Save factor' : 'Add factor'}</button>
    </div>
  `, 'modal-lg');
}

  // ------------------------------------------------------------------

  function ruleValueControl(field, value = '') {
    const config = FIELD_OPTIONS[field];
    if (config.type === 'select') return `<select class="form-control" id="rating-rule-value">${config.values.map(item => `<option value="${item[0]}" ${String(value) === item[0] ? 'selected' : ''}>${item[1]}</option>`).join('')}</select>`;
    return `<input class="form-control" id="rating-rule-value" type="number" min="0" value="${esc(value)}" placeholder="${esc(config.placeholder)}">`;
  }

  function openRuleModal(existing) {
    const rule = existing || { id:'', name:'', field:'driverAge', operator:'lt', value:25, action:'increase', amount:20, unit:'percent', enabled:true };
    window.PS.openModal(`<div class="modal-header"><div><h2 class="modal-title">${existing ? 'Edit' : 'Add'} a pricing rule</h2><div class="rating-panel-copy">Complete the sentence using everyday business choices.</div></div><button class="btn btn-icon" data-rating-action="close-modal">×</button></div><div class="modal-body"><div id="rating-modal-result"></div><div class="gui-builder"><div><label class="form-label">Rule name</label><input class="form-control" id="rating-rule-name" value="${esc(rule.name)}" placeholder="e.g. Young driver adjustment"></div><div class="gui-sentence"><span class="gui-word">WHEN</span><select class="form-control" id="rating-rule-field" data-rating-change="rule-field">${Object.entries(FIELD_OPTIONS).map(([id,item]) => `<option value="${id}" ${rule.field === id ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select><select class="form-control" id="rating-rule-operator"><option value="eq" ${rule.operator === 'eq' ? 'selected' : ''}>is</option><option value="neq" ${rule.operator === 'neq' ? 'selected' : ''}>is not</option><option value="lt" ${rule.operator === 'lt' ? 'selected' : ''}>is less than</option><option value="gte" ${rule.operator === 'gte' ? 'selected' : ''}>is at least</option></select><div id="rating-rule-value-wrap">${ruleValueControl(rule.field,rule.value)}</div></div><div class="gui-action"><span class="gui-word">THEN</span><select class="form-control" id="rating-rule-action"><option value="increase" ${rule.action === 'increase' ? 'selected' : ''}>Increase price by</option><option value="reduce" ${rule.action === 'reduce' ? 'selected' : ''}>Reduce price by</option><option value="fixed" ${rule.action === 'fixed' ? 'selected' : ''}>Add a fixed amount</option></select><input class="form-control" id="rating-rule-amount" type="number" min="0" value="${esc(rule.amount)}"><span id="rating-rule-unit">${rule.action === 'fixed' ? '$' : '%'}</span></div><div class="callout callout-info"><div class="callout-body">The finished rule will be shown as a readable sentence on the page and in the customer price breakdown.</div></div></div></div><div class="modal-footer"><button class="btn btn-secondary" data-rating-action="close-modal">Cancel</button><button class="btn btn-primary" data-rating-action="save-rule" data-rule="${esc(rule.id)}">${existing ? 'Save rule' : 'Add rule'}</button></div>`);
  }

  function openExplainModal() {
    window.PS.openModal(`<div class="modal-header"><h2 class="modal-title">How a customer price is built</h2><button class="btn btn-icon" data-rating-action="close-modal">×</button></div><div class="modal-body"><div class="pricing-flow" style="grid-template-columns:1fr">${[
      ['1','Start with the portfolio price','The central pricing team maintains one approved price for the selected product group.'],['2','Apply customer risk choices','Age, vehicle, location, use, and any additional business rules increase or reduce the price.'],['3','Apply savings','Claim-free, loyalty, and multi-policy discounts reduce the customer price when eligible.'],['4','Include required charges','Administration, duty, and tax are added automatically.'],['5','Show the price clearly','The customer sees an annual price, monthly equivalent, and an understandable breakdown.']
    ].map(item => `<div class="pricing-flow-card"><div class="pricing-flow-name">${item[0]}. ${item[1]}</div><div class="pricing-flow-desc">${item[2]}</div></div>`).join('')}</div></div><div class="modal-footer"><button class="btn btn-primary" data-rating-action="close-modal">Got it</button></div>`);
  }

  function compare(actual, operator, expected) {
    const numeric = !Number.isNaN(Number(actual)) && !Number.isNaN(Number(expected));
    const a = numeric ? Number(actual) : String(actual);
    const b = numeric ? Number(expected) : String(expected);
    if (operator === 'eq') return a === b;
    if (operator === 'neq') return a !== b;
    if (operator === 'lt') return a < b;
    if (operator === 'gte') return a >= b;
    return false;
  }

  // ------------------------------------------------------------------
  // Eligibility gate for pricing (section 14). Eligibility Studio owns
  // its own rule editor/evaluator on eligibility-studio.html; this page
  // cannot reach those page-scoped functions, so this is a small,
  // self-contained evaluator over the SAME stored rule shape
  // (bundle.eligibility), used only to gate the price preview.
  // ------------------------------------------------------------------
  function compareRatingCondition(field, op, expected, inputs) {
    const raw = inputs[field];
    const opL = String(op || '=').toLowerCase();
    const noValueOps = ['is empty', 'is blank', 'is not empty', 'is not blank', 'is null', 'is not null', 'is true', 'is false'];
    if ((raw === undefined || raw === null || raw === '') && !noValueOps.includes(opL)) return null;
    const numRaw = Number(raw); const numExp = Number(expected);
    const bothNumeric = Number.isFinite(numRaw) && Number.isFinite(numExp);
    switch (opL) {
      case '=': case 'equals': case 'is': return bothNumeric ? numRaw === numExp : String(raw) === String(expected);
      case '≠': case 'not equals': case 'is not': return bothNumeric ? numRaw !== numExp : String(raw) !== String(expected);
      case '>': case 'greater than': return numRaw > numExp;
      case '≥': case 'greater than or equal': return numRaw >= numExp;
      case '<': case 'less than': return numRaw < numExp;
      case '≤': case 'less than or equal': return numRaw <= numExp;
      case 'contains': return String(raw).toLowerCase().includes(String(expected).toLowerCase());
      case 'does not contain': return !String(raw).toLowerCase().includes(String(expected).toLowerCase());
      case 'is empty': case 'is blank': return raw === undefined || raw === null || raw === '';
      case 'is not empty': case 'is not blank': return !(raw === undefined || raw === null || raw === '');
      case 'is true': return raw === true || String(raw).toLowerCase() === 'true' || String(raw) === '1';
      case 'is false': return raw === false || String(raw).toLowerCase() === 'false' || String(raw) === '0';
      default: return bothNumeric ? numRaw === numExp : String(raw) === String(expected);
    }
  }
  function evaluateEligibilityForPricing(inputs) {
    const app = window.PS?.prototypeApp;
    const bundle = app?.getProductBundle?.(context.productId, context.version);
    const rules = Array.isArray(bundle?.eligibility) ? bundle.eligibility : [];
    const hits = [];
    rules.forEach(rule => {
      const status = String(rule.status || 'active').toLowerCase();
      if (status === 'inactive' || status === 'disabled') return;
      if ((rule.outcomeType || 'refer') !== 'hard') return;
      const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
      if (!conditions.length) return;
      const results = conditions.map(c => compareRatingCondition(c.attributeId || c.field || c.sourceQuestionId || '', c.op, c.value, inputs));
      if (results.some(r => r === null)) return;
      const logic = String(rule.logic || 'and').toLowerCase();
      const combined = logic === 'or' ? results.some(Boolean) : results.every(Boolean);
      const triggered = rule.direction === 'eligible' ? !combined : combined;
      if (triggered) hits.push(rule);
    });
    return { eligible: hits.length === 0, hits };
  }

  // Reuses the existing, unmodified Risk Rating Factor data structure
  // (record.riskRatingFactors) — no second factor engine is created.
  function riskFactorConditionMatches(row, raw) {
    const operator = row.operator || '=';
    const expected = row.value;
    const rawNumber = Number(raw);
    const expectedNumber = Number(expected);
    const numeric = Number.isFinite(rawNumber) && Number.isFinite(expectedNumber);
    const left = numeric ? rawNumber : String(raw ?? '').toLowerCase();
    const right = numeric ? expectedNumber : String(expected ?? '').toLowerCase();
    if (operator === '=') return left === right;
    if (operator === '!=') return left !== right;
    if (operator === '>') return rawNumber > expectedNumber;
    if (operator === '>=') return rawNumber >= expectedNumber;
    if (operator === '<') return rawNumber < expectedNumber;
    if (operator === '<=') return rawNumber <= expectedNumber;
    if (operator === 'between') {
      const upper = Number(row.value2);
      return Number.isFinite(rawNumber) && Number.isFinite(expectedNumber) && Number.isFinite(upper) && rawNumber >= expectedNumber && rawNumber <= upper;
    }
    if (operator === 'contains') return String(raw ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    if (operator === 'not_contains') return !String(raw ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    if (operator === 'in' || operator === 'not_in') {
      const values = String(expected ?? '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
      const found = values.includes(String(raw ?? '').trim().toLowerCase());
      return operator === 'in' ? found : !found;
    }
    if (operator === 'yes') return raw === true || String(raw).toLowerCase() === 'yes' || String(raw) === '1';
    if (operator === 'no') return raw === false || String(raw).toLowerCase() === 'no' || String(raw) === '0';
    if (['before', 'after', 'on_or_before', 'on_or_after'].includes(operator)) {
      const rawDate = Date.parse(raw);
      const expectedDate = Date.parse(expected);
      if (!Number.isFinite(rawDate) || !Number.isFinite(expectedDate)) return false;
      if (operator === 'before') return rawDate < expectedDate;
      if (operator === 'after') return rawDate > expectedDate;
      if (operator === 'on_or_before') return rawDate <= expectedDate;
      return rawDate >= expectedDate;
    }
    return left === right;
  }

  function resolveRiskFactorValue(factor, inputs) {
    const raw = inputs[factor.riskAttributeId] ?? inputs[factor.riskAttribute];
    const rows = currentRiskFactorRows(factor);
    if (factor.ratingMethod === 'table' && rows.length) {
      const match = rows.find(row => riskFactorConditionMatches(row, raw));
      if (match && Number.isFinite(Number(match.factor))) return Number(match.factor);
    }
    return Number.isFinite(Number(factor.amount)) ? Number(factor.amount) : 1;
  }

  // ------------------------------------------------------------------
  // Single centralized pricing calculation (section 17). Every preview
  // must go through this function — no formulas are duplicated in the UI.
  //   Base Price -> State Pricing -> Coverage Pricing -> Risk Rating
  //   Factors -> Discounts -> Fees & Taxes -> Final Customer Price
  // ------------------------------------------------------------------
  function calculateFinalPrice({ stateCode = null, riskInputs = {}, coverageIds = null } = {}) {
    if (!hasBasePrice()) return { configured: false };

    const eligibility = evaluateEligibilityForPricing(riskInputs);
    if (!eligibility.eligible) return { configured: true, eligible: false, hits: eligibility.hits };

    const basePriceNum = Number(record.basePrice);
    const items = [];
    const stateCfg = stateCode ? record.statePricing[stateCode] : null;
    const stateBase = stateCode ? (calculateStateBase(stateCode) ?? basePriceNum) : basePriceNum;
    if (stateCode && isStateConfigured(stateCfg)) {
      items.push({
        stage: 'State adjustment',
        label: `${stateName(stateCode)} (${stateCfg.type})`,
        amount: round(stateBase - basePriceNum),
        detail: stateCfg.type === 'override' ? 'Override price' : stateCfg.type === 'percentage' ? `${stateCfg.value}%` : money(Number(stateCfg.value))
      });
    }

    let subtotal = stateBase;

    // Coverage Pricing — reads the same Product Guide coverage source
    // used by the existing Risk Rating Factor implementation.
    const coverages = getCoverageOptions();
    const scopeIds = Array.isArray(coverageIds) && coverageIds.length ? coverageIds : coverages.map(c => c.id);
    let coverageMultiplier = 1; let coverageFlat = 0; const coverageDetails = [];
    scopeIds.forEach(id => {
      const cfg = record.coveragePricing[id];
      if (!isCoverageConfigured(cfg)) return;
      const cover = coverages.find(c => c.id === id);
      const val = Number(cfg.value);
      if (cfg.method === 'multiplier') { coverageMultiplier *= val; coverageDetails.push(`${cover?.name || id} × ${val}`); }
      if (cfg.method === 'percentage') { coverageMultiplier *= (1 + val / 100); coverageDetails.push(`${cover?.name || id} ${val}%`); }
      if (cfg.method === 'flat') { coverageFlat += val; coverageDetails.push(`${cover?.name || id} +${money(val)}`); }
    });
    if (coverageMultiplier !== 1 || coverageFlat !== 0) {
      const before = subtotal;
      subtotal = round(subtotal * coverageMultiplier + coverageFlat);
      items.push({ stage: 'Coverage rating', label: 'Coverage pricing', amount: round(subtotal - before), detail: coverageDetails.join(', ') || 'Coverage adjustment' });
    }

    // Risk Rating Factors — EXISTING implementation, unmodified data.
    // Respects factor.coverageId; never applies a factor outside its
    // own coverage scope.
    let riskMultiplier = 1; const riskDetails = [];
    (record.riskRatingFactors || []).filter(f => f.configured && scopeIds.includes(f.coverageId)).forEach(f => {
      const val = resolveRiskFactorValue(f, riskInputs);
      riskMultiplier *= val;
      riskDetails.push(`${f.name} × ${val}`);
    });
    if (riskMultiplier !== 1) {
      const before = subtotal;
      subtotal = round(subtotal * riskMultiplier);
      items.push({ stage: 'Risk rating factors', label: 'Configured risk factors', amount: round(subtotal - before), detail: riskDetails.join(', ') });
    }

    // Additional custom pricing rules (existing feature, preserved).
    record.customRules.filter(rule => rule.enabled !== false && compare(riskInputs[rule.field], rule.operator, rule.value)).forEach(rule => {
      const amount = rule.action === 'fixed' ? Number(rule.amount) : round(subtotal * Number(rule.amount) / 100) * (rule.action === 'reduce' ? -1 : 1);
      items.push({ stage: 'Additional rules', label: rule.name, amount, detail: 'Matched this customer' });
      subtotal += amount;
    });

    // Discounts (existing Central Pricing Library integration, unchanged).
    const discounts = [];
    const discountFn = (label, percent) => { const amount = round(subtotal * percent / 100) * -1; discounts.push({ stage: 'Savings', label, amount, detail: `${percent}% saving` }); subtotal += amount; };
    const claimFree = centralDiscount('discount-claim-free');
    if (record.discounts.claimFree?.enabled && claimFree && centralItemApplies(claimFree)) {
      const eligibleBand = (claimFree.bands || []).filter(b => Number(riskInputs.claimFreeYears || 0) >= b.years).sort((a, b) => b.years - a.years)[0];
      if (eligibleBand) discountFn(claimFree.name, eligibleBand.value);
    }
    const loyalty = centralDiscount('discount-loyalty');
    if (record.discounts.loyalty?.enabled && riskInputs.loyalty === 'yes' && loyalty && centralItemApplies(loyalty)) discountFn(loyalty.name, loyalty.value);
    const multi = centralDiscount('discount-multi');
    if (record.discounts.multi?.enabled && riskInputs.multi === 'yes' && multi && centralItemApplies(multi)) discountFn(multi.name, multi.value);

    // Fees & taxes (existing Central Pricing Library integration, unchanged).
    const charges = [];
    ['admin', 'stamp'].forEach(id => { const item = record.charges[id]; if (item.enabled) { charges.push({ stage: 'Fees & taxes', label: item.name, amount: Number(item.value), detail: 'Required charge' }); subtotal += Number(item.value); } });
    if (record.charges.tax.enabled) { const amount = round(subtotal * record.charges.tax.value / 100); charges.push({ stage: 'Fees & taxes', label: record.charges.tax.name, amount, detail: `${record.charges.tax.value}% required tax` }); subtotal += amount; }

    return {
      configured: true, eligible: true,
      base: basePriceNum, stateCode, stateBase,
      items: [...items, ...discounts, ...charges],
      total: round(subtotal), monthly: round(subtotal / 12),
      values: clone(riskInputs)
    };
  }

  function previewInputFields() {
    const riskAttrs = getRiskAttributeOptions().map(a => ({ key: a.id, label: a.name, group: 'risk' }));
    const customFields = [...new Set(record.customRules.filter(r => r.enabled !== false).map(r => r.field))]
      .filter(f => FIELD_OPTIONS[f])
      .map(f => ({ key: f, label: FIELD_OPTIONS[f].label, group: 'rule', config: FIELD_OPTIONS[f] }));
    const discountFields = [];
    if (centralDiscount('discount-claim-free')) discountFields.push({ key: 'claimFreeYears', label: 'Claim-free years', group: 'discount' });
    if (centralDiscount('discount-loyalty')) discountFields.push({ key: 'loyalty', label: 'Renewing customer?', group: 'discount', config: { type: 'select', values: [['no', 'No'], ['yes', 'Yes']] } });
    if (centralDiscount('discount-multi')) discountFields.push({ key: 'multi', label: 'Has another policy?', group: 'discount', config: { type: 'select', values: [['no', 'No'], ['yes', 'Yes']] } });
    return { riskAttrs, customFields, discountFields };
  }

  function renderPreviewInput(field) {
    const val = previewInputs[field.key] ?? '';
    const config = field.config;
    if (config && config.type === 'select') {
      return `<div><label class="form-label">${esc(field.label)}</label><select class="form-control" data-preview-field="${esc(field.key)}">${config.values.map(v => `<option value="${esc(v[0])}" ${String(val) === v[0] ? 'selected' : ''}>${esc(v[1])}</option>`).join('')}</select></div>`;
    }
    return `<div><label class="form-label">${esc(field.label)}</label><input class="form-control" data-preview-field="${esc(field.key)}" value="${esc(val)}" placeholder="${esc(config?.placeholder || '')}"></div>`;
  }

  function previewResultHtml(result) {
    if (!result.configured) return `<div class="callout callout-warning"><div class="callout-body">Pricing not configured. Set a Base Price first.</div></div>`;
    if (!result.eligible) return `<div class="callout callout-warning"><div class="callout-body"><strong>Not eligible for this product.</strong> ${result.hits.map(h => esc(h.name || 'Eligibility rule')).join(', ')}</div></div>`;
    const grouped = result.items.reduce((all, item) => { (all[item.stage] ||= []).push(item); return all; }, {});
    return `<div class="price-result-total"><span>Final Annual Premium</span><strong>${money(result.total)}</strong><span>${money(result.monthly)} per month</span></div>
      <div class="price-breakdown-row"><div><strong>Product Base Price</strong></div><strong>${money(result.base)}</strong></div>
      ${result.stateCode ? `<div class="price-breakdown-row"><div><strong>State Base Price (${esc(stateName(result.stateCode))})</strong></div><strong>${money(result.stateBase)}</strong></div>` : ''}
      ${Object.entries(grouped).map(([stage, items]) => `<div class="price-breakdown-section">${esc(stage)}</div>${items.map(item => `<div class="price-breakdown-row"><div><strong>${esc(item.label)}</strong><small>${esc(item.detail || '')}</small></div><strong>${item.amount >= 0 ? '+' : '−'}${money(Math.abs(item.amount))}</strong></div>`).join('')}`).join('')}
      <div class="callout callout-info" style="margin-top:15px"><div class="callout-body">This preview uses the pricing configuration saved in this browser prototype. It does not create a customer quote.</div></div>`;
  }

  function modalError(title, detail) {
    const target = document.getElementById('rating-modal-result');
    if (target) target.innerHTML = `<div class="rating-inline-result error"><div>!</div><div><strong>${esc(title)}</strong><span>${esc(detail)}</span></div></div>`;
  }

  function operatorLabel(operator) { return ({ eq:'is', neq:'is not', lt:'is less than', gte:'is at least' })[operator] || operator; }
  function displayRuleValue(field, value) { return FIELD_OPTIONS[field]?.values?.find(item => item[0] === String(value))?.[1] || String(value); }
  function timeSaved(value) { if (!value) return 'Not saved yet'; const date = new Date(value); return `at ${date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`; }

  function downloadSummary() {
    const item = template();
    const lines = [`PRICING SUMMARY`,`${product.name} · ${context.version}`,`Generated ${new Date().toLocaleString()}`,'',`STARTING PRICE`,`Template: ${item.name}`,`Price: ${money(item.base)} ${item.unit}`,`Source: ${item.source}`,`Evidence: ${item.evidence}`,'','RISK ADJUSTMENTS'];
    Object.entries(record.bands).forEach(([kind,bands]) => { lines.push(kind.toUpperCase()); bands.forEach(band => lines.push(`- ${band.label}: ${band.action === 'same' ? 'No change' : `${band.action === 'reduce' ? 'Reduce' : 'Increase'} ${band.value}%`}`)); });
    lines.push('','DISCOUNTS'); productDiscountKeys().forEach(([id]) => { const d = record.discounts[id]; lines.push(`- ${d.name}: ${d.enabled ? 'Active' : 'Not used'}`); });
    lines.push('','FEES & TAXES'); Object.values(record.charges).filter(c => c.enabled !== false).forEach(item => lines.push(`- ${item.name}: ${item.kind === 'percent' ? `${item.value}%` : money(item.value)} (centrally managed)`));
    const filename = `pricing-summary-${context.productId}-${context.version}.txt`;
    window.PS?.prototypeApp?.download(filename, lines.join('\n'));
    setResult('Pricing summary downloaded', `${filename} contains the current business setup for ${product.name} ${context.version}.`);
  }

  function downloadBreakdown() {
    if (!lastEstimate || !lastEstimate.configured || !lastEstimate.eligible) {
      modalError('Calculate a price first', 'Run Calculate price on an eligible, priced scenario before downloading the breakdown.');
      return;
    }
    const lines = [`CUSTOMER PRICE PREVIEW`,`${product.name} · ${context.version}`,`Annual price: ${money(lastEstimate.total)}`,`Monthly equivalent: ${money(lastEstimate.monthly)}`,'',`Starting price: ${money(lastEstimate.base)}`];
    lastEstimate.items.forEach(item => lines.push(`${item.stage} · ${item.label}: ${item.amount >= 0 ? '+' : '-'}${money(Math.abs(item.amount))} (${item.detail})`));
    const filename = `price-preview-${context.productId}-${Date.now()}.txt`;
    window.PS?.prototypeApp?.download(filename, lines.join('\n'));
    const modalTarget = document.getElementById('rating-modal-result');
    if (modalTarget) {
      modalTarget.innerHTML = `<div class="rating-inline-result"><div>✓</div><div><strong>Breakdown downloaded</strong><span>${esc(filename)} was saved to your downloads folder.</span></div></div>`;
    } else {
      setResult('Price breakdown downloaded', `${filename} was created from the current preview.`);
    }
  }

  function saveTestCase() {
    if (!lastEstimate || !lastEstimate.configured || !lastEstimate.eligible) return;
    const app = window.PS?.prototypeApp;
    if (app) {
      const key = `${context.productId}::${context.version}::testCases`;
      const tests = app.state.collections[key] || [];
      tests.unshift({ id:`PRICE-${String(Date.now()).slice(-6)}`, type:'customer-price-preview', productId:context.productId, version:context.version, price:lastEstimate.total, monthly:lastEstimate.monthly, inputs:lastEstimate.values, createdAt:new Date().toISOString(), status:'saved' });
      app.state.collections[key] = tests; app.save(); app.addAudit('CREATED', `Saved customer price preview at ${money(lastEstimate.total)}`);
    }
    const target = document.getElementById('rating-modal-result');
    if (target) target.innerHTML = `<div class="rating-inline-result"><div>✓</div><div><strong>Test case saved</strong><span>The inputs and ${money(lastEstimate.total)} result are stored for ${esc(product.name)} ${esc(context.version)}.</span></div></div>`;
  }

  function handleClick(event) {
    const libraryLinkEl = event.target.closest('[data-rating-link="library"]');
    if (libraryLinkEl) {
      event.preventDefault();
      location.assign(centralLibraryHref());
      return;
    }
    const button = event.target.closest('[data-rating-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.ratingAction;
    if (action === 'step') { activeStep = button.dataset.step; render(); }
    if (action === 'dismiss-result') { pageResult = null; render(); }
    if (action === 'close-modal') window.PS.closeModal();
    if (action === 'explain') openExplainModal();
    if (action === 'preview') { activeStep = 'preview'; render(); }
    if (action === 'change-template') openTemplateModal();
    if (action === 'apply-template') {
      const selected = document.querySelector('input[name="pricing-template"]:checked');
      if (!selected) return modalError('Choose a template', 'Select one portfolio template to continue.');
      record.templateId = selected.value;
      linkCentralTemplate(selected.value);
      refreshTemplatesFromCentral();
      saveRecord('Changed the linked central pricing template');
      syncRatingBundle();
      window.PS.closeModal();
      render();
      setResult('Central template linked', `${template().name} is now linked as this product's reference template. It does not change the configured Base Price.`);
    }
    if (action === 'save-base-price') {
      const priceEl = document.getElementById('rating-base-price');
      const basisEl = document.getElementById('rating-pricing-basis');
      const raw = priceEl?.value;
      const num = Number(raw);
      if (raw === '' || raw === undefined || !Number.isFinite(num) || num < 0) {
        setResult('Check the base price', 'Enter a valid, non-negative base price.', 'error');
        return;
      }
      record.basePrice = num;
      record.pricingBasis = basisEl?.value || 'annual';
      saveRecord('Updated the product base price');
      syncRatingBundle();
      render();
      setResult('Base price saved', `${money(num)} is now the configured base price for ${product.name}.`);
    }
    if (action === 'state-filter') { stateFilter = button.dataset.filter; render(); }
    if (action === 'save-state') {
      const code = button.dataset.state;
      const type = document.querySelector(`[data-state-type="${code}"]`)?.value || 'none';
      const valueEl = document.querySelector(`[data-state-value="${code}"]`);
      const value = valueEl ? valueEl.value : '';
      if (type !== 'none') {
        const num = Number(value);
        if (value === '' || !Number.isFinite(num)) { setResult('Check the value', `Enter a valid number for ${stateName(code)}.`, 'error'); return; }
        record.statePricing[code] = { type, value: num };
      } else {
        delete record.statePricing[code];
      }
      saveRecord(`Updated state pricing for ${stateName(code)}`);
      render();
      setResult('State pricing updated', `${stateName(code)} pricing has been saved.`);
    }
    if (action === 'clear-state') {
      const code = button.dataset.state;
      delete record.statePricing[code];
      saveRecord(`Cleared state pricing for ${stateName(code)}`);
      render();
      setResult('State pricing cleared', `${stateName(code)} now uses the product Base Price.`);
    }
    if (action === 'save-coverage-pricing') {
      const id = button.dataset.coverage;
      const method = document.querySelector(`[data-coverage-method="${id}"]`)?.value || 'none';
      const valueEl = document.querySelector(`[data-coverage-value="${id}"]`);
      const value = valueEl ? valueEl.value : '';
      const cover = getCoverageOptions().find(c => c.id === id);
      if (method !== 'none') {
        const num = Number(value);
        if (value === '' || !Number.isFinite(num)) { setResult('Check the value', 'Enter a valid pricing value.', 'error'); return; }
        record.coveragePricing[id] = { method, value: num };
      } else {
        delete record.coveragePricing[id];
      }
      saveRecord(`Updated coverage pricing for ${cover?.name || id}`);
      render();
      setResult('Coverage pricing updated', `${cover?.name || id} pricing has been saved.`);
    }
    if (action === 'run-preview') {
      previewState = document.getElementById('preview-state-select')?.value || '';
      document.querySelectorAll('[data-preview-field]').forEach(el => { previewInputs[el.dataset.previewField] = el.value; });
      lastEstimate = calculateFinalPrice({ stateCode: previewState || null, riskInputs: previewInputs });
      const target = document.getElementById('preview-result');
      if (target) target.innerHTML = previewResultHtml(lastEstimate);
    }
    if (action === 'edit-bands') openBandsModal(button.dataset.band);
    if (action === 'add-band') {
  addRatingBand(button.dataset.band);
}

if (action === 'remove-band') {
  removeRatingBand(
    button.dataset.band,
    Number(button.dataset.bandIndex)
  );
}
 if (action === 'save-bands') {
  const kind = button.dataset.band;

  const rows = getRatingBandDraft(kind).map((row, index) => {

    const labelEl = document.querySelector(
      `[data-band-label="${index}"]`
    );

    const actionEl = document.querySelector(
      `[data-band-action="${index}"]`
    );

    const valueEl = document.querySelector(
      `[data-band-value="${index}"]`
    );

    return {
      label: labelEl ? labelEl.value.trim() : '',
      action: actionEl ? actionEl.value : 'same',
      value: valueEl ? Number(valueEl.value) : 0
    };
  });

  if (!rows.length) {
    return modalError(
      'No choices',
      'Add at least one customer group.'
    );
  }

  if (
    rows.some(
      row =>
        !row.label ||
        Number.isNaN(row.value) ||
        row.value < 0 ||
        row.value > 100
    )
  ) {
    return modalError(
      'Check the choices',
      'Every group needs a name and a percentage between 0 and 100.'
    );
  }

  // Save the updated choices to the actual rating configuration.
  record.bands[kind] = rows;

  // Clear temporary draft.
  window.__ratingBandDraft = null;

  // Persist the rating configuration.
  saveRecord(`Updated ${kind} customer choices`);

  window.PS.closeModal();

  // Refresh the Rating Guide so the updated card is visible immediately.
  render();

  setResult(
    'Customer choices saved',
    'The updated groups now appear in Risk adjustments and the price preview.'
  );
}
    if (action === 'add-rule') openRuleModal();
    if (action === 'edit-rule') openRuleModal(record.customRules.find(rule => rule.id === button.dataset.rule));
    if (action === 'save-rule') {
      const name = document.getElementById('rating-rule-name').value.trim();
      const field = document.getElementById('rating-rule-field').value;
      const operator = document.getElementById('rating-rule-operator').value;
      const value = document.getElementById('rating-rule-value').value;
      const ruleAction = document.getElementById('rating-rule-action').value;
      const amount = Number(document.getElementById('rating-rule-amount').value);
      if (!name || value === '' || !Number.isFinite(amount) || amount < 0) return modalError('Complete the rule', 'Add a rule name, comparison value, and valid price change.');
      const id = button.dataset.rule || `RULE-${Date.now()}`;
      const next = { id, name, field, operator, value, action:ruleAction, amount, unit:ruleAction === 'fixed' ? 'fixed' : 'percent', enabled:true };
      const index = record.customRules.findIndex(rule => rule.id === id);
      if (index >= 0) record.customRules[index] = next; else record.customRules.push(next);
      saveRecord(`${index >= 0 ? 'Updated' : 'Added'} pricing rule ${name}`); activeStep = 'risk'; window.PS.closeModal(); setResult(index >= 0 ? 'Pricing rule updated' : 'Pricing rule added', `${name} now appears as a readable business rule.`);
    }
    if (action === 'toggle-rule') { const rule = record.customRules.find(item => item.id === button.dataset.rule); rule.enabled = rule.enabled === false; saveRecord(`${rule.enabled ? 'Resumed' : 'Paused'} pricing rule ${rule.name}`); setResult(`Rule ${rule.enabled ? 'resumed' : 'paused'}`, `${rule.name} ${rule.enabled ? 'will now affect matching price previews' : 'will remain visible but will not affect prices'}.`); }
    if (action === 'delete-rule') { const rule = record.customRules.find(item => item.id === button.dataset.rule); if (!rule) return; record.customRules = record.customRules.filter(item => item.id !== rule.id); saveRecord(`Removed pricing rule ${rule.name}`); setResult('Pricing rule removed', `${rule.name} no longer affects customer prices.`); }
    if (action === 'toggle-discount') { const item = record.discounts[button.dataset.discount]; item.enabled = !item.enabled; saveRecord(`${item.enabled ? 'Enabled' : 'Disabled'} ${item.name}`); setResult(`Discount ${item.enabled ? 'turned on' : 'turned off'}`, `${item.name} ${item.enabled ? 'will now be considered in price previews' : 'will no longer be applied'}.`); }
    if (action === 'save-test') saveTestCase();
    if (action === 'download-breakdown') downloadBreakdown();
    if (action === 'download-summary') downloadSummary();
    if (action === 'save') { saveRecord('Saved guided pricing setup'); setResult('Pricing setup saved', `All guided choices are stored for ${product.name} ${context.version}.`); }

    if (action === 'add-risk-factor') openRiskFactorModal();
    if (action === 'edit-risk-factor') {
      const factor = (record.riskRatingFactors || []).find(item => item.id === button.dataset.factor);
      if (factor) openRiskFactorModal(factor);
    }
    if (action === 'delete-risk-factor') {
      const factor = (record.riskRatingFactors || []).find(item => item.id === button.dataset.factor);
      if (!factor) return;
      record.riskRatingFactors = record.riskRatingFactors.filter(item => item.id !== factor.id);
      saveRecord(`Removed risk rating factor ${factor.name}`);
      setResult('Risk rating factor removed', `${factor.name} no longer feeds the rating engine.`);
    }
    if (action === 'save-risk-factor') {
      const attrSelect = document.getElementById('risk-factor-attribute');
      const coverageSelect = document.getElementById('risk-factor-coverage');
      const existingId = button.dataset.factorId;
      if (!attrSelect) return modalError('No Risk Attributes available', 'Add attributes in Risk Guide before creating a rating factor.');
      if (!coverageSelect) return modalError('No Coverages available', 'Assign a Futuristic parent cover in Class of Business first.');

      const riskAttributeId = attrSelect.value;
      const attribute = getRiskAttributeOptions().find(item => String(item.id) === String(riskAttributeId));
      const coverageId = coverageSelect.value;
      const coverage = coverageSelect.selectedOptions[0]?.dataset.name || coverageSelect.value;
      if (!attribute) return modalError('Choose a Risk Attribute', 'Select an attribute saved in Futuristic Risk Guide.');
      if (!coverageId) return modalError('Choose a Coverage', 'Select a Futuristic parent coverage.');

      const rows = riskConditionRows(attribute);
      if (!rows.length) return modalError('No Risk Guide conditions', 'Add and save at least one condition for this attribute in Risk Guide first.');
      if (rows.some(row => !Number.isFinite(Number(row.factor)) || Number(row.factor) <= 0)) {
        return modalError('Check Risk Guide rating factors', 'Every condition with rating impact must have a rating factor greater than 0.');
      }

      const name = `${attribute.name} Factor`;
      const id = existingId || generateFactorId();
      const tableId = `${String(attribute.id).replace(/[^a-z0-9]+/gi, '') || 'risk'}Table`;
      const next = {
        id,
        name,
        type: 'factor',
        status: 'done',
        coverage,
        coverageId,
        riskAttribute: attribute.name,
        riskAttributeId: attribute.id,
        riskCategory: attribute.category,
        ratingMethod: 'table',
        amount: 1,
        table: { id:tableId, sourceSheet:attribute.name, data:clone(rows) },
        configured: true
      };

      record.riskRatingFactors = record.riskRatingFactors || [];
      const index = record.riskRatingFactors.findIndex(item => item.id === id);
      if (index >= 0) record.riskRatingFactors[index] = next;
      else record.riskRatingFactors.push(next);
      window.__riskFactorDraft = null;
      saveRecord(`${index >= 0 ? 'Updated' : 'Added'} Risk Guide factor ${name}`);
      activeStep = 'risk';
      window.PS.closeModal();
      render();
      setResult(index >= 0 ? 'Risk rating factor updated' : 'Risk rating factor added', `${name} now uses the saved Risk Guide conditions for ${coverage}.`);
    }
  }

function handleChange(event) {

  if (event.target.id === 'rating-rule-field') {

    const wrap = document.getElementById('rating-rule-value-wrap');

    wrap.innerHTML = ruleValueControl(event.target.value);

    const config = FIELD_OPTIONS[event.target.value];

    const operator = document.getElementById('rating-rule-operator');

    if (
      config.type === 'select' &&
      ['lt', 'gte'].includes(operator.value)
    ) {
      operator.value = 'eq';
    }
  }

  if (event.target.id === 'rating-rule-action') {
    document.getElementById('rating-rule-unit').textContent =
      event.target.value === 'fixed' ? '$' : '%';
  }

  if (event.target.id === 'risk-factor-attribute') {
    const attribute = getRiskAttributeOptions().find(item => String(item.id) === String(event.target.value));
    window.__riskFactorDraft = {
      id: window.__riskFactorDraft?.id || '',
      attributeId: attribute?.id || '',
      rows: riskConditionRows(attribute)
    };
    const factorName = document.getElementById('risk-factor-name');
    const category = document.getElementById('risk-factor-category');
    const rows = document.getElementById('risk-factor-rows');
    if (factorName) factorName.value = attribute ? `${attribute.name} Factor` : '';
    if (category) category.value = attribute?.category || '';
    if (rows) rows.innerHTML = renderRiskFactorRows();
  }
}

  async function init() {
    root = document.getElementById('rating-gui');
    if (!root || !window.PS?.openModal) return;
    document.body.classList.add('rating-guided-only');

    if (window.PS?.prototypeApp?.hydrateFromWorkspace) {
      try { await PS.prototypeApp.hydrateFromWorkspace(); } catch (_) { /* offline prototype */ }
    }

    context = getContext();
    refreshTemplatesFromCentral();
    product = findProduct();

    if (PS.prototypeApp?.rememberContext) {
      PS.prototypeApp.rememberContext({ productId: context.productId, version: context.version });
    }

    record = loadRecord();
    if (!record.templateId || !TEMPLATES.some(t => t.id === record.templateId)) {
      record.templateId = automaticTemplate().id;
      saveRecord('Applied default portfolio pricing template');
    } else {
      syncRatingBundle();
    }

    document.title = `Rating & Pricing Guide · ${product.name}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = 'Configure customer pricing with visual business rules, automatic portfolio starting prices, discounts, fees, taxes, and plain-language price previews.';

    if (PS.nav?.render) {
      PS.nav.render('rating', [
        { label: 'Product Catalogue', href: 'catalogue.html' },
        { label: product.name || context.productId, href: `product-detail.html?id=${encodeURIComponent(context.productId)}` },
        { label: `v${context.version}`, href: `product-detail.html?id=${encodeURIComponent(context.productId)}&version=${encodeURIComponent(context.version)}` },
        { label: 'Rating & Pricing Guide', href: '#' }
      ]);
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleChange);
    document.addEventListener('input', (event) => {
      if (event.target.id === 'state-search') { stateSearch = event.target.value; render(); }
    });
    window.addEventListener('central-pricing-updated', () => {
      refreshTemplatesFromCentral();
      record = syncChargesFromCentral(record);
      saveRecord('Synced centrally managed charges and discounts');
      render();
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
