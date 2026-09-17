/* Create Distribution Channel — form state, render, validation, save */
(function () {
  'use strict';

  const DC = () => PS.distributionCreate;
  const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const jsQuote = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  let formState = null;
  let openDropdown = null;

  function defaultState() {
    return {
      carrierId: '',
      carrierRiskPercentage: 0,
      reinsurers: [],
      productId: '',
      coverageIds: [],
      mgaIds: [],
      states: [],
      sameCommissionAllStates: true,
      globalCommission: {
        commissionType: 'Percentage (%)',
        commissionRate: 12.5,
        commissionBasis: 'Gross Written Premium'
      },
      accountLevelFactors: []
    };
  }

  function initFormState() {
    formState = defaultState();
    const params = new URLSearchParams(location.search);
    const presetProduct = params.get('product') || params.get('id');
    if (presetProduct) {
      formState.productId = presetProduct;
      onProductChange(false);
    }
  }

  function pct(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.round(v * 100) / 100;
  }

  function totalReinsured() {
    return pct(formState.reinsurers.reduce((s, r) => s + (Number(r.riskPercentage) || 0), 0));
  }

  function totalAllocation() {
    return totalReinsured();
  }

  function riskAllocationValid() {
    return formState.reinsurers.length > 0 && Math.abs(totalReinsured() - 100) < 0.01;
  }

  function product() {
    return DC().findProduct(formState.productId);
  }

  function selectedCoverages() {
    const p = product();
    if (!p) return [];
    return p.coverages.filter(c => formState.coverageIds.includes(c.id));
  }

  function selectedMgas() {
    return DC().mgas.filter(m => formState.mgaIds.includes(m.id));
  }

  function stateRow(stateId) {
    return formState.states.find(s => s.stateId === stateId);
  }

  function onProductChange(clearCoverages) {
    const p = product();
    if (!p) {
      if (clearCoverages !== false) {
        formState.coverageIds = [];
        formState.states = [];
      }
      renderAll();
      return;
    }
    if (clearCoverages !== false) {
      formState.coverageIds = p.linkedCoverageIds.slice();
    }
    const existing = new Map(formState.states.map(s => [s.stateId, s]));
    formState.states = p.linkedStateIds.map(stateId => {
      const prev = existing.get(stateId);
      if (prev) return prev;
      return {
        stateId,
        fromProduct: true,
        cities: [],
        commissionType: formState.globalCommission.commissionType,
        commissionRate: formState.globalCommission.commissionRate,
        commissionBasis: formState.globalCommission.commissionBasis
      };
    });
    renderAll();
  }

  function toggleMulti(id, value, key) {
    const list = formState[key];
    const i = list.indexOf(value);
    if (i === -1) list.push(value);
    else list.splice(i, 1);
    if (key === 'coverageIds') renderCardProduct();
    else if (key === 'mgaIds') renderCardMga();
    else renderAll();
  }

  function setReinsurer(reinsurerId, checked) {
    const exists = formState.reinsurers.find(r => r.reinsurerId === reinsurerId);
    if (checked && !exists) {
      formState.reinsurers.push({ reinsurerId, riskPercentage: 0 });
    } else if (!checked && exists) {
      formState.reinsurers = formState.reinsurers.filter(r => r.reinsurerId !== reinsurerId);
    }
    renderCardCarrier();
  }

  function setReinsurerPct(reinsurerId, value) {
    const row = formState.reinsurers.find(r => r.reinsurerId === reinsurerId);
    if (!row) return;
    row.riskPercentage = Math.min(100, Math.max(0, pct(value)));
    renderCardCarrier();
  }

  function removeState(stateId) {
    formState.states = formState.states.filter(s => s.stateId !== stateId);
    renderCardState();
  }

  function addState(stateId) {
    if (!stateId || stateRow(stateId)) return;
    formState.states.push({
      stateId,
      fromProduct: false,
      cities: [],
      commissionType: formState.globalCommission.commissionType,
      commissionRate: formState.globalCommission.commissionRate,
      commissionBasis: formState.globalCommission.commissionBasis
    });
    renderCardState();
  }

  function toggleCity(stateId, city) {
    const row = stateRow(stateId);
    if (!row) return;
    const i = row.cities.indexOf(city);
    if (i === -1) row.cities.push(city);
    else row.cities.splice(i, 1);
    renderCardState();
  }

  function addFactor() {
    formState.accountLevelFactors.push({
      id: `F-${Date.now().toString(36)}`,
      factorName: '',
      factorType: 'Percentage (%)',
      value: '',
      appliesTo: 'All Accounts',
      description: ''
    });
    renderFactors();
  }

  function removeFactor(id) {
    formState.accountLevelFactors = formState.accountLevelFactors.filter(f => f.id !== id);
    renderFactors();
  }

  function moveFactor(id, dir) {
    const list = formState.accountLevelFactors;
    const i = list.findIndex(f => f.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    renderFactors();
  }

  function updateFactor(id, field, value) {
    const row = formState.accountLevelFactors.find(f => f.id === id);
    if (row) row[field] = value;
  }

  function closeDropdowns() {
    openDropdown = null;
    document.querySelectorAll('.dc-dd.open').forEach(el => el.classList.remove('open'));
  }

  function toggleDropdown(id, event) {
    event?.stopPropagation?.();
    const el = document.getElementById(id);
    if (!el) return;
    const opening = !el.classList.contains('open');
    closeDropdowns();
    if (opening) {
      el.classList.add('open');
      openDropdown = id;
      const search = el.querySelector('.dc-dd-search input');
      if (search) setTimeout(() => search.focus(), 0);
    }
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.dc-dd')) closeDropdowns();
  });

  function multiSelectHtml(cfg) {
    const { ddId, label, hint, options, selected, disabled, searchable, onPick } = cfg;
    const selectedItems = options.filter(o => selected.includes(o.id));
    const qId = `${ddId}-q`;
    return `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <div id="${ddId}-chips" class="dc-chips">${selectedItems.length
          ? selectedItems.map(o => `<span class="ms-chip">${esc(o.name)}<span class="ms-chip-remove" role="button" tabindex="0" onclick="${onPick}('${o.id}',false)" title="Remove">×</span></span>`).join('')
          : `<span>${disabled ? 'Select a product first.' : 'None selected'}</span>`}</div>
        <div class="dc-dd mga-dd ${disabled ? 'is-disabled' : ''}" id="${ddId}">
          <button type="button" class="form-control mga-dd-btn dc-dd-btn" ${disabled ? 'disabled' : ''} onclick="DistCreate.toggleDropdown('${ddId}', event)">
            <span>${selectedItems.length ? `${selectedItems.length} selected` : 'Select…'}</span>
            <span aria-hidden="true">▾</span>
          </button>
          <div class="mga-dd-menu dc-dd-menu" role="listbox">
            ${searchable ? `<div class="dc-dd-search"><input type="search" id="${qId}" class="form-control" placeholder="Search…" oninput="DistCreate.filterDropdown('${ddId}', this.value)" autocomplete="off"></div>` : ''}
            ${options.map(o => `
              <label class="dc-dd-option" data-label="${esc(o.name).toLowerCase()}">
                <input type="checkbox" ${selected.includes(o.id) ? 'checked' : ''} onchange="${onPick}('${o.id}', this.checked)">
                <span>${esc(o.name)}</span>
              </label>`).join('')}
            ${!options.length ? '<div class="dc-dd-empty">No options available</div>' : ''}
          </div>
        </div>
      </div>`;
  }

  function renderCardCarrier() {
    const el = document.getElementById('dc-card-carrier');
    if (!el) return;
    const valid = riskAllocationValid();
    el.innerHTML = `
      <div class="dc-card-head">
        <span class="dc-step">1</span>
        <div><div class="dc-card-title">Reinsurance</div><div class="dc-card-help">Select reinsurers and allocate 100% of risk.</div></div>
      </div>
      <div class="dc-card-body">
        <div class="form-group">
          <label class="form-label">Reinsured By</label>
          <div class="dc-reinsurer-list">
            ${DC().reinsurers.map(r => {
              const sel = formState.reinsurers.find(x => x.reinsurerId === r.id);
              return `
              <label class="dc-reinsurer-pick">
                <input type="checkbox" ${sel ? 'checked' : ''} onchange="DistCreate.setReinsurer('${r.id}', this.checked)">
                <span>${esc(r.name)}</span>
              </label>`;
            }).join('')}
          </div>
          ${formState.reinsurers.length ? `
          <div class="dc-reinsurer-rows">
            ${formState.reinsurers.map(r => {
              const info = DC().reinsurers.find(x => x.id === r.reinsurerId);
              return `
              <div class="dc-reinsurer-row">
                <span class="ms-chip">${esc(info?.name || r.reinsurerId)}<span class="ms-chip-remove" role="button" onclick="DistCreate.setReinsurer('${r.reinsurerId}', false)">×</span></span>
                <label class="dc-re-row-label">Risk %</label>
                <div class="dc-input-suffix dc-re-input">
                  <input type="number" class="form-control" min="0" max="100" step="0.01" value="${r.riskPercentage}"
                    oninput="DistCreate.setReinsurerPct('${r.reinsurerId}', this.value)">
                  <span class="dc-suffix">%</span>
                </div>
              </div>`;
            }).join('')}
          </div>` : ''}
          <div class="dc-total-row">
            <span class="form-label">Total Reinsured %</span>
            <strong>${totalReinsured().toFixed(2)} %</strong>
          </div>
          ${valid
            ? '<div class="dc-valid ok">✓ Reinsurance allocation equals 100%</div>'
            : '<div class="dc-valid err">Select reinsurers whose risk % totals 100%.</div>'}
        </div>
      </div>`;
  }

  function renderCardProduct() {
    const el = document.getElementById('dc-card-product');
    if (!el) return;
    const p = product();
    const coverages = p?.coverages || [];
    el.innerHTML = `
      <div class="dc-card-head">
        <span class="dc-step">2</span>
        <div><div class="dc-card-title">Product</div><div class="dc-card-help">Linked from the product catalogue. Coverages and LOB load automatically.</div></div>
      </div>
      <div class="dc-card-body">
        <div class="form-group">
          <label class="form-label" for="dc-product">Product <span class="required">*</span></label>
          <select id="dc-product" class="form-control" onchange="DistCreate.setProduct(this.value)">
            <option value="">Select product…</option>
            ${DC().buildProductCatalog().map(pr => `<option value="${pr.id}" ${formState.productId === pr.id ? 'selected' : ''}>${esc(pr.name)} (${esc(pr.id)})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="dc-lob">LOB</label>
          <input id="dc-lob" class="form-control" value="${esc(p?.lob || '')}" readonly placeholder="Select a product to load LOB">
        </div>
        ${multiSelectHtml({
          ddId: 'dc-coverages-dd',
          label: 'Coverages',
          hint: '(From catalogue — loaded with product)',
          options: coverages.map(c => ({ id: c.id, name: c.name })),
          selected: formState.coverageIds,
          disabled: !p,
          searchable: true,
          onPick: 'DistCreate.toggleCoverage'
        })}
        ${p && !coverages.length ? '<div class="dc-empty">No coverages are linked to this product in the catalogue.</div>' : ''}
        ${p ? `
        <div class="dc-info-panel">
          <div class="dc-info-title">Product Details</div>
          <div class="dc-info-grid">
            <div><span class="dc-info-label">LOB</span><span>${esc(p.lob || '—')}</span></div>
            <div><span class="dc-info-label">Type</span><span>${esc(p.type)}</span></div>
            <div><span class="dc-info-label">Currency</span><span>${esc(p.currency)}</span></div>
            <div><span class="dc-info-label">Status</span><span>${esc(p.status)}</span></div>
          </div>
        </div>` : ''}
      </div>`;
  }

  function renderCardMga() {
    const el = document.getElementById('dc-card-mga');
    if (!el) return;
    el.innerHTML = `
      <div class="dc-card-head">
        <span class="dc-step">3</span>
        <div><div class="dc-card-title">MGA</div><div class="dc-card-help">Select one or more MGAs for this distribution channel.</div></div>
      </div>
      <div class="dc-card-body">
        ${multiSelectHtml({
          ddId: 'dc-mga-dd',
          label: 'MGAs',
          hint: '(Select Multiple)',
          options: DC().mgas,
          selected: formState.mgaIds,
          disabled: false,
          searchable: true,
          onPick: 'DistCreate.toggleMga'
        })}
      </div>`;
  }

  function renderCardState() {
    const el = document.getElementById('dc-card-state');
    if (!el) return;
    const gc = formState.globalCommission;
    el.innerHTML = `
      <div class="dc-card-head">
        <span class="dc-step">4</span>
        <div><div class="dc-card-title">State & Commission</div><div class="dc-card-help">Configure states, optional city restrictions, and commission.</div></div>
      </div>
      <div class="dc-card-body">
        <div class="form-group">
          <label class="form-label">States</label>
          ${formState.states.length ? formState.states.map(s => {
            const st = DC().findState(s.stateId);
            if (!st) return '';
            const badge = s.fromProduct ? 'dc-chip-product' : 'dc-chip-added';
            const badgeLabel = s.fromProduct ? 'From product' : 'Added';
            return `
            <div class="dc-state-block">
              <div class="dc-state-head">
                <span class="ms-chip ${badge}">${esc(st.name)} (${st.code})<span class="dc-chip-tag">${badgeLabel}</span><span class="ms-chip-remove" onclick="DistCreate.removeState('${s.stateId}')">×</span></span>
              </div>
              <div class="dc-city-section">
                <label class="form-label">City</label>
                ${s.cities.length
                  ? `<div class="dc-chips">${s.cities.map(c => `<span class="jur-chip">${esc(c)}<span class="jur-chip-remove" onclick="DistCreate.toggleCity('${s.stateId}','${jsQuote(c)}')">×</span></span>`).join('')}</div>`
                  : '<span>All cities within this state</span>'}
                <div class="dc-dd mga-dd" id="dc-city-dd-${s.stateId}">
                  <button type="button" class="btn btn-ghost btn-sm" onclick="DistCreate.toggleDropdown('dc-city-dd-${s.stateId}', event)">+ Add City</button>
                  <div class="mga-dd-menu dc-dd-menu dc-city-menu">
                    ${st.cities.map(c => `
                      <label class="dc-dd-option">
                        <input type="checkbox" ${s.cities.includes(c) ? 'checked' : ''} onchange="DistCreate.toggleCity('${s.stateId}','${jsQuote(c)}')">
                        <span>${esc(c)}</span>
                      </label>`).join('')}
                  </div>
                </div>
              </div>
              ${!formState.sameCommissionAllStates ? `
              <div class="dc-state-commission">
                <label class="form-label">Commission for ${esc(st.code)}</label>
                <div class="dc-comm-inline">
                  <select class="form-control" onchange="DistCreate.setStateCommission('${s.stateId}','commissionType',this.value)">
                    ${DC().commissionTypes.map(t => `<option ${s.commissionType === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
                  </select>
                  <div class="dc-input-suffix">
                    <input type="number" class="form-control" step="0.01" min="0" value="${s.commissionRate}"
                      oninput="DistCreate.setStateCommission('${s.stateId}','commissionRate',this.value)">
                    <span class="dc-suffix">${s.commissionType === 'Flat Amount' ? 'USD' : '%'}</span>
                  </div>
                </div>
              </div>` : ''}
            </div>`;
          }).join('') : '<div class="dc-empty">Select a product to load linked states, or add states manually.</div>'}
          <div class="dc-dd mga-dd" id="dc-add-state-dd" style="margin-top:10px">
            <button type="button" class="btn btn-ghost btn-sm" onclick="DistCreate.toggleDropdown('dc-add-state-dd', event)">+ Add State</button>
            <div class="mga-dd-menu dc-dd-menu">
              <div class="dc-dd-search"><input type="search" class="form-control" placeholder="Search state…" oninput="DistCreate.filterDropdown('dc-add-state-dd', this.value)"></div>
              ${DC().usStates.filter(st => !stateRow(st.id)).map(st => `
                <button type="button" class="dc-dd-item" data-label="${esc(st.name).toLowerCase()} ${st.code.toLowerCase()}" onclick="DistCreate.addState('${st.id}'); DistCreate.closeDropdowns();">${esc(st.name)} (${st.code})</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="dc-commission-block">
          <div class="dc-comm-title">Commission</div>
          <label class="dc-toggle-row">
            <input type="checkbox" ${formState.sameCommissionAllStates ? 'checked' : ''} onchange="DistCreate.setSameCommission(this.checked)">
            <span>Apply same commission to all states</span>
          </label>
          <div class="form-grid-2 dc-comm-grid">
            <div class="form-group">
              <label class="form-label">Commission Type</label>
              <select class="form-control" onchange="DistCreate.setGlobalCommission('commissionType', this.value)">
                ${DC().commissionTypes.map(t => `<option ${gc.commissionType === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Commission Rate</label>
              <div class="dc-input-suffix">
                <input type="number" class="form-control" step="0.01" min="0" value="${gc.commissionRate}"
                  oninput="DistCreate.setGlobalCommission('commissionRate', this.value)">
                <span class="dc-suffix">${gc.commissionType === 'Flat Amount' ? 'USD' : '%'}</span>
              </div>
            </div>
            <div class="form-group span-2">
              <label class="form-label">Commission Basis</label>
              <select class="form-control" onchange="DistCreate.setGlobalCommission('commissionBasis', this.value)">
                ${DC().commissionBases.map(b => `<option ${gc.commissionBasis === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderFactors() {
    const el = document.getElementById('dc-factors-body');
    if (!el) return;
    el.innerHTML = formState.accountLevelFactors.length
      ? formState.accountLevelFactors.map((f, idx) => `
        <tr>
          <td><input type="text" class="form-control" value="${esc(f.factorName)}" placeholder="Factor name"
            oninput="DistCreate.updateFactor('${f.id}','factorName',this.value)"></td>
          <td><select class="form-control" onchange="DistCreate.updateFactor('${f.id}','factorType',this.value)">
            ${DC().factorTypes.map(t => `<option ${f.factorType === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
          </select></td>
          <td><input type="text" class="form-control" value="${esc(f.value)}" placeholder="Value"
            oninput="DistCreate.updateFactor('${f.id}','value',this.value)"></td>
          <td><select class="form-control" onchange="DistCreate.updateFactor('${f.id}','appliesTo',this.value)">
            ${DC().appliesToOptions.map(t => `<option ${f.appliesTo === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
          </select></td>
          <td><input type="text" class="form-control" value="${esc(f.description)}" placeholder="Description"
            oninput="DistCreate.updateFactor('${f.id}','description',this.value)"></td>
          <td class="dc-factor-actions">
            <button type="button" class="btn btn-icon btn-sm" title="Move up" ${idx === 0 ? 'disabled' : ''} onclick="DistCreate.moveFactor('${f.id}', -1)">↑</button>
            <button type="button" class="btn btn-icon btn-sm" title="Move down" ${idx === formState.accountLevelFactors.length - 1 ? 'disabled' : ''} onclick="DistCreate.moveFactor('${f.id}', 1)">↓</button>
            <button type="button" class="btn btn-ghost btn-sm danger" onclick="DistCreate.removeFactor('${f.id}')">Delete</button>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="6" class="dc-empty-cell">No account level factors yet. Click + Add Factor to create one.</td></tr>`;
  }

  function renderAll() {
    renderCardCarrier();
    renderCardProduct();
    renderCardMga();
    renderCardState();
    renderFactors();
  }

  function notify(type, title, message) {
    if (typeof PS.actionResult === 'function') {
      PS.actionResult(type, title, message);
      return;
    }
    const main = document.querySelector('.page-inner') || document.body;
    document.querySelector('.ps-action-result')?.remove();
    const el = document.createElement('section');
    el.className = `ps-action-result ${type === 'error' ? 'error' : 'success'}`;
    el.innerHTML = `<div><div class="ps-action-result-title">${esc(title)}</div><div class="ps-action-result-detail">${esc(message)}</div></div>`;
    main.prepend(el);
    el.scrollIntoView({ block: 'nearest' });
  }

  function equalizeReinsurance() {
    const rows = formState.reinsurers;
    if (!rows.length) return;
    const total = totalReinsured();
    if (Math.abs(total - 100) < 0.01) return;
    if (rows.every(r => !Number(r.riskPercentage))) {
      const share = pct(100 / rows.length);
      rows.forEach((r, i) => {
        r.riskPercentage = i === rows.length - 1 ? pct(100 - share * (rows.length - 1)) : share;
      });
    }
  }

  function validate() {
    if (formState.productId && !formState.coverageIds.length) {
      const p = product();
      if (p?.linkedCoverageIds?.length) formState.coverageIds = p.linkedCoverageIds.slice();
    }
    if (formState.productId && !formState.states.length) onProductChange(false);
    equalizeReinsurance();

    const errors = [];
    if (!formState.productId) errors.push('Select a product from the catalogue.');
    if (formState.reinsurers.length && !riskAllocationValid()) {
      errors.push('Reinsurance risk % must total 100%.');
    }
    const gc = formState.globalCommission;
    if (gc.commissionRate === '' || gc.commissionRate == null) errors.push('Commission rate is required.');

    if (errors.length) {
      notify('error', 'Cannot save channel', errors.join(' '));
      return false;
    }
    return true;
  }

  function buildPayload() {
    return {
      carrierId: '',
      carrierRiskPercentage: 0,
      lob: product()?.lob || '',
      reinsurers: formState.reinsurers.map(r => ({
        reinsurerId: r.reinsurerId,
        riskPercentage: pct(r.riskPercentage)
      })),
      productId: formState.productId,
      coverageIds: formState.coverageIds.slice(),
      mgaIds: formState.mgaIds.slice(),
      states: formState.states.map(s => ({
        stateId: s.stateId,
        fromProduct: s.fromProduct,
        cities: s.cities.slice(),
        commissionType: formState.sameCommissionAllStates ? formState.globalCommission.commissionType : s.commissionType,
        commissionRate: formState.sameCommissionAllStates ? pct(formState.globalCommission.commissionRate) : pct(s.commissionRate),
        commissionBasis: formState.sameCommissionAllStates ? formState.globalCommission.commissionBasis : s.commissionBasis
      })),
      sameCommissionAllStates: formState.sameCommissionAllStates,
      globalCommission: Object.assign({}, formState.globalCommission, {
        commissionRate: pct(formState.globalCommission.commissionRate)
      }),
      accountLevelFactors: formState.accountLevelFactors.map(f => Object.assign({}, f))
    };
  }

  function channelNameFromPayload(payload) {
    const p = DC().findProduct(payload.productId);
    const mga = DC().mgas.find(m => m.id === payload.mgaIds[0]);
    return `${p?.name || 'Product'}${p?.lob ? ` · ${p.lob}` : ''}${mga ? ` — ${mga.name}` : ''}`;
  }

  function commissionLabel(payload) {
    const rate = payload.globalCommission.commissionRate;
    return payload.globalCommission.commissionType === 'Flat Amount'
      ? `$${Number(rate).toFixed(2)}`
      : `${Number(rate).toFixed(2)}%`;
  }

  function convertToChannelRecord(payload) {
    const name = channelNameFromPayload(payload);
    const id = `CHAN-${Date.now().toString().slice(-6)}`;
    const comm = commissionLabel(payload);
    const territories = payload.states.map(s => {
      const st = DC().findState(s.stateId);
      const cityNote = s.cities.length ? s.cities.join(', ') : 'All cities';
      return { j: `${st?.name || s.stateId} (${st?.code || s.stateId})`, p: 'Yes', n: cityNote };
    });
    const gc = payload.globalCommission;
    return {
      id,
      name,
      icon: '📡',
      status: 'active',
      comm,
      type: 'Distribution Channel',
      desc: `Product: ${DC().findProduct(payload.productId)?.name || payload.productId}. LOB: ${DC().findProduct(payload.productId)?.lob || '—'}.`,
      auth: 'Configured via distribution channel wizard.',
      territories,
      commConfig: {
        type: gc.commissionType,
        rate: comm,
        basis: gc.commissionBasis,
        override: 'No',
        max: comm,
        clawback: '—',
        timing: 'Monthly',
        code: `COMM-${id.slice(-6)}`
      },
      rules: [],
      accessModel: selectedMgas().map(m => m.name).join(', ') || 'MGA Partners',
      intermediaries: selectedMgas().map(m => ({
        name: m.name,
        code: m.id,
        auth: 'Yes',
        terr: payload.states.map(s => DC().findState(s.stateId)?.code || s.stateId).join(', '),
        stat: 'Active'
      })),
      from: new Date().toISOString().slice(0, 10),
      to: 'Open-ended',
      distributionConfig: payload
    };
  }

  function cancelUrl() {
    const params = new URLSearchParams(location.search);
    const productId = params.get('product') || params.get('id');
    if (productId) return `distribution-studio.html?product=${encodeURIComponent(productId)}`;
    return 'distribution-studio.html';
  }

  function persistChannel(record, payload) {
    const app = PS.prototypeApp;
    const params = new URLSearchParams(location.search);
    const productId = formState.productId || params.get('product') || params.get('id') || app?.context?.()?.productId;
    const productRec = app?.productById?.(productId);
    const version = params.get('version') || productRec?.version || app?.context?.()?.version || 'active';

    if (app?.addLibraryExtra) {
      app.addLibraryExtra('distribution', {
        id: record.id,
        name: record.name,
        code: record.id,
        type: record.type,
        extra: record.comm,
        distributionConfig: payload
      });
    }

    if (!productId || !app?.state) return { productId: productId || '', version };

    app.rememberContext?.({ productId, version });
    const bundle = app.getProductBundle?.(productId, version);
    const existing = Array.isArray(bundle?.channels) ? bundle.channels.slice() : [];
    if (!existing.some(c => c.id === record.id)) existing.push(record);

    const keys = [
      `${productId}::${version}::channels`,
      `${productId}::active::channels`
    ];
    keys.forEach(key => { app.state.collections[key] = existing.slice(); });
    app.persistCollection?.('channels', existing);
    app.save?.();
    return { productId, version };
  }

  function saveChannel() {
    try {
      if (!formState) initFormState();
      if (!validate()) return;
      const payload = buildPayload();
      const record = convertToChannelRecord(payload);
      const dest = persistChannel(record, payload);
      const href = dest.productId
        ? `distribution-studio.html?product=${encodeURIComponent(dest.productId)}${dest.version ? `&version=${encodeURIComponent(dest.version)}` : ''}&channel=${encodeURIComponent(record.id)}`
        : 'distribution-studio.html';
      notify('success', 'Channel saved', `${record.name} has been saved.`);
      window.setTimeout(() => { window.location.assign(href); }, 250);
    } catch (err) {
      console.error('Save channel failed', err);
      notify('error', 'Channel not saved', err.message || 'Could not save this distribution channel.');
    }
  }

  window.DistCreate = {
    init() {
      initFormState();
      renderAll();
    },
    setReinsurer,
    setReinsurerPct,
    setProduct(v) { formState.productId = v; onProductChange(true); },
    toggleCoverage(id, checked) {
      if (checked && !formState.coverageIds.includes(id)) formState.coverageIds.push(id);
      else formState.coverageIds = formState.coverageIds.filter(x => x !== id);
      renderCardProduct();
    },
    toggleMga(id, checked) {
      if (checked && !formState.mgaIds.includes(id)) formState.mgaIds.push(id);
      else formState.mgaIds = formState.mgaIds.filter(x => x !== id);
      renderCardMga();
    },
    removeState,
    addState,
    toggleCity,
    setSameCommission(on) {
      formState.sameCommissionAllStates = Boolean(on);
      if (on) {
        formState.states.forEach(s => {
          s.commissionType = formState.globalCommission.commissionType;
          s.commissionRate = formState.globalCommission.commissionRate;
          s.commissionBasis = formState.globalCommission.commissionBasis;
        });
      }
      renderCardState();
    },
    setGlobalCommission(field, value) {
      formState.globalCommission[field] = field === 'commissionRate' ? pct(value) : value;
      if (formState.sameCommissionAllStates) {
        formState.states.forEach(s => {
          s.commissionType = formState.globalCommission.commissionType;
          s.commissionRate = formState.globalCommission.commissionRate;
          s.commissionBasis = formState.globalCommission.commissionBasis;
        });
      }
      renderCardState();
    },
    setStateCommission(stateId, field, value) {
      const row = stateRow(stateId);
      if (!row) return;
      row[field] = field === 'commissionRate' ? pct(value) : value;
    },
    addFactor,
    removeFactor,
    moveFactor,
    updateFactor,
    toggleDropdown,
    closeDropdowns,
    filterDropdown(ddId, q) {
      const query = String(q || '').trim().toLowerCase();
      document.querySelectorAll(`#${ddId} .dc-dd-option, #${ddId} .dc-dd-item`).forEach(el => {
        const label = (el.dataset.label || el.textContent || '').toLowerCase();
        el.hidden = query && !label.includes(query);
      });
    },
    cancel() { window.location.assign(cancelUrl()); },
    save: saveChannel
  };
})();
