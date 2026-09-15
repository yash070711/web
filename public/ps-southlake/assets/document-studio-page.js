/* Document Studio page logic — Commercial Trucking */
(function () {
  'use strict';

  const DOCUMENTS = window.DOCUMENTS || [];
  window.DOCUMENTS = DOCUMENTS;

  let activeDocId = '';
  let activeStageFilter = 'all';
  let activeTypeFilter = 'all';
  let activeStatusFilter = 'all';

  const DOC_TYPES = typeof PS.truckingDocumentTypes === 'function'
    ? PS.truckingDocumentTypes()
    : ['Application', 'Supplement', 'Schedule', 'Certificate', 'Core', 'Policy Wording', 'Declaration', 'Endorsement', 'Notice', 'Invoice', 'Quote', 'Underwriting', 'Other'];

  function normalizeDoc(d) {
    return typeof PS.normalizeDocument === 'function' ? PS.normalizeDocument(d) : d;
  }

  function persistDocs() {
    PS.prototypeApp?.persistCollection?.('documents', DOCUMENTS);
  }

  function isTruckingDocProduct() {
    const product = PS.prototypeApp?.productById?.(PS.studioHub?.productId);
    return PS.isTruckingProduct?.(product) || String(product?.family || '').toLowerCase().includes('truck');
  }

  function maybeAutoApplyTruckingDocs() {
    if (!isTruckingDocProduct() || typeof PS.truckingDocuments !== 'function') return false;
    const needsSeed = !DOCUMENTS.length || !DOCUMENTS.some(d => d.stage);
    if (!needsSeed) return false;
    DOCUMENTS.splice(0, DOCUMENTS.length, ...PS.truckingDocuments().map(d => normalizeDoc(Object.assign({}, d))));
    activeDocId = DOCUMENTS[0]?.id || '';
    persistDocs();
    return true;
  }

  function stageLabel(stage) {
    return String(stage || '').includes('POST') ? 'POST-BIND' : 'PRE-BIND';
  }

  function stageFilterKey(d) {
    return String(d.stage || '').includes('POST') ? 'post_bind' : 'pre_bind';
  }

  function productBundle() {
    const app = PS.prototypeApp;
    const pid = PS.studioHub?.productId || app?.context?.()?.productId;
    const ver = PS.studioHub?.productVersion || app?.context?.()?.version;
    return pid && app?.getProductBundle ? app.getProductBundle(pid, ver) : null;
  }

  function injectExtraFilters() {
    const toolbar = document.querySelector('#studio-hub .cs-hub-toolbar');
    if (!toolbar) return;
    if (!document.getElementById('hub-stage-filter')) {
      const stage = document.createElement('select');
      stage.id = 'hub-stage-filter';
      stage.className = 'cs-page-size';
      stage.innerHTML = '<option value="all">All stages</option><option value="pre_bind">Pre-Bind</option><option value="post_bind">Post-Bind</option>';
      stage.addEventListener('change', () => {
        activeStageFilter = stage.value;
        PS.studioHub.page = 1;
        PS.studioHub.renderTable();
      });
      toolbar.appendChild(stage);
    }
    if (!document.getElementById('hub-type-filter')) {
      const type = document.createElement('select');
      type.id = 'hub-type-filter';
      type.className = 'cs-page-size';
      type.innerHTML = `<option value="all">All document types</option>${DOC_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}`;
      type.addEventListener('change', () => {
        activeTypeFilter = type.value;
        PS.studioHub.page = 1;
        PS.studioHub.renderTable();
      });
      toolbar.appendChild(type);
    }
    if (!document.getElementById('hub-status-filter')) {
      const st = document.createElement('select');
      st.id = 'hub-status-filter';
      st.className = 'cs-page-size';
      st.innerHTML = '<option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="draft">Draft</option>';
      st.addEventListener('change', () => {
        activeStatusFilter = st.value;
        PS.studioHub.page = 1;
        PS.studioHub.renderTable();
      });
      toolbar.appendChild(st);
    }
  }

  function patchHubFilters() {
    const origFiltered = PS.studioHub.filtered.bind(PS.studioHub);
    PS.studioHub.filtered = function () {
      let base = origFiltered();
      if (activeStageFilter !== 'all') base = base.filter(d => stageFilterKey(d) === activeStageFilter);
      if (activeTypeFilter !== 'all') base = base.filter(d => String(d.type) === activeTypeFilter);
      if (activeStatusFilter !== 'all') base = base.filter(d => String(d.status || 'active').toLowerCase() === activeStatusFilter);
      return base;
    };
    const origRenderShell = PS.studioHub.renderShell.bind(PS.studioHub);
    PS.studioHub.renderShell = function () {
      origRenderShell();
      injectExtraFilters();
      const filter = document.getElementById('hub-filter');
      if (filter) filter.style.display = 'none';
    };
    const origRenderTable = PS.studioHub.renderTable.bind(PS.studioHub);
    PS.studioHub.renderTable = function () {
      this.refreshMeta();
      const wrap = document.getElementById('studio-hub-table');
      const footer = document.getElementById('studio-hub-footer');
      if (!wrap) return origRenderTable();
      const all = this.items();
      const rows = this.filtered().slice().sort((a, b) => {
        const sa = stageFilterKey(a) === 'pre_bind' ? 0 : 1;
        const sb = stageFilterKey(b) === 'pre_bind' ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return String(a.name).localeCompare(String(b.name));
      });
      if (!all.length) { origRenderTable(); return; }
      if (!rows.length) {
        wrap.innerHTML = '<div class="cs-empty">No documents match this search or filter.</div>';
        if (footer) footer.innerHTML = '<span>Showing 0 documents</span>';
        return;
      }
      const cols = this.tableColumns();
      const renderRow = (item, idx) => {
        const statusText = this.cfg.statusLabel ? this.cfg.statusLabel(item) : item.status;
        const rowMenu = typeof this.cfg.rowMenuHtml === 'function' ? this.cfg.rowMenuHtml(item) : '';
        return `<tr class="cs-table-row" onclick="openDocDrawer(DOCUMENTS.find(d=>d.id==='${item.id}'))">
          <td style="color:var(--color-muted)">${idx}</td>
          ${cols.map((c, ci) => {
            const raw = this.cellValue(c, item);
            if (c.kind === 'stage-badge') return `<td><span class="doc-stage-badge doc-stage-${stageFilterKey(item)}">${stageLabel(item.stage)}</span></td>`;
            if (c.kind === 'required-badge') return `<td><span class="doc-req-badge ${item.required ? 'required' : 'optional'}">${item.required ? 'REQUIRED' : 'OPTIONAL'}</span></td>`;
            if (c.kind === 'rule-status' || c.kind === 'doc-status') {
              const s = String(item.status || 'active').toLowerCase();
              return `<td><span class="cs-status ${s === 'active' ? '' : 'draft'}">${s === 'active' ? '✓' : '○'} ${statusText}</span></td>`;
            }
            if (c.kind === 'source-badge') return `<td><span class="doc-source-badge">${String(raw || 'Library').replace(/^LIBRARY$/i, 'Library')}</span></td>`;
            if (ci === 0) return `<td><div class="cs-name-cell"><span class="cs-cover-icon">${item.icon || '📄'}</span><span>${raw}</span></div></td>`;
            return `<td class="${c.mono ? 'mono' : 'cs-type'}">${raw}</td>`;
          }).join('')}
          <td class="text-center" onclick="event.stopPropagation()"><div class="cs-kebab" id="hub-kebab-${item.id}"><button class="btn btn-icon btn-sm" type="button" aria-label="Actions" onclick="PS.studioHub.toggleMenu(event, '${item.id}')">⋮</button><div class="cs-kebab-menu">${rowMenu}</div></div></td>
        </tr>`;
      };
      let html = '<table><thead><tr><th style="width:48px">#</th>';
      cols.forEach(c => { html += `<th>${c.header}</th>`; });
      html += '<th class="text-center">Actions</th></tr></thead><tbody>';
      let idx = 0;
      ['pre_bind', 'post_bind'].forEach(stage => {
        const group = rows.filter(d => stageFilterKey(d) === stage);
        if (!group.length) return;
        if (activeStageFilter === 'all') {
          html += `<tr class="doc-stage-section"><td colspan="${cols.length + 2}"><div class="doc-stage-section-label">${stage === 'pre_bind' ? 'PRE-BIND' : 'POST-BIND'}</div><div class="doc-stage-section-sub">${stage === 'pre_bind' ? 'Documents required or generated before binding' : 'Documents generated or issued after binding'}</div></td></tr>`;
        }
        group.forEach(item => { idx += 1; html += renderRow(item, idx); });
      });
      html += '</tbody></table>';
      wrap.innerHTML = html;
      if (footer) footer.innerHTML = `<span>Showing ${rows.length} document${rows.length === 1 ? '' : 's'}</span>`;
    };
  }

  window.closeDocDrawer = function closeDocDrawer() {
    document.getElementById('doc-drawer-overlay')?.classList.remove('open');
    document.getElementById('doc-detail-drawer')?.classList.remove('open');
  };

  window.openDocDrawer = function openDocDrawer(d) {
    if (!d) return;
    activeDocId = d.id;
    document.getElementById('doc-drawer-name').textContent = d.name;
    document.getElementById('doc-drawer-id').textContent = d.id;
    document.getElementById('doc-drawer-body').innerHTML = `
      <div class="doc-drawer-field"><label>Stage</label><div><span class="doc-stage-badge doc-stage-${stageFilterKey(d)}">${stageLabel(d.stage)}</span></div></div>
      <div class="doc-drawer-field"><label>Type</label><div>${d.type || '—'}</div></div>
      <div class="doc-drawer-field"><label>Trigger</label><div>${d.triggerLabel || d.trigger || '—'}</div></div>
      <div class="doc-drawer-field"><label>Required</label><div><span class="doc-req-badge ${d.required ? 'required' : 'optional'}">${d.required ? 'Yes' : 'No'}</span></div></div>
      <div class="doc-drawer-field"><label>Source</label><div>${d.source === 'LIBRARY' ? 'Document Library' : (d.source || 'Library')}</div></div>
      <div class="doc-drawer-field"><label>Status</label><div>${String(d.status || 'active').toUpperCase()}</div></div>
      <div class="doc-drawer-field"><label>Template</label><div class="mono">${d.template || '—'}</div></div>
      <div class="doc-drawer-field"><label>Description</label><div style="font-size:13px;line-height:1.6;color:var(--color-muted)">${d.description || '—'}</div></div>`;
    document.getElementById('doc-drawer-footer').innerHTML = `
      <button class="btn btn-secondary btn-sm" type="button" onclick="openDocEditor('${d.id}')">Edit</button>
      <button class="btn btn-secondary btn-sm" type="button" onclick="previewSingleDoc('${d.id}')">Preview</button>
      <button class="btn btn-ghost btn-sm" type="button" onclick="PS.actionResult('info','Template','Opening template ${d.template || d.id}…')">View Template</button>`;
    document.getElementById('doc-drawer-overlay')?.classList.add('open');
    document.getElementById('doc-detail-drawer')?.classList.add('open');
  };

  window.openDocEditor = function openDocEditor(id) {
    closeDocDrawer();
    activeDocId = id;
    PS.studioHub?.showEditor?.();
    renderSidebar();
    renderDetail(DOCUMENTS.find(d => d.id === id));
  };

  function renderSidebar() {
    const list = document.getElementById('doc-list');
    if (!list) return;
    list.innerHTML = ['PRE_BIND', 'POST_BIND'].map(stage => {
      const docs = DOCUMENTS.filter(d => String(d.stage).includes(stage.replace('_', '')) || (stage === 'PRE_BIND' ? !String(d.stage).includes('POST') : String(d.stage).includes('POST')))
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
      if (!docs.length) return '';
      return `<div class="doc-section"><div class="doc-section-header"><div class="doc-section-label">${stageLabel(stage)}</div></div>
        ${docs.map(d => `<div class="doc-item ${d.id === activeDocId ? 'active' : ''}" onclick="loadDocument('${d.id}')" id="di-${d.id}">
          <div class="doc-icon">${d.icon || '📄'}</div><div class="doc-item-body"><div class="doc-item-name">${d.name}</div>
          <div class="doc-item-meta"><span class="doc-badge">${d.type}</span> ${d.required ? 'Required' : 'Optional'}</div></div>
          <span class="doc-status-icon status-${d.status === 'active' ? 'approved' : 'pending'}">${d.status === 'active' ? '✓' : '○'}</span></div>`).join('')}
      </div>`;
    }).join('');
  }

  window.loadDocument = function loadDocument(id) {
    activeDocId = id;
    const doc = DOCUMENTS.find(d => d.id === id);
    if (!doc) return;
    if (PS.studioHub?.mode === 'hub') { openDocDrawer(doc); return; }
    renderSidebar();
    renderDetail(doc);
  };

  function renderDetail(d) {
    const p = document.getElementById('detail-panel');
    if (!p || !d) return;
    p.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-2);flex-wrap:wrap">
        <h2 style="font-size:18px;font-weight:700;margin:0"><span style="margin-right:8px">${d.icon || '📄'}</span>${d.name}</h2>
        <span class="doc-stage-badge doc-stage-${stageFilterKey(d)}">${stageLabel(d.stage)}</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--color-muted);background:var(--color-surface);border:1px solid var(--color-border);border-radius:4px;padding:2px 7px">${d.id}</span>
      </div>
      <div class="form-grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
        ${rof('Stage', stageLabel(d.stage))}${rof('Type', d.type)}${rof('Trigger', d.triggerLabel || d.trigger)}
        ${rof('Required', d.required ? 'Yes' : 'No')}${rof('Source', d.source === 'LIBRARY' ? 'Document Library' : d.source)}
        ${rof('Status', String(d.status || 'active').toUpperCase())}${rof('Template', d.template, true)}
        <div class="form-group span-2">${rof('Description', d.description)}</div>
      </div>`;
  }

  function rof(label, value, mono) {
    return `<div class="form-group"><label class="form-label">${label}</label><div style="font-size:${mono ? '12px' : '14px'};font-family:${mono ? "'IBM Plex Mono',monospace" : 'inherit'};padding:4px 0">${value || '—'}</div></div>`;
  }

  function docsForPack(stage) {
    return DOCUMENTS.filter(d => stageFilterKey(d) === stage && String(d.status || 'active').toLowerCase() === 'active');
  }

  window.openPreviewModal = function openPreviewModal() {
    const pre = docsForPack('pre_bind');
    const post = docsForPack('post_bind');
    const bundle = productBundle();
    const productName = bundle?.product?.name || PS.studioHub?.productName || 'Commercial Trucking';
    PS.openModal(`
      <div class="modal-header"><h2 class="modal-title">Preview Document Pack</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--color-muted);margin:0 0 16px">Preview uses live product configuration for <strong>${productName}</strong> — coverages, limits, and jurisdiction where available.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="section-card" style="padding:var(--space-4)">
            <div style="font-size:12px;font-weight:700;color:var(--color-brand);margin-bottom:8px">PRE-BIND PACK (${pre.length})</div>
            <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8">${pre.map(d => `<li>${d.name}</li>`).join('')}</ul>
            <button class="btn btn-secondary btn-sm" style="margin-top:12px" onclick="previewDocPack('pre_bind')">Preview Pre-Bind Pack</button>
          </div>
          <div class="section-card" style="padding:var(--space-4)">
            <div style="font-size:12px;font-weight:700;color:var(--color-brand);margin-bottom:8px">POST-BIND PACK (${post.length})</div>
            <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8">${post.map(d => `<li>${d.name}</li>`).join('')}</ul>
            <button class="btn btn-secondary btn-sm" style="margin-top:12px" onclick="previewDocPack('post_bind')">Preview Post-Bind Pack</button>
          </div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Close</button></div>`, 'modal-lg');
  };

  window.previewDocPack = function previewDocPack(stage) {
    const docs = docsForPack(stage);
    const bundle = productBundle();
    const covers = (bundle?.covers || []).map(c => c.name).slice(0, 5).join(', ') || 'Configured coverages';
    PS.actionResult('success', `${stageLabel(stage)} pack`, `${docs.length} documents · Product: ${bundle?.product?.name || '—'} · Covers: ${covers}`);
  };

  window.previewSingleDoc = function previewSingleDoc(id) {
    const d = DOCUMENTS.find(x => x.id === id);
    if (!d) return;
    closeDocDrawer();
    PS.actionResult('info', 'Preview', `Generating preview for ${d.name} using product configuration…`);
  };

  window.openLibraryModal = function openLibraryModal() {
    const lib = typeof PS.truckingDocuments === 'function' ? PS.truckingDocuments() : [];
    const existing = new Set(DOCUMENTS.map(d => d.id));
    PS.openModal(`
      <div class="modal-header"><h2 class="modal-title">Document Library</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
      <div class="modal-body" style="padding:0">
        <div style="padding:var(--space-4) var(--space-5)">
          <p style="font-size:13px;color:var(--color-muted);margin:0 0 12px">Associate reusable library documents with this product. Existing Document IDs are skipped to prevent duplicates.</p>
          <table class="data-table">
            <thead><tr><th></th><th>Document</th><th>ID</th><th>Stage</th><th>Type</th></tr></thead>
            <tbody>${lib.map(d => `<tr>
              <td><input type="checkbox" class="doc-lib-cb" value="${d.id}" ${existing.has(d.id) ? 'disabled checked' : ''}></td>
              <td><strong>${d.name}</strong>${existing.has(d.id) ? ' <span style="font-size:11px;color:var(--color-muted)">(associated)</span>' : ''}</td>
              <td class="mono">${d.id}</td><td>${stageLabel(d.stage)}</td><td>${d.type}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="openAssociateConfigModal()">Associate Selected</button>
      </div>`, 'modal-lg');
  };

  window.openAssociateConfigModal = function openAssociateConfigModal() {
    const ids = Array.from(document.querySelectorAll('.doc-lib-cb:checked:not(:disabled)')).map(cb => cb.value);
    if (!ids.length) return PS.actionResult?.('error', 'No selection', 'Select at least one document to associate.');
    const lib = (typeof PS.truckingDocuments === 'function' ? PS.truckingDocuments() : []).filter(d => ids.includes(d.id));
    PS.openModal(`
      <div class="modal-header"><h2 class="modal-title">Associate Document</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
      <div class="modal-body">
        ${lib.map((d, i) => `
          <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--color-border)">
            <div style="font-weight:600;margin-bottom:8px">${d.name} (${d.id})</div>
            <div class="form-grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><label class="form-label">Document Stage</label>
                <select class="form-control" id="assoc-stage-${i}"><option value="PRE_BIND">Pre-Bind</option><option value="POST_BIND" ${d.stage === 'POST_BIND' ? 'selected' : ''}>Post-Bind</option></select></div>
              <div class="form-group"><label class="form-label">Required</label>
                <select class="form-control" id="assoc-req-${i}"><option value="yes">Yes</option><option value="no">No</option></select></div>
              <div class="form-group span-2"><label class="form-label">Trigger</label>
                <select class="form-control" id="assoc-trig-${i}">${(PS.truckingDocumentTriggers?.(d.stage) || []).map(t => `<option value="${t.value}" ${t.value === d.trigger ? 'selected' : ''}>${t.label}</option>`).join('')}</select></div>
            </div>
          </div>`).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="PS.closeModal(); openLibraryModal();">Back</button>
        <button class="btn btn-primary" onclick="associateDocuments()">Confirm Association</button>
      </div>`, 'modal-md');
    window.__assocLib = lib;
  };

  window.associateDocuments = function associateDocuments() {
    const lib = window.__assocLib || [];
    let added = 0;
    lib.forEach((d, i) => {
      if (DOCUMENTS.some(x => x.id === d.id)) return;
      const stage = document.getElementById(`assoc-stage-${i}`)?.value || d.stage;
      const required = document.getElementById(`assoc-req-${i}`)?.value !== 'no';
      const trigger = document.getElementById(`assoc-trig-${i}`)?.value || d.trigger;
      DOCUMENTS.push(normalizeDoc(Object.assign({}, d, { stage, required, trigger, status: 'active' })));
      added += 1;
    });
    persistDocs();
    PS.closeModal();
    PS.studioHub?.paint?.();
    PS.actionResult?.('success', 'Documents associated', added ? `${added} document${added === 1 ? '' : 's'} added to this product.` : 'Selected documents were already associated.');
  };

  window.openCreateDocumentModal = function openCreateDocumentModal() {
    PS.openModal(`
      <div class="modal-header"><h2 class="modal-title">Create Document</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
      <div class="modal-body">
        <div class="form-grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="form-group span-2"><label class="form-label">Document Name *</label><input class="form-control" id="new-doc-name"></div>
          <div class="form-group"><label class="form-label">Document ID *</label><input class="form-control text-mono" id="new-doc-id" placeholder="DOC-CUSTOM-001"></div>
          <div class="form-group"><label class="form-label">Document Stage *</label>
            <select class="form-control" id="new-doc-stage" onchange="onDocStageChange()"><option value="PRE_BIND">Pre-Bind</option><option value="POST_BIND">Post-Bind</option></select></div>
          <div class="form-group"><label class="form-label">Document Type *</label>
            <select class="form-control" id="new-doc-type">${DOC_TYPES.map(t => `<option>${t}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">Trigger *</label><select class="form-control" id="new-doc-trigger"></select></div>
          <div class="form-group"><label class="form-label">Required / Optional</label>
            <select class="form-control" id="new-doc-required"><option value="yes">Required</option><option value="no">Optional</option></select></div>
          <div class="form-group"><label class="form-label">Source</label><input class="form-control" id="new-doc-source" value="Custom"></div>
          <div class="form-group"><label class="form-label">Template</label><input class="form-control" id="new-doc-template" placeholder="template-id"></div>
          <div class="form-group"><label class="form-label">Status</label>
            <select class="form-control" id="new-doc-status"><option value="active">Active</option><option value="draft">Draft</option></select></div>
          <div class="form-group span-2"><label class="form-label">Description</label><textarea class="form-control" id="new-doc-desc" rows="3"></textarea></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="executeCreateDocument()">Create Document</button>
      </div>`, 'modal-md');
    onDocStageChange();
  };

  window.onDocStageChange = function onDocStageChange() {
    const stage = document.getElementById('new-doc-stage')?.value || 'PRE_BIND';
    const sel = document.getElementById('new-doc-trigger');
    if (!sel) return;
    const triggers = PS.truckingDocumentTriggers?.(stage) || [];
    sel.innerHTML = triggers.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
  };

  window.executeCreateDocument = function executeCreateDocument() {
    const name = document.getElementById('new-doc-name')?.value.trim();
    const id = document.getElementById('new-doc-id')?.value.trim();
    if (!name || !id) return PS.actionResult?.('error', 'Required fields', 'Document name and ID are required.');
    if (DOCUMENTS.some(d => d.id === id)) return PS.actionResult?.('error', 'Duplicate ID', `${id} already exists.`);
    const stage = document.getElementById('new-doc-stage')?.value || 'PRE_BIND';
    const doc = normalizeDoc({
      id, name, stage,
      type: document.getElementById('new-doc-type')?.value || 'Other',
      trigger: document.getElementById('new-doc-trigger')?.value,
      required: document.getElementById('new-doc-required')?.value !== 'no',
      source: document.getElementById('new-doc-source')?.value || 'CUSTOM',
      template: document.getElementById('new-doc-template')?.value || `${id}-template`,
      status: document.getElementById('new-doc-status')?.value || 'draft',
      description: document.getElementById('new-doc-desc')?.value.trim() || '',
      icon: '📄'
    });
    DOCUMENTS.push(doc);
    activeDocId = id;
    persistDocs();
    PS.closeModal();
    PS.studioHub?.paint?.();
    openDocDrawer(doc);
    PS.actionResult?.('success', 'Document created', `${name} (${id}) added.`);
  };

  document.addEventListener('DOMContentLoaded', () => {
    PS.studioHub.mount({
      navId: 'document',
      studioLabel: 'Document Studio',
      collection: 'documents',
      apiField: 'documents',
      persist: 'documents',
      persistTarget: () => DOCUMENTS,
      skipProductColumn: true,
      getItems: () => DOCUMENTS,
      applyItems: list => {
        DOCUMENTS.splice(0, DOCUMENTS.length, ...(Array.isArray(list) ? list : []).map(normalizeDoc));
        if (DOCUMENTS.length && !DOCUMENTS.some(d => d.id === activeDocId)) activeDocId = DOCUMENTS[0]?.id;
        if (!DOCUMENTS.length) activeDocId = '';
      },
      getActiveId: () => activeDocId,
      setActiveId: id => { activeDocId = id; },
      loadItem: loadDocument,
      renderSidebar,
      noun: 'documents',
      hubTitle: 'Documents',
      hubSubtitle: 'Manage pre-bind and post-bind documents linked to this product.',
      searchPlaceholder: 'Search documents...',
      hideLastUpdated: true,
      addOnclick: 'openCreateDocumentModal()',
      deepParam: 'document',
      onOpenItem: id => openDocDrawer(DOCUMENTS.find(d => d.id === id)),
      rowMenuHtml: item => `
        <button type="button" onclick="openDocDrawer(DOCUMENTS.find(d=>d.id==='${item.id}'))">View details</button>
        <button type="button" onclick="previewSingleDoc('${item.id}')">Preview</button>
        <button type="button" onclick="openDocEditor('${item.id}')">Edit</button>`,
      searchKeys: ['name', 'id', 'type', 'stage', 'trigger', 'description', 'source'],
      filters: [],
      matchFilter: () => true,
      stats: items => [`${items.length} documents configured`],
      contextStats: items => {
        const pre = items.filter(d => stageFilterKey(d) === 'pre_bind').length;
        const post = items.filter(d => stageFilterKey(d) === 'post_bind').length;
        const mandatory = items.filter(d => d.required).length;
        return [`${items.length} documents`, `${pre} pre-bind`, `${post} post-bind`, `${mandatory} mandatory`];
      },
      isCreated: item => String(item.status || 'active').toLowerCase() === 'active',
      statusLabel: item => {
        const s = String(item.status || 'active').toLowerCase();
        if (s === 'active') return 'Active';
        if (s === 'inactive') return 'Inactive';
        return 'Draft';
      },
      columns: [
        { header: 'Document Name', value: d => d.name, primary: true },
        { header: 'Document ID', value: d => d.id, mono: true },
        { header: 'Stage', value: d => stageLabel(d.stage), kind: 'stage-badge' },
        { header: 'Type', value: d => d.type || '—' },
        { header: 'Source', value: d => d.source === 'LIBRARY' ? 'Library' : (d.source || 'Library'), kind: 'source-badge' },
        { header: 'Required', value: d => d.required ? 'Required' : 'Optional', kind: 'required-badge' },
        { header: 'Status', value: d => d.status || 'active', kind: 'doc-status' }
      ]
    });
    patchHubFilters();
    maybeAutoApplyTruckingDocs();
  });
})();
