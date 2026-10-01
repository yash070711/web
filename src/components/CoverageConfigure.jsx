'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './CoverageConfigure.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const COVERAGE_DESCRIPTIONS = {
  'Auto Liability': 'Covers bodily injury and property damage caused by covered vehicles.',
  'Motor Truck Cargo': 'Covers cargo loss or damage while transported in covered vehicles.',
  'Physical Damage': 'Covers collision, comprehensive, and specified perils damage to covered vehicles.',
  'General Liability': 'Covers premises liability and general operations liability.',
  'Medical Payments': 'Covers medical expenses for injured occupants of covered vehicles.',
  'Uninsured / Underinsured Motorist': 'Covers loss caused by uninsured or underinsured drivers.',
  'Hired & Non-Owned Auto': 'Covers hired vehicles and employee-owned vehicles used for business.',
  'Trailer Interchange': 'Covers physical damage to trailers under interchange agreements.',
  'Non-Trucking Liability': 'Covers liability when a unit is used outside of trucking operations.',
  'Garagekeepers Liability': "Covers customers' vehicles while in the insured's care.",
  'Rental Reimbursement': 'Covers rental costs while a covered vehicle is being repaired.',
  'Towing and Labor': 'Covers roadside towing and labor costs for disabled covered vehicles.',
};


// ─── Default config ────────────────────────────────────────────────────────────

const COVERAGE_TYPES = {
  'Auto Liability': ['Third Party'],
  'Motor Truck Cargo': ['First Party'],
  'Physical Damage': ['First Party'],
  'Hired & Non-Owned Auto': ['Third Party'],
  'Non-Trucking Liability': ['Third Party'],
  'Trailer Interchange': ['First Party'],
  'Garagekeepers Liability': ['Third Party'],
  'Medical Payments': ['First Party'],
  'Uninsured / Underinsured Motorist': ['First Party'],
  'General Liability': ['Third Party'],
};
const coverageTypes = coverage => COVERAGE_TYPES[coverage] || ['First Party', 'Third Party'];
function configurationItemId() {
  // randomUUID is unavailable on some non-HTTPS development URLs.
  return globalThis.crypto?.randomUUID?.() || 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}


const MAIN_COVERAGES = ['Auto Liability', 'Motor Truck Cargo', 'Physical Damage', 'General Liability', 'Medical Payments', 'Hired & Non-Owned Auto', 'Trailer Interchange', 'Non-Trucking Liability', 'Garagekeepers Liability', 'Rental Reimbursement', 'Towing and Labor'];
const ADDITIONAL_COVERAGES = {
  'Auto Liability': ['Uninsured Motorist', 'Underinsured Motorist', 'Medical Payments', 'PIP'],
  'Motor Truck Cargo': ['Reefer Breakdown', 'Earned Freight', 'Debris Removal'],
  'Physical Damage': ['Collision', 'Comprehensive / Other Than Collision', 'Specified Causes of Loss'],
  'Hired & Non-Owned Auto': ['Hired Auto Liability', 'Non-Owned Auto Liability', 'Hired Auto Physical Damage'],
  'Garagekeepers Liability': ['Comprehensive', 'Collision', 'Specified Causes of Loss']
};
const ADDITIONAL_DESCRIPTIONS = {
  'Uninsured Motorist': 'Protection against uninsured drivers.',
  'Underinsured Motorist': 'Protection against underinsured drivers.',
  'Medical Payments': 'Medical expenses for injured occupants.',
  PIP: 'Personal injury protection.',
  'Reefer Breakdown': 'Cargo protection following refrigeration breakdown.',
  'Earned Freight': 'Protection for earned freight charges.',
  'Debris Removal': 'Costs of removing cargo debris.',
  Collision: 'Vehicle damage caused by a collision.',
  Comprehensive: 'Vehicle damage from causes other than collision.',
  'Comprehensive / Other Than Collision': 'Vehicle damage from causes other than collision.',
  'Specified Causes of Loss': 'Protection for specified causes of vehicle damage.',
  'Hired Auto Liability': 'Liability protection for hired vehicles.',
  'Non-Owned Auto Liability': 'Liability protection for non-owned vehicles.',
  'Hired Auto Physical Damage': 'Physical damage protection for hired vehicles.'
};
const coverageDescription = name => ADDITIONAL_DESCRIPTIONS[name] || COVERAGE_DESCRIPTIONS[name] || 'Configure limits, deductibles and financial terms for this coverage.';

function normalizeCoverages(product) {
  const classes = product.selectedClasses?.length ? product.selectedClasses : [product.commonClass || 'General'];
  const raw = product.coverages;
  const source = Array.isArray(raw) ? { [classes[0]]: raw } : raw && typeof raw === 'object' ? raw : {};
  const result = Object.fromEntries(classes.map(name => [name, {}]));
  for (const [className, coverages] of Object.entries(source)) {
    result[className] = Array.isArray(coverages)
      ? Object.fromEntries(coverages.filter(name => typeof name === 'string').map(name => [name, []]))
      : Object.fromEntries(Object.entries(coverages || {}).map(([name, additional]) => [name,
          Array.isArray(additional) ? [...new Set(additional.filter(item => typeof item === 'string'))] : []
        ]));
  }
  // A named class from nested data does not need an artificial General group.
  if (!product.selectedClasses?.length && !product.commonClass && !Array.isArray(raw) && Object.keys(source).length && !Object.hasOwn(source, 'General')) delete result.General;
  return result;
}

function initializeConfig(product, hierarchy) {
  const saved = product.coverageConfig || {};
  const byClass = { ...(saved.byClass || {}) };
  for (const [className, coverages] of Object.entries(hierarchy)) {
    byClass[className] = { ...(byClass[className] || {}) };
    for (const coverage of Object.keys(coverages)) {
      const existing = byClass[className][coverage];
      byClass[className][coverage] = existing || { core: { ...(saved[coverage] || {}) }, additional: {} };
    }
  }
  // Keep historical name-keyed configuration, including childItems, intact.
  return { ...saved, byClass };
}

function readCoverageConfig(config, className, main, additional = null) {
  const entry = config.byClass?.[className]?.[main];
  return (additional ? entry?.additional?.[additional] : entry?.core) || {};
}

function writeCoverageConfig(config, className, main, additional, value) {
  const byClass = config.byClass || {};
  const group = byClass[className] || {};
  const entry = group[main] || { core: {}, additional: {} };
  return { ...config, byClass: { ...byClass, [className]: { ...group, [main]: additional
    ? { ...entry, additional: { ...entry.additional, [additional]: value } }
    : { ...entry, core: value }
  } } };
}

function CoverageIcon({ name }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'Motor Truck Cargo' ? <><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/></> : name === 'Physical Damage' ? <><path d="m5 7 2-3h10l2 3 2 3v8h-3v-2H6v2H3v-8l2-3ZM5 7h14M3 11h18M6 13h2M16 13h2"/></> : <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>}
  </svg>;
}

function CoveragePicker({ options, label, onAdd }) {
  const [value, setValue] = useState('');
  return <div className={styles.coveragePicker}>
    <select aria-label={label} className={styles.formControl} value={value} onChange={event => setValue(event.target.value)}>
      <option value="">{options.length ? label : 'All available coverages selected'}</option>
      {options.map(name => <option key={name}>{name}</option>)}
    </select>
    <button type="button" className={styles.btn + ' ' + styles.btnPrimary} disabled={!options.includes(value)} onClick={() => { onAdd(value); setValue(''); }}>Add</button>
  </div>;
}

function defaultConfig(coverage) {
  return {
    availability: 'Mandatory',
    isActive: true,
    coverageType: coverageTypes(coverage)[0],
    description: '',
    jurisdictions: [],
    valuation: { basis: 'Agreed Value' },
    allowedDuringQuote: 'Always',
    limits: { basis: 'Per Occurrence', amount: '' },
    policyBasis: false,
    taxable: false,
    uwValuationOverride: { enabled: false, maxVariationPct: '', referralRequired: 'No', reasonRequired: 'No' },
    deductible: { type: 'Fixed Amount', amount: '', percentage: '', basis: 'Each Loss', uwOverride: false },
    dependencies: { rules: [] },
    claims: {
      lossBasis: 'Occurrence',
      reinstatement: 'Automatic',
      benefitBasis: 'Indemnity',
      notificationNumber: '14',
      notificationUnit: 'days',
      uwOverride: false,
    },
    wordingRefs: [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepMerge(defaults, overrides) {
  const result = { ...defaults };
  for (const key of Object.keys(overrides || {})) {
    const d = defaults[key];
    const o = overrides[key];
    if (
      o !== null && typeof o === 'object' && !Array.isArray(o) &&
      d !== null && typeof d === 'object' && !Array.isArray(d)
    ) {
      result[key] = deepMerge(d, o);
    } else {
      result[key] = o;
    }
  }
  return result;
}

function setIn(obj, path, value) {
  const keys = path.split('.');
  const next = { ...obj };
  let ref = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const child = ref[keys[i]];
    ref[keys[i]] = Array.isArray(child) ? [...child] : { ...child };
    ref = ref[keys[i]];
  }
  ref[keys[keys.length - 1]] = value;
  return next;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ number, title, subtitle, open, onToggle, children }) {
  return (
    <div className={styles.sectionCard}>
      <div
        className={styles.sectionHead}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={'coverage-section-' + number}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div className={styles.sectionHeadLeft}>
          <span className={styles.sectionNum}>{number}</span>
          <div>
            <div className={styles.sectionTitle}>{title}</div>
            {subtitle && <div className={styles.sectionSub}>{subtitle}</div>}
          </div>
        </div>
        <span className={`${styles.sectionChevron}${open ? ` ${styles.sectionChevronOpen}` : ''}`}>▶</span>
      </div>
      <div id={'coverage-section-' + number} className={styles.sectionBody} hidden={!open}>
        <div className={styles.sectionInner}>{children}</div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className={styles.toggleWrap}>
      <span className={styles.toggleSwitch}>
        <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
        <span className={styles.toggleSlider} />
        <span className={styles.toggleDot} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

function CurrencyField({ id, value, onChange, placeholder = '0.00' }) {
  return (
    <div className={styles.currencyWrap}>
      <span className={styles.currencyPrefix}>$</span>
      <input
        id={id}
        type="text"
        className={`${styles.formControl} ${styles.currencyInput}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className={styles.yesNoWrap}>
      <button
        type="button"
        className={`${styles.yesNoBtn}${value ? ` ${styles.yesNoBtnActive}` : ''}`}
        onClick={() => onChange(true)}
      >Yes</button>
      <button
        type="button"
        className={`${styles.yesNoBtn}${!value ? ` ${styles.yesNoBtnActive}` : ''}`}
        onClick={() => onChange(false)}
      >No</button>
    </div>
  );
}

function InsuredItemFields({ activeConfig, update }) {
  return <>
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Allowed During Quote</label>
                <select
                  className={styles.formControl}
                  value={activeConfig.allowedDuringQuote}
                  onChange={e => update('allowedDuringQuote', e.target.value)}
                >
                  <option>Always</option>
                  <option>Never</option>
                  <option>Optional</option>
                  <option>Mandatory</option>
                  <option>With UW Approval</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Limit Basis</label>
                <select
                  className={styles.formControl}
                  value={activeConfig.limits.basis}
                  onChange={e => update('limits.basis', e.target.value)}
                >
                  <option>Per Occurrence</option>
                  <option>Per Claim</option>
                  <option>Aggregate</option>
                  <option>Per Vehicle</option>
                  <option>Per Person</option>
                  <option>Combined Single Limit</option>
                  <option>Blanket</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Limit Amount ($)</label>
                <CurrencyField
                  value={activeConfig.limits.amount}
                  onChange={v => update('limits.amount', v)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sub-limit ($)</label>
                <CurrencyField value={activeConfig.limits.subLimit || ''} onChange={v => update('limits.subLimit', v)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Policy Basis</label>
                <YesNo value={activeConfig.policyBasis} onChange={v => update('policyBasis', v)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Taxable</label>
                <YesNo value={activeConfig.taxable} onChange={v => update('taxable', v)} />
              </div>
            </div>

            <div className={styles.sectionDivider} />

            {/* UW Valuation Override */}
            <div className={styles.uwOverrideBlock}>
              <div className={styles.uwOverrideRow}>
                <div className={styles.uwOverrideText}>
                  <strong>Underwriter can override valuation</strong>
                  <p>
                    {activeConfig.uwValuationOverride.enabled ? 'Enabled' : 'Disabled'}
                    {' — '}Allow underwriter valuation override.
                  </p>
                </div>
                <Toggle
                  checked={activeConfig.uwValuationOverride.enabled}
                  onChange={v => update('uwValuationOverride.enabled', v)}
                />
              </div>
              {activeConfig.uwValuationOverride.enabled && (
                <div className={styles.formGrid3} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--cc-border)' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Maximum variation (%)</label>
                    <div className={styles.pctWrap}>
                      <input
                        type="number" min="0" max="100"
                        className={styles.formControl}
                        value={activeConfig.uwValuationOverride.maxVariationPct}
                        onChange={e => update('uwValuationOverride.maxVariationPct', e.target.value)}
                        placeholder="e.g. 15"
                        style={{ paddingRight: 28 }}
                      />
                      <span className={styles.pctSuffix}>%</span>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Referral required</label>
                    <select
                      className={styles.formControl}
                      value={activeConfig.uwValuationOverride.referralRequired}
                      onChange={e => update('uwValuationOverride.referralRequired', e.target.value)}
                    >
                      <option>No</option>
                      <option>Yes</option>
                      <option>Above threshold</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reason required</label>
                    <select
                      className={styles.formControl}
                      value={activeConfig.uwValuationOverride.reasonRequired}
                      onChange={e => update('uwValuationOverride.reasonRequired', e.target.value)}
                    >
                      <option>No</option>
                      <option>Yes</option>
                      <option>Above threshold</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

  </>;
}

export default function CoverageConfigure({ product }) {
  const [hierarchy, setHierarchy] = useState(() => normalizeCoverages(product));
  const [hierarchyChanged, setHierarchyChanged] = useState(false);
  const [selection, setSelection] = useState(() => {
    const className = Object.keys(hierarchy)[0] || '';
    return { className, main: Object.keys(hierarchy[className] || {})[0] || '', additional: null };
  });
  const activeClass = selection.className;
  const activeMainCoverage = selection.main;
  const activeAdditionalCoverage = selection.additional;
  const activeCoverage = activeAdditionalCoverage || activeMainCoverage;
  const coverageList = Object.keys(hierarchy[activeClass] || {});
  const additionalCoverages = hierarchy[activeClass]?.[activeMainCoverage] || [];
  const [expanded, setExpanded] = useState(() => ({ [JSON.stringify([activeClass, activeMainCoverage])]: true }));
  const [showMainPicker, setShowMainPicker] = useState(false);
  const [additionalPicker, setAdditionalPicker] = useState(null);
  const [openSections, setOpenSections] = useState({ s1: true, applicability: true, additional: true, s2: true, s3: true, s4: true, s5: true, s6: true });
  const [config, setConfig] = useState(() => initializeConfig(product, hierarchy));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [newDep, setNewDep] = useState({ action: 'requires', target: '', condition: '' });
  const [newWord, setNewWord] = useState({ name: '', code: '', version: '' });
  const [showAddWord, setShowAddWord] = useState(false);

  const toggleSection = key => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const savedConfig = readCoverageConfig(config, activeClass, activeMainCoverage, activeAdditionalCoverage);
  const activeConfig = deepMerge(defaultConfig(activeCoverage), savedConfig);
  const typeOptions = coverageTypes(activeCoverage);
  if (!typeOptions.includes(activeConfig.coverageType)) activeConfig.coverageType = typeOptions[0];
  const isConfigured = !!(savedConfig.limits?.amount || savedConfig.valuation?.basis);

  const selectCoverage = (className, main, additional = null) => {
    setSelection({ className, main, additional });
    setExpanded(previous => ({ ...previous, [JSON.stringify([className, main])]: true }));
    setNewDep({ action: 'requires', target: '', condition: '' });
    setNewWord({ name: '', code: '', version: '' });
    setShowAddWord(false);
    setAdditionalPicker(null);
    setShowMainPicker(false);
  };
  const setActiveCoverage = main => selectCoverage(activeClass, main);

  const update = (path, value) => {
    setConfig(previous => writeCoverageConfig(previous, activeClass, activeMainCoverage, activeAdditionalCoverage,
      setIn(deepMerge(defaultConfig(activeCoverage), readCoverageConfig(previous, activeClass, activeMainCoverage, activeAdditionalCoverage)), path, value)
    ));
  };

  const addMainCoverage = name => {
    if (!MAIN_COVERAGES.includes(name) || Object.hasOwn(hierarchy[activeClass] || {}, name)) return;
    setHierarchy(previous => ({ ...previous, [activeClass]: { ...previous[activeClass], [name]: [] } }));
    setHierarchyChanged(true);
    setActiveCoverage(name);
  };
  const addAdditionalCoverage = (main, name) => {
    if (!(ADDITIONAL_COVERAGES[main] || []).includes(name)) return;
    setHierarchy(previous => {
      const current = previous[activeClass]?.[main];
      if (!current || current.includes(name)) return previous;
      return { ...previous, [activeClass]: { ...previous[activeClass], [main]: [...current, name] } };
    });
    setHierarchyChanged(true);
    selectCoverage(activeClass, main, name);
  };
  const removeAdditionalCoverage = name => {
    setHierarchy(previous => ({ ...previous, [activeClass]: { ...previous[activeClass], [activeMainCoverage]: previous[activeClass][activeMainCoverage].filter(item => item !== name) } }));
    setHierarchyChanged(true);
    // Keep saved settings available if this coverage is selected again later.
    if (activeAdditionalCoverage === name) setActiveCoverage(activeMainCoverage);
  };

  const showToast = msg => {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(''), 2600);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverageConfig: config, ...(hierarchyChanged ? { coverages: hierarchy } : {}) }),
      });
      if (!res.ok) throw new Error();
      showToast('Coverage configuration saved.');
      return true;
    } catch {
      showToast('Save failed. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAndNext = async () => {
    if (!(await saveConfig())) return;
    const idx = coverageList.indexOf(activeMainCoverage);
    if (idx < coverageList.length - 1) {
      setActiveCoverage(coverageList[idx + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast('All coverages configured.');
    }
  };

  const coverageIdx = coverageList.indexOf(activeMainCoverage);
  const hasPrev = coverageIdx > 0;
  const hasNext = coverageIdx < coverageList.length - 1;
  const otherCoverages = coverageList.filter(c => c !== activeCoverage);

  const availClass = {
    Mandatory: styles.availMandatory,
    Optional: styles.availOptional,
    'Default Selected': styles.availDefault,
    'Add-on': styles.availAddon,
  }[activeConfig.availability] || styles.availMandatory;

  // Derived: applicable deductible display
  const deductibleDisplay = (() => {
    const d = activeConfig.deductible;
    if (!d || d.type === 'None') return 'Not configured';
    if (d.type === 'Percentage') return d.percentage ? `${d.percentage}% — ${d.basis}` : 'Not configured';
    return d.amount ? `$${d.amount} — ${d.basis}` : 'Not configured';
  })();

  const addDepRule = () => {
    if (!newDep.target) return;
    update('dependencies.rules', [
      ...(activeConfig.dependencies?.rules || []),
      { ...newDep, id: configurationItemId() },
    ]);
    setNewDep({ action: 'requires', target: '', condition: '' });
  };

  const editDepRule = (id, field, value) =>
    update('dependencies.rules', (activeConfig.dependencies?.rules || []).map(rule => rule.id === id ? { ...rule, [field]: value } : rule));

  const rmDepRule = id =>
    update('dependencies.rules', (activeConfig.dependencies?.rules || []).filter(r => r.id !== id));

  const addWord = () => {
    if (!newWord.name) return;
    update('wordingRefs', [...(activeConfig.wordingRefs || []), { ...newWord, id: configurationItemId() }]);
    setNewWord({ name: '', code: '', version: '' });
    setShowAddWord(false);
  };

  const rmWord = id =>
    update('wordingRefs', (activeConfig.wordingRefs || []).filter(r => r.id !== id));


  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/products">Products</Link>{' / '}
        <Link href={`/products/${product.id}`}>{product.name}</Link>{' / '}
        <b>Coverage</b>
      </div>

      {/* Page head */}
      <div className={styles.pageHead}>
        <div>
          <h1>Coverage Configuration</h1>
          <p>Configure coverage settings, limits, deductibles and coverage rules.</p>
        </div>
        <div className={styles.headActions}>
          <Link href={`/products/${product.id}`} className={styles.btn}>← Product</Link>
          <button type="button" className={styles.btn} onClick={saveConfig} disabled={saving}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={hasNext ? saveAndNext : saveConfig}
            disabled={saving}
          >
            {hasNext ? 'Save & Next →' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Two-panel */}
      <div className={styles.layout}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className={styles.sidebar} aria-label="Classes and coverages">
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHead}><span className={styles.sidebarTitle}>Classes &amp; Coverages</span></div>
            <div className={styles.classSelector}>
              <label className={styles.formLabel} htmlFor="coverage-class">Selected class</label>
              <select id="coverage-class" className={styles.formControl} value={activeClass} onChange={event => selectCoverage(event.target.value, Object.keys(hierarchy[event.target.value] || {})[0] || '')}>
                {Object.keys(hierarchy).map(name => <option key={name}>{name}</option>)}
              </select>
              <div className={styles.classCaption}><strong>Class: {activeClass}</strong><span>{coverageList.length} main</span></div>
            </div>
            <nav className={styles.hierarchyList} aria-label={'Coverages for ' + activeClass}>
              {coverageList.map((main, index) => {
                const children = hierarchy[activeClass][main];
                const open = !!expanded[JSON.stringify([activeClass, main])];
                const selected = main === activeMainCoverage;
                const panelId = 'coverage-children-' + index;
                return <div className={styles.mainGroup} key={main}>
                  <div className={styles.mainNavHeader}>
                    <button type="button" className={styles.mainNavButton + (selected && !activeAdditionalCoverage ? ' ' + styles.navSelected : '')} aria-current={selected && !activeAdditionalCoverage ? 'true' : undefined} onClick={() => setActiveCoverage(main)}>
                      <CoverageIcon name={main}/><span>{main}<small>{children.length} additional</small></span>
                    </button>
                    <button type="button" className={styles.expandButton} aria-label={(open ? 'Collapse ' : 'Expand ') + main} aria-expanded={open} aria-controls={panelId} onClick={() => setExpanded(previous => ({ ...previous, [JSON.stringify([activeClass, main])]: !open }))}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'}/></svg>
                    </button>
                  </div>
                  <div id={panelId} hidden={!open} className={styles.branchList}>
                    <button type="button" className={styles.childNavButton + (selected && !activeAdditionalCoverage ? ' ' + styles.navSelected : '')} onClick={() => setActiveCoverage(main)}>{main === 'Motor Truck Cargo' ? 'Cargo Coverage' : 'Core Coverage'}</button>
                    {children.map(name => <button type="button" key={name} aria-current={selected && activeAdditionalCoverage === name ? 'true' : undefined} className={styles.childNavButton + (selected && activeAdditionalCoverage === name ? ' ' + styles.navSelected : '')} onClick={() => selectCoverage(activeClass, main, name)}><span className={styles.childIndicator} aria-hidden="true"/>{name}</button>)}
                    <button type="button" className={styles.treeAdd} onClick={() => { setActiveCoverage(main); setAdditionalPicker(main); setOpenSections(previous => ({ ...previous, additional: true })); }}>+ Add additional coverage</button>
                  </div>
                </div>;
              })}
              {!coverageList.length && <p className={styles.emptyHierarchy}>No main coverages selected.</p>}
              <button type="button" className={styles.addRowBtn} onClick={() => setShowMainPicker(value => !value)}>+ Add coverage to class</button>
              {showMainPicker && <CoveragePicker key={activeClass} label="Choose main coverage" options={MAIN_COVERAGES.filter(name => !coverageList.includes(name))} onAdd={addMainCoverage}/>}
            </nav>
          </div>
        </aside>

        {/* ── Detail panel ─────────────────────────────────── */}
        <div className={styles.detailPanel}>
          {!activeMainCoverage ? <div className={styles.sectionCard}><div className={styles.sectionInner}><h2>Class: {activeClass}</h2><p>Add a main coverage to start configuring this class.</p></div></div> : <>

          {/* Coverage header bar */}
          <div className={styles.coverHead}>
            <div className={styles.detailIdentity}>
              <div className={styles.contextLabel}>Class: {activeClass}</div>
              {activeAdditionalCoverage && <div className={styles.parentLabel}>Parent coverage: {activeMainCoverage}</div>}
              <h2>{activeCoverage}</h2>
              <p>{activeAdditionalCoverage ? 'Additional coverage' : coverageDescription(activeCoverage)}</p>
              <span className={styles.configStatus}>{isConfigured ? 'Configured' : 'Not configured'}</span>
            </div>
            <select
              aria-label="Coverage availability"
              className={`${styles.availSelect} ${availClass}`}
              value={activeConfig.availability}
              onChange={e => update('availability', e.target.value)}
            >
              <option>Mandatory</option>
              <option>Optional</option>
              <option>Default Selected</option>
              <option>Add-on</option>
            </select>
            <Toggle checked={activeConfig.isActive} onChange={v => update('isActive', v)} label="Active" />
            {hasPrev && (
              <button
                type="button"
                className={styles.btn}
                onClick={() => { setActiveCoverage(coverageList[coverageIdx - 1]); window.scrollTo({ top: 0 }); }}
              >← Prev</button>
            )}
          </div>

          {/* ── S1: Cover Identity ─────────────────────────── */}
          <SectionCard
            number={1}
            title="Cover Identity"
            subtitle="Coverage name, type and description."
            open={openSections.s1}
            onToggle={() => toggleSection('s1')}
          >
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coverage Name</label>
                <input
                  className={`${styles.formControl} ${styles.formReadonly}`}
                  value={activeCoverage}
                  readOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coverage Type</label>
                <select
                  className={styles.formControl}
                  value={activeConfig.coverageType}
                  onChange={e => update('coverageType', e.target.value)}
                >
                  {coverageTypes(activeCoverage).map(type => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.span2}`}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={`${styles.formControl} ${styles.textarea}`}
                  value={activeConfig.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder={coverageDescription(activeCoverage)}
                  rows={3}
                />
              </div>
            </div>

          </SectionCard>

          <SectionCard number={2} title="Class applicability" subtitle="Class and parent coverage for these settings." open={openSections.applicability} onToggle={() => toggleSection('applicability')}>
            <div className={styles.applicability}>
              <div><span className={styles.formLabel}>Applicable class</span><strong className={styles.classChip}>{activeClass}</strong></div>
              {activeAdditionalCoverage && <div><span className={styles.formLabel}>Parent coverage</span><strong>{activeMainCoverage}</strong></div>}
            </div>
          </SectionCard>

          {!activeAdditionalCoverage && <SectionCard number={3} title="Additional coverages" subtitle="Configure coverages that belong to this main coverage." open={openSections.additional} onToggle={() => toggleSection('additional')}>
            <div className={styles.additionalToolbar}><span>{additionalCoverages.length} additional coverages</span><button type="button" className={styles.addRowBtn} onClick={() => setAdditionalPicker(value => value === activeMainCoverage ? null : activeMainCoverage)}>+ Add additional coverage</button></div>
            {additionalPicker === activeMainCoverage && ((ADDITIONAL_COVERAGES[activeMainCoverage] || []).length ? <CoveragePicker key={JSON.stringify([activeClass, activeMainCoverage])} label="Choose additional coverage" options={ADDITIONAL_COVERAGES[activeMainCoverage].filter(name => !additionalCoverages.includes(name) && !(activeMainCoverage === 'Physical Damage' && name === 'Comprehensive / Other Than Collision' && additionalCoverages.includes('Comprehensive')))} onAdd={name => addAdditionalCoverage(activeMainCoverage, name)}/> : <p className={styles.emptyHierarchy}>No additional coverages configured for this coverage.</p>)}
            {additionalCoverages.length ? <div className={styles.additionalRows}>
              <div className={styles.additionalColumns}><span>Name</span><span>Description</span><span>Status</span><span>Action</span></div>
              {additionalCoverages.map(name => {
                const settings = readCoverageConfig(config, activeClass, activeMainCoverage, name);
                return <div className={styles.additionalRow} key={name}>
                  <button type="button" className={styles.coverageLink} onClick={() => selectCoverage(activeClass, activeMainCoverage, name)}>{name}</button>
                  <span className={styles.additionalDescription}>{settings.description || coverageDescription(name)}</span>
                  <span className={styles.configStatus}>{settings.isActive === false ? 'Disabled' : 'Enabled'}</span>
                  <button type="button" className={styles.removeAdditional} aria-label={'Remove ' + name} onClick={() => removeAdditionalCoverage(name)}>Remove</button>
                </div>;
              })}
            </div> : <p className={styles.emptyHierarchy}>No additional coverages selected.</p>}
          </SectionCard>}

          {/* ── S2: Insured Items, Valuation & Limits ───────── */}
          <SectionCard
            number={activeAdditionalCoverage ? 3 : 4}
            title="Insured Items, Valuation & Limits"
            subtitle="Insured items, limit structure, policy basis and financial terms."
            open={openSections.s2}
            onToggle={() => toggleSection('s2')}
          >
            <div className={styles.subLabel}>Insured Item</div>
            <InsuredItemFields activeConfig={activeConfig} update={update}/>

          </SectionCard>

          {/* ── S3: Deductible & Co-pay ──────────────────────── */}
          <SectionCard
            number={activeAdditionalCoverage ? 4 : 5}
            title="Deductible & Co-pay"
            subtitle="Deductible type, amount, basis and underwriter override."
            open={openSections.s3}
            onToggle={() => toggleSection('s3')}
          >
            <div className={styles.formGroup} style={{ marginBottom: 18 }}>
              <label className={styles.formLabel}>Deductible Type</label>
              <div className={styles.dedTypeGroup}>
                {['Fixed Amount', 'Percentage', 'None'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.dedTypeBtn}${activeConfig.deductible.type === type ? ` ${styles.dedTypeBtnActive}` : ''}`}
                    onClick={() => update('deductible.type', type)}
                  >{type}</button>
                ))}
              </div>
            </div>

            {activeConfig.deductible.type !== 'None' && (
              <div className={styles.formGrid2} style={{ marginBottom: 18 }}>
                {activeConfig.deductible.type === 'Fixed Amount' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Deductible Amount ($)</label>
                    <CurrencyField
                      value={activeConfig.deductible.amount}
                      onChange={v => update('deductible.amount', v)}
                    />
                  </div>
                )}
                {activeConfig.deductible.type === 'Percentage' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Deductible Percentage (%)</label>
                    <div className={styles.pctWrap}>
                      <input
                        type="number" min="0" max="100"
                        className={styles.formControl}
                        value={activeConfig.deductible.percentage}
                        onChange={e => update('deductible.percentage', e.target.value)}
                        placeholder="e.g. 10"
                        style={{ paddingRight: 28 }}
                      />
                      <span className={styles.pctSuffix}>%</span>
                    </div>
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Deductible Basis</label>
                  <select
                    className={styles.formControl}
                    value={activeConfig.deductible.basis}
                    onChange={e => update('deductible.basis', e.target.value)}
                  >
                    <option>Each Loss</option>
                    <option>Each Claim</option>
                    <option>Combined Single</option>
                    <option>Per Occurrence</option>
                    <option>Aggregate</option>
                  </select>
                </div>
              </div>
            )}

            <div className={styles.uwOverrideRow}>
              <div className={styles.uwOverrideText}>
                <strong>Allow Underwriter Override</strong>
                <p>Permit underwriters to modify the deductible amount within authorized bounds.</p>
              </div>
              <Toggle
                checked={activeConfig.deductible.uwOverride}
                onChange={v => update('deductible.uwOverride', v)}
              />
            </div>
          </SectionCard>

          {/* ── S4: Dependencies ────────────────────────────── */}
          <SectionCard
            number={activeAdditionalCoverage ? 5 : 6}
            title="Dependencies"
            subtitle="Coverage dependency rules — requires, excludes and bundle relationships."
            open={openSections.s4}
            onToggle={() => toggleSection('s4')}
          >
            <div className={styles.depHero}>
              <svg className={styles.depHeroIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="12" r="3" /><circle cx="18" cy="5" r="3" /><circle cx="18" cy="19" r="3" />
                <path d="m9 10.5 6-4m-6 8 6 4" />
              </svg>
              <div>
                <strong>Dependency rules control how coverages interact</strong>
                <p>Use <em>Requires</em> when this coverage must be purchased alongside another. Use <em>Excludes</em> when coverages cannot coexist. Use <em>Bundles</em> to group coverages for packaged pricing.</p>
              </div>
            </div>

            <div className={styles.depRuleToolbar}>
              <span className={styles.depRulesLabel}>
                Dependency Rules
                {(activeConfig.dependencies?.rules || []).length > 0 && (
                  <span className={styles.depRuleCount}>{(activeConfig.dependencies?.rules || []).length}</span>
                )}
              </span>
              <button
                type="button"
                className={styles.depAddBtn}
                onClick={() => {
                  const el = document.getElementById(`dep-form-${activeCoverage}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
              >+ Add Dependency</button>
            </div>

            {(activeConfig.dependencies?.rules || []).length === 0 ? (
              <div className={styles.depEmpty}>No dependency rules configured.</div>
            ) : (
              <div className={styles.depTableWrap}>
                <table className={styles.depTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Action</th>
                      <th>Target Coverage</th>
                      <th>Condition</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {(activeConfig.dependencies?.rules || []).map((rule, i) => (
                      <tr key={rule.id}>
                        <td><span className={styles.depRowNum}>{i + 1}</span></td>
                        <td>
                          <select className={styles.formControl} aria-label={'Action for dependency ' + (i + 1)} value={rule.action} onChange={event => editDepRule(rule.id, 'action', event.target.value)}>
                            <option value="requires">Requires</option><option value="excludes">Excludes</option><option value="bundles">Bundles</option>
                          </select>
                        </td>
                        <td><select className={styles.formControl} aria-label={'Target for dependency ' + (i + 1)} value={rule.target} onChange={event => editDepRule(rule.id, 'target', event.target.value)}>
                          {!otherCoverages.includes(rule.target) && <option value={rule.target}>{rule.target}</option>}
                          {otherCoverages.map(coverage => <option key={coverage}>{coverage}</option>)}
                        </select></td>
                        <td><input className={styles.formControl} aria-label={'Condition for dependency ' + (i + 1)} value={rule.condition || ''} onChange={event => editDepRule(rule.id, 'condition', event.target.value)}/></td>
                        <td>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnSm}`}
                            onClick={() => rmDepRule(rule.id)}
                          >Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div id={`dep-form-${activeCoverage}`} className={styles.depAddForm}>
              <div className={styles.depRulesLabel} style={{ marginBottom: 10 }}>Add Dependency Rule</div>
              <div className={styles.depAddGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Action</label>
                  <select
                    className={styles.formControl}
                    value={newDep.action}
                    onChange={e => setNewDep(p => ({ ...p, action: e.target.value }))}
                  >
                    <option value="requires">Requires</option>
                    <option value="excludes">Excludes</option>
                    <option value="bundles">Bundles</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Coverage</label>
                  <select
                    className={styles.formControl}
                    value={newDep.target}
                    onChange={e => setNewDep(p => ({ ...p, target: e.target.value }))}
                  >
                    <option value="">Select coverage…</option>
                    {otherCoverages.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Condition (optional)</label>
                  <input
                    className={styles.formControl}
                    value={newDep.condition}
                    onChange={e => setNewDep(p => ({ ...p, condition: e.target.value }))}
                    placeholder="e.g. When limit > $500k"
                  />
                </div>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={addDepRule}
                  disabled={!newDep.target}
                  style={{ alignSelf: 'flex-end' }}
                >+ Add</button>
              </div>
            </div>
          </SectionCard>

          {/* ── S5: Claims Behaviour ────────────────────────── */}
          <SectionCard
            number={activeAdditionalCoverage ? 6 : 7}
            title="Claims Behaviour"
            subtitle="Loss trigger, reinstatement, benefit basis and notification period."
            open={openSections.s5}
            onToggle={() => toggleSection('s5')}
          >
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Loss Basis</label>
                <select
                  className={styles.formControl}
                  value={activeConfig.claims.lossBasis}
                  onChange={e => update('claims.lossBasis', e.target.value)}
                >
                  <option>Occurrence</option>
                  <option>Claims-Made</option>
                  <option>Losses Occurring</option>
                  <option>Risks Attaching</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reinstatement</label>
                <select
                  className={styles.formControl}
                  value={activeConfig.claims.reinstatement}
                  onChange={e => update('claims.reinstatement', e.target.value)}
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                  <option>None</option>
                  <option>Pro-rata</option>
                  <option>Full</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Benefit Basis</label>
                <select
                  className={styles.formControl}
                  value={activeConfig.claims.benefitBasis}
                  onChange={e => update('claims.benefitBasis', e.target.value)}
                >
                  <option>Indemnity</option>
                  <option>Agreed Value</option>
                  <option>First Loss</option>
                  <option>Excess of Loss</option>
                  <option>Proportional</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Claims Notification Period</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" min="1"
                    className={styles.formControl}
                    style={{ width: 76 }}
                    value={activeConfig.claims.notificationNumber}
                    onChange={e => update('claims.notificationNumber', e.target.value)}
                    placeholder="14"
                  />
                  <select
                    className={styles.formControl}
                    value={activeConfig.claims.notificationUnit}
                    onChange={e => update('claims.notificationUnit', e.target.value)}
                  >
                    <option>days</option>
                    <option>weeks</option>
                    <option>months</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Applicable Deductible</label>
                <div className={`${styles.formControl} ${styles.formReadonly}`} style={{ display: 'flex', alignItems: 'center' }}>
                  {deductibleDisplay}
                </div>
              </div>
            </div>

            <div className={styles.sectionDivider} />

            <div className={styles.uwOverrideRow}>
              <div className={styles.uwOverrideText}>
                <strong>Underwriter can override claims behavior</strong>
                <p>
                  {activeConfig.claims.uwOverride ? 'Enabled' : 'Disabled'}
                  {' — '}Allow underwriter to modify claims behavior settings.
                </p>
              </div>
              <Toggle
                checked={activeConfig.claims.uwOverride}
                onChange={v => update('claims.uwOverride', v)}
              />
            </div>
          </SectionCard>

          {/* ── S6: Wording Reference ───────────────────────── */}
          <SectionCard
            number={activeAdditionalCoverage ? 7 : 8}
            title="Wording Reference"
            subtitle="Policy forms, endorsements and linked wording documents."
            open={openSections.s6}
            onToggle={() => toggleSection('s6')}
          >
            {(activeConfig.wordingRefs || []).length > 0 ? (
              <div style={{ marginBottom: 12 }}>
                {(activeConfig.wordingRefs || []).map(ref => (
                  <div key={ref.id} className={styles.docRow}>
                    <span className={styles.docRowIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" />
                      </svg>
                    </span>
                    <div className={styles.docRowMain}>
                      <span className={styles.docRowName}>{ref.name}</span>
                      <div className={styles.docRowMeta}>
                        {ref.code && <span className={styles.docRowCode}>{ref.code}</span>}
                        {ref.version && <span className={styles.docRowCode}>v{ref.version}</span>}
                      </div>
                    </div>
                    <button type="button" className={`${styles.btn} ${styles.btnSm}`}>View</button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSm}`}
                      onClick={() => rmWord(ref.id)}
                    >Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.docEmpty}>No wording documents linked.</div>
            )}

            {showAddWord ? (
              <div className={styles.docAddForm}>
                <div className={styles.formGrid3} style={{ marginBottom: 12 }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Document Name</label>
                    <input
                      className={styles.formControl}
                      value={newWord.name}
                      onChange={e => setNewWord(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Commercial Auto Coverage"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Document Code</label>
                    <input
                      className={styles.formControl}
                      value={newWord.code}
                      onChange={e => setNewWord(p => ({ ...p, code: e.target.value }))}
                      placeholder="e.g. DOC-001"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Version</label>
                    <input
                      className={styles.formControl}
                      value={newWord.version}
                      onChange={e => setNewWord(p => ({ ...p, version: e.target.value }))}
                      placeholder="e.g. v2026.01"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={addWord}>Attach Document</button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => { setShowAddWord(false); setNewWord({ name: '', code: '', version: '' }); }}
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" className={styles.addRowBtn} onClick={() => setShowAddWord(true)}>
                + Link Document
              </button>
            )}

            <div className={styles.uploadZone}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload policy form or endorsement (PDF, DOCX)
            </div>
          </SectionCard>

          {/* Footer nav */}
          <div className={styles.footerNav}>
            <div>
              {hasPrev && (
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => { setActiveCoverage(coverageList[coverageIdx - 1]); window.scrollTo({ top: 0 }); }}
                >← Previous Coverage</button>
              )}
            </div>
            <div className={styles.footerNavRight}>
              <button type="button" className={styles.btn} onClick={saveConfig} disabled={saving}>
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={hasNext ? saveAndNext : saveConfig}
                disabled={saving}
              >{hasNext ? 'Save & Next →' : 'Save Configuration'}</button>
            </div>
          </div>

          </>}
        </div>
      </div>

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}
