/* Product-linked table hub for studio pages. */
(function () {
  'use strict';
  window.PS = window.PS || {};

  const COLORS = [
    { bg: 'rgba(139,92,246,.18)', fg: '#A78BFA' },
    { bg: 'rgba(34,197,94,.16)', fg: '#4ADE80' },
    { bg: 'rgba(249,115,22,.18)', fg: '#FB923C' },
    { bg: 'rgba(56,189,248,.16)', fg: '#38BDF8' },
    { bg: 'rgba(20,184,166,.16)', fg: '#2DD4BF' },
    { bg: 'rgba(192,149,83,.18)', fg: 'var(--color-brand)' }
  ];

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initials(name) {
    return String(name || '•').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function iconStyle(index) {
    const palette = COLORS[index % COLORS.length];
    return `background:${palette.bg};color:${palette.fg}`;
  }

  function ensureLibraryStyles() {
    if (document.getElementById('studio-library-css')) return;
    const style = document.createElement('style');
    style.id = 'studio-library-css';
    style.textContent = `
      .clib-count{font-size:22px;font-weight:700}
      .clib-muted{color:var(--color-muted);font-size:12px}
      .clib-products{display:flex;flex-wrap:wrap;gap:6px}
      .clib-chip{font-size:11px;padding:2px 8px;border-radius:100px;background:var(--color-brand-light);color:var(--color-brand);text-decoration:none}
      .cs-name-cell{display:flex;align-items:center;gap:10px;font-weight:600}
      .cs-cover-icon{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    `;
    document.head.appendChild(style);
  }

  function libraryMatch(lib, item) {
    const ln = String(lib.name || '').toLowerCase();
    const cn = String(item.name || '').toLowerCase();
    if (ln && cn && (cn === ln || cn.includes(ln) || ln.includes(cn.split(/[—-]/)[0].trim()))) return true;
    const lc = String(lib.code || '').toLowerCase().replace(/-\d+$/, '');
    const cc = String(item.code || '').toLowerCase();
    return Boolean(lc && cc && (cc === lc || cc.startsWith(lc) || cc.includes(lc)));
  }

  function flattenQuestions(groups) {
    if (!Array.isArray(groups)) return [];
    return groups.flatMap(g => {
      if (Array.isArray(g.questions) && g.questions.length) {
        return g.questions.map(q => ({
          name: q.label || q.name,
          code: q.id || q.internalName,
          type: q.type,
          extra: g.label || g.name || ''
        }));
      }
      return [{ name: g.label || g.name, code: g.id, type: g.type, extra: '' }];
    });
  }

  function flattenRating(groups) {
    if (!Array.isArray(groups)) return [];
    if (groups[0] && Array.isArray(groups[0].items)) {
      return groups.flatMap(g => (g.items || []).map(i => ({
        name: i.name, code: i.id, type: i.type || g.group, extra: g.group
      })));
    }
    return groups.map(i => ({ name: i.name, code: i.id, type: i.type, extra: i.group || i.groupLabel || '' }));
  }

  function flattenNamed(list) {
    return (Array.isArray(list) ? list : []).map(i => ({
      name: i.name || i.label,
      code: i.id || i.code,
      type: i.type || i.category || i.cat || '',
      extra: i.cover || i.group || i.format || i.category || '',
      options: i.options || ''
    }));
  }

  const STUDIO_LIBRARIES = {
    questionnaire: {
      file: 'questionnaire-studio.html',
      navId: 'questionnaire',
      title: 'Questionnaire Studio',
      cardTitle: 'Predefined questions',
      cardSubtitle: 'Shared question templates and how many products currently use each one. Open a product to configure its questionnaire.',
      noun: 'questions',
      createLabel: 'question',
      codePrefix: 'QST',
      typeOptions: ['Text','Number','Date','Boolean','Select','Multi-select','Entity','Repeatable','Currency'],
      extraPlaceholder: 'e.g. Vehicle Details',
      codeHeader: 'Question ID',
      typeHeader: 'Type',
      extraHeader: 'Group',
      suffixes: ['questionGroups'],
      bundleField: 'questionGroups',
      flatten: flattenQuestions,
      library: [
        { name:'Make & Model', code:'QST-VEH-001', type:'Entity', extra:'Vehicle Details' },
        { name:'Year of Manufacture', code:'QST-VEH-002', type:'Number', extra:'Vehicle Details' },
        { name:'Insured Value', code:'QST-VEH-003', type:'Currency', extra:'Vehicle Details' },
        { name:'Vehicle Modifications?', code:'QST-VEH-004', type:'Boolean', extra:'Vehicle Details' },
        { name:'Purpose of Use', code:'QST-VEH-005', type:'Select', extra:'Vehicle Details' },
        { name:'Annual Mileage', code:'QST-VEH-006', type:'Number', extra:'Vehicle Details' },
        { name:'Primary Driver — Full Name', code:'QST-DRV-001', type:'Text', extra:'Driver Details' },
        { name:'Primary Driver — Date of Birth', code:'QST-DRV-002', type:'Date', extra:'Driver Details' },
        { name:'Primary Driver — Licence No.', code:'QST-DRV-003', type:'Text', extra:'Driver Details' },
        { name:'Conviction History?', code:'QST-DRV-005', type:'Boolean', extra:'Driver Details' },
        { name:'Named Additional Drivers', code:'QST-DRV-006', type:'Repeatable', extra:'Driver Details' },
        { name:'Cover Start Date', code:'QST-POL-001', type:'Date', extra:'Policy Details' },
        { name:'Covers Required', code:'QST-POL-003', type:'Multi-select', extra:'Policy Details' },
        { name:'Payment Preference', code:'QST-POL-004', type:'Select', extra:'Policy Details' }
      ]
    },
    risk: {
      file: 'risk-studio.html',
      navId: 'risk',
      title: 'Risk Studio',
      cardTitle: 'Predefined risk attributes',
      cardSubtitle: 'Shared trucking and commercial auto risk data captured at quote, and how many products currently use each one.',
      noun: 'risk attributes',
      createLabel: 'risk attribute',
      codePrefix: 'RSK',
      typeOptions: ['Text','Number','Select','Multi-select','Boolean'],
      extraPlaceholder: 'e.g. Operations',
      codeHeader: 'Attribute ID',
      typeHeader: 'Type',
      extraHeader: 'Question Group',
      sourceHeader: 'Source',
      hideTypeInCatalog: true,
      suffixes: ['riskAttributes', 'risk'],
      bundleField: 'risk',
      flatten: flattenNamed,
      library: [],
    },
    eligibility: {
      file: 'eligibility-studio.html',
      navId: 'eligibility',
      title: 'Eligibility Studio',
      cardTitle: 'Predefined eligibility rules',
      cardSubtitle: 'Shared eligibility templates and how many products currently use each one.',
      noun: 'rules',
      createLabel: 'rule',
      codePrefix: 'ELG',
      typeOptions: ['Product Eligibility','Cover Eligibility'],
      extraPlaceholder: 'e.g. All Covers',
      codeHeader: 'Rule ID',
      typeHeader: 'Category',
      extraHeader: 'Cover',
      suffixes: ['eligibilityRules', 'eligibility'],
      bundleField: 'eligibility',
      flatten: flattenNamed,
      library: [
        { name:'Minimum Driver Age', code:'ELG-CT-AGE', type:'Product Eligibility', extra:'All Covers', options:'Driver Age ≥ 21' },
        { name:'Minimum Years in Business', code:'ELG-CT-YIB', type:'Product Eligibility', extra:'All Covers', options:'Years in Business ≥ 2' },
        { name:'Maximum Operating Radius', code:'ELG-CT-RAD', type:'Product Eligibility', extra:'All Covers', options:'Operating Radius ≤ 500 miles' },
        { name:'Vehicle Type Allowlist', code:'ELG-CT-VEH', type:'Product Eligibility', extra:'All Covers', options:'Vehicle Type IN Tractor, Straight Truck' },
        { name:'Hazmat Eligibility', code:'ELG-CT-HAZ', type:'Cover Eligibility', extra:'Motor Truck Cargo', options:'Hazmat = False' },
        { name:'Maximum Loss Count', code:'ELG-CT-LOSS', type:'Product Eligibility', extra:'All Covers', options:'Loss Count ≤ 3' },
        { name:'Minimum CDL Experience', code:'ELG-CT-CDL', type:'Product Eligibility', extra:'All Covers', options:'CDL Experience ≥ 2' },
        { name:'Maximum Vehicle Age', code:'ELG-CT-VAGE', type:'Product Eligibility', extra:'All Covers', options:'Vehicle Age ≤ 15' }
      ]
    },
    rating: {
      file: 'rating-studio.html',
      navId: 'rating',
      title: 'Rating & Pricing Studio',
      cardTitle: 'Predefined rating components',
      cardSubtitle: 'Shared rating templates and how many products currently use each one.',
      noun: 'components',
      createLabel: 'component',
      codePrefix: 'RAT',
      typeOptions: ['Base','Factor','Loading','Discount','Fee','Tax'],
      extraPlaceholder: 'e.g. RISK FACTORS',
      codeHeader: 'Component ID',
      typeHeader: 'Type',
      extraHeader: 'Group',
      suffixes: ['ratingComponents', 'rating'],
      bundleField: 'rating',
      flatten: flattenRating,
      library: [
        { name:'Base Rate', code:'RAT-BR-001', type:'Base', extra:'BASE PREMIUM' },
        { name:'Driver Age Factor', code:'RAT-FAC-001', type:'Factor', extra:'RISK FACTORS' },
        { name:'Vehicle Age Factor', code:'RAT-FAC-002', type:'Factor', extra:'RISK FACTORS' },
        { name:'Territory Factor', code:'RAT-FAC-003', type:'Factor', extra:'RISK FACTORS' },
        { name:'Vehicle Use Factor', code:'RAT-FAC-004', type:'Factor', extra:'RISK FACTORS' },
        { name:'Claims History Factor', code:'RAT-FAC-005', type:'Factor', extra:'RISK FACTORS' },
        { name:'Conviction Loading', code:'RAT-LOAD-001', type:'Loading', extra:'LOADINGS' },
        { name:'No Claims Discount', code:'RAT-DISC-001', type:'Discount', extra:'DISCOUNTS' },
        { name:'Loyalty Discount', code:'RAT-DISC-002', type:'Discount', extra:'DISCOUNTS' },
        { name:'Policy Admin Fee', code:'RAT-FEE-001', type:'Fee', extra:'FEES' },
        { name:'GST / VAT', code:'RAT-TAX-002', type:'Tax', extra:'TAXES' }
      ]
    },
    underwriting: {
      file: 'underwriting-studio.html',
      navId: 'underwriting',
      title: 'Underwriting Studio',
      cardTitle: 'Predefined underwriting rules',
      cardSubtitle: 'Shared underwriting templates and how many products currently use each one.',
      noun: 'rules',
      createLabel: 'rule',
      codePrefix: 'UW',
      typeOptions: ['Decline','Refer','Accept'],
      extraPlaceholder: 'e.g. Commodity',
      codeHeader: 'Rule ID',
      typeHeader: 'Decision',
      extraHeader: 'Question Group',
      sourceHeader: 'Source',
      hideTypeInCatalog: true,
      suffixes: ['underwritingRules', 'underwriting'],
      bundleField: 'underwriting',
      flatten: flattenNamed,
      library: [],
    },
    distribution: {
      file: 'distribution-studio.html',
      navId: 'distribution',
      title: 'Distribution Studio',
      cardTitle: 'Predefined channels',
      cardSubtitle: 'Shared distribution channels and how many products currently use each one.',
      noun: 'channels',
      createLabel: 'channel',
      codePrefix: 'CHAN',
      typeOptions: ['Direct','Intermediary — Broker','Intermediary — Bank Partner','API Integration','Agency'],
      extraPlaceholder: 'e.g. 12%',
      codeHeader: 'Channel ID',
      typeHeader: 'Type',
      extraHeader: 'Commission',
      suffixes: ['channels'],
      bundleField: 'channels',
      flatten: list => {
        const arr = Array.isArray(list) ? list : [];
        return flattenNamed(arr).map((item, i) => Object.assign(item, { extra: arr[i]?.comm || item.extra }));
      },
      library: [
        { name:'Direct (Web)', code:'CHAN-D01', type:'Direct', extra:'0%' },
        { name:'Broker Portal', code:'CHAN-B01', type:'Intermediary — Broker', extra:'15%' },
        { name:'Bancassurance', code:'CHAN-BA01', type:'Intermediary — Bank Partner', extra:'12%' },
        { name:'API Partner', code:'CHAN-API01', type:'API Integration', extra:'10%' }
      ]
    },
    document: {
      file: 'document-studio.html',
      navId: 'document',
      title: 'Document Studio',
      cardTitle: 'Predefined documents',
      cardSubtitle: 'Shared document templates and how many products currently use each one.',
      noun: 'documents',
      createLabel: 'document',
      codePrefix: 'DOC',
      typeOptions: ['Core','Endorsement','Notice'],
      codeHeader: 'Document ID',
      typeHeader: 'Type',
      extraHeader: '',
      suffixes: ['documents'],
      bundleField: 'documents',
      flatten: flattenNamed,
      library: [
        { name:'Policy Schedule Template', code:'DOC-SCH-001', type:'Core', extra:'' },
        { name:'Certificate of Insurance', code:'DOC-CERT-001', type:'Core', extra:'' },
        { name:'Policy Wording — Motor Comp.', code:'DOC-WORD-001', type:'Core', extra:'' },
        { name:'General Exclusions Endorsement', code:'DOC-END-001', type:'Endorsement', extra:'' },
        { name:'Roadside Assistance Add-On', code:'DOC-END-002', type:'Endorsement', extra:'' },
        { name:'Welcome Letter Template', code:'DOC-NOT-001', type:'Notice', extra:'' },
        { name:'Renewal Notice Template', code:'DOC-NOT-002', type:'Notice', extra:'' }
      ]
    }
  };

  function catalogPickerHead(cfg) {
    const hideType = cfg.hideTypeInCatalog;
    const extraH = cfg.extraHeader || 'Detail';
    const sourceH = cfg.sourceHeader || 'Source';
    return `<th style="width:36px"></th><th>Risk Name</th><th>${esc(cfg.codeHeader || 'ID')}</th>${hideType ? '' : `<th>${esc(cfg.typeHeader || 'Type')}</th>`}<th>${esc(sourceH)}</th><th>${esc(extraH)}</th>`;
  }

  function catalogPickerCells(cfg, c, checkboxClass) {
    const hideType = cfg.hideTypeInCatalog;
    const source = c.source === 'product' ? 'Question' : (c.source === 'library' ? 'Library' : (c.source || 'Question'));
    const group = c.questionGroup || c.extra || '—';
    const cbClass = checkboxClass || 'hub-pick-cb';
    return `
          <td><input type="checkbox" class="${cbClass}" value="${esc(c.id)}" style="accent-color:var(--color-brand)"></td>
          <td style="font-weight:500">${esc(c.name)}</td>
          <td class="mono">${esc(c.code || '—')}</td>
          ${hideType ? '' : `<td>${esc(c.type || '—')}</td>`}
          <td><span class="rs-source-badge">${esc(source === 'Question' ? 'Question' : source)}</span></td>
          <td>${esc(group)}</td>`;
  }

  function ensureUnderwritingLibrary() {
    if (typeof PS.truckingUnderwritingRules !== 'function' || !STUDIO_LIBRARIES.underwriting) return;
    if (STUDIO_LIBRARIES.underwriting.library.length) return;
    STUDIO_LIBRARIES.underwriting.library = PS.truckingUnderwritingRules().map(r => ({
      name: r.name,
      code: r.id,
      type: (r.type || 'refer').charAt(0).toUpperCase() + (r.type || 'refer').slice(1),
      extra: r.questionGroup || r.cat || '',
      source: r.source || 'Risk',
      sourceStudio: r.sourceStudio || 'Underwriting Studio',
      questionGroup: r.questionGroup,
      riskAttribute: r.riskAttribute,
      riskAttributeId: r.riskAttributeId,
      assignedTo: r.assignedTo,
      fallbackUnderwriter: r.fallbackUnderwriter,
      priority: r.priority,
      desc: r.desc,
      condition: r.condition,
      out: r.out,
      prio: r.prio,
      auth: r.auth,
      audit: r.audit
    }));
  }
  function ensureRiskLibrary() {
    if (typeof PS.truckingRiskAttributes !== 'function' || !STUDIO_LIBRARIES.risk) return;
    if (STUDIO_LIBRARIES.risk.library.length) return;
    STUDIO_LIBRARIES.risk.library = PS.truckingRiskAttributes().map(r => ({
      name: r.name,
      code: r.id,
      type: r.type || 'Text',
      extra: r.questionGroup,
      source: r.source || 'Question',
      questionGroup: r.questionGroup,
      questionGroupId: r.questionGroupId
    }));
  }

  function catalogPickerColspan(cfg) {
    return cfg.hideTypeInCatalog ? 5 : 6;
  }

  function collectLibraryUsage(cfg) {
    if (cfg.navId === 'risk') ensureRiskLibrary();
    if (cfg.navId === 'underwriting') ensureUnderwritingLibrary();
    const app = PS.prototypeApp;
    const products = app?.state?.products || PS.data?.products || [];
    const details = app?.state?.productDetails || {};
    const collections = app?.state?.collections || {};
    const byProduct = new Map();
    const add = (productId, item) => {
      if (!productId || !item) return;
      if (!byProduct.has(productId)) byProduct.set(productId, []);
      byProduct.get(productId).push(item);
    };
    Object.keys(collections).forEach(key => {
      if (!cfg.suffixes.some(s => key.endsWith(`::${s}`))) return;
      const productId = key.split('::')[0];
      cfg.flatten(collections[key]).forEach(item => add(productId, item));
    });
    Object.entries(PS.studioSeeds || {}).forEach(([productId, seed]) => {
      cfg.flatten(seed[cfg.bundleField]).forEach(item => add(productId, item));
    });
    products.forEach(p => {
      const bundle = app?.getProductBundle?.(p.id, p.version);
      cfg.flatten(bundle?.[cfg.bundleField]).forEach(item => add(p.id, item));
    });
    const catalog = cfg.library.concat(PS.prototypeApp?.libraryExtrasFor?.(cfg.navId) || []);
    return catalog.map(lib => {
      const used = [];
      const seen = new Set();
      byProduct.forEach((items, productId) => {
        if (!items.some(item => libraryMatch(lib, item))) return;
        if (seen.has(productId)) return;
        seen.add(productId);
        const product = products.find(p => p.id === productId) || details[productId];
        used.push({ id: productId, name: product?.name || productId });
      });
      used.sort((a, b) => a.name.localeCompare(b.name));
      return Object.assign({}, lib, { products: used, productCount: used.length });
    });
  }

  function collectStudioCatalog(navId, skipProductId) {
    if (navId === 'risk') ensureRiskLibrary();
    if (navId === 'underwriting') ensureUnderwritingLibrary();
    const cfg = STUDIO_LIBRARIES[navId];
    if (!cfg) return [];
    const extras = PS.prototypeApp?.libraryExtrasFor?.(navId) || [];
    const lib = cfg.library.concat(extras).map((i, idx) => Object.assign({
      id: String(i.code || `lib-${navId}-${idx}`),
      source: 'library'
    }, i));
    const seen = new Set(lib.map(i => String(i.name || '').toLowerCase()).filter(Boolean));
    const fromProducts = [];
    const addFlat = (item, source) => {
      const n = String(item.name || item.label || '').toLowerCase();
      if (!n || seen.has(n)) return;
      seen.add(n);
      fromProducts.push({
        id: String(item.code || item.id || `p-${fromProducts.length}`),
        name: item.name || item.label,
        code: item.code || item.id || '',
        type: item.type || '',
        extra: item.extra || item.questionGroup || '',
        questionGroup: item.questionGroup || item.extra || '',
        questionGroupId: item.questionGroupId || '',
        source: item.source || (source === 'product' ? 'Question' : 'Library'),
        options: item.options || ''
      });
    };
    const collections = PS.prototypeApp?.state?.collections || {};
    Object.keys(collections).forEach(key => {
      if (!cfg.suffixes.some(s => key.endsWith(`::${s}`))) return;
      const pid = key.split('::')[0];
      if (skipProductId && pid === skipProductId) return;
      cfg.flatten(collections[key]).forEach(item => addFlat(item, 'product'));
    });
    Object.entries(PS.studioSeeds || {}).forEach(([pid, seed]) => {
      if (skipProductId && pid === skipProductId) return;
      cfg.flatten(seed[cfg.bundleField]).forEach(item => addFlat(item, 'product'));
    });
    return lib.concat(fromProducts);
  }

  function showStudioLibrary(navId) {
    const cfg = STUDIO_LIBRARIES[navId];
    if (!cfg) return false;
    ensureLibraryStyles();
    if (PS.nav?.render) PS.nav.render(cfg.navId, [{ label: cfg.title, href: '#' }]);
    const titleEl = document.querySelector('.page-title');
    if (titleEl) titleEl.textContent = cfg.title;
    const rows = collectLibraryUsage(cfg);
    const used = rows.filter(r => r.productCount > 0).length;
    const productTotal = new Set(rows.flatMap(r => r.products.map(p => p.id))).size;
    const subtitle = document.getElementById('studio-subtitle') || document.querySelector('.page-subtitle');
    if (subtitle) {
      subtitle.textContent = `Predefined ${cfg.noun} catalogue · ${rows.length} ${cfg.noun} · used in ${productTotal} product${productTotal === 1 ? '' : 's'}`;
    }
    document.getElementById('studio-product-workspace')?.classList.add('hidden');
    const actions = document.getElementById('product-studio-actions');
    if (actions) {
      actions.classList.remove('hidden');
      actions.innerHTML = `
        <a class="btn btn-secondary" href="catalogue.html">Product Catalogue</a>
        <button type="button" class="btn btn-primary" onclick="PS.studioLibrary.openCreate('${esc(cfg.navId)}')">+ Create ${esc(cfg.createLabel)}</button>`;
    }
    const root = document.getElementById('studio-library-root');
    if (!root) return true;
    root.classList.remove('hidden');
    const extraCol = cfg.extraHeader
      ? `<th>${esc(cfg.extraHeader)}</th>`
      : '';
    root.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${esc(cfg.cardTitle)}</div>
            <div class="card-subtitle">${esc(cfg.cardSubtitle)}</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="PS.studioLibrary.openCreate('${esc(cfg.navId)}')">+ Create ${esc(cfg.createLabel)}</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>${esc(cfg.codeHeader)}</th>
                <th>${esc(cfg.typeHeader)}</th>
                ${extraCol}
                <th class="text-center">Products</th>
                <th>Used in</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>
                    <div class="cs-name-cell">
                      <span class="cs-cover-icon" style="${iconStyle(i)}">${esc(initials(r.name))}</span>
                      <span>${esc(r.name)}</span>
                    </div>
                  </td>
                  <td class="mono">${esc(r.code)}</td>
                  <td>${esc(r.type)}</td>
                  ${cfg.extraHeader ? `<td>${esc(r.extra || '—')}</td>` : ''}
                  <td class="text-center"><span class="clib-count">${r.productCount}</span></td>
                  <td>
                    ${r.products.length
                      ? `<div class="clib-products">${r.products.map(p => `<a class="clib-chip" href="${cfg.file}?product=${encodeURIComponent(p.id)}">${esc(p.name)}</a>`).join('')}</div>`
                      : `<span class="clib-muted">Not used yet</span>`}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="card-footer">
          <span>${used} of ${rows.length} predefined ${cfg.noun} are linked to at least one product</span>
        </div>
      </div>`;
    return true;
  }

  function slugCode(prefix, name, existing) {
    const core = String(name || 'NEW').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase().slice(0, 18) || 'NEW';
    let code = `${prefix}-${core}`;
    let n = 2;
    const used = new Set((existing || []).map(i => String(i.code || '').toLowerCase()));
    while (used.has(code.toLowerCase())) {
      code = `${prefix}-${core}-${n++}`;
    }
    return code;
  }

  function openCreateLibraryItem(navId) {
    if (navId === 'distribution') {
      window.location.href = 'distribution-create.html';
      return;
    }
    const cfg = STUDIO_LIBRARIES[navId];
    if (!cfg || !PS.openModal) return;
    const extraField = cfg.extraHeader ? `
      <div class="form-group">
        <label class="form-label" for="slib-extra">${esc(cfg.extraHeader)}</label>
        <input type="text" id="slib-extra" class="form-control" placeholder="${esc(cfg.extraPlaceholder || '')}">
      </div>` : '';
    const typeField = (cfg.typeOptions || []).length
      ? `<select id="slib-type" class="form-control">${cfg.typeOptions.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
      : `<input type="text" id="slib-type" class="form-control" placeholder="Type">`;
    PS.openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Create ${esc(cfg.createLabel)}</h2>
        <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="form-group span-2">
            <label class="form-label" for="slib-name">Name <span class="required">*</span></label>
            <input type="text" id="slib-name" class="form-control" placeholder="e.g. New ${esc(cfg.createLabel)}">
          </div>
          <div class="form-group">
            <label class="form-label" for="slib-code">Code</label>
            <input type="text" id="slib-code" class="form-control" placeholder="Auto-generated if blank">
          </div>
          <div class="form-group">
            <label class="form-label" for="slib-type">${esc(cfg.typeHeader || 'Type')} <span class="required">*</span></label>
            ${typeField}
          </div>
          ${extraField}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" type="button" onclick="PS.closeModal()">Cancel</button>
        <button class="btn btn-primary" type="button" onclick="PS.studioLibrary.saveCreate('${esc(navId)}')">Create ${esc(cfg.createLabel)}</button>
      </div>`);
  }

  function saveCreateLibraryItem(navId) {
    const cfg = STUDIO_LIBRARIES[navId];
    if (!cfg) return;
    const name = document.getElementById('slib-name')?.value.trim();
    const type = document.getElementById('slib-type')?.value.trim();
    const extra = document.getElementById('slib-extra')?.value.trim() || '';
    if (!name) {
      PS.actionResult?.('error', 'Name required', `Enter a name for this ${cfg.createLabel}.`);
      return;
    }
    const catalog = cfg.library.concat(PS.prototypeApp?.libraryExtrasFor?.(navId) || []);
    if (catalog.some(i => String(i.name).toLowerCase() === name.toLowerCase())) {
      PS.actionResult?.('error', 'Already exists', `"${name}" is already in this catalogue.`);
      return;
    }
    const code = document.getElementById('slib-code')?.value.trim() || slugCode(cfg.codePrefix, name, catalog);
    if (catalog.some(i => String(i.code).toLowerCase() === code.toLowerCase())) {
      PS.actionResult?.('error', 'Code in use', `${code} is already used.`);
      return;
    }
    PS.prototypeApp?.addLibraryExtra?.(navId, { name, code, type: type || cfg.typeOptions?.[0] || '', extra });
    PS.closeModal();
    PS.actionResult?.('success', `${cfg.createLabel[0].toUpperCase()}${cfg.createLabel.slice(1)} created`, `${name} is now in the predefined catalogue.`);
    showStudioLibrary(navId);
  }

  PS.studioLibrary = {
    show: showStudioLibrary,
    openCreate: openCreateLibraryItem,
    saveCreate: saveCreateLibraryItem,
    catalog: collectStudioCatalog,
    configs: STUDIO_LIBRARIES
  };

  const hub = {
    cfg: null,
    productId: '',
    productVersion: '',
    productName: '',
    productStatus: 'draft',
    lastModified: '',
    lastModifiedBy: 'Anika Sharma',
    mode: 'hub',
    view: 'list',
    page: 1,
    pageSize: 10,

    items() {
      return this.cfg.getItems() || [];
    },

    mount(cfg) {
      this.cfg = cfg;
      const params = new URLSearchParams(location.search);
      if (!params.get('product') && !params.get('id')) {
        showStudioLibrary(cfg.navId);
        return;
      }
      const ctx = PS.prototypeApp?.context?.() || {};
      this.productId = params.get('product') || params.get('id') || ctx.productId || 'PRD-001';
      this.productVersion = params.get('version') || ctx.version || '2026.08';
      const product = PS.prototypeApp?.productById?.(this.productId);
      this.productName = product?.name || params.get('name') || this.productId;
      this.productStatus = product?.status || 'draft';
      if (PS.prototypeApp?.rememberContext) PS.prototypeApp.rememberContext({ productId: this.productId, version: this.productVersion });

      const back = document.getElementById('ctx-back-link');
      if (back) back.href = `product-detail.html?id=${encodeURIComponent(this.productId)}`;
      document.getElementById('customer-view-btn')?.remove();
      document.getElementById('view-product-btn')?.remove();

      this.renderShell();
      const bundle = PS.prototypeApp?.getProductBundle?.(this.productId, this.productVersion);
      this.applyBundle(bundle);
      this.lastModified = product?.lastModified || bundle?.product?.lastModified || '';
      this.lastModifiedBy = product?.lastModifiedBy || bundle?.product?.lastModifiedBy || product?.owner || 'Anika Sharma';
      const deep = params.get(cfg.deepParam || 'item');
      if (deep) {
        if (this.cfg.setActiveId) this.cfg.setActiveId(deep);
        this.mode = 'edit';
      }
      this.paint();
      this.loadRemote().then(() => this.paint());
      document.addEventListener('click', () => {
        document.querySelectorAll('.cs-kebab.open').forEach(el => el.classList.remove('open'));
      });
    },

    applyBundle(bundle) {
      const matched = bundle?.product?.id === this.productId ? bundle.product : null;
      if (matched?.name) this.productName = matched.name;
      if (matched?.status) this.productStatus = matched.status;
      const incoming = bundle?.[this.cfg.collection];
      const product = PS.prototypeApp?.productById?.(this.productId);
      if (Array.isArray(incoming) && incoming.length) this.cfg.applyItems(incoming);
      else if (PS.prototypeApp?.isNewStudioProduct?.(product)) this.cfg.applyItems([]);
      else if (this.items().length) PS.prototypeApp?.persistCollection?.(this.cfg.persist, this.cfg.persistTarget ? this.cfg.persistTarget() : this.cfg.getItems());
    },

    async loadRemote() {
      if (PS.prototypeApp?.hydrateFromWorkspace) {
        try { await PS.prototypeApp.hydrateFromWorkspace(); } catch (_) { /* offline prototype */ }
      }
      const product = PS.prototypeApp?.productById?.(this.productId);
      if (!product || PS.prototypeApp?.isNewStudioProduct?.(product)) return;
      try {
        const res = await fetch(`/api/runtime/products/${encodeURIComponent(this.productId)}`, { signal: AbortSignal.timeout(2500) });
        if (!res.ok) return;
        const data = await res.json();
        if (data.product?.name) this.productName = data.product.name;
        if (data.product?.status) this.productStatus = data.product.status;
        const incoming = data[this.cfg.apiField] || data[this.cfg.collection];
        if (Array.isArray(incoming) && incoming.length) {
          this.cfg.applyItems(incoming);
          PS.prototypeApp?.persistCollection?.(this.cfg.persist, this.cfg.persistTarget ? this.cfg.persistTarget() : this.cfg.getItems());
        }
      } catch (_) { /* keep local */ }
    },

    renderShell() {
      const host = document.getElementById('studio-hub');
      if (!host || host.dataset.ready) return;
      const noun = this.cfg.noun;
      host.className = 'studio-hub';
      host.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title" id="studio-hub-title">${esc(this.cfg.hubTitle)} (0)</div>
              <div class="card-subtitle">${esc(this.cfg.hubSubtitle)}</div>
            </div>
            <div class="cs-hub-toolbar">
              <span style="font-size:12px;color:var(--color-muted)">View as</span>
              <div class="cs-view-toggle" role="group" aria-label="View as">
                <button type="button" id="hub-view-list" class="active" onclick="PS.studioHub.setView('list')" aria-label="List view">☰</button>
                <button type="button" id="hub-view-grid" onclick="PS.studioHub.setView('grid')" aria-label="Grid view">⊞</button>
              </div>
              <div class="cs-search-wrap">
                <svg width="13" height="13" viewBox="0 0 256 256" fill="none"><path d="M229.66 218.34l-50.07-50.07a88 88 0 10-11.31 11.31l50.06 50.07a8 8 0 0011.32-11.31zM40 112a72 72 0 1172 72 72.08 72.08 0 01-72-72z" fill="currentColor"/></svg>
                <input class="cs-search" id="hub-search" type="search" placeholder="${esc(this.cfg.searchPlaceholder || `Search ${noun}...`)}" oninput="PS.studioHub.page=1; PS.studioHub.renderTable()">
              </div>
              <select class="cs-page-size" id="hub-filter" onchange="PS.studioHub.page=1; PS.studioHub.renderTable()" aria-label="Filter ${esc(noun)}">
                ${(this.cfg.filters || [{ value: 'all', label: 'All' }]).map(f => `<option value="${esc(f.value)}">${esc(f.label)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="table-wrap" id="studio-hub-table"></div>
          <div class="card-footer" id="studio-hub-footer"></div>
        </div>`;
      host.dataset.ready = '1';
      const backBtn = document.querySelector('#studio-editor .cs-back button');
      if (backBtn) backBtn.textContent = `← Back to ${noun}`;
    },

    paint() {
      if (!this.cfg) return;
      const band = document.getElementById('readonly-band');
      if (band) {
        const locked = this.productStatus === 'published' || this.productStatus === 'superseded' || this.productStatus === 'retired';
        band.style.display = locked ? '' : 'none';
      }
      if (PS.nav?.render) {
        PS.nav.render(this.cfg.navId, [
          { label: 'Product Catalogue', href: 'catalogue.html' },
          { label: this.productName, href: `product-detail.html?id=${this.productId}` },
          { label: `v${this.productVersion}`, href: `product-detail.html?id=${this.productId}&version=${this.productVersion}` },
          { label: this.cfg.studioLabel, href: '#' }
        ]);
      }
      this.refreshMeta();
      this.renderTable();
      if (typeof this.cfg.renderSidebar === 'function') this.cfg.renderSidebar();
      if (typeof this.cfg.onPaint === 'function') this.cfg.onPaint();
      if (this.mode === 'edit') this.showEditor();
      else this.showHub();
    },

    refreshMeta() {
      const items = this.items();
      const stats = this.cfg.stats ? this.cfg.stats(items) : [`${items.length} ${this.cfg.noun}`];
      const ctxStats = this.cfg.contextStats ? this.cfg.contextStats(items) : stats;
      const subtitle = document.getElementById('studio-subtitle') || document.querySelector('.page-subtitle');
      if (subtitle) {
        subtitle.id = 'studio-subtitle';
        subtitle.textContent = items.length
          ? `${this.productName} · v${this.productVersion} · ${stats.join(' · ')}`
          : `${this.productName} · v${this.productVersion} · no ${this.cfg.noun} configured yet`;
      }
      const ctx = document.getElementById('ctx-count');
      if (ctx) {
        ctx.innerHTML = `
          <span class="studio-context-pill">
            <svg width="12" height="12" viewBox="0 0 256 256" fill="none"><path d="M128 24a104 104 0 100 208A104 104 0 00128 24zm0 192a88 88 0 110-176 88 88 0 010 176zm64-88a8 8 0 01-8 8h-56a8 8 0 01-8-8V72a8 8 0 0116 0v48h48a8 8 0 018 8z" fill="currentColor"/></svg>
            ${esc(this.productId)} · v${esc(this.productVersion)}
          </span>
          ${ctxStats.map(s => `<span class="cs-stat">${esc(s)}</span>`).join('')}`;
      }
      const title = document.getElementById('studio-hub-title');
      if (title) title.textContent = `${this.cfg.hubTitle} (${items.length})`;
      PS.prototypeApp?.refreshStudioNav?.();
    },

    productLabel() {
      return this.productName || this.productId || '—';
    },

    productCellHtml() {
      return `<div class="cs-product"><span>${esc(this.productLabel())}</span><small>${esc(this.productId)}</small></div>`;
    },

    tableColumns() {
      const cols = (this.cfg.columns || []).slice();
      if (this.cfg.skipProductColumn) return cols;
      const productCol = { header: 'Product', kind: 'product', value: () => this.productLabel() };
      const insertAt = Math.max(cols.findIndex(c => c.primary) + 1, 1);
      cols.splice(insertAt, 0, productCol);
      return cols;
    },

    filtered() {
      const q = (document.getElementById('hub-search')?.value || '').trim().toLowerCase();
      const filter = document.getElementById('hub-filter')?.value || 'all';
      const productHit = `${this.productName} ${this.productId}`.toLowerCase().includes(q);
      return this.items().filter(item => {
        if (this.cfg.matchFilter && !this.cfg.matchFilter(item, filter)) return false;
        if (!q) return true;
        if (productHit) return true;
        const keys = this.cfg.searchKeys || ['name', 'id', 'label'];
        const extra = typeof this.cfg.itemSearchText === 'function' ? String(this.cfg.itemSearchText(item) || '') : '';
        return keys.some(k => String(item[k] || '').toLowerCase().includes(q)) || extra.toLowerCase().includes(q);
      });
    },

    setView(mode) {
      this.view = mode === 'grid' ? 'grid' : 'list';
      document.getElementById('hub-view-list')?.classList.toggle('active', this.view === 'list');
      document.getElementById('hub-view-grid')?.classList.toggle('active', this.view === 'grid');
      this.renderTable();
    },

    showHub() {
      this.mode = 'hub';
      document.getElementById('studio-hub')?.classList.remove('hidden');
      document.getElementById('rating-gui')?.classList.remove('hidden');
      document.getElementById('studio-editor')?.classList.add('hidden');
    },

    showEditor() {
      this.mode = 'edit';
      document.getElementById('studio-hub')?.classList.add('hidden');
      document.getElementById('rating-gui')?.classList.add('hidden');
      document.getElementById('studio-editor')?.classList.remove('hidden');
      const id = this.cfg.getActiveId ? this.cfg.getActiveId() : '';
      if (typeof this.cfg.renderSidebar === 'function') this.cfg.renderSidebar();
      if (id && typeof this.cfg.loadItem === 'function') this.cfg.loadItem(id);
    },

    open(id) {
      if (id && this.cfg.setActiveId) this.cfg.setActiveId(id);
      if (typeof this.cfg.onOpenItem === 'function') {
        this.cfg.onOpenItem(id);
        return;
      }
      this.showEditor();
    },

    back() {
      this.showHub();
      this.renderTable();
    },

    toggleMenu(event, id) {
      event.stopPropagation();
      document.querySelectorAll('.cs-kebab.open').forEach(el => { if (el.id !== `hub-kebab-${id}`) el.classList.remove('open'); });
      document.getElementById(`hub-kebab-${id}`)?.classList.toggle('open');
    },

    remove(id) {
      if (typeof this.cfg.removeItem === 'function') this.cfg.removeItem(id);
      else {
        const items = this.cfg.getItems();
        const idx = items.findIndex(i => i.id === id);
        if (idx >= 0) items.splice(idx, 1);
      }
      PS.prototypeApp?.persistCollection?.(this.cfg.persist, this.cfg.persistTarget ? this.cfg.persistTarget() : this.cfg.getItems());
      this.renderTable();
      if (typeof this.cfg.renderSidebar === 'function') this.cfg.renderSidebar();
    },

    defaultImportedItem(lib, id) {
      const nav = this.cfg.navId;
      const base = {
        id,
        name: lib.name,
        code: lib.code || id,
        status: 'draft',
        lastUpdated: new Date().toISOString().slice(0, 10),
        lastUpdatedBy: this.lastModifiedBy || 'Anika Sharma'
      };
      if (nav === 'underwriting') {
        const group = lib.questionGroup || lib.extra || 'Operations';
        return Object.assign(base, {
          id: lib.code || id,
          type: String(lib.type || 'Refer').toLowerCase(),
          priority: lib.priority || 20,
          source: lib.source || 'Risk',
          questionGroup: group,
          riskAttributeId: lib.riskAttributeId || '',
          riskAttribute: lib.riskAttribute || '',
          cat: group,
          assignedTo: lib.assignedTo || '—',
          fallbackUnderwriter: lib.fallbackUnderwriter || '—',
          desc: lib.desc || `${lib.name} copied from the shared library.`,
          condition: lib.condition || { groups: [{ logic: 'AND', rows: [] }] },
          out: lib.out || { type: String(lib.type || 'Refer') },
          prio: lib.prio || {},
          auth: lib.auth || { min: 'Underwriter', reqRsn: true, audit: 'Always' },
          audit: lib.audit || []
        });
      }
      if (nav === 'risk') {
        const group = lib.questionGroup || lib.extra || 'Operations';
        return Object.assign(base, {
          id: lib.code || id,
          type: lib.type || 'Text',
          source: lib.source || 'Question',
          questionGroup: group,
          questionGroupId: lib.questionGroupId || String(group).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: group,
          extra: group,
          options: lib.options || '',
          required: false,
          description: lib.description || `${lib.name} — risk attribute from the ${group} question group.`
        });
      }
      if (nav === 'eligibility') {
        const match = (typeof window.matchLibraryRuleToRiskAttr === 'function')
          ? window.matchLibraryRuleToRiskAttr(lib)
          : null;
        return Object.assign({}, base, {
          category: lib.type || 'Product Eligibility',
          cover: lib.extra || 'All Covers',
          description: lib.options || `${lib.name} copied from the shared rule library onto this product.`,
          source: 'Rule Library',
          direction: 'ineligible',
          logic: 'and',
          conditions: match ? [match] : [{ attributeId: '', sourceQuestionId: '', field: '', op: '', value: '', connector: 'AND' }],
          outcomeType: 'hard',
          reasonCode: `ELIG-${String(id).replace(/\D/g, '').slice(-4) || 'NEW'}`,
          customerMsg: 'This risk does not meet eligibility requirements for this product.',
          internalMsg: 'Eligibility rule triggered from the shared library.',
          logAudit: true,
          lastUpdated: new Date().toISOString().slice(0, 10),
          effectiveFrom: '—',
          effectiveTo: '—',
          scopes: {
            product: this.productName || 'This product',
            version: this.productVersion ? `v${this.productVersion}` : '—',
            covers: [lib.extra && lib.extra !== 'Operations' ? lib.extra : 'All Covers'],
            segments: ['All Segments'],
            channels: ['All Channels'],
            jurisdictions: ['All configured jurisdictions']
          }
        });
      }
      if (nav === 'distribution') {
        return Object.assign(base, {
          type: lib.type || 'Direct',
          icon: '•',
          comm: '0%',
          desc: `${lib.name} copied from the shared library.`,
          auth: '—',
          territories: [],
          commConfig: { type: 'None', rate: '0%' },
          rules: [],
          accessModel: '—',
          intermediaries: []
        });
      }
      if (nav === 'document') {
        const type = lib.type || 'Core';
        return Object.assign(base, {
          type,
          ver: 'v1',
          icon: '📄',
          identity: { type, format: 'PDF', lang: 'English', jur: '—', author: '—' },
          trigger: { when: 'Policy Issued', auto: true, del: 'Email', copies: '1', reGen: 'No' },
          cond: { always: true, logic: [] },
          vars: [],
          comp: { req: false, rev: '—', d: '—', notes: '', legal: false, ref: '—' },
          covers: []
        });
      }
      return base;
    },

    catalogRows() {
      return collectStudioCatalog(this.cfg.navId, this.productId);
    },

    importCatalogItems(items) {
      const prefix = STUDIO_LIBRARIES[this.cfg.navId]?.codePrefix || 'ITM';
      const existing = new Set(this.items().map(i => String(i.name || i.label || '').toLowerCase()));
      const incoming = [];
      (items || []).forEach(lib => {
        if (this.cfg.navId === 'eligibility' && typeof window.canImportEligibilityLibraryItem === 'function' && !window.canImportEligibilityLibraryItem(lib)) return;
        const n = String(lib.name || '').toLowerCase();
        if (!n || existing.has(n)) return;
        existing.add(n);
        const id = `${prefix}-${Date.now().toString(36)}${Math.random().toString(16).slice(2, 5)}`;
        incoming.push({ lib, id });
      });
      if (!incoming.length) return 0;
      if (typeof this.cfg.importLibraryRows === 'function') {
        this.cfg.importLibraryRows(incoming.map(({ lib, id }) => Object.assign({}, lib, { newId: id })));
      } else if (this.cfg.navId === 'rating') {
        const current = this.items().slice();
        incoming.forEach(({ lib, id }) => {
          current.push({
            id,
            name: lib.name,
            type: String(lib.type || 'factor').toLowerCase(),
            groupLabel: lib.extra || 'OTHER',
            group: lib.extra || 'OTHER',
            value: '—',
            status: 'draft'
          });
        });
        this.cfg.applyItems(current);
      } else {
        const list = this.cfg.getItems();
        incoming.forEach(({ lib, id }) => list.push(this.defaultImportedItem(lib, id)));
        if (typeof this.cfg.applyItems === 'function') this.cfg.applyItems(list.slice());
      }
      PS.prototypeApp?.persistCollection?.(this.cfg.persist, this.cfg.persistTarget ? this.cfg.persistTarget() : this.cfg.getItems());
      this.paint();
      return incoming.length;
    },

    emptyPickerHtml() {
      if (typeof this.cfg.emptyHtml === 'function') return this.cfg.emptyHtml();
      const cfg = STUDIO_LIBRARIES[this.cfg.navId] || {};
      const catalog = this.catalogRows();
      const noun = this.cfg.noun;
      const createLabel = cfg.createLabel || 'item';
      const extraH = cfg.extraHeader || 'Detail';
      return `
        <div class="cs-empty" style="text-align:left;max-width:none;padding:20px">
          <div style="font-size:16px;font-weight:650;margin-bottom:6px;color:var(--color-ink)">No ${esc(noun)} on this product yet</div>
          <div style="font-size:13px;color:var(--color-muted);margin-bottom:16px">Use ${esc(noun)} that already exist in the library or on other products, or create a new one. After you add an item you can open it to update it.</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
            ${this.cfg.addOnclick ? `<button class="btn btn-primary" type="button" onclick="${this.cfg.addOnclick}">+ Create new ${esc(createLabel)}</button>` : ''}
            <button class="btn btn-secondary" type="button" onclick="PS.studioHub.openCatalogModal()">Use already made ${esc(noun)}</button>
          </div>
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px">
            <div style="font-size:13px;font-weight:600">Existing ${esc(noun)} (${catalog.length})</div>
            <input type="search" id="hub-pick-filter" class="form-control" placeholder="Filter existing ${esc(noun)}…" style="max-width:260px;height:34px" oninput="PS.studioHub.renderTable()">
          </div>
          <div style="max-height:280px;overflow:auto;border:1px solid var(--color-border);border-radius:8px">
            <table>
              <thead><tr>
                ${catalogPickerHead(cfg)}
              </tr></thead>
              <tbody id="hub-pick-body">${this.pickerRowsHtml(catalog)}</tbody>
            </table>
          </div>
          <div style="margin-top:12px;display:flex;justify-content:flex-end">
            <button class="btn btn-primary" type="button" onclick="PS.studioHub.useCheckedCatalog()">Add selected to this product</button>
          </div>
        </div>`;
    },

    pickerRowsHtml(catalog) {
      const q = (document.getElementById('hub-pick-filter')?.value || '').trim().toLowerCase();
      const rows = (catalog || []).filter(c => {
        if (!q) return true;
        return [c.name, c.code, c.type, c.extra, c.source].join(' ').toLowerCase().includes(q);
      });
      if (!rows.length) return `<tr><td colspan="${catalogPickerColspan(STUDIO_LIBRARIES[this.cfg.navId] || {})}" class="text-muted" style="padding:12px">No existing items match this filter.</td></tr>`;
      const cfg = STUDIO_LIBRARIES[this.cfg.navId] || {};
      return rows.map(c => `
        <tr>
          ${catalogPickerCells(cfg, c)}
        </tr>`).join('');
    },

    useCheckedCatalog() {
      const catalog = this.catalogRows();
      const ids = Array.from(document.querySelectorAll('.hub-pick-cb:checked')).map(cb => cb.value);
      const items = catalog.filter(c => ids.includes(String(c.id)));
      if (!items.length) {
        PS.actionResult?.('error', 'Nothing selected', 'Tick existing items to use, or create a new one.');
        return;
      }
      const added = this.importCatalogItems(items);
      PS.actionResult?.('success', added ? 'Added to product' : 'Already on product', added
        ? `${added} item${added === 1 ? '' : 's'} added from the existing catalogue. Open one to update it.`
        : 'Selected items are already on this product.');
    },

    openCatalogModal() {
      const cfg = STUDIO_LIBRARIES[this.cfg.navId] || {};
      const catalog = this.catalogRows();
      const noun = this.cfg.noun;
      PS.openModal(`
        <div class="modal-header">
          <h2 class="modal-title">Use existing ${esc(noun)}</h2>
          <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <p style="font-size:13px;color:var(--color-muted);margin:0 0 12px">Copied onto this product so you can update them here without changing the library.</p>
          <input type="search" class="form-control" placeholder="Search existing ${esc(noun)}…" style="height:36px;margin-bottom:12px" oninput="PS.studioHub.filterCatalogModal(this.value)">
          <div style="max-height:360px;overflow:auto;border:1px solid var(--color-border);border-radius:8px">
            <table>
              <thead><tr>
                ${catalogPickerHead(cfg)}
              </tr></thead>
              <tbody id="hub-lib-body">${catalog.map(c => `
                <tr data-q="${esc([c.name, c.code, c.type, c.source, c.extra, c.questionGroup].join(' ').toLowerCase())}">
                  ${catalogPickerCells(cfg, c, 'hub-lib-cb')}
                </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" type="button" onclick="PS.closeModal()">Cancel</button>
          <button class="btn btn-primary" type="button" onclick="PS.studioHub.importCatalogModal()">Add selected</button>
        </div>`, 'modal-lg');
    },

    filterCatalogModal(value) {
      const q = String(value || '').toLowerCase();
      document.querySelectorAll('#hub-lib-body tr').forEach(tr => {
        tr.style.display = !q || (tr.getAttribute('data-q') || '').includes(q) ? '' : 'none';
      });
    },

    importCatalogModal() {
      const catalog = this.catalogRows();
      const ids = Array.from(document.querySelectorAll('.hub-lib-cb:checked')).map(cb => cb.value);
      const items = catalog.filter(c => ids.includes(String(c.id)));
      if (!items.length) {
        PS.actionResult?.('error', 'No items selected', 'Select at least one existing item, or create a new one.');
        return;
      }
      const added = this.importCatalogItems(items);
      PS.closeModal();
      PS.actionResult?.('success', added ? 'Added to product' : 'Already on product', added
        ? `${added} existing item${added === 1 ? '' : 's'} added. Open one to update it.`
        : 'Those items are already on this product.');
    },

    cellValue(col, item) {
      if (typeof col.value === 'function') return col.value(item) ?? '';
      return item[col.key] ?? '';
    },

    renderTable() {
      this.refreshMeta();
      const wrap = document.getElementById('studio-hub-table');
      const footer = document.getElementById('studio-hub-footer');
      if (!wrap) return;
      const all = this.items();
      const rows = this.filtered();
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / this.pageSize) || 1);
      if (this.page > pages) this.page = pages;
      const start = total ? (this.page - 1) * this.pageSize + 1 : 0;
      const end = Math.min(this.page * this.pageSize, total);
      const pageRows = rows.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
      const cols = this.tableColumns();
      const noun = this.cfg.noun;
      const hideUpdated = this.cfg.hideLastUpdated === true;

      if (!all.length) {
        wrap.innerHTML = this.emptyPickerHtml();
        if (footer) footer.innerHTML = `<span>Showing 0 ${esc(noun)}</span>`;
        return;
      }

      if (!pageRows.length) {
        wrap.innerHTML = `<div class="cs-empty">No ${esc(noun)} match this search or filter.</div>`;
      } else if (this.view === 'grid') {
        wrap.innerHTML = `<div class="cs-grid">${pageRows.map((item, i) => {
          const name = this.cellValue(cols[0] || { key: 'name' }, item) || item.name || item.label || item.id;
          const extra = (cols.find(c => c.mono) ? this.cellValue(cols.find(c => c.mono), item) : item.id) || '';
          return `
          <div class="cs-grid-card" onclick="PS.studioHub.open('${esc(item.id)}')">
            <div class="cs-name-cell" style="margin-bottom:10px">
              <span class="cs-cover-icon" style="${iconStyle(start + i - 1)}">${esc(initials(name))}</span>
              <div>
                <div>${esc(name)}</div>
                <div class="text-mono" style="font-size:12px;color:var(--color-muted)">${esc(extra)}</div>
              </div>
            </div>
            <div class="cs-product" style="margin-bottom:8px"><span>${esc(this.productLabel())}</span><small>${esc(this.productId)}</small></div>
          </div>`;
        }).join('')}</div>`;
      } else {
        wrap.innerHTML = `
          <table>
            <thead>
              <tr>
                <th style="width:48px">#</th>
                ${cols.map(c => `<th>${esc(c.header)}</th>`).join('')}
                ${hideUpdated ? '' : '<th>Last Updated</th>'}
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pageRows.map((item, i) => {
                const name = this.cellValue(cols[0] || { key: 'name' }, item) || item.name || item.label || item.id;
                const created = this.cfg.isCreated ? this.cfg.isCreated(item) : item.status !== 'incomplete' && item.status !== 'pending' && item.status !== 'draft';
                const statusText = this.cfg.statusLabel ? this.cfg.statusLabel(item) : (created ? 'Created' : 'Draft');
                const rowMenu = typeof this.cfg.rowMenuHtml === 'function'
                  ? this.cfg.rowMenuHtml(item)
                  : `<button type="button" onclick="PS.studioHub.open('${esc(item.id)}')">Configure</button>
                        <button type="button" onclick="PS.studioHub.remove('${esc(item.id)}')">Remove from product</button>`;
                return `
                <tr class="cs-table-row" onclick="PS.studioHub.open('${esc(item.id)}')">
                  <td style="color:var(--color-muted)">${start + i}</td>
                  ${cols.map((c, ci) => {
                    const raw = this.cellValue(c, item);
                    if (c.kind === 'status' || c.kind === 'rule-status') {
                      const s = String(c.kind === 'rule-status' ? (item.status || raw || 'draft') : raw).toLowerCase();
                      const ok = s === 'active' || String(raw).toLowerCase() === 'approved' || String(raw).toLowerCase() === 'done' || (c.kind !== 'rule-status' && created);
                      const label = c.kind === 'rule-status' ? (this.cfg.statusLabel ? this.cfg.statusLabel(item) : s.toUpperCase()) : statusText;
                      const cls = s === 'active' ? '' : s === 'inactive' ? 'inactive' : 'draft';
                      return `<td><span class="cs-status ${ok && s === 'active' ? '' : cls}">${s === 'active' ? '✓' : '○'} ${esc(label)}</span></td>`;
                    }
                    if (c.kind === 'source-badge' || c.kind === 'source-studio-badge') {
                      const key = String(raw || 'risk').toLowerCase().replace(/[^a-z]/g, '');
                      return `<td><span class="uw-source-badge uw-src-${esc(key)}">${esc(String(raw || 'Risk').toUpperCase())}</span></td>`;
                    }
                    if (c.kind === 'decision') {
                      const t = String(raw || '').toLowerCase();
                      return `<td><span class="rule-outcome-badge outcome-${t}">${esc(String(raw || '').toUpperCase())}</span></td>`;
                    }
                    if (c.kind === 'pill') {
                      const on = c.pillOn ? c.pillOn(item) : false;
                      return `<td><span class="cs-pill ${on ? 'cs-pill-mandatory' : 'cs-pill-optional'}">${esc(raw)}</span></td>`;
                    }
                    if (c.kind === 'product') {
                      return `<td>${this.productCellHtml()}</td>`;
                    }
                    if (ci === 0) {
                      return `<td><div class="cs-name-cell"><span class="cs-cover-icon" style="${iconStyle(start + i - 1)}">${esc(initials(name))}</span><span>${esc(raw)}</span></div></td>`;
                    }
                    return `<td class="${c.mono ? 'mono' : 'cs-type'}">${esc(raw)}</td>`;
                  }).join('')}
                  ${hideUpdated ? '' : `<td>
                    <div class="cs-updated">
                      <span>${esc(item.lastUpdated || this.lastModified || '—')}</span>
                      <small>By ${esc(item.lastUpdatedBy || this.lastModifiedBy)}</small>
                    </div>
                  </td>`}
                  <td class="text-center" onclick="event.stopPropagation()">
                    <div class="cs-kebab" id="hub-kebab-${esc(item.id)}">
                      <button class="btn btn-icon btn-sm" type="button" aria-label="Actions" onclick="PS.studioHub.toggleMenu(event, '${esc(item.id)}')">⋮</button>
                      <div class="cs-kebab-menu">${rowMenu}</div>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`;
      }

      if (footer) {
        const pageButtons = Array.from({ length: pages }, (_, n) => {
          const p = n + 1;
          return `<button type="button" ${p === this.page ? 'aria-current="page"' : ''} onclick="PS.studioHub.page=${p}; PS.studioHub.renderTable()">${p}</button>`;
        }).join('');
        footer.innerHTML = `
          <span>Showing ${start} to ${end} of ${total} ${esc(noun)}</span>
          <div class="cs-pager">
            <button type="button" ${this.page <= 1 ? 'disabled' : ''} onclick="PS.studioHub.page=Math.max(1,PS.studioHub.page-1); PS.studioHub.renderTable()">‹</button>
            ${pageButtons}
            <button type="button" ${this.page >= pages ? 'disabled' : ''} onclick="PS.studioHub.page=Math.min(${pages},PS.studioHub.page+1); PS.studioHub.renderTable()">›</button>
            <select class="cs-page-size" onchange="PS.studioHub.pageSize=Number(this.value)||10; PS.studioHub.page=1; PS.studioHub.renderTable()">
              ${[5, 10, 25].map(n => `<option value="${n}" ${n === this.pageSize ? 'selected' : ''}>${n} / page</option>`).join('')}
            </select>
          </div>`;
      }
    }
  };

  PS.studioHub = hub;
})();
