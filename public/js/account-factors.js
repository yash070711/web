// Account-level factors (step 7 of the product version workspace).
// Laid out like the rating factors: a Single question / Combinations switch, the questions ticked as "Account-level factor"
// (in the Questions step, the form builder, the coverage's forms, or “+ Add question” here) listed on the left, and the
// editor on the right with its own tabs. A factor on one question gives one value per answer (or range); a combination
// gives one value per valid combination of answers. Each FACTOR has its own behaviour, Plus (added) or Minus (subtracted),
// that applies to all of its values. Below, one table lists every factor together, and the overall minimum and maximum
// keep the total between limits; that single number reaches the premium formula as AccountFactor.
// The calculation and checks live in account-factor-calc.js.
import { esc } from './product-model.js';
import { collectGroups } from './eligibility.js';
import { openAddQuestion } from './question-add.js';
import { settleKeys, allCombinations, tupleKey, fieldOptions, isRangeDim, newQuestionDim, blankBand, sortedBands, bandLabel } from './combo-factor-calc.js';
import {
  accountOf,
  blankFactor,
  blankRow,
  accountContext,
  accountQuestionList,
  accountFactorProblems,
  computeAccountFactor,
  factorBehavior,
  rowBehavior,
  refOfKey,
  ACCOUNT_LABEL,
  BASE_FACTOR,
} from './account-factor-calc.js';

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const blank = (v) => v === '' || v == null;
const validAdj = (v) => !blank(v) && !Number.isNaN(Number(v)) && Number(v) >= 0;
const sign = (b) => (b === 'minus' ? '−' : '+');
const fmt = (v) => (blank(v) || Number.isNaN(Number(v)) ? '—' : Number(v).toFixed(2));
const BEHAVIOR_LABEL = { plus: 'Plus (+)', minus: 'Minus (−)', mixed: 'Mixed' };

export const mountAccountFactors = (host, { getVersion, getForms, readOnly, onChange }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { mode: 'single', selected: null, tab: 'values', query: '', answers: {}, multi: new Set(), building: false, note: '', bulk: '' };
  const $ = (sel) => root.querySelector(sel);
  const config = () => accountOf(getVersion());
  const ctx = () => accountContext(getVersion(), getForms());
  const problems = () => accountFactorProblems(config(), ctx());
  const changed = () => onChange?.();

  const messages = (list) => list.filter((p) => p.msg).map((p) => `<span class="${p.level === 'error' ? 'e' : 'w'}">${esc(p.msg)}</span>`).join('');
  const labelOf = (d) => ctx().questions.get(d.source)?.label ?? 'Unavailable question';
  const filled = (f) => f.rows.filter((r) => validAdj(r.adjustment)).length;
  const questions = () => accountQuestionList(getVersion(), getForms());

  // A factor on exactly one question is that question's factor; any other is a combination.
  const isSingle = (f) => f.dimensions.length === 1;
  const singleOf = (ref) => config().factors.find((f) => isSingle(f) && f.dimensions[0].source === ref);
  // Single-question factors whose question is no longer ticked still need to be seen (and fixed or removed).
  const orphans = () => config().factors.filter((f) => isSingle(f) && !questions().some((q) => q.ref === f.dimensions[0].source));
  const combos = () => config().factors.filter((f) => !isSingle(f));
  const current = () => {
    const k = ui.selected ?? '';
    if (k.startsWith('q:')) return singleOf(k.slice(2));
    if (k.startsWith('f:')) return config().factors.find((f) => f.id === k.slice(2));
    return undefined;
  };
  const keyOf = (f) => (isSingle(f) && questions().some((q) => q.ref === f.dimensions[0].source) ? `q:${f.dimensions[0].source}` : `f:${f.id}`);

  // ---- the editor's tabs ----
  const TABS = [['values', 'Values'], ['name', 'Name and behaviour']];
  // Does a tab hold an error? (The name on its tab, everything else on Values.)
  const tabErr = (f, k) => {
    const p = problems();
    const mine = [...p.byKey].filter(([key]) => key.startsWith(`${f.id}:`)).filter(([, list]) => list.some((x) => x.level === 'error' || x.level === 'mark'));
    return k === 'name' ? mine.some(([key]) => key === `${f.id}:name`) : mine.some(([key]) => key !== `${f.id}:name`);
  };
  const tabButtons = (f) => TABS.map(([k, l], i) => `<button type="button" role="tab" class="fc-tab" data-a-tab="${k}" aria-selected="${ui.tab === k}">${i + 1} · ${l}${tabErr(f, k) ? '<span class="fc-dot" title="Needs attention"></span>' : ''}</button>`).join('');
  const select = (key) => {
    ui.selected = key;
    ui.note = '';
    const f = current();
    if (f && !tabErr(f, ui.tab)) ui.tab = TABS.map((t) => t[0]).find((k) => tabErr(f, k)) ?? ui.tab;
  };

  // ---- top: the mode switch ----
  const renderTop = () => {
    const n = combos().length;
    $('#af-mode').innerHTML = [['single', 'Single question'], ['combos', `Combinations${n ? ` (${n})` : ''}`]]
      .map(([k, l]) => `<button type="button" data-a-mode="${k}" aria-pressed="${ui.mode === k}">${l}</button>`).join('');
    const single = ui.mode === 'single';
    $('#af-ltitle').textContent = single ? 'Questions' : 'Combination factors';
    const qs = questions().filter((q) => q.usable);
    $('#af-count').textContent = single ? `${qs.filter((q) => singleOf(q.ref)).length} of ${plural(qs.length, 'question')} ${qs.filter((q) => singleOf(q.ref)).length === 1 ? 'has' : 'have'} a factor` : `${plural(n, 'factor')}`;
    $('#af-addq').hidden = !single;
    $('#af-newcombo').hidden = single;
    $('#af-newcombo').disabled = readOnly();
  };

  // ---- left list ----
  const factorPill = (f) => {
    if (!f) return '<span class="el-pill t-warn">No factor</span>';
    const bad = problems().byOwner.has(f.id);
    const b = factorBehavior(f);
    return `<span class="el-pill t-${bad ? 'senior' : 'ok'}" title="${bad ? 'Needs attention' : 'Ready'}">${b === 'mixed' ? 'Mixed' : sign(b)} ${filled(f)}/${f.rows.length}</span>`;
  };
  const renderMultiBar = () => {
    const bar = $('#af-multibar');
    if (!bar) return;
    const n = ui.multi.size;
    bar.innerHTML = `<span class="muted">${n >= 2 ? `${plural(n, 'question')} ticked` : n ? 'Tick one more question.' : 'Tick two or more questions (choice, number or currency).'}</span>
      <button type="button" class="action primary" id="af-create"${n >= 2 && !readOnly() ? '' : ' disabled'}>Create combination</button><button type="button" class="action" id="af-cancelbuild">Cancel</button>`;
  };
  const renderList = () => {
    const term = ui.query.trim().toLowerCase();
    const list = $('#af-list');
    if (ui.mode === 'combos') {
      if (ui.building) {
        const pickable = questions().filter((q) => q.usable && (!term || q.label.toLowerCase().includes(term)));
        list.innerHTML = '<div class="el-grp"><strong>New combination</strong><small>One value per combination of answers</small></div>'
          + (pickable.length
            ? pickable.map((q) => `<label class="fc-qrow fc-pick"><input type="checkbox" data-a-multi="${esc(q.ref)}"${ui.multi.has(q.ref) ? ' checked' : ''}><span class="el-qmain"><span class="el-qlabel">${esc(q.label)}</span><span class="el-qtype">${esc(q.group)}</span></span></label>`).join('')
            : '<div class="el-empty">No questions can be combined yet.<br>Use “Add question” on the Single question view first.</div>')
          + '<div class="fc-multibar" id="af-multibar"></div>';
        return renderMultiBar();
      }
      const items = combos().filter((f) => !term || String(f.name).toLowerCase().includes(term));
      list.innerHTML = items.length
        ? items.map((f) => `<button type="button" class="el-q" data-a-f="${esc(f.id)}" aria-current="${ui.selected === `f:${f.id}`}">
            <span class="el-qmain"><span class="el-qlabel">${esc(f.name) || 'Untitled factor'}</span><span class="el-qtype">${plural(f.dimensions.length, 'question')} · ${filled(f)} of ${plural(f.rows.length, 'combination')} set</span></span>
            <span class="el-pills">${factorPill(f)}</span></button>`).join('')
        : `<div class="el-empty">${combos().length ? 'No factors match.' : 'No combination factors yet.<br>Use “New combination” when a value depends on several answers at once.'}</div>`;
      return;
    }
    const qs = questions().filter((q) => !term || q.label.toLowerCase().includes(term));
    const byGroup = new Map();
    qs.forEach((q) => byGroup.set(q.group, [...(byGroup.get(q.group) ?? []), q]));
    let html = [...byGroup].map(([g, items]) => `<div class="el-grp"><strong>${esc(g)}</strong></div>${items.map((q) => {
      const label = `<span class="el-qmain"><span class="el-qlabel">${esc(q.label)}</span><span class="el-qtype">${q.usable ? '' : 'Not supported'}</span></span>`;
      return q.usable
        ? `<button type="button" class="el-q" data-a-q="${esc(q.ref)}" aria-current="${ui.selected === `q:${q.ref}`}">${label}<span class="el-pills">${factorPill(singleOf(q.ref))}</span></button>`
        : `<div class="el-q fc-off" title="Only choice, Yes / No, number and currency questions can be used in an account-level factor.">${label}</div>`;
    }).join('')}`).join('');
    const lost = orphans().filter((f) => !term || String(f.name).toLowerCase().includes(term));
    if (lost.length) {
      html += '<div class="el-grp"><strong>No longer available</strong><small>The question is no longer marked as an account-level factor</small></div>'
        + lost.map((f) => `<button type="button" class="el-q" data-a-f="${esc(f.id)}" aria-current="${ui.selected === `f:${f.id}`}"><span class="el-qmain"><span class="el-qlabel">${esc(f.name) || 'Untitled factor'}</span></span><span class="el-pills">${factorPill(f)}</span></button>`).join('');
    }
    list.innerHTML = html || '<div class="el-empty">No questions are marked as an account-level factor yet.<br>Use “Add question”, or tick “Account-level factor” on a question of a form.</div>';
  };

  // ---- editor ----
  const rowHtml = (f, r, b) => {
    const c = ctx();
    const cells = f.dimensions.map((d) => {
      const o = fieldOptions(d, f, r.keys ?? {}, c);
      const v = r.keys?.[d.id] ?? '';
      const stale = v && !o.options.some((x) => x.value === v) ? `<option value="${esc(v)}" selected>${esc(v)} (not valid)</option>` : '';
      return `<td><select class="el-f" data-a-ckey="1" data-a-row="${esc(r.id)}" data-a-dim="${esc(d.id)}" data-a-key="${f.id}:row:${r.id}:${d.id}" aria-label="${esc(labelOf(d))}"${o.options.length || stale ? '' : ' disabled'}>
        <option value="">${esc(o.waiting || (o.empty && !o.options.length ? 'No valid answers' : 'Choose…'))}</option>${stale}${o.options.map((x) => `<option value="${esc(x.value)}"${x.value === v ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select></td>`;
    }).join('');
    return `<tr>${cells}
      <td class="num"><span class="af-sign" aria-hidden="true">${b === 'mixed' ? '±' : sign(b)}</span><input class="el-f num af-val" type="number" min="0" step="0.01" data-a-cadj="1" data-a-row="${esc(r.id)}" data-a-key="${f.id}:row:${r.id}:adj" value="${esc(r.adjustment)}" placeholder="1.00" aria-label="Factor value"></td>
      <td class="rt-act"><button type="button" class="el-del" data-a-act="delrow" data-a-row="${esc(r.id)}" aria-label="Remove this row">✕</button></td></tr>
      <tr class="rt-msgrow"><td colspan="${f.dimensions.length + 2}" class="rt-msg" data-a-msg="${f.id}:row:${r.id}" hidden></td></tr>`;
  };

  // The ranges of a number or currency question; each row of the table then picks one of them.
  const rangesBlock = (f, d) => {
    const q = ctx().questions.get(d.source);
    const cur = q?.type === 'currency' ? '$' : '';
    const rows = d.bands.map((b, i) => {
      const input = (field, label, extra = '') => `<td><div class="rt-cell">${cur}<input class="el-f num" type="number" min="0" step="any" data-a-band="${field}" data-a-dim="${esc(d.id)}" data-a-b="${esc(b.id)}" data-a-key="${f.id}:band:${b.id}" value="${esc(b[field])}"${extra} aria-label="${label}, range ${i + 1} of ${esc(labelOf(d))}"></div></td>`;
      return `<tr>${input('min', 'From')}${input('max', 'To', ' placeholder="and above"')}
        <td class="rt-act"><button type="button" class="el-del" data-a-act="delband" data-a-dim="${esc(d.id)}" data-a-b="${esc(b.id)}">Remove</button></td></tr>
        <tr class="rt-msgrow"><td colspan="3" class="rt-msg" data-a-msg="${f.id}:band:${b.id}" hidden></td></tr>`;
    }).join('');
    return `<div class="fc-field"><label>Ranges for ${esc(labelOf(d))}</label>
      <div class="rt-wrap"><table class="rt-table fc-table"><thead><tr><th>From <small>included</small></th><th>To <small>not included</small></th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3"><div class="el-none">No ranges yet.</div></td></tr>'}</tbody></table></div>
      <div class="rt-foot"><button type="button" class="action el-add" data-a-act="addband" data-a-dim="${esc(d.id)}">+ Add a range</button></div></div>`;
  };

  const preview = (f) => {
    const b = factorBehavior(f);
    const how = b === 'mixed' ? 'added or subtracted, as set on each row' : b === 'minus' ? 'subtracted' : 'added';
    return f.rows.length
      ? `${filled(f)} of ${plural(f.rows.length, 'row')} ha${filled(f) === 1 ? 's' : 've'} a value. When a quote’s answers match a row, its value is ${how}.`
      : 'Use “Configure All Combinations” to list every valid answer combination, then enter a value for each.';
  };
  const sumHtml = (f) => {
    const n = problems().byOwner.get(f.id) ?? 0;
    return n ? `<span class="e">${plural(n, 'error')}</span>` : '<span class="ok">Everything is valid</span>';
  };

  const body = (f) => {
    if (ui.tab === 'name') {
      const b = factorBehavior(f);
      return `<div class="fc-field"><label for="af-name">Factor name *</label>
          <input id="af-name" class="el-f" type="text" maxlength="60" data-a-fin="name" data-a-key="${f.id}:name" value="${esc(f.name)}" placeholder="e.g. Vehicle type and radius">
          <div class="rt-msg" data-a-msg="${f.id}:name" hidden></div></div>
        <div class="fc-field"><label for="af-beh">Behaviour of this factor</label>
          <select id="af-beh" class="el-f" data-a-beh>${b === 'mixed' ? '<option value="mixed" selected disabled>Mixed (older setting)</option>' : ''}<option value="plus"${b === 'plus' ? ' selected' : ''}>Plus (+) — its values raise the account factor</option><option value="minus"${b === 'minus' ? ' selected' : ''}>Minus (−) — its values lower the account factor</option></select></div>
        <p class="rt-note" style="margin:0">Every value of this factor is ${b === 'minus' ? 'subtracted from' : 'added to'} the total of the other factors when its answers match. Each factor has its own behaviour.</p>`;
    }
    const b = factorBehavior(f);
    const multi = f.dimensions.length > 1;
    const ranged = f.dimensions.some(isRangeDim);
    const head = f.dimensions.map((d) => `<th>${esc(labelOf(d))}${multi ? ` <button type="button" class="el-del" data-a-act="delcol" data-a-dim="${esc(d.id)}" title="Remove this question from the factor" aria-label="Remove ${esc(labelOf(d))}">✕</button>` : ''}</th>`).join('');
    return `<p class="rt-note" style="margin:0" data-a-preview>${preview(f)}${ui.note ? ` <strong>${esc(ui.note)}</strong>` : ''}</p>
      ${f.dimensions.filter(isRangeDim).map((d) => rangesBlock(f, d)).join('')}
      <div class="rt-foot" style="margin:0">${f.dimensions.length ? `<button type="button" class="action primary el-add" data-a-act="genall" title="Add a row for every valid combination, with the value left empty">${multi ? 'Configure All Combinations' : ranged ? 'Add a row for every range' : 'Add every answer'}</button>${multi || ranged ? ' <button type="button" class="action el-add" data-a-act="addrow">+ Add a row</button>' : ''}` : ''}
        ${f.rows.length ? `<span style="margin-left:auto;display:flex;gap:6px;align-items:center"><input class="el-f num" style="width:90px" type="number" min="0" step="0.01" data-a-bulk value="${esc(ui.bulk)}" placeholder="1.00" aria-label="Value for empty rows"><button type="button" class="action" data-a-act="fill" title="Put this value on every row that has none yet">Fill empty</button></span>` : ''}</div>
      <div class="rt-wrap" style="max-height:420px;overflow:auto"><table class="rt-table fc-table"><thead><tr>${head}<th class="num">Value ${b === 'mixed' ? '' : `<small>${b === 'minus' ? 'subtracted' : 'added'}</small>`}</th><th></th></tr></thead>
        <tbody>${f.rows.map((r) => rowHtml(f, r, b)).join('') || `<tr><td colspan="${f.dimensions.length + 2}"><div class="el-none">No rows yet.</div></td></tr>`}</tbody></table></div>
      <div class="rt-msg" data-a-msg="${f.id}:general" hidden></div>`;
  };

  const renderEditor = () => {
    const f = current();
    const ed = $('#af-editor');
    if (!f) {
      const ref = String(ui.selected ?? '').startsWith('q:') ? ui.selected.slice(2) : '';
      const q = ref && questions().find((x) => x.ref === ref);
      ed.innerHTML = q
        ? `<div class="el-edh"><h2>${esc(q.label)}</h2><div class="el-meta"><span>${esc(q.group)}</span></div></div>
           <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}><div class="el-none">No account-level factor on this question yet.<br>A factor gives each answer a value that is added to (Plus) or subtracted from (Minus) the account factor.</div>
           <button type="button" class="action primary el-add" data-a-act="create" data-a-ref="${esc(ref)}">+ Define a factor</button></fieldset>`
        : `<div class="el-none" style="margin:16px">${ui.mode === 'combos' ? 'Select a combination, or create one with “New combination”. For example: Vehicle type + Radius, Plus 2.00 for Trucker with 200+ miles.' : 'Select a question on the left to set its account-level factor.'}</div>`;
      return;
    }
    const at = TABS.findIndex((t) => t[0] === ui.tab);
    const nav = `${at > 0 ? `<button type="button" class="action" data-a-tab="${TABS[at - 1][0]}">Back</button>` : ''}${at < TABS.length - 1 ? `<button type="button" class="action primary" data-a-tab="${TABS[at + 1][0]}">Next: ${TABS[at + 1][1]}</button>` : ''}`;
    const b = factorBehavior(f);
    ed.innerHTML = `
      <div class="el-edh"><div class="fc-eh"><h2>${esc(f.name) || 'New factor'}</h2><span class="el-pill t-${b === 'minus' ? 'warn' : 'ok'}">${esc(BEHAVIOR_LABEL[b])}</span></div>
        <div class="el-meta"><span>${esc(f.dimensions.map(labelOf).join(' + ')) || 'No questions'}</span></div></div>
      <div class="fc-tabs" role="tablist" id="af-tabs" aria-label="Factor settings">${tabButtons(f)}</div>
      <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}>${body(f)}</fieldset>
      <div class="fc-foot"><span class="rt-sum" id="af-sum">${sumHtml(f)}</span><button type="button" class="el-del" data-a-act="remove"${readOnly() ? ' disabled' : ''}>Remove this factor</button><span class="fc-nav">${nav}</span></div>`;
  };

  // ---- all factors together ----
  const whenText = (f, r) => f.dimensions.map((d) => {
    const v = r.keys?.[d.id];
    if (blank(v)) return `${labelOf(d)}: —`;
    const band = isRangeDim(d) ? d.bands.find((x) => x.id === v) : null;
    return `${labelOf(d)}: ${band ? bandLabel(band, ctx().questions.get(d.source)?.type === 'currency') : v}`;
  }).join(' · ');
  const renderAll = () => {
    const factors = config().factors;
    const b = (f) => factorBehavior(f);
    const rows = factors.flatMap((f) => [
      `<tr class="af-grp"><td colspan="3"><strong>${esc(f.name) || 'Untitled factor'}</strong> <span class="muted">${esc(f.dimensions.map(labelOf).join(' + '))}</span></td><td class="num"><span class="el-pill t-${b(f) === 'minus' ? 'warn' : 'ok'}">${esc(BEHAVIOR_LABEL[b(f)])}</span></td></tr>`,
      ...f.rows.map((r) => {
        const ok = validAdj(r.adjustment);
        const eff = ok ? `${sign(rowBehavior(f, r))}${Number(r.adjustment).toFixed(2)}` : '—';
        return `<tr><td></td><td colspan="2">${esc(whenText(f, r))}</td><td class="num"><b>${eff}</b></td></tr>`;
      }),
    ]);
    const cfg = config();
    $('#af-all').innerHTML = `<div class="el-edh"><h2>All account-level factors</h2>
        <div class="el-meta"><span>${factors.length ? `${plural(factors.length, 'factor')} · ${plural(factors.reduce((n, f) => n + filled(f), 0), 'value')} set. When a quote matches rows, they are added (Plus) or subtracted (Minus), then the total is kept between ${fmt(cfg.min)} and ${fmt(cfg.max)}.` : 'Every factor you set up appears here, together.'}</span></div></div>
      ${factors.length ? `<div class="rt-wrap" style="max-height:380px;overflow:auto;padding:0 20px 16px"><table class="rt-table fc-table"><thead><tr><th style="width:24px"></th><th colspan="2">When the answers are</th><th class="num">Effect on the factor</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : ''}`;
  };

  // ---- overall minimum and maximum, with a preview of how the factor is reached ----
  const limitField = (field, label) => `<div class="fc-field"><label for="af-${field}">${label} *</label>
      <input id="af-${field}" class="el-f num" type="number" min="0" step="0.01" data-a-in="${field}" data-a-key="limits:${field}" value="${esc(config()[field])}" placeholder="e.g. ${field === 'min' ? '0.80' : '2.20'}">
      <div class="rt-msg" data-a-msg="limits:${field}" hidden></div></div>`;
  const renderLimits = () => {
    $('#af-limits').innerHTML = `<div class="el-edh"><h2>Overall factor limits</h2>
        <div class="el-meta"><span>The applicable values are added (Plus) or subtracted (Minus). The total is then kept between these limits, and that final number is the one factor the premium formula receives.</span></div></div>
      <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}><div class="fc-fields">${limitField('min', 'Minimum factor')}${limitField('max', 'Maximum factor')}</div></fieldset>`;
  };

  const testQuestions = () => {
    const c = ctx().questions;
    const out = new Map();
    config().factors.forEach((f) => f.dimensions.forEach((d) => c.has(d.source) && out.set(d.source, c.get(d.source))));
    return [...out].map(([ref, q]) => ({ ref, label: q.label, options: q.options, range: q.kind === 'range' }));
  };
  const testResult = () => {
    const cfg = config();
    if (!cfg.factors.length) return '<div class="el-result">Add a factor to preview the result.</div>';
    const r = computeAccountFactor(cfg, ui.answers);
    const line = (a) => `<tr><td>${esc(a.factor.name || 'Untitled factor')}</td><td class="num"><b>${sign(a.amount < 0 ? 'minus' : 'plus')}${Math.abs(a.amount).toFixed(2)}</b></td></tr>`;
    return `<table class="rt-table"><thead><tr><th>Individual factors</th><th class="num">Amount</th></tr></thead><tbody>
        ${r.applied.map(line).join('') || `<tr><td colspan="2" class="muted">No factor applies to these answers, so the factor is ${BASE_FACTOR.toFixed(2)}.</td></tr>`}
        <tr><td><b>Calculated total</b></td><td class="num"><b>${r.raw.toFixed(2)}</b></td></tr>
        <tr><td class="muted">Minimum · Maximum</td><td class="num">${fmt(cfg.min)} · ${fmt(cfg.max)}</td></tr></tbody></table>
      <div class="el-result t-ok">${ACCOUNT_LABEL} = ${r.value.toFixed(2)}<small>${r.limited ? `Limited to the ${r.limited === 'min' ? 'minimum' : 'maximum'}: ${r.raw.toFixed(2)} calculated.` : 'Within the limits: used as calculated.'} This is the one value the formula receives.</small></div>`;
  };
  const renderTest = () => {
    const qs = testQuestions();
    $('#af-test').innerHTML = `<div class="el-edh"><h2>Final factor preview</h2><div class="el-meta"><span>Pick sample answers to see how the factors combine.</span></div></div>
      <div class="el-test" style="border-top:0">
      ${qs.length ? qs.map((q) => `<div class="el-row"><span class="el-kw" style="min-width:0">${esc(q.label)}</span>${q.range ? `<input class="el-f num" type="number" min="0" step="any" data-a-tnum="${esc(q.ref)}" value="${esc(ui.answers[q.ref] ?? '')}" placeholder="Enter a number" aria-label="Sample answer for ${esc(q.label)}">` : ''}${q.options.map((v) => `<button type="button" class="el-chip" data-a-act="tans" data-a-ref="${esc(q.ref)}" data-a-v="${esc(v)}" aria-pressed="${ui.answers[q.ref] === v}">${esc(v)}</button>`).join('')}</div>`).join('') : '<div class="muted">Create a factor to try sample answers.</div>'}
      <div id="af-result">${testResult()}</div></div>`;
  };

  // ---- refresh ----
  // Messages and outlines are rewritten in place, so typing keeps its focus.
  const paint = () => {
    const p = problems();
    root.querySelectorAll('[data-a-msg]').forEach((n) => {
      const text = messages(p.byKey.get(n.dataset.aMsg) ?? []);
      n.innerHTML = text;
      n.hidden = !text;
    });
    root.querySelectorAll('[data-a-key]').forEach((n) => {
      const list = p.byKey.get(n.dataset.aKey) ?? [];
      const bad = list.some((x) => x.level === 'error' || x.level === 'mark');
      n.classList.toggle('bad', bad);
      n.classList.toggle('warnc', !bad && list.length > 0);
    });
  };
  const refreshLight = () => {
    renderTop();
    renderList();
    renderAll();
    paint();
    const f = current();
    if (f) {
      if ($('[data-a-preview]')) $('[data-a-preview]').innerHTML = `${preview(f)}${ui.note ? ` <strong>${esc(ui.note)}</strong>` : ''}`;
      if ($('#af-tabs')) $('#af-tabs').innerHTML = tabButtons(f);
      if ($('#af-sum')) $('#af-sum').innerHTML = sumHtml(f);
    }
    const res = $('#af-result');
    if (res) res.innerHTML = testResult();
  };
  const refreshAll = () => {
    renderTop();
    renderList();
    renderEditor();
    renderAll();
    renderTest();
    paint();
  };
  const firstOfMode = () => {
    if (ui.mode === 'combos') return combos()[0] ? `f:${combos()[0].id}` : null;
    const bad = config().factors.find((f) => problems().byOwner.has(f.id) && isSingle(f));
    const f = bad ?? config().factors.find(isSingle);
    return f ? keyOf(f) : (questions().find((q) => q.usable) ? `q:${questions().find((q) => q.usable).ref}` : null);
  };

  root.innerHTML = `
    <div class="fc-covbar">
      <div class="fc-covtabs"><h3 class="el-title" style="margin:0 0 10px">Account-level factors <small class="muted" style="font-weight:400">· apply to the whole account, not to one coverage</small></h3></div>
      <div class="el-seg fc-mode" id="af-mode"></div>
    </div>
    <div class="el-grid">
      <section class="el-panel" aria-label="Questions and factors">
        <div class="el-panelh">
          <div class="fc-lh"><div><h3 class="el-title" id="af-ltitle">Questions</h3><small class="muted" id="af-count"></small></div>
            <button type="button" class="action" id="af-addq"${readOnly() ? ' disabled' : ''}>+ Add question</button>
            <button type="button" class="action" id="af-newcombo" hidden>+ New combination</button></div>
          <input class="el-search" id="af-search" type="search" placeholder="Search" aria-label="Search">
        </div>
        <div class="el-list" id="af-list"></div>
      </section>
      <section class="el-panel" id="af-editor" aria-live="polite"></section>
    </div>
    <section class="el-panel" id="af-all" style="margin-bottom:20px"></section>
    <div class="el-grid" style="grid-template-columns:minmax(260px,1fr) minmax(320px,2fr)">
      <section class="el-panel" id="af-limits"></section>
      <section class="el-panel" id="af-test"></section>
    </div>`;
  renderLimits();
  select(firstOfMode());
  refreshAll();

  // ---- events ----
  root.addEventListener('click', (e) => {
    const t = e.target;
    const md = t.closest('[data-a-mode]');
    if (md) {
      if (ui.mode === md.dataset.aMode) return;
      ui.mode = md.dataset.aMode;
      ui.building = false;
      ui.multi.clear();
      select(firstOfMode());
      return refreshAll();
    }
    const el = t.closest('[data-a-q],[data-a-f],[data-a-act],[data-a-tab],#af-addq,#af-newcombo,#af-create,#af-cancelbuild');
    if (!el) return;
    const d = el.dataset;
    if (d.aQ || d.aF) {
      select(d.aQ ? `q:${d.aQ}` : `f:${d.aF}`);
      renderList();
      return renderEditor(), paint();
    }
    if (d.aTab) {
      ui.tab = d.aTab;
      return renderEditor(), paint();
    }
    // Sample answers only read, so they work on a published version too.
    if (d.aAct === 'tans') {
      ui.answers[d.aRef] = ui.answers[d.aRef] === d.aV ? '' : d.aV;
      return renderTest();
    }
    if (readOnly()) return;
    if (el.id === 'af-newcombo') {
      ui.building = true;
      ui.multi.clear();
      return renderList();
    }
    if (el.id === 'af-cancelbuild') {
      ui.building = false;
      ui.multi.clear();
      return renderList();
    }
    if (el.id === 'af-create') {
      const picked = [...ctx().questions.values()].filter((q) => ui.multi.has(q.key));
      if (picked.length < 2) return;
      const made = blankFactor(picked.map((q) => newQuestionDim(q.key, q.kind)));
      made.name = picked.map((q) => q.label).join(' + ').slice(0, 60);
      config().factors.push(made);
      ui.multi.clear();
      ui.building = false;
      select(`f:${made.id}`);
      ui.tab = 'values';
      changed();
      return refreshAll();
    }
    if (el.id === 'af-addq') {
      return openAddQuestion({
        use: 'account',
        groups: collectGroups(getVersion(), getForms()),
        getVersion,
        onAdded: (keys) => {
          const ref = refOfKey(keys[0]);
          if (ctx().questions.has(ref)) select(`q:${ref}`);
          changed();
          refreshAll();
        },
      });
    }
    if (d.aAct === 'create') {
      const q = ctx().questions.get(d.aRef);
      if (!q) return;
      const made = blankFactor([newQuestionDim(q.key, q.kind)]);
      made.name = q.label.slice(0, 60);
      config().factors.push(made);
      // A choice question has its answers up front; a number question first needs its ranges.
      if (q.kind === 'choice') allCombinations(made, ctx()).list.forEach((keys) => made.rows.push(blankRow(made, keys)));
      select(`q:${d.aRef}`);
      ui.tab = 'values';
      changed();
      return refreshAll();
    }
    const f = current();
    if (!f) return;
    if (d.aAct === 'remove') {
      if (!confirm(`Remove ${f.name ? `“${f.name}”` : 'this factor'}?`)) return;
      config().factors = config().factors.filter((x) => x.id !== f.id);
      select(isSingle(f) && questions().some((q) => q.ref === f.dimensions[0].source) ? `q:${f.dimensions[0].source}` : firstOfMode());
    } else if (d.aAct === 'genall') {
      const { list: all, truncated } = allCombinations(f, ctx());
      if (truncated && !confirm('These questions make more than 2,000 combinations. Add the first 2,000?')) return;
      const have = new Set(f.rows.map((r) => tupleKey(f, r.keys)));
      const fresh = all.filter((keys) => !have.has(tupleKey(f, keys)));
      fresh.forEach((keys) => f.rows.push(blankRow(f, keys)));
      ui.note = fresh.length
        ? `Added ${plural(fresh.length, 'row')}${all.length - fresh.length ? ` (${all.length - fresh.length} already in the table)` : ''}. Enter a value for each.`
        : all.length ? 'Every valid row is already in the table.' : 'Nothing to add: a question has no answers for the selection. Check the dependencies in the form builder.';
    } else if (d.aAct === 'addband') {
      const dim = f.dimensions.find((x) => x.id === d.aDim);
      const last = sortedBands(dim).pop();
      dim.bands.push(blankBand(last && last.max !== '' ? last.max : ''));
    } else if (d.aAct === 'delband') {
      const dim = f.dimensions.find((x) => x.id === d.aDim);
      const using = f.rows.filter((r) => r.keys?.[dim.id] === d.aB);
      if (using.length && !confirm(`${plural(using.length, 'row')} use this range. Remove the range and those rows?`)) return;
      dim.bands = dim.bands.filter((b) => b.id !== d.aB);
      f.rows = f.rows.filter((r) => r.keys?.[dim.id] !== d.aB);
    } else if (d.aAct === 'addrow') f.rows.push(blankRow(f, Object.fromEntries(f.dimensions.map((x) => [x.id, '']))));
    else if (d.aAct === 'delrow') f.rows = f.rows.filter((r) => r.id !== d.aRow);
    else if (d.aAct === 'fill') {
      if (!validAdj(ui.bulk)) ui.note = 'Enter a value of 0 or more to fill the empty rows.';
      else f.rows.forEach((r) => blank(r.adjustment) && (r.adjustment = ui.bulk));
    } else if (d.aAct === 'delcol') {
      const dim = f.dimensions.find((x) => x.id === d.aDim);
      if (f.rows.length && !confirm('Remove this question? Its answers are removed from every row.')) return;
      f.dimensions = f.dimensions.filter((x) => x !== dim);
      f.rows.forEach((r) => {
        delete r.keys[dim.id];
        settleKeys(f, r.keys, ctx());
      });
    } else return;
    changed();
    refreshAll();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.aMulti !== undefined) {
      t.checked ? ui.multi.add(t.dataset.aMulti) : ui.multi.delete(t.dataset.aMulti);
      return renderMultiBar();
    }
    if (readOnly()) return;
    const f = current();
    if (t.dataset.aCkey !== undefined) {
      // A cell: answers further along that no longer fit are cleared, and the person is told.
      const row = f.rows.find((r) => r.id === t.dataset.aRow);
      row.keys[t.dataset.aDim] = t.value;
      const cleared = settleKeys(f, row.keys, ctx());
      ui.note = cleared.length ? `${[...new Set(cleared)].join(', ')} cleared: no longer valid for the new selection. Choose again.` : '';
    } else if (t.dataset.aBand !== undefined) {
      // Keep the ranges in From order. Redraw only when something shows them (the order moved, or a row's picker lists them) so Tab from From to To keeps its focus.
      const dim = f.dimensions.find((x) => x.id === t.dataset.aDim);
      const before = dim.bands.map((b) => b.id).join();
      dim.bands = sortedBands(dim);
      if (dim.bands.map((b) => b.id).join() === before && !f.rows.length) {
        changed();
        return refreshLight();
      }
    } else if (t.dataset.aBeh !== undefined) {
      // The behaviour belongs to the factor: every one of its values follows it.
      f.behavior = t.value;
      f.rows.forEach((r) => (r.behavior = t.value));
    } else return;
    changed();
    refreshAll();
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    const d = t.dataset;
    if (t.id === 'af-search') {
      ui.query = t.value;
      return renderList();
    }
    if (d.aBulk !== undefined) {
      ui.bulk = t.value;
      return;
    }
    // A sample number only reads, so it works on a published version too.
    if (d.aTnum !== undefined) {
      ui.answers[d.aTnum] = t.value;
      $('#af-result').innerHTML = testResult();
      return;
    }
    if (readOnly()) return;
    if (d.aBand !== undefined) current().dimensions.find((x) => x.id === d.aDim).bands.find((b) => b.id === d.aB)[d.aBand] = t.value;
    else if (d.aCadj !== undefined) current().rows.find((r) => r.id === d.aRow).adjustment = t.value;
    else if (d.aIn) config()[d.aIn] = t.value;
    else if (d.aFin) current()[d.aFin] = t.value;
    else return;
    changed();
    refreshLight();
  });
};
