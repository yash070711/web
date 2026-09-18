/* ============================================================
   Platform Admin Catalog — every picklist and extra field
   Persists in localStorage and is read by studios at render time.
   ============================================================ */
(function () {
  window.PS = window.PS || {};
  const STORE = 'ps-admin-catalog-v1';

  const SCHEMA = [
    {
      group: 'Product Catalogue',
      lists: [
        { key: 'productFamilies', label: 'Product families', items: ['Transportation', 'Property'] },
        { key: 'productTypes', label: 'Product types', items: ['Commercial Auto', 'Personal Auto', 'Inland Marine', 'Commercial Property', 'Homeowners'] },
        { key: 'linesOfBusiness', label: 'Lines of business', items: ['Commercial Auto', 'Personal Auto', 'Inland Marine', 'Commercial Property', 'Homeowners'] },
        { key: 'carriers', label: 'Carriers', items: ['Veridex Insurance', 'Example Carrier', 'Pacific Specialty', 'Harbor Mutual'] },
        { key: 'mgaOptions', label: 'MGA options', items: ['Summit MGA', 'Atlantic Risk MGA', 'Example MGA', 'Pacific Coast MGA', 'Midwest Specialty MGA', 'Harbor Point MGA'] },
        { key: 'productOwners', label: 'Product owners', items: ['Anuj', 'Vikram', 'Ayushi', 'Dev'] },
        { key: 'productStatuses', label: 'Product statuses', items: ['Draft', 'Active', 'Inactive', 'Archived'] },
        { key: 'marketSegments', label: 'Market segments', items: ['Personal Lines', 'Commercial Lines', 'Group', 'Specialty'] },
        { key: 'pageSizes', label: 'Table page sizes', items: ['5 / page', '10 / page', '25 / page', '50 / page', '100 / page'] }
      ]
    },
    {
      group: 'Class of Business',
      lists: [
        { key: 'coverTypes', label: 'Cover types', items: ['First Party — Property Damage', 'Third Party Liability', 'Commercial Auto Liability', 'Benefit — Personal Accident', 'Benefit — Life', 'Service Benefit', 'First Party — Glass', 'Business Interruption', 'First Party — Cargo', 'First Party — Crime', 'First Party — Working Risk'] },
        { key: 'coverAvailability', label: 'Availability', items: ['Mandatory', 'Optional', 'Default-Selected', 'Optional Add-on'] },
        { key: 'percentOf', label: '% of (limit basis)', items: ['Insured Value', 'Sum Insured', 'Agreed Value', 'Market Value', 'Reinstatement Cost'] },
        { key: 'waitingPeriods', label: 'Waiting periods', items: ['None', '14 days', '30 days', '60 days', '90 days'] },
        { key: 'dependencyTypes', label: 'Dependency types', items: ['Requires', 'Excludes', 'Bundles with'] },
        { key: 'constraintFields', label: 'Constraint fields', items: ['Vehicle Age', 'Vehicle Type', 'Insured Value', 'Vehicle Registration', 'Driver Age', 'Usage', 'Sum Insured', 'NCD'] },
        { key: 'constraintOperators', label: 'Constraint operators', items: ['≤', '≥', '=', 'is', 'is one of', 'is not'] },
        { key: 'lossBasis', label: 'Loss basis', items: ['Per Occurrence', 'Per Person', 'Per Call-out (max 3/year)', 'Per Claim'] },
        { key: 'reinstatement', label: 'Reinstatement', items: ['Automatic (full limit)', 'Automatic (annual)', 'None — total loss', 'None (aggregate)'] },
        { key: 'benefitBasis', label: 'Benefit basis', items: ['Indemnity', 'Fixed Benefit', 'Service', 'Agreed Value'] },
        { key: 'notifUnits', label: 'Notification units', items: ['days', 'hours', 'Immediate'] },
        { key: 'deductibleTypes', label: 'Deductible types', items: ['Fixed', '% Claim', 'None'] }
      ]
    },
    {
      group: 'Questionnaire Guide',
      lists: [
        { key: 'questionTypes', label: 'Question types', items: ['Text', 'Textarea', 'Number', 'Currency', 'Date', 'Boolean', 'Single-select', 'Multi-select', 'Entity Lookup', 'Attachment', 'Repeatable Group', 'Date Range', 'Address'] },
        { key: 'questionChannels', label: 'Question channels', items: ['web', 'mobile', 'agent', 'api'] },
        { key: 'validationRules', label: 'Validation rule types', items: ['Required', 'Min Value', 'Max Value', 'Pattern Match', 'Required If', 'Cross-field'] }
      ]
    },
    {
      group: 'Eligibility & Underwriting',
      lists: [
        { key: 'eligibilityDirections', label: 'Eligibility directions', items: ['Ineligible When', 'Eligible Only When'] },
        { key: 'eligibilityTypes', label: 'Eligibility types', items: ['Hard Block', 'Soft Warning', 'Refer to Underwriter'] },
        { key: 'eligibilityCategories', label: 'Eligibility categories', items: ['Product Eligibility', 'Cover Eligibility', 'Variant Eligibility'] },
        { key: 'uwOutcomes', label: 'Underwriting outcomes', items: ['Accept', 'Decline', 'Refer', 'Load', 'Cap', 'Restrict', 'Subjectivity'] },
        { key: 'uwOutcomeLabels', label: 'UW rule outcomes (create form)', items: ['REFER (Refer to Underwriter)', 'DECLINE (Decline Risk)', 'SUBJECTIVITY (Subject To Document)', 'LOAD (Apply Rate Loading)', 'ACCEPT (Accept Risk)', 'RESTRICT (Restrict Cover)'] },
        { key: 'uwPriorities', label: 'Priority labels', items: ['High', 'Medium', 'Low'] },
        { key: 'ruleStatuses', label: 'Rule statuses', items: ['active', 'draft', 'retired'] },
        { key: 'convictionSeverity', label: 'Conviction severity', items: ['Minor', 'Moderate', 'Serious'] },
        { key: 'eligibilityOperators', label: 'Eligibility operators', items: ['=', '≠', '<', '≤', '>', '≥', 'in', 'not in', 'is blank', 'is not blank', 'contains', 'starts with'] },
        { key: 'eligibilityAttributes', label: 'Eligibility attributes', items: ['driver_age', 'vehicle_age', 'policy_jurisdiction', 'vehicle_type', 'vehicle_insured_value', 'licence_duration_years', 'annual_mileage', 'purpose_of_use', 'driver_conviction_history'] }
      ]
    },
    {
      group: 'Rating, Distribution & Documents',
      lists: [
        { key: 'ratingComponentTypes', label: 'Rating component types', items: ['Base Premium', 'Factor', 'Discount', 'Loading', 'Fee', 'Tax'] },
        { key: 'ratingCalcTypes', label: 'Rating calculation types', items: ['Rate Table Matrix (Multiplicative Factor)', 'Fixed Amount ($ flat currency)', 'Percentage of Base Premium (%)', 'Flat Fee ($ per policy)'] },
        { key: 'vehicleUse', label: 'Vehicle use', items: ['Private', 'Commercial Light', 'Hire'] },
        { key: 'territoryZones', label: 'Territory zones', items: ['Zone A (Metro)', 'Zone B (Urban)', 'Zone C (Suburban)', 'Zone D (Rural)', 'Zone E (Remote)'] },
        { key: 'yesNo', label: 'Yes / No', items: ['Yes', 'No'] },
        { key: 'channelTypes', label: 'Channel types', items: ['Web', 'Broker', 'API', 'Mobile', 'Agent', 'Direct', 'Bancassurance', 'Affinity'] },
        { key: 'accessModels', label: 'Access models', items: ['Open Access', 'Restricted', 'Invite only'] },
        { key: 'documentTypes', label: 'Document types', items: ['Core', 'Endorsement', 'Notice', 'Schedule', 'Certificate'] },
        { key: 'documentFormats', label: 'Document formats', items: ['PDF (dynamic fields)', 'PDF (static + dynamic)', 'Email / PDF'] },
        { key: 'documentStatus', label: 'Document statuses', items: ['approved', 'pending', 'draft'] }
      ]
    },
    {
      group: 'Risk Guide',
      lists: [
        { key: 'riskAttributeTypes', label: 'Risk attribute types', items: ['Text', 'Number', 'Select', 'Multi-select', 'Boolean'] }
      ]
    },
    {
      group: 'Simulation & Platform',
      lists: [
        { key: 'simulationScenarios', label: 'Simulation scenarios', items: ['Standard Quote — 35yo Male, No Claims', 'High Risk — 22yo Male, 2 Prior Claims', 'Senior Driver — 68yo Female, Full NCD', 'Commercial Use Query — Delivery Vehicle', 'Custom Scenario…'] },
        { key: 'simulationCategories', label: 'Test categories', items: ['Rating', 'Eligibility', 'Underwriting', 'Boundary'] },
        { key: 'simulationResults', label: 'Test results', items: ['Passed', 'Failed'] },
        { key: 'userRoles', label: 'User roles', items: ['Product Manager', 'Pricing Actuary', 'Underwriting Manager', 'Compliance Officer', 'Compliance/Legal', 'Publisher', 'Administrator', 'Auditor'] },
        { key: 'userStatuses', label: 'User statuses', items: ['Active', 'Invited', 'Suspended'] },
        { key: 'approvalModes', label: 'Approval modes', items: ['Sequential (in listed order)', 'Parallel (all simultaneously)'] },
        { key: 'glossaryCategories', label: 'Glossary categories', items: ['Insurance Domain', 'Product Guide Concepts', 'Lifecycle & Status', 'Roles', 'Guides', 'UI Labels', 'API & Technical'] },
        { key: 'integrationStatuses', label: 'Integration statuses', items: ['Operational', 'Degraded', 'Down'] },
        { key: 'paymentPreferences', label: 'Payment preferences', items: ['Annual', 'Monthly Installments'] }
      ]
    }
  ];

  const DEFAULT_RECORDS = {
    valuationBases: [
      { id: 'AV', name: 'Agreed Value', desc: 'Claims paid based on the agreed value at policy inception.', tone: '#22C55E', bg: 'rgba(34,197,94,.16)', icon: 'shield' },
      { id: 'MV', name: 'Market Value', desc: 'Claims paid based on the current market value at time of loss.', tone: '#A78BFA', bg: 'rgba(167,139,250,.16)', icon: 'chart' },
      { id: 'RC', name: 'Reinstatement Cost', desc: 'Claims paid based on the cost to replace or restore the asset.', tone: '#F59E0B', bg: 'rgba(245,158,11,.16)', icon: 'refresh' }
    ]
  };

  function flattenSchema() {
    const out = {};
    SCHEMA.forEach(g => g.lists.forEach(l => { out[l.key] = l.items.slice(); }));
    return out;
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!raw || typeof raw !== 'object') return { lists: flattenSchema(), records: clone(DEFAULT_RECORDS), extraFields: [] };
      return {
        lists: Object.assign(flattenSchema(), raw.lists || {}),
        records: Object.assign(clone(DEFAULT_RECORDS), raw.records || {}),
        extraFields: Array.isArray(raw.extraFields) ? raw.extraFields : []
      };
    } catch (_) {
      return { lists: flattenSchema(), records: clone(DEFAULT_RECORDS), extraFields: [] };
    }
  }

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function save() {
    localStorage.setItem(STORE, JSON.stringify({ lists: state.lists, records: state.records, extraFields: state.extraFields }));
    window.dispatchEvent(new CustomEvent('ps-admin-updated'));
  }

  const state = load();

  function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function options(key) {
    const items = state.lists[key];
    if (Array.isArray(items) && items.length) return items.map(String);
    const rec = state.records[key];
    if (Array.isArray(rec)) return rec.map(r => r.name || r.id || String(r));
    return [];
  }

  PS.admin = {
    schema: SCHEMA,
    storageKey: STORE,
    options,
    records(key) {
      return Array.isArray(state.records[key]) ? clone(state.records[key]) : [];
    },
    items(key) {
      if (state.records[key]) return this.records(key);
      return options(key);
    },
    extraFields() { return clone(state.extraFields); },
    extraFieldsFor(scope) {
      return this.extraFields().filter(f => !f.appliesTo || f.appliesTo === 'all' || f.appliesTo === scope);
    },
    extraFieldsHtml(scope, values, ro, onChange) {
      const vals = values || {};
      return this.extraFieldsFor(scope).map(f => `
        <div class="form-group">
          <label class="form-label">${esc(f.label)}</label>
          ${this.fieldHtml(f, vals[f.id], ro, onChange)}
        </div>`).join('');
    },
    collectExtraFields(root) {
      const out = {};
      (root || document).querySelectorAll('[data-admin-field]').forEach(el => {
        const id = el.getAttribute('data-admin-field');
        if (!id) return;
        if (el.type === 'checkbox') out[id] = el.checked;
        else out[id] = el.value;
      });
      return out;
    },
    optionsHtml(key, selected, placeholder) {
      const opts = this.options(key);
      const extra = selected && !opts.includes(selected) ? [selected, ...opts] : opts;
      const first = placeholder
        ? `<option value="" data-keep>${esc(placeholder)}</option>`
        : '';
      return first + extra.map(o => `<option value="${esc(o)}" ${o === selected ? 'selected' : ''}>${esc(o)}</option>`).join('');
    },
    setList(key, items) {
      state.lists[key] = items.map(String);
      save();
    },
    addOption(key, value) {
      const v = String(value || '').trim();
      if (!v) return false;
      const cur = options(key);
      if (cur.includes(v)) return false;
      cur.push(v);
      this.setList(key, cur);
      return true;
    },
    updateOption(key, index, value) {
      const cur = options(key);
      if (index < 0 || index >= cur.length) return;
      cur[index] = String(value || '').trim() || cur[index];
      this.setList(key, cur);
    },
    removeOption(key, index) {
      const cur = options(key);
      cur.splice(index, 1);
      this.setList(key, cur);
    },
    moveOption(key, from, to) {
      const cur = options(key);
      if (to < 0 || to >= cur.length) return;
      const [item] = cur.splice(from, 1);
      cur.splice(to, 0, item);
      this.setList(key, cur);
    },
    addRecord(key, rec) {
      if (!state.records[key]) state.records[key] = [];
      state.records[key].push(rec);
      save();
    },
    updateRecord(key, index, rec) {
      if (!state.records[key] || !state.records[key][index]) return;
      state.records[key][index] = Object.assign({}, state.records[key][index], rec);
      save();
    },
    removeRecord(key, index) {
      if (!state.records[key]) return;
      state.records[key].splice(index, 1);
      save();
    },
    addExtraField(field) {
      const id = field.id || `fld-${Date.now().toString(36)}`;
      state.extraFields.push({
        id,
        label: field.label || 'New field',
        type: field.type || 'text',
        optionsKey: field.optionsKey || '',
        appliesTo: field.appliesTo || 'cover',
        placeholder: field.placeholder || ''
      });
      save();
      return id;
    },
    updateExtraField(id, patch) {
      const row = state.extraFields.find(f => f.id === id);
      if (!row) return;
      Object.assign(row, patch);
      save();
    },
    removeExtraField(id) {
      state.extraFields = state.extraFields.filter(f => f.id !== id);
      save();
    },
    resetList(key) {
      const defaults = flattenSchema();
      if (defaults[key]) state.lists[key] = defaults[key].slice();
      if (DEFAULT_RECORDS[key]) state.records[key] = clone(DEFAULT_RECORDS[key]);
      save();
    },
    resetAll() {
      state.lists = flattenSchema();
      state.records = clone(DEFAULT_RECORDS);
      state.extraFields = [];
      save();
    },
    exportJson() {
      return JSON.stringify({ lists: state.lists, records: state.records, extraFields: state.extraFields }, null, 2);
    },
    importJson(raw) {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || typeof data !== 'object') throw new Error('Invalid catalog file');
      if (data.lists) state.lists = Object.assign(flattenSchema(), data.lists);
      if (data.records) state.records = Object.assign(clone(DEFAULT_RECORDS), data.records);
      if (Array.isArray(data.extraFields)) state.extraFields = data.extraFields;
      save();
    },
    selectHtml(key, selected, attrs) {
      const opts = options(key);
      const extra = selected && !opts.includes(selected) ? [selected, ...opts] : opts;
      return `<select class="form-control" data-admin-key="${esc(key)}" ${attrs || ''}>${extra.map(o => `<option value="${esc(o)}" ${o === selected ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    },
    fieldHtml(field, value, ro, onChange) {
      const val = value == null ? '' : String(value);
      const bind = onChange
        ? `onchange="${onChange.replace(/"/g, '&quot;')}" oninput="${onChange.replace(/"/g, '&quot;')}"`
        : `data-admin-field="${esc(field.id)}"`;
      const dis = ro ? 'disabled readonly' : '';
      if (field.type === 'select') {
        return this.selectHtml(field.optionsKey || 'productFamilies', val, `${dis} ${bind}`);
      }
      if (field.type === 'number') {
        return `<input type="number" class="form-control" value="${esc(val)}" ${dis} ${bind} placeholder="${esc(field.placeholder || '')}">`;
      }
      if (field.type === 'textarea') {
        return `<textarea class="form-control" rows="2" ${dis} ${bind} placeholder="${esc(field.placeholder || '')}">${esc(val)}</textarea>`;
      }
      return `<input type="text" class="form-control" value="${esc(val)}" ${dis} ${bind} placeholder="${esc(field.placeholder || '')}">`;
    },
    applyPage(root) {
      const scope = root || document;
      scope.querySelectorAll('select[data-admin-key]').forEach(sel => {
        const key = sel.getAttribute('data-admin-key');
        const opts = options(key);
        if (!opts.length) return;
        const keepers = Array.from(sel.options).filter(o =>
          o.hasAttribute('data-keep') || (o.value === '' && /select|all |none|load /i.test(o.textContent || ''))
        );
        const multiple = sel.multiple;
        const selected = multiple
          ? Array.from(sel.selectedOptions).map(o => o.value || o.textContent)
          : [sel.value];
        const keepVals = keepers.map(o => o.value);
        const merged = opts.slice();
        selected.forEach(v => {
          if (v && !merged.includes(v) && !keepVals.includes(v)) merged.unshift(v);
        });
        sel.innerHTML =
          keepers.map(o => `<option value="${esc(o.value)}" data-keep ${selected.includes(o.value) ? 'selected' : ''}>${esc(o.textContent)}</option>`).join('') +
          merged.map(o => `<option value="${esc(o)}" ${selected.includes(o) ? 'selected' : ''}>${esc(o)}</option>`).join('');
      });
    }
  };
})();
