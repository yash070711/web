/* Single source of truth for MGA (NTA) product data/derivations, shared by
   catalogue.html, dashboard.html and product-workspace.html. Everything
   here reads PS.prototypeApp (Futuristic's real product/collections data,
   Distribution Guide assignments, and audit log) — nothing is duplicated
   or invented here. */
window.MgaData = {
  MGA_NAME: 'NTA',
  MGA_TYPE: 'MGA',

  // The 10 configuration areas from the Product Workspace left nav.
  // "overview" always counts as configured once the product exists.
  CONFIG_SECTIONS: [
    { id: 'overview', label: 'Product Overview', file: null },
    { id: 'classOfBusiness', label: 'Class of Business', file: 'coverage-studio.html' },
    { id: 'jurisdiction', label: 'Jurisdiction', file: 'jurisdiction-studio.html' },
    { id: 'coverage', label: 'Coverage', file: 'coverage-studio.html' },
    { id: 'questionnaire', label: 'Questionnaire', file: 'questionnaire-studio.html' },
    { id: 'risk', label: 'Risk', file: 'risk-studio.html' },
    { id: 'eligibility', label: 'Eligibility', file: 'eligibility-studio.html' },
    { id: 'ratingPricing', label: 'Rating & Pricing', file: 'rating-studio.html' },
    { id: 'distribution', label: 'Distribution', file: 'distribution-studio.html' },
    { id: 'documents', label: 'Documents', file: 'document-studio.html' }
  ],

  escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  },

  normalizeMgaStatus(status) {
    const s = String(status || 'draft').toLowerCase();
    if (s === 'published') return 'Active';
    if (s === 'superseded' || s === 'retired') return 'Archived';
    return 'Draft';
  },

  // Complete / Needs Configuration / Not Started — the three states the
  // existing configuration-status engine can actually support from real
  // data. ("Needs Review" is a whole-product signal, surfaced separately
  // via reviewQueue()/PS.prototypeApp.productBuildStage, not invented here
  // per-section without a real signal behind it.)
  statusLabel(value) {
    return ({ configured: 'Complete', incomplete: 'Needs Configuration', not_configured: 'Not Started' })[value] || 'Not Started';
  },
  statusIcon(value) {
    return ({ configured: '✓', incomplete: '⚠' })[value] || '○';
  },
  statusBadgeClass(value) {
    return value === 'configured' ? 'badge-published' : (value === 'incomplete' ? 'badge-draft' : 'badge-retired');
  },

  studioHref(file, productId, version) {
    // Distribution is the one section NTA configures itself (its own
    // downstream sub-distribution to employees/brokers/agents), so it opens
    // NTA's own Distribution Guide rather than Futuristic's.
    if (file === 'distribution-studio.html') {
      return `distribution-studio.html?product=${encodeURIComponent(productId)}&id=${encodeURIComponent(productId)}&version=${encodeURIComponent(version || '')}`;
    }
    return `/ps/${file}?product=${encodeURIComponent(productId)}&id=${encodeURIComponent(productId)}&version=${encodeURIComponent(version || '')}`;
  },

  // Every product Futuristic's Distribution Guide has actually assigned to
  // NTA, enriched with the real configuration status/coverage grant for
  // each — the single row shape every MGA page renders from.
  assignedRows() {
    const app = window.PS && window.PS.prototypeApp;
    if (!app) return [];
    return app.productsAssignedToChannel(this.MGA_NAME, this.MGA_TYPE).map(({ product, assignment }) => {
      const version = product.version;
      const status = app.getProductConfigurationStatus(product.id, version) || {};
      const jurRows = app.jurisdictionSetupFor(product.id) || [];
      const jurisdictionCount = jurRows.length || (Array.isArray(product.jurisdictions) ? product.jurisdictions.length : 0);
      const configuredCount = 1 /* overview */ + this.CONFIG_SECTIONS.slice(1).filter(s => status[s.id] === 'configured').length;
      const completionPct = Math.round((configuredCount / this.CONFIG_SECTIONS.length) * 100);
      return {
        product, assignment, version,
        rawStatus: String(product.status || 'draft').toLowerCase(),
        mgaStatus: this.normalizeMgaStatus(product.status),
        lob: product.family || product.lineOfBusiness || 'General',
        owner: product.owner || 'Unassigned',
        jurisdictionCount,
        coverageCount: assignment.classes.length,
        riskCount: status.counts ? status.counts.risk : 0,
        status,
        completionPct,
        configuredCount,
        lastUpdated: product.lastModified || ''
      };
    });
  },

  // A product's next pending governance gate, if it has one — reused from
  // the real product-detail.html governance data, not re-derived.
  pendingGate(productId) {
    const app = window.PS.prototypeApp;
    const detail = app.state.productDetails[productId];
    const gates = Array.isArray(detail?.governance) ? detail.governance : [];
    return gates.find(g => String(g.action || '').toLowerCase() === 'pending') || null;
  },

  // Products that are either fully configured and ready to submit for
  // governance (PS.prototypeApp.productBuildStage) or already mid-governance
  // with a pending gate. Reuses the app's real build-stage/governance state.
  reviewQueue(rows) {
    const app = window.PS.prototypeApp;
    const items = [];
    rows.forEach(row => {
      const productId = row.product.id;
      if (row.rawStatus === 'draft') {
        const stage = app.productBuildStage ? app.productBuildStage(productId, row.version) : null;
        if (stage && stage.pending === false) {
          items.push({ row, area: 'Governance', statusLabel: 'Ready for review', href: `/ps/product-detail.html?id=${encodeURIComponent(productId)}&version=${encodeURIComponent(row.version)}#versions` });
        }
        return;
      }
      if (row.rawStatus === 'review' || row.rawStatus === 'approved') {
        const gate = this.pendingGate(productId);
        items.push({
          row, area: gate ? gate.gate : 'Governance',
          statusLabel: gate ? `Awaiting ${gate.gate} approval` : 'In review',
          href: `/ps/product-detail.html?id=${encodeURIComponent(productId)}&version=${encodeURIComponent(row.version)}#versions`
        });
      }
    });
    return items;
  },

  // Every non-"configured" section across every assigned product, flattened
  // into actionable rows — the real data behind "Needs Attention".
  needsAttention(rows) {
    const items = [];
    rows.forEach(row => {
      this.CONFIG_SECTIONS.slice(1).forEach(section => {
        const value = row.status[section.id];
        if (value === 'configured') return;
        items.push({
          row, section,
          value: value || 'not_configured',
          href: this.studioHref(section.file, row.product.id, row.version)
        });
      });
    });
    return items;
  },

  // Audit events for only the products actually assigned to NTA — never a
  // separate activity log.
  recentActivity(rows, limit = 10) {
    const app = window.PS.prototypeApp;
    const ids = new Set(rows.map(r => r.product.id));
    return (app.state.audit || []).filter(e => ids.has(e.productId)).slice(0, limit);
  },

  // Whether NTA has actually saved its own downstream distribution (at
  // least one channel with a real, validated grant) for this product. The
  // distribution-studio.html save flow only ever persists this record after
  // its own validation passes, so the record's existence is itself the
  // real signal — nothing is re-derived or duplicated here.
  hasNtaDistribution(productId) {
    if (!productId) return false;
    try {
      const raw = localStorage.getItem(`veridex-nta-distribution-${productId}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const configs = parsed && parsed.configs ? Object.values(parsed.configs) : [];
      return configs.some(c => Array.isArray(c?.grants) && c.grants.some(g => g?.parent && Array.isArray(g.states) && g.states.length > 0));
    } catch (_) {
      return false;
    }
  }
};
