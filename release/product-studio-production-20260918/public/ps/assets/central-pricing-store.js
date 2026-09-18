/* Shared central pricing data for the browser-only prototype. */
(function () {
  'use strict';
  window.PS = window.PS || {};
  const KEY = 'insurance-product-studio-central-pricing-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  function defaults() {
    return {
      schemaVersion:1,
      templates:[
        { id:'motor-truck', type:'template', family:'Trucking', match:'Commercial Truck', name:'Commercial truck · Comprehensive', base:1850, unit:'per year', source:'Trucking pricing library', evidence:'Based on 18 comparable heavy-vehicle products', reviewed:'2026-08-12', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-015'] },
        { id:'cyber-sme', type:'template', family:'Cyber', match:'Cyber', name:'Cyber liability · SME', base:2400, unit:'per year', source:'Cyber pricing library', evidence:'Based on 24 comparable cyber products', reviewed:'2026-08-20', effectiveFrom:'2026-09-01', status:'active', linkedProductIds:['PRD-020'] },
        { id:'general', type:'template', family:'General', match:'', name:'General insurance starter', base:300, unit:'per year', source:'Central pricing library', evidence:'Conservative portfolio benchmark', reviewed:'2026-08-18', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:[] }
      ],
      discounts:[
        { id:'discount-claim-free', type:'discount', name:'Claim-free reward', displayValue:'3% / 7% / 12%', bands:[{ years:1, value:3 },{ years:3, value:7 },{ years:5, value:12 }], eligibility:'1, 3, and 5 completed claim-free years', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-015'] },
        { id:'discount-loyalty', type:'discount', name:'Renewing customer', value:5, displayValue:'5%', eligibility:'Customer is renewing an active policy', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-015','PRD-020'] },
        { id:'discount-multi', type:'discount', name:'More than one policy', value:8, displayValue:'8%', eligibility:'Customer holds another active policy', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-015','PRD-020'] }
      ],
      charges:[
        { id:'charge-admin', type:'charge', key:'admin', name:'Policy administration', kind:'fixed', value:18, jurisdiction:'All', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-015','PRD-020','PRD-011'] },
        { id:'charge-stamp', type:'charge', key:'stamp', name:'Stamp duty', kind:'fixed', value:6, jurisdiction:'India', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-015'] },
        { id:'charge-tax', type:'charge', key:'tax', name:'Insurance tax', kind:'percent', value:18, jurisdiction:'India', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-015','PRD-020'] }
      ],
      history:[
        { id:'CPH-001', at:'2026-08-20T10:15:00.000Z', user:'Rajan Mehta', role:'Pricing Actuary', action:'Reviewed', record:'Group health · Corporate', before:'$160 per member / month', after:'$165 per member / month' },
        { id:'CPH-002', at:'2026-08-18T14:30:00.000Z', user:'Rajan Mehta', role:'Pricing Actuary', action:'Activated', record:'Motor portfolio prices', before:'July 2026 values', after:'August 2026 values' }
      ]
    };
  }

  function mergeById(existing, seeded) {
    const list = existing.slice();
    seeded.forEach(item => {
      if (!list.some(row => row.id === item.id)) list.push(clone(item));
      else {
        const idx = list.findIndex(row => row.id === item.id);
        if (Array.isArray(item.linkedProductIds)) {
          const ids = new Set([...(list[idx].linkedProductIds || []), ...item.linkedProductIds]);
          list[idx].linkedProductIds = Array.from(ids);
        }
      }
    });
    return list;
  }

  function normalize(value) {
    const base = defaults();
    if (!value || value.schemaVersion !== 1) return base;
    return {
      schemaVersion:1,
      templates: mergeById(Array.isArray(value.templates) ? value.templates : [], base.templates),
      discounts: mergeById(Array.isArray(value.discounts) ? value.discounts : [], base.discounts),
      charges: mergeById(Array.isArray(value.charges) ? value.charges : [], base.charges),
      history: Array.isArray(value.history) ? value.history : base.history
    };
  }

  function getState() {
    try { return clone(normalize(JSON.parse(localStorage.getItem(KEY)))); }
    catch (_) { return clone(defaults()); }
  }

  function replace(state, detail) {
    const normalized = normalize(state);
    localStorage.setItem(KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('central-pricing-updated', { detail:detail || {} }));
    return clone(normalized);
  }

  function active(items) { return items.filter(item => item.status === 'active'); }

  function templateFor(product) {
    const state = getState();
    const family = String(product?.family || 'General').toLowerCase();
    const name = String(product?.name || '').toLowerCase();
    const candidates = active(state.templates).filter(item => String(item.family).toLowerCase() === family);
    const named = candidates.filter(item => item.match && name.includes(String(item.match).toLowerCase()))
      .sort((a, b) => String(b.match).length - String(a.match).length);
    return clone(named[0] || candidates.find(item => !item.match) || candidates[0] || active(state.templates).find(item => item.family === 'General') || state.templates[0]);
  }

  function addHistory(state, entry) {
    state.history.unshift(Object.assign({ id:`CPH-${Date.now()}`, at:now(), user:window.PS?.data?.currentUser?.name || 'Anika Sharma', role:window.PS?.prototypeApp?.state?.currentRole || window.PS?.data?.currentUser?.role || 'Product Manager' }, entry));
    state.history = state.history.slice(0, 250);
    return state;
  }

  PS.centralPricing = { KEY, defaults, getState, replace, active, templateFor, addHistory, reset(){ localStorage.removeItem(KEY); window.dispatchEvent(new CustomEvent('central-pricing-updated')); } };
})();
