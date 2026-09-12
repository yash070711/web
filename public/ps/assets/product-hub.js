/* Product detail hub — dynamic overview matching the Product Studio hub layout. */
(function () {
  const EDITOR_TABS = ['overview', 'studios', 'simulation', 'versions', 'audit'];
  const LIFECYCLE = [
    { id: 'draft', label: 'Draft', meaning: 'Actively being designed.', actions: 'Edit, clone, simulate, compare.' },
    { id: 'review', label: 'In Review', meaning: 'Submitted for product / actuarial / compliance review.', actions: 'Comment, approve, reject.' },
    { id: 'approved', label: 'Approved', meaning: 'Governance complete; awaiting release.', actions: 'Schedule publication, withdraw approval.' },
    { id: 'published', label: 'Published', meaning: 'Available to permitted channels from the effective date.', actions: 'Quote/use; no destructive editing.' },
    { id: 'superseded', label: 'Superseded', meaning: 'Replaced for new business by a later version.', actions: 'Historical servicing and renewal rules.' },
    { id: 'retired', label: 'Retired', meaning: 'No longer offered.', actions: 'Read/audit only; existing policies remain traceable.' }
  ];
  const AVATAR = ['av-pm', 'av-act', 'av-uw', 'av-co', 'av-pub'];

  function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function initials(name) {
    return String(name || 'AS').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
  function toDateInputValue(value) {
  if (!value) return '';

  const d = value instanceof Date ? value : new Date(value);

  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  const m = String(value).match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/);

  if (m) {
    const months = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04',
      May: '05', Jun: '06', Jul: '07', Aug: '08',
      Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };

    return `${m[3]}-${months[m[2]] || '01'}-${String(m[1]).padStart(2, '0')}`;
  }

  return '';
}

function formatProductDate(value) {
  if (!value) return '—';

  const d = new Date(value);

  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  return String(value);
}
  function formatActivityWhen(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso || '—';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function countQuestions(groups) {
    return (groups || []).reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 1), 0);
  }
  function countRatingItems(groups) {
    return (groups || []).reduce((n, g) => n + (Array.isArray(g.items) ? g.items.length : 1), 0);
  }
  function studioHref(file) {
    return `${file}?id=${encodeURIComponent(currentProduct.id)}&product=${encodeURIComponent(currentProduct.id)}&version=${encodeURIComponent(activeVersion || '')}`;
  }
  function hubIcon(id) {
    const s = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    if (id === 'coverage') return `<svg ${s}><path d="M12 3 5 6v5c0 5 3.2 8.4 7 10 3.8-1.6 7-5 7-10V6l-7-3Z"/></svg>`;
    if (id === 'questionnaire') return `<svg ${s}><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1.9-1.1 1.8"/><circle cx="12" cy="17" r=".7" fill="currentColor"/></svg>`;
    if (id === 'risk') return `<svg ${s}><path d="M12 3 21 20H3L12 3Z"/><path d="M12 9v5"/><circle cx="12" cy="16.5" r=".8" fill="currentColor"/></svg>`;
    if (id === 'eligibility') return `<svg ${s}><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="m15 11 2 2 4-4"/></svg>`;
    if (id === 'rating') return `<svg ${s}><path d="M12 3v18M8 7h5.5a3 3 0 0 1 0 6H8h6a3 3 0 0 1 0 6H8"/></svg>`;
    if (id === 'underwriting') return `<svg ${s}><path d="M12 3 4 7v5c0 5.2 3.4 8.6 8 10 4.6-1.4 8-4.8 8-10V7l-8-4Z"/><path d="m9 12 2 2 4-4"/></svg>`;
    if (id === 'distribution') return `<svg ${s}><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M8 7.5 10.5 16M16 7.5 13.5 16"/></svg>`;
    if (id === 'document') return `<svg ${s}><path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z"/><path d="M14 3.5V8h4.5M9 12h6M9 16h4"/></svg>`;
    if (id === 'jurisdiction') return `<svg ${s}><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>`;
    return `<svg ${s}><path d="M9 4h6l1 3h3v12H5V7h3l1-3Z"/><path d="M9 14h6"/></svg>`;
  }
  function quickIcon(kind) {
    const s = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    if (kind === 'clone') return `<svg ${s}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>`;
    if (kind === 'compare') return `<svg ${s}><rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/></svg>`;
    if (kind === 'simulate') return `<svg ${s}><path d="M9 3h6M10 3v6L6 17a4 4 0 0 0 12 0l-4-8V3"/></svg>`;
    if (kind === 'export') return `<svg ${s}><path d="M12 4v10M8 8l4-4 4 4"/><path d="M5 15v4h14v-4"/></svg>`;
    return `<svg ${s}><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>`;
  }
  function stateFor(pct) {
    if (pct <= 0) return 'empty';
    if (pct >= 100) return 'complete';
    return 'progress';
  }
  function liveOrDetailCount(_studioId, liveCount) {
    return Number(liveCount) || 0;
  }
function buildHubStudios() {
  const bundle = PS.prototypeApp?.getProductBundle?.(
    currentProduct.id,
    activeVersion
  ) || {};

  const qCount = liveOrDetailCount(
    'questionnaire',
    countQuestions(bundle.questionGroups)
  );

  const rCount = liveOrDetailCount(
    'rating',
    countRatingItems(bundle.rating)
  );

  const rows = [
    {
      id: 'jurisdiction',
      title: 'Define Jurisdiction',
      description: 'States where the product is available, admitted status, cities, and effective dates.',
      count: (currentProduct.jurisdictions || []).length,
      noun: ['State', 'States'],
      expected: Math.max((currentProduct.jurisdictions || []).length, 1),
      tone: '#12A88A',
      iconBg: '#E4F8F2',
      href: studioHref('jurisdiction-studio.html')
    },

    {
      id: 'coverage',
      title: 'Coverage Studio',
      description: 'Covers, limits, deductibles, exclusions and financial terms.',
      count: liveOrDetailCount(
        'coverage',
        (bundle.covers || []).length
      ),
      noun: ['Coverage', 'Coverages'],
      expected: 6,
      tone: '#2675E8',
      iconBg: '#E8F1FF',
      href: studioHref('coverage-studio.html')
    },

    {
      id: 'questionnaire',
      title: 'Questionnaire Studio',
      description: 'Risk questions the customer answers at quote time.',
      count: qCount,
      noun: ['Question', 'Questions'],
      expected: 10,
      tone: '#8055E8',
      iconBg: '#F0E8FF',
      href: studioHref('questionnaire-studio.html')
    },

    {
      id: 'risk',
      title: 'Risk Studio',
      description: 'Commercial trucking risk attributes by question group: operations, fleet, vehicle, driver, cargo, safety, and loss history.',
      count: liveOrDetailCount(
        'risk',
        (bundle.risk || []).length
      ),
      noun: ['Attribute', 'Attributes'],
      expected: 122,
      tone: '#E98A12',
      iconBg: '#FFF0DE',
      href: studioHref('risk-studio.html')
    },

    {
      id: 'eligibility',
      title: 'Eligibility Studio',
      description: 'Who can buy this product, and when a case is referred.',
      count: liveOrDetailCount(
        'eligibility',
        (bundle.eligibility || []).length
      ),
      noun: ['Rule', 'Rules'],
      expected: 4,
      tone: '#21A35A',
      iconBg: '#E6F7EA',
      href: studioHref('eligibility-studio.html')
    },

    {
      id: 'rating',
      title: 'Rating & Pricing Studio',
      description: 'Base premium, factors, and rating tables.',
      count: rCount,
      noun: ['Factor', 'Factors'],
      expected: 5,
      tone: '#D99A10',
      iconBg: '#FFF4D9',
      href: studioHref('rating-studio.html')
    },

    {
      id: 'underwriting',
      title: 'Underwriting Rules Studio',
      description: 'Accept, refer, and decline rules derived from risk attributes with underwriter assignment.',
      count: liveOrDetailCount(
        'underwriting',
        (bundle.underwriting || []).length
      ),
      noun: ['Rule', 'Rules'],
      expected: 16,
      tone: '#E9A11A',
      iconBg: '#FFF3D6',
      href: studioHref('underwriting-studio.html')
    },

    {
      id: 'distribution',
      title: 'Distribution Studio',
      description: 'How the product is sold: web, broker, API.',
      count: liveOrDetailCount(
        'distribution',
        (bundle.channels || []).length
      ),
      noun: ['Channel', 'Channels'],
      expected: 2,
      tone: '#0E8A9A',
      iconBg: '#E4F6F8',
      href: studioHref('distribution-studio.html')
    },

    {
      id: 'document',
      title: 'Document Studio',
      description: 'Policy wording, certificates, schedules, and endorsements.',
      count: liveOrDetailCount(
        'document',
        (bundle.documents || []).length
      ),
      noun: ['Document', 'Documents'],
      expected: 20,
      tone: '#6F685D',
      iconBg: '#F8F5EE',
      href: studioHref('document-studio.html')
    }
  ];

  return rows.map(row => {
    const live =
      PS.prototypeApp?.calculateStudioCompletion?.(
        row.id,
        currentProduct.id,
        activeVersion
      ) ||
      PS.studioGate?.calculateStudioCompletion?.(
        row.id,
        currentProduct.id,
        activeVersion
      );

    const prev =
      PS.prototypeApp?.previousIncompleteStudio?.(
        row.id,
        currentProduct.id,
        activeVersion
      );

    let pct =
      live && typeof live.pct === 'number'
        ? live.pct
        : 0;

    if (prev) pct = 0;

    if (row.pctOverride != null) {
      pct = row.pctOverride;
    }

    const noun =
      row.count === 1
        ? row.noun[0]
        : row.noun[1];

    return Object.assign({}, row, {
      pct,
      state: stateFor(pct),
      locked: Boolean(prev),
      prevTitle: prev?.title || '',
      countLabel: `${row.count} ${noun}`
    });
  });
}
  function enabledStudioSet() {
    const ids = PS.prototypeApp?.enabledStudioIdsFor?.(currentProduct.id);
    if (Array.isArray(ids)) {
      const set = new Set(ids);
      set.add('jurisdiction');
      set.add('risk');
      return set;
    }
    return new Set(['coverage', 'jurisdiction', 'questionnaire', 'risk', 'eligibility', 'rating', 'underwriting', 'distribution', 'document']);
  }
  function progressRing(pct, tone) {
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const r = 17;
    const circ = 2 * Math.PI * r;
    const dash = (clamped / 100) * circ;
    return `<svg class="ph-studio-ring" width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r="${r}" fill="none" stroke="#E7E2D9" stroke-width="4"/>
      <circle cx="26" cy="26" r="${r}" fill="none" stroke="${tone}" stroke-width="4" stroke-linecap="round"
        stroke-dasharray="${dash} ${circ}" transform="rotate(-90 26 26)"/>
      <text x="26" y="28" text-anchor="middle" fill="var(--color-ink)" font-size="11" font-weight="700">${clamped}%</text>
    </svg>`;
  }
  function studioStatusMeta(s) {
    if (s.pct >= 100) {
      return {
        label: 'Completed',
        cls: 'complete',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
      };
    }
    if (s.pct > 0) {
      return {
        label: 'Completed',
        cls: 'progress',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>'
      };
    }
    return {
      label: 'Not Started',
      cls: 'progress',
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>'
    };
  }
  function configuredStudioRow(s) {
    const status = studioStatusMeta(s);
    const prev = s.locked ? { title: s.prevTitle } : PS.prototypeApp?.previousIncompleteStudio?.(s.id, currentProduct.id, activeVersion);
    const lockAttr = prev
      ? `href="#" class="ph-configure-btn is-locked" data-locked-studio="${esc(s.id)}" data-prev-studio="${esc(prev.title)}" onclick="return blockLockedStudio(event, '${esc(prev.title)}')"`
      : `href="${esc(s.href)}" class="ph-configure-btn"`;
    return `
      <div class="ph-studio-row${prev ? ' is-locked' : ''}">
        <div class="ph-studio-icon" style="background:${s.iconBg || s.tone + '22'};color:${s.tone}">${hubIcon(s.id)}</div>
        <div class="ph-studio-copy">
          <div class="ph-studio-name">${esc(s.title)}</div>
          <div class="ph-studio-desc">${esc(s.description)}</div>
        </div>
        <div class="ph-studio-progress">${progressRing(s.pct, prev ? '#C9C1B2' : s.tone)}</div>
        <div class="ph-studio-status ph-studio-status--${status.cls}">
          ${status.icon}
          <span><strong>${s.pct}%</strong> ${status.label}</span>
        </div>
        <a ${lockAttr}>${prev ? 'Locked ›' : 'Configure ›'}</a>
      </div>`;
  }
  function availableStudioRow(s) {
    return `
      <div class="ph-studio-row ph-studio-available">
        <div class="ph-studio-icon" style="background:${s.iconBg || s.tone + '14'};color:${s.tone}">${hubIcon(s.id)}</div>
        <div class="ph-studio-copy">
          <div class="ph-studio-name">${esc(s.title)}</div>
          <div class="ph-studio-desc">Not selected for this product. Add it to start configuring.</div>
        </div>
        <button class="btn btn-secondary btn-sm" type="button" onclick="selectProductStudio('${esc(s.id)}')">Select studio</button>
      </div>`;
  }
  window.blockLockedStudio = function (event, prevTitle) {
    event.preventDefault();
    PS.actionResult?.('error', 'Please complete the previous studio first', `Finish ${prevTitle} before opening this studio.`);
    return false;
  };
  window.selectProductStudio = function (studioId) {
    if (!PS.prototypeApp?.enableStudio) return;
    const next = PS.prototypeApp.enableStudio(currentProduct.id, studioId);
    currentProduct.enabledStudios = next;
    PS.actionResult?.('success', 'Studio added', 'This studio is now available to configure on the product hub.');
    renderPage();
  };
  function hubSummary(studios) {
    const overall = studios.length ? Math.round(studios.reduce((n, s) => n + s.pct, 0) / studios.length) : 0;
    return {
      overall,
      complete: studios.filter(s => s.state === 'complete').length,
      progress: studios.filter(s => s.state === 'progress').length,
      empty: studios.filter(s => s.state === 'empty').length,
      incomplete: studios.filter(s => s.state === 'incomplete').length
    };
  }
  function productActivity() {
    const audit = PS.prototypeApp?.state?.audit || [];
    return audit.filter(e => e.productId === currentProduct.id).slice(0, 3);
  }

  window.openProductEditor = function () {
    const p = currentProduct;
    if (!p) return;
    const status = ((p.versions || []).find(v => v.label === activeVersion) || {}).status || p.status || 'draft';
    if (status === 'published' || status === 'superseded' || status === 'retired') {
      PS.actionResult('info', 'Version is locked', 'Clone this version to edit product details.');
      return;
    }
    const families = ['Trucking', 'Cyber'];
    const segments = ['Personal Lines', 'Commercial Lines', 'Group', 'Specialty'];
    const owners = ['Anika Sharma', 'Rajan Mehta', 'Sunita Pillai', 'Priya Varghese'];
    if (p.owner && !owners.includes(p.owner)) owners.unshift(p.owner);
    
    const opt = (list, value) => list.map(item => `<option${item === value ? ' selected' : ''}>${esc(item)}</option>`).join('');
    PS.openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Edit Product</h2>
        <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5)">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label" for="ep-name">Product Name <span class="required">*</span></label>
            <input type="text" id="ep-name" class="form-control" maxlength="100" value="${esc(p.name || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ep-family">Insurance Family <span class="required">*</span></label>
            <select id="ep-family" class="form-control">${opt(families, p.family)}</select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ep-segment">Market Segment</label>
            <select id="ep-segment" class="form-control">${opt(segments, p.segment || 'Personal Lines')}</select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label" for="ep-desc">Product Description</label>
            <textarea id="ep-desc" class="form-control" rows="5" maxlength="500" style="min-height:120px;resize:vertical">${esc(p.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="ep-owner">Product Owner</label>
            <select id="ep-owner" class="form-control">${opt(owners, p.owner)}</select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ep-code">Internal Product Code</label>
            <input type="text" id="ep-code" class="form-control" value="${esc(p.code || (window.PS?.prototypeApp?.nextProductCode?.(p.family) || ''))}" style="font-family:'IBM Plex Mono',monospace;font-size:13px" placeholder="e.g. AUTO-2026-001">
            <span class="form-help">Unique internal code. Suggested automatically — you can change it.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Product ID</label>
            <input type="text" class="form-control" value="${esc(p.id)}" readonly>
          </div>
         <div class="form-group">
  <label class="form-label" for="ep-created-on">
    Created On
  </label>

  <input
    type="date"
    id="ep-created-on"
    class="form-control"
    value="${esc(
      toDateInputValue(
        p.createdOn ||
        p.createdAt ||
        ((p.versions || []).at(-1)?.on)
      )
    )}"
  >
</div>

<div class="form-group">
  <label class="form-label" for="ep-last-modified">
    Last Modified
  </label>

  <input
    type="date"
    id="ep-last-modified"
    class="form-control"
    value="${esc(
      toDateInputValue(
        p.lastModified ||
        p.lastModifiedAt
      )
    )}"
  >
</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" type="button" onclick="PS.closeModal()">Cancel</button>
        <button class="btn btn-primary" type="button" onclick="saveProductEdits()">Save changes</button>
      </div>`, 'modal-lg');
  };

  window.saveProductEdits = function () {
    const name = document.getElementById('ep-name')?.value.trim();
    const family = document.getElementById('ep-family')?.value;
    if (!name || !family) {
      PS.actionResult('error', 'Required fields missing', 'Product name and family are required.');
      return;
    }
    try {
    const patch = {
  name,
  family,
  segment: document.getElementById('ep-segment')?.value,
  description: document.getElementById('ep-desc')?.value || '',
  owner: document.getElementById('ep-owner')?.value,
  code: document.getElementById('ep-code')?.value.trim(),

  createdOn:
    document.getElementById('ep-created-on')?.value || '',

  lastModified:
    document.getElementById('ep-last-modified')?.value || ''
};
      PS.prototypeApp.updateProductIdentity(currentProduct.id, patch);
      Object.assign(currentProduct, patch);
      if (typeof PRODUCTS_DETAIL !== 'undefined') PRODUCTS_DETAIL[currentProduct.id] = currentProduct;
      PS.closeModal();
      renderPage();
      PS.actionResult('success', 'Product updated', `${name} was saved.`);
    } catch (err) {
      PS.actionResult('error', 'Product not saved', err.message || 'Could not update this product.');
    }
  };

  window.downloadFullProductJson = function (productId, version) {
    const p = currentProduct;
    const id = productId || p?.id;
    const ver = version || activeVersion;
    if (!id) {
      PS.actionResult('error', 'Nothing to download', 'Open a product first.');
      return;
    }
    try {
      const pack = PS.prototypeApp.exportFullProduct(id, ver);
      PS.actionResult('success', 'JSON downloaded', `${pack.identity?.name || id} v${pack.version} was downloaded.`);
    } catch (err) {
      PS.actionResult('error', 'Download failed', err.message || 'Could not build the full product JSON.');
    }
  };
  window.viewFullProductJson = function (productId, version) {
    const p = currentProduct;
    const id = productId || p?.id;
    const ver = version || activeVersion;
    if (!id) {
      PS.actionResult('error', 'Nothing to view', 'Open a product first.');
      return;
    }
    try {
      PS.prototypeApp.viewFullProductJson(id, ver);
    } catch (err) {
      PS.actionResult('error', 'JSON not available', err.message || 'Could not build the full product JSON.');
    }
  };
  window.exportProductDefinition = window.downloadFullProductJson;

  window.openCloneProductModal = function () {
    const p = currentProduct;
    const label = PS.nextVersionLabel ? PS.nextVersionLabel([]) : '2026.09';
    PS.openModal(`
      <div class="modal-header"><h2 class="modal-title">Clone Product</h2>
        <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button></div>
      <div class="modal-body">
        <div class="callout callout-info" style="margin-bottom:var(--space-5)">
          <div class="callout-body">A new Draft product will be created with configuration copied from <strong>${esc(p.name)}</strong> v${esc(activeVersion)}.</div>
        </div>
        <div class="form-group">
          <label class="form-label" for="clone-name">New Product Name <span class="required">*</span></label>
          <input type="text" id="clone-name" class="form-control" value="${esc(p.name)} (Copy)">
        </div>
        <div class="form-group">
          <label class="form-label">New Version Label</label>
          <input type="text" class="form-control" value="${esc(label)}" readonly style="font-family:'IBM Plex Mono',monospace">
        </div>
        <div class="form-group">
          <label class="form-label" for="clone-owner">Assign Owner</label>
          <select id="clone-owner" class="form-control">
            <option>Anika Sharma</option><option>Rajan Mehta</option>
            <option>Sunita Pillai</option><option>Priya Varghese</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="executeCloneProduct()">Create Clone</button>
      </div>`);
  };
  window.executeCloneProduct = function () {
    const name = document.getElementById('clone-name')?.value.trim();
    const owner = document.getElementById('clone-owner')?.value;
    if (!name) { PS.actionResult('error', 'Validation error', 'Product name is required.'); return; }
    try {
      const created = PS.prototypeApp.cloneProduct(currentProduct.id, { name, owner });
      PS.closeModal();
      window.location.href = `product-detail.html?id=${encodeURIComponent(created.id)}&version=${encodeURIComponent(created.version)}`;
    } catch (err) {
      PS.actionResult('error', 'Clone not created', err.message || 'Could not clone this product.');
    }
  };

  window.renderPage = function renderPage() {
    try {
      renderHubPage();
    } catch (err) {
      console.error('Product hub failed', err);
      const el = document.getElementById('page-inner');
      if (el) {
        el.innerHTML = `<div class="card"><div class="card-body"><div class="card-title">Could not load this product</div><p style="color:var(--color-muted);font-size:13px">${esc(err.message || err)}</p></div></div>`;
      }
    }
  };

  function renderHubPage() {
    const p = currentProduct;
    if (!p) return;
    const app = PS.prototypeApp;
    const ver = (p.versions || []).find(v => v.label === activeVersion) || p.versions?.[0] || { label: activeVersion || 'Draft', status: p.status || 'draft' };
    const status = ver.status || p.status || 'draft';
    const lifecycle = LIFECYCLE.find(s => s.id === status) || LIFECYCLE[0];
    const studios = buildHubStudios();
    const enabledIds = enabledStudioSet();
    const selected = studios.filter(s => enabledIds.has(s.id));
    const available = studios.filter(s => !enabledIds.has(s.id));
    const summary = hubSummary(selected);
    const activity = productActivity();
   const firstOpen =
  selected.find(
    s =>
      !PS.prototypeApp?.previousIncompleteStudio?.(
        s.id,
        p.id,
        activeVersion
      ) &&
      s.state !== 'complete'
  )
  || selected.find(
    s =>
      !PS.prototypeApp?.previousIncompleteStudio?.(
        s.id,
        p.id,
        activeVersion
      )
  )
  || selected[0];
    const created =
  p.createdOn ||
  p.createdAt ||
  (p.versions || []).at(-1)?.on ||
  p.lastModified ||
  '—';
    const versions = p.versions || [];

    p.completion = summary.overall;
    document.title = `${p.name} — Insurance Product Studio`;
    document.getElementById('page-inner').classList.add('product-hub');

    PS.nav.render('catalogue', [
      { label: 'Product Catalogue', href: `catalogue.html?id=${p.id}` },
      { label: p.name, href: `product-detail.html?id=${p.id}` }
    ]);

    const r = 46;
    const circ = 2 * Math.PI * r;
    const dash = (Math.max(0, Math.min(100, summary.overall)) / 100) * circ;
    const showEditor = EDITOR_TABS.includes(activeTab);

    const studioRows = [
      selected.map(configuredStudioRow).join(''),
      available.length ? `<div class="ph-studio-more">Add a studio</div>${available.map(availableStudioRow).join('')}` : ''
    ].join('');

    const activityHtml = activity.length === 0
      ? `<p class="text-muted" style="font-size:13px;padding:8px 0 12px">No activity recorded for this product yet.</p>`
      : `<div class="activity-feed">${activity.map((e, i) => `
          <div class="activity-item">
            <div class="activity-avatar ${AVATAR[i % AVATAR.length]}">${esc(initials(e.user))}</div>
            <div class="activity-content">
              <div class="activity-text"><strong>${esc(e.user)}</strong> ${esc(e.description)}</div>
              <div class="activity-meta">${esc(formatActivityWhen(e.at))}</div>
            </div>
          </div>`).join('')}</div>`;

    document.getElementById('page-inner').innerHTML = `
      <div class="ph-header">
        <div class="ph-header-left">
          <div class="ph-mark" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 7.5 12 3l8 4.5V17L12 21.5 4 17V7.5Z"/>
              <path d="M12 12v9.5M4 7.5 12 12l8-4.5"/>
            </svg>
          </div>
            <div class="ph-header-copy">
            <div class="ph-title-row">
              <h1 class="ph-title">${esc(p.name)}</h1>
              <span class="badge badge-${esc(status)}">${esc(PS.statusLabel ? PS.statusLabel(status) : status)}</span>
            </div>
            <p class="ph-meta">${esc(p.id)} · ${esc(p.family)} · v${esc(ver.label || activeVersion)} · ${esc(p.owner)}</p>
            <p class="ph-desc">${esc(lifecycle.meaning)} Allowed: ${esc(lifecycle.actions)}</p>
          </div>
        </div>
        <div class="ph-actions">
          <button class="btn btn-secondary" type="button" onclick="openProductEditor()">Edit Product</button>
          ${status === 'draft' ? `<button class="btn btn-secondary" type="button" onclick="handleSubmitReview()">Submit for Review</button>` : ''}
          <a class="btn btn-secondary" href="${esc((PS.customerViewHref || PS.prototypeApp?.customerViewHref || function(){return '#';})(p.id, activeVersion))}">Customer View</a>
          <a class="btn btn-secondary" href="simulation-studio.html?id=${encodeURIComponent(p.id)}&product=${encodeURIComponent(p.id)}&version=${encodeURIComponent(activeVersion || '')}">Simulate</a>
          <button class="btn btn-secondary" type="button" onclick="viewFullProductJson()">View JSON</button>
          <button class="btn btn-secondary" type="button" onclick="downloadFullProductJson()">Download JSON</button>
          <a class="btn btn-primary" href="${esc(firstOpen?.href || studioHref('coverage-studio.html'))}">
            Open ${esc(firstOpen?.title || 'Coverage Studio')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden><path d="M7 17 17 7M8 7h9v9"/></svg>
          </a>
        </div>
      </div>

      <div class="ph-life" role="tablist" aria-label="Product lifecycle">
        ${LIFECYCLE.map(s => `
          <div class="ph-life-step ${s.id === status ? 'current' : ''}">
            <div class="ph-life-label">${esc(s.label)}</div>
            <div class="ph-life-sub">${s.id === status ? 'Current' : '—'}</div>
          </div>`).join('')}
      </div>

      <div class="ph-grid">
        <div>
          <div class="card" id="studios">
            <div class="card-header">
              <div>
                <div class="card-title">Product Studio</div>
                <div class="card-subtitle">Design and configure every aspect of your product.</div>
              </div>
              <a class="btn btn-primary btn-sm ph-configure-all" href="${esc(firstOpen?.href || studioHref('coverage-studio.html'))}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="11" cy="18" r="2" fill="currentColor" stroke="none"/></svg>
                ${selected.length ? 'Configure All' : 'Add studios'}
              </a>
            </div>
            <div class="ph-studio-list">${studioRows}</div>
          </div>

          <div class="ph-quick">
            <button class="ph-quick-card" type="button" onclick="openCloneProductModal()">
              <span class="ph-quick-icon">${quickIcon('clone')}</span>
              <span class="ph-quick-title">Clone Product</span>
              <span class="ph-quick-desc">Create a copy of this product</span>
            </button>
            <button class="ph-quick-card" type="button" onclick="openCompareModal()">
              <span class="ph-quick-icon">${quickIcon('compare')}</span>
              <span class="ph-quick-title">Compare Versions</span>
              <span class="ph-quick-desc">Compare with other versions</span>
            </button>
            <a class="ph-quick-card" href="simulation-studio.html?id=${encodeURIComponent(p.id)}&product=${encodeURIComponent(p.id)}&version=${encodeURIComponent(activeVersion || '')}">
              <span class="ph-quick-icon">${quickIcon('simulate')}</span>
              <span class="ph-quick-title">Simulate Product</span>
              <span class="ph-quick-desc">Run a test simulation</span>
            </a>
            <button class="ph-quick-card" type="button" onclick="viewFullProductJson()">
              <span class="ph-quick-icon">${quickIcon('export')}</span>
              <span class="ph-quick-title">View JSON</span>
              <span class="ph-quick-desc">Open the full product JSON</span>
            </button>
            <button class="ph-quick-card" type="button" onclick="downloadFullProductJson()">
              <span class="ph-quick-icon">${quickIcon('export')}</span>
              <span class="ph-quick-title">Download JSON</span>
              <span class="ph-quick-desc">All studios, pricing, and governance</span>
            </button>
            <a class="ph-quick-card" href="audit-log.html?product=${encodeURIComponent(p.id)}">
              <span class="ph-quick-icon">${quickIcon('log')}</span>
              <span class="ph-quick-title">View Change Log</span>
              <span class="ph-quick-desc">See recent changes</span>
            </a>
          </div>
        </div>

        <aside class="ph-side">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Product Details</div>
              <button class="btn btn-ghost btn-sm" type="button" onclick="openProductEditor()">Edit</button>
            </div>
            <div class="card-body">
              <dl class="ph-dl">
                <dt>Product Code</dt><dd class="text-mono">${esc(p.id)}</dd>
                <dt>LOB</dt><dd>${esc(p.family)}</dd>
                <dt>Version</dt>
                <dd class="text-mono">
                  <select class="ph-version-select" onchange="switchVersion(this.value)" aria-label="Select version">
                    ${versions.map(v => `<option value="${esc(v.label)}" ${v.label === activeVersion ? 'selected' : ''}>v${esc(v.label)}</option>`).join('')}
                  </select>
                </dd>
                <dt>Status</dt><dd><span class="badge badge-${esc(status)}">${esc(PS.statusLabel ? PS.statusLabel(status) : status)}</span></dd>
                <dt>Owner</dt><dd>${esc(p.owner)}</dd>
                <dt>Created On</dt><dd>${esc(created)}</dd>
                <dt>Last Modified</dt><dd>${esc(p.lastModified || '—')}</dd>
              </dl>
              <div class="ph-detail-desc">
                <div class="ph-dl-label">Description</div>
                <p>${esc(p.description || `${p.name} configuration.`)}</p>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><div class="card-title">Configuration Summary</div></div>
            <div class="card-body">
              <div class="ph-summary">
                <svg class="ph-donut" width="128" height="128" viewBox="0 0 128 128" aria-hidden>
                  <circle cx="64" cy="64" r="${r}" fill="none" stroke="#E7E2D9" stroke-width="10"/>
                  <circle cx="64" cy="64" r="${r}" fill="none" stroke="#E9A11A" stroke-width="10" stroke-linecap="round"
                    stroke-dasharray="${dash} ${circ}" transform="rotate(-90 64 64)"/>
                  <text x="64" y="60" text-anchor="middle" fill="#171717" font-size="22" font-weight="700">${summary.overall}%</text>
                  <text x="64" y="78" text-anchor="middle" fill="#6F685D" font-size="10" font-weight="600">Configured</text>
                </svg>
                <ul class="ph-legend">
                  <li><span class="ph-dot" style="background:#159947"></span> Complete (${summary.complete})</li>
                  <li><span class="ph-dot" style="background:#E9A11A"></span> In Progress (${summary.progress})</li>
                  <li><span class="ph-dot" style="background:#9B958C"></span> Not Started (${summary.empty})</li>
                  <li><span class="ph-dot" style="background:#F87171"></span> Incomplete (${summary.incomplete})</li>
                </ul>
              </div>
              <a class="ph-report" href="#studios">View Configuration Report ›</a>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Activity</div>
              <a class="btn btn-ghost btn-sm" href="audit-log.html?product=${encodeURIComponent(p.id)}">View All</a>
            </div>
            <div class="card-body" style="padding-top:8px;padding-bottom:8px">${activityHtml}</div>
          </div>
        </aside>
      </div>

      ${showEditor ? `
      <div class="ph-workspace">
        <div class="tabs" role="tablist" id="tab-bar">
          ${EDITOR_TABS.map(t => `
          <button class="tab-btn ${activeTab === t ? 'active' : ''}" id="tab-${t}" onclick="switchTab('${t}')" role="tab" aria-selected="${activeTab === t}">${tabLabel(t)}</button>`).join('')}
        </div>
        <div id="tab-content"></div>
      </div>` : ''}
    `;

    if (showEditor) {
      try { renderTab(activeTab); } catch (err) { console.error('Product tab failed', err); }
    }
    setupDropdownClose();
  }
})();
