/* Underwriting Studio page logic — Commercial Trucking */
(function () {
  'use strict';

  const RULES = window.RULES || [];
  window.RULES = RULES;

  let activeRuleId = '';
  let openSections = new Set(['identity', 'condition', 'outcome', 'prio', 'auth', 'assignment', 'preview']);
  let activeGroupFilter = 'all';
  let activeSourceFilter = 'all';

  const SOURCE_FILTERS = [
    { value: 'all', label: 'All sources' },
    { value: 'risk', label: 'Risk' },
    { value: 'coverage', label: 'Coverage' },
    { value: 'questions', label: 'Questions' },
    { value: 'product', label: 'Product' },
    { value: 'underwriting', label: 'Underwriting' }
  ];

  const QUESTION_GROUPS = (typeof PS.truckingQuestionGroupMeta === 'function'
    ? PS.truckingQuestionGroupMeta()
    : []).map(g => g.label);

  function productRiskAttributes() {
    const app = PS.prototypeApp;
    const pid = PS.studioHub?.productId || app?.context?.()?.productId;
    const ver = PS.studioHub?.productVersion || app?.context?.()?.version;
    if (!pid || !app?.getProductBundle) {
      if (typeof PS.truckingRiskAttributes === 'function') return PS.truckingRiskAttributes();
      return [];
    }
    const risk = app.getProductBundle(pid, ver)?.risk || [];
    return risk.length ? risk : (typeof PS.truckingRiskAttributes === 'function' ? PS.truckingRiskAttributes() : []);
  }



function resolveRiskAttributeId(r, rows) {
  const explicit = String(r?.riskAttributeId || '').trim();
  if (explicit) return explicit;

  const attrs = productRiskAttributes();
  if (!Array.isArray(attrs) || !attrs.length) return '';

  const candidates = [
    r?.riskAttribute,
    rows?.[0]?.fieldKey,
    rows?.[0]?.f,
    r?.sourceRef?.riskAttributeId
  ]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  if (!candidates.length) return '';

  const match = attrs.find(a => {
    const id = String(a?.id || a?.code || '').trim().toLowerCase();
    const name = String(a?.name || '').trim().toLowerCase();
    const field = String(a?.fieldKey || '').trim().toLowerCase();

    return candidates.includes(id)
      || candidates.includes(name)
      || candidates.includes(field);
  });

  return match ? (match.id || match.code || '') : '';
}
 function normalizeRule(r) {
  const type = String(r.type || r.outcome || 'accept').toLowerCase();

  const rows = (r.condition?.groups?.[0]?.rows)
    || (r.conditions || []).map(c => ({
      f: c.field,
      fieldKey: c.field,
      op: c.op,
      v: c.value
    }));

  const riskAttributeId = resolveRiskAttributeId(r, rows);

  if (PS.uwRuleStore?.normalize) {
    const normalized = PS.uwRuleStore.normalize(
      Object.assign({}, r, {
        riskAttributeId
      })
    );

    if (normalized && !normalized.riskAttributeId && riskAttributeId) {
      normalized.riskAttributeId = riskAttributeId;
    }

    return normalized;
  }

  return Object.assign({}, r, {
    type,
    status: r.status || 'active',
    sourceStudio:
      r.sourceStudio ||
      PS.uwRuleStore?.STUDIOS?.UNDERWRITING ||
      'Underwriting Studio',

    source: r.source || 'Risk Attribute',

    questionGroup:
      r.questionGroup ||
      r.cat ||
      'Operations',

    riskAttribute:
      r.riskAttribute ||
      rows[0]?.f ||
      '',

    riskAttributeId,

    assignedTo:
      r.assignedTo ||
      r.out?.assignedTo ||
      '—',

    fallbackUnderwriter:
      r.fallbackUnderwriter ||
      r.out?.fallback ||
      '—',

    authorityLevel:
      r.authorityLevel ||
      r.out?.authority ||
      '—',

    cat:
      r.cat ||
      r.questionGroup ||
      '—',

    desc:
      r.desc ||
      r.description ||
      '',

    out:
      r.out ||
      {
        type: type.charAt(0).toUpperCase() + type.slice(1)
      },

    condition:
      r.condition ||
      {
        groups: [
          {
            logic: (r.logic || 'AND')
              .toString()
              .toUpperCase(),
            rows
          }
        ]
      },

    prio: r.prio || {},
    auth: r.auth || {},
    audit: r.audit || []
  });
}

  function persistRules() {
    const app = PS.prototypeApp;
    const pid = PS.studioHub?.productId || app?.context?.()?.productId;
    const ver = PS.studioHub?.productVersion || app?.context?.()?.version;
    if (pid && PS.uwRuleStore) {
      PS.uwRuleStore.saveRules(pid, ver, RULES.map(normalizeRule), { silent: false });
      return;
    }
    app?.persistCollection?.('underwritingRules', RULES);
  }

  function refreshFromStore() {
    const app = PS.prototypeApp;
    const pid = PS.studioHub?.productId || app?.context?.()?.productId;
    const ver = PS.studioHub?.productVersion || app?.context?.()?.version;
    if (!pid || !PS.uwRuleStore) return;
    const synced = PS.uwRuleStore.syncAll(pid, ver, { silent: true });
    RULES.splice(0, RULES.length, ...synced.map(normalizeRule));
    if (RULES.length && !RULES.some(r => r.id === activeRuleId)) activeRuleId = RULES[0]?.id || '';
    PS.studioHub?.paint?.();
    renderSidebar();
  }

  function isDefinitionLocked(r) {
    return PS.uwRuleStore?.isDefinitionLocked?.(r) || false;
  }

  function viewSourceHref(r) {
    const app = PS.prototypeApp;
    const pid = PS.studioHub?.productId || app?.context?.()?.productId;
    const ver = PS.studioHub?.productVersion || app?.context?.()?.version;
    return PS.uwRuleStore?.viewSourceHref?.(r, pid, ver) || '#';
  }

  function statusBadgeHtml(status) {
    const s = String(status || 'active').toLowerCase();
    const cls = s === 'active' ? 'rule-status-active' : s === 'inactive' ? 'outcome-decline' : 'outcome-refer';
    return `<span class="rule-outcome-badge ${cls}" style="text-transform:uppercase;font-size:10px">${s}</span>`;
  }

  function isTruckingUWProduct() {
    const product = PS.prototypeApp?.productById?.(PS.studioHub?.productId);
    return PS.isTruckingProduct?.(product) || String(product?.family || '').toLowerCase().includes('truck');
  }

  function maybeAutoApplyTruckingRules() {
    if (RULES.length || !isTruckingUWProduct() || typeof PS.truckingUnderwritingRules !== 'function') return false;
    const catalog = PS.truckingUnderwritingRules().map(r => normalizeRule(Object.assign({}, r, {
      sourceStudio: PS.uwRuleStore?.STUDIOS?.UNDERWRITING || 'Underwriting Studio',
      syncKey: `native::${r.id}`
    })));
    RULES.splice(0, RULES.length, ...catalog);
    activeRuleId = RULES[0]?.id || '';
    persistRules();
    refreshFromStore();
    return true;
  }

  function conditionSummary(r) {
    return typeof PS.uwConditionSummary === 'function' ? PS.uwConditionSummary(r) : '—';
  }

  function sourceDisplay(r) {
    const studio = String(r?.sourceStudio || '');
    if (studio.includes('Coverage')) return 'Coverage';
    if (studio.includes('Question')) return 'Questions';
    if (studio.includes('Eligibility')) return 'Questions';
    if (studio.includes('Product') || studio.includes('Distribution')) return 'Product';
    if (studio.includes('Risk')) return 'Risk';
    if (studio.includes('Underwriting')) {
      return (r.riskAttributeId || r.riskAttribute) ? 'Risk' : 'Underwriting';
    }
    return r.riskAttributeId ? 'Risk' : 'Underwriting';
  }

  function sourceFilterKey(r) {
    return sourceDisplay(r).toLowerCase();
  }

  function categoryOptions() {
    const cats = new Set(RULES.map(r => String(r.questionGroup || r.cat || '').trim()).filter(Boolean));
    QUESTION_GROUPS.forEach(g => cats.add(g));
    return [...cats].sort();
  }

  function injectExtraFilters() {
    const toolbar = document.querySelector('#studio-hub .cs-hub-toolbar');
    if (!toolbar) return;
    if (!document.getElementById('hub-source-filter')) {
      const src = document.createElement('select');
      src.id = 'hub-source-filter';
      src.className = 'cs-page-size';
      src.setAttribute('aria-label', 'Filter by source');
      src.innerHTML = SOURCE_FILTERS.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
      src.addEventListener('change', () => {
        activeSourceFilter = src.value || 'all';
        PS.studioHub.page = 1;
        PS.studioHub.renderTable();
      });
      toolbar.appendChild(src);
    }
    if (!document.getElementById('hub-group-filter')) {
      const sel = document.createElement('select');
      sel.id = 'hub-group-filter';
      sel.className = 'cs-page-size';
      sel.setAttribute('aria-label', 'Filter by category');
      const renderCatOpts = () => {
        sel.innerHTML = `<option value="all">All categories</option>${categoryOptions().map(g => `<option value="${g}">${g}</option>`).join('')}`;
        sel.value = activeGroupFilter;
      };
      renderCatOpts();
      sel.addEventListener('change', () => {
        activeGroupFilter = sel.value || 'all';
        PS.studioHub.page = 1;
        PS.studioHub.renderTable();
      });
      toolbar.appendChild(sel);
      PS.studioHub._refreshCategoryFilter = renderCatOpts;
    }
  }

  function patchHubFilters() {
    const origFiltered = PS.studioHub.filtered.bind(PS.studioHub);
    PS.studioHub.filtered = function () {
      let base = origFiltered();
      if (activeGroupFilter !== 'all') {
        base = base.filter(item => String(item.questionGroup || item.cat || '') === activeGroupFilter);
      }
      if (activeSourceFilter !== 'all') {
        base = base.filter(item => sourceFilterKey(item) === activeSourceFilter);
      }
      return base;
    };
    const origRenderShell = PS.studioHub.renderShell.bind(PS.studioHub);
    PS.studioHub.renderShell = function () {
      origRenderShell();
      injectExtraFilters();
      const filter = document.getElementById('hub-filter');
      if (filter && filter.options[0]) filter.options[0].textContent = 'All decisions';
    };
  }

  window.closeUwDrawer = function closeUwDrawer() {
    document.getElementById('uw-drawer-overlay')?.classList.remove('open');
    document.getElementById('uw-rule-drawer')?.classList.remove('open');
  };

  function openUwDrawer(r) {
  if (!r) return;
  activeRuleId = r.id;

  const overlay = document.getElementById('uw-drawer-overlay');
  const drawer = document.getElementById('uw-rule-drawer');

  document.getElementById('uw-drawer-name').textContent = r.name;
  document.getElementById('uw-drawer-id').textContent = r.id;

  const body = document.getElementById('uw-drawer-body');
  const footer = document.getElementById('uw-drawer-footer');
  const locked = isDefinitionLocked(r);

  body.innerHTML = `
    <div class="uw-drawer-field"><label>Decision</label><div><span class="rule-outcome-badge outcome-${r.type}">${(r.type || '').toUpperCase()}</span></div></div>
    <div class="uw-drawer-field"><label>Condition</label><div>${conditionSummary(r)}</div></div>
    <div class="uw-drawer-field"><label>Source</label><div><span class="uw-source-badge uw-src-${sourceFilterKey(r)}">${sourceDisplay(r).toUpperCase()}</span> · ${r.sourceStudio || 'Underwriting Studio'}</div></div>
    <div class="uw-drawer-field"><label>Question Group</label><div>${r.questionGroup || r.cat || '—'}</div></div>
    <div class="uw-drawer-field"><label>Risk Attribute</label><div>${r.riskAttribute || '—'}</div></div>
    <div class="uw-drawer-field mono"><label>Risk Attribute ID</label><div>${r.riskAttributeId || '—'}</div></div>
    <div class="uw-drawer-field"><label>Assigned Underwriter</label><div>${r.assignedTo || '—'}</div></div>
    <div class="uw-drawer-field"><label>Authority Required</label><div>${r.authorityLevel || r.out?.authority || '—'}</div></div>
    <div class="uw-drawer-field"><label>Fallback Underwriter</label><div>${r.fallbackUnderwriter || r.out?.fallback || '—'}</div></div>
    <div class="uw-drawer-field"><label>Status</label><div>${statusBadgeHtml(r.status)}${r.inactiveReason ? `<div style="font-size:12px;color:var(--color-muted);margin-top:6px">${r.inactiveReason}</div>` : ''}</div></div>
    ${r.status === 'inactive' ? `<div class="callout-body" style="font-size:12px">Source rule disabled in ${r.sourceStudio || 'originating studio'}.</div>` : ''}
    <div class="uw-drawer-field"><label>Escalation path</label><div style="font-size:13px;color:var(--color-muted);line-height:1.6">${r.assignedTo || 'Assigned underwriter'} → if outside authority → ${r.fallbackUnderwriter || 'Commercial Underwriting Manager'}</div></div>
    <div class="uw-drawer-field"><label>Priority</label><div>${r.priority ?? '—'}</div></div>`;

  footer.innerHTML = `
    ${locked ? '' : `<button class="btn btn-secondary btn-sm" type="button" onclick="openRuleEditor('${r.id}')">Edit Rule</button>`}
    <button class="btn btn-secondary btn-sm" type="button" onclick="closeUwDrawer(); openTestRulesModal();">Test Rule</button>
    <a class="btn btn-ghost btn-sm" href="${viewSourceHref(r)}">View Source</a>`;

  overlay?.classList.add('open');
  drawer?.classList.add('open');
}

// ADD THIS LINE
window.openUwDrawer = openUwDrawer;

  function renderSidebar() {
    const list = document.getElementById('rule-list');
    if (!list) return;
    const groups = [
      { type: 'decline', label: 'DECLINE' },
      { type: 'refer', label: 'REFER' },
      { type: 'accept', label: 'ACCEPT' }
    ];
    list.innerHTML = groups.map(g => {
      const rules = RULES.filter(r => r.type === g.type).sort((a, b) => a.priority - b.priority);
      return `
        <div class="rule-section">
          <div class="rule-section-header"><div class="rule-section-label">${g.label} RULES (${rules.length})</div></div>
          ${rules.map(r => `
            <div class="rule-item ${r.id === activeRuleId ? 'active' : ''}" onclick="loadRule('${r.id}')" id="ri-${r.id}">
              <div class="rule-outcome-badge outcome-${r.type}">${r.type}</div>
              <div class="rule-item-body">
                <div class="rule-item-name">${r.name}</div>
                <div class="rule-item-meta">${r.id} · Priority ${r.priority}</div>
              </div>
              <span class="rule-status-icon ${r.status === 'active' ? 'rule-status-active' : ''}">${r.status === 'active' ? '✓' : '✕'}</span>
            </div>`).join('')}
        </div>`;
    }).join('');
  }

  function rof(label, value, mono) {
    return `<div class="form-group"><label class="form-label">${label}</label>
      <div style="font-size:${mono ? '12px' : '14px'};font-family:${mono ? "'IBM Plex Mono',monospace" : 'inherit'};color:var(--color-ink);padding:4px 0">${value || '—'}</div></div>`;
  }

  function buildSection(id, num, title, subtitle, content) {
    const isOpen = openSections.has(id);
    return `<div class="section-card">
      <div class="section-header" onclick="toggleSection('${id}')">
        <div class="section-header-left"><div class="section-number">${num}</div><div><div class="section-title">${title}</div><div class="section-subtitle">${subtitle}</div></div></div>
        <svg class="section-chevron ${isOpen ? 'open' : ''}" id="sec-chev-${id}" width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M181.66 133.66l-80 80a8 8 0 01-11.32-11.32L164.69 128 90.34 53.66a8 8 0 0111.32-11.32l80 80a8 8 0 010 11.32z" fill="currentColor"/></svg>
      </div>
      <div class="section-body ${isOpen ? 'open' : ''}" id="sec-body-${id}"><div class="section-inner">${content}</div></div>
    </div>`;
  }

  window.toggleSection = function toggleSection(id) {
    const b = document.getElementById(`sec-body-${id}`);
    const c = document.getElementById(`sec-chev-${id}`);
    const o = b?.classList.contains('open');
    if (o) { b?.classList.remove('open'); c?.classList.remove('open'); openSections.delete(id); }
    else { b?.classList.add('open'); c?.classList.add('open'); openSections.add(id); }
  };

  window.loadRule = function loadRule(id) {
    activeRuleId = id;
    document.querySelectorAll('.rule-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`ri-${id}`)?.classList.add('active');
    const rule = RULES.find(r => r.id === id);
    if (!rule) return;
    if (PS.studioHub?.mode === 'hub') {
      openUwDrawer(rule);
      return;
    }
    renderDetail(rule);
    renderSidebar();
  };

  window.openRuleEditor = function openRuleEditor(id) {
    closeUwDrawer();
    activeRuleId = id;
    PS.studioHub?.showEditor?.();
    renderSidebar();
    renderDetail(RULES.find(r => r.id === id));
  };

  function renderDetail(r) {
    const p = document.getElementById('detail-panel');
    if (!p) return;
    const condHtml = (r.condition?.groups || []).map(g => `
      <div class="cb-group">
        <div class="cb-group-label">GROUP (${g.logic}):</div>
        ${(g.rows || []).map((row, i) => `
          <div class="cb-row">
            <input type="text" class="form-control" style="flex:1" value="${row.f}" disabled>
            <input type="text" class="form-control" style="width:100px;text-align:center" value="${row.op}" disabled>
            <input type="text" class="form-control" style="flex:1" value="${row.v}" disabled>
          </div>
          ${i < g.rows.length - 1 ? `<div class="cb-logic-connector">${g.logic}</div>` : ''}`).join('')}
      </div>`).join('');

    p.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-2);flex-wrap:wrap">
        <h2 style="font-size:18px;font-weight:700;margin:0">${r.name}</h2>
        <span class="rule-outcome-badge outcome-${r.type}">${r.type}</span>
        ${statusBadgeHtml(r.status)}
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--color-muted);background:var(--color-surface);border:1px solid var(--color-border);border-radius:4px;padding:2px 7px">${r.id}</span>
        <span class="uw-source-badge">${r.sourceStudio || 'Underwriting Studio'}</span>
      </div>
      ${r.status === 'inactive' ? `<div class="callout-body" style="margin-bottom:var(--space-4);font-size:13px;color:var(--color-danger)">This rule was removed from ${r.sourceStudio || 'its source studio'} and is marked inactive to preserve references.</div>` : ''}
      ${isDefinitionLocked(r) ? `<div class="callout-body" style="margin-bottom:var(--space-4);font-size:13px">Rule definition is managed in <strong>${r.sourceStudio}</strong>. Underwriting Studio controls assignment and escalation only.</div>` : ''}

      ${buildSection('identity', '1', 'Rule Identity', `${r.questionGroup || r.cat} · Priority ${r.priority}`, `
        <div class="form-grid-2">
          ${rof('Rule Name', r.name)}
          ${rof('Rule ID', r.id, true)}
          ${rof('Status', (r.status || 'active').toUpperCase())}
          ${rof('Source Studio', r.sourceStudio || 'Underwriting Studio')}
          ${rof('Question Group', r.questionGroup || r.cat)}
          ${rof('Risk Attribute', r.riskAttribute || '—')}
          ${rof('Risk Attribute ID', r.riskAttributeId || '—', true)}
          ${rof('Source', typeof PS.uwSourceLine === 'function' ? PS.uwSourceLine(r) : 'Question → Risk')}
          <div class="form-group span-2" style="display:flex;align-items:flex-end;gap:12px">
            <div style="flex:1">${rof('Description', r.desc)}</div>
            ${isDefinitionLocked(r) ? `<a class="btn btn-secondary btn-sm" href="${viewSourceHref(r)}" style="white-space:nowrap;margin-bottom:4px">View Source</a>` : ''}
          </div>
        </div>`)}

      ${buildSection('condition', '2', 'Condition', conditionSummary(r), `
        <div class="condition-builder">
          <div class="cb-header"><div class="cb-dir-btn">${r.type.toUpperCase()} WHEN:</div></div>
          ${condHtml}
        </div>`)}

      ${buildSection('outcome', '3', 'Decision', (r.type || '').toUpperCase(), `
        <div class="form-grid-2">
          ${rof('Decision', (r.type || '').toUpperCase())}
          ${rof('Priority', r.priority)}
          ${rof('Reason Code', r.out?.reason || '—', true)}
        </div>`)}

      ${buildSection('assignment', '4', 'Assignment & Escalation', r.assignedTo || '—', `
        <div class="form-grid-2">
          ${rof('Assigned Underwriter', r.assignedTo)}
          ${rof('Authority Required', r.authorityLevel || r.out?.authority || '—')}
          ${rof('Fallback Underwriter', r.fallbackUnderwriter || r.out?.fallback || '—')}
          <div class="form-group span-2">
            <label class="form-label">Escalation path</label>
            <div style="font-size:13px;color:var(--color-muted);line-height:1.6;padding:8px 0">
              ${r.assignedTo || 'Assigned underwriter'} → if outside authority → ${r.fallbackUnderwriter || 'Commercial Underwriting Manager'}
            </div>
          </div>
        </div>`)}

      ${buildSection('prio', '5', 'Priority & Conflict Resolution', `Priority ${r.priority}`, `
        <div class="form-grid-2">
          ${rof('Priority', r.priority)}
          ${rof('Execution Order', r.prio?.exec || '—')}
          <div class="form-group span-2">${rof('Conflict Behavior', r.prio?.conflict || 'Decline → Refer → Accept')}</div>
        </div>`)}

      ${buildSection('preview', '6', 'Rule Preview', 'Plain-language summary', `
        <div class="rule-preview-box">
          <div class="rp-title">${r.name} (${r.id})</div>
          <div class="rp-meta">Priority ${r.priority} · ${r.type.toUpperCase()} · ${r.questionGroup || r.cat}</div>
          <div class="rp-line"><span class="rp-label">When:</span><span class="rp-value">${conditionSummary(r)}</span></div>
          <div class="rp-line"><span class="rp-label">Then:</span><span class="rp-value">${r.type.toUpperCase()} · Assigned to ${r.assignedTo || '—'}</span></div>
          <div class="rp-line"><span class="rp-label">Source Studio:</span><span class="rp-value">${r.sourceStudio || 'Underwriting Studio'}</span></div>
          <div class="rp-line"><span class="rp-label">Source:</span><span class="rp-value">${typeof PS.uwSourceLine === 'function' ? PS.uwSourceLine(r) : r.source}</span></div>
        </div>`)}
    `;
    openSections.forEach(sid => {
      document.getElementById(`sec-body-${sid}`)?.classList.add('open');
      document.getElementById(`sec-chev-${sid}`)?.classList.add('open');
    });
  }

  function riskOptionsHtml(selectedId) {
    return productRiskAttributes().map(a => {
      const id = a.id || a.code;
      const sel = id === selectedId ? 'selected' : '';
      return `<option value="${id}" data-name="${String(a.name).replace(/"/g, '&quot;')}" data-group="${a.questionGroup || a.category || ''}" data-type="${a.type || 'Text'}" data-field="${a.fieldKey || ''}" ${sel}>${a.name}</option>`;
    }).join('');
  }

  function operatorOptionsHtml(type, selected) {
    const ops = typeof PS.uwOperatorsForType === 'function' ? PS.uwOperatorsForType(type) : ['=', '!=', '>', '<'];
    return ops.map(op => `<option ${op === selected ? 'selected' : ''}>${op}</option>`).join('');
  }

  window.onUwRiskChange = function onUwRiskChange() {
    const sel = document.getElementById('new-uw-risk');
    const opt = sel?.selectedOptions?.[0];
    if (!opt) return;
    const group = document.getElementById('new-uw-group');
    const op = document.getElementById('new-uw-op');
    if (group) group.value = opt.getAttribute('data-group') || '';
    if (op) op.innerHTML = operatorOptionsHtml(opt.getAttribute('data-type') || 'Text');
  };

  window.openDecisionTreeModal = function openDecisionTreeModal() {
    const sorted = RULES.filter(r => String(r.status || 'active').toLowerCase() !== 'inactive')
      .slice().sort((a, b) => (a.priority || 99) - (b.priority || 99));
    const buildTreeHtml = (rules, depth) => {
      if (!rules.length || depth > 8) {
        return `<div class="dt-tree-node" style="border-color:var(--color-success)"><div class="dt-node-title" style="color:var(--color-success)">ACCEPT</div></div>`;
      }
      const rule = rules[0];
      const rest = rules.slice(1);
      const cond = conditionSummary(rule);
      return `
        <div class="dt-tree-connector"></div>
        <div class="dt-tree-node">
          <div class="dt-node-title">${rule.riskAttribute || rule.name}?</div>
          <div style="font-size:11px;color:var(--color-muted);margin:6px 0">${cond}</div>
        </div>
        <div class="dt-tree-branch">
          <div class="dt-tree-arm">
            <div class="dt-branch-label">YES</div>
            <div class="rule-outcome-badge outcome-${rule.type}">${rule.type.toUpperCase()}</div>
            <div style="font-size:11px;color:var(--color-muted)">${rule.assignedTo || '—'}</div>
          </div>
          <div class="dt-tree-arm">
            <div class="dt-branch-label">NO</div>
            ${buildTreeHtml(rest, depth + 1)}
          </div>
        </div>`;
    };
    PS.openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Decision Tree View</h2>
        <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body" style="padding:0">
        <div class="dt-layout">
          <div class="dt-sidebar">
            <div style="font-size:12px;font-weight:600;margin-bottom:var(--space-4);color:var(--color-muted);text-transform:uppercase">Execution Order (${sorted.length})</div>
            ${sorted.map(r => `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:12px;cursor:pointer" onclick="PS.closeModal(); window.openUwDrawer(RULES.find(x=>x.id==='${r.id}'))">
                <span style="width:20px;height:20px;border-radius:50%;background:var(--color-surface);border:1px solid var(--color-border);display:flex;align-items:center;justify-content:center;font-size:10px">${r.priority}</span>
                <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name}</span>
                <span class="rule-outcome-badge outcome-${r.type}" style="height:16px;font-size:9px">${r.type}</span>
              </div>`).join('')}
          </div>
          <div class="dt-canvas">
            <div style="padding:8px 16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:100px;font-size:11px;font-weight:700;margin-bottom:8px">START</div>
            ${buildTreeHtml(sorted, 0)}
          </div>
        </div>
      </div>`, 'modal-xl');
  };

  window.openTestRulesModal = function openTestRulesModal() {
    const attrs = productRiskAttributes().slice(0, 12);
    PS.openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Test Underwriting Rules</h2>
        <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body" style="padding:0">
        <div class="test-layout">
          <div class="test-input-panel">
            <div style="font-size:14px;font-weight:600;margin-bottom:var(--space-4)">Sample Risk Values</div>
            ${attrs.map(a => {
              const key = a.fieldKey || String(a.name).toLowerCase().replace(/[^a-z0-9]+/g, '_');
              const val = a.type === 'Boolean' ? 'No' : (a.name.includes('Fleet') ? '60' : a.name.includes('Cargo Value') ? '750000' : a.name.includes('Claims') ? '1' : '');
              const input = a.type === 'Boolean'
                ? `<select class="form-control" id="tr-${key}"><option>No</option><option>Yes</option></select>`
                : `<input class="form-control" id="tr-${key}" value="${val}">`;
              return `<div class="form-group"><label class="form-label">${a.name}</label>${input}</div>`;
            }).join('')}
            <button class="btn btn-primary" onclick="runTest()" style="width:100%;justify-content:center;margin-top:var(--space-3)">Run Underwriting Engine</button>
          </div>
          <div class="test-result-panel" id="test-results">
            <div style="text-align:center;padding:60px 24px;color:var(--color-muted)">
              <div style="font-size:28px;margin-bottom:8px">⚖️</div>
              <div style="font-size:14px;font-weight:500">Enter risk values and run engine</div>
            </div>
          </div>
        </div>
      </div>`, 'modal-lg');
  };

  window.runTest = function runTest() {
    const inputs = {};
    productRiskAttributes().forEach(a => {
      const key = a.fieldKey || String(a.name).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const el = document.getElementById(`tr-${key}`);
      if (el) inputs[key] = el.value;
    });
    const activeRules = RULES.filter(r => String(r.status || 'active').toLowerCase() !== 'inactive');
    const result = PS.evaluateUnderwritingRules(activeRules, inputs);
    const final = result.final;
    const decision = final ? final.type.toUpperCase() : 'ACCEPT';
    const cls = final?.type || 'accept';
    const escalation = typeof PS.resolveUnderwriterEscalation === 'function'
      ? PS.resolveUnderwriterEscalation(final, inputs)
      : { assignedTo: final?.assignedTo || 'Auto Underwriter', authority: final?.authorityLevel || '—', escalated: false, path: [] };
    document.getElementById('test-results').innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-5);padding:var(--space-4);border-radius:var(--radius-md);background:var(--color-surface);border:1px solid var(--color-border)">
        <span style="font-size:24px">⚖️</span>
        <div>
          <div style="font-size:12px;color:var(--color-muted);margin-bottom:4px">FINAL DECISION</div>
          <div style="font-size:18px;font-weight:700"><span class="rule-outcome-badge outcome-${cls}">${decision}</span></div>
          <div style="font-size:13px;color:var(--color-muted);margin-top:4px">${result.triggered.length} rule${result.triggered.length === 1 ? '' : 's'} triggered · ${activeRules.length} evaluated</div>
          ${result.severityNote ? `<div style="font-size:11px;color:var(--color-brand);margin-top:4px">${result.severityNote}</div>` : ''}
        </div>
      </div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">Triggered Rules</div>
      ${result.triggered.map(r => `
        <div class="test-result-item test-trigger">
          <span class="test-icon">✓</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${r.name}</div>
            <div style="font-size:12px;color:var(--color-muted);margin-top:2px;font-family:'IBM Plex Mono',monospace">${conditionSummary(r)}</div>
            <div style="font-size:12px;color:var(--color-brand);margin-top:4px">${r.type.toUpperCase()}</div>
          </div>
        </div>`).join('') || '<div style="font-size:13px;color:var(--color-muted);margin-bottom:12px">No rules triggered — default accept path applies.</div>'}
      <div style="margin-top:var(--space-4);padding:var(--space-4);background:var(--color-panel);border:1px solid var(--color-border);border-radius:var(--radius-md)">
        <div style="font-size:13px;margin-bottom:6px"><strong>Assigned To:</strong> ${escalation.assignedTo || '—'}</div>
        <div style="font-size:13px;margin-bottom:6px"><strong>Authority:</strong> ${escalation.authority || '—'} Required</div>
        ${escalation.escalated ? `<div style="font-size:12px;color:var(--color-brand);margin-top:8px;line-height:1.6"><strong>Escalation:</strong><br>${escalation.path.join('<br>→ ')}</div>` : ''}
      </div>`;
  };

  window.openAuthorityModal = function openAuthorityModal() {
    const rows = typeof PS.truckingUnderwriterAuthority === 'function' ? PS.truckingUnderwriterAuthority() : [];
    PS.openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Underwriter Authority</h2>
        <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--color-muted);margin:0 0 16px">Define which underwriters are authorized to handle particular rules and risk levels. If assigned authority is insufficient, rules escalate to the configured fallback underwriter.</p>
        <table class="audit-table">
          <thead><tr><th>Underwriter</th><th>Role</th><th>Authority Level</th><th>Max Insured Value</th><th>Max Cargo Value</th><th>Allowed Rule Types</th><th>Status</th></tr></thead>
          <tbody>${rows.map(r => `<tr><td>${r.name}</td><td>${r.role}</td><td>${r.level}</td><td>${r.maxInsured}</td><td>${r.maxCargo}</td><td>${r.ruleTypes}</td><td>${r.status}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Close</button></div>`);
  };

  window.openAddUWRuleModal = function openAddUWRuleModal() {
    PS.openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Add Underwriting Rule</h2>
        <button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="form-group span-2"><label class="form-label">Rule Name <span class="required">*</span></label><input class="form-control" id="new-uw-name" placeholder="e.g. High-Value Cargo"></div>
          <div class="form-group"><label class="form-label">Rule ID <span class="required">*</span></label><input class="form-control text-mono" id="new-uw-id" placeholder="UW-REF-007"></div>
          <div class="form-group"><label class="form-label">Source</label>
            <select class="form-control" id="new-uw-source"><option value="Risk Studio">Risk Studio</option><option value="Underwriting Studio">Underwriting Studio</option></select>
          </div>
          <div class="form-group"><label class="form-label">Decision <span class="required">*</span></label>
            <select class="form-control" id="new-uw-outcome"><option value="refer">Refer</option><option value="decline">Decline</option><option value="accept">Accept</option></select>
          </div>
          <div class="form-group"><label class="form-label">Question Group</label><input class="form-control" id="new-uw-group" readonly></div>
          <div class="form-group span-2"><label class="form-label">Risk Attribute <span class="required">*</span></label>
            <select class="form-control" id="new-uw-risk" onchange="onUwRiskChange()"><option value="">Select risk attribute…</option>${riskOptionsHtml('')}</select>
          </div>
          <div class="form-group"><label class="form-label">Operator <span class="required">*</span></label><select class="form-control" id="new-uw-op">${operatorOptionsHtml('Number')}</select></div>
          <div class="form-group"><label class="form-label">Value <span class="required">*</span></label><input class="form-control" id="new-uw-value" placeholder="e.g. 500000"></div>
          <div class="form-group"><label class="form-label">Priority</label><input type="number" class="form-control" id="new-uw-priority" value="20"></div>
          <div class="form-group"><label class="form-label">Assigned Underwriter</label><input class="form-control" id="new-uw-assigned" placeholder="Senior Underwriter"></div>
          <div class="form-group"><label class="form-label">Authority Level</label><input class="form-control" id="new-uw-authority" placeholder="Level 2" value="Level 2"></div>
          <div class="form-group span-2"><label class="form-label">Fallback Underwriter</label><input class="form-control" id="new-uw-fallback" placeholder="Commercial Underwriting Manager"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="executeAddUWRule()">Create Rule</button>
      </div>`, 'modal-md');
  };

  window.executeAddUWRule = function executeAddUWRule() {
    const name = document.getElementById('new-uw-name')?.value.trim();
    const id = document.getElementById('new-uw-id')?.value.trim();
    const riskSel = document.getElementById('new-uw-risk');
    const opt = riskSel?.selectedOptions?.[0];
    if (!name || !id) return PS.actionResult?.('error', 'Required fields', 'Rule name and ID are required.');
    if (!opt?.value) return PS.actionResult?.('error', 'Risk attribute required', 'Select a risk attribute from Risk Studio.');
    const type = document.getElementById('new-uw-outcome')?.value || 'refer';
    const op = document.getElementById('new-uw-op')?.value || '=';
    const value = document.getElementById('new-uw-value')?.value ?? '';
    const priority = Number(document.getElementById('new-uw-priority')?.value || 20);
    const assigned = document.getElementById('new-uw-assigned')?.value.trim() || '—';
    const fallback = document.getElementById('new-uw-fallback')?.value.trim() || 'Commercial Underwriting Manager';
    const authority = document.getElementById('new-uw-authority')?.value.trim() || 'Level 2';
    const sourceStudio = document.getElementById('new-uw-source')?.value || 'Risk Studio';
    const group = document.getElementById('new-uw-group')?.value || opt.getAttribute('data-group') || 'Operations';
    const riskName = opt.getAttribute('data-name') || opt.textContent;
    const fieldKey = opt.getAttribute('data-field') || '';
    if (RULES.some(r => r.id === id)) return PS.actionResult?.('error', 'ID in use', `${id} already exists.`);
    const rule = normalizeRule({
      id, name, type, priority, status: 'draft',
      sourceStudio,
      syncKey: `native::${id}`,
      source: 'Risk Attribute', questionGroup: group,
      riskAttributeId: opt.value, riskAttribute: riskName, assignedTo: assigned,
      fallbackUnderwriter: fallback, authorityLevel: authority, cat: group,
      desc: `${name} — rule on ${riskName}.`,
      condition: { groups: [{ logic: 'AND', rows: [{ f: riskName, fieldKey, op, v: value }] }] },
      out: { type: type.charAt(0).toUpperCase() + type.slice(1), assignedTo: assigned, fallback },
      audit: [{ d: new Date().toISOString().slice(0, 10), u: 'You', c: `Created ${id}` }]
    });
    RULES.push(rule);
    activeRuleId = id;
    persistRules();
    PS.closeModal();
    PS.studioHub?.paint();
    PS.studioHub?.open(id);
    PS.actionResult?.('success', 'Rule created', `${name} (${id}) added to this product.`);
  };

  document.addEventListener('DOMContentLoaded', () => {
    PS.studioHub.mount({
      navId: 'underwriting',
      studioLabel: 'Underwriting Studio',
      collection: 'underwriting',
      apiField: 'underwriting',
      persist: 'underwritingRules',
      persistTarget: () => RULES,
      skipProductColumn: true,
      getItems: () => RULES,
      applyItems: list => {
        RULES.splice(0, RULES.length, ...(Array.isArray(list) ? list : []).map(normalizeRule));
        if (RULES.length && !RULES.some(r => r.id === activeRuleId)) activeRuleId = RULES[0].id;
        if (!RULES.length) activeRuleId = '';
      },
      getActiveId: () => activeRuleId,
      setActiveId: id => { activeRuleId = id; },
      loadItem: loadRule,
      renderSidebar,
      noun: 'rules',
      hubTitle: 'Underwriting Rules',
      hubSubtitle: 'Manage eligibility and underwriting rules linked to this product.',
      searchPlaceholder: 'Search rules...',
      hideLastUpdated: true,
      addOnclick: 'openAddUWRuleModal()',
      deepParam: 'rule',
      onOpenItem: id => {
        const rule = RULES.find(r => r.id === id);
        if (rule) openUwDrawer(rule);
      },
      rowMenuHtml: item => `
        <button type="button" onclick="window.openUwDrawer(RULES.find(r=>r.id==='${item.id}'))">View details</button>
        <button type="button" onclick="openTestRulesModal()">Test rule</button>
        <button type="button" onclick="openRuleEditor('${item.id}')">Edit assignment</button>`,
      searchKeys: ['name', 'id', 'type', 'questionGroup', 'cat', 'riskAttribute', 'desc', 'assignedTo', 'sourceStudio'],
      filters: [
        { value: 'all', label: 'All decisions' },
        { value: 'accept', label: 'Accept' },
        { value: 'decline', label: 'Decline' },
        { value: 'refer', label: 'Refer' }
      ],
      matchFilter: (item, filter) => filter === 'all' || item.type === filter,
      stats: items => [`${items.length} rules configured`],
      contextStats: items => {
        const count = t => items.filter(r => String(r.type).toLowerCase() === t && String(r.status || 'active').toLowerCase() !== 'inactive').length;
        return [`${items.length} rules`, `${count('decline')} decline`, `${count('refer')} refer`, `${count('accept')} accept`];
      },
      isCreated: item => item.status === 'active',
      statusLabel: item => {
        const s = String(item.status || 'draft').toLowerCase();
        if (s === 'active') return 'Active';
        if (s === 'inactive') return 'Inactive';
        return 'Draft';
      },
      columns: [
        { header: 'Rule Name', value: r => r.name, primary: true },
        { header: 'Rule ID', value: r => r.id, mono: true },
        { header: 'Condition', value: r => conditionSummary(r) },
        { header: 'Decision', value: r => (r.type || '').toUpperCase(), kind: 'decision' },
        { header: 'Source', value: r => sourceDisplay(r), kind: 'source-studio-badge' },
        { header: 'Assigned To', value: r => (r.assignedTo && r.assignedTo !== '—') ? r.assignedTo : '—' },
        { header: 'Status', value: r => r.status || 'active', kind: 'rule-status' }
      ]
    });
    patchHubFilters();
    maybeAutoApplyTruckingRules();
    refreshFromStore();
    window.addEventListener('ps:uw-rules-synced', () => {
      const app = PS.prototypeApp;
      const pid = PS.studioHub?.productId || app?.context?.()?.productId;
      const detail = window.__psLastUwSync;
      if (detail?.productId && detail.productId !== pid) return;
      const rules = PS.uwRuleStore?.getRules?.(pid, PS.studioHub?.productVersion) || [];
      RULES.splice(0, RULES.length, ...rules.map(normalizeRule));
      PS.studioHub?._refreshCategoryFilter?.();
      PS.studioHub?.renderTable?.();
      renderSidebar();
    });
  });

  window.addEventListener('ps:uw-rules-synced', e => { window.__psLastUwSync = e.detail; });
})();
