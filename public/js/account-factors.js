// Account-level factors (second tab of the Rating factors step).
// One minimum / maximum and a list of factors for the whole product version. Each factor adds (Plus) or subtracts (Minus)
// an adjustment when its conditions on questions are met; the result is kept between the limits and reaches the premium
// formula as the single value AccountFactor. The calculation and checks live in account-factor-calc.js.
//
// Conditions use the same operators and answer controls as eligibility rules, on the questions ticked as
// "Account-level factor" (Questions step, Edit form, or Add question here).
import { esc, newId } from './product-model.js';
import { OPS, family, valueInputs, collectGroups, defaultRule } from './eligibility.js';
import { openAddQuestion } from './question-add.js';
import {
  accountOf,
  blankFactor,
  blankCondition,
  accountQuestions,
  accountFactorProblems,
  computeAccountFactor,
  refOfKey,
  ACCOUNT_LABEL,
  BASE_FACTOR,
} from './account-factor-calc.js';

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const blank = (v) => v === '' || v == null;
const signed = (f) => (blank(f.adjustment) || Number.isNaN(Number(f.adjustment)) ? '—' : `${f.behavior === 'minus' ? '−' : '+'}${Number(f.adjustment).toFixed(2)}`);

// How the condition value controls announce themselves (see valueInputs in eligibility.js).
const COND_ATTRS = {
  chip: (act, r, v) => `data-a-act="${act === 'val' ? 'cval' : 'ctoggle'}" data-a-cond="${r.id}" data-a-v="${v}"`,
  input: (field, r) => `data-a-cin="${field}" data-a-cond="${r.id}"`,
};

export const mountAccountFactors = (host, { getVersion, getForms, readOnly, onChange }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { selected: null, query: '', answers: {} };
  const $ = (sel) => root.querySelector(sel);
  const config = () => accountOf(getVersion());
  const questions = () => accountQuestions(getVersion(), getForms());
  const problems = () => accountFactorProblems(config(), questions());
  const current = () => config().factors.find((f) => f.id === ui.selected);
  const findCond = (id) => current()?.conditions.find((c) => c.id === id);
  const changed = () => onChange?.();

  const messages = (list) => list.map((p) => `<span class="${p.level === 'error' ? 'e' : 'w'}">${esc(p.msg)}</span>`).join('');

  // ---- strip, list ----
  const renderStrip = () => {
    const p = problems();
    const bad = [...p.byOwner.keys()].filter((id) => id !== 'limits').length;
    const { min, max } = config();
    const stat = (v, l, cls = '') => `<div class="el-stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
    $('#af-strip').innerHTML = stat(config().factors.length, 'account-level factors') + stat(`${blank(min) ? '—' : esc(min)} – ${blank(max) ? '—' : esc(max)}`, 'minimum – maximum', p.byOwner.has('limits') ? 'warn' : '') + stat(bad, 'need attention', bad ? 'warn' : '');
  };

  const renderList = () => {
    const term = ui.query.trim().toLowerCase();
    const p = problems();
    const items = config().factors.filter((f) => !term || String(f.name).toLowerCase().includes(term));
    $('#af-list').innerHTML = items.length
      ? items.map((f) => `<button type="button" class="el-q" data-a-f="${esc(f.id)}" aria-current="${f.id === ui.selected}">
          <span class="el-qmain"><span class="el-qlabel">${esc(f.name) || 'Untitled factor'}</span><span class="el-qtype">${plural((f.conditions ?? []).length, 'condition')}</span></span>
          <span class="el-pills">${p.byOwner.has(f.id) ? '<span class="el-pill t-decline">Incomplete</span>' : ''}<span class="el-pill ${f.behavior === 'minus' ? 't-ok' : 't-senior'}">${signed(f)}</span></span></button>`).join('')
      : `<div class="el-empty">${config().factors.length ? 'No factors match.' : 'No account-level factors yet.<br>Use “Add factor” to create one.'}</div>`;
  };

  // ---- limits ----
  const limitField = (field, label) => `<div class="fc-field"><label for="af-${field}">${label} *</label>
      <input id="af-${field}" class="el-f num" type="number" min="0" step="0.01" data-a-in="${field}" data-a-key="limits:${field}" value="${esc(config()[field])}" placeholder="e.g. ${field === 'min' ? '0.80' : '1.50'}">
      <div class="rt-msg" data-a-msg="limits:${field}" hidden></div></div>`;
  const renderLimits = () => {
    $('#af-limits').innerHTML = `<div class="el-edh"><h2>Minimum and maximum</h2>
        <div class="el-meta"><span>The factor starts at ${BASE_FACTOR.toFixed(2)}. Each applicable adjustment is added (Plus) or subtracted (Minus), then the result is kept between these limits.</span></div></div>
      <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}><div class="fc-fields">${limitField('min', 'Minimum factor')}${limitField('max', 'Maximum factor')}</div></fieldset>`;
  };

  // ---- editor ----
  const questionSelect = (f, c, qmap) => {
    const byGroup = new Map();
    [...qmap.values()].filter((q) => q.tagged).forEach((q) => byGroup.set(`${q.group} · ${q.sub}`, [...(byGroup.get(`${q.group} · ${q.sub}`) ?? []), q]));
    const known = qmap.get(c.ref)?.tagged;
    return `<select class="el-f wide" data-a-cq="${c.id}" data-a-key="${f.id}:${c.id}" aria-label="Question">
      <option value="">Choose a question…</option>
      ${[...byGroup].map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((q) => `<option value="${esc(q.ref)}"${q.ref === c.ref ? ' selected' : ''}>${esc(q.label || 'Untitled question')}</option>`).join('')}</optgroup>`).join('')}
      ${c.ref && !known ? `<option value="${esc(c.ref)}" selected>This question is not available</option>` : ''}</select>`;
  };

  const conditionRow = (f, c, i, qmap) => {
    const q = qmap.get(c.ref);
    const usable = q?.tagged && OPS[family(q.type)].some((o) => o[0] === c.op);
    return `<div class="el-rule">
      <div class="el-ruletop"><span class="el-h3">Condition ${i + 1}</span><button type="button" class="el-del" data-a-act="delcond" data-a-cond="${c.id}">Remove</button></div>
      <div class="el-row"><span class="el-kw">Question</span>${questionSelect(f, c, qmap)}</div>
      ${usable ? `<div class="el-row"><span class="el-kw">Answer</span>
        <select class="el-f" data-a-cop="${c.id}" aria-label="Condition">${OPS[family(q.type)].map((o) => `<option value="${o[0]}"${o[0] === c.op ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>
        ${valueInputs(q, c, COND_ATTRS)}</div>` : ''}
      <div class="rt-msg" data-a-msg="${f.id}:${c.id}" hidden></div>
    </div>`;
  };

  const preview = (f) => (blank(f.adjustment) || Number.isNaN(Number(f.adjustment))
    ? 'Enter the adjustment to see its effect.'
    : `When ${f.logic === 'all' ? 'all conditions are' : 'any condition is'} met, ${f.behavior === 'minus' ? 'subtracts' : 'adds'} <b>${Number(f.adjustment).toFixed(2)}</b> ${f.behavior === 'minus' ? 'from' : 'to'} the factor.`);

  const renderEditor = () => {
    const f = current();
    if (!f) {
      $('#af-editor').innerHTML = '<div class="el-none" style="margin:16px">Add a factor to adjust the premium from answers. For example, Plus 0.15 when “Prior losses” is Yes.</div>';
      return;
    }
    const qmap = questions();
    const dis = readOnly() ? ' disabled' : '';
    $('#af-editor').innerHTML = `
      <div class="el-edh"><h2>${esc(f.name) || 'New factor'}</h2>
        <div class="el-meta"><span class="el-tag">${f.behavior === 'minus' ? 'Minus (−)' : 'Plus (+)'}</span><span>Account-level factor</span></div></div>
      <fieldset class="plain el-edb"${dis}>
        <div class="fc-field"><label for="af-name">Factor name *</label>
          <input id="af-name" class="el-f" type="text" maxlength="60" data-a-fin="name" data-a-key="${f.id}:name" value="${esc(f.name)}" placeholder="e.g. Prior losses">
          <div class="rt-msg" data-a-msg="${f.id}:name" hidden></div></div>
        <div><span class="el-h3">Behavior</span>
          <div class="el-outcomes" style="margin-top:8px">
            <button type="button" class="el-oc t-senior" data-a-act="behavior" data-a-v="plus" aria-pressed="${f.behavior !== 'minus'}"><b>Plus (+)</b><span>Raises the factor when the conditions are met</span></button>
            <button type="button" class="el-oc t-ok" data-a-act="behavior" data-a-v="minus" aria-pressed="${f.behavior === 'minus'}"><b>Minus (−)</b><span>Lowers the factor when the conditions are met</span></button></div></div>
        <div class="fc-fields">
          <div class="fc-field"><label for="af-adj">Adjustment *</label>
            <input id="af-adj" class="el-f num" type="number" min="0" step="0.01" data-a-fin="adjustment" data-a-key="${f.id}:adjustment" value="${esc(f.adjustment)}" placeholder="e.g. 0.10">
            <div class="rt-msg" data-a-msg="${f.id}:adjustment" hidden></div></div>
          <div class="fc-field"><label for="af-logic">Applies when</label>
            <select id="af-logic" class="el-f" data-a-logic><option value="any"${f.logic !== 'all' ? ' selected' : ''}>Any condition is met</option><option value="all"${f.logic === 'all' ? ' selected' : ''}>All conditions are met</option></select></div>
        </div>
        <p class="rt-note" data-a-preview style="margin-top:-6px">${preview(f)}</p>
        <div><span class="el-h3">Conditions</span></div>
        ${f.conditions.map((c, i) => conditionRow(f, c, i, qmap)).join('') || '<div class="el-none">No conditions yet.<br>The factor applies only when its conditions are met.</div>'}
        <div class="rt-msg" data-a-msg="${f.id}:conditions" hidden></div>
        <div class="el-row"><button type="button" class="action el-add" data-a-act="addcond">+ Add a condition</button>
          <button type="button" class="action" data-a-act="addq">+ Add question</button>
          <button type="button" class="el-del" data-a-act="remove" style="margin-left:auto">Remove this factor</button></div>
      </fieldset>`;
  };

  // ---- tester ----
  const testControl = (q) => {
    const a = ui.answers[q.ref];
    const f = family(q.type);
    const chips = (list, act) => list.map((v) => `<button type="button" class="el-chip" data-a-act="${act}" data-a-ref="${esc(q.ref)}" data-a-v="${esc(v)}" aria-pressed="${act === 'tmulti' ? (a ?? []).includes(v) : a === v}">${esc(v)}</button>`).join('');
    if (f === 'yesno') return chips(['Yes', 'No'], 'tans');
    if (f === 'choice') return chips(q.options ?? [], 'tans');
    if (f === 'multi') return chips(q.options ?? [], 'tmulti');
    return `<input class="el-f wide" type="${f === 'number' ? 'number' : f === 'date' ? 'date' : 'text'}" step="any" data-a-tin="${esc(q.ref)}" value="${esc(a ?? '')}" placeholder="Sample answer" aria-label="Sample answer">`;
  };
  const testResult = () => {
    if (!config().factors.length) return '<div class="el-result">Add a factor to try it out.</div>';
    const r = computeAccountFactor(config(), questions(), ui.answers);
    const lines = r.applied.map((a) => `${a.amount < 0 ? '−' : '+'}${Math.abs(a.amount).toFixed(2)} ${esc(a.factor.name || 'Untitled factor')}`);
    const note = r.limited ? ` · limited to the ${r.limited === 'min' ? 'minimum' : 'maximum'} (${r.raw.toFixed(2)} before the limit)` : '';
    return `<div class="el-result t-ok">${ACCOUNT_LABEL} = ${r.value.toFixed(2)}<small>${[`start ${BASE_FACTOR.toFixed(2)}`, ...lines].join(' · ')}${note}</small></div>`;
  };
  const renderTest = () => {
    const qmap = questions();
    const refs = [...new Set(config().factors.flatMap((f) => f.conditions.map((c) => c.ref)))].map((ref) => qmap.get(ref)).filter((q) => q?.tagged);
    $('#af-test').innerHTML = `<div class="el-test" style="border-top:0"><span class="el-h3">Try it out</span>
      ${refs.length ? refs.map((q) => `<div class="el-row"><span class="el-kw" style="min-width:0">${esc(q.label)}</span>${testControl(q)}</div>`).join('') : '<div class="muted">Add conditions to try sample answers.</div>'}
      <div id="af-result">${testResult()}</div></div>`;
  };

  // ---- refresh ----
  // Messages and outlines are rewritten in place, so typing keeps its focus.
  const paint = () => {
    const p = problems();
    root.querySelectorAll('[data-a-msg]').forEach((n) => {
      const list = p.byKey.get(n.dataset.aMsg) ?? [];
      n.innerHTML = messages(list);
      n.hidden = !list.length;
    });
    root.querySelectorAll('[data-a-key]').forEach((n) => {
      const list = p.byKey.get(n.dataset.aKey) ?? [];
      n.classList.toggle('bad', list.some((x) => x.level === 'error'));
      n.classList.toggle('warnc', !list.some((x) => x.level === 'error') && list.length > 0);
    });
  };
  const refreshLight = () => {
    renderStrip();
    renderList();
    paint();
    const f = current();
    if (f) $('[data-a-preview]') && ($('[data-a-preview]').innerHTML = preview(f));
    const res = $('#af-result');
    if (res) res.innerHTML = testResult();
  };
  const refreshAll = () => {
    renderStrip();
    renderList();
    renderEditor();
    renderTest();
    paint();
  };

  root.innerHTML = `
    <div class="el-strip" id="af-strip"></div>
    <section class="el-panel" id="af-limits" style="margin-bottom:16px"></section>
    <div class="el-grid">
      <section class="el-panel" aria-label="Account-level factors">
        <div class="el-panelh">
          <h3 class="el-title">Factors <button type="button" class="action" id="af-add" style="float:right"${readOnly() ? ' disabled' : ''}>+ Add factor</button></h3>
          <input class="el-search" id="af-search" type="search" placeholder="Search factors" aria-label="Search factors">
        </div>
        <div class="el-list" id="af-list"></div>
      </section>
      <section class="el-panel" id="af-editor" aria-live="polite"></section>
    </div>
    <section class="el-panel" id="af-test" style="margin-top:16px"></section>`;
  const first = config().factors;
  ui.selected = (first.find((f) => problems().byOwner.has(f.id)) ?? first[0])?.id ?? null;
  renderLimits();
  refreshAll();

  // ---- events ----
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a-f],[data-a-act],#af-add');
    if (!el) return;
    const d = el.dataset;
    if (d.aF) {
      ui.selected = d.aF;
      renderList();
      return renderEditor(), paint();
    }
    // Sample answers only read, so they work on a published version too.
    if (d.aAct === 'tans') {
      ui.answers[d.aRef] = d.aV;
      return renderTest();
    }
    if (d.aAct === 'tmulti') {
      const have = ui.answers[d.aRef] ?? [];
      ui.answers[d.aRef] = have.includes(d.aV) ? have.filter((x) => x !== d.aV) : [...have, d.aV];
      return renderTest();
    }
    if (readOnly()) return;
    const f = current();
    if (el.id === 'af-add') {
      const fresh = blankFactor();
      config().factors.push(fresh);
      ui.selected = fresh.id;
      changed();
      refreshAll();
      return $('#af-name')?.focus();
    }
    if (d.aAct === 'remove') {
      if (!confirm(`Remove ${f.name ? `“${f.name}”` : 'this factor'}?`)) return;
      config().factors = config().factors.filter((x) => x.id !== f.id);
      ui.selected = config().factors[0]?.id ?? null;
    } else if (d.aAct === 'behavior') f.behavior = d.aV;
    else if (d.aAct === 'addcond') f.conditions.push({ id: newId(), ref: '', op: '', value: '', value2: '' });
    else if (d.aAct === 'delcond') f.conditions = f.conditions.filter((c) => c.id !== d.aCond);
    else if (d.aAct === 'cval') findCond(d.aCond).value = d.aV;
    else if (d.aAct === 'ctoggle') {
      const c = findCond(d.aCond);
      c.value = c.value.includes(d.aV) ? c.value.filter((x) => x !== d.aV) : [...c.value, d.aV];
    } else if (d.aAct === 'addq') {
      return openAddQuestion({
        use: 'account',
        groups: collectGroups(getVersion(), getForms()),
        getVersion,
        onAdded: (keys) => {
          const ref = refOfKey(keys[0]);
          const q = questions().get(ref);
          if (q) current().conditions.push(blankCondition(ref, q));
          changed();
          refreshAll();
        },
      });
    } else return;
    changed();
    refreshAll();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (readOnly()) return;
    if (t.dataset.aCq !== undefined) {
      const c = findCond(t.dataset.aCq);
      const q = questions().get(t.value);
      Object.assign(c, { ref: t.value, op: '', value: '', value2: '' }, q ? (({ op, value, value2 }) => ({ op, value, value2 }))(defaultRule(q)) : {});
    } else if (t.dataset.aCop !== undefined) {
      const c = findCond(t.dataset.aCop);
      const q = questions().get(c.ref);
      c.op = t.value;
      if (family(q.type) === 'date' || c.op === 'between') c.value2 = '';
      if (family(q.type) === 'date') c.value = '';
    } else if (t.dataset.aLogic !== undefined) current().logic = t.value;
    else return;
    changed();
    refreshAll();
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    const d = t.dataset;
    if (d.aTin !== undefined) {
      ui.answers[d.aTin] = t.value;
      return ($('#af-result').innerHTML = testResult());
    }
    if (t.id === 'af-search') {
      ui.query = t.value;
      return renderList();
    }
    if (readOnly()) return;
    if (d.aIn) config()[d.aIn] = t.value;
    else if (d.aFin) current()[d.aFin] = t.value;
    else if (d.aCin) findCond(d.aCond)[d.aCin] = t.value;
    else return;
    changed();
    refreshLight();
  });
};
