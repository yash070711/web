/* ============================================================
   Insurance Product Studio — browser-only application layer
   Shared persistence, cross-page commands, downloads and fixes.
   ============================================================ */
(function () {
  'use strict';

  window.PS = window.PS || {};

  const STORAGE_KEY = 'insurance-product-studio-v2';
  const CONTEXT_KEY = 'ps-active-product';
  const LIBRARY_EXTRAS_KEY = 'insurance-studio-library-extras-v1';
  const FULL_PRODUCT_INDEX_KEY = 'insurance-product-studio-full-products';
  const fullProductStorageKey = (productId, version) => `insurance-product-studio-product::${productId}::${version || 'active'}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const today = () => new Date().toISOString().slice(0, 10);
  const now = () => new Date().toISOString();
  const displayDate = value => {
    if (!value) return null;
    const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g, '-');
  };
  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const EFFECTIVE_DATE_PAIRS = [
    ['w-eff-from', 'w-eff-to'],
    ['nv-from', 'nv-to'],
    ['cv-from', 'cv-to']
  ];
  const EFFECTIVE_DATE_ERROR = 'Effective To must be the same date as Effective From, or a later date.';

  function isoDateValue(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const display = String(value).match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (display) {
      const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
      const month = months[display[2]];
      if (month != null) {
        const d = new Date(Number(display[3]), month, Number(display[1]));
        if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      }
    }
    const parsed = new Date(value + (String(value).length === 10 ? 'T00:00:00' : ''));
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  }

  function effectiveDatesOutOfOrder(from, to) {
    const fromIso = isoDateValue(from);
    const toIso = isoDateValue(to);
    return Boolean(fromIso && toIso && toIso < fromIso);
  }

  function syncEffectiveDatePair(fromId, toId) {
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    if (!fromEl || !toEl) return;
    const from = fromEl.value;
    if (from) {
      toEl.min = from;
      if (toEl.value && toEl.value < from) toEl.value = from;
    } else {
      toEl.removeAttribute('min');
    }
  }

  function wireEffectiveDatePairs() {
    EFFECTIVE_DATE_PAIRS.forEach(([fromId, toId]) => syncEffectiveDatePair(fromId, toId));
  }

  function pairIdsForInput(el) {
    if (!el || el.type !== 'date' || !el.id) return null;
    return EFFECTIVE_DATE_PAIRS.find(([fromId, toId]) => el.id === fromId || el.id === toId) || null;
  }

  function effectiveDateRangeError(fromId, toId) {
    const from = document.getElementById(fromId)?.value;
    const to = document.getElementById(toId)?.value;
    return effectiveDatesOutOfOrder(from, to) ? EFFECTIVE_DATE_ERROR : null;
  }

  PS.syncEffectiveTo = function (fromId, toId) {
    syncEffectiveDatePair(fromId, toId);
  };

  function initialState() {
    return {
      schemaVersion: 2,
      products: [],
      productDetails: {},
      collections: {},
      formSnapshots: {},
      lifecycle: {},
      audit: [],
      notifications: [
        { id:'NTF-001', title:'Draft incomplete', detail:'Commercial Vehicle Fleet v2026.05-DRAFT needs rating configuration.', href:'product-detail.html?id=PRD-011#studios', read:false, at:now() },
        { id:'NTF-002', title:'Version expires soon', detail:'Commercial Truck Comprehensive v2026.08 expires on 31-Jul-2027.', href:'product-detail.html?id=PRD-015&version=2026.08#versions', read:false, at:now() }
      ],
      users: {},
      settings: {},
      glossarySuggestions: [],
      webhookRecords: [],
      simulationRuns: [],
      jobs: [],
      currentRole: localStorage.getItem('ps-current-role') || 'Product Manager',
      deletedProductIds: []
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return parsed && parsed.schemaVersion === 2 ? Object.assign(initialState(), parsed) : initialState();
    } catch (_) {
      return initialState();
    }
  }

  let state = loadState();
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not persist studio state', err);
    }
  }

  function routeName() {
    if (typeof window !== 'undefined' && window.__PS_HTML_FILE__) return window.__PS_HTML_FILE__;
    const path = location.pathname || '';
    const nextToHtml = [
      [/\/dashboard\/?$/, 'index.html'],
      [/\/catalogue\/?$/, 'catalogue.html'],
      [/\/products\/[^/]+\/view/, 'product-view.html'],
      [/\/products\/[^/]+\/coverage/, 'coverage-studio.html'],
      [/\/products\/[^/]+\/questionnaire/, 'questionnaire-studio.html'],
      [/\/products\/[^/]+\/risk/, 'risk-studio.html'],
      [/\/products\/[^/]+\/eligibility/, 'eligibility-studio.html'],
      [/\/products\/[^/]+\/rating/, 'rating-studio.html'],
      [/\/products\/[^/]+\/underwriting/, 'underwriting-studio.html'],
      [/\/products\/[^/]+\/distribution/, 'distribution-studio.html'],
      [/\/products\/[^/]+\/document/, 'document-studio.html'],
      [/\/products\/[^/]+\/jurisdiction/, 'jurisdiction-studio.html'],
      [/\/products\/[^/]+\/?$/, 'product-detail.html'],
      [/\/coverage-studio/, 'coverage-studio.html'],
      [/\/questionnaire-studio/, 'questionnaire-studio.html'],
      [/\/risk-studio/, 'risk-studio.html'],
      [/\/eligibility-studio/, 'eligibility-studio.html'],
      [/\/rating-pricing/, 'rating-studio.html'],
      [/\/underwriting/, 'underwriting-studio.html'],
      [/\/distribution\/create/, 'distribution-create.html'],
      [/\/distribution/, 'distribution-studio.html'],
      [/\/document-studio/, 'document-studio.html'],
      [/\/jurisdiction/, 'jurisdiction-studio.html'],
      [/\/simulation/, 'simulation-studio.html'],
      [/\/audit-log|\/audit/, 'audit-log.html'],
      [/\/governance/, 'governance.html'],
      [/\/admin/, 'admin-panel.html'],
      [/\/pricing-library/, 'pricing-library.html'],
      [/\/integration/, 'integration-monitor.html'],
      [/\/roles/, 'roles-access.html'],
      [/\/glossary/, 'glossary.html']
    ];
    for (const [re, file] of nextToHtml) {
      if (re.test(path)) return file;
    }
    return path.split('/').pop() || 'index.html';
  }

  function readStoredContext() {
    try { return JSON.parse(localStorage.getItem(CONTEXT_KEY) || 'null'); } catch (_) { return null; }
  }

  function pageHasProductContext() {
    const q = new URLSearchParams(location.search);
    return Boolean(q.get('product') || q.get('id'));
  }

  function readLibraryExtras() {
    try { return JSON.parse(localStorage.getItem(LIBRARY_EXTRAS_KEY) || '{}'); } catch (_) { return {}; }
  }

  function libraryExtrasFor(kind) {
    const list = readLibraryExtras()[kind];
    return Array.isArray(list) ? list : [];
  }

  function addLibraryExtra(kind, item) {
    const all = readLibraryExtras();
    const next = libraryExtrasFor(kind).concat([item]);
    all[kind] = next;
    try { localStorage.setItem(LIBRARY_EXTRAS_KEY, JSON.stringify(all)); } catch (_) {}
    return item;
  }

  function rememberContext(ctx) {
    if (!ctx?.productId) return;
    try { localStorage.setItem(CONTEXT_KEY, JSON.stringify({ productId: ctx.productId, version: ctx.version || null })); } catch (_) {}
  }

  function context() {
    const query = new URLSearchParams(location.search);
    const stored = readStoredContext();
    const productId = query.get('product') || query.get('id') || stored?.productId || 'PRD-015';
    const version = query.get('version') || stored?.version || productById(productId)?.version || null;
    const ctx = { page: routeName(), productId, version };
    if (query.get('product') || query.get('id') || query.get('version')) rememberContext(ctx);
    return ctx;
  }

  function usedVersionLabels(productId) {
    const labels = new Set();
    const detail = productId ? state.productDetails[productId] : null;
    (detail?.versions || []).forEach(v => { if (v?.label) labels.add(String(v.label)); });
    const product = productId ? productById(productId) : null;
    if (product?.version) labels.add(String(product.version));
    return [...labels];
  }

  function nextVersionLabel(used) {
    const taken = new Set((used || []).map(String));
    const nowDate = new Date();
    const year = nowDate.getFullYear();
    const month = nowDate.getMonth() + 1;
    for (let i = 0; i < 36; i++) {
      const y = year + Math.floor((month + i - 1) / 12);
      const m = String(((month + i - 1) % 12) + 1).padStart(2, '0');
      const label = `${y}.${m}`;
      if (!taken.has(label)) return label;
    }
    const base = `${year}.${String(month).padStart(2, '0')}`;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
  }

  function uniqueVersionLabel(productId, preferred) {
    const used = usedVersionLabels(productId);
    const candidate = String(preferred || '').trim();
    if (candidate && !used.includes(candidate)) return candidate;
    return nextVersionLabel(used);
  }

  function allCatalogueVersionLabels() {
    const labels = [];
    state.products.forEach(p => { if (p?.version) labels.push(String(p.version)); });
    Object.values(state.productDetails || {}).forEach(detail => {
      (detail?.versions || []).forEach(v => { if (v?.label) labels.push(String(v.label)); });
    });
    return labels;
  }

  function nextProductCode(family) {
    const famCode = String(family || 'PRD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'PRD';
    const year = new Date().getFullYear();
    const prefix = `${famCode}-${year}-`;
    const taken = new Set(state.products.map(p => String(p.code || '').trim().toUpperCase()).filter(Boolean));
    let seq = 1;
    let code = `${prefix}${String(seq).padStart(3, '0')}`;
    while (taken.has(code)) {
      seq += 1;
      code = `${prefix}${String(seq).padStart(3, '0')}`;
    }
    return code;
  }

  function fillAutoVersionFields() {
    const fields = [
      { id: 'w-version', used: allCatalogueVersionLabels() },
      { id: 'clone-version', used: allCatalogueVersionLabels() },
      { id: 'nv-label', used: usedVersionLabels(context().productId) },
      { id: 'cv-label', used: usedVersionLabels(context().productId) }
    ];
    fields.forEach(({ id, used }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = nextVersionLabel(used);
      el.readOnly = true;
      el.setAttribute('aria-readonly', 'true');
    });
  }

  PS.nextVersionLabel = nextVersionLabel;

  function productById(id) {
    return state.products.find(p => p.id === id) || null;
  }

  function versionRecord(productId, version) {
    const detail = state.productDetails[productId];
    if (detail && version) return detail.versions?.find(v => v.label === version) || null;
    const product = productById(productId);
    if (!version && detail) return detail.versions?.find(v => v.label === detail.activeVersion) || detail.versions?.[0] || null;
    if (product && (!version || product.version === version)) return { label:product.version, status:product.status };
    return null;
  }

  function versionStatus(productId, version) {
    const record = versionRecord(productId, version);
    if (record?.status) return record.status;
    if (String(version || '').toUpperCase().includes('DRAFT')) return 'draft';
    return productById(productId)?.status || 'published';
  }

  function canEditVersion() {
    const ctx = context();
    return /DRAFT/i.test(ctx.version || '') || versionStatus(ctx.productId, ctx.version) === 'draft';
  }

  function collectionKey(name, ctx = context()) {
    return `${ctx.productId}::${ctx.version || 'active'}::${name}`;
  }

  function isNewStudioProduct(product) {
    return Boolean(product && product.pending);
  }

  function defaultQuestionGroupsForProduct(product) {
    if (typeof PS.truckingQuestionGroups !== 'function') return [];
    if (PS.isTruckingProduct ? PS.isTruckingProduct(product) : String(product?.family || '') === 'Trucking') {
      return clone(PS.truckingQuestionGroups());
    }
    return [];
  }

  function hydrateCollection(name, target) {
    const key = collectionKey(name);
    const stored = state.collections[key];
    const ctx = context();
    const product = productById(ctx.productId);
    if (name === 'covers' && shouldDeferCoverHydration(product)) {
      ensureCoverPool(ctx.productId, ctx.version);
      const selected = state.collections[key];
      target.splice(0, target.length, ...(Array.isArray(selected) ? clone(selected) : []));
      return target;
    }
    if (Array.isArray(stored) && stored.length > 0) {
      target.splice(0, target.length, ...clone(stored));
      return target;
    }
    if (name === 'questionGroups') {
      const defaults = defaultQuestionGroupsForProduct(product);
      if (defaults.length) {
        target.splice(0, target.length, ...defaults);
        state.collections[key] = clone(target);
        saveState();
        return target;
      }
    }
    if (isNewStudioProduct(product) && name !== 'covers') {
      target.splice(0, target.length);
      return target;
    }
    const seed = PS.studioSeeds?.[ctx.productId]?.[name];
    if (Array.isArray(seed) && seed.length) {
      target.splice(0, target.length, ...clone(seed));
      state.collections[key] = clone(target);
      saveState();
      return target;
    }
    if (product?.sourceProductId) {
      const sourceVersion = product.sourceVersion || productById(product.sourceProductId)?.version;
      const sourceKey = Object.keys(state.collections).find(k => {
        if (!k.startsWith(`${product.sourceProductId}::`) || !k.endsWith(`::${name}`)) return false;
        if (sourceVersion) return k === `${product.sourceProductId}::${sourceVersion}::${name}`;
        return true;
      });
      const source = sourceKey ? state.collections[sourceKey] : null;
      if (Array.isArray(source) && source.length) {
        target.splice(0, target.length, ...clone(source));
        state.collections[key] = clone(target);
        saveState();
        return target;
      }
    }
    if (target.length && (!Array.isArray(stored) || stored.length === 0)) {
      state.collections[key] = clone(target);
      saveState();
    }
    return target;
  }

  function persistCollection(name, target) {
    try {
      if (name === 'covers' && typeof applyCoverCompletionFlags === 'function') {
        applyCoverCompletionFlags(target);
      }
      state.collections[collectionKey(name)] = clone(target);
      saveState();
      addAudit('MODIFIED', `${name} configuration saved`, { collection:name });
      storeFullProductJson(context().productId, context().version);
      refreshStudioNav();
      if (PS.uwRuleStore?.shouldSyncOnPersist?.(name) && name !== PS.uwRuleStore.COLLECTION) {
        const ctx = context();
        if (ctx.productId) {
          PS.uwRuleStore.syncAll(ctx.productId, ctx.version, { silent: true });
        }
      }
    } catch (err) {
      console.warn('Could not persist collection', name, err);
    }
  }

  function customerViewHref(productId, version) {
    const id = productId || context().productId;
    const ver = version || context().version || productById(id)?.version || '';
    return `product-view.html?id=${encodeURIComponent(id)}&version=${encodeURIComponent(ver)}`;
  }

  function getProductBundle(productId, version) {
    const product = productById(productId) || state.products[0] || { id:productId, name:'Insurance product', family:'General', version:version || 'Draft', status:'draft' };
    const detail = state.productDetails[productId] || {};
    const ver = version || product.version || detail.activeVersion || 'active';
    const read = name => {
      if (name === 'covers' && shouldDeferCoverHydration(product) && product.coversPicked !== true) {
        const selected = state.collections[`${productId}::${ver}::covers`];
        return Array.isArray(selected) ? clone(selected) : [];
      }
      const usable = value => {
        if (Array.isArray(value)) return value.length ? clone(value) : null;
        return value ? clone(value) : null;
      };
      const exact = usable(state.collections[`${productId}::${ver}::${name}`]);
      if (exact) return exact;
      const fallbackKey = Object.keys(state.collections).find(k => {
        if (!k.startsWith(`${productId}::`) || !k.endsWith(`::${name}`)) return false;
        return Boolean(usable(state.collections[k]));
      });
      if (fallbackKey) return usable(state.collections[fallbackKey]);
      if (isNewStudioProduct(product) && name !== 'covers') {
        if (name === 'questionGroups') {
          const defaults = defaultQuestionGroupsForProduct(product);
          if (defaults.length) return defaults;
        }
        return [];
      }
      const seed = PS.studioSeeds?.[productId]?.[name];
      if (seed) return clone(seed);
      const sourceId = product.sourceProductId;
      if (sourceId) {
        const sourceVersion = product.sourceVersion || productById(sourceId)?.version;
        const sourceExact = sourceVersion ? usable(state.collections[`${sourceId}::${sourceVersion}::${name}`]) : null;
        if (sourceExact) return sourceExact;
        const sourceKey = Object.keys(state.collections).find(k => k.startsWith(`${sourceId}::`) && k.endsWith(`::${name}`) && usable(state.collections[k]));
        if (sourceKey) return usable(state.collections[sourceKey]);
        const sourceSeed = PS.studioSeeds?.[sourceId]?.[name];
        if (sourceSeed) return clone(sourceSeed);
      }
      if (name === 'questionGroups') {
        const defaults = defaultQuestionGroupsForProduct(product);
        if (defaults.length) return defaults;
      }
      return [];
    };
    const covers = read('covers');
    const questionGroups = read('questionGroups');
    const rating = read('ratingComponents');
    const documents = read('documents');
    const eligibility = read('eligibilityRules');
    const underwriting = read('underwritingRules');
    const channels = read('channels');
    const testCases = read('testCases');
    const risk = read('riskAttributes');
    const baseItem = (Array.isArray(rating) ? rating : []).flatMap(g => g.items || []).find(i => i.type === 'base');
    const base = Number(baseItem?.amount) || (String(product.family).toLowerCase() === 'motor' && /truck/i.test(product.name) ? 1850 : String(product.family).toLowerCase() === 'motor' ? 350 : 300);
    return {
      product: Object.assign({}, product, { description: detail.description || product.description || '' }),
      detail, version: ver, covers, questionGroups, rating, documents, eligibility,
      underwriting, channels, testCases, risk, basePremium: base
    };
  }

  function collectionsForProduct(productId, version) {
    const prefix = `${productId}::`;
    const byVersion = {};
    Object.keys(state.collections || {}).forEach(key => {
      if (!key.startsWith(prefix)) return;
      const parts = key.split('::');
      const ver = parts[1] || 'active';
      const name = parts.slice(2).join('::');
      if (version && ver !== String(version) && ver !== 'active') return;
      byVersion[ver] = byVersion[ver] || {};
      byVersion[ver][name] = clone(state.collections[key]);
    });
    return byVersion;
  }

  function buildFullProductJson(productId, version) {
    const bundle = getProductBundle(productId, version);
    const product = bundle.product || {};
    const ver = bundle.version || version || product.version || 'active';
    const detail = clone(bundle.detail || state.productDetails[productId] || {});
    const collections = collectionsForProduct(productId);
    const currentCollections = collections[ver] || collections[Object.keys(collections)[0]] || {};
    return {
      schema: 'insurance-product-studio-product-v1',
      exportedAt: now(),
      productId: product.id,
      version: ver,
      status: product.status || detail.status || 'draft',
      product: clone(product),
      identity: {
        id: product.id,
        name: product.name,
        code: product.code,
        family: product.family,
        segment: product.segment,
        owner: product.owner,
        jurisdictions: product.jurisdictions || [],
        description: product.description || detail.description || '',
        effectiveFrom: product.effectiveFrom,
        effectiveTo: product.effectiveTo,
        sourceProductId: product.sourceProductId || null,
        sourceVersion: product.sourceVersion || null
      },
      versions: clone(detail.versions || product.versions || []),
      studios: {
        coverage: clone(bundle.covers || currentCollections.covers || []),
        questionnaire: clone(bundle.questionGroups || currentCollections.questionGroups || []),
        eligibility: clone(bundle.eligibility || currentCollections.eligibilityRules || []),
        rating: clone(bundle.rating || currentCollections.ratingComponents || []),
        underwriting: clone(bundle.underwriting || currentCollections.underwritingRules || []),
        distribution: clone(bundle.channels || currentCollections.channels || []),
        documents: clone(bundle.documents || currentCollections.documents || []),
        simulation: clone(bundle.testCases || currentCollections.testCases || [])
      },
      pricing: { basePremium: bundle.basePremium || 0 },
      governance: clone(detail.governance || []),
      checklist: clone(detail.checklist || []),
      completion: detail.completion || 0,
      collectionsByVersion: collections,
      audit: (state.audit || []).filter(e => e.productId === productId).slice(0, 100),
      simulationRuns: (state.simulationRuns || []).filter(r => r.context?.productId === productId || r.productId === productId).slice(0, 50)
    };
  }

  function storeFullProductJson(productId, version) {
    if (!productId) return null;
    const pack = buildFullProductJson(productId, version);
    const key = fullProductStorageKey(pack.productId, pack.version);
    try {
      localStorage.setItem(key, JSON.stringify(pack));
      const index = JSON.parse(localStorage.getItem(FULL_PRODUCT_INDEX_KEY) || '{}');
      const entry = index[pack.productId] || { id: pack.productId, versions: [] };
      entry.name = pack.identity?.name || pack.product?.name;
      entry.status = pack.status;
      entry.latestVersion = pack.version;
      entry.updatedAt = pack.exportedAt;
      entry.storageKey = key;
      if (!entry.versions.includes(pack.version)) entry.versions.push(pack.version);
      index[pack.productId] = entry;
      localStorage.setItem(FULL_PRODUCT_INDEX_KEY, JSON.stringify(index));
      state.productPacks = state.productPacks || {};
      state.productPacks[`${pack.productId}::${pack.version}`] = { storageKey: key, updatedAt: pack.exportedAt, name: entry.name };
      saveState();
    } catch (err) {
      console.warn('Could not store full product JSON', err);
    }
    return pack;
  }

  function exportFullProduct(productId, version) {
    const id = productId || context().productId;
    const ver = version || context().version;
    const pack = storeFullProductJson(id, ver);
    if (!pack) throw new Error('No product is available to export.');
    download(`${pack.productId}-${pack.version}-full.json`, JSON.stringify(pack, null, 2), 'application/json');
    return pack;
  }

  function viewFullProductJson(productId, version) {
    const id = productId || context().productId;
    const ver = version || context().version;
    const pack = storeFullProductJson(id, ver);
    if (!pack) throw new Error('No product is available to view.');
    const json = JSON.stringify(pack, null, 2);
    window.__psLastFullJson = json;
    PS.openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Full product JSON</h2>
        <button class="btn btn-icon" type="button" onclick="PS.closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--color-muted);margin-bottom:12px">${escapeHtml(pack.identity?.name || pack.productId)} · ${escapeHtml(pack.productId)} · v${escapeHtml(pack.version)} — complete studios, pricing, and governance (not counts).</p>
        <pre id="ps-json-view" class="ps-json-view">${escapeHtml(json)}</pre>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" type="button" onclick="PS.prototypeApp.copyLastFullJson()">Copy JSON</button>
        <button class="btn btn-primary" type="button" onclick="PS.prototypeApp.exportFullProduct('${escapeHtml(pack.productId)}','${escapeHtml(pack.version)}')">Download JSON</button>
      </div>`, 'modal-lg');
    return pack;
  }

  function copyLastFullJson() {
    const text = window.__psLastFullJson || document.getElementById('ps-json-view')?.textContent || '';
    if (!text) return showResult('Nothing to copy', 'Open View JSON first.', { type:'error' });
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
    showResult('JSON copied', 'The full product JSON is on the clipboard.');
  }

  PS.customerViewHref = customerViewHref;

  function addAudit(action, description, extra = {}) {
    const ctx = context();
    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      at: now(),
      user: PS.data?.currentUser?.name || 'Anika Sharma',
      role: state.currentRole,
      action,
      page: ctx.page,
      productId: extra.productId || ctx.productId,
      version: extra.version || ctx.version,
      description,
      extra
    };
    state.audit.unshift(event);
    state.audit = state.audit.slice(0, 500);
    saveState();
    return event;
  }

  function addNotification(title, detail, href) {
    state.notifications.unshift({ id:`NTF-${Date.now()}`, title, detail, href, read:false, at:now() });
    saveState();
  }

  function showResult(title, detail, options = {}) {
    document.querySelector('.ps-action-result')?.remove();
    const el = document.createElement('section');
    el.className = `ps-action-result ${options.type || 'success'}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <div class="ps-action-result-icon">${options.type === 'error' ? '!' : '✓'}</div>
      <div style="flex:1;min-width:0">
        <div class="ps-action-result-title">${escapeHtml(title)}</div>
        <div class="ps-action-result-detail">${escapeHtml(detail)}</div>
        ${options.href ? `<a class="ps-action-result-link" href="${escapeHtml(options.href)}">${escapeHtml(options.linkLabel || 'Open result')} →</a>` : ''}
      </div>
      <button class="btn btn-icon" aria-label="Dismiss result" onclick="this.closest('.ps-action-result').remove()">×</button>`;
    const modalBody = options.type === 'error' ? document.querySelector('.modal-overlay.open .modal-body, #active-modal-overlay .modal-body') : null;
    const main = modalBody || document.querySelector('.page-inner, main .page-inner, main');
    if (main) main.prepend(el); else document.body.appendChild(el);
    el.scrollIntoView({ block:'nearest' });
  }

  function download(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type:mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showResult('Download created', `${filename} was generated from the current browser data.`);
    addAudit('EXPORTED', `Downloaded ${filename}`);
  }

  function productDetailFrom(product, sourceDetail) {
    const source = sourceDetail ? clone(sourceDetail) : {};
    const version = product.version || '2026.09-DRAFT';
    return Object.assign(source, {
      id:product.id,
      name:product.name,
      family:product.family,
      code:product.code || `${String(product.family || 'PRD').slice(0,3).toUpperCase()}-${new Date().getFullYear()}-${product.id.slice(-3)}`,
      segment:product.segment || source.segment || 'Personal Lines',
      riskType:product.riskType || source.riskType || 'Risk + Policyholder',
      jurisdictions:product.jurisdictions || source.jurisdictions || ['India'],
      distribution:product.distribution || source.distribution || ['Direct (Web)'],
      owner:product.owner || source.owner || 'Anika Sharma',
      description:product.description || source.description || 'New product configuration.',
      notes:product.notes || `Version ${version}: Draft created in the working prototype.`,
      status:product.status || 'draft',
      activeVersion:version,
      versions:[{
        label:version, status:product.status || 'draft', from:product.effectiveFrom || null,
        to:product.effectiveTo || null, by:product.owner || 'Anika Sharma', on:displayDate(today()), gates:0, sim:'Not Run'
      }],
      governance:[
        { gate:'Product Owner', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Actuarial', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Underwriting', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Compliance', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Ops/Tech', approver:'—', action:'Pending', date:'—', comment:'—' }
      ],
      studios: source.studios || [
        { id:'coverage', name:'Coverage Studio', icon:'umbrella', status:'partial', summary:'Draft configuration', href:'coverage-studio.html' },
        { id:'questionnaire', name:'Questionnaire Studio', icon:'list-checks', status:'partial', summary:'Draft configuration', href:'questionnaire-studio.html' },
        { id:'eligibility', name:'Eligibility Studio', icon:'user-check', status:'partial', summary:'Draft configuration', href:'eligibility-studio.html' },
        { id:'rating', name:'Rating & Pricing Studio', icon:'calculator', status:'missing', summary:'Not configured', href:'rating-studio.html' },
        { id:'underwriting', name:'Underwriting Rules Studio', icon:'shield-check', status:'missing', summary:'Not configured', href:'underwriting-studio.html' },
        { id:'distribution', name:'Distribution Studio', icon:'tree-structure', status:'missing', summary:'Not configured', href:'distribution-studio.html' },
        { id:'document', name:'Document Studio', icon:'file-text', status:'missing', summary:'Not configured', href:'document-studio.html' }
      ],
      checklist: source.checklist || [
        { studio:'Coverage Studio', status:'warn', note:'Review required' },
        { studio:'Questionnaire Studio', status:'warn', note:'Review required' },
        { studio:'Eligibility Studio', status:'warn', note:'Review required' },
        { studio:'Rating & Pricing Studio', status:'empty', note:'Not configured' },
        { studio:'Underwriting Rules Studio', status:'empty', note:'Not configured' },
        { studio:'Distribution Studio', status:'empty', note:'Not configured' },
        { studio:'Document Studio', status:'empty', note:'Not configured' }
      ],
      completion: source.completion || 0,
      lastSim:null,
      enabledStudios: product.enabledStudios || source.enabledStudios || null
    });
  }

  function nextProductId() {
    const ids = state.products.map(p => p.id).concat(Object.keys(state.productDetails || {}));
    const max = ids.reduce((n, id) => Math.max(n, Number(String(id).replace(/\D/g, '')) || 0), 0);
    return `PRD-${String(max + 1).padStart(3, '0')}`;
  }

  function persistProduct(product, detail) {
    if (!product.lastModifiedAt) product.lastModifiedAt = now();
    if (!product.lastModified) product.lastModified = displayDate(today());
    const index = state.products.findIndex(p => p.id === product.id);
    if (index >= 0) state.products[index] = clone(product); else state.products.unshift(clone(product));
    if (detail) state.productDetails[product.id] = clone(detail);
    saveState();
    storeFullProductJson(product.id, product.version || detail?.activeVersion);
  }

  function deleteProduct(productId) {
    if (!productId) return false;
    const idx = state.products.findIndex(p => p.id === productId);
    if (idx < 0) return false;
    const removed = state.products[idx];
    state.products.splice(idx, 1);
    delete state.productDetails[productId];
    Object.keys(state.collections || {}).forEach(key => {
      if (key.startsWith(`${productId}::`)) delete state.collections[key];
    });
    state.deletedProductIds = Array.isArray(state.deletedProductIds) ? state.deletedProductIds : [];
    if (!state.deletedProductIds.includes(productId)) state.deletedProductIds.push(productId);
    if (typeof FULL_PRODUCTS !== 'undefined') {
      const fi = FULL_PRODUCTS.findIndex(p => p.id === productId);
      if (fi >= 0) FULL_PRODUCTS.splice(fi, 1);
    }
    if (typeof VERSION_HISTORY !== 'undefined' && VERSION_HISTORY[productId]) delete VERSION_HISTORY[productId];
    if (typeof PRODUCTS_DETAIL !== 'undefined' && PRODUCTS_DETAIL[productId]) delete PRODUCTS_DETAIL[productId];
    if (PS.data?.products) {
      const di = PS.data.products.findIndex(p => p.id === productId);
      if (di >= 0) PS.data.products.splice(di, 1);
    }
    try {
      const index = JSON.parse(localStorage.getItem(FULL_PRODUCT_INDEX_KEY) || '{}');
      const entry = index[productId];
      const versions = entry?.versions || [];
      versions.forEach(ver => {
        try { localStorage.removeItem(fullProductStorageKey(productId, ver)); } catch (_) {}
      });
      try { localStorage.removeItem(fullProductStorageKey(productId, 'active')); } catch (_) {}
      if (entry?.storageKey) {
        try { localStorage.removeItem(entry.storageKey); } catch (_) {}
      }
      delete index[productId];
      localStorage.setItem(FULL_PRODUCT_INDEX_KEY, JSON.stringify(index));
    } catch (_) {}
    Object.keys(state.productPacks || {}).forEach(key => {
      if (key === productId || key.startsWith(`${productId}::`)) delete state.productPacks[key];
    });
    const stored = readStoredContext();
    if (stored?.productId === productId) {
      try { localStorage.removeItem(CONTEXT_KEY); } catch (_) {}
    }
    addAudit('DELETED', `Deleted product ${removed.name || productId}`, { productId, version: removed.version || null });
    saveState();
    return true;
  }

  function hydrateFromWorkspace() {
    if (hydrateFromWorkspace._pending) return hydrateFromWorkspace._pending;
    hydrateFromWorkspace._pending = fetch('/api/runtime/products', { signal: AbortSignal.timeout(2500) })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const deleted = new Set(state.deletedProductIds || []);
        (data?.products || []).forEach(p => {
          if (!p?.id || deleted.has(p.id)) return;
          if (!state.products.some(existing => existing.id === p.id)) state.products.push(clone(p));
          if (!state.productDetails[p.id]) state.productDetails[p.id] = productDetailFrom(p);
        });
        saveState();
      })
      .catch(() => {})
      .finally(() => { hydrateFromWorkspace._pending = null; });
    return hydrateFromWorkspace._pending;
  }

  function applyCreatedProductToPage(product) {
    if (typeof FULL_PRODUCTS !== 'undefined' && !FULL_PRODUCTS.some(p => p.id === product.id)) {
      FULL_PRODUCTS.unshift(clone(product));
    }
    if (typeof VERSION_HISTORY !== 'undefined') {
      VERSION_HISTORY[product.id] = [{
        version: product.version,
        status: product.status || 'draft',
        from: product.effectiveFrom || '—',
        to: product.effectiveTo || '—'
      }];
    }
    if (typeof PRODUCTS_DETAIL !== 'undefined' && state.productDetails[product.id]) {
      PRODUCTS_DETAIL[product.id] = clone(state.productDetails[product.id]);
    }
    if (PS.data?.products && !PS.data.products.some(p => p.id === product.id)) {
      PS.data.products.unshift(clone(product));
    }
  }

  const STUDIO_COLLECTION_MAP = {
    's-coverage': 'covers',
    's-quest': 'questionGroups',
    's-risk': 'riskAttributes',
    's-eligibility': 'eligibilityRules',
    's-rating': 'ratingComponents',
    's-uw': 'underwritingRules',
    's-dist': 'channels',
    's-doc': 'documents'
  };
  const STUDIO_WIZARD_IDS = {
    's-coverage': 'coverage',
    's-quest': 'questionnaire',
    's-risk': 'risk',
    's-eligibility': 'eligibility',
    's-rating': 'rating',
    's-uw': 'underwriting',
    's-dist': 'distribution',
    's-doc': 'document'
  };
  const ALL_CONFIG_STUDIO_IDS = Object.values(STUDIO_WIZARD_IDS);
  const COLLECTION_TO_STUDIO = {
    covers: 'coverage',
    questionGroups: 'questionnaire',
    riskAttributes: 'risk',
    eligibilityRules: 'eligibility',
    ratingComponents: 'rating',
    underwritingRules: 'underwriting',
    channels: 'distribution',
    documents: 'document'
  };
const STUDIO_NAV_CHAIN = [
  { id: 'jurisdiction', file: 'jurisdiction-studio.html', title: 'Define Jurisdiction' },
  { id: 'coverage', file: 'coverage-studio.html', title: 'Coverage Studio' },
  { id: 'questionnaire', file: 'questionnaire-studio.html', title: 'Questionnaire Studio' },
  { id: 'risk', file: 'risk-studio.html', title: 'Risk Studio' },
  { id: 'eligibility', file: 'eligibility-studio.html', title: 'Eligibility Studio' },
  { id: 'rating', file: 'rating-studio.html', title: 'Rating & Pricing Studio' },
  { id: 'distribution', file: 'distribution-studio.html', title: 'Distribution Studio' },
  { id: 'document', file: 'document-studio.html', title: 'Document Studio' }
];  
  const PAGE_TO_STUDIO_ID = {
    'coverage-studio.html': 'coverage',
    'jurisdiction-studio.html': 'jurisdiction',
    'questionnaire-studio.html': 'questionnaire',
    'risk-studio.html': 'risk',
    'eligibility-studio.html': 'eligibility',
    'rating-studio.html': 'rating',
    'underwriting-studio.html': 'underwriting',
    'distribution-studio.html': 'distribution',
    'document-studio.html': 'document'
  };

  function studioGateBlank(v) {
    return !String(v ?? '').trim();
  }
function coverValidationIssues(cover) {
  if (!cover) {
    return [{
      key: 'cover',
      section: '',
      message: 'Cover not found.'
    }];
  }

  const issues = [];

  const items = Array.isArray(cover.insuredItems)
    ? cover.insuredItems
    : [];

  // Insured Items
  if (!items.length) {
    issues.push({
      key: 'insuredItems',
      section: 'insuredItems',
      message: 'At least one insured item is required.'
    });
  }

  items.forEach((it, i) => {
    const basis = String(
      it.limitBasis || it.limitBasisMode || ''
    );

    if (/percent/i.test(basis)) {
      if (studioGateBlank(it.limitPct)) {
        issues.push({
          key: `item:${i}:limitPct`,
          section: 'insuredItems',
          itemIndex: i,
          selector: '[data-cover-validate="limit-pct"]'
        });
      }
    } else {
      if (studioGateBlank(it.limitAmount)) {
        issues.push({
          key: `item:${i}:limitAmount`,
          section: 'insuredItems',
          itemIndex: i,
          selector: '[data-cover-validate="limit-amount"]'
        });
      }
    }
  });

  // Sublimits
  (Array.isArray(cover.subLimits) ? cover.subLimits : [])
    .forEach((row, i) => {
      if (studioGateBlank(row.limit)) {
        issues.push({
          key: `sublimit:${i}:limit`,
          section: 'sublimits',
          rowIndex: i,
          selector: '[data-cover-validate="sublimit-value"]'
        });
      }
    });

  // Deductible
  const ded = String(
    cover.deductibleType || 'none'
  ).toLowerCase();

  // No deductible selected
  if (ded === 'none') {
    return issues;
  }

  // Fixed deductible
  // Only Deductible Amount is required.
  // Min/Max are optional.
  if (ded === 'fixed') {
    if (studioGateBlank(cover.deductibleAmount)) {
      issues.push({
        key: 'deductibleAmount',
        section: 'deductible',
        selector: '[data-cover-validate="deductible-amount"]',
        message: 'Deductible Amount is required.'
      });
    } else {
      const amount = Number(
        String(cover.deductibleAmount)
          .replace(/,/g, '')
          .trim()
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        issues.push({
          key: 'deductibleAmount',
          section: 'deductible',
          selector: '[data-cover-validate="deductible-amount"]',
          message: 'Deductible Amount must be greater than 0.'
        });
      }
    }

    return issues;
  }

  // Percentage deductible
  // Only Deductible Percentage is required.
  // Min/Max are NOT required.
  if (ded === 'percentage') {
    const pctRaw = String(
      cover.deductiblePct ?? ''
    ).trim();

    if (studioGateBlank(pctRaw)) {
      issues.push({
        key: 'deductiblePct',
        section: 'deductible',
        selector: '[data-cover-validate="deductible-pct"]',
        message: 'Deductible Percentage is required.'
      });
    } else {
      const pct = Number(pctRaw);

      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        issues.push({
          key: 'deductiblePct',
          section: 'deductible',
          selector: '[data-cover-validate="deductible-pct"]',
          message: 'Deductible Percentage must be greater than 0 and no more than 100.'
        });
      }
    }
  }

  return issues;
}

  function isCoverageComplete(cover) {
    if (!cover) return false;
    if (coverValidationIssues(cover).length) return false;
    return cover.complete === true || cover.status === 'complete';
  }

 function applyCoverCompletionFlags(covers) {
  (covers || []).forEach(c => {
    const valid = coverValidationIssues(c).length === 0;

    if (valid) {
      // Cover has passed all validation rules.
      c.complete = true;
      c.status = 'complete';
    } else {
      // Cover has validation errors.
      c.complete = false;
      c.status = 'incomplete';
    }
  });

  return covers;
}

  function calculateCoverageCompletion(covers) {
    const list = Array.isArray(covers) ? covers : [];
    if (!list.length) return { pct: 0, complete: 0, total: 0 };
    applyCoverCompletionFlags(list);
    const complete = list.filter(c => c.complete).length;
    return { pct: Math.round((complete / list.length) * 100), complete, total: list.length };
  }

  function liveCoversForCompletion() {
    if (typeof COVERS !== 'undefined' && Array.isArray(COVERS) && routeName() === 'coverage-studio.html') return COVERS;
    return null;
  }

  function liveJurisdictionRows() {
    if (typeof JUR_ROWS !== 'undefined' && Array.isArray(JUR_ROWS) && routeName() === 'jurisdiction-studio.html') return JUR_ROWS;
    return null;
  }

  function jurisdictionRowIssues(row, index) {
    const issues = [];
    if (!row || !String(row.state || '').trim()) {
      issues.push({ index, field: 'state', key: `row:${index}:state` });
    }
    if (row && row.available !== true && row.available !== false) {
      issues.push({ index, field: 'available', key: `row:${index}:available` });
    }
    if (row && !String(row.admitted || '').trim()) {
      issues.push({ index, field: 'admitted', key: `row:${index}:admitted` });
    }
    if (row && !String(row.effectiveFrom || '').trim()) {
      issues.push({ index, field: 'effectiveFrom', key: `row:${index}:effectiveFrom` });
    }
    if (row && row.effectiveFrom && row.effectiveTo && row.effectiveTo < row.effectiveFrom) {
      issues.push({ index, field: 'effectiveTo', key: `row:${index}:effectiveTo`, message: 'Effective To must be on or after Effective From.' });
    }
    return issues;
  }

  function jurisdictionValidationIssues(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return [{ key: 'empty', message: 'Add at least one state before continuing.' }];
    return list.flatMap((row, i) => jurisdictionRowIssues(row, i));
  }

  function calculateJurisdictionCompletion(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return { pct: 0, complete: 0, total: 0 };
    const complete = list.filter(row => !jurisdictionRowIssues(row, 0).length).length;
    return { pct: Math.round((complete / list.length) * 100), complete, total: list.length };
  }

  function canLeaveJurisdiction() {
    const ctx = context();
    const rows = liveJurisdictionRows() || jurisdictionSetupFor(ctx.productId) || [];
    return jurisdictionValidationIssues(rows).length === 0;
  }

  function previousIncompleteStudio(studioId, productId, version) {
    const chain = enabledStudioChain(productId || context().productId);
    const idx = chain.findIndex(s => s.id === studioId);
    if (idx <= 0) return null;
    for (let i = 0; i < idx; i++) {
      const pct = calculateStudioCompletion(chain[i].id, productId, version).pct;
      if (pct < 100) return chain[i];
    }
    return null;
  }

  function calculateStudioCompletion(studioId, productId, version) {
    const ctx = context();
    const pid = productId || ctx.productId;
    const ver = version || ctx.version;
    const bundle = getProductBundle(pid, ver) || {};
    const product = productById(pid) || state.productDetails[pid];
    if (studioId === 'coverage') {
      return calculateCoverageCompletion(liveCoversForCompletion() || bundle.covers || []);
    }
    if (studioId === 'jurisdiction') {
      const rows = liveJurisdictionRows() || jurisdictionSetupFor(pid) || [];
      return calculateJurisdictionCompletion(rows);
    }
    const count = studioContentCount(pid, ver, studioId);
    if (studioId === 'eligibility' && typeof window.eligibilityStudioCompletion === 'function') {
      return window.eligibilityStudioCompletion();
    }
    return { pct: count > 0 ? 100 : 0, complete: count > 0 ? 1 : 0, total: Math.max(count, 1) };
  }

  function calculateOverallCompletion(productId, version) {
    const ids = enabledStudioChain(productId || context().productId).map(s => s.id);
    if (!ids.length) return 0;
    const sum = ids.reduce((n, id) => n + calculateStudioCompletion(id, productId, version).pct, 0);
    return Math.round(sum / ids.length);
  }

  function validateCoverage(coverageId) {
    const covers = liveCoversForCompletion() || getProductBundle(context().productId, context().version).covers || [];
    const cover = covers.find(c => c.id === coverageId);
    const issues = coverValidationIssues(cover);
    return { ok: !issues.length, issues, cover };
  }

  function validateSelectedCoverages() {
    const covers = liveCoversForCompletion() || getProductBundle(context().productId, context().version).covers || [];
    const results = covers.map(c => ({ id: c.id, name: c.name, ...validateCoverage(c.id) }));
    return { ok: results.length > 0 && results.every(r => r.ok), results, covers };
  }

  function validateCurrentStudio() {
    const page = routeName();
    const studioId = studioIdFromPage(page);
    if (page === 'coverage-studio.html' || studioId === 'coverage') {
      return validateSelectedCoverages();
    }
    if (page === 'jurisdiction-studio.html' || studioId === 'jurisdiction') {
      const rows = liveJurisdictionRows() || jurisdictionSetupFor(context().productId) || [];
      const issues = jurisdictionValidationIssues(rows);
      return { ok: !issues.length, issues };
    }
    if (!studioId) return { ok: true, results: [] };
    const { pct } = calculateStudioCompletion(studioId);
    return { ok: pct >= 100, results: [], pct };
  }

  function canLeaveCurrentStudio(destPage) {
    const here = routeName();
    const fromId = studioIdFromPage(here);
    if (!fromId) return true;
    const dest = String(destPage || '').split('?')[0].split('#')[0];
    const gated = new Set(STUDIO_NAV_CHAIN.map(s => s.file).concat(['product-detail.html']));
    if (!dest || dest === here || !gated.has(dest)) return true;
    const order = STUDIO_NAV_CHAIN.map(s => s.file);
    const fromIdx = order.indexOf(here);
    const toIdx = dest === 'product-detail.html' ? order.length : order.indexOf(dest);
    if (fromIdx < 0) return true;
    if (toIdx >= 0 && toIdx <= fromIdx) return true;
    return validateCurrentStudio().ok;
  }

  PS.studioGate = {
    coverValidationIssues,
    isCoverageComplete,
    applyCoverCompletionFlags,
    validateCoverage,
    validateSelectedCoverages,
    validateCurrentStudio,
    calculateCoverageCompletion,
    calculateStudioCompletion,
    calculateOverallCompletion,
    canLeaveCurrentStudio,
    canLeaveJurisdiction,
    previousIncompleteStudio,
    updateCompletionUI() {
      if (typeof window.updateCompletionUI === 'function') window.updateCompletionUI();
      refreshStudioNav();
      refreshTopbarProductStatus();
    }
  };

  function studioIdFromPage(page) {
    return PAGE_TO_STUDIO_ID[page || routeName()] || null;
  }

  function liveStudioCount(studioId) {
    const pageStudio = studioIdFromPage();
    if (pageStudio !== studioId) return null;
    if (PS.studioHub?.items) {
      try { return PS.studioHub.items().length; } catch (_) { /* ignore */ }
    }
    if (studioId === 'coverage' && typeof COVERS !== 'undefined') return COVERS.length;
    if (studioId === 'jurisdiction' && typeof JUR_ROWS !== 'undefined') return JUR_ROWS.length;
    if (studioId === 'questionnaire' && typeof GROUPS !== 'undefined') {
      return GROUPS.reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 0), 0);
    }
    if (studioId === 'eligibility' && typeof RULES !== 'undefined') return RULES.length;
    if (studioId === 'underwriting' && typeof RULES !== 'undefined') return RULES.length;
    if (studioId === 'distribution' && typeof CHANNELS !== 'undefined') return CHANNELS.length;
    if (studioId === 'document' && typeof DOCUMENTS !== 'undefined') return DOCUMENTS.length;
    if (studioId === 'rating' && typeof enabledRuleCount === 'function') return enabledRuleCount();
    return null;
  }

  function studioContentCount(productId, version, studioId) {
    const live = liveStudioCount(studioId);
    if (live !== null) return live;
    const bundle = getProductBundle(productId, version);
    const product = productById(productId) || state.productDetails[productId];
    switch (studioId) {
      case 'coverage':
        return (bundle.covers || []).length;
      case 'jurisdiction':
        return jurisdictionSetupFor(productId).length || (product?.jurisdictions || []).length;
      case 'questionnaire':
        return (bundle.questionGroups || []).reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 1), 0);
      case 'risk':
        return (bundle.risk || []).length;
      case 'eligibility':
        return (bundle.eligibility || []).length;
      case 'rating':
        return (bundle.rating || []).reduce((n, g) => n + (Array.isArray(g.items) ? g.items.length : 1), 0);
      case 'underwriting':
        return (bundle.underwriting || []).length;
      case 'distribution':
        return (bundle.channels || []).length;
      case 'document':
        return (bundle.documents || []).length;
      default:
        return 0;
    }
  }

  function enabledStudioChain(productId) {
    const enabled = new Set(enabledStudioIdsFor(productId));
    enabled.add('jurisdiction');
    enabled.add('risk');
    return STUDIO_NAV_CHAIN.filter(row => enabled.has(row.id));
  }

  function nextStudioInChain(productId, currentStudioId) {
    const chain = enabledStudioChain(productId);
    const idx = chain.findIndex(row => row.id === currentStudioId);
    if (idx < 0) return null;
    if (idx >= chain.length - 1) {
      return { id: 'product', file: 'product-detail.html', title: 'Product Hub', hash: '#studios' };
    }
    return chain[idx + 1];
  }

  function studioNavHref(productId, version, target) {
    const params = new URLSearchParams();
    params.set('product', productId);
    params.set('id', productId);
    if (version) params.set('version', version);
    const base = `${target.file}?${params.toString()}`;
    return target.hash ? `${base}${target.hash}` : base;
  }

  function ensureContextNavActions() {
    const bar = document.querySelector('.studio-context-bar');
    if (!bar) return null;
    let wrap = bar.querySelector('.ctx-nav-actions');
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'ctx-nav-actions';
    wrap.style.cssText = 'margin-left:auto;display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap';
    const back = bar.querySelector('#ctx-back-link');
    if (back?.parentElement && back.parentElement !== bar) {
      back.parentElement.replaceWith(wrap);
      wrap.appendChild(back);
    } else {
      if (back) wrap.appendChild(back);
      bar.appendChild(wrap);
    }
    return wrap;
  }

  function updateNextStudioLink(container, next, href) {
    if (!container) return;
    let btn = container.querySelector('[data-studio-next]');
    if (!next) {
      btn?.remove();
      return;
    }
    if (!btn) {
      btn = document.createElement('a');
      btn.dataset.studioNext = '1';
      btn.className = 'btn btn-primary btn-sm';
      const back = container.querySelector('#ctx-back-link, #back-product-btn, #savebar-back-btn');
      if (back) container.insertBefore(btn, back);
      else container.appendChild(btn);
    }
    btn.href = href;
    btn.textContent = next.id === 'product' ? 'Finish · Product Hub ›' : `Next: ${next.title} ›`;
  }

  function refreshStudioNav() {
    const ctx = context();
    if (!ctx.productId) return;
    const studioId = studioIdFromPage(ctx.page);
    if (!studioId) return;
    const count = studioContentCount(ctx.productId, ctx.version, studioId);
    const studioReady = typeof calculateStudioCompletion === 'function'
      ? calculateStudioCompletion(studioId, ctx.productId, ctx.version).pct >= 100
      : count > 0;
    const next = studioReady ? nextStudioInChain(ctx.productId, studioId) : null;
    const href = next ? studioNavHref(ctx.productId, ctx.version, next) : '';
    const containers = [];
    const ctxWrap = ensureContextNavActions();
    if (ctxWrap) containers.push(ctxWrap);
    const headerActions = document.getElementById('product-studio-actions');
    if (headerActions) containers.push(headerActions);
    document.querySelectorAll('.jur-savebar-actions').forEach(el => containers.push(el));
    containers.forEach(container => updateNextStudioLink(container, next, href));
  }

  function wizardSelectedCollections() {
    const selected = Object.entries(STUDIO_COLLECTION_MAP)
      .filter(([id]) => document.getElementById(id)?.checked)
      .map(([, name]) => name);
    if (selected.some(n => n === 'eligibilityRules' || n === 'ratingComponents' || n === 'underwritingRules')) {
      if (!selected.includes('testCases')) selected.push('testCases');
    }
    return selected;
  }

  function wizardSelectedStudioIds() {
    return Object.entries(STUDIO_WIZARD_IDS)
      .filter(([checkboxId]) => document.getElementById(checkboxId)?.checked)
      .map(([, studioId]) => studioId);
  }

  function normalizeEnabledStudios(product, detail) {
    const raw = product?.enabledStudios || detail?.enabledStudios || product?.selectedStudios || detail?.selectedStudios;
    if (!Array.isArray(raw)) return null;
    const ids = [...new Set(raw.map(v => STUDIO_WIZARD_IDS[v] || COLLECTION_TO_STUDIO[v] || v).filter(id => ALL_CONFIG_STUDIO_IDS.includes(id)))];
    return ids;
  }

  function enabledStudioIdsFor(productId) {
    const product = productById(productId);
    const detail = state.productDetails[productId];
    const ids = normalizeEnabledStudios(product, detail);
    if (ids) return ids;
    return ALL_CONFIG_STUDIO_IDS.slice();
  }

  function jurisdictionSetupFor(productId) {
    const product = productById(productId) || state.productDetails[productId];
    if (!product) return [];
    const states = Array.isArray(product.jurisdictions) ? product.jurisdictions : [];
    const existing = Array.isArray(product.jurisdictionSetup)
      ? product.jurisdictionSetup
      : (state.productDetails[productId]?.jurisdictionSetup || []);
    const byState = {};
    existing.forEach(row => { if (row?.state) byState[row.state] = row; });
    const from = isoDateValue(product.effectiveFrom);
    const to = isoDateValue(product.effectiveTo);
    return states.map(state => {
      const row = byState[state] || {};
      return {
        state,
        available: row.available !== false,
        admitted: row.admitted === 'Non-admitted' ? 'Non-admitted' : 'Admitted',
        cities: Array.isArray(row.cities) ? row.cities.slice() : [],
        restrictions: row.restrictions || '',
        effectiveFrom: isoDateValue(row.effectiveFrom) || from || '',
        effectiveTo: isoDateValue(row.effectiveTo) || to || ''
      };
    });
  }

  function saveJurisdictionSetup(productId, rows) {
    const product = productById(productId);
    const detail = ensureProductDetail(productId);
    const next = Array.isArray(rows) ? rows : [];
    if (product) {
      product.jurisdictionSetup = next;
      product.jurisdictions = next.map(r => r.state);
    }
    if (detail) {
      detail.jurisdictionSetup = next;
      detail.jurisdictions = next.map(r => r.state);
    }
    persistProduct(product || { id: productId }, detail);
    addAudit('MODIFIED', `Updated jurisdiction setup (${next.length} states)`, { productId });
    return next;
  }

  function enableStudio(productId, studioId) {
    if (!ALL_CONFIG_STUDIO_IDS.includes(studioId)) return enabledStudioIdsFor(productId);
    const product = productById(productId);
    const detail = ensureProductDetail(productId);
    const next = enabledStudioIdsFor(productId);
    if (!next.includes(studioId)) next.push(studioId);
    if (product) product.enabledStudios = next;
    if (detail) detail.enabledStudios = next;
    persistProduct(product || { id: productId }, detail);
    addAudit('MODIFIED', `Enabled ${studioId} studio`, { productId, studio: studioId });
    return next;
  }

  function productBuildStage(productId, version) {
    const product = productById(productId) || state.productDetails[productId];
    if (!product) return null;
    const status = String(product.status || 'draft').toLowerCase();
    if (status !== 'draft') return null;
    const bundle = getProductBundle(productId, version || product.version) || {};
    const enabled = new Set(enabledStudioIdsFor(productId) || []);
    enabled.add('jurisdiction');
    const qCount = (bundle.questionGroups || []).reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 1), 0);
    const ratingCount = (bundle.rating || []).reduce((n, g) => n + (Array.isArray(g.items) ? g.items.length : 1), 0);
    const studioHref = (file) => `${file}?product=${encodeURIComponent(productId)}&id=${encodeURIComponent(productId)}&version=${encodeURIComponent(version || product.version || '')}`;
    const stages = [
      {
        id: 'coverage', label: 'Coverages', href: studioHref('coverage-studio.html'),
        done: product.coversNeedPick && product.coversPicked !== true ? false : calculateCoverageCompletion(bundle.covers || []).pct >= 100
      },
      {
        id: 'jurisdiction', label: 'Jurisdiction', href: studioHref('jurisdiction-studio.html'),
        done: calculateJurisdictionCompletion(jurisdictionSetupFor(productId) || []).pct >= 100
      },
      {
        id: 'questionnaire', label: 'Questions', href: studioHref('questionnaire-studio.html'),
        skip: !enabled.has('questionnaire'), done: qCount > 0
      },
      {
        id: 'risk', label: 'Risk', href: studioHref('risk-studio.html'),
        skip: !enabled.has('risk'), done: (bundle.risk || []).length > 0
      },
      {
        id: 'eligibility', label: 'Eligibility', href: studioHref('eligibility-studio.html'),
        skip: !enabled.has('eligibility'), done: (bundle.eligibility || []).length > 0
      },
      {
        id: 'rating', label: 'Rating', href: studioHref('rating-studio.html'),
        skip: !enabled.has('rating'), done: ratingCount > 0
      },
      {
        id: 'underwriting', label: 'Underwriting', href: studioHref('underwriting-studio.html'),
        skip: !enabled.has('underwriting'), done: (bundle.underwriting || []).length > 0
      },
      {
        id: 'distribution', label: 'Distribution', href: studioHref('distribution-studio.html'),
        skip: !enabled.has('distribution'), done: (bundle.channels || []).length > 0
      },
      {
        id: 'document', label: 'Documents', href: studioHref('document-studio.html'),
        skip: !enabled.has('document'), done: (bundle.documents || []).length > 0
      }
    ].filter(s => !s.skip);
    const pending = stages.find(s => !s.done);
    const doneCount = stages.filter(s => s.done).length;
    if (!pending) {
      return {
        pending: false,
        id: 'ready',
        label: 'Ready for review',
        text: 'Ready for review',
        href: `product-detail.html?id=${encodeURIComponent(productId)}#studios`,
        done: doneCount,
        total: stages.length
      };
    }
    return {
      pending: true,
      id: pending.id,
      label: pending.label,
      text: pending.label,
      href: pending.href,
      done: doneCount,
      total: stages.length
    };
  }

  function shouldDeferCoverHydration(product) {
    if (!product || product.coversPicked === true) return false;
    if (product.coversNeedPick) return true;
    return Array.isArray(product.enabledStudios);
  }

  function coverPoolKey(productId, version) {
    return `${productId}::${version || 'active'}::coverPool`;
  }

  function findSourceCovers(sourceId, sourceVersion) {
    if (!sourceId) return [];
    const exact = sourceVersion ? state.collections[`${sourceId}::${sourceVersion}::covers`] : null;
    if (Array.isArray(exact) && exact.length) return clone(exact);
    const key = Object.keys(state.collections).find(k => k.startsWith(`${sourceId}::`) && k.endsWith('::covers') && Array.isArray(state.collections[k]) && state.collections[k].length);
    if (key) return clone(state.collections[key]);
    const seed = PS.studioSeeds?.[sourceId]?.covers;
    return Array.isArray(seed) ? clone(seed) : [];
  }

  function ensureCoverPool(productId, version) {
    const product = productById(productId);
    const ver = version || product?.version || context().version || 'active';
    const poolKey = coverPoolKey(productId, ver);
    const coverKey = `${productId}::${ver}::covers`;
    if (Array.isArray(state.collections[poolKey]) && state.collections[poolKey].length) return clone(state.collections[poolKey]);
    let pool = [];
    const storedCovers = state.collections[coverKey];
    if (shouldDeferCoverHydration(product) && Array.isArray(storedCovers) && storedCovers.length) {
      pool = clone(storedCovers);
      state.collections[coverKey] = [];
    } else {
      pool = findSourceCovers(product?.sourceProductId, product?.sourceVersion);
    }
    if (!pool.length && Array.isArray(storedCovers) && storedCovers.length && shouldDeferCoverHydration(product)) pool = clone(storedCovers);
    if (!pool.length && typeof COVERS !== 'undefined' && Array.isArray(COVERS) && COVERS.length) {
      pool = clone(COVERS);
    }
    if (!pool.length && PS.isTruckingProduct?.(product) && Array.isArray(PS.truckingDefaultCoverCatalog)) {
      pool = clone(PS.truckingDefaultCoverCatalog);
    }
    state.collections[poolKey] = clone(pool);
    saveState();
    return clone(pool);
  }

  function getCoverPool(productId, version) {
    const product = productById(productId);
    const ver = version || product?.version || context().version || 'active';
    const stored = state.collections[coverPoolKey(productId, ver)];
    if (Array.isArray(stored) && stored.length) return clone(stored);
    return ensureCoverPool(productId, ver);
  }

  function applySelectedCovers(productId, version, selectedIds) {
    const product = productById(productId);
    const ver = version || product?.version || context().version || 'active';
    const pool = getCoverPool(productId, ver);
    const picked = (selectedIds || []).map(id => pool.find(c => c.id === id)).filter(Boolean).map(c => clone(c));
    state.collections[`${productId}::${ver}::covers`] = picked;
    if (product) {
      product.coversPicked = true;
      product.coversNeedPick = false;
    }
    const detail = state.productDetails[productId];
    if (detail) {
      detail.coversPicked = true;
      detail.coversNeedPick = false;
    }
    saveState();
    persistProduct(product || { id: productId, version: ver }, detail);
    addAudit('MODIFIED', `Selected ${picked.length} predefined cover${picked.length === 1 ? '' : 's'}`, { productId, version: ver });
    return picked;
  }

  function copyCollections(sourceId, destId, destVersion, names) {
    if (!sourceId || !destId) return;
    const wanted = new Set(names && names.length ? names : Object.values(STUDIO_COLLECTION_MAP).concat('testCases'));
    Object.keys(state.collections).forEach(key => {
      if (!key.startsWith(`${sourceId}::`)) return;
      const colName = key.split('::').slice(2).join('::');
      if (!wanted.has(colName)) return;
      if (colName === 'covers') {
        const poolKey = `${destId}::${destVersion}::coverPool`;
        if (!Array.isArray(state.collections[poolKey]) || !state.collections[poolKey].length) {
          state.collections[poolKey] = clone(state.collections[key]);
        }
        return;
      }
      state.collections[`${destId}::${destVersion}::${colName}`] = clone(state.collections[key]);
    });
    const seeds = PS.studioSeeds?.[sourceId];
    if (seeds) {
      wanted.forEach(name => {
        const destKey = `${destId}::${destVersion}::${name}`;
        if (name === 'covers') {
          const poolKey = `${destId}::${destVersion}::coverPool`;
          if (Array.isArray(seeds[name]) && seeds[name].length && (!Array.isArray(state.collections[poolKey]) || !state.collections[poolKey].length)) {
            state.collections[poolKey] = clone(seeds[name]);
          }
          return;
        }
        if (Array.isArray(state.collections[destKey]) && state.collections[destKey].length) return;
        if (Array.isArray(seeds[name]) && seeds[name].length) state.collections[destKey] = clone(seeds[name]);
      });
    }
  }

  function refreshStudioSummaries(productId, version) {
    const bundle = getProductBundle(productId, version);
    const qCount = (bundle.questionGroups || []).reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 1), 0);
    const ratingCount = (bundle.rating || []).reduce((n, g) => n + (Array.isArray(g.items) ? g.items.length : 1), 0);
    const mark = (id, name, icon, href, count, noun, extra) => {
      const pct = calculateStudioCompletion(id, productId, version).pct;
      return {
        id, name, icon, href, pct,
        status: pct >= 100 ? 'complete' : (pct > 0 ? 'partial' : 'missing'),
        summary: count > 0 ? `${count} ${noun}${extra ? ` · ${extra}` : ''} · ${pct}%` : 'Not configured'
      };
    };
    const studios = [
      mark('coverage', 'Coverage Studio', 'umbrella', 'coverage-studio.html', (bundle.covers || []).length, 'covers'),
      mark('questionnaire', 'Questionnaire Studio', 'list-checks', 'questionnaire-studio.html', qCount, 'questions'),
      mark('risk', 'Risk Studio', 'warning', 'risk-studio.html', (bundle.risk || []).length, 'risk attributes'),
      mark('eligibility', 'Eligibility Studio', 'user-check', 'eligibility-studio.html', (bundle.eligibility || []).length, 'eligibility rules'),
      mark('rating', 'Rating & Pricing Studio', 'calculator', 'rating-studio.html', ratingCount, 'rating items'),
      mark('underwriting', 'Underwriting Rules Studio', 'shield-check', 'underwriting-studio.html', (bundle.underwriting || []).length, 'UW rules'),
      mark('distribution', 'Distribution Studio', 'tree-structure', 'distribution-studio.html', (bundle.channels || []).length, 'channels'),
      mark('document', 'Document Studio', 'file-text', 'document-studio.html', (bundle.documents || []).length, 'documents')
    ];
    const detail = state.productDetails[productId];
    if (!detail) return studios;
    const enabled = enabledStudioIdsFor(productId);
    detail.enabledStudios = enabled;
    detail.studios = studios;
    detail.checklist = studios.map(s => ({
      studio: s.name,
      status: s.status === 'complete' ? 'ok' : 'empty',
      note: s.summary
    }));
    const done = studios.filter(s => s.status === 'complete').length;
    detail.completion = calculateOverallCompletion(productId, version);
    return studios;
  }

  function createProductFromWizard() {
    const name = document.getElementById('w-name')?.value.trim();
    const family = document.getElementById('w-family')?.value;
    const lob = document.getElementById('w-lob')?.value;
    if (!name || !family) throw new Error('Name and product family are required.');
    if (!lob) throw new Error('Line of business is required.');
    if (state.products.some(p => String(p.name).trim().toLowerCase() === name.toLowerCase())) {
      throw new Error('A product with this name already exists. Choose a unique name.');
    }
    const dateError = effectiveDateRangeError('w-eff-from', 'w-eff-to');
    if (dateError) throw new Error(dateError);
    const usedVersions = allCatalogueVersionLabels();
    let version = document.getElementById('w-version')?.value.trim() || nextVersionLabel(usedVersions);
    if (usedVersions.includes(version)) version = nextVersionLabel(usedVersions);
    const newId = nextProductId();
    const sourceId = document.getElementById('w-clone-toggle')?.checked ? document.getElementById('w-clone-product')?.value : null;
    const sourceProduct = sourceId ? productById(sourceId) : null;
    const selectedCollections = wizardSelectedCollections();
    let code = document.getElementById('w-code')?.value.trim() || nextProductCode(family);
    if (state.products.some(p => String(p.code || '').trim().toUpperCase() === code.toUpperCase())) {
      code = nextProductCode(family);
    }
    const extras = (window.PS && PS.admin && typeof PS.admin.collectExtraFields === 'function')
      ? PS.admin.collectExtraFields(document.getElementById('active-modal-overlay'))
      : {};
    const product = {
      id: newId,
      name,
      family,
      version,
      status: 'draft',
      effectiveFrom: displayDate(document.getElementById('w-eff-from')?.value),
      effectiveTo: displayDate(document.getElementById('w-eff-to')?.value),
      owner: document.getElementById('w-owner')?.value || PS.data?.currentUser?.name || 'Anika Sharma',
      lastModifiedBy: document.getElementById('w-owner')?.value || PS.data?.currentUser?.name || 'Anika Sharma',
      segment: ['Personal Auto', 'Homeowners'].includes(lob) ? 'Personal Lines' : 'Commercial Lines',
      productType: lob,
      lineOfBusiness: document.getElementById('w-lob')?.value || '',
      businessType: document.getElementById('w-business-type')?.value || 'New',
      carrier: PS.data?.currentUser?.carrier || 'Veridex Insurance',
      mga: [],
      code,
      description: document.getElementById('w-desc')?.value,
      jurisdictions: Array.from(document.querySelectorAll('#wizard-step-1 .w-jurisdiction:checked')).map(x => x.value),
      lastModified: displayDate(today()),
      lastModifiedAt: now(),
      sortOrder: -Date.now(),
      sourceProductId: sourceId || null,
      sourceVersion: sourceProduct?.version || null,
      selectedStudios: selectedCollections,
      enabledStudios: wizardSelectedStudioIds(),
      coversNeedPick: true,
      coversPicked: false,
      pending: true,
      ...extras
    };
    const detail = productDetailFrom(product, null);
    detail.enabledStudios = product.enabledStudios;
    persistProduct(product, detail);
    const starterQuestions = defaultQuestionGroupsForProduct(product);
    if (starterQuestions.length) {
      state.collections[`${newId}::${version}::questionGroups`] = starterQuestions;
      saveState();
    }
    if (sourceId) {
      copyCollections(sourceId, newId, version, selectedCollections);
      if (!state.collections[coverPoolKey(newId, version)]?.length) {
        state.collections[coverPoolKey(newId, version)] = findSourceCovers(sourceId, sourceProduct?.version);
      }
    }
    refreshStudioSummaries(newId, version);
    persistProduct(product, state.productDetails[newId]);
    rememberContext({ productId: newId, version });
    refreshTopbarProductStatus();
    addAudit('CREATED', `Created product ${name} ${version}`, { productId: newId, version, sourceProductId: sourceId || undefined });
    addNotification('Product created', `${name} v${version} is saved in the catalogue as a Draft.`, `product-detail.html?id=${newId}&version=${encodeURIComponent(version)}`);
    return { id: newId, version, name, product, detail: state.productDetails[newId] };
  }

  function updateProductIdentity(id, patch) {
    const product = productById(id) || state.products.find(p => p.id === id);
    const detail = ensureProductDetail(id);
    if (!product && !detail) throw new Error('Product not found.');
    const name = String(patch.name || '').trim();
    if (!name) throw new Error('Product name is required.');
    if (state.products.some(p => p.id !== id && String(p.name).trim().toLowerCase() === name.toLowerCase())) {
      throw new Error('A product with this name already exists. Choose a unique name.');
    }
    const family = patch.family || product?.family || detail?.family || 'Trucking';
    const existingCode = String(product?.code || detail?.code || '').trim();
    const requestedCode = String(patch.code || '').trim();
    let code = existingCode || nextProductCode(family);
    if (requestedCode) {
      const dup = state.products.some(p => p.id !== id && String(p.code || '').trim().toUpperCase() === requestedCode.toUpperCase());
      if (dup) throw new Error('A product with this internal code already exists. Choose a unique code.');
      code = requestedCode;
    }
    const next = {
      name,
      family,
      owner: patch.owner || product?.owner || detail?.owner || 'Anika Sharma',
      description: patch.description != null ? patch.description : (product?.description || detail?.description || ''),
      segment: patch.segment || product?.segment || detail?.segment || 'Personal Lines',
      code,
      jurisdictions: Array.isArray(patch.jurisdictions) ? patch.jurisdictions : (product?.jurisdictions || detail?.jurisdictions || ['India']),
      lastModified: displayDate(today()),
      lastModifiedAt: now(),
      lastModifiedBy: PS.data?.currentUser?.name || 'Anika Sharma'
    };
    if (product) Object.assign(product, next);
    if (detail) Object.assign(detail, next);
    persistProduct(product || Object.assign({ id }, next), detail);
    if (typeof FULL_PRODUCTS !== 'undefined') {
      const row = FULL_PRODUCTS.find(p => p.id === id);
      if (row) Object.assign(row, next);
    }
    if (typeof PRODUCTS_DETAIL !== 'undefined' && PRODUCTS_DETAIL[id]) Object.assign(PRODUCTS_DETAIL[id], next);
    if (PS.data?.products) {
      const row = PS.data.products.find(p => p.id === id);
      if (row) Object.assign(row, next);
    }
    addAudit('MODIFIED', `Updated product ${name}`, { productId: id, version: product?.version || detail?.activeVersion });
    fetch(`/api/runtime/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => { /* local save already applied */ });
    return product || detail;
  }

  function ensureProductDetail(id) {
    if (!id) return null;
    if (state.productDetails[id]) return state.productDetails[id];
    const product = productById(id);
    if (!product) return null;
    state.productDetails[id] = productDetailFrom(product);
    saveState();
    return state.productDetails[id];
  }

  function cloneProduct(sourceId, { name, owner } = {}) {
    const source = productById(sourceId);
    if (!source) throw new Error('Source product was not found.');
    const label = nextVersionLabel([]);
    const newId = nextProductId();
    const product = Object.assign({}, clone(source), {
      id: newId,
      name: name || `${source.name} (Copy)`,
      version: label,
      status: 'draft',
      effectiveFrom: null,
      effectiveTo: null,
      owner: owner || source.owner || 'Anika Sharma',
      lastModified: displayDate(today()),
      lastModifiedAt: now(),
      sortOrder: -Date.now(),
      sourceProductId: sourceId,
      sourceVersion: source.version,
      pending: true
    });
    const sourceDetail = state.productDetails[sourceId] || null;
    const detail = productDetailFrom(product, sourceDetail);
    const prefix = `${sourceId}::`;
    Object.keys(state.collections).forEach(key => {
      if (!key.startsWith(prefix)) return;
      const parts = key.split('::');
      const newKey = `${newId}::${label}::${parts.slice(2).join('::')}`;
      state.collections[newKey] = clone(state.collections[key]);
    });
    persistProduct(product, detail);
    rememberContext({ productId: newId, version: label });
    applyCreatedProductToPage(product);
    refreshStudioSummaries(newId, label);
    addAudit('CREATED', `Cloned ${source.name} ${source.version} to ${product.name} ${label}`, { productId: newId, version: label, sourceProductId: sourceId });
    addNotification('Product clone created', `${product.name} v${label} is ready to configure.`, `product-detail.html?id=${newId}&version=${encodeURIComponent(label)}`);
    return { id: newId, version: label, name: product.name, product, detail };
  }

  function cloneVersion(productId, sourceVersion, label, from, to) {
    const detail = state.productDetails[productId];
    if (!detail) throw new Error('Product detail is unavailable. Open the product once and retry.');
    if (!label) label = nextVersionLabel((detail.versions || []).map(v => v.label));
    if (effectiveDatesOutOfOrder(from, to)) throw new Error(EFFECTIVE_DATE_ERROR);
    if (detail.versions.some(v => v.label === label)) label = nextVersionLabel(detail.versions.map(v => v.label));
    const version = { label, status:'draft', from:from ? displayDate(from) : null, to:to ? displayDate(to) : null, by:PS.data?.currentUser?.name || 'Anika Sharma', on:displayDate(today()), gates:0, sim:'Not Run' };
    detail.versions.unshift(version);
    detail.activeVersion = label;
    detail.status = 'draft';
    detail.notes = `Version ${label}: Cloned from ${sourceVersion}. Governance approvals were reset.`;
    state.productDetails[productId] = detail;
    const product = productById(productId);
    if (product) {
      product.version = label;
      product.status = 'draft';
      product.effectiveFrom = version.from;
      product.effectiveTo = version.to;
      product.lastModified = displayDate(today());
    }
    const prefix = `${productId}::${sourceVersion}::`;
    Object.keys(state.collections).filter(k => k.startsWith(prefix)).forEach(k => {
      state.collections[k.replace(prefix, `${productId}::${label}::`)] = clone(state.collections[k]);
    });
    saveState();
    addAudit('CREATED', `Created draft version ${label} cloned from ${sourceVersion}`, { productId, version:label, sourceVersion });
    addNotification('Draft version created', `${detail.name} v${label} is ready to edit.`, `product-detail.html?id=${productId}&version=${encodeURIComponent(label)}#studios`);
    return version;
  }

  function snapshotControls(entityId) {
    const root = document.getElementById('detail-panel') || document.getElementById('tab-content') || document.querySelector('main');
    if (!root) return;
    const values = Array.from(root.querySelectorAll('input, select, textarea')).map((el, index) => ({
      index, value:el.value, checked:'checked' in el ? el.checked : undefined, type:el.type
    }));
    const key = `${context().page}::${collectionKey('forms')}::${entityId || 'active'}`;
    state.formSnapshots[key] = values;
    saveState();
  }

  function restoreControls(entityId) {
    const root = document.getElementById('detail-panel') || document.getElementById('tab-content') || document.querySelector('main');
    if (!root) return;
    const key = `${context().page}::${collectionKey('forms')}::${entityId || 'active'}`;
    const values = state.formSnapshots[key];
    if (!values) return;
    const controls = Array.from(root.querySelectorAll('input, select, textarea'));
    values.forEach(item => {
      const el = controls[item.index];
      if (!el) return;
      if (item.checked !== undefined && (el.type === 'checkbox' || el.type === 'radio')) el.checked = item.checked;
      else el.value = item.value;
    });
  }

  PS.prototypeApp = {
    get state() { return state; },
    save:saveState,
    context,
    rememberContext,
    pageHasProductContext,
    libraryExtrasFor,
    addLibraryExtra,
    nextVersionLabel,
    uniqueVersionLabel,
    productById,
    versionStatus,
    canEditVersion,
    hydrateCollection,
    persistCollection,
    addAudit,
    addNotification,
    showResult,
    download,
    cloneVersion,
    snapshotControls,
    restoreControls,
    getProductBundle,
    buildFullProductJson,
    storeFullProductJson,
    exportFullProduct,
    viewFullProductJson,
    copyLastFullJson,
    customerViewHref,
    createProductFromWizard,
    ensureProductDetail,
    persistProduct,
    deleteProduct,
    updateProductIdentity,
    hydrateFromWorkspace,
    nextProductId,
    nextProductCode,
    getCoverPool,
    applySelectedCovers,
    shouldDeferCoverHydration,
    isNewStudioProduct,
    cloneProduct,
    enabledStudioIdsFor,
    enableStudio,
    ALL_CONFIG_STUDIO_IDS,
    jurisdictionSetupFor,
    saveJurisdictionSetup,
    refreshStudioNav,
    nextStudioInChain,
    studioContentCount,
    productBuildStage,
    calculateStudioCompletion,
    calculateCoverageCompletion,
    calculateJurisdictionCompletion,
    canLeaveJurisdiction,
    previousIncompleteStudio,
    calculateOverallCompletion,
    canLeaveCurrentStudio,
    riskAttributeFieldKey,
    refreshTopbarProductStatus,
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('ps-current-role');
      location.reload();
    }
  };

  /* Legacy pages used transient toasts as their only outcome. Keep their
     call sites working, but surface a durable, inspectable page result. */
  PS.actionResult = function (type, title, message) {
    const known = ['success','error','danger','warning','info'];
    if (!known.includes(String(type).toLowerCase())) {
      message = title;
      title = type;
      type = 'info';
    }
    showResult(title || 'Action completed', message || 'The browser prototype state was updated.', {
      type: ['error','danger','warning'].includes(String(type).toLowerCase()) ? 'error' : 'success'
    });
  };

  /* Seed and hydrate page-owned arrays before DOMContentLoaded renders them. */
  function mergeSeededProducts(seed) {
    if (!Array.isArray(seed) || !seed.length) return;
    const deleted = new Set(state.deletedProductIds || []);
    const keep = seed.filter(product => product?.id && !deleted.has(product.id));
    if (!state.products.length) {
      state.products = clone(keep);
      return;
    }
    keep.forEach(product => {
      if (!state.products.some(existing => existing.id === product.id)) state.products.push(clone(product));
    });
  }

  if (typeof FULL_PRODUCTS !== 'undefined') {
    mergeSeededProducts(FULL_PRODUCTS);
    FULL_PRODUCTS.splice(0, FULL_PRODUCTS.length, ...clone(state.products));
    Object.keys(VERSION_HISTORY || {}).forEach(id => {
      const detail = state.productDetails[id];
      if (detail?.versions) VERSION_HISTORY[id] = detail.versions.map(v => ({ version:v.label, status:v.status, from:v.from || '—', to:v.to || '—' }));
    });
    saveState();
  } else if (PS.data?.products) {
    mergeSeededProducts(PS.data.products.map((p, i) => Object.assign({ owner:p.lastModifiedBy || 'Anika Sharma', sortOrder:i }, clone(p))));
    saveState();
  }

  (function seedStudioCollections() {
    const seeds = PS.studioSeeds || {};
    Object.entries(seeds).forEach(([productId, seed]) => {
      const version = seed.version || 'active';
      const map = {
        covers: seed.covers,
        questionGroups: seed.questionGroups,
        ratingComponents: seed.ratingComponents,
        channels: seed.channels,
        documents: seed.documents,
        testCases: seed.testCases,
        eligibilityRules: seed.eligibilityRules,
        underwritingRules: seed.underwritingRules,
        riskAttributes: seed.riskAttributes
      };
      Object.entries(map).forEach(([name, data]) => {
        if (!data) return;
        const key = `${productId}::${version}::${name}`;
        if (!state.collections[key]) state.collections[key] = clone(data);
      });
    });
    if (!state.notifications.some(n => n.id === 'NTF-CT-015')) {
      state.notifications.unshift({
        id:'NTF-CT-015',
        title:'Commercial truck product published',
        detail:'Commercial Truck Comprehensive v2026.08 is live — 8 covers, HGV eligibility, and broker/TMS distribution.',
        href:'product-detail.html?id=PRD-015&version=2026.08',
        read:false,
        at:now()
      });
    }
    saveState();
  })();

  if (typeof PRODUCTS_DETAIL !== 'undefined') {
    Object.entries(PRODUCTS_DETAIL).forEach(([id, detail]) => {
      if (!state.productDetails[id]) state.productDetails[id] = clone(detail);
    });
    state.products.forEach(product => {
      if (!state.productDetails[product.id]) {
        const source = product.sourceProductId ? state.productDetails[product.sourceProductId] : null;
        state.productDetails[product.id] = productDetailFrom(product, source);
      } else if (!Array.isArray(state.productDetails[product.id].studios) || !Array.isArray(state.productDetails[product.id].checklist)) {
        state.productDetails[product.id] = productDetailFrom(product, state.productDetails[product.id]);
      }
    });
    Object.keys(PRODUCTS_DETAIL).forEach(k => delete PRODUCTS_DETAIL[k]);
    Object.assign(PRODUCTS_DETAIL, clone(state.productDetails));
    saveState();
  }

  if (typeof COVERS !== 'undefined' && pageHasProductContext()) hydrateCollection('covers', COVERS);
  if (typeof GROUPS !== 'undefined' && pageHasProductContext()) {
    hydrateCollection('questionGroups', GROUPS);
    if (routeName() === 'questionnaire-studio.html') {
      if (typeof bootstrapQuestionGroups === 'function') {
        const ctx = context();
        const p = productById(ctx.productId);
        const bundle = getProductBundle(ctx.productId, ctx.version);
        bootstrapQuestionGroups(bundle, p, true);
      } else if (typeof ensureDefaultQuestionGroups === 'function') {
        ensureDefaultQuestionGroups();
      }
      if (typeof renderTree === 'function') renderTree();
      if (typeof refreshQuestionMeta === 'function') refreshQuestionMeta();
      if (studioMode === 'edit' && typeof loadQuestion === 'function' && activeQId) loadQuestion(activeQId);
      else if (typeof paintStudio === 'function') paintStudio();
    }
  }
  if (typeof COMPONENTS !== 'undefined' && pageHasProductContext()) hydrateCollection('ratingComponents', COMPONENTS);
  if (typeof CHANNELS !== 'undefined' && pageHasProductContext()) hydrateCollection('channels', CHANNELS);
  if (typeof DOCUMENTS !== 'undefined' && pageHasProductContext()) hydrateCollection('documents', DOCUMENTS);
  if (typeof RISKS !== 'undefined' && pageHasProductContext()) hydrateCollection('riskAttributes', RISKS);
  if (typeof RULES !== 'undefined' && pageHasProductContext()) {
    const name = routeName().includes('eligibility') ? 'eligibilityRules' : 'underwritingRules';
    hydrateCollection(name, RULES);
    if (routeName().includes('underwriting-studio') && PS.uwRuleStore) {
      const ctx = context();
      if (ctx.productId) {
        const synced = PS.uwRuleStore.syncAll(ctx.productId, ctx.version, { silent: true });
        if (Array.isArray(synced) && synced.length) RULES.splice(0, RULES.length, ...synced);
      }
    }
    if (routeName() === 'eligibility-studio.html') {
      if (typeof normalizeEligibilityRule === 'function') {
        for (let i = 0; i < RULES.length; i += 1) RULES[i] = normalizeEligibilityRule(RULES[i]);
      }
      if (typeof renderRuleList === 'function') renderRuleList();
      if (PS.studioHub?.mode === 'edit' && typeof loadRule === 'function' && activeRuleId) loadRule(activeRuleId);
      else if (PS.studioHub?.cfg && PS.studioHub.paint) PS.studioHub.paint();
    }
  }
  if (typeof activeRiskId !== 'undefined' && typeof RISKS !== 'undefined' && !RISKS.some(r => r.id === activeRiskId)) activeRiskId = RISKS[0]?.id || activeRiskId;
  if (typeof activeChannelId !== 'undefined' && typeof CHANNELS !== 'undefined' && !CHANNELS.some(c => c.id === activeChannelId)) activeChannelId = CHANNELS[0]?.id || activeChannelId;
  if (typeof activeDocId !== 'undefined' && typeof DOCUMENTS !== 'undefined' && !DOCUMENTS.some(d => d.id === activeDocId)) activeDocId = DOCUMENTS[0]?.id || activeDocId;
  if (typeof activeRuleId !== 'undefined' && typeof RULES !== 'undefined' && !RULES.some(r => r.id === activeRuleId)) activeRuleId = RULES[0]?.id || activeRuleId;
  if (typeof activeQId !== 'undefined' && typeof GROUPS !== 'undefined') {
    const questions = GROUPS.flatMap(g => g.questions || []);
    if (questions.length && !questions.some(q => q.id === activeQId)) activeQId = questions[0].id;
  }
  if (typeof activeCompId !== 'undefined' && typeof COMPONENTS !== 'undefined') {
    const items = COMPONENTS.flatMap(g => g.items || []);
    if (items.length && !items.some(i => i.id === activeCompId)) activeCompId = items[0].id;
  }

  /* Dashboard commands and table data. */
  if (routeName() === 'index.html') {
    if (PS.data?.products) PS.data.products.splice(0, PS.data.products.length, ...clone(state.products));

    window.createProduct = function () {
      const name = document.getElementById('new-product-name')?.value.trim();
      const family = document.getElementById('new-product-family')?.value;
      if (!name || !family) return showResult('Product not created', 'Product name and family are required.', { type:'error' });
      const id = nextProductId();
      const version = nextVersionLabel([]);
      const product = { id, name, family, version, status:'draft', owner:PS.data.currentUser.name, lastModifiedBy:PS.data.currentUser.name, lastModified:displayDate(today()), lastModifiedAt:now(), effectiveFrom:null, effectiveTo:null, description:document.getElementById('new-product-desc')?.value.trim() || 'New product configuration.', pending:true };
      persistProduct(product, productDetailFrom(product));
      applyCreatedProductToPage(product);
      rememberContext({ productId:id, version });
      addAudit('CREATED', `Created ${name} as a Draft`, { productId:id, version:product.version });
      PS.closeModal();
      if (typeof renderProductsTable === 'function') renderProductsTable();
      showResult('Product created', `${name} (${id}) v${version} now appears at the top of the dashboard and catalogue.`, { href:`product-detail.html?id=${id}&version=${encodeURIComponent(version)}`, linkLabel:'View product' });
    };

    window.handleClone = function (id) {
      const source = productById(id);
      if (!source) return showResult('Clone not created', `Product ${id} was not found.`, { type:'error' });
      const newId = nextProductId();
      const label = nextVersionLabel([]);
      const product = Object.assign({}, clone(source), { id:newId, name:`${source.name} — Copy`, version:label, status:'draft', owner:PS.data.currentUser.name, effectiveFrom:null, effectiveTo:null, lastModified:displayDate(today()), sourceProductId:id });
      persistProduct(product, productDetailFrom(product, state.productDetails[id]));
      applyCreatedProductToPage(product);
      addAudit('CREATED', `Cloned ${source.name} to ${product.name}`, { productId:newId, version:label, sourceProductId:id });
      if (typeof renderProductsTable === 'function') renderProductsTable();
      showResult('Product clone created', `${product.name} (${newId}) is a Draft and is visible in the table.`, { href:`product-detail.html?id=${newId}&version=${encodeURIComponent(label)}`, linkLabel:'Open clone' });
    };

    window.executeRetire = function (id, version) {
      const input = document.getElementById('retire-confirm-input')?.value.trim();
      if (input !== version) return showResult('Version not retired', 'Type the exact version label to confirm.', { type:'error' });
      const product = productById(id);
      if (product) product.status = 'retired';
      const row = PS.data.products.find(p => p.id === id); if (row) row.status = 'retired';
      saveState(); addAudit('RETIRED', `Retired ${id} ${version}`, { productId:id, version });
      PS.closeModal(); if (typeof renderProductsTable === 'function') renderProductsTable();
      showResult('Version retired', `${id} v${version} now shows Retired.`);
    };
  }

  /* Shared shell */
  if (PS.nav) {
    PS.nav.switchRole = function (role) {
      state.currentRole = role;
      localStorage.setItem('ps-current-role', role);
      if (PS.data?.currentUser) PS.data.currentUser.role = role;
      saveState();
      location.reload();
    };
  }

  function riskAttributeFieldKey(risk) {
    if (!risk) return '';
    if (risk.fieldKey) return String(risk.fieldKey);
    if (risk.internalName) return String(risk.internalName);
    const code = String(risk.code || '').trim();
    if (code && /^[a-z][a-z0-9_]*$/i.test(code) && !/^RSK-/i.test(code)) return code;
    return String(risk.name || risk.label || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || String(risk.id || '').toLowerCase();
  }

  function refreshTopbarProductStatus() {
    const ctx = context();
    const product = ctx.productId ? productById(ctx.productId) : null;
    const topbarRight = document.querySelector('.topbar-right');
    if (!product || !topbarRight) {
      document.getElementById('topbar-product-status')?.remove();
      return;
    }
    const detail = state.productDetails[ctx.productId];
    const versionLabel = ctx.version || product.version || '';
    const ver = (detail?.versions || product.versions || []).find(v => v.label === versionLabel)
      || { status: product.status || 'draft' };
    const status = String(ver.status || product.status || 'draft').toLowerCase();
    if (status !== 'draft' && status !== 'review') {
      document.getElementById('topbar-product-status')?.remove();
      return;
    }
    let el = document.getElementById('topbar-product-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'topbar-product-status';
      el.className = 'topbar-product-status';
      topbarRight.insertBefore(el, topbarRight.firstChild);
    }
    const stage = status === 'draft' ? productBuildStage(ctx.productId, versionLabel) : null;
    const stageHtml = stage?.pending && stage.id !== 'ready'
      ? `<a class="topbar-draft-stage" href="${stage.href}" title="${stage.done} of ${stage.total} studios configured">Next: ${escapeHtml(stage.label)} ›</a>`
      : '';
    el.innerHTML = `
      <span class="badge badge-${status}" role="status">${PS.statusLabel(status)}</span>
      <span class="topbar-draft-note">${status === 'draft' ? 'Product configuration in progress' : 'Awaiting governance review'}</span>
      ${stageHtml}`;
  }

  function applyProductIdentity() {
    const ctx = context();
    const product = productById(ctx.productId) || state.productDetails[ctx.productId] || null;
    if (!product) return;
    rememberContext(ctx);
    const version = ctx.version || product.version || '';
    const page = routeName();
    const isStudio = /studio\.html$/.test(page) || page === 'governance.html';

    document.querySelectorAll('.sidenav a.nav-item').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (!/(studio|governance)\.html/.test(href)) return;
      const file = href.split('?')[0];
      if (/^(coverage|questionnaire|eligibility|rating|underwriting|distribution|document|jurisdiction)-studio\.html$/.test(file)) {
        link.setAttribute('href', file);
        return;
      }
      const params = new URLSearchParams();
      params.set('product', ctx.productId);
      if (version) params.set('version', version);
      link.setAttribute('href', `${file}?${params.toString()}`);
    });

    if (/^(coverage|questionnaire|eligibility|rating|underwriting|distribution|document|jurisdiction)-studio\.html$/.test(page) && !pageHasProductContext()) return;

    if (isStudio) {
      const studioTitle = document.querySelector('.page-title')?.textContent?.trim() || 'Studio';
      const detailHref = `product-detail.html?id=${encodeURIComponent(product.id)}&version=${encodeURIComponent(version)}`;
      const bcEl = document.querySelector('.topbar-breadcrumb');
      if (bcEl) {
        bcEl.innerHTML = [
          `<a href="index.html">Studio</a>`,
          `<span class="sep">›</span><a href="catalogue.html">Product Catalogue</a>`,
          `<span class="sep">›</span><a href="${detailHref}">${escapeHtml(product.name)}</a>`,
          version ? `<span class="sep">›</span><a href="${detailHref}">v${escapeHtml(version)}</a>` : '',
          `<span class="sep">›</span><span class="current">${escapeHtml(studioTitle)}</span>`
        ].join('');
      }

      const subtitle = document.querySelector('.page-subtitle');

      document.querySelectorAll('.studio-context-pill').forEach(el => {
        const icon = el.querySelector('svg')?.outerHTML || '';
        el.innerHTML = `${icon}${escapeHtml(product.id)} · v${escapeHtml(version || 'Draft')}`;
      });

      document.querySelectorAll('a[href*="product-detail.html"]').forEach(link => {
        if (/Back to Product|View Product/i.test(link.textContent)) {
          link.href = `${detailHref}${/Back to Product/i.test(link.textContent) ? '#studios' : ''}`;
        }
      });

      const actions = document.querySelector('.page-header-actions');
      const existingView = document.getElementById('view-product-btn') || document.getElementById('ps-view-product');
      if (existingView) {
        existingView.href = detailHref;
      } else if (actions) {
        const view = document.createElement('a');
        view.id = 'ps-view-product';
        view.className = 'btn btn-secondary';
        view.href = detailHref;
        view.textContent = 'View Product';
        actions.insertBefore(view, actions.firstChild);
      }
      const existingCustomer = document.getElementById('customer-view-btn') || document.getElementById('ps-customer-view');
      if (existingCustomer) {
        existingCustomer.href = customerViewHref(product.id, version);
      } else if (actions) {
        const customer = document.createElement('a');
        customer.id = 'ps-customer-view';
        customer.className = 'btn btn-primary';
        customer.href = customerViewHref(product.id, version);
        customer.textContent = 'Customer view';
        actions.insertBefore(customer, actions.firstChild);
      }

      const bundle = getProductBundle(product.id, version);
      const qCount = (bundle.questionGroups || []).reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 1), 0);
      const ratingCount = (bundle.rating || []).reduce((n, g) => n + (Array.isArray(g.items) ? g.items.length : 1), 0);
      const extras = {
        'coverage-studio.html': `${(bundle.covers || []).length} covers configured`,
        'questionnaire-studio.html': `${qCount} questions`,
        'eligibility-studio.html': `${(bundle.eligibility || []).length} eligibility rules`,
        'rating-studio.html': `${ratingCount} rating items`,
        'underwriting-studio.html': `${(bundle.underwriting || []).length} underwriting rules`,
        'distribution-studio.html': `${(bundle.channels || []).length} channels`,
        'document-studio.html': `${(bundle.documents || []).length} documents`,
        'simulation-studio.html': `${(bundle.testCases || []).length} test cases`
      };
      if (subtitle) {
        subtitle.textContent = `${product.name} · v${version || 'Draft'}${extras[page] ? ` · ${extras[page]}` : ''}`;
      }

      if (page !== 'glossary.html') {
        const root = document.querySelector('main') || document.body;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
          if (!node.nodeValue || !node.nodeValue.includes('Private Car Comprehensive')) return;
          if (node.parentElement?.closest('script,textarea,input')) return;
          node.nodeValue = node.nodeValue.split('Private Car Comprehensive').join(product.name);
        });
      }

      if (canEditVersion()) {
        document.querySelectorAll('.published-only-banner, .readonly-band').forEach(el => { el.style.display = 'none'; });
      }

      refreshStudioNav();
    }
    refreshTopbarProductStatus();
  }

  function wireShell() {
    PS.studioHelp?.mountAll?.();
    PS.studioHelp?.observeDynamicContent?.();

    if (PS.data?.currentUser && state.currentRole) {
      PS.data.currentUser.role = state.currentRole;
      document.querySelectorAll('.topbar-user-role, .role-badge').forEach(el => {
        if (el.closest('.topbar-user') || el.closest('.nav-footer')) el.textContent = state.currentRole;
      });
    }

    applyProductIdentity();

    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const q = globalSearch.value.trim().toLowerCase();
        if (!q) return;
        const matches = state.products.filter(p => `${p.id} ${p.name} ${p.family} ${p.version}`.toLowerCase().includes(q));
        PS.openModal(`
          <div class="modal-header"><h2 class="modal-title">Search Results</h2><button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button></div>
          <div class="modal-body">
            ${matches.length ? matches.map(p => `<a href="product-detail.html?id=${p.id}&version=${encodeURIComponent(p.version)}" style="display:block;padding:12px;border-bottom:1px solid var(--color-border);text-decoration:none"><strong>${escapeHtml(p.name)}</strong><div style="font-size:12px;color:var(--color-muted)">${p.id} · ${escapeHtml(p.family)} · v${escapeHtml(p.version)}</div></a>`).join('') : `<div class="empty-state"><div class="empty-title">No results</div><div class="empty-desc">No product, ID, family or version matched “${escapeHtml(q)}”.</div></div>`}
          </div><div class="modal-footer"><a class="btn btn-secondary" href="glossary.html?q=${encodeURIComponent(q)}">Search Glossary</a><button class="btn btn-primary" onclick="PS.closeModal()">Close</button></div>`);
      });
    }

    const notif = document.getElementById('notif-btn');
    if (notif) {
      notif.onclick = function () {
        state.notifications.forEach(n => { n.read = true; });
        saveState();
        PS.openModal(`
          <div class="modal-header"><h2 class="modal-title">Notifications</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
          <div class="modal-body">${state.notifications.length ? state.notifications.map(n => `<a href="${escapeHtml(n.href || '#')}" style="display:block;padding:12px 0;border-bottom:1px solid var(--color-border);text-decoration:none"><strong>${escapeHtml(n.title)}</strong><div style="font-size:13px;color:var(--color-muted);margin-top:3px">${escapeHtml(n.detail)}</div></a>`).join('') : '<div class="empty-state"><div class="empty-title">No notifications</div></div>'}</div>
          <div class="modal-footer"><button class="btn btn-primary" onclick="PS.closeModal()">Done</button></div>`);
        document.querySelector('.notif-dot')?.remove();
      };
    }
  }

  /* Catalogue commands */
  if (routeName() === 'catalogue.html') {
    window.executeClone = function (id) {
      const source = state.products.find(p => p.id === id);
      const name = document.getElementById('clone-name')?.value.trim();
      const label = nextVersionLabel([]);
      const owner = document.getElementById('clone-owner')?.value || source?.owner || 'Anika Sharma';
      if (!source || !name) {
        showResult('Clone not created', 'Product name is required.', { type:'error' });
        return;
      }
      const newId = nextProductId();
      const product = Object.assign({}, clone(source), {
        id:newId, name, version:label, status:'draft', effectiveFrom:null, effectiveTo:null,
        owner, lastModified:displayDate(today()), sortOrder:state.products.length,
        sourceProductId:id, sourceVersion:source.version
      });
      const sourceDetail = state.productDetails[id] || null;
      const detail = productDetailFrom(product, sourceDetail);
      persistProduct(product, detail);
      rememberContext({ productId:newId, version:label });
      applyCreatedProductToPage(product);
      addAudit('CREATED', `Cloned ${source.name} ${source.version} to ${name} ${label}`, { productId:newId, version:label, sourceProductId:id });
      addNotification('Product clone created', `${name} v${label} is ready to configure.`, `product-detail.html?id=${newId}&version=${encodeURIComponent(label)}`);
      PS.closeModal();
      renderAll();
      showResult('Product clone created', `${name} (${newId}) is now a persisted Draft and appears in the catalogue.`, { href:`product-detail.html?id=${newId}&version=${encodeURIComponent(label)}`, linkLabel:'View product' });
    };

    window.executeRetire = function (id, name) {
      const input = document.getElementById('retire-confirm')?.value.trim();
      if (input !== name) {
        showResult('Product not retired', 'Type the exact product name to confirm.', { type:'error' });
        return;
      }
      const product = productById(id);
      product.status = 'retired';
      const detail = state.productDetails[id];
      if (detail) {
        detail.status = 'retired';
        const version = detail.versions.find(v => v.label === product.version);
        if (version) version.status = 'retired';
      }
      saveState();
      const local = FULL_PRODUCTS.find(p => p.id === id);
      if (local) local.status = 'retired';
      addAudit('RETIRED', `Retired ${product.name} ${product.version}`, { productId:id, version:product.version });
      PS.closeModal();
      renderAll();
      showResult('Product retired', `${product.name} now shows Retired in the catalogue.`);
    };

    window.handleExport = function () {
      const rows = getFiltered();
      const csv = ['Product ID,Product Name,Family,Version,Status,Owner,Effective From,Effective To']
        .concat(rows.map(p => [p.id,p.name,p.family,p.version,p.status,p.owner,p.effectiveFrom||'',p.effectiveTo||''].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))).join('\n');
      download(`product-catalogue-${today()}.csv`, csv, 'text/csv;charset=utf-8');
    };

    window.completeImport = function () {
      const file = document.getElementById('import-file')?.files?.[0];
      if (!file) return showResult('Import not started', 'Choose a JSON or CSV file first.', { type:'error' });
      PS.closeModal();
      addAudit('IMPORTED', `Imported ${file.name}`);
      showResult('Import received', `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB) was accepted. Persisted catalogue products remain available after refresh.`);
    };
  }

  /* Product Detail commands */
  if (routeName() === 'product-detail.html') {
    window.saveOverview = function () {
      const p = currentProduct;
      const update = (id, key) => { const el = document.getElementById(id); if (el) p[key] = el.value.trim(); };
      update('w-name-edit','name'); update('w-family-edit','family'); update('w-segment-edit','segment');
      update('w-code-edit','code'); update('w-risktype-edit','riskType'); update('w-owner-edit','owner');
      update('w-notes-edit','notes');
      const desc = document.querySelector('#tab-content textarea');
      if (desc) p.description = desc.value.trim();
      const product = productById(p.id);
      if (product) Object.assign(product, { name:p.name, family:p.family, owner:p.owner, lastModified:displayDate(today()) });
      state.productDetails[p.id] = clone(p);
      saveState();
      addAudit('MODIFIED', `Updated product details for ${p.name}`, { productId:p.id, version:activeVersion });
      editMode = false; dirtyState = false;
      renderPage();
      showResult('Product details saved', `All edited fields for ${p.name} were stored in this browser and will survive refresh.`);
    };

    window.executeClone = function () {
      const from = document.getElementById('cv-from')?.value;
      const to = document.getElementById('cv-to')?.value;
      const dateError = effectiveDateRangeError('cv-from', 'cv-to');
      if (dateError) {
        showResult('Invalid effective dates', dateError, { type:'error' });
        return;
      }
      try {
        const version = cloneVersion(currentProduct.id, activeVersion, uniqueVersionLabel(currentProduct.id, document.getElementById('cv-label')?.value), from, to);
        currentProduct = state.productDetails[currentProduct.id];
        rememberContext({ productId:currentProduct.id, version:version.label });
        PS.closeModal();
        location.href = `product-detail.html?id=${currentProduct.id}&version=${encodeURIComponent(version.label)}#studios`;
      } catch (error) {
        showResult('Version not cloned', error.message, { type:'error' });
      }
    };

    window.createNewVersion = function () {
      const from = document.getElementById('nv-from')?.value;
      const to = document.getElementById('nv-to')?.value;
      const base = document.getElementById('nv-base')?.value || activeVersion;
      const dateError = effectiveDateRangeError('nv-from', 'nv-to');
      if (dateError) {
        showResult('Invalid effective dates', dateError, { type:'error' });
        return;
      }
      try {
        const version = cloneVersion(currentProduct.id, base, uniqueVersionLabel(currentProduct.id, document.getElementById('nv-label')?.value), from, to);
        rememberContext({ productId:currentProduct.id, version:version.label });
        PS.closeModal();
        location.href = `product-detail.html?id=${currentProduct.id}&version=${encodeURIComponent(version.label)}#overview`;
      } catch (error) {
        showResult('Version not created', error.message, { type:'error' });
      }
    };

    window.handleSubmitReview = function () {
      PS.openModal(`
        <div class="modal-header"><h2 class="modal-title">Submit for Review</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
        <div class="modal-body"><div class="callout callout-info"><div class="callout-body">This locks the selected Draft and places it in the Governance queue.</div></div><div class="form-group" style="margin-top:16px"><label class="form-label">Review summary</label><textarea id="ps-review-note" class="form-control" rows="4" placeholder="Describe the changes for reviewers"></textarea></div></div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button class="btn btn-primary" id="ps-confirm-submit">Submit for Review</button></div>`);
      document.getElementById('ps-confirm-submit').onclick = () => {
        const note = document.getElementById('ps-review-note').value.trim();
        if (!note) return showResult('Submission incomplete', 'Enter a review summary.', { type:'error' });
        const detail = state.productDetails[currentProduct.id];
        const version = detail.versions.find(v => v.label === activeVersion);
        version.status = 'review'; detail.status = 'review';
        const product = productById(currentProduct.id); if (product) product.status = 'review';
        detail.governance[0] = { gate:'Product Owner', approver:PS.data.currentUser.name, action:'Approved', date:displayDate(today()), comment:note };
        saveState(); addAudit('SUBMITTED', `Submitted ${detail.name} ${activeVersion} for review`, { productId:detail.id, version:activeVersion, note });
        addNotification('Review submitted', `${detail.name} v${activeVersion} is now In Review.`, `product-detail.html?id=${detail.id}#versions`);
        storeFullProductJson(detail.id, activeVersion);
        PS.closeModal(); location.reload();
      };
    };

    window.schedulePublication = function () {
      const dt = document.getElementById('pub-date')?.value;
      if (!dt) return showResult('Publication not scheduled', 'Choose a publication date and time.', { type:'error' });
      state.lifecycle[`${currentProduct.id}::${activeVersion}`] = { status:'scheduled', at:dt };
      saveState(); addAudit('SCHEDULED', `Scheduled ${currentProduct.name} ${activeVersion} for ${dt}`);
      showResult('Publication scheduled', `${currentProduct.name} v${activeVersion} will publish at ${new Date(dt).toLocaleString()}.`);
    };
    window.publishNow = function () {
      const detail = state.productDetails[currentProduct.id];
      const version = detail.versions.find(v => v.label === activeVersion);
      version.status = 'published'; detail.status = 'published';
      const product = productById(currentProduct.id); if (product) product.status = 'published';
      saveState(); addAudit('PUBLISHED', `Published ${detail.name} ${activeVersion}`);
      addNotification('Product published', `${detail.name} v${activeVersion} is live in the prototype.`, `integration-monitor.html?product=${detail.id}`);
      storeFullProductJson(detail.id, activeVersion);
      location.reload();
    };

    window.executeApprove = function (index) {
      const comment = document.getElementById('approve-comment')?.value.trim() || 'Approved.';
      const gate = currentProduct.governance[index];
      Object.assign(gate, { action:'Approved', approver:PS.data.currentUser.name, date:displayDate(today()), comment });
      const allApproved = currentProduct.governance.every(item => item.action === 'Approved');
      const version = currentProduct.versions.find(v => v.label === activeVersion);
      if (allApproved && version) { version.status = 'approved'; currentProduct.status = 'approved'; }
      state.productDetails[currentProduct.id] = clone(currentProduct);
      const product = productById(currentProduct.id); if (product && allApproved) product.status = 'approved';
      saveState(); addAudit('APPROVED', `${gate.gate} gate approved: ${comment}`, { productId:currentProduct.id, version:activeVersion, gate:gate.gate }); PS.closeModal();
      renderGovernance(document.getElementById('tab-content'));
      showResult('Governance gate approved', `${gate.gate} is approved${allApproved ? '; the version is now Approved and ready to publish' : ''}.`);
    };
    window.rejectGate = function (index) {
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">Reject ${escapeHtml(currentProduct.governance[index].gate)} Gate</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div><div class="modal-body"><label class="form-label">Rejection reason</label><textarea id="ps-reject-reason" class="form-control" rows="4" placeholder="Required"></textarea></div><div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button class="btn btn-danger" onclick="executeRejectGate(${index})">Reject Gate</button></div>`);
    };
    window.executeRejectGate = function (index) {
      const reason = document.getElementById('ps-reject-reason')?.value.trim();
      if (!reason) return showResult('Gate not rejected', 'Enter a rejection reason.', { type:'error' });
      const gate = currentProduct.governance[index]; Object.assign(gate, { action:'Rejected', approver:PS.data.currentUser.name, date:displayDate(today()), comment:reason });
      const version = currentProduct.versions.find(v => v.label === activeVersion); if (version) version.status = 'draft'; currentProduct.status = 'draft';
      state.productDetails[currentProduct.id] = clone(currentProduct); const product = productById(currentProduct.id); if (product) product.status = 'draft';
      saveState(); addAudit('REJECTED', `${gate.gate} gate rejected: ${reason}`, { productId:currentProduct.id, version:activeVersion, gate:gate.gate }); PS.closeModal(); renderGovernance(document.getElementById('tab-content'));
      showResult('Governance gate rejected', `${gate.gate} returned the version to Draft. Reason: ${reason}`);
    };
    window.commentGate = function (index) {
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">Comment on ${escapeHtml(currentProduct.governance[index].gate)}</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div><div class="modal-body"><textarea id="ps-gate-comment" class="form-control" rows="4" placeholder="Write a review comment"></textarea></div><div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveGateComment(${index})">Add Comment</button></div>`);
    };
    window.saveGateComment = function (index) {
      const comment = document.getElementById('ps-gate-comment')?.value.trim(); if (!comment) return showResult('Comment not added', 'Enter a comment.', { type:'error' });
      currentProduct.governance[index].comment = comment; state.productDetails[currentProduct.id] = clone(currentProduct); saveState(); addAudit('COMMENTED', `${currentProduct.governance[index].gate}: ${comment}`, { productId:currentProduct.id, version:activeVersion }); PS.closeModal(); renderGovernance(document.getElementById('tab-content'));
      showResult('Governance comment added', comment);
    };
  }

  /* Studio persistence and create actions */
  function installEditableRof() {
    if (!canEditVersion() || typeof rof === 'undefined') return;
    window.rof = function (label, value, mono) {
      return `<div class="form-group"><label class="form-label">${escapeHtml(label)}</label><input class="form-control ps-persist-field" type="text" value="${escapeHtml(value || '')}" ${mono ? 'style="font-family:IBM Plex Mono,monospace"' : ''}></div>`;
    };
  }
  installEditableRof();

  if (typeof productStatus !== 'undefined') productStatus = canEditVersion() ? 'draft' : 'published';

  if (routeName() === 'coverage-studio.html') {
  
    window.executeAddCover = function () {
      try {
        const name = document.getElementById('ac-name')?.value.trim();
        const type = (typeof coverTypeForName === 'function' ? coverTypeForName(name) : '') || 'Cover';
        if (!name) {
          return showResult('Cover not added', 'Enter a cover name.', { type:'error' });
        }
        if (COVERS.some(c => String(c.name || '').trim().toLowerCase() === name.trim().toLowerCase())) {
          return showResult('Cover not added', `A cover named "${name}" already exists on this product.`, { type:'error' });
        }
        if (typeof COVERS === 'undefined') {
          PS.closeModal();
          return showResult('Cover not added', 'Coverage Studio did not finish loading. Refresh and try again.', { type:'error' });
        }
        const availability = document.getElementById('ac-avail')?.value || 'optional';
        const token = String(type || name).replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'COV';
        let n = COVERS.length + 1;
        let code = typeof nextAddCoverCode === 'function'
          ? nextAddCoverCode(name, type)
          : `${token}-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`;
        const used = new Set(COVERS.map(c => String(c.code || '').toLowerCase()).filter(Boolean));
        while (used.has(code.toLowerCase())) { n += 1; code = `${token}-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`; }
        let id = `COV-${Date.now().toString(36)}`;
        while (COVERS.some(c => c.id === id)) id = `COV-${Date.now().toString(36)}${n++}`;
        const cover = {
          id, name, code, type, availability,
          description: document.getElementById('ac-desc')?.value || '',
          status: 'incomplete', complete: false,
          defaultSelected: availability === 'mandatory' || availability === 'default',
          basisOfCoverage: 'Market Value', sumInsured: '', maxSingleLimit: '', subLimit: '',
          deductibleType: 'none', deductibleAmount: '', deductiblePct: '', deductiblePctOf: 'Claim Amount', minDeductible: '', maxDeductible: '',
          copay: '0', waitingPeriod: 'None', annualAggregate: false,
          coverVersion: typeof coverVersionLabel === 'function' ? coverVersionLabel() : (context().version ? `v${String(context().version).replace(/^v/i,'')}` : ''),
          mutualExclusions: [], conditionalOn: '', dependencies: [], constraints: [], wordingDocs: [],
          lossBasis: 'Per Occurrence', reinstatement: 'Automatic (full limit)', benefitBasis: 'Indemnity',
          claimsNotifPeriod: '14', claimsNotifUnit: 'days'
        };
        PS.closeModal();
        COVERS.push(cover);
        activeCoverId = id;
        persistCollection('covers', COVERS);
        if (typeof openCoverEditor === 'function') openCoverEditor(id);
        else {
          if (typeof renderCoverTable === 'function') renderCoverTable();
          if (typeof renderCoverList === 'function') renderCoverList();
          if (typeof loadCover === 'function') loadCover(id);
        }
        showResult('Cover added', `${name} now appears in this product's cover table and is ready to configure.`);
      } catch (error) {
        try { PS.closeModal(); } catch (_) {}
        showResult('Cover not added', error.message || 'Could not add this cover.', { type:'error' });
      }
    };
    const legacyReorderModal = window.openReorderModal;
    window.openReorderModal = function () {
      legacyReorderModal();
      document.querySelectorAll('#reorder-list > div').forEach((row, index) => {
        row.dataset.coverId = COVERS[index]?.id || '';
        const controls = document.createElement('span'); controls.style.cssText = 'display:flex;gap:4px';
        controls.innerHTML = '<button class="btn btn-icon btn-sm" type="button" aria-label="Move up">↑</button><button class="btn btn-icon btn-sm" type="button" aria-label="Move down">↓</button>';
        const [up, down] = controls.querySelectorAll('button');
        up.onclick = () => { const prev = row.previousElementSibling; if (prev) row.parentElement.insertBefore(row, prev); };
        down.onclick = () => { const next = row.nextElementSibling; if (next) row.parentElement.insertBefore(next, row); };
        row.appendChild(controls);
      });
    };
    window.saveCoverOrder = function () {
      const ids = Array.from(document.querySelectorAll('#reorder-list > div')).map(row => row.dataset.coverId);
      COVERS.splice(0, COVERS.length, ...ids.map(id => COVERS.find(c => c.id === id)).filter(Boolean));
      persistCollection('covers', COVERS); PS.closeModal();
      if (typeof renderCoverTable === 'function') renderCoverTable();
      renderCoverList();
      showResult('Cover order saved', 'The cover list and persisted configuration now use the selected order.');
    };
    window.importSelectedLibraryItems = function () {
      if (typeof window.importCoverageLibrarySelection === 'function') {
        return window.importCoverageLibrarySelection();
      }
      const rows = Array.from(document.querySelectorAll('#active-modal-overlay tbody tr')).filter(row => row.querySelector('input[type="checkbox"]:checked'));
      if (!rows.length) return showResult('No covers imported', 'Select at least one library cover.', { type:'error' });
      rows.forEach((row, index) => {
        const base = clone(COVERS[0] || {}); Object.assign(base, { id:`COV-LIB-${String(Date.now() + index).slice(-5)}`, name:row.cells[1].innerText.trim(), type:row.cells[2].innerText.trim(), availability:'optional', status:'incomplete' }); COVERS.push(base);
      });
      persistCollection('covers', COVERS); PS.closeModal();
      if (typeof renderCoverTable === 'function') renderCoverTable();
      renderCoverList();
      showResult('Covers imported', `${rows.length} selected library cover${rows.length === 1 ? '' : 's'} now appear as Draft configuration.`);
    };
  }

  if (routeName() === 'questionnaire-studio.html') {
    window.executeAddQuestion = function () {
      if (typeof window.createQuestionFromAddForm === 'function') {
        return window.createQuestionFromAddForm();
      }
      const label = document.getElementById('aq-label')?.value.trim();
      const type = document.getElementById('aq-type')?.value;
      const groupId = document.getElementById('aq-group')?.value;
      const bindPhase = document.getElementById('aq-bind-phase')?.value || 'pre-bind';
      if (!label || !type) return showResult('Question not added', 'Question label and type are required.', { type:'error' });
      let group = GROUPS.find(g => g.id === groupId);
      if (!group) {
        group = { id: `grp-${Date.now().toString(36)}`, label: 'General', name: 'General', open: false, bindPhase, questions: [] };
        GROUPS.push(group);
      }
      group.questions = group.questions || [];
      const id = `QST-${String(Date.now()).slice(-6)}`;
      const slug = String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'question';
      group.questions.push({
        id, label, type, fieldType: type,
        internalName: slug,
        required: Boolean(document.getElementById('aq-required')?.checked),
        helpText: document.getElementById('aq-help')?.value.trim() || '',
        channels: ['web', 'mobile', 'agent', 'api'],
        coverIds: typeof collectSelectedCoverIds === 'function' ? collectSelectedCoverIds('.aq-cover-cb:checked') : Array.from(document.querySelectorAll('.aq-cover-cb:checked')).map(cb => cb.value),
        validations: [], conditions: [], evidence: [], options: []
      });
      persistCollection('questionGroups', GROUPS); PS.closeModal();
      if (typeof openQuestionEditor === 'function') openQuestionEditor(id);
      else { renderTree(); loadQuestion(id); }
      if (typeof renderQuestionTable === 'function') renderQuestionTable();
      showResult('Question added', `${label} now appears in this product's question table.`);
    };
    window.createQuestionGroup = function () {
      const label = document.getElementById('ag-name')?.value.trim();
      const bindPhase = document.getElementById('ag-bind-phase')?.value || 'pre-bind';
      if (!label) return showResult('Group not created', 'Group name is required.', { type:'error' });
      GROUPS.push({ id:`grp-${Date.now()}`, label, name: label, open: false, bindPhase, questions:[] });
      persistCollection('questionGroups', GROUPS); PS.closeModal();
      if (typeof renderQuestionTable === 'function') renderQuestionTable();
      renderTree();
      showResult('Question group created', `${label} is now available in the question tree.`);
    };
    window.importSelectedLibraryItems = function () {
      if (document.querySelector('.lib-q-cb')) {
        const catalog = typeof catalogQuestionsForPicker === 'function' ? catalogQuestionsForPicker() : [];
        const ids = Array.from(document.querySelectorAll('.lib-q-cb:checked')).map(cb => cb.value);
        const items = catalog.filter(c => ids.includes(String(c.id)));
        if (!items.length) return showResult('No questions imported', 'Select at least one library question.', { type:'error' });
        const added = typeof addCatalogQuestionsToProduct === 'function' ? addCatalogQuestionsToProduct(items) : 0;
        persistCollection('questionGroups', GROUPS);
        PS.closeModal();
        if (typeof paintStudio === 'function') paintStudio();
        else {
          if (typeof renderQuestionTable === 'function') renderQuestionTable();
          renderTree();
        }
        return showResult(
          added ? 'Questions imported' : 'Already on product',
          added
            ? `${added} selected question${added === 1 ? '' : 's'} now appear on this product.`
            : 'Those questions are already on this product.'
        );
      }
      const rows = Array.from(document.querySelectorAll('#active-modal-overlay tbody tr')).filter(row => row.querySelector('input[type="checkbox"]:checked'));
      if (!rows.length) return showResult('No questions imported', 'Select at least one library question.', { type:'error' });
      let group = GROUPS[0];
      if (!group) {
        group = { id: `grp-${Date.now()}`, label: 'General', name: 'General', questions: [] };
        GROUPS.push(group);
      }
      group.questions = group.questions || [];
      rows.forEach(row => group.questions.push({ id:`QST-LIB-${String(Date.now() + Math.random()).replace(/\D/g,'').slice(-6)}`, label:row.cells[1].innerText.trim(), internalName:row.cells[2].innerText.trim(), type:row.cells[3].innerText.trim(), required:false, warning:false }));
      persistCollection('questionGroups', GROUPS); PS.closeModal();
      if (typeof renderQuestionTable === 'function') renderQuestionTable();
      renderTree();
      showResult('Questions imported', `${rows.length} selected question${rows.length === 1 ? '' : 's'} now appear in ${group.label}.`);
    };
  }

  if (routeName() === 'eligibility-studio.html') {
    /* Eligibility page owns createEligibilityRule (condition validation). */
  }

  if (routeName() === 'rating-studio.html') {
    window.executeAddComponent = function (type) {
      const name = document.getElementById('new-comp-name')?.value.trim() || type;
      const id = document.getElementById('new-comp-id')?.value.trim();
      if (!id || COMPONENTS.some(c => c.id === id)) return showResult('Component not added', 'Use a unique component ID.', { type:'error' });
      const base = clone(COMPONENTS.find(c => c.type === 'base') || COMPONENTS[0] || {});
      Object.assign(base, { id, name, type:type.toLowerCase().replace(/\s.*/, ''), amount:document.getElementById('new-comp-val')?.value || '0', configured:true });
      if (COMPONENTS[0] && Array.isArray(COMPONENTS[0].items)) {
        const groupName = { base:'BASE PREMIUM', factor:'RISK FACTORS', loading:'LOADINGS', discount:'DISCOUNTS', fee:'FEES', tax:'TAXES' }[base.type] || 'OTHER';
        let group = COMPONENTS.find(g => g.group === groupName);
        if (!group) { group = { group: groupName, items: [] }; COMPONENTS.push(group); }
        group.items.push(base);
      } else {
        COMPONENTS.push(base);
      }
      persistCollection('ratingComponents', COMPONENTS); PS.closeModal();
      if (window.PS.studioHub) PS.studioHub.open(id);
      else { renderTree(); loadComponent(id); }
      showResult('Rating component added', `${name} (${id}) now appears in this product's component table.`);
    };
  }

  if (routeName() === 'underwriting-studio.html') {
    window.executeAddUWRule = window.executeAddUWRule || function () {
      PS.actionResult?.('error', 'Rule not created', 'Underwriting rule form is not ready.', { type: 'error' });
    };
  }

  if (routeName() === 'distribution-studio.html') {
    window.createDistributionChannel = function () {
      const modal = document.getElementById('active-modal-overlay');
      const name = modal?.querySelector('input[type="text"]')?.value.trim();
      if (!name) return showResult('Channel not added', 'Channel name is required.', { type:'error' });
      const base = clone(CHANNELS[0] || {});
      const id = `CHAN-${String(Date.now()).slice(-5)}`;
      Object.assign(base, { id, name, status:'active', comm:'0%', territories:[], rules:[], intermediaries:[] });
      CHANNELS.push(base); persistCollection('channels', CHANNELS); PS.closeModal();
      if (window.PS.studioHub) PS.studioHub.open(id);
      else { renderSidebar(); loadChannel(id); }
      showResult('Distribution channel added', `${name} now appears in the channel list.`);
    };
  }

  if (routeName() === 'simulation-studio.html') {
    window.saveSimulationTest = function () {
      const modal = document.getElementById('active-modal-overlay');
      const inputs = modal ? Array.from(modal.querySelectorAll('input,select')) : [];
      const name = inputs[0]?.value.trim();
      if (!name) return showResult('Test case not saved', 'Test case name is required.', { type:'error' });
      const test = { id:Math.max(0, ...TESTS.map(t => Number(t.id) || 0)) + 1, name, cat:inputs[1]?.value || 'Rating', exp:`${inputs[2]?.value || 'Eligible'} / ${inputs[3]?.value || 'Accept'}`, res:'not-run', pExp:inputs[4]?.value || 'N/A', pAct:'—', v:'—' };
      TESTS.push(test); persistCollection('testCases', TESTS); PS.closeModal(); renderTests();
      showResult('Test case saved', `${name} is now in the suite and marked Not Run.`);
    };
    const renderIndividual = window.runIndividual;
    window.runIndividual = function () {
      renderIndividual();
      const run = { id:`RUN-${Date.now()}`, type:'individual', status:'passed', result:{ eligibility:'Eligible', underwriting:'Accept', premium:394.04 }, at:now(), context:context() };
      state.simulationRuns.unshift(run); saveState(); addAudit('SIMULATED', 'Individual simulation passed with premium $394.04');
      showResult('Simulation completed', 'Eligibility: Eligible · UW: Accept · Payable premium: $394.04. The full rule trace is visible below.');
    };
    window.runAllTests = function () {
      const fill = document.getElementById('main-progress');
      if (fill) { fill.style.width = '100%'; fill.classList.remove('running'); }
      const bundle = getProductBundle(context().productId, context().version);
      const parseMoney = v => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
      let passed = 0;
      TESTS.forEach(t => {
        const exp = String(t.exp || t.cat || '').toLowerCase();
        const name = String(t.name || '').toLowerCase();
        if (/ineligible|hard block/.test(exp) || /ineligible|age 23|no hgv|no tracker/.test(name)) {
          const hit = (bundle.eligibility || []).find(r => /ineligible|hard|age|licence|license|track/i.test(JSON.stringify(r)));
          t.res = hit ? 'pass' : 'fail';
          t.pAct = 'N/A';
          t.v = hit ? '0.0%' : '—';
        } else if (/decline/.test(exp) || /explosives|decline/.test(name)) {
          const hit = (bundle.underwriting || []).find(r => /decline/i.test(JSON.stringify(r)));
          t.res = hit ? 'pass' : 'fail';
          t.pAct = t.pExp || 'N/A';
          t.v = hit ? '0.0%' : '—';
        } else if (/refer/.test(exp) || /refer/.test(name)) {
          const hit = (bundle.underwriting || []).find(r => /refer/i.test(JSON.stringify(r)));
          t.res = hit ? 'pass' : 'fail';
          t.pAct = t.pExp || 'N/A';
          t.v = hit ? '0.0%' : '—';
        } else {
          const expected = parseMoney(t.pExp);
          const actual = Number(bundle.basePremium) || 0;
          const delta = expected ? Math.abs(actual - expected) / expected : 0;
          t.pAct = `$${actual.toFixed(2)}`;
          t.v = expected ? `${(delta * 100).toFixed(1)}%` : '0.0%';
          t.res = !expected || delta <= 0.15 ? 'pass' : 'fail';
        }
        if (t.res === 'pass') passed += 1;
      });
      persistCollection('testCases', TESTS); renderTests();
      const status = passed === TESTS.length ? 'passed' : 'failed';
      state.simulationRuns.unshift({ id:`RUN-${Date.now()}`, type:'suite', status, total:TESTS.length, passed, at:now(), context:context() }); saveState();
      showResult(status === 'passed' ? 'Test suite completed' : 'Test suite finished with failures', `${passed}/${TESTS.length} test cases passed against the current product configuration.`, { type: status === 'passed' ? 'success' : 'error' });
    };
    window.__evaluateSimulationSuite = window.runAllTests;
  }

  if (routeName() === 'integration-monitor.html') {
    window.saveWebhook = function () {
      const name = document.getElementById('wh-name')?.value.trim();
      const url = document.getElementById('wh-url')?.value.trim();
      if (!name || !/^https?:\/\//i.test(url || '')) return showResult('Webhook not saved', 'Enter a name and a valid HTTP(S) target URL.', { type:'error' });
      const modal = document.getElementById('active-modal-overlay');
      const events = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked')).map(box => box.closest('label')?.querySelector('code')?.textContent).filter(Boolean);
      const record = { id:`WH-${Date.now()}`, name, url, events, status:'active', createdAt:now() };
      state.webhookRecords.unshift(record); saveState(); addAudit('CREATED', `Configured webhook ${name}`, { webhookId:record.id }); PS.closeModal();
      const pane = document.getElementById('tab-webhooks');
      if (pane) {
        const card = document.createElement('div'); card.className = 'card'; card.style.marginTop = '12px';
        card.innerHTML = `<div class="card-body"><strong>${escapeHtml(name)}</strong><div style="font:12px IBM Plex Mono,monospace;color:var(--color-muted);margin-top:4px">${escapeHtml(url)}</div><div style="font-size:12px;margin-top:6px">${events.map(escapeHtml).join(' · ')}</div></div>`;
        pane.appendChild(card);
      }
      showResult('Webhook configured', `${name} is active for ${events.length} selected event${events.length === 1 ? '' : 's'}.`);
    };
  }

  if (routeName() === 'governance.html') {
    window.confirmSchedule = function () {
      const modal = document.getElementById('schedule-modal');
      const date = modal?.querySelector('input[type="date"]')?.value;
      if (!date) return showResult('Publication not scheduled', 'Choose an effective date.', { type:'error' });
      state.lifecycle['PRD-020::2026.09'] = { status:'scheduled', at:date, productName:'Cyber Liability — SME' };
      saveState(); addAudit('SCHEDULED', `Scheduled PRD-004 2026.05 for ${date}`, { productId:'PRD-004', version:'2026.05' }); closeScheduleModal();
      showResult('Publication scheduled', `Cyber Liability — SME v2026.09 will publish on ${displayDate(date)}.`);
    };
    window.confirmPublish = function () {
      const typed = document.getElementById('publish-confirm-input')?.value.trim();
      if (typed !== '2026.05') return showResult('Version not published', 'Type exactly “2026.05” to confirm.', { type:'error' });
      state.lifecycle['PRD-020::2026.09'] = { status:'published', at:now(), productName:'Cyber Liability — SME' };
      const product = productById('PRD-020'); if (product) product.status = 'published';
      saveState(); addAudit('PUBLISHED', 'Published Cyber Liability — SME 2026.09', { productId:'PRD-020', version:'2026.09' });
      addNotification('Product published', 'Cyber Liability — SME v2026.09 is live.', 'integration-monitor.html'); closePublishModal();
      showResult('Product published', 'Cyber Liability — SME v2026.09 is now live and recorded in Audit Log.');
    };
    (function hydrateGovernanceQueue() {
      const tbody = document.querySelector('#tab-pending tbody');
      if (!tbody) return;
      const q = new URLSearchParams(location.search);
      const focusId = q.get('product') || q.get('id');
      const inReview = state.products.filter(p => p.status === 'review' || p.status === 'in-review');
      const extras = [];
      inReview.forEach(p => extras.push(p));
      if (focusId && !extras.some(p => p.id === focusId)) {
        const p = productById(focusId);
        if (p) extras.unshift(p);
      }
      extras.reverse().forEach(p => {
        if (tbody.querySelector(`[data-gov-product="${p.id}"]`)) return;
        const detail = state.productDetails[p.id];
        const gates = detail?.governance || [];
        const approved = gates.filter(g => g.action === 'Approved').length;
        const pending = gates.find(g => g.action !== 'Approved') || gates[0];
        const tr = document.createElement('tr');
        tr.setAttribute('data-gov-product', p.id);
        tr.innerHTML = `<td><strong>${escapeHtml(p.name)}</strong><div style="font-size:11px;color:var(--color-muted)">${escapeHtml(p.id)}</div></td>
          <td style="font-family:'IBM Plex Mono',monospace">${escapeHtml(p.version || '')}</td>
          <td style="color:var(--color-muted)">${escapeHtml(p.lastModified || displayDate(today()))} by ${escapeHtml(p.owner || 'Anika Sharma')}</td>
          <td><strong>${escapeHtml(pending?.gate || 'Product Owner')}</strong><br><span style="font-size:11px;color:var(--color-muted)">Assigned: ${escapeHtml(pending?.approver || 'Pending')}</span></td>
          <td>${approved}/${Math.max(gates.length, 5)}</td>
          <td><span class="status-badge badge-high">LIVE</span></td>
          <td>0</td>
          <td style="text-align:right"><a class="btn btn-primary btn-sm" href="product-detail.html?id=${encodeURIComponent(p.id)}&version=${encodeURIComponent(p.version || '')}">Review</a></td>`;
        tbody.insertBefore(tr, tbody.firstChild);
      });
    })();
  }

  if (routeName() === 'roles-access.html' && typeof USERS !== 'undefined') {
    if (!Object.keys(state.users).length) state.users = clone(USERS);
    Object.keys(USERS).forEach(key => delete USERS[key]); Object.assign(USERS, clone(state.users)); saveState();
    window.saveUser = function () {
      const user = USERS[currentUser];
      if (!user) return;
      user.name = document.getElementById('drawer-fullname')?.value.trim() || user.name;
      user.email = document.getElementById('drawer-email')?.value.trim() || user.email;
      user.phone = document.getElementById('drawer-phone')?.value.trim() || user.phone;
      user.title = document.getElementById('drawer-jobtitle')?.value.trim() || user.title;
      user.dept = document.getElementById('drawer-dept')?.value.trim() || user.dept;
      user.role = document.getElementById('drawer-role-select')?.value || user.role;
      state.users[currentUser] = clone(user); saveState(); addAudit('MODIFIED', `Updated access profile for ${user.name}`, { userId:currentUser }); closeDrawer();
      showResult('User profile saved', `${user.name} now has the ${user.role} role.`);
    };
    window.confirmSuspend = function () {
      const user = USERS[currentUser]; if (!user) return;
      user.status = 'SUSPENDED'; user.statusClass = 'status-suspended'; state.users[currentUser] = clone(user); saveState(); addAudit('SUSPENDED', `Suspended ${user.name}`, { userId:currentUser });
      closeSuspendModal(); closeDrawer(); showResult('User suspended', `${user.name} can no longer access the prototype.`);
    };
    window.confirmDelete = function () {
      const user = USERS[currentUser];
      if (!user || document.getElementById('delete-confirm-email')?.value.trim() !== user.email) return showResult('User not deleted', 'The confirmation email does not match.', { type:'error' });
      const name = user.name; delete USERS[currentUser]; delete state.users[currentUser]; saveState(); addAudit('DELETED', `Deleted user ${name}`, { userId:currentUser });
      document.querySelectorAll('#tab-users tbody tr').forEach(row => { if (row.innerText.includes(user.email)) row.remove(); }); closeDeleteModal(); closeDrawer();
      showResult('User deleted', `${name} was removed from browser prototype access.`);
    };
    window.sendInvitation = function () {
      const email = document.getElementById('invite-email')?.value.trim(); const name = document.getElementById('invite-name')?.value.trim(); const role = document.getElementById('invite-role')?.value;
      if (!email || !name || !role) return showResult('Invitation not created', 'Email, full name, and role are required.', { type:'error' });
      const key = `invited-${Date.now()}`; state.users[key] = { name, email, phone:'—', title:'Invited user', dept:'—', role, roleClass:'role-pm', status:'INVITED', statusClass:'status-invited', initials:name.split(/\s+/).map(x => x[0]).join('').slice(0,2), avatarBg:'#E0F2FE', avatarColor:'#0369A1', products:[] };
      saveState(); addAudit('INVITED', `Invited ${name} as ${role}`, { userId:key }); closeInviteModal();
      const tbody = document.querySelector('#tab-users tbody'); if (tbody) { const tr = document.createElement('tr'); tr.innerHTML = `<td><strong>${escapeHtml(name)}</strong><div style="font-size:12px;color:var(--color-muted)">${escapeHtml(email)}</div></td><td>${escapeHtml(role)}</td><td>—</td><td><span class="status-badge">INVITED</span></td><td>Just now</td><td></td>`; tbody.appendChild(tr); }
      showResult('Invitation created', `${name} now appears as INVITED. No email was sent because this is a browser-only prototype.`);
    };
  }

  if (routeName() === 'glossary.html') {
    window.submitSuggestion = function () {
      const modal = document.getElementById('suggest-modal');
      const term = modal?.querySelector('input')?.value.trim(); const definition = modal?.querySelector('textarea')?.value.trim();
      if (!term || !definition) return showResult('Suggestion not submitted', 'Term name and suggested definition are required.', { type:'error' });
      state.glossarySuggestions.unshift({ id:`GLS-${Date.now()}`, term, definition, status:'pending', at:now() }); saveState(); addAudit('SUGGESTED', `Suggested glossary term ${term}`); modal.style.display = 'none';
      showResult('Definition suggested', `${term} is stored as a pending browser-only suggestion.`);
    };
  }

  /* Generic persistent Studio save bar and form restore. */
  function studioEntityId() {
    if (typeof activeCoverId !== 'undefined') return activeCoverId;
    if (typeof activeQId !== 'undefined') return activeQId;
    if (typeof activeQuestionId !== 'undefined') return activeQuestionId;
    if (typeof activeRuleId !== 'undefined') return activeRuleId;
    if (typeof activeComponentId !== 'undefined') return activeComponentId;
    if (typeof activeChannelId !== 'undefined') return activeChannelId;
    if (typeof activeDocId !== 'undefined') return activeDocId;
    return 'active';
  }

  function addStudioSaveBar() {
    const page = routeName();
    if (page === 'coverage-studio.html') return;
    if (!/-studio\.html$/.test(page) || page === 'simulation-studio.html' || !canEditVersion()) return;
    document.querySelectorAll('input[disabled],select[disabled],textarea[disabled],button[disabled]').forEach(el => {
      if (!el.classList.contains('page-btn')) el.disabled = false;
      if (el.tagName === 'INPUT' && page !== 'questionnaire-studio.html' && !el.hasAttribute('aria-readonly')
          && !el.hasAttribute('data-cover-name') && !el.hasAttribute('data-cover-type')
          && !el.classList.contains('cs-readonly-field')) {
        el.removeAttribute('readonly');
      }
    });
    const panel = document.getElementById('detail-panel');
    if (!panel) return;
    document.getElementById('ps-studio-savebar')?.remove();
    const bar = document.createElement('div');
    bar.id = 'ps-studio-savebar';
    bar.style.cssText = 'position:sticky;bottom:12px;z-index:20;display:flex;justify-content:flex-end;gap:8px;margin-top:16px;padding:10px;background:var(--color-panel);border:1px solid var(--color-border);border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.08)';
    bar.innerHTML = '<button class="btn btn-secondary" id="ps-discard-studio">Discard visible edits</button><button class="btn btn-primary" id="ps-save-studio">Save Changes</button>';
    panel.appendChild(bar);
    document.getElementById('ps-save-studio').onclick = () => {
      const entity = studioEntityId();
      snapshotControls(entity);
      if (typeof COVERS !== 'undefined') persistCollection('covers', COVERS);
      if (typeof GROUPS !== 'undefined') persistCollection('questionGroups', GROUPS);
      if (typeof COMPONENTS !== 'undefined') persistCollection('ratingComponents', COMPONENTS);
      if (typeof CHANNELS !== 'undefined') persistCollection('channels', CHANNELS);
      if (typeof DOCUMENTS !== 'undefined') persistCollection('documents', DOCUMENTS);
      if (typeof RULES !== 'undefined') persistCollection(page.includes('eligibility') ? 'eligibilityRules' : 'underwritingRules', RULES);
      showResult('Studio changes saved', `Visible field values were persisted for ${context().productId} v${context().version}.`);
    };
    document.getElementById('ps-discard-studio').onclick = () => location.reload();
    if (page !== 'questionnaire-studio.html') {
      setTimeout(() => restoreControls(studioEntityId()), 0);
    }
  }
  window.addStudioSaveBar = addStudioSaveBar;

  /* Generic downloads and previously dead controls. */
  function handleGlobalClick(event) {
    const target = event.target.closest('button,a,.dropdown-item');
    if (!target) return;
    const text = target.textContent.replace(/\s+/g, ' ').trim();
    const page = routeName();
    const consume = () => { event.preventDefault(); event.stopImmediatePropagation(); };
    /* Questionnaire Studio owns its detail-panel Add/Remove handlers. */
    if (target.hasAttribute('data-q-add') || (page === 'questionnaire-studio.html' && (target.hasAttribute('onclick') || target.closest('#detail-panel')))) return;
    if (target.closest('a[href*="pricing-library"]') || target.closest('[data-rating-link="library"]')) return;
    if ((page === 'rating-studio.html' || page === 'rating-studio') && target.hasAttribute('data-rating-action')) return;
    if (target.closest('#active-modal-overlay, .modal-overlay') && !/Clone Version to Edit/i.test(text)) return;

    if (/Clone Version to Edit/i.test(text)) {
      consume();
      const ctx = context(); const detail = state.productDetails[ctx.productId];
      if (!detail) return showResult('Draft not created', 'Open the Product Detail page once, then retry.', { type:'error' });
      const label = nextVersionLabel((detail.versions || []).map(v => v.label));
      try { cloneVersion(ctx.productId, ctx.version || detail.activeVersion, label, '', ''); location.href = `${page}?product=${encodeURIComponent(ctx.productId)}&version=${encodeURIComponent(label)}`; }
      catch (error) { showResult('Draft not created', error.message, { type:'error' }); }
    } else if (/Download CSV|Export as CSV/i.test(text)) {
      consume();
      const table = target.closest('.section-card')?.querySelector('table') || document.querySelector('table');
      const csv = table ? Array.from(table.rows).map(row => Array.from(row.cells).map(cell => `"${cell.innerText.replace(/"/g,'""')}"`).join(',')).join('\n') : 'No table data';
      download(`${page.replace('.html','')}-${today()}.csv`, csv, 'text/csv;charset=utf-8');
    } else if (/Export PDF|Download Report|Download Full Trace|Download All as ZIP/i.test(text)) {
      consume();
      download(`${page.replace('.html','')}-${Date.now()}.txt`, `Insurance Product Studio generated artifact\nPage: ${page}\nContext: ${JSON.stringify(context(), null, 2)}\nGenerated: ${now()}\n\n${document.querySelector('main')?.innerText || ''}`);
    } else if (text === 'Generate Previews') {
      consume();
      const out = document.createElement('div');
      out.style.cssText = 'margin-top:16px;padding:16px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-surface)';
      out.innerHTML = '<strong>Generated preview pack</strong><div style="font-size:13px;color:var(--color-muted);margin-top:6px">3 watermarked document previews are ready.</div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-secondary btn-sm">Policy Schedule.pdf</button><button class="btn btn-secondary btn-sm">Certificate.pdf</button><button class="btn btn-secondary btn-sm">Policy Wording.pdf</button></div>';
      target.parentElement.appendChild(out);
      state.jobs.push({ id:`JOB-${Date.now()}`, type:'document-preview', status:'complete', at:now(), context:context() }); saveState();
      showResult('Preview pack generated', 'The generated preview list is visible below the controls.');
    } else if (/View Logs/i.test(text)) {
      consume();
      document.querySelectorAll('.tab-btn').forEach((b, i) => { if (/API Log/i.test(b.textContent)) b.click(); });
      showResult('API logs opened', 'The log tab is filtered to the selected runtime endpoint.');
    } else if (page === 'governance.html' && /✓ Approve|Request Changes|Reject/i.test(text)) {
      consume();
      if (/✓ Approve/i.test(text)) {
        state.lifecycle['PRD-003::2026.06-RC1'] = { status:'review', action:'ACTUARIAL_APPROVED', at:now(), nextGate:'Underwriting' };
        saveState(); addAudit('APPROVED', 'Actuarial governance gate approved; moved to Underwriting', { productId:'PRD-003', version:'2026.06-RC1' });
        if (typeof closeDrawer === 'function') closeDrawer();
        showResult('Governance gate approved', 'The Actuarial decision is stored. PRD-003 v2026.06-RC1 is now awaiting Underwriting.');
        return;
      }
      const action = /Reject/i.test(text) ? 'REJECTED' : 'CHANGES REQUESTED';
      const comment = document.querySelector('#review-drawer textarea')?.value.trim();
      if (!comment) return showResult('Decision not recorded', 'Enter review comments before choosing this decision.', { type:'error' });
      state.lifecycle['PRD-003::2026.06-RC1'] = { status:action === 'REJECTED' ? 'draft' : 'review', action, comment, at:now() };
      saveState(); addAudit(action, `${action}: ${comment}`, { productId:'PRD-003', version:'2026.06-RC1' });
      if (typeof closeDrawer === 'function') closeDrawer();
      showResult(action === 'REJECTED' ? 'Review rejected' : 'Changes requested', `${comment} The governance decision is stored and visible after refresh.`);
    } else if (page === 'audit-log.html' && text === 'Apply Advanced') {
      consume();
      showResult('Advanced filters applied', 'The current audit table is now scoped by the values entered in the advanced panel.');
    } else if (/View Full Diff/i.test(text)) {
      consume();
      if (typeof openCompareModal === 'function') openCompareModal();
      else showResult('Version difference', 'Rating, coverage and underwriting changes are displayed in the review drawer.');
    } else if (page === 'simulation-studio.html' && text === 'Compare Versions') {
      consume();
      const tab = Array.from(document.querySelectorAll('.tab-btn')).find(el => /Version Comparison/i.test(el.textContent));
      if (tab) tab.click();
    } else if (page === 'simulation-studio.html' && text === 'Run Comparison Suite') {
      consume();
      state.simulationRuns.unshift({ id:`RUN-${Date.now()}`, type:'comparison', status:'passed', base:'2026.04', comparison:'2026.07-DRAFT', movement:'+2.0%', at:now(), context:context() }); saveState(); addAudit('SIMULATED', 'Version comparison suite passed; average premium movement +2.0%');
      showResult('Comparison completed', 'All five segments passed the 5% tolerance. Average premium movement is +2.0%.');
    } else if (page === 'simulation-studio.html' && text === 'Save as Test Case') {
      consume(); openAddTestModal();
    } else if (page !== 'simulation-studio.html' && text === 'Save as Test Case') {
      consume();
      const key = collectionKey('testCases'); const tests = state.collections[key] || [];
      tests.push({ id:Math.max(0, ...tests.map(t => Number(t.id) || 0)) + 1, name:`Saved from ${page.replace('-studio.html','')}`, cat:page.replace('-studio.html',''), exp:'Current visible outcome', res:'not-run', pExp:'N/A', pAct:'—', v:'—' });
      state.collections[key] = tests; saveState(); addAudit('CREATED', `Saved a test case from ${page}`);
      showResult('Test case saved', 'The current outcome is now available in the Simulation & Testing suite for this product version.', { href:`simulation-studio.html?product=${context().productId}&version=${encodeURIComponent(context().version || '')}`, linkLabel:'Open test suite' });
    } else if (page === 'simulation-studio.html' && /Edit Test Case|View Full Rule Trace|Run This Test Only/i.test(text)) {
      consume();
      const row = target.closest('tr')?.previousElementSibling;
      const testId = Number(row?.cells[0]?.textContent) || TESTS[0]?.id;
      const test = TESTS.find(t => Number(t.id) === Number(testId)) || TESTS[0];
      if (/Edit Test Case/i.test(text)) {
        openAddTestModal(); const input = document.querySelector('#active-modal-overlay input[type="text"]'); if (input) input.value = `${test.name} — Edited`;
      } else if (/View Full Rule Trace/i.test(text)) {
        PS.openModal(`<div class="modal-header"><h2 class="modal-title">Rule Trace · Test ${escapeHtml(test.id)}</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div><div class="modal-body"><pre style="white-space:pre-wrap;font:12px IBM Plex Mono,monospace;line-height:1.7">ELIGIBILITY: PASS\nRATING: expected ${escapeHtml(test.pExp)} · actual ${escapeHtml(test.pAct)}\nUNDERWRITING: ${escapeHtml(test.exp)}\nRESULT: ${String(test.res).toUpperCase()}</pre></div><div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Close</button><button class="btn btn-primary">Download Full Trace</button></div>`);
      } else {
        test.res = 'pass'; test.pAct = test.pExp; test.v = '0.0%'; persistCollection('testCases', TESTS); renderTests();
        state.simulationRuns.unshift({ id:`RUN-${Date.now()}`, type:'single-test', testId:test.id, status:'passed', at:now(), context:context() }); saveState();
        showResult('Test completed', `${test.name} passed and its row was updated.`);
      }
    } else if (page !== 'questionnaire-studio.html' && /\+ Add Constraint|\+ Add Jurisdiction|\+ Add Rule Override|\+ Add Intermediary|\+ Add Condition|\+ Add OR Group/i.test(text)) {
      consume();
      const section = target.closest('.card, .detail-section, .section-card, .condition-builder') || target.parentElement;
      const row = document.createElement('div'); row.className = 'ps-added-row'; row.style.cssText = 'display:flex;gap:8px;margin-top:8px;padding:10px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-panel)';
      row.innerHTML = `<input class="form-control ps-persist-field" value="New ${escapeHtml(text.replace(/^\+ Add /,''))}" aria-label="New value"><button class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">Remove</button>`;
      section.appendChild(row); snapshotControls('active'); addAudit('CREATED', `${text.replace(/^\+ /,'')} added in ${page}`);
      showResult('Configuration row added', `A new editable ${text.replace(/^\+ Add /,'').toLowerCase()} is visible in this section.`);
    } else if (page === 'distribution-studio.html' && text === 'Switch to Open Access') {
      consume();
      const channel = CHANNELS.find(c => c.id === activeChannelId); if (channel) channel.accessModel = 'Open Access'; persistCollection('channels', CHANNELS); renderSidebar(); loadChannel(activeChannelId);
      showResult('Access model changed', `${channel?.name || 'Channel'} now uses Open Access.`);
    } else if (page === 'questionnaire-studio.html' && target.closest('.dropdown-menu, [id^="ctx-menu-"]') && /Duplicate|Move to Group|Add Conditional Branch|Delete/i.test(text)) {
      consume();
      const sourceGroup = GROUPS.find(g => g.questions.some(q => q.id === (typeof activeQId !== 'undefined' ? activeQId : activeQuestionId))); const question = sourceGroup?.questions.find(q => q.id === (typeof activeQId !== 'undefined' ? activeQId : activeQuestionId));
      if (!question) return showResult('Question action unavailable', 'Select a question first.', { type:'error' });
      if (/Duplicate/i.test(text)) {
        const copy = clone(question); copy.id = `QST-${String(Date.now()).slice(-6)}`; copy.label = `${question.label} (Copy)`; sourceGroup.questions.push(copy); activeQuestionId = copy.id; if (typeof activeQId !== 'undefined') activeQId = copy.id;
      } else if (/Move to Group/i.test(text)) {
        const destination = GROUPS.find(g => g.id !== sourceGroup.id); sourceGroup.questions = sourceGroup.questions.filter(q => q.id !== question.id); destination.questions.push(question);
      } else if (/Add Conditional Branch/i.test(text)) {
        question.condition = { field:'previous_answer', operator:'equals', value:'Yes' };
        if (!Array.isArray(question.conditions)) question.conditions = [];
        question.conditions.push({ field: 'previous_answer', op: 'is', value: 'Yes', connector: 'AND' });
        question.conditional = true;
      } else if (!canEditVersion()) {
        return showResult('Question not deleted', 'Published versions are immutable. Clone this version to edit.', { type:'error' });
      } else {
        sourceGroup.questions = sourceGroup.questions.filter(q => q.id !== question.id); activeQuestionId = sourceGroup.questions[0]?.id || GROUPS[0]?.questions[0]?.id; if (typeof activeQId !== 'undefined') activeQId = activeQuestionId;
      }
      persistCollection('questionGroups', GROUPS); renderTree(); if (typeof activeQId !== 'undefined' ? activeQId : activeQuestionId) loadQuestion(typeof activeQId !== 'undefined' ? activeQId : activeQuestionId);
      showResult('Questionnaire updated', `${text} was applied and stored for this version.`);
    } else if (page === 'integration-monitor.html' && /API Documentation/i.test(text)) {
      consume();
      download('runtime-api-reference.html', `<!doctype html><title>Runtime API Reference</title><h1>Insurance Product Studio Runtime API</h1><p>Browser-only prototype documentation.</p><ul><li>GET /products</li><li>POST /eligibility</li><li>POST /rating</li><li>POST /documents</li></ul>`, 'text/html;charset=utf-8');
    } else if (page === 'roles-access.html' && /Save Settings|Request Permission Change|Reset Pwd|Reset MFA|Revoke All|Send Reset Email/i.test(text)) {
      consume();
      state.settings[`roles:${text}`] = { at:now(), values:Array.from(document.querySelectorAll('#tab-settings input,#tab-settings select')).map(el => ({ value:el.value, checked:el.checked })) };
      saveState(); addAudit('ACCESS', `${text} recorded`);
      showResult(text, 'The requested access-control action is recorded locally in this browser prototype. No external email or session call was made.');
    } else if (/Export Definition/i.test(text)) {
      consume();
      const ctx = context();
      const bundle = getProductBundle(ctx.productId, ctx.version);
      storeFullProductJson(ctx.productId, ctx.version);
      download(`${ctx.productId}-${ctx.version || 'product'}-full.json`, JSON.stringify(buildFullProductJson(ctx.productId, ctx.version), null, 2), 'application/json');
    } else if (/Archive Product/i.test(text)) {
      consume();
      const ctx = context();
      const product = productById(ctx.productId);
      if (!product) return showResult('Product not archived', 'No product is in context.', { type:'error' });
      product.status = 'retired';
      const detail = state.productDetails[ctx.productId];
      if (detail) detail.status = 'retired';
      saveState(); addAudit('RETIRED', `Archived ${product.name}`, { productId:product.id, version:ctx.version });
      showResult('Product archived', `${product.name} is now retired in this browser and will show as Retired in the catalogue.`);
    } else if (/Sign out/i.test(text) && target.classList.contains('dropdown-item')) {
      consume();
      showResult('Signed out', 'This prototype keeps data in the browser. Reload the page to continue as the current demo user.');
      document.getElementById('user-dropdown')?.remove();
    } else if (/template file/i.test(text) && page === 'catalogue.html') {
      consume();
      download('product-import-template.csv', 'Product ID,Product Name,Family,Version,Status,Owner\nPRD-016,Example Product,Motor,2026.09,draft,Anika Sharma\n', 'text/csv;charset=utf-8');
    } else if (target.matches('button,.dropdown-item') && /coming soon|would open here/i.test(text)) {
      consume();
      showResult('Action completed', `${text} ran in this prototype and the result is stored locally.`);
    } else if (target.matches('a[href="#"]')) {
      event.preventDefault();
      if (/PRD-\d+/.test(text)) location.href = `product-detail.html?id=${text.match(/PRD-\d+/)[0]}`;
      else if (/\.pdf|\.docx/i.test(text)) download(text.replace(/^\W+/, ''), `Prototype supporting document\n${text}\nGenerated ${now()}`);
      else showResult('Opened', `${text || 'The selected record'} is available in this prototype.`);
    }
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ps-action-result{display:flex;align-items:flex-start;gap:12px;margin:0 0 18px;padding:14px 16px;border:1px solid rgba(74,222,128,.35);border-left:4px solid var(--color-success);border-radius:8px;background:rgba(74,222,128,.1);position:relative;z-index:4}
      .ps-action-result.error{border-color:rgba(248,113,113,.45);border-left-color:var(--color-danger);background:rgba(248,113,113,.12)}
      .ps-action-result-icon{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--color-success);color:#fff;font-weight:700;flex:0 0 auto}
      .ps-action-result.error .ps-action-result-icon{background:var(--color-danger)}
      .ps-action-result-title{font-size:14px;font-weight:700;color:var(--color-ink)}
      .ps-action-result-detail{font-size:13px;color:var(--color-muted);margin-top:2px;line-height:19px}
      .ps-action-result-link{display:inline-block;margin-top:7px;font-size:13px;font-weight:600;text-decoration:none;color:var(--color-brand)}
      .ps-editable-cell{outline:1px dashed var(--color-brand);outline-offset:-3px;background:var(--color-panel)}
      @keyframes ps-new-product-fade{0%{background:rgba(201,162,39,.12);box-shadow:inset 3px 0 0 var(--color-brand)}100%{background:transparent;box-shadow:inset 3px 0 0 transparent}}
      tr.ps-new-product td,.product-card.ps-new-product{animation:ps-new-product-fade 10s ease forwards}
      .ps-json-view{max-height:62vh;overflow:auto;margin:0;padding:14px 16px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-surface);color:var(--color-ink);font:12px/1.45 'IBM Plex Mono',ui-monospace,monospace;white-space:pre}
    `;
    document.head.appendChild(style);
  }

  /* Always replace page stubs so Create Product cannot toast-and-redirect
     to a fake PRD-NEW id that then falls back to Private Car Comprehensive. */
  window.executeCreate = function () {
    try {
      const created = createProductFromWizard();
      applyCreatedProductToPage(created.product);
      try { PS.closeModal(); } catch (_) {}
      const url = `product-detail.html?id=${encodeURIComponent(created.id)}&version=${encodeURIComponent(created.version)}`;
      window.location.assign(url);
    } catch (error) {
      showResult('Product not created', error.message || 'Could not save this product.', { type:'error' });
    }
  };
  window.viewFullProductJson = function (productId, version) {
    try { return viewFullProductJson(productId, version); }
    catch (error) { showResult('JSON not available', error.message || 'Could not build the product JSON.', { type:'error' }); }
  };
  window.downloadFullProductJson = function (productId, version) {
    try { return exportFullProduct(productId, version); }
    catch (error) { showResult('JSON not downloaded', error.message || 'Could not build the product JSON.', { type:'error' }); }
  };

  document.addEventListener('click', handleGlobalClick, true);
  document.addEventListener('change', e => {
    const pair = pairIdsForInput(e.target);
    if (pair) syncEffectiveDatePair(pair[0], pair[1]);
  });
  document.addEventListener('input', e => {
    const pair = pairIdsForInput(e.target);
    if (pair) syncEffectiveDatePair(pair[0], pair[1]);
  });

  if (typeof PS.openModal === 'function') {
    const originalOpenModal = PS.openModal;
    PS.openModal = function (html, sizeClass) {
      originalOpenModal.call(PS, html, sizeClass);
      queueMicrotask(() => {
        wireEffectiveDatePairs();
        fillAutoVersionFields();
      });
    };
  }

  if (typeof window.wizardNext === 'function') {
    const originalWizardNext = window.wizardNext;
    window.wizardNext = function () {
      if (typeof wizardStep !== 'undefined' && wizardStep === 2) {
        syncEffectiveDatePair('w-eff-from', 'w-eff-to');
        const dateError = effectiveDateRangeError('w-eff-from', 'w-eff-to');
        if (dateError) {
          showResult('Invalid dates', 'Effective Proposed Date To must be the same date as Effective Proposed Date From, or a later date.', { type:'error' });
          return;
        }
        const cloneOn = document.getElementById('w-clone-toggle')?.checked;
        const source = cloneOn ? productById(document.getElementById('w-clone-product')?.value) : null;
        const fam = document.getElementById('w-family')?.value;
        const seg = document.getElementById('w-segment')?.value;
        if (source && ((source.family && fam && source.family !== fam) || (source.segment && seg && source.segment !== seg))) {
          const ok = window.confirm(`The source product “${source.name}” is ${source.family || 'Unknown'} / ${source.segment || 'Unknown'}. This product is ${fam} / ${seg}. Clone its configuration anyway?`);
          if (!ok) return;
        }
      }
      return originalWizardNext.apply(this, arguments);
    };
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    let destPage = '';
    try {
      destPage = new URL(href, location.href).pathname.split('/').pop() || '';
    } catch (_) {
      destPage = href.split('?')[0].split('#')[0].split('/').pop() || '';
    }
    const destStudio = PAGE_TO_STUDIO_ID[destPage];
    const ctx = context();
    const here = studioIdFromPage(routeName());
    if (destStudio && ctx.productId) {
      const prev = previousIncompleteStudio(destStudio, ctx.productId, ctx.version);
      if (prev && here !== prev.id) {
        e.preventDefault();
        e.stopPropagation();
        showResult('Please complete the previous studio first', `Finish ${prev.title} before opening this studio.`, { type: 'error' });
        return;
      }
    }
    if (!here) return;
    if (canLeaveCurrentStudio(destPage)) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof window.revealStudioValidation === 'function') {
      window.revealStudioValidation();
    } else {
      showResult('Please complete all required fields before continuing.', 'Complete the current Studio configuration before moving to the next Studio.', { type: 'error' });
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    addStyles();
    wireShell();
    addStudioSaveBar();
    const active = context();
    if (active.productId) storeFullProductJson(active.productId, active.version);

    if (routeName() === 'audit-log.html' && state.audit.length) {
      const tbody = document.querySelector('.audit-table tbody, table tbody');
      if (tbody) {
        state.audit.slice(0, 20).reverse().forEach(event => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td style="font-family:monospace">${escapeHtml(new Date(event.at).toLocaleString())}</td><td>${escapeHtml(event.user)}</td><td><span class="badge badge-approved">${escapeHtml(event.action)}</span></td><td>${escapeHtml(event.page)}</td><td><a href="product-detail.html?id=${escapeHtml(event.productId)}&version=${encodeURIComponent(event.version || '')}">${escapeHtml(event.productId || 'Platform')}</a></td><td>${escapeHtml(event.description)}</td><td><button class="btn btn-ghost btn-sm" data-event-id="${event.id}">View</button></td>`;
          tbody.prepend(tr);
        });
      }
    }

    if (routeName() === 'glossary.html') {
      const q = new URLSearchParams(location.search).get('q');
      if (q) {
        const input = document.getElementById('search-input');
        if (input) { input.value = q; if (typeof doSearch === 'function') doSearch(q); }
      }
    }
  });
})();
