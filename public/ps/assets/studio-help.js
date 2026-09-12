/* ============================================================
   Insurance Product Studio — Centralized Help Text
   studio-help.js
   ============================================================ */

window.PS = window.PS || {};

(function () {
  'use strict';

  function routeName() {
    if (typeof window !== 'undefined' && window.__PS_HTML_FILE__) return window.__PS_HTML_FILE__;
    const p = (location.pathname || '').split('/').pop() || 'index.html';
    if (p.includes('.html')) return p;
    const path = location.pathname || '';
    if (/\/underwriting/.test(path)) return 'underwriting-studio.html';
    if (/\/coverage/.test(path)) return 'coverage-studio.html';
    if (/\/questionnaire/.test(path)) return 'questionnaire-studio.html';
    if (/\/eligibility/.test(path)) return 'eligibility-studio.html';
    if (/\/rating/.test(path)) return 'rating-studio.html';
    if (/\/risk/.test(path)) return 'risk-studio.html';
    if (/\/document/.test(path)) return 'document-studio.html';
    if (/\/distribution/.test(path)) return 'distribution-studio.html';
    if (/\/jurisdiction/.test(path)) return 'jurisdiction-studio.html';
    return p.includes('.') ? p : 'index.html';
  }

  function normalizeLabel(text) {
    return String(text || '')
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const MODULES = {
    'index.html': {
      title: 'Dashboard',
      description: 'Your home screen for product lifecycle activity — active products, pending approvals, recent changes, and quick actions to create or test products.',
      tips: [
        'Use Quick Actions to start a new product or run a simulation without opening the catalogue.',
        'KPI cards link directly to filtered catalogue or governance views.',
        'The pipeline chart shows how many product versions sit in each lifecycle stage.',
      ],
    },
    'catalogue.html': {
      title: 'Product Catalogue',
      description: 'Browse, search, and manage all insurance products. Create new products, clone existing ones, export data, and open any product version for configuration.',
      tips: [
        'Product names must be unique across the catalogue.',
        'Clone creates a new product ID while copying configuration from a source version.',
        'Use filters to find Draft, In Review, or Published products quickly.',
      ],
    },
    'product-detail.html': {
      title: 'Product Detail',
      description: 'The product hub for a single product version — overview, studio progress, version history, governance actions, and links to every configuration studio.',
      tips: [
        'Each studio must be completed in order. Later studios stay locked until the previous studio is 100%.',
        'Use Clone Version to edit a Published version without affecting live business.',
        'Compare versions side-by-side before approving a release.',
      ],
    },
    'product-view.html': {
      title: 'Customer View',
      description: 'Preview how the configured product appears to brokers or policyholders — covers, questionnaire flow, and key terms as they would be presented at quote time.',
      tips: [
        'This is a read-only preview driven by the current product version configuration.',
        'Changes in studios are reflected here after save.',
      ],
    },
    'jurisdiction-studio.html': {
      title: 'Define Jurisdiction',
      description: 'Set where this product may be sold — US states, cities or counties, and territory rules that constrain rating and eligibility downstream.',
      tips: [
        'Select states first; optionally narrow to specific cities within a state.',
        'Empty city selection means the entire state is in scope.',
        'Jurisdiction feeds Eligibility and Rating studios automatically.',
      ],
    },
    'coverage-studio.html': {
      title: 'Coverage Studio',
      description: 'Define covers (benefits), financial terms, deductibles, sub-limits, dependencies, and claims behaviour for this product version.',
      tips: [
        'Import from the Cover Library to start from a standard template.',
        'Insured items hold valuation and limit rules per benefit line.',
        'Mandatory covers cannot be deselected at quote; optional covers can be add-ons.',
      ],
    },
    'questionnaire-studio.html': {
      title: 'Questionnaire Studio',
      description: 'Build the data capture flow for quoting and underwriting — question groups, field types, validation, evidence triggers, and channel visibility.',
      tips: [
        'Link questions to specific covers so they appear only when relevant.',
        'Evidence triggers prompt document upload when answers meet conditions.',
        'Group questions logically for broker and direct channels.',
      ],
    },
    'risk-studio.html': {
      title: 'Risk Studio',
      description: 'Risk Studio contains only questions from Questionary Studio where the Question Category is set to "Risk". These attributes are used to evaluate risk, build rating factors, and drive underwriting decisions.',
      tips: [
        'General and Eligibility questions never appear here — change Question Category to Risk in Questionary Studio to include them.',
        'Configure risk weight, tier, and interpretation here; question wording and options stay in Questionary Studio.',
        'Attributes here become available as conditions in Eligibility, Rating, and Underwriting Rules.',
      ],
    },
    'eligibility-studio.html': {
      title: 'Eligibility Studio',
      description: 'Eligibility decides who can be quoted. Rules use Risk Attributes from Risk Studio (themselves sourced from Questionnaire questions). Do not recreate questionnaire fields here.',
      tips: [
        'Condition attributes come from Risk Studio — grouped by Question Group.',
        'Hard Block prevents quotation; Soft Warning allows a quote with a warning; Refer sends the case to underwriting.',
        'If a source attribute is removed, the rule stays with a warning until you relink it.',
      ],
    },
    'rating-studio.html': {
      title: 'Rating & Pricing Studio',
      description: 'Configure premium calculation — base rates, loadings, discounts, taxes, and rating components tied to covers and risk attributes.',
      tips: [
        'Each component can target a specific cover or apply policy-wide.',
        'Use Price Test to trace how inputs flow through the rating engine.',
        'Document underwriting rationale in component descriptions for audit.',
      ],
    },
    'underwriting-studio.html': {
      title: 'Underwriting Rules Studio',
      description: 'Configure eligibility and underwriting rules for this product. Rules evaluate risk attributes captured from underwriting questions and determine whether a submission is accepted, referred, declined, or assigned to an authorized underwriter.',
      tips: [
        'Rules created in Coverage, Eligibility, Questions, or Product studios sync here automatically — one rule ID, one central record.',
        'Edit rule conditions in the originating studio; configure assignment and escalation here.',
        'Deleted source rules appear as INACTIVE to preserve references.',
      ],
    },
    'distribution-studio.html': {
      title: 'Distribution Studio',
      description: 'Configure how this product is sold — channels, broker access, commission structures, and binding authority by segment.',
      tips: [
        'Channel settings control which questionnaire variants and documents apply.',
        'Commission rules can vary by cover or distribution partner.',
      ],
    },
    'distribution-create.html': {
      title: 'Create Distribution Channel',
      description: 'Configure the distribution flow from reinsurance through product, MGA, and state — including coverages, LOB, cities, commission, and account-level factors.',
      tips: [
        'Reinsurer risk percentages must total exactly 100%.',
        'Products come from the catalogue. Selecting a product loads its coverages and LOB.',
        'Leave cities empty to include all cities within a selected state.',
      ],
    },
    'document-studio.html': {
      title: 'Document Studio',
      description: 'Manage pre-bind and post-bind documents for Commercial Trucking — applications, schedules, policy wording, certificates, and notices. Stage controls grouping, packs, and lifecycle triggers.',
      tips: [
        'PRE-BIND documents are collected or generated before bind; POST-BIND documents are issued after the policy is bound.',
        'Use Document Library to associate reusable templates — Document ID prevents duplicates.',
        'Preview Pack respects stage boundaries: pre-bind and post-bind packs never mix documents.',
      ],
    },
    'simulation-studio.html': {
      title: 'Simulation & Testing',
      description: 'Run end-to-end test scenarios through eligibility, rating, and underwriting without affecting production data.',
      tips: [
        'Save scenarios to regression-test after configuration changes.',
        'Compare expected vs actual premium and outcome for each test case.',
      ],
    },
    'governance.html': {
      title: 'Governance & Approval',
      description: 'Track product versions awaiting review, approve or reject changes, and maintain a controlled path from Draft to Published.',
      tips: [
        'Approvers need the correct role assignment in Roles & Access.',
        'Rejected versions return to Draft with comments for the product owner.',
      ],
    },
    'audit-log.html': {
      title: 'Audit Log',
      description: 'Immutable record of platform and product actions — who changed what, when, and on which product version.',
      tips: [
        'Filter by product, user, or action type for compliance investigations.',
        'Eligibility rules with “Log to Audit” create detailed trail entries.',
      ],
    },
    'glossary.html': {
      title: 'Glossary',
      description: 'Standard definitions for insurance and platform terms used across Product Studio screens and documentation.',
      tips: [
        'Search from the global topbar jumps here with your query pre-filled.',
      ],
    },
    'pricing-library.html': {
      title: 'Central Pricing Library',
      description: 'Reusable rating tables, factors, and reference data shared across products — maintained centrally to ensure consistency.',
      tips: [
        'Changes here may affect multiple products that reference the same table.',
        'Version pricing libraries before major rate revisions.',
      ],
    },
    'integration-monitor.html': {
      title: 'Integration Monitor',
      description: 'Health and status of external integrations — policy admin, CRM, document generation, and third-party data services.',
      tips: [
        'Failed syncs show retry options and last successful payload time.',
      ],
    },
    'roles-access.html': {
      title: 'Roles & Access Control',
      description: 'Manage users, system roles, product assignments, and scope restrictions that govern who can view or edit products.',
      tips: [
        'Product Managers can be limited to specific product families.',
        'Publisher role is required to make a version live.',
      ],
    },
    'admin-panel.html': {
      title: 'Admin Panel',
      description: 'Platform configuration — product types, lines of business, custom fields, lookup catalogues, and global defaults.',
      tips: [
        'Custom fields defined here appear in Coverage and Product forms.',
        'Changes affect all products using the associated catalogue entry.',
      ],
    },
  };

  const FIELDS = {
    'product name': 'Display name shown in the catalogue and to brokers. Must be unique across all products.',
    'product type': 'High-level product classification (e.g. Commercial Auto). Drives available lines of business and default covers.',
    'line of business': 'Insurance line this product belongs to (e.g. Auto Liability, Property). Filters library templates and reporting.',
    'carrier': 'The insurance carrier underwriting this product. Set from your signed-in organisation and cannot be changed here.',
    'mga': 'Managing General Agent(s) authorised to distribute this product on behalf of the carrier.',
    'product owner': 'Person accountable for this product\'s configuration, approvals, and lifecycle.',
    'product description': 'Internal summary of the product intent, target market, and key features.',
    'product code': 'Unique internal identifier used in integrations and reporting. Auto-suggested from the product name.',
    'jurisdictions — us states': 'States where this product may be quoted or bound. Required before other studios activate.',
    'effective proposed date from': 'Earliest date this product version is intended to go live. Must be approved before publication.',
    'effective proposed date to': 'Optional end date. Leave blank for open-ended availability. Must be on or after the From date.',
    'effective from': 'Date this version becomes valid for new business.',
    'effective to': 'Optional date after which this version stops accepting new business.',
    'new product name': 'Name for the cloned product. Must not duplicate an existing catalogue entry.',
    'new version label': 'Semantic version label (e.g. v2026.04). Generated to avoid collisions on this product.',
    'version label': 'Human-readable version identifier. Auto-generated and unique per product.',
    'assign owner': 'Product manager responsible for the cloned product going forward.',
    'base this version on': 'Source version whose configuration is copied into the new draft.',
    'change summary': 'Brief note describing what changed in this version for approvers and audit.',
    'clone source product': 'Existing product whose configuration seeds the new product wizard.',

    'cover name': 'Customer-facing name of the benefit or cover section on the policy schedule.',
    'cover code': 'Unique cover identifier for integrations and documents. Suggested automatically when created.',
    'cover type': 'Standard cover classification from the library (e.g. Third Party Property Damage).',
    'availability': 'Whether this cover is mandatory, default-on, optional, or sold as an add-on at quote time.',
    'description': 'Underwriter-facing explanation of scope, exclusions, and intent for this cover or rule.',
    'cover identity': 'Core identifiers and classification for the selected cover.',
    'default selected': 'When enabled, this optional cover is pre-ticked on the quote screen unless mandatory.',
    'conditional on': 'This cover appears only when the named cover is also selected.',
    'mutual exclusions': 'Covers that cannot be selected together on the same policy.',
    'loss basis': 'How claim amounts are measured — e.g. indemnity, agreed value, or replacement.',
    'reinstatement': 'Whether and how cover limits reset after a partial loss.',
    'benefit basis': 'How the benefit amount is determined at claim time.',
    'claims notification period': 'Maximum time after an incident to notify the insurer.',
    'applicable deductible': 'Read-only summary of the deductible rule applied from the Deductible section.',

    'item name': 'Label for this insured item line (e.g. Vehicle, Building, Contents).',
    'insured item type': 'Classification that drives default valuation and limit behaviour.',
    'allowed valuation basis': 'Which valuation methods (e.g. Market Value, Agreed Value) are permitted for this item.',
    'default valuation basis': 'Pre-selected valuation method when the item is first added to a quote.',
    'allowed during quote': 'Whether brokers can change valuation basis at quote time.',
    'limit basis': 'How the limit is expressed — fixed dollar amount or percentage of sum insured.',
    'limit amount ($)': 'Maximum payable amount for this item when basis is a fixed amount.',
    'limit percentage': 'Percentage of the reference sum insured used to calculate the limit.',
    'maximum limit': 'Cap applied when limit is calculated as a percentage.',
    'percentage of': 'Reference amount the limit percentage applies to (e.g. Sum Insured, Item value).',
    'underwriter limit override': 'Allows an underwriter to change this limit within configured bounds.',
    'payment rule': 'How partial losses reduce the remaining limit (e.g. each loss, aggregate).',

    'deductible type': 'Flat amount, percentage of loss, or hybrid structure.',
    'deductible amount ($)': 'Fixed excess payable per claim when type is amount-based.',
    'deductible percentage (%)': 'Percentage of the claim or sum insured applied as excess.',
    'minimum deductible ($)': 'Floor applied when deductible is percentage-based.',
    'maximum deductible ($)': 'Ceiling applied when deductible is percentage-based.',
    'waiting period': 'Time after policy inception before cover responds (common in health or BI).',
    'co-pay (%)': 'Portion of each claim payable by the insured after the deductible.',

    'maximum variation (%)': 'Maximum percent an underwriter may move a value from the configured default.',
    'referral requirement': 'Whether changing this field requires referral to a senior underwriter.',
    'reason requirement': 'Whether a free-text audit reason is mandatory for overrides.',

    'states': 'US states included in this jurisdiction or territorial rule.',
    'cities / counties': 'Optional narrowing within selected states. Leave empty to include the whole state.',

    'document name': 'Title of the policy document or endorsement as shown to users.',
    'code': 'Short document or entity code for integrations and cross-references.',
    'version': 'Document template version aligned with product releases.',

    'rule name': 'Short label identifying this eligibility or underwriting rule in lists and audit.',
    'category': 'Groups rules for filtering and conflict detection (e.g. Driver, Vehicle, Territory).',
    'applicable cover': 'When set, the rule applies only if this cover is on the quote.',
    'priority': 'Evaluation order — lower numbers run first when multiple rules could apply.',
    'status': 'Active rules evaluate at quote time; inactive rules are retained but skipped.',
    'log to audit': 'When enabled, rule firings write a detailed entry to the audit log.',
    'apply to future versions by default': 'Include this rule when cloning or creating new product versions.',

    'question label': 'Text shown to the user answering the question on the quote journey.',
    'field type': 'Input control and data type — text, number, date, dropdown, etc. Used for questionnaire questions and risk attributes.',
    'question category': 'Whether this question is general, tied to risk attributes, or tied to eligibility rules.',
    'question group': 'Section heading that groups related questions on the form.',
    'linked coverages': 'Questions appear only when at least one linked cover is selected.',
    'help text': 'Guidance shown beneath the question to assist accurate answers.',
    'required?': 'When yes, the quote cannot proceed until this question is answered.',
    'group name': 'Display name for a questionnaire section.',
    'position': 'Sort order of this group relative to others on the form.',
    'channel visibility': 'Restricts the question to specific sales channels (broker, direct, etc.).',

    'attribute name': 'Risk field name used in rules and rating (e.g. driver_age).',
    'group': 'Organises attributes in Risk Studio and rule builders.',
    'sample values / options': 'Example or enumerated values for dropdowns and testing.',
    'name': 'Display or system name for the entity being created.',
    'type': 'Classification or data type depending on context.',

    'base rate value': 'Starting premium or rate before loadings and discounts.',
    'loading value': 'Additional premium factor applied when conditions match.',
    'discount value': 'Reduction applied when discount conditions are satisfied.',
    'condition': 'Expression or rule that must be true for this loading or discount to apply.',
    'amount': 'Fixed monetary adjustment to premium.',
    'rate': 'Multiplier or rate factor applied to the base premium.',
    'component name': 'Human-readable name for this rating component.',
    'component id': 'Stable identifier referenced by integrations and audit.',
    'applies to cover': 'Limits this component to premium for a specific cover.',
    'calculation type': 'How the component combines with base premium (flat, factor, table lookup).',
    'default value / multiplier': 'Fallback value when no table row matches.',
    'description / underwriting rationale': 'Business justification recorded for compliance review.',

    'email address': 'Login email for the platform user.',
    'full name': 'Display name shown in audit entries and assignments.',
    'system role': 'Permission set controlling studio access and governance actions.',
    'product family restriction': 'Optional limit to products within selected families only.',
    'welcome message': 'Included in the invitation email for new users.',
    'phone (optional)': 'Contact number for the user profile.',
    'job title': 'Role title shown in governance and notification context.',
    'department / team': 'Organisational unit for reporting and access scope.',
    'current system role': 'Active permission set. Changing this affects all assigned products.',

    'scenario name': 'Label for a saved test scenario in simulation.',
    'age': 'Test input for driver or insured age used in rating/eligibility.',
    'publication date & time': 'When this version goes live if publication is approved.',
    'approval comments (optional)': 'Notes for the audit trail when approving a version.',
    'select scenario': 'Pre-built or saved inputs for running a product simulation.',

    'start from library template?': 'When yes, pre-fills cover fields from the selected library template.',
    'library template': 'Standard cover definition from the central Cover Library.',

    'driver_age': 'Age of the primary driver — common rating and eligibility input.',
    'vehicle_age (years)': 'Age of the insured vehicle in years.',
    'territory_zone': 'Geographic rating territory code.',
    'vehicle_use': 'Primary use classification (private, commercial, etc.).',
    'claims_free_years': 'No-claim discount period used in rating.',
    'insured_value': 'Sum insured or vehicle value for premium calculation.',
    'conviction_history': 'Motor conviction or claims history indicator.',
  };

  const FEATURES = {
    'total active products': 'Count of products with Published or Approved versions currently in market.',
    'pending approvals': 'Product versions awaiting governance sign-off before publication.',
    'draft products': 'Versions still being configured and not yet submitted for review.',
    'recent activity': 'Latest configuration changes and governance events across the platform.',
    'lifecycle pipeline': 'Distribution of product versions across Draft, Review, Approved, and Published states.',
  };

  function helpForLabel(label) {
    const key = normalizeLabel(label);
    return FIELDS[key] || '';
  }

  function insertFieldHelp(group, text) {
    if (!text || group.querySelector('.form-help')) return;
    const help = document.createElement('p');
    help.className = 'form-help';
    help.textContent = text;
    group.appendChild(help);
  }

  function applyFieldHelp(root) {
    const scope = root || document;
    scope.querySelectorAll('.form-group').forEach(group => {
      if (group.closest('#module-help-banner, .dc-page, .modal-overlay')) return;
      const labelEl = group.querySelector('.form-label');
      if (!labelEl) return;
      const dataKey = labelEl.getAttribute('data-help') || group.getAttribute('data-help');
      const text = dataKey ? (FIELDS[normalizeLabel(dataKey)] || dataKey) : helpForLabel(labelEl.textContent);
      if (text) insertFieldHelp(group, text);
    });

    scope.querySelectorAll('.form-label').forEach(labelEl => {
      if (labelEl.closest('.form-group, #module-help-banner, .dc-page, .modal-overlay')) return;
      const parent = labelEl.parentElement;
      if (!parent || parent.querySelector('.form-help')) return;
      const text = helpForLabel(labelEl.textContent);
      if (text) {
        const help = document.createElement('p');
        help.className = 'form-help';
        help.textContent = text;
        labelEl.insertAdjacentElement('afterend', help);
      }
    });
  }

  function applyFeatureHelp(root) {
    const scope = root || document;
    scope.querySelectorAll('.kpi-card').forEach(card => {
      if (card.querySelector('.kpi-help, .form-help')) return;
      const label = card.querySelector('.kpi-label');
      if (!label) return;
      const text = FEATURES[normalizeLabel(label.textContent)];
      if (!text) return;
      const help = document.createElement('p');
      help.className = 'kpi-help';
      help.textContent = text;
      card.appendChild(help);
    });
  }

  function mountModuleBanner() {
    const route = routeName();
    const mod = MODULES[route];
    if (!mod || document.getElementById('module-help-banner')) return;
    const header = document.querySelector('.page-header');
    if (!header) return;

    const banner = document.createElement('details');
    banner.id = 'module-help-banner';
    banner.className = 'module-help-banner';
    banner.open = false;
    banner.innerHTML = `
      <summary class="module-help-summary">
        <span class="module-help-icon" aria-hidden="true">?</span>
        <span class="module-help-title">About ${escapeHtml(mod.title)}</span>
      </summary>
      <div class="module-help-body">
        <p class="module-help-desc">${escapeHtml(mod.description)}</p>
        ${mod.tips?.length ? `<ul class="module-help-tips">${mod.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
      </div>`;
    header.insertAdjacentElement('afterend', banner);
  }

  function mountAll() {
    mountModuleBanner();
    applyFieldHelp();
    applyFeatureHelp();
  }

  function helpHtml(label) {
    const text = helpForLabel(label);
    return text ? `<span class="form-help">${escapeHtml(text)}</span>` : '';
  }

  let observerStarted = false;
  function observeDynamicContent() {
    if (observerStarted) return;
    observerStarted = true;
    const main = document.getElementById('main-content') || document.body;
    let timer = null;
    const obs = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        applyFieldHelp(main);
        applyFeatureHelp(main);
      }, 120);
    });
    obs.observe(main, { childList: true, subtree: true });
  }

  PS.studioHelp = {
    MODULES,
    FIELDS,
    FEATURES,
    routeName,
    normalizeLabel,
    helpForLabel,
    helpHtml,
    mountModuleBanner,
    applyFieldHelp,
    applyFeatureHelp,
    mountAll,
    observeDynamicContent,
  };
})();
