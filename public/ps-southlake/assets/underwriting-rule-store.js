/* Centralized underwriting rule store — single source of truth across studios */
window.PS = window.PS || {};

(function () {
  'use strict';

  const COLLECTION = 'underwritingRules';

  PS.uwRuleStore = {
    COLLECTION,

    STUDIOS: {
      COVERAGE: 'Coverage Guide',
      RISK: 'Risk Guide',
      QUESTIONS: 'Questions Guide',
      PRODUCT: 'Product Guide',
      UNDERWRITING: 'Underwriting Guide',
      ELIGIBILITY: 'Eligibility Guide',
      DISTRIBUTION: 'Distribution Guide'
    },

    SYNC_COLLECTIONS: ['eligibilityRules', 'covers', 'questionGroups', 'riskAttributes', 'channels', COLLECTION],

    shouldSyncOnPersist(collectionName) {
      return this.SYNC_COLLECTIONS.includes(collectionName);
    },

    collectionKey(productId, version, name) {
      return `${productId}::${version}::${name || COLLECTION}`;
    },

    clone(v) {
      return JSON.parse(JSON.stringify(v));
    },

    normalize(rule) {
      if (!rule || typeof rule !== 'object') return null;
      const r = rule;
      const type = String(r.type || r.decision || r.outcome || 'refer').toLowerCase();
      const rows = (r.condition?.groups?.[0]?.rows)
        || (r.conditions || []).map(c => ({
          f: c.f || c.field,
          fieldKey: c.fieldKey || c.field,
          op: c.op || c.operator || '=',
          v: String(c.v ?? c.value ?? '')
        }));
      const overlay = r.uwOverlay || {};
      return Object.assign({}, r, {
        id: r.id,
        name: r.name || 'Untitled rule',
        type,
        decision: r.decision || type.charAt(0).toUpperCase() + type.slice(1),
        status: r.status || 'active',
        sourceStudio: r.sourceStudio || PS.uwRuleStore.STUDIOS.UNDERWRITING,
        source: r.source || 'Risk Attribute',
        syncKey: r.syncKey || `native::${r.id}`,
        questionGroup: r.questionGroup || r.cat || r.category || '—',
        riskAttribute: r.riskAttribute || rows[0]?.f || '',
        riskAttributeId: r.riskAttributeId || '',
        assignedTo: r.assignedTo || overlay.assignedTo || r.out?.assignedTo || '—',
        fallbackUnderwriter: r.fallbackUnderwriter || overlay.fallbackUnderwriter || r.out?.fallback || '—',
        authorityLevel: r.authorityLevel || overlay.authorityLevel || r.out?.authority || '—',
        uwOverlay: {
          assignedTo: overlay.assignedTo || r.assignedTo || r.out?.assignedTo || '',
          fallbackUnderwriter: overlay.fallbackUnderwriter || r.fallbackUnderwriter || r.out?.fallback || '',
          authorityLevel: overlay.authorityLevel || r.authorityLevel || r.out?.authority || ''
        },
        condition: r.condition || { groups: [{ logic: String(r.logic || 'AND').toUpperCase(), rows }] },
        out: r.out || { type: type.charAt(0).toUpperCase() + type.slice(1) },
        sourceRef: r.sourceRef || null,
        desc: r.desc || r.description || '',
        cat: r.cat || r.questionGroup || '—',
        prio: r.prio || {},
        auth: r.auth || {},
        audit: Array.isArray(r.audit) ? r.audit : []
      });
    },

    getRules(productId, version) {
      const app = PS.prototypeApp;
      if (!app?.getProductBundle) return [];
      const bundle = app.getProductBundle(productId, version);
      return (bundle.underwriting || []).map(r => this.normalize(r)).filter(Boolean);
    },

    saveRules(productId, version, rules, options) {
      const app = PS.prototypeApp;
      if (!app?.state) return rules;
      const key = this.collectionKey(productId, version, COLLECTION);
      const cloned = this.clone(rules.map(r => this.normalize(r)).filter(Boolean));
      app.state.collections[key] = cloned;
      app.save?.();
      if (!options?.silent) {
        app.addAudit?.('MODIFIED', 'Underwriting rules synchronized', { collection: COLLECTION, count: cloned.length });
        app.storeFullProductJson?.(productId, version);
        app.refreshStudioNav?.();
      }
      window.dispatchEvent(new CustomEvent('ps:uw-rules-synced', {
        detail: { productId, version, rules: cloned }
      }));
      return cloned;
    },

    isDefinitionLocked(rule) {
      const studio = rule?.sourceStudio || '';
      return studio && studio !== PS.uwRuleStore.STUDIOS.UNDERWRITING;
    },

    viewSourceHref(rule, productId, version) {
      const ref = rule?.sourceRef || {};
      if (ref.href) {
        const sep = ref.href.includes('?') ? '&' : '?';
        const pid = productId || PS.prototypeApp?.context?.()?.productId || '';
        const ver = version || PS.prototypeApp?.context?.()?.version || '';
        if (ref.href.includes('product=')) return ref.href;
        return `${ref.href}${sep}product=${encodeURIComponent(pid)}&version=${encodeURIComponent(ver)}`;
      }
      const pid = productId || '';
      const map = {
        'Coverage Guide': `coverage-studio.html?product=${encodeURIComponent(pid)}`,
        'Eligibility Guide': `eligibility-studio.html?product=${encodeURIComponent(pid)}&rule=${encodeURIComponent(rule?.id || '')}`,
        'Questions Guide': `questionnaire-studio.html?product=${encodeURIComponent(pid)}`,
        'Risk Guide': `risk-studio.html?product=${encodeURIComponent(pid)}`,
        'Product Guide': `product-detail.html?id=${encodeURIComponent(pid)}`,
        'Distribution Guide': `distribution-studio.html?product=${encodeURIComponent(pid)}`
      };
      return map[rule?.sourceStudio] || `underwriting-studio.html?product=${encodeURIComponent(pid)}&rule=${encodeURIComponent(rule?.id || '')}`;
    },

    mergeRule(existing, incoming) {
      const prev = existing ? this.normalize(existing) : null;
      const next = this.normalize(incoming);
      if (!prev) return next;
      const overlay = {
        assignedTo: prev.uwOverlay?.assignedTo || prev.assignedTo || '',
        fallbackUnderwriter: prev.uwOverlay?.fallbackUnderwriter || prev.fallbackUnderwriter || '',
        authorityLevel: prev.uwOverlay?.authorityLevel || prev.authorityLevel || ''
      };
      return this.normalize(Object.assign({}, next, {
        assignedTo: overlay.assignedTo || next.assignedTo,
        fallbackUnderwriter: overlay.fallbackUnderwriter || next.fallbackUnderwriter,
        authorityLevel: overlay.authorityLevel || next.authorityLevel,
        uwOverlay: overlay,
        status: next.status === 'inactive' ? 'inactive' : (next.status || prev.status || 'active'),
        priority: prev.priority != null && next.sourceStudio !== PS.uwRuleStore.STUDIOS.UNDERWRITING
          ? (prev.priority ?? next.priority)
          : (next.priority ?? prev.priority),
        audit: [...(prev.audit || []), { d: new Date().toISOString().slice(0, 10), u: 'System', c: 'Synchronized from source guide' }].slice(-12)
      }));
    },

    mapEligibilityOutcome(outcomeType) {
      if (outcomeType === 'refer') return 'refer';
      if (outcomeType === 'soft') return 'refer';
      return 'decline';
    },

    mapEligibilityStatus(status) {
      const s = String(status || 'active').toLowerCase();
      if (s === 'inactive' || s === 'disabled' || s === 'draft') return s === 'draft' ? 'draft' : 'inactive';
      return 'active';
    },

    extractFromEligibility(eligibilityRules, productId) {
      return (Array.isArray(eligibilityRules) ? eligibilityRules : []).map(elig => {
        const id = elig.id;
        if (!id) return null;
        const type = this.mapEligibilityOutcome(elig.outcomeType);
        const rows = (elig.conditions || []).map(c => ({
          f: c.field,
          fieldKey: c.field,
          op: c.op,
          v: String(c.value ?? '')
        }));
        return this.normalize({
          id,
          syncKey: `eligibility::${id}`,
          name: elig.name,
          type,
          status: this.mapEligibilityStatus(elig.status),
          sourceStudio: this.STUDIOS.ELIGIBILITY,
          source: 'Risk Attribute',
          sourceRef: {
            studio: 'eligibility',
            href: `eligibility-studio.html?product=${encodeURIComponent(productId)}&rule=${encodeURIComponent(id)}`,
            entityId: id
          },
          questionGroup: elig.category || 'Product Eligibility',
          cat: elig.category,
          desc: elig.description,
          condition: { groups: [{ logic: String(elig.logic || 'and').toUpperCase(), rows }] },
          out: { type: type.charAt(0).toUpperCase() + type.slice(1), reason: elig.reasonCode },
          priority: elig.priority || 50
        });
      }).filter(Boolean);
    },

    extractFromCoverage(covers, productId) {
      const rules = [];
      (Array.isArray(covers) ? covers : []).forEach(cover => {
        const coverId = cover.id || cover.code;
        if (!coverId) return;
        (cover.constraints || []).forEach((c, i) => {
          const fieldSlug = String(c.field || 'field').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
          const id = `UW-COV-${coverId}-${fieldSlug}`;
          rules.push(this.normalize({
            id,
            syncKey: `coverage::${coverId}::constraint::${i}`,
            name: `${cover.name} — ${c.field}`,
            type: 'decline',
            status: 'active',
            sourceStudio: this.STUDIOS.COVERAGE,
            source: 'Risk Attribute',
            sourceRef: {
              studio: 'coverage',
              href: `coverage-studio.html?product=${encodeURIComponent(productId)}&cover=${encodeURIComponent(coverId)}`,
              entityId: coverId,
              path: `constraints[${i}]`
            },
            questionGroup: cover.name || 'Coverage',
            riskAttribute: c.field,
            condition: {
              groups: [{ logic: 'AND', rows: [{ f: c.field, fieldKey: fieldSlug, op: c.operator || '=', v: String(c.value ?? '') }] }]
            },
            priority: 40 + i
          }));
        });
        if (cover.uwReferral === 'Referral required') {
          const id = `UW-COV-REF-${coverId}`;
          rules.push(this.normalize({
            id,
            syncKey: `coverage::${coverId}::uwReferral`,
            name: `${cover.name} — Referral Required`,
            type: 'refer',
            status: 'active',
            sourceStudio: this.STUDIOS.COVERAGE,
            source: 'Cover configuration',
            sourceRef: {
              studio: 'coverage',
              href: `coverage-studio.html?product=${encodeURIComponent(productId)}&cover=${encodeURIComponent(coverId)}`,
              entityId: coverId,
              path: 'uwReferral'
            },
            questionGroup: cover.name || 'Coverage',
            desc: `Cover-level referral requirement for ${cover.name}.`,
            condition: { groups: [{ logic: 'AND', rows: [{ f: 'Cover selected', fieldKey: 'cover_selected', op: '=', v: cover.name }] }] },
            priority: 35
          }));
        }
      });
      return rules;
    },

    extractFromQuestionnaire(questionGroups, riskAttributes, productId) {
      const rules = [];
      const riskByField = new Map();
      (Array.isArray(riskAttributes) ? riskAttributes : []).forEach(a => {
        if (a.fieldKey) riskByField.set(a.fieldKey, a);
        if (a.name) riskByField.set(String(a.name).toLowerCase(), a);
      });

      (Array.isArray(questionGroups) ? questionGroups : []).forEach(group => {
        (group.questions || []).forEach(q => {
          const isEligibility = q.questionCategory === 'eligibility'
            || (q.derived?.usedIn || '').toLowerCase().includes('eligibility');
          if (!isEligibility) return;

          const validations = Array.isArray(q.validations) ? q.validations : [];
          validations.forEach((v, vi) => {
            if (!v.rule || v.rule === 'Required') return;
            const id = `UW-QST-${q.id || q.internalName}-${vi}`;
            const fieldKey = q.internalName || q.derived?.attr || String(q.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
            const risk = riskByField.get(fieldKey) || riskByField.get(String(q.label || '').toLowerCase());
            const op = v.rule === 'Min Value' ? '>=' : v.rule === 'Max Value' ? '<=' : '=';
            rules.push(this.normalize({
              id,
              syncKey: `questionnaire::${q.id}::validation::${vi}`,
              name: `${q.label || q.internalName} — ${v.rule}`,
              type: 'decline',
              status: 'active',
              sourceStudio: this.STUDIOS.QUESTIONS,
              source: 'Question validation',
              sourceRef: {
                studio: 'questionnaire',
                href: `questionnaire-studio.html?product=${encodeURIComponent(productId)}&question=${encodeURIComponent(q.id || '')}`,
                entityId: q.id,
                path: `validations[${vi}]`
              },
              questionGroup: group.label || group.name || 'Questions',
              riskAttribute: risk?.name || q.label,
              riskAttributeId: risk?.id || '',
              condition: {
                groups: [{ logic: 'AND', rows: [{ f: q.label || fieldKey, fieldKey, op, v: String(v.expr || '') }] }]
              },
              desc: v.msg || `Validation from question ${q.label}.`,
              priority: 45 + vi
            }));
          });
        });
      });
      return rules;
    },

    extractFromDistribution(channels, productId) {
      const rules = [];
      (Array.isArray(channels) ? channels : []).forEach(ch => {
        (ch.rules || []).forEach((r, i) => {
          const id = `UW-DIST-${ch.id}-${i}`;
          const isRefer = /refer/i.test(r.type || '') || /refer/i.test(r.val || '');
          rules.push(this.normalize({
            id,
            syncKey: `distribution::${ch.id}::rule::${i}`,
            name: `${ch.name} — ${r.rule || 'Channel rule'}`,
            type: isRefer ? 'refer' : 'decline',
            status: ch.status === 'inactive' ? 'inactive' : 'active',
            sourceStudio: this.STUDIOS.PRODUCT,
            source: 'Channel configuration',
            sourceRef: {
              studio: 'distribution',
              href: `distribution-studio.html?product=${encodeURIComponent(productId)}&channel=${encodeURIComponent(ch.id)}`,
              entityId: ch.id,
              path: `rules[${i}]`
            },
            questionGroup: 'Distribution',
            condition: {
              groups: [{ logic: 'AND', rows: [{ f: r.rule, fieldKey: 'channel_rule', op: '=', v: String(r.val || r.note || '') }] }]
            },
            desc: r.note || r.val || '',
            priority: 55 + i
          }));
        });
      });
      return rules;
    },

    extractFromRisk(riskAttributes, productId) {
      return (Array.isArray(riskAttributes) ? riskAttributes : [])
        .filter(a => a && a.underwritingRule && a.underwritingRule.enabled !== false)
        .map(a => {
          const ur = a.underwritingRule;
          const id = ur.id || `UW-RSK-${a.id}`;
          const type = String(ur.decision || ur.type || 'refer').toLowerCase();
          const op = ur.operator || ur.op || '>';
          const val = ur.value ?? ur.threshold ?? '';
          return this.normalize({
            id,
            syncKey: `risk::${a.id}`,
            name: ur.name || a.name,
            type,
            status: ur.status || a.status || 'active',
            sourceStudio: this.STUDIOS.RISK,
            source: 'Risk Attribute',
            sourceRef: {
              studio: 'risk',
              href: `risk-studio.html?product=${encodeURIComponent(productId)}&risk=${encodeURIComponent(a.id)}`,
              entityId: a.id
            },
            questionGroup: a.questionGroup || a.category || 'Risk',
            riskAttribute: a.name,
            riskAttributeId: a.id,
            condition: {
              groups: [{ logic: 'AND', rows: [{ f: a.name, fieldKey: a.fieldKey || a.id, op, v: String(val) }] }]
            },
            desc: ur.description || `${a.name} rule from Risk Guide.`,
            priority: ur.priority || 30,
            assignedTo: ur.assignedTo || '—',
            fallbackUnderwriter: ur.fallback || 'Commercial Underwriting Manager',
            authorityLevel: ur.authorityLevel || 'Level 2'
          });
        });
    },

    extractNativeRules(existing) {
      return (Array.isArray(existing) ? existing : []).filter(r => {
        const studio = r.sourceStudio || PS.uwRuleStore.STUDIOS.UNDERWRITING;
        return studio === PS.uwRuleStore.STUDIOS.UNDERWRITING;
      });
    },

    syncAll(productId, version, options) {
      const app = PS.prototypeApp;
      if (!productId || !app?.getProductBundle) return [];
      const bundle = app.getProductBundle(productId, version);
      const existing = this.clone(bundle.underwriting || []);
      const existingById = new Map(existing.map(r => [r.id, r]));
      const existingBySync = new Map(existing.filter(r => r.syncKey).map(r => [r.syncKey, r]));

      const fromSources = [
        ...this.extractFromEligibility(bundle.eligibility, productId),
        ...this.extractFromCoverage(bundle.covers, productId),
        ...this.extractFromQuestionnaire(bundle.questionGroups, bundle.risk, productId),
        ...this.extractFromDistribution(bundle.channels, productId),
        ...this.extractFromRisk(bundle.risk, productId),
        ...this.extractNativeRules(existing)
      ];

      const sourceSyncKeys = new Set(fromSources.map(r => r.syncKey).filter(Boolean));
      const merged = [];
      const seenIds = new Set();

      fromSources.forEach(candidate => {
        const prev = existingById.get(candidate.id) || existingBySync.get(candidate.syncKey);
        const mergedRule = this.mergeRule(prev, candidate);
        if (seenIds.has(mergedRule.id)) return;
        merged.push(mergedRule);
        seenIds.add(mergedRule.id);
      });

      existing.forEach(r => {
        if (seenIds.has(r.id)) return;
        const norm = this.normalize(r);
        if (norm.sourceStudio === this.STUDIOS.UNDERWRITING) {
          merged.push(norm);
          seenIds.add(norm.id);
          return;
        }
        if (norm.syncKey && !sourceSyncKeys.has(norm.syncKey)) {
          merged.push(this.normalize(Object.assign({}, norm, {
            status: 'inactive',
            inactiveReason: 'Removed from originating guide'
          })));
          seenIds.add(norm.id);
        }
      });

      merged.sort((a, b) => (a.priority || 99) - (b.priority || 99));
      return this.saveRules(productId, version, merged, options);
    },

    upsert(productId, version, rule) {
      const existing = this.getRules(productId, version);
      const norm = this.normalize(rule);
      const idx = existing.findIndex(r => r.id === norm.id);
      if (idx >= 0) {
        existing[idx] = this.mergeRule(existing[idx], norm);
      } else {
        existing.push(norm);
      }
      return this.saveRules(productId, version, existing);
    },

    updateAssignment(productId, version, ruleId, assignment) {
      const existing = this.getRules(productId, version);
      const idx = existing.findIndex(r => r.id === ruleId);
      if (idx < 0) return existing;
      const rule = existing[idx];
      const overlay = Object.assign({}, rule.uwOverlay || {}, assignment);
      existing[idx] = this.normalize(Object.assign({}, rule, {
        assignedTo: overlay.assignedTo || rule.assignedTo,
        fallbackUnderwriter: overlay.fallbackUnderwriter || rule.fallbackUnderwriter,
        authorityLevel: overlay.authorityLevel || rule.authorityLevel,
        uwOverlay: overlay
      }));
      return this.saveRules(productId, version, existing, { silent: false });
    },

    markInactive(productId, version, ruleId, reason) {
      const existing = this.getRules(productId, version);
      const idx = existing.findIndex(r => r.id === ruleId);
      if (idx < 0) return existing;
      existing[idx] = this.normalize(Object.assign({}, existing[idx], {
        status: 'inactive',
        inactiveReason: reason || 'Marked inactive'
      }));
      return this.saveRules(productId, version, existing);
    }
  };
})();
