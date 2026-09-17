/* Commercial Trucking documents — Document Guide */
window.PS = window.PS || {};

(function () {
  const TRIGGERS = {
    PRE_BIND: [
      { value: 'QUOTE_CREATED', label: 'Quote Created' },
      { value: 'APPLICATION_SUBMITTED', label: 'Application Submitted' },
      { value: 'UNDERWRITING_COMPLETED', label: 'Underwriting Completed' },
      { value: 'QUOTE_ACCEPTED', label: 'Quote Accepted' },
      { value: 'BEFORE_BIND', label: 'Before Bind' }
    ],
    POST_BIND: [
      { value: 'POLICY_BOUND', label: 'Policy Bound' },
      { value: 'POLICY_ISSUED', label: 'Policy Issued' },
      { value: 'ENDORSEMENT_ADDED', label: 'Endorsement Added' },
      { value: 'CANCELLATION', label: 'Cancellation' },
      { value: 'RENEWAL', label: 'Renewal' },
      { value: 'CLAIM_SUBMITTED', label: 'Claim Submitted' }
    ]
  };

  const DOC_TYPES = [
    'Application', 'Supplement', 'Schedule', 'Certificate', 'Core', 'Policy Wording',
    'Declaration', 'Endorsement', 'Notice', 'Invoice', 'Quote', 'Underwriting', 'Other'
  ];

  function doc(id, name, stage, type, trigger, required, desc, extra) {
    const stageKey = stage === 'POST_BIND' ? 'POST_BIND' : 'PRE_BIND';
    return Object.assign({
      id,
      name,
      stage: stageKey,
      type,
      source: 'LIBRARY',
      required: required !== false,
      trigger,
      triggerLabel: [...TRIGGERS.PRE_BIND, ...TRIGGERS.POST_BIND].find(t => t.value === trigger)?.label || trigger,
      status: 'active',
      description: desc || `${name} for Commercial Trucking.`,
      template: `${id}-template`,
      icon: type === 'Endorsement' ? '📎' : type === 'Notice' ? '✉️' : type === 'Certificate' ? '📜' : type === 'Policy Wording' ? '📖' : '📄',
      ver: 'v2027.06',
      identity: { type, format: 'PDF', lang: 'English (US)', jur: 'United States', author: 'Document Team' },
      triggerMeta: { when: trigger, auto: true, del: 'Email + Portal', copies: 'Policyholder (1)', reGen: stageKey === 'POST_BIND' ? 'Yes' : 'No' },
      cond: { always: true, logic: [] },
      vars: [],
      comp: { req: true, rev: 'Compliance Team', d: '01-Aug-2026', notes: desc || '', legal: true, ref: '—', hist: 'v2027.06' },
      covers: []
    }, extra || {});
  }

  PS.truckingDocumentTriggers = function truckingDocumentTriggers(stage) {
    return stage === 'POST_BIND' ? TRIGGERS.POST_BIND.slice() : TRIGGERS.PRE_BIND.slice();
  };

  PS.truckingDocumentTypes = function truckingDocumentTypes() {
    return DOC_TYPES.slice();
  };

  PS.truckingDocuments = function truckingDocuments() {
    return [
      doc('DOC-APP-001', 'Commercial Auto Application', 'PRE_BIND', 'Application', 'QUOTE_CREATED', true, 'Primary commercial auto application capturing insured, operations, fleet and coverage selections.'),
      doc('DOC-APP-002', 'Supplemental Trucking Application', 'PRE_BIND', 'Application', 'APPLICATION_SUBMITTED', true, 'Trucking-specific supplemental application for fleet operations, cargo, and driver details.'),
      doc('DOC-DRV-001', 'Driver Schedule', 'PRE_BIND', 'Supplement', 'APPLICATION_SUBMITTED', true, 'Schedule of all named drivers including CDL information, experience, and violations.'),
      doc('DOC-FLT-001', 'Vehicle / Fleet Schedule', 'PRE_BIND', 'Schedule', 'APPLICATION_SUBMITTED', true, 'Schedule of power units and trailers with VIN, value, and use classification.'),
      doc('DOC-LOSS-001', 'Loss Run Request', 'PRE_BIND', 'Underwriting', 'UNDERWRITING_COMPLETED', true, 'Authorization and request form for five-year commercial auto loss runs.'),
      doc('DOC-UWQ-001', 'Underwriting Questionnaire', 'PRE_BIND', 'Underwriting', 'UNDERWRITING_COMPLETED', true, 'Detailed underwriting questionnaire derived from product question groups and risk attributes.'),
      doc('DOC-MVR-001', 'MVR Authorization', 'PRE_BIND', 'Supplement', 'APPLICATION_SUBMITTED', true, 'Motor vehicle record authorization for all scheduled drivers.'),
      doc('DOC-QTE-001', 'Quote Proposal', 'PRE_BIND', 'Quote', 'QUOTE_CREATED', true, 'Formal quote proposal with premium, limits, deductibles and selected coverages.'),
      doc('DOC-SIG-001', 'Signed Application', 'PRE_BIND', 'Application', 'QUOTE_ACCEPTED', true, 'Executed application and signatures required before bind.'),
      doc('DOC-QTE-002', 'Quote Letter', 'PRE_BIND', 'Quote', 'QUOTE_CREATED', false, 'Summary quote letter for broker or insured review.'),
      doc('DOC-SCH-001', 'Policy Schedule', 'POST_BIND', 'Core', 'POLICY_BOUND', true, 'Official policy schedule containing policy number, insured details, effective dates, limits, deductibles and selected coverages.'),
      doc('DOC-DEC-001', 'Declarations Page', 'POST_BIND', 'Declaration', 'POLICY_BOUND', true, 'Policy declarations summarizing forms, limits, premiums, and endorsements.'),
      doc('DOC-CERT-001', 'Certificate of Insurance', 'POST_BIND', 'Core', 'POLICY_ISSUED', true, 'Certificate of insurance for third-party evidence of coverage.'),
      doc('DOC-WORD-001', 'Commercial Auto Policy Wording', 'POST_BIND', 'Policy Wording', 'POLICY_ISSUED', true, 'Full commercial auto policy wording and insuring agreements.'),
      doc('DOC-END-001', 'Trucking Endorsements', 'POST_BIND', 'Endorsement', 'POLICY_ISSUED', false, 'Trucking-specific endorsements attached based on selected coverages.'),
      doc('DOC-END-002', 'General Exclusions Endorsement', 'POST_BIND', 'Endorsement', 'POLICY_ISSUED', false, 'Standard general exclusions endorsement.'),
      doc('DOC-POI-001', 'Proof of Insurance', 'POST_BIND', 'Certificate', 'POLICY_ISSUED', true, 'Wallet-card style proof of insurance for drivers and operators.'),
      doc('DOC-INV-001', 'Policy Invoice', 'POST_BIND', 'Invoice', 'POLICY_BOUND', true, 'Premium invoice issued at bind with payment terms.'),
      doc('DOC-CAN-001', 'Cancellation Notice', 'POST_BIND', 'Notice', 'CANCELLATION', true, 'Notice of cancellation with effective date and reason.'),
      doc('DOC-REN-001', 'Renewal Notice', 'POST_BIND', 'Notice', 'RENEWAL', true, 'Renewal invitation with updated terms and premium indication.')
    ];
  };

  PS.normalizeDocument = function normalizeDocument(d) {
    if (!d || typeof d !== 'object') return null;
    const stage = String(d.stage || '').toUpperCase().replace(/-/g, '_');
    const stageKey = stage.includes('POST') ? 'POST_BIND' : 'PRE_BIND';
    return Object.assign({}, d, {
      stage: stageKey,
      type: d.type || 'Other',
      source: d.source || 'LIBRARY',
      required: d.required !== false && d.required !== 'optional',
      status: d.status || 'active',
      trigger: d.trigger || (stageKey === 'POST_BIND' ? 'POLICY_BOUND' : 'QUOTE_CREATED'),
      triggerLabel: d.triggerLabel || [...(PS.truckingDocumentTriggers?.('PRE_BIND') || []), ...(PS.truckingDocumentTriggers?.('POST_BIND') || [])].find(t => t.value === (d.trigger || ''))?.label || d.trigger || '—',
      description: d.description || d.desc || '',
      template: d.template || `${d.id}-template`,
      icon: d.icon || '📄',
      ver: d.ver || d.version || 'v2027.06'
    });
  };

  if (PS.studioSeeds && PS.studioSeeds['PRD-015'] && typeof PS.truckingDocuments === 'function') {
    PS.studioSeeds['PRD-015'].documents = PS.truckingDocuments();
  }
})();
