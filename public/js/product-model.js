// Shared product-structure helpers.
// Product -> Product Version -> Component (one LOB) -> Class -> Coverage (limits, deductibles, terms,
// risk-object types, questions, forms, rating plan).

export const LOBS = ['Commercial Auto', 'General Liability', 'Commercial Property', 'Workers Compensation', 'Cyber'];
export const CARRIERS = ['Southlake Specialty Insurance Company', 'Futuristic Risk Carrier'];
export const RISK_OBJECT_TYPES = ['Vehicle', 'Driver', 'Building', 'Location', 'Equipment', 'Cargo', 'Person', 'Cyber asset'];
// Same question types as the Acord form builder.
export const QUESTION_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'date', label: 'Date' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'radio', label: 'Multiple choice (one answer)' },
  { value: 'checkboxes', label: 'Checkboxes (many answers)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Single checkbox' },
];
export const QUESTION_HAS_OPTIONS = ['radio', 'checkboxes', 'dropdown'];
// A question is attached either to the whole product (version.questions) or to one coverage (coverage.questions).
export const questionBad = (q) => !String(q.label ?? '').trim() || (QUESTION_HAS_OPTIONS.includes(q.type) && !(q.options ?? []).length);
export const cloneQuestions = (questions) => structuredClone(questions ?? []).map((q) => ({ ...q, id: crypto.randomUUID() }));
export const blankQuestion = () => ({ id: crypto.randomUUID(), type: 'text', label: '', help: '', required: false, options: [] });

export const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

// States a product version is available in. Stored as exclusions, so a new version starts with every state.
export const productStates = (version) => {
  const excluded = version?.jurisdiction?.excludedStates ?? [];
  return US_STATES.filter((st) => !excluded.includes(st));
};

// Coverages can only narrow the product's states: drop exclusions for states the product no longer has.
// Returns how many coverages changed.
export const pruneCoverageStates = (components, allowed) => {
  let changed = 0;
  components.forEach((c) =>
    c.classes.forEach((k) =>
      k.coverages.forEach((cov) => {
        const list = cov.jurisdiction?.excludedStates;
        if (!Array.isArray(list)) return;
        const kept = list.filter((st) => allowed.includes(st));
        if (kept.length !== list.length) {
          cov.jurisdiction.excludedStates = kept;
          changed += 1;
        }
      }),
    ),
  );
  return changed;
};

// Everything that can be configured on a coverage when it is added to a product version.
// A global coverage picks which of these apply (and which are required); the product's
// Coverage Configuration page then shows only those.
//   kind: select | multi | yesno | money | range | text | questions | forms
//   field: where the value lives on the product coverage
export const DEDUCTIBLE_TYPES = ['Fixed', 'Percentage', 'None'];
// Claims behaviour choices.
export const LOSS_BASES = ['Per Occurrence', 'Per Person', 'Per Call-out (max 3/year)', 'Per Claim'];
export const BENEFIT_BASES = ['Indemnity', 'Fixed Benefit', 'Service', 'Agreed Value'];
export const NOTICE_UNITS = ['days', 'weeks', 'months'];
export const blankClaimBehaviour = () => ({ lossBasis: '', benefitBasis: '', notice: { value: '', unit: 'days' }, override: { enabled: false } });

// What a percentage deductible is a percentage of.
export const DEDUCTIBLE_BASES = ['Insured Value', 'Coverage Limit', 'Claim Amount', 'Declared Value', 'Shipment Value'];

export const CONFIG_OPTIONS = [
  { key: 'jurisdiction', label: 'Jurisdiction', kind: 'jurisdiction', field: 'jurisdiction', hint: 'All states and zip codes are included by default — exclude the ones that do not apply.', required: true },
  { key: 'limit', label: 'Limit', kind: 'amount', field: 'limit', hint: 'A single fixed amount.', required: true },
  { key: 'deductible', label: 'Deductible', kind: 'deductible', field: 'deductible', hint: 'Fixed amount, percentage, or none (zero).', required: false },
  { key: 'taxable', label: 'Taxable', kind: 'yesno', field: 'taxable', hint: 'Is premium on this coverage taxable?', required: true },
  { key: 'premiumEarn', label: 'Premium earn behaviour', kind: 'select', field: 'premiumEarnBehaviour', choices: [['pro_rata', 'Pro rata'], ['short_rate', 'Short rate'], ['minimum_earned', 'Minimum earned'], ['fully_earned', 'Fully earned']], hint: 'How premium is earned on cancellation or change.', required: true },
  { key: 'riskObjects', label: 'Covered risk-object types', kind: 'multi', field: 'riskObjectTypes', choices: RISK_OBJECT_TYPES, hint: 'What the coverage can be applied to.', required: true },
  { key: 'claimBehaviour', label: 'Claim behaviour', kind: 'claims', field: 'claimBehaviour', hint: 'Loss basis, benefit basis and how soon a claim must be notified.', required: true },
  { key: 'forms', label: 'Forms', kind: 'forms', field: 'forms', hint: 'Starts from the forms attached to the global coverage — adjust them for this product.', required: false },
  { key: 'terms', label: 'Terms', kind: 'text', field: 'terms', hint: 'Conditions, exclusions, waiting periods.', required: false },
];
export const PARTIES = [
  { value: 'First party', hint: "Covers the policyholder's own property or losses." },
  { value: 'Third party', hint: "Covers the policyholder's liability to others. No risk-object types are needed." },
];
export const optionDef = (key) => CONFIG_OPTIONS.find((o) => o.key === key);

// What older coverages (with no explicit choice) have always shown.
export const DEFAULT_OPTIONS = [
  { key: 'limit', required: true },
  { key: 'deductible', required: false },
  { key: 'riskObjects', required: true },
  { key: 'terms', required: false },
  { key: 'forms', required: false },
];

// Clean a stored selection: known keys only, no duplicates, catalogue order.
export const normalizeOptions = (raw) => {
  if (!Array.isArray(raw)) return clone(DEFAULT_OPTIONS);
  const chosen = new Map(raw.filter((o) => optionDef(o?.key)).map((o) => [o.key, Boolean(o.required)]));
  return CONFIG_OPTIONS.filter((o) => chosen.has(o.key)).map((o) => ({ key: o.key, required: chosen.get(o.key) }));
};

// Zip exclusions are typed as text: 5-digit codes or ranges (33101-33199), separated by commas, spaces or new lines.
export const parseZips = (text) => {
  const valid = [];
  const invalid = [];
  String(text ?? '').split(/[\s,;]+/).filter(Boolean).forEach((token) => {
    const m = token.match(/^(\d{5})(?:-(\d{5}))?$/);
    if (m && (!m[2] || +m[1] <= +m[2])) valid.push(token);
    else invalid.push(token);
  });
  return { valid, invalid };
};

export const newId = () => crypto.randomUUID();
export const clone = (value) => structuredClone(value);

export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

export const emptyCoverage = (lib) => ({
  id: newId(),
  coverageId: lib.id,
  name: lib.name,
  configOptions: normalizeOptions(lib.configOptions),
  party: '', // 'First party' | 'Third party' - asked first when configuring
  requires: [], // global coverage ids (same class) that must also be bought when this one is
  jurisdiction: { excludedStates: [], excludedZips: '' }, // everything included unless excluded
  limit: '',
  limitOverride: { enabled: false, min: '', max: '' }, // underwriter may set the limit anywhere from `min` to `max`
  deductible: { type: '', value: '', basis: '', override: { enabled: false, min: '', max: '' } },
  premiumEarnBehaviour: '',
  terms: '',
  riskObjectTypes: [],
  questions: [],
  forms: [],
  claimBehaviour: blankClaimBehaviour(),
  taxable: '',
  ratingPlan: null, // attached in the rating phase
});

export const emptyComponent = (name, lob) => ({ id: newId(), name, lob, classes: [] });

export const emptyClass = (cls) => ({ id: newId(), classId: cls.id, name: cls.name, coverages: [] });

// Older versions stored coverages directly on the component.
export const normalizeComponents = (components) =>
  components.forEach((c) => {
    c.classes ??= [];
    delete c.coverages;
  });

export const allCoverages = (components) => components.flatMap((c) => c.classes.flatMap((k) => k.coverages));

// Re-key every id so a copied tree never shares ids with its source.
export const cloneComponents = (components) =>
  clone(components).map((c) => ({
    ...c,
    id: newId(),
    classes: c.classes.map((k) => ({ ...k, id: newId(), coverages: k.coverages.map((cov) => ({ ...cov, id: newId() })) })),
  }));

export const coverageCount = (components) => allCoverages(components).length;

export const lobsOf = (components) => [...new Set(components.map((c) => c.lob).filter(Boolean))];

// "2026.01" -> "2026.02"; anything else gets ".1" appended.
export const nextLabel = (label) => {
  const m = String(label).match(/^(.*?)(\d+)$/);
  return m ? `${m[1]}${String(Number(m[2]) + 1).padStart(m[2].length, '0')}` : `${label}.1`;
};

const blank = (v) => v === '' || v == null;
const badNumber = (v) => blank(v) || Number.isNaN(+v) || +v < 0;

// What a coverage still needs before it can be published, as short labels. Only the options
// the global coverage enabled are checked.
export const coverageIssues = (cov, allowedStates = US_STATES) => {
  const issues = [];
  // First or third party is asked before anything else; nothing else is checked until it's answered.
  if (!cov.party) return ['party type'];
  const options = cov.configOptions ?? DEFAULT_OPTIONS;
  options.forEach(({ key, required }) => {
    const def = optionDef(key);
    if (!def) return;
    // Third-party coverages don't attach to a risk object.
    if (key === 'riskObjects' && cov.party === 'Third party') return;
    const value = cov[def.field];
    const label = def.label.toLowerCase();
    let bad = false;
    switch (def.kind) {
      case 'select':
      case 'yesno':
        bad = required && !value;
        break;
      case 'multi':
        bad = required && !value?.length;
        break;
      case 'text':
        bad = required && !String(value ?? '').trim();
        break;
      case 'claims': {
        const cb = value ?? {};
        const started = cb.lossBasis || cb.benefitBasis || !blank(cb.notice?.value);
        if (required || started) {
          bad = !LOSS_BASES.includes(cb.lossBasis) || !BENEFIT_BASES.includes(cb.benefitBasis) || badNumber(cb.notice?.value) || !NOTICE_UNITS.includes(cb.notice?.unit);
        }
        break;
      }
      case 'amount': {
        bad = required ? badNumber(value) : !blank(value) && badNumber(value);
        const o = cov.limitOverride;
        // The limit itself must sit inside the override range.
        if (!bad && o?.enabled && (badNumber(o.min) || badNumber(o.max) || +o.min > +value || +o.max < +value)) issues.push(`${label} override`);
        break;
      }
      case 'deductible': {
        const { type, value: amount } = value ?? {};
        if (!type) bad = required;
        else if (type === 'Fixed') bad = badNumber(amount);
        else if (type === 'Percentage') bad = badNumber(amount) || +amount > 100 || !DEDUCTIBLE_BASES.includes(value?.basis);
        const o = value?.override;
        if (!bad && o?.enabled && type !== 'None') {
          const ceiling = type === 'Percentage' ? 100 : Infinity;
          if (badNumber(o.min) || badNumber(o.max) || +o.min > +amount || +o.max < +amount || +o.max > ceiling) issues.push(`${label} override`);
        }
        break;
      }
      case 'jurisdiction':
        bad = allowedStates.every((st) => (value?.excludedStates ?? []).includes(st)) || parseZips(value?.excludedZips).invalid.length > 0;
        break;
      case 'questions':
        bad = (required && !value?.length) || (value ?? []).some((q) => !q.label.trim() || (QUESTION_HAS_OPTIONS.includes(q.type) && !q.options.length));
        break;
      case 'forms':
        bad = required && !value?.length;
        break;
      default:
    }
    if (bad) issues.push(label);
  });
  return issues;
};

// What a component still needs, as short labels (used for the card badge on the Components page).
export const componentIssues = (c) => {
  const issues = [];
  if (!c.name?.trim()) issues.push('a name');
  if (!c.lob) issues.push('a line of business');
  if (!c.classes.length) issues.push('a class of business');
  else if (c.classes.some((k) => !k.coverages.length)) issues.push('coverages in every class of business');
  return issues;
};

// Everything a version needs before it can be published as a release.
export const validateVersion = (components, productQuestions = [], states = US_STATES) => {
  const errors = [];
  if (!states.length) errors.push('Select at least one state for the product.');
  productQuestions.forEach((q, i) => {
    if (questionBad(q)) errors.push(`Product-level question ${i + 1}: ${String(q.label ?? '').trim() ? 'add at least one option' : 'enter the question text'}.`);
  });
  if (!components.length) errors.push('Add at least one component.');
  components.forEach((c, ci) => {
    const where = c.name?.trim() || `Component ${ci + 1}`;
    if (!c.name?.trim()) errors.push(`${where}: enter a component name.`);
    if (!c.lob) errors.push(`${where}: choose a line of business.`);
    if (!c.classes.length) errors.push(`${where}: add at least one class of business.`);
    c.classes.forEach((k) => {
      const inClass = `${where} › ${k.name}`;
      if (!k.coverages.length) errors.push(`${inClass}: attach at least one coverage.`);
      const inClassIds = new Set(k.coverages.map((c) => c.coverageId));
      k.coverages.forEach((cov) => {
        // Relationships only work inside one class: every required coverage must still be in it.
        (cov.requires ?? []).forEach((id) => {
          if (id === cov.coverageId) errors.push(`${inClass} › ${cov.name}: cannot require itself.`);
          else if (!inClassIds.has(id)) errors.push(`${inClass} › ${cov.name}: requires a coverage that is no longer in this class of business.`);
        });
        const issues = coverageIssues(cov, states);
        if (issues.length) errors.push(`${inClass} › ${cov.name}: complete ${issues.join(', ')}.`);
        (cov.questions ?? []).forEach((q, i) => {
          if (questionBad(q)) errors.push(`${inClass} › ${cov.name} › question ${i + 1}: ${String(q.label ?? '').trim() ? 'add at least one option' : 'enter the question text'}.`);
        });
      });
    });
  });
  return errors;
};

// Start a new draft from a version's content. Returns the existing draft instead if one is already open.
export const startNextVersion = async (api, productId, versions, from) => {
  const own = versions.filter((v) => v.productRef === productId);
  const draft = own.find((v) => v.status === 'Draft');
  if (draft) return { version: draft, existing: true };
  const latest = [...own].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] ?? from;
  const now = new Date().toISOString();
  const version = await api('product_versions').create({
    productRef: productId,
    label: nextLabel(latest.label),
    status: 'Draft',
    components: cloneComponents(from.components),
    questions: cloneQuestions(from.questions),
    jurisdiction: clone(from.jurisdiction ?? { excludedStates: [] }),
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    releaseId: null,
  });
  return { version, existing: false };
};

// Coverages attached on the Components page only carry identity; fill in the configuration fields on first open.
// `sync` (drafts) re-reads which options the global coverage currently enables.
export const hydrateCoverage = (cov, lib, sync = false) => {
  // Older shapes -> current shapes.
  if (cov.limit === undefined && Array.isArray(cov.limits)) {
    const first = cov.limits.find((l) => !blank(l.amount) && !Number.isNaN(+l.amount));
    cov.limit = first ? String(first.amount) : '';
  }
  if (cov.deductible === undefined && Array.isArray(cov.deductibles)) {
    const first = cov.deductibles.find((d) => !blank(d.amount) && !Number.isNaN(+d.amount));
    cov.deductible = first ? { type: 'Fixed', value: String(first.amount) } : { type: '', value: '' };
  }
  if (cov.deductible && !cov.deductible.override) cov.deductible.override = { enabled: false, min: '', max: '' };
  // A percentage deductible needs a basis; older ones default to the claim amount.
  if (cov.deductible && cov.deductible.basis === undefined) cov.deductible.basis = cov.deductible.type === 'Percentage' ? 'Claim Amount' : '';
  // Overrides saved before a minimum existed.
  if (cov.limitOverride && cov.limitOverride.min === undefined) cov.limitOverride.min = '';
  if (cov.deductible?.override && cov.deductible.override.min === undefined) cov.deductible.override.min = '';
  if (Array.isArray(cov.jurisdiction)) {
    cov.jurisdiction = { excludedStates: cov.jurisdiction.length ? US_STATES.filter((st) => !cov.jurisdiction.includes(st)) : [], excludedZips: '' };
  }
  if (Array.isArray(cov.forms)) cov.forms = cov.forms.filter((f) => f.formId);
  if (typeof cov.claimBehaviour === 'string') {
    cov.claimBehaviour = { ...blankClaimBehaviour(), lossBasis: LOSS_BASES.includes(cov.claimBehaviour) ? cov.claimBehaviour : '' };
  }
  if (cov.claimBehaviour && typeof cov.claimBehaviour === 'object') {
    const blankCb = blankClaimBehaviour();
    cov.claimBehaviour = { ...blankCb, ...cov.claimBehaviour, notice: { ...blankCb.notice, ...cov.claimBehaviour.notice }, override: { ...blankCb.override, ...cov.claimBehaviour.override } };
  }
  if (Array.isArray(cov.questions)) {
    const legacy = { Text: 'text', 'Yes / No': 'yesno', Number: 'number', Date: 'date', Choice: 'dropdown' };
    cov.questions = cov.questions.map((q) => ({
      id: q.id ?? crypto.randomUUID(),
      type: legacy[q.type] ?? q.type ?? 'text',
      label: q.label ?? q.text ?? '',
      help: q.help ?? '',
      required: Boolean(q.required),
      options: q.options ?? [],
    }));
  }

  const fresh = emptyCoverage(lib ?? { id: cov.coverageId, name: cov.name, configOptions: cov.configOptions });
  Object.entries(fresh).forEach(([key, value]) => {
    if (cov[key] === undefined) cov[key] = value;
  });
  if (sync) {
    // A dropdown value that is no longer one of the choices (the list was changed) must be picked again.
    CONFIG_OPTIONS.filter((o) => o.kind === 'select').forEach((o) => {
      const valid = o.choices.map((c) => (Array.isArray(c) ? c[0] : c));
      if (cov[o.field] && !valid.includes(cov[o.field])) cov[o.field] = '';
    });
  }
  if (sync && lib) {
    cov.configOptions = normalizeOptions(lib.configOptions);
    // The product starts from the forms attached to the global coverage, then may adjust them.
    if (!cov.formsSeeded) {
      cov.forms = clone(lib.forms ?? []);
      cov.formsSeeded = true;
    }
  }
  return cov;
};
