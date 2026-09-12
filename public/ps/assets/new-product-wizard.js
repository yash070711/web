/* New Product wizard — shared by dashboard and catalogue */
let wizardStep = 1;
const WIZARD_STEPS = ['Product Identity', 'Version Setup', 'Initial Studios', 'Review & Create'];
const PRODUCT_TYPE_LOB = {
  Transportation: ['Commercial Auto', 'Personal Auto', 'Inland Marine'],
  Property: ['Commercial Property', 'Homeowners']
};
const US_STATES = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'DC', name: 'District of Columbia' },
  { abbr: 'FL', name: 'Florida' }, { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'ID', name: 'Idaho' }, { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' }, { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' }, { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' }, { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' }, { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' }, { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' }, { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' }, { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' }, { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' }, { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' }, { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' }, { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }
];

function wizardProductFamilies() {
  return Object.keys(PRODUCT_TYPE_LOB).filter((family) => (PRODUCT_TYPE_LOB[family] || []).length > 0);
}

function adminList(key, fallback) {
  const v = window.PS?.admin?.options?.(key);
  return (v && v.length) ? v : fallback;
}

function wizardProductList() {
  if (typeof FULL_PRODUCTS !== 'undefined' && FULL_PRODUCTS.length) return FULL_PRODUCTS;
  const live = window.PS?.prototypeApp?.state?.products;
  if (live && live.length) return live;
  return window.PS?.data?.products || [];
}

function productNameTaken(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return false;
  return wizardProductList().some(p => String(p.name || '').trim().toLowerCase() === n);
}

function openNewProductWizard() {
  wizardStep = 1;
  PS.openModal(buildWizardHTML(), 'modal-lg');
  refreshWizard();
  setTimeout(() => {
    onProductFamilyChange();
    syncSelectedStates();
    refreshWizard();
  }, 0);
}

function buildWizardHTML() {
  const cloneSources = wizardProductList()
    .filter(p => p.status === 'published' || p.status === 'approved')
    .map(p => `<option value="${p.id}">${p.name} — v${p.version}</option>`)
    .join('');

  return `
  <div class="modal-header">
    <h2 class="modal-title">New Product</h2>
    <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M205.66 194.34a8 8 0 01-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 01-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0111.32-11.32L128 116.69l66.34-66.35a8 8 0 0111.32 11.32L139.31 128z" fill="currentColor"/></svg>
    </button>
  </div>
  <div class="modal-body">
    <div class="stepper" id="wizard-stepper">${buildStepper()}</div>

    <div class="wizard-step ${wizardStep === 1 ? 'active' : ''}" id="wizard-step-1">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label" for="w-name">Product Name <span class="required">*</span></label>
          <input type="text" id="w-name" class="form-control" maxlength="100" placeholder="e.g. Truck Auto Liability">
          <span class="form-help">Must be unique. You cannot create two products with the same name.</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="w-family">Product Family <span class="required">*</span></label>
          <select id="w-family" class="form-control" onchange="onProductFamilyChange()">
            ${wizardProductFamilies().map((t, i) => `<option${i === 0 ? ' selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="w-lob">Line of Business <span class="required">*</span></label>
          <select id="w-lob" class="form-control">
            <option value="" data-keep>Select a product family first…</option>
          </select>
          <span class="form-help">Updates with Product Family.</span>
        </div>
      
        <div class="form-group">
          <label class="form-label" for="w-owner">Product Owner <span class="required">*</span></label>
          <select id="w-owner" class="form-control" data-admin-key="productOwners">
            ${adminList('productOwners', ['Anika Sharma', 'Rajan Mehta', 'Sunita Pillai', 'Priya Varghese']).map(o => `<option>${o}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="w-business-type">Business Type <span class="required">*</span></label>
          <select id="w-business-type" class="form-control">
            <option selected>New</option>
            <option>Renew</option>
            <option>Both</option>
          </select>
        </div>
 



        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label" for="w-desc">Product Description</label>
          <textarea id="w-desc" class="form-control" rows="5" maxlength="500" placeholder="Brief description of the product and its intended market…" style="min-height:120px;resize:vertical"></textarea>
        </div>
        ${PS.admin ? PS.admin.extraFieldsHtml('product') : ''}
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label" for="w-jur-filter">Jurisdictions — US states <span class="required">*</span></label>
          <div class="jur-picker">
            <div class="jur-picker-toolbar">
              <div class="jur-picker-search">
                <svg class="jur-picker-search-icon" width="14" height="14" viewBox="0 0 256 256" fill="none" aria-hidden="true"><path d="M229.66 218.34l-50.07-50.07a88 88 0 10-11.31 11.31l50.06 50.07a8 8 0 0011.32-11.31zM40 112a72 72 0 1172 72 72.08 72.08 0 01-72-72z" fill="currentColor"/></svg>
                <input type="search" id="w-jur-filter" placeholder="Search AL or Alabama…" oninput="filterWizardStates()" autocomplete="off" aria-label="Filter US states">
              </div>
              <div class="jur-picker-actions">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap">
                  <input type="checkbox" id="w-jur-all" style="width:16px;height:16px;accent-color:var(--color-brand)" onchange="toggleAllStates(this.checked)"> Select all
                </label>
                <span class="jur-picker-count" id="w-jur-count">0 selected</span>
              </div>
            </div>
            <div id="w-jur-selected" style="display:flex;flex-wrap:wrap;gap:6px;min-height:24px"></div>
            <div class="jur-picker-grid" id="w-jur-grid">
              ${US_STATES.map(j => `
              <label class="jur-tile" data-name="${j.name}" data-abbr="${j.abbr}" title="${j.name}" aria-label="${j.abbr} — ${j.name}">
                <input type="checkbox" class="w-jurisdiction" value="${j.abbr}" onchange="syncSelectedStates()">
                <span class="jur-tile-abbr">${j.abbr}</span>
              </label>`).join('')}
              <div class="jur-picker-empty" id="w-jur-empty" hidden>No matching states</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="wizard-step" id="wizard-step-2">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)">
        <div class="form-group">
          <label class="form-label" for="w-eff-from">Effective Proposed Date From <span class="required">*</span></label>
          <input type="date" id="w-eff-from" class="form-control" oninput="PS.syncEffectiveTo && PS.syncEffectiveTo('w-eff-from','w-eff-to')">
          <span class="form-help">Effective proposed date must be approved.</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="w-eff-to">Expiration Date</label>
          <input type="date" id="w-eff-to" class="form-control">
          <span class="form-help">Leave blank for open-ended. Must be on or after Effective Proposed Date From.</span>
        </div>
      </div>
      <div style="margin-top:var(--space-4);padding:var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-lg)">
        <div class="flex-between" style="margin-bottom:var(--space-3)">
          <div>
            <div style="font-size:14px;font-weight:500">Clone configuration from existing product?</div>
            <div style="font-size:13px;color:var(--color-muted)">Copy coverage, eligibility, and rating rules from a published version.</div>
          </div>
          <label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer" aria-label="Clone configuration from an existing product">
            <input type="checkbox" id="w-clone-toggle" aria-label="Clone configuration from an existing product" style="opacity:0;width:0;height:0" onchange="toggleCloneSection()">
            <span id="w-clone-slider" style="position:absolute;inset:0;background:var(--color-disabled);border-radius:11px;transition:.2s;cursor:pointer"></span>
            <span id="w-clone-dot" style="position:absolute;left:2px;top:2px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.2s"></span>
          </label>
        </div>
        <div id="clone-source-section" style="display:none;padding-top:var(--space-4);border-top:1px solid var(--color-border)">
          <div class="form-group">
            <label class="form-label" for="w-clone-product">Source Product</label>
            <select id="w-clone-product" class="form-control">${cloneSources}</select>
          </div>
        </div>
      </div>
    </div>

    <div class="wizard-step" id="wizard-step-3">
      <p style="font-size:14px;color:var(--color-muted);margin-bottom:var(--space-5)">Select which studios to configure during setup. You can access any studio later from the product detail page.</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${[
          { id: 's-coverage', label: 'Coverage Studio', desc: 'Define what is covered, limits, deductibles, and exclusions.', checked: true },
          { id: 's-quest', label: 'Questionnaire Studio', desc: 'Build the questions asked at quote, application, and renewal.', checked: true },
          { id: 's-risk', label: 'Risk Studio', desc: 'Trucking risk data: business type, fleet, radius, commodities, DOT/MC.', checked: true },
          { id: 's-eligibility', label: 'Eligibility Studio', desc: 'Set rules for who can buy this product.', checked: true },
          { id: 's-rating', label: 'Rating & Pricing Studio', desc: 'Configure base rates, factors, and premium calculation rules.', checked: true },
          { id: 's-dist', label: 'Distribution Studio', desc: 'Configure channels, broker agreements, and commission structures.', checked: false },
          { id: 's-doc', label: 'Document Studio', desc: 'Set up policy documents, endorsements, and certificate templates.', checked: false }
        ].map(s => `
        <label style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-lg);cursor:pointer;transition:background .1s" onmouseenter="this.style.background='var(--color-surface)'" onmouseleave="this.style.background=''">
          <input type="checkbox" id="${s.id}" ${s.checked ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--color-brand);margin-top:1px;flex-shrink:0">
          <div>
            <div style="font-size:14px;font-weight:500;margin-bottom:2px">${s.label}</div>
            <div style="font-size:13px;color:var(--color-muted)">${s.desc}</div>
          </div>
        </label>`).join('')}
      </div>
    </div>

    <div class="wizard-step" id="wizard-step-4">
      <div class="callout callout-success" style="margin-bottom:var(--space-5)">
        <div class="callout-body">Review all details below. Once created, the product will be in Draft status.</div>
      </div>
      <div id="wizard-review-content" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)"></div>
    </div>
  </div>
  <div class="modal-footer" id="wizard-footer" style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:var(--space-3)">
    <button class="btn btn-secondary hidden" id="wizard-back-btn" type="button" onclick="wizardBack()">← Back</button>
    <button class="btn btn-primary" id="wizard-next-btn" type="button" onclick="wizardNext()">Continue →</button>
  </div>`;
}

function buildStepper() {
  return WIZARD_STEPS.map((label, i) => {
    const num = i + 1;
    const cls = num < wizardStep ? 'done' : num === wizardStep ? 'active' : '';
    const icon = num < wizardStep ? '✓' : num;
    const connector = i < WIZARD_STEPS.length - 1
      ? `<div class="stepper-connector ${num < wizardStep ? 'done' : ''}"></div>` : '';
    return `<div class="stepper-step ${cls}">
      <div class="stepper-circle">${icon}</div>
      <div class="stepper-label">${label}</div>
    </div>${connector}`;
  }).join('');
}

function wizardNext() {
  if (wizardStep === 1) {
    const family = document.getElementById('w-family')?.value;
    const lob = document.getElementById('w-lob')?.value;
    const name = document.getElementById('w-name')?.value.trim();
    const states = Array.from(document.querySelectorAll('#wizard-step-1 .w-jurisdiction:checked')).map(el => el.value);
    if (!name || !family || !lob) {
      PS.actionResult('error', 'Required fields missing', 'Enter a unique product name, product family, and line of business.');
      return;
    }
    if (productNameTaken(name)) {
      PS.actionResult('error', 'Duplicate product name', 'A product with this name already exists. Choose a unique name.');
      return;
    }
    if (!states.length) {
      PS.actionResult('error', 'Jurisdiction required', 'Select all US states or at least one state.');
      return;
    }
  }
  if (wizardStep === 2) {
    const from = document.getElementById('w-eff-from')?.value;
    const to = document.getElementById('w-eff-to')?.value;
    if (!from) { PS.actionResult('error', 'Required field missing', 'Please select an effective proposed date from.'); return; }
    if (from && to && to < from) {
      PS.actionResult('error', 'Invalid dates', 'Effective Proposed Date To must be the same date as Effective Proposed Date From, or a later date.');
      return;
    }
  }
  if (wizardStep === 4) { executeCreate(); return; }
  wizardStep++;
  refreshWizard();
}

function wizardBack() {
  if (wizardStep === 1) return;
  wizardStep--;
  refreshWizard();
}

function refreshWizard() {
  document.getElementById('wizard-stepper').innerHTML = buildStepper();
  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById(`wizard-step-${i}`);
    const on = i === wizardStep;
    step?.classList.toggle('active', on);
    if (step) {
      step.hidden = !on;
      step.toggleAttribute('inert', !on);
      step.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
  }
  const nextBtn = document.getElementById('wizard-next-btn');
  if (nextBtn) {
    nextBtn.textContent = wizardStep === 4 ? 'Create Product' : 'Continue →';
    nextBtn.style.marginLeft = wizardStep === 1 ? 'auto' : '';
  }
  const backBtn = document.getElementById('wizard-back-btn');
  if (backBtn) backBtn.classList.toggle('hidden', wizardStep === 1);
  if (wizardStep === 4) buildReview();
}

function buildReview() {
  const fam = document.getElementById('w-family')?.value || '—';
  const lob = document.getElementById('w-lob')?.value || '—';
  const name = document.getElementById('w-name')?.value || '—';
  const desc = document.getElementById('w-desc')?.value || '—';
  const owner = document.getElementById('w-owner')?.value || '—';
  const businessType = document.getElementById('w-business-type')?.value || '—';
  const carrier = document.getElementById('w-carrier')?.value || '—';
const carrierStatus = document.getElementById('w-carrier-status')?.value || '—';
  const from = document.getElementById('w-eff-from')?.value || '—';
  const to = document.getElementById('w-eff-to')?.value || 'Open-ended';
const studios = ['s-coverage', 's-quest', 's-risk', 's-eligibility', 's-rating', 's-dist', 's-doc']
    .filter(id => document.getElementById(id)?.checked)
    .map(id => document.getElementById(id)?.closest('label')?.querySelector('div > div')?.textContent || id);
  const jurisdictions = Array.from(document.querySelectorAll('#wizard-step-1 .w-jurisdiction:checked')).map(el => el.value);
  const cloneOn = document.getElementById('w-clone-toggle')?.checked;
  const cloneSel = document.getElementById('w-clone-product');
  const cloneLabel = cloneOn ? (cloneSel?.selectedOptions?.[0]?.textContent || cloneSel?.value || 'Selected product') : 'None — start from scratch';

  document.getElementById('wizard-review-content').innerHTML = `
    <div style="grid-column:1/-1">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--color-muted);margin-bottom:var(--space-3)">Product Identity</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        ${[['Product Name', name], ['Product Family', fam], ['Line of Business', lob], ['Product Owner', owner], ['Business Type', businessType],['Insurance Carrier', carrier],
['Carrier Status', carrierStatus]].map(([l, v]) => `
        <div><div style="font-size:12px;color:var(--color-muted)">${l}</div><div style="font-size:14px;font-weight:500;margin-top:2px">${v}</div></div>`).join('')}
      </div>
      ${desc !== '—' ? `<div style="margin-top:12px"><div style="font-size:12px;color:var(--color-muted)">Description</div><div style="font-size:13px;margin-top:2px">${desc}</div></div>` : ''}
    </div>
    <div style="grid-column:1/-1;border-top:1px solid var(--color-border);padding-top:var(--space-4);margin-top:var(--space-2)">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--color-muted);margin-bottom:var(--space-3)">Version Setup</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        ${[['Effective Proposed Date From', from], ['Effective Proposed Date To', to]].map(([l, v]) => `
        <div><div style="font-size:12px;color:var(--color-muted)">${l}</div><div style="font-size:14px;font-weight:500;margin-top:2px">${v}</div></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-top:12px">
        <div><div style="font-size:12px;color:var(--color-muted)">Clone source</div><div style="font-size:14px;font-weight:500;margin-top:2px">${cloneLabel}</div></div>
        <div><div style="font-size:12px;color:var(--color-muted)">Jurisdictions</div><div style="font-size:14px;font-weight:500;margin-top:2px">${jurisdictions.length ? jurisdictions.join(', ') : 'None selected'}</div></div>
      </div>
    </div>
    <div style="grid-column:1/-1;border-top:1px solid var(--color-border);padding-top:var(--space-4);margin-top:var(--space-2)">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--color-muted);margin-bottom:var(--space-3)">Studios to Configure</div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
        ${studios.map(s => `<span class="role-badge">${s}</span>`).join('')}
      </div>
    </div>
  `;
}

function onProductFamilyChange() {
  const family = document.getElementById('w-family')?.value || '';
  const lob = document.getElementById('w-lob');
  const options = PRODUCT_TYPE_LOB[family] || [];
  if (lob) {
    lob.disabled = !options.length;
    lob.innerHTML = options.length
      ? options.map((o, i) => `<option${i === 0 ? ' selected' : ''}>${o}</option>`).join('')
      : '<option value="" data-keep>Select a product family first…</option>';
  }
}

function selectedStates() {
  return Array.from(document.querySelectorAll('#wizard-step-1 .w-jurisdiction:checked')).map(el => el.value);
}

function visibleStateTiles() {
  return Array.from(document.querySelectorAll('#w-jur-grid .jur-tile')).filter(el => !el.hidden);
}

function stateNameFor(abbr) {
  return US_STATES.find(s => s.abbr === abbr)?.name || abbr;
}

function filterWizardStates() {
  const q = (document.getElementById('w-jur-filter')?.value || '').trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('#w-jur-grid .jur-tile').forEach(el => {
    const name = (el.dataset.name || '').toLowerCase();
    const abbr = (el.dataset.abbr || '').toLowerCase();
    const match = !q || name.includes(q) || abbr.includes(q);
    el.hidden = !match;
    if (match) shown += 1;
  });
  const empty = document.getElementById('w-jur-empty');
  if (empty) empty.hidden = shown > 0;
  syncSelectedStates();
}

function syncSelectedStates() {
  const selected = selectedStates();
  document.querySelectorAll('#w-jur-grid .jur-tile').forEach(tile => {
    tile.classList.toggle('is-selected', Boolean(tile.querySelector('.w-jurisdiction')?.checked));
  });
  const visibleInputs = visibleStateTiles().map(tile => tile.querySelector('.w-jurisdiction')).filter(Boolean);
  const visChecked = visibleInputs.filter(el => el.checked).length;
  const all = document.getElementById('w-jur-all');
  if (all) {
    all.checked = visibleInputs.length > 0 && visChecked === visibleInputs.length;
    all.indeterminate = visChecked > 0 && visChecked < visibleInputs.length;
  }
  const count = document.getElementById('w-jur-count');
  if (count) count.textContent = `${selected.length} selected`;
  const box = document.getElementById('w-jur-selected');
  if (!box) return;
  box.innerHTML = selected.length
    ? selected.map(s => `<span class="jur-chip" title="${stateNameFor(s)}">${s}<span class="jur-chip-remove" role="button" tabindex="0" aria-label="Remove ${s}" onclick="removeSelectedState('${s}')">×</span></span>`).join('')
    : '<span class="form-help">No states selected yet</span>';
}

function removeSelectedState(abbr) {
  const el = document.querySelector(`#wizard-step-1 .w-jurisdiction[value="${abbr}"]`);
  if (el) el.checked = false;
  syncSelectedStates();
}

function toggleAllStates(on) {
  visibleStateTiles().forEach(tile => {
    const el = tile.querySelector('.w-jurisdiction');
    if (el) el.checked = Boolean(on);
  });
  syncSelectedStates();
}

function toggleCloneSection() {
  const checked = document.getElementById('w-clone-toggle')?.checked;
  document.getElementById('clone-source-section').style.display = checked ? 'block' : 'none';
  const slider = document.getElementById('w-clone-slider');
  const dot = document.getElementById('w-clone-dot');
  if (slider) slider.style.background = checked ? 'var(--color-brand)' : 'var(--color-disabled)';
  if (dot) dot.style.transform = checked ? 'translateX(18px)' : '';
}

function executeCreate() {
  try {
    if (!window.PS?.prototypeApp?.createProductFromWizard) {
      throw new Error('Product Studio is still loading. Refresh and try Create Product again.');
    }
    const created = PS.prototypeApp.createProductFromWizard();
    const products = wizardProductList();
    if (created?.product && !products.some(p => p.id === created.id)) {
      products.unshift(created.product);
    }
    if (typeof FULL_PRODUCTS !== 'undefined' && created?.product && !FULL_PRODUCTS.some(p => p.id === created.id)) {
      FULL_PRODUCTS.unshift(created.product);
    }
    PS.closeModal();
    window.location.assign(`product-detail.html?id=${encodeURIComponent(created.id)}&version=${encodeURIComponent(created.version)}`);
  } catch (error) {
    PS.actionResult('error', 'Product not created', error.message || 'Could not save this product.');
  }
}
