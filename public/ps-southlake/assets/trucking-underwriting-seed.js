/* Commercial Trucking underwriting rules — Underwriting Guide */
window.PS = window.PS || {};

(function () {
  const AUTHORITY = [
    { name: 'John Smith', role: 'Junior Underwriter', level: 'Level 1', maxInsured: '$1M', maxCargo: '$250K', ruleTypes: 'Standard', status: 'Active' },
    { name: 'Sarah Williams', role: 'Senior Underwriter', level: 'Level 2', maxInsured: '$5M', maxCargo: '$1M', ruleTypes: 'Standard + Complex', status: 'Active' },
    { name: 'Michael Brown', role: 'Commercial Manager', level: 'Level 3', maxInsured: 'Unlimited', maxCargo: 'Unlimited', ruleTypes: 'All', status: 'Active' }
  ];

  function rule(id, name, type, priority, group, riskId, riskName, fieldKey, op, value, assigned, fallback, authority, desc, extra) {
    const decision = type.charAt(0).toUpperCase() + type.slice(1);
    return Object.assign({
      id,
      name,
      type,
      priority,
      status: 'active',
      source: 'Risk',
      sourceStudio: PS.uwRuleStore?.STUDIOS?.UNDERWRITING || 'Underwriting Guide',
      syncKey: `native::${id}`,
      questionGroup: group,
      riskAttributeId: riskId,
      riskAttribute: riskName,
      riskFieldKey: fieldKey,
      assignedTo: assigned || '—',
      fallbackUnderwriter: fallback || '—',
      authorityLevel: authority || '—',
      cat: group,
      desc: desc || `${name} — derived from ${riskName}.`,
      condition: {
        groups: [{ logic: 'AND', rows: [{ f: riskName, fieldKey, op, v: String(value) }] }]
      },
      out: {
        type: decision,
        reason: id.replace(/-/g, '_').toUpperCase(),
        assignedTo: assigned,
        fallback: fallback,
        authority: authority
      },
      prio: {
        exec: type === 'decline' ? 'Priority 1 — Decline rules' : type === 'refer' ? 'Priority 2 — Referral rules' : 'Priority 4 — Accept rules',
        conflict: 'Decline → Refer → Accept (highest severity wins)'
      },
      auth: { min: assigned || 'Underwriter', reqRsn: type !== 'accept', audit: 'Always' },
      audit: [{ d: '01-Aug-2026', u: 'Sunita Pillai', c: `Created ${id}` }]
    }, extra || {});
  }

  PS.truckingUnderwriterAuthority = function truckingUnderwriterAuthority() {
    return AUTHORITY.slice();
  };

  PS.truckingUnderwritingRules = function truckingUnderwritingRules() {
    return [
      rule('UW-DCL-001', 'Multiple Serious Driver Violations', 'decline', 1, 'Driver', 'RSK-DRV-010', 'Major Violations', 'major_violations', '>=', '2', '—', '—', 'Level 2+', 'Decline when major violations reach two or more.'),
      rule('UW-DCL-002', 'Unlicensed / Inexperienced CDL Driver', 'decline', 2, 'Driver', 'RSK-DRV-006', 'CDL Experience', 'cdl_experience', '<', '1', '—', '—', 'Level 2+', 'Decline when CDL is required but experience is under one year.', {
        condition: { groups: [{ logic: 'AND', rows: [
          { f: 'CDL Required', fieldKey: 'cdl_required', op: '=', v: 'Yes' },
          { f: 'CDL Experience', fieldKey: 'cdl_experience', op: '<', v: '1' }
        ] }] }
      }),
      rule('UW-DCL-003', 'Prior Policy Cancellation', 'decline', 3, 'Loss History', 'RSK-LSS-012', 'Prior Policy Cancellation', 'prior_policy_cancellation', '=', 'Yes', '—', '—', 'Level 2+', 'Decline recent policy cancellation without acceptable explanation.'),
      rule('UW-DCL-004', 'Critical CSA Safety Score', 'decline', 4, 'Safety', 'RSK-SFT-014', 'CSA Safety Score', 'csa_safety_score', '>', '75', '—', '—', 'Level 3', 'Decline carriers with critical CSA safety scores.'),
      rule('UW-DCL-005', 'Significant Open Loss Event', 'decline', 5, 'Claims', 'RSK-CLM-007', 'Large Loss Event', 'large_loss_event', '=', 'Yes', '—', '—', 'Level 2+', 'Decline when a significant open loss event is reported.'),
      rule('UW-REF-001', 'High-Value Cargo', 'refer', 10, 'Commodity', 'RSK-CMD-004', 'Maximum Cargo Value', 'maximum_cargo_value', '>', '500000', 'Senior Commercial Underwriter', 'Commercial Underwriting Manager', 'Level 2+', 'Refer high-value cargo exposures for senior review.'),
      rule('UW-REF-002', 'Hazardous Materials', 'refer', 11, 'Commodity', 'RSK-CMD-006', 'Hazardous Materials', 'hazardous_materials', '=', 'Yes', 'Hazmat Underwriter', 'Commercial Underwriting Manager', 'Level 2+', 'Refer hazmat operations to specialist underwriter.'),
      rule('UW-REF-003', 'Large Fleet', 'refer', 12, 'Fleet', 'RSK-FLT-001', 'Fleet Size', 'fleet_size', '>', '50', 'Senior Underwriter', 'Commercial Underwriting Manager', 'Level 2+', 'Refer fleets above fifty power units.'),
      rule('UW-REF-004', 'High CSA Safety Score', 'refer', 13, 'Safety', 'RSK-SFT-014', 'CSA Safety Score', 'csa_safety_score', '>', '65', 'Senior Underwriter', 'Commercial Underwriting Manager', 'Level 2+', 'Refer elevated CSA scores for monitoring.'),
      rule('UW-REF-005', 'Prior Large Loss', 'refer', 14, 'Loss History', 'RSK-LSS-005', 'Largest Individual Loss', 'largest_individual_loss', '>', '250000', 'Senior Commercial Underwriter', 'Commercial Underwriting Manager', 'Level 2+', 'Refer when largest individual loss exceeds threshold.'),
      rule('UW-REF-006', 'Multiple Prior Claims', 'refer', 15, 'Loss History', 'RSK-LSS-003', 'Claims in Last 5 Years', 'claims_in_last_5_years', '>=', '3', 'Senior Underwriter', 'Commercial Underwriting Manager', 'Level 2+', 'Refer accounts with three or more claims in five years.'),
      rule('UW-ACC-001', 'Small Fleet Eligibility', 'accept', 80, 'Fleet', 'RSK-FLT-001', 'Fleet Size', 'fleet_size', '<=', '25', 'Auto Underwriter', 'Junior Underwriter', 'Level 1', 'Auto-accept small fleet profiles within standard appetite.'),
      rule('UW-ACC-002', 'Clean Loss History', 'accept', 81, 'Loss History', 'RSK-LSS-003', 'Claims in Last 5 Years', 'claims_in_last_5_years', '=', '0', 'Auto Underwriter', 'Junior Underwriter', 'Level 1', 'Auto-accept risks with no claims in five years.'),
      rule('UW-ACC-003', 'Standard Operations Accept', 'accept', 90, 'Operations', 'RSK-OPR-001', 'Trucking Business Type', 'trucking_business_type', '!=', '', 'Auto Underwriter', 'Junior Underwriter', 'Level 1', 'Fallback accept when no higher-severity rule fires.'),
      rule('UW-ACC-004', 'Low-Risk Commodity Profile', 'accept', 82, 'Commodity', 'RSK-CMD-006', 'Hazardous Materials', 'hazardous_materials', '=', 'No', 'Auto Underwriter', 'Junior Underwriter', 'Level 1', 'Accept non-hazmat commodity profiles within appetite.'),
      rule('UW-ACC-005', 'Experienced Driver Pool', 'accept', 83, 'Driver', 'RSK-DRV-004', 'Average Driving Experience', 'average_driving_experience', '>=', '5', 'Auto Underwriter', 'Junior Underwriter', 'Level 1', 'Accept risks with experienced driver pools.')
    ];
  };

  PS.uwOperatorsForType = function uwOperatorsForType(type) {
    const t = String(type || 'Text').toLowerCase();
    if (t === 'number' || t === 'currency') return ['=', '!=', '>', '>=', '<', '<=', 'Between'];
    if (t === 'boolean') return ['Is Yes', 'Is No'];
    if (t === 'select') return ['=', '!=', 'In'];
    if (t === 'multi-select') return ['Contains', 'Does not contain'];
    return ['=', '!=', '>', '>=', '<', '<='];
  };

  PS.uwConditionSummary = function uwConditionSummary(r) {
    const rows = r?.condition?.groups?.[0]?.rows || [];
    if (!rows.length) return '—';
    return rows.map(row => `${row.f} ${row.op} ${row.v}`).join(' AND ');
  };

  PS.uwSourceLine = function uwSourceLine(r) {
    const group = r.questionGroup || r.cat || '—';
    const attr = r.riskAttribute || rowsField(r) || '—';
    return `Question → ${group} → ${attr}`;
  };

  function rowsField(r) {
    return r?.condition?.groups?.[0]?.rows?.[0]?.f || '';
  }

  function parseNum(v) {
    const n = Number(String(v ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }

  function rowMatches(row, inputs) {
    const key = row.fieldKey || String(row.f || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const raw = inputs[key] ?? inputs[row.f] ?? inputs[String(row.f || '').toLowerCase()];
    if (raw === undefined || raw === null || raw === '') return false;
    const op = String(row.op || '=').trim();
    const val = row.v;
    const left = String(raw).trim();
    const right = String(val).trim();

    if (op === 'Is Yes' || op === '=' && right.toLowerCase() === 'yes') return /^(yes|true|1)$/i.test(left);
    if (op === 'Is No' || op === '=' && right.toLowerCase() === 'no') return /^(no|false|0)$/i.test(left);
    if (op === 'Contains') return left.toLowerCase().includes(right.toLowerCase());
    if (op === 'Does not contain') return !left.toLowerCase().includes(right.toLowerCase());
    if (op === 'In') return right.split(',').map(s => s.trim().toLowerCase()).includes(left.toLowerCase());
    if (op === 'Between') {
      const parts = right.split(',').map(s => parseNum(s.trim()));
      const n = parseNum(left);
      return parts.length >= 2 && n >= parts[0] && n <= parts[1];
    }

    const ln = parseNum(left);
    const rn = parseNum(right);
    if (!Number.isNaN(ln) && !Number.isNaN(rn)) {
      if (op === '>=' || op === '≥') return ln >= rn;
      if (op === '<=' || op === '≤') return ln <= rn;
      if (op === '>') return ln > rn;
      if (op === '<') return ln < rn;
      if (op === '!=' || op === '≠') return ln !== rn;
      return ln === rn;
    }
    if (op === '!=' || op === '≠') return left.toLowerCase() !== right.toLowerCase();
    return left.toLowerCase() === right.toLowerCase();
  }

  PS.evaluateUnderwritingRules = function evaluateUnderwritingRules(rules, inputs) {
    const active = (Array.isArray(rules) ? rules : []).filter(r => String(r.status || 'active').toLowerCase() !== 'inactive');
    const list = active.slice().sort((a, b) => (a.priority || 99) - (b.priority || 99));
    const triggered = [];
    list.forEach(r => {
      const rows = r?.condition?.groups?.[0]?.rows || [];
      const logic = String(r?.condition?.groups?.[0]?.logic || 'AND').toUpperCase();
      const hit = logic === 'OR'
        ? rows.some(row => rowMatches(row, inputs))
        : rows.every(row => rowMatches(row, inputs));
      if (hit) triggered.push(r);
    });
    const rank = { decline: 1, refer: 2, restrict: 3, load: 4, accept: 9 };
    const final = triggered.slice().sort((a, b) => (rank[a.type] || 99) - (rank[b.type] || 99))[0] || null;
    const severityNote = triggered.length > 1
      ? `${triggered.length} rules triggered — final decision uses highest severity (Decline → Refer → Accept).`
      : '';
    return { triggered, final, reasons: triggered.map(r => PS.uwConditionSummary(r)), severityNote };
  };

  function parseAuthorityMoney(v) {
    if (!v || /unlimited/i.test(String(v))) return Infinity;
    return Number(String(v).replace(/[^0-9.]/g, '')) || 0;
  }

  PS.resolveUnderwriterEscalation = function resolveUnderwriterEscalation(finalRule, inputs, authorityRows) {
    const rows = Array.isArray(authorityRows) ? authorityRows : PS.truckingUnderwriterAuthority?.() || [];
    if (!finalRule) return { assignedTo: 'Auto Underwriter', authority: 'Level 1', escalated: false, path: ['Auto Underwriter'] };
    const cargoVal = parseAuthorityMoney(inputs.maximum_cargo_value ?? inputs.maximumCargoValue ?? inputs.cargo_value ?? 0);
    const assigned = finalRule.assignedTo && finalRule.assignedTo !== '—' ? finalRule.assignedTo : null;
    const fallback = finalRule.fallbackUnderwriter && finalRule.fallbackUnderwriter !== '—'
      ? finalRule.fallbackUnderwriter : 'Commercial Underwriting Manager';
    const findAuth = name => rows.find(r => String(r.name).toLowerCase() === String(name || '').toLowerCase()
      || String(r.role).toLowerCase() === String(name || '').toLowerCase());
    const path = [];
    let current = assigned || 'Junior Underwriter';
    path.push(current);
    let auth = findAuth(current);
    let exceeded = false;
    if (auth && cargoVal > parseAuthorityMoney(auth.maxCargo)) {
      exceeded = true;
      path.push(`Authority exceeded ($${cargoVal.toLocaleString()} > ${auth.maxCargo})`);
      current = fallback;
      path.push(current);
      auth = findAuth(current) || rows.find(r => /manager/i.test(r.role)) || rows[rows.length - 1];
      if (auth && cargoVal > parseAuthorityMoney(auth.maxCargo)) {
        current = rows[rows.length - 1]?.name || 'Commercial Underwriting Manager';
        path.push(current);
        auth = findAuth(current) || rows[rows.length - 1];
      }
    }
    return {
      assignedTo: current,
      authority: auth?.level || finalRule.authorityLevel || 'Level 2',
      escalated: exceeded,
      path,
      authorityRow: auth
    };
  };

  if (PS.studioSeeds && PS.studioSeeds['PRD-015'] && typeof PS.truckingUnderwritingRules === 'function') {
    PS.studioSeeds['PRD-015'].underwritingRules = PS.truckingUnderwritingRules();
  }
})();
