// Combination factors (the Combinations view of the Rating factors step).
// One factor whose value depends on the combination of answers to several questions, for example Vehicle Type + Radius +
// Coverage. The user picks the questions (any choice question of the product, its coverages and their Acord forms), then fills
// a table with one row per valid combination. When a question depends on another one (set in the form builder), its dropdown
// only offers the answers valid for the answer chosen in the other. Data, validation and matching: combo-factor-calc.js.
import { esc, newId } from './product-model.js';
import { codeCounts, collectFactorGroups, RESERVED } from './factors.js';
import { openAddQuestion } from './question-add.js';
import { refOfKey } from './account-factor-calc.js';
import {
  comboOf,
  blankCombo,
  blankRow,
  comboContext,
  fieldOptions,
  settleKeys,
  comboProblems,
  allCombinations,
  tupleKey,
  isRangeDim,
  newQuestionDim,
  blankBand,
  sortedBands,
} from './combo-factor-calc.js';

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const effect = (v) => {
  const n = Number(v);
  if (v === '' || v == null || Number.isNaN(n)) return '';
  if (n === 1) return '<span class="fc-pill">no change</span>';
  return n > 1 ? `<span class="fc-pill up">+${Math.round((n - 1) * 100)}%</span>` : `<span class="fc-pill down">−${Math.round((1 - n) * 100)}%</span>`;
};

const suggestCode = (name, taken) => {
  let base = String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) || 'COMBO';
  if (/^\d/.test(base)) base = `F_${base}`;
  let code = base;
  let n = 2;
  while (taken.has(code.toLowerCase()) || RESERVED.includes(code.toLowerCase())) code = `${base}_${n++}`;
  return code;
};

// `only` (a factor id) mounts just that factor's editor, to sit inside the Rating factors step; `onRemoved` then runs
// after the factor is removed.
export const mountComboFactors = (host, { getVersion, getForms, readOnly, onChange, only, onRemoved }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { selected: null, query: '', qsearch: '', note: '' };
  const $ = (sel) => root.querySelector(sel);
  const list = () => comboOf(getVersion());
  const current = () => list().find((f) => f.id === ui.selected);
  const ctxOf = (f) => comboContext(getVersion(), getForms(), f);
  const counts = () => codeCounts(collectFactorGroups(getVersion(), getForms()), getVersion());
  const problemsFor = (f) => comboProblems(f, ctxOf(f), counts(), getVersion());
  const changed = () => onChange?.();
  const dimLabel = (d, ctx) => (d.type === 'coverage' ? 'Coverage' : ctx.questions.get(d.source)?.label ?? 'Unavailable question');
  const messages = (probs) => (probs ?? []).map((p) => `<span class="${p.level === 'error' ? 'e' : 'w'}">${esc(p.msg)}</span>`).join('');
  const cell = (probs, field) => {
    const p = (probs ?? []).filter((x) => x.field === field);
    return p.some((x) => x.level === 'error') ? ' bad' : p.length ? ' warnc' : '';
  };

  // ---- strip and list ----
  const renderStrip = () => {
    if (!$('#cf-strip')) return;
    const bad = list().filter((f) => problemsFor(f).errors).length;
    const rows = list().reduce((n, f) => n + f.rows.length, 0);
    const stat = (v, l, cls = '') => `<div class="el-stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
    $('#cf-strip').innerHTML = stat(list().length, 'combination factors') + stat(rows, 'combinations') + stat(bad, 'need attention', bad ? 'warn' : '');
  };

  const renderList = () => {
    if (!$('#cf-list')) return;
    const term = ui.query.trim().toLowerCase();
    const items = list().filter((f) => !term || `${f.name} ${f.code}`.toLowerCase().includes(term));
    $('#cf-list').innerHTML = items.length
      ? items.map((f) => {
          const p = problemsFor(f);
          return `<button type="button" class="el-q" data-k-f="${esc(f.id)}" aria-current="${f.id === ui.selected}">
            <span class="el-qmain"><span class="el-qlabel">${esc(f.name) || 'Untitled factor'}</span><span class="el-qtype">${plural(f.dimensions.length, 'question')} · ${plural(f.rows.length, 'combination')}</span></span>
            <span class="el-pills"><span class="el-pill t-${p.errors ? 'senior' : 'ok'}" title="${p.errors ? `${plural(p.errors, 'error')} to fix` : 'Ready'}">${esc(f.code || 'Incomplete')}</span></span></button>`;
        }).join('')
      : `<div class="el-empty">${list().length ? 'No factors match.' : 'No combination factors yet.<br>Use “Add factor” to create one.'}</div>`;
  };

  // ---- editor ----
  const rowHtml = (f, r, ctx, probs, reads) => {
    const get = (id) => probs.byId.get(id) ?? [];
    const rowProbs = get(r.id);
    const cells = f.dimensions.map((d) => {
      const o = fieldOptions(d, f, r.keys, ctx);
      const v = r.keys[d.id] ?? '';
      const placeholder = o.waiting || (o.empty && !o.options.length ? 'No valid answers' : 'Choose…');
      const stale = v && !o.options.some((x) => x.value === v) ? `<option value="${esc(v)}" selected>${esc(v)} (not valid)</option>` : '';
      return `<td><select class="el-f${cell(rowProbs, d.id)}" data-k-key="${esc(d.id)}" data-k-row="${esc(r.id)}" aria-label="${esc(dimLabel(d, ctx))}"${o.options.length || stale ? '' : ' disabled'}>
        <option value="">${esc(placeholder)}</option>${stale}${o.options.map((x) => `<option value="${esc(x.value)}"${x.value === v ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select></td>`;
    }).join('');
    return `<tr data-k-r="${esc(r.id)}">${cells}
      <td class="num"><input class="el-f num${cell(rowProbs, 'value')}" type="number" min="0" step="0.01" data-k-val data-k-row="${esc(r.id)}" value="${esc(r.value)}" aria-label="Value"><div data-k-fx="${esc(r.id)}">${effect(r.value)}</div></td>
      <td class="muted">${esc(reads)}</td>
      <td class="rt-act"><button type="button" class="el-del" data-k-act="delrow" data-k-row="${esc(r.id)}">Remove</button></td></tr>
      <tr class="rt-msgrow"><td colspan="${f.dimensions.length + 3}" class="rt-msg" data-k-msg="${esc(r.id)}"${rowProbs.length ? '' : ' hidden'}>${messages(rowProbs)}</td></tr>`;
  };

  // The ranges of a number or currency column; each row of the table then picks one of them.
  const rangesBlock = (f, d, ctx, p) => {
    const q = ctx.questions.get(d.source);
    const cur = q?.type === 'currency' ? '$' : '';
    const rows = d.bands.map((b, i) => {
      const bp = p.byId.get(b.id) ?? [];
      const input = (field, label, extra = '') => `<td><div class="rt-cell">${cur}<input class="el-f num${cell(bp, field)}" type="number" min="0" step="any" data-k-band="${field}" data-k-dim="${esc(d.id)}" data-k-b="${esc(b.id)}" value="${esc(b[field])}"${extra} aria-label="${label}, range ${i + 1} of ${esc(dimLabel(d, ctx))}"></div></td>`;
      return `<tr>${input('min', 'From')}${input('max', 'To', ' placeholder="and above"')}
        <td class="rt-act"><button type="button" class="el-del" data-k-act="delband" data-k-dim="${esc(d.id)}" data-k-b="${esc(b.id)}">Remove</button></td></tr>
        <tr class="rt-msgrow"><td colspan="3" class="rt-msg" data-k-msg="${esc(b.id)}"${bp.length ? '' : ' hidden'}>${messages(bp)}</td></tr>`;
    }).join('');
    return `<div class="fc-field"><label>Ranges for ${esc(dimLabel(d, ctx))}</label>
      <div class="rt-wrap"><table class="rt-table fc-table"><thead><tr><th>From <small>included</small></th><th>To <small>not included</small></th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3"><div class="el-none">No ranges yet.</div></td></tr>'}</tbody></table></div>
      <div class="rt-foot"><button type="button" class="action el-add" data-k-act="addband" data-k-dim="${esc(d.id)}">+ Add a range</button></div></div>`;
  };

  const renderEditor = () => {
    const f = current();
    if (!f) {
      $('#cf-editor').innerHTML = '<div class="el-none" style="margin:16px">Add a combination factor when the value depends on several answers at once, for example vehicle type together with radius and coverage.</div>';
      return;
    }
    const ctx = ctxOf(f);
    const p = problemsFor(f);
    const get = (id) => p.byId.get(id) ?? [];
    const field = (label, key, extra = '') => `<div class="fc-field"><label for="cf-${key}">${label}</label>
        <input id="cf-${key}" class="el-f${cell(get(key), key)}${key === 'fallback' ? ' num' : ''}" ${extra} data-k-in="${key}" value="${esc(f[key])}">
        <div class="rt-msg" data-k-msg="${key}"${get(key).length ? '' : ' hidden'}>${messages(get(key))}</div></div>`;
    const head = f.dimensions.map((d) => `<th>${esc(dimLabel(d, ctx))} <button type="button" class="el-del" data-k-act="delcol" data-k-dim="${esc(d.id)}" title="Remove this column" aria-label="Remove ${esc(dimLabel(d, ctx))} column">✕</button></th>`).join('');
    const reads = f.dimensions.map((d) => dimLabel(d, ctx)).join(' + ');
    $('#cf-editor').innerHTML = `
      <div class="el-edh"><h2>${esc(f.name) || 'New combination factor'}</h2>
        <div class="el-meta"><span class="el-tag">Combination</span><span>${plural(f.dimensions.length, 'question')} · ${plural(f.rows.length, 'combination')}</span></div></div>
      <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}>
        <div class="fc-fields">
          ${field('Name', 'name', 'type="text" maxlength="60"')}
          ${field('Code, used in formulas', 'code', 'type="text" maxlength="30" spellcheck="false" style="font-family:var(--mono,monospace)"')}
        </div>
        <div class="fc-fields">
          ${field('Fallback value', 'fallback', 'type="number" min="0" step="0.01"')}
        </div>
        <p class="rt-note" style="margin-top:-6px">The fallback is used when no combination matches. 1.00 means no change.${ui.note ? ` <strong>${esc(ui.note)}</strong>` : ''}</p>
        ${f.dimensions.filter((d) => d.type === 'question' && isRangeDim(d)).map((d) => rangesBlock(f, d, ctx, p)).join('')}
        <div class="rt-wrap"><table class="rt-table fc-table"><thead><tr>${head}<th class="num">Value</th><th class="num">Reads as</th><th></th></tr></thead>
          <tbody>${f.rows.map((r) => rowHtml(f, r, ctx, p, reads)).join('') || `<tr><td colspan="${f.dimensions.length + 3}"><div class="el-none">${f.dimensions.length ? 'No combinations yet.' : 'No columns yet.'}</div></td></tr>`}</tbody></table></div>
          <div class="rt-foot">${f.dimensions.length ? '<button type="button" class="action primary el-add" data-k-act="genall" title="Add a row for every valid combination of the columns, with the value left empty">Configure All Combinations</button> <button type="button" class="action el-add" data-k-act="addrow">+ Add a combination</button>' : ''}</div>
        <div class="rt-msg" data-k-msg="general"${get('general').length ? '' : ' hidden'}>${messages(get('general'))}</div>
        <div class="rt-foot"><span class="rt-sum" id="cf-sum">${summary(p)}</span><button type="button" class="el-del" data-k-act="remove" style="margin-left:auto">Remove this factor</button></div>
        <div class="rt-note">A combination that is not listed uses the fallback value. Coverage formulas use the code ${esc(f.code || '…')} on the next step.</div>
      </fieldset>`;
  };
  const summary = (p) => (p.errors || p.warns
    ? `${p.errors ? `<span class="e">${plural(p.errors, 'error')}</span>` : ''}${p.warns ? `<span class="w">${plural(p.warns, 'warning')}</span>` : ''}`
    : '<span class="ok">Everything is valid</span>');

  // Typing a value only needs the messages, outlines and counts refreshed, so the cursor stays put.
  const refreshLight = () => {
    const f = current();
    const p = problemsFor(f);
    ['name', 'code', 'fallback', 'general'].forEach((id) => {
      const l = p.byId.get(id) ?? [];
      const msg = $(`[data-k-msg="${id}"]`);
      if (msg) {
        msg.innerHTML = messages(l);
        msg.hidden = !l.length;
      }
      const input = $(`#cf-${id}`);
      if (input) input.className = `el-f${cell(l, id)}${id === 'fallback' ? ' num' : ''}`;
    });
    f.dimensions.filter(isRangeDim).forEach((d) => d.bands.forEach((b) => {
      const l = p.byId.get(b.id) ?? [];
      const msg = $(`[data-k-msg="${b.id}"]`);
      if (msg) {
        msg.innerHTML = messages(l);
        msg.hidden = !l.length;
      }
      root.querySelectorAll(`[data-k-b="${b.id}"][data-k-band]`).forEach((input) => input.classList.toggle('bad', l.some((x) => x.field === input.dataset.kBand && x.level === 'error')));
    }));
    f.rows.forEach((r) => {
      const l = p.byId.get(r.id) ?? [];
      const msg = $(`[data-k-msg="${r.id}"]`);
      if (msg) {
        msg.innerHTML = messages(l);
        msg.hidden = !l.length;
      }
      root.querySelectorAll(`[data-k-row="${r.id}"]`).forEach((input) => {
        const field = input.dataset.kKey ?? 'value';
        input.classList.toggle('bad', l.some((x) => x.field === field && x.level === 'error'));
      });
      const fx = $(`[data-k-fx="${r.id}"]`);
      if (fx) fx.innerHTML = effect(r.value);
    });
    $('#cf-sum').innerHTML = summary(p);
    renderStrip();
    renderList();
  };
  const refreshAll = () => {
    renderStrip();
    renderList();
    renderEditor();
  };

  const settleRows = (f, rowOnly) => {
    const ctx = ctxOf(f);
    return (rowOnly ? [rowOnly] : f.rows).flatMap((r) => settleKeys(f, r.keys, ctx));
  };

  root.innerHTML = only ? '<div id="cf-editor"></div>' : `
    <div class="el-strip" id="cf-strip"></div>
    <div class="el-grid">
      <section class="el-panel" aria-label="Combination factors">
        <div class="el-panelh">
          <h3 class="el-title">Factors <span style="float:right"><button type="button" class="action" id="cf-addq"${readOnly() ? ' disabled' : ''}>+ Add question</button> <button type="button" class="action" id="cf-add"${readOnly() ? ' disabled' : ''}>+ Add factor</button></span></h3>
          <input class="el-search" id="cf-search" type="search" placeholder="Search factors" aria-label="Search factors">
        </div>
        <div class="el-list" id="cf-list"></div>
      </section>
      <section class="el-panel" id="cf-editor" aria-live="polite"></section>
    </div>`;
  ui.selected = only ?? (list().find((f) => problemsFor(f).errors) ?? list()[0])?.id ?? null;
  refreshAll();

  // ---- events ----
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-k-f],[data-k-act],#cf-add,#cf-addq');
    if (!el) return;
    const d = el.dataset;
    if (d.kF) {
      ui.selected = d.kF;
      ui.note = '';
      renderList();
      return renderEditor();
    }
    if (readOnly()) return;
    if (el.id === 'cf-add') {
      const fresh = blankCombo();
      list().push(fresh);
      ui.selected = fresh.id;
      ui.note = '';
      changed();
      refreshAll();
      return $('#cf-name')?.focus();
    }
    const f = current();
    if (el.id === 'cf-addq') {
      return openAddQuestion({
        use: 'rating',
        groups: collectFactorGroups(getVersion(), getForms()),
        getVersion,
        onAdded: (keys) => {
          // With a factor open, multiple-choice questions that were just added become its columns straight away.
          if (!f) return refreshAll();
          const ctx = ctxOf(f);
          keys.map(refOfKey).forEach((ref) => {
            if (!ctx.questions.has(ref) || f.dimensions.some((x) => x.source === ref)) return;
            const dim = newQuestionDim(ref, ctx.questions.get(ref).kind);
            f.dimensions.push(dim);
            f.rows.forEach((r) => (r.keys[dim.id] = ''));
          });
          changed();
          refreshAll();
        },
      });
    }
    if (d.kAct === 'remove') {
      if (!confirm(`Remove ${f.name ? `“${f.name}”` : 'this factor'}? Formulas that use ${f.code || 'its code'} will need fixing.`)) return;
      getVersion().comboFactors = list().filter((x) => x.id !== f.id);
      if (only) return onRemoved?.();
      ui.selected = list()[0]?.id ?? null;
    } else if (d.kAct === 'addrow') {
      const row = blankRow();
      f.dimensions.forEach((dim) => (row.keys[dim.id] = ''));
      row.value = '1.00';
      f.rows.push(row);
    } else if (d.kAct === 'genall') {
      const { list: all, truncated } = allCombinations(f, ctxOf(f));
      if (truncated && !confirm('These columns make more than 2,000 combinations. Add the first 2,000?')) return;
      const have = new Set(f.rows.map((r) => tupleKey(f, r.keys)));
      const fresh = all.filter((keys) => !have.has(tupleKey(f, keys)));
      fresh.forEach((keys) => f.rows.push({ id: newId(), keys, value: '' }));
      ui.note = fresh.length
        ? `Added ${plural(fresh.length, 'combination')}${all.length - fresh.length ? ` (${all.length - fresh.length} already in the table)` : ''}. Enter a value for each.`
        : all.length ? 'Every valid combination is already in the table.' : 'No valid combinations: a question has no answers for the selection. Check the dependencies in the form builder.';
      changed();
      return refreshAll();
    } else if (d.kAct === 'addband') {
      const dim = f.dimensions.find((x) => x.id === d.kDim);
      const last = sortedBands(dim).pop();
      dim.bands.push(blankBand(last && last.max !== '' ? last.max : ''));
    } else if (d.kAct === 'delband') {
      const dim = f.dimensions.find((x) => x.id === d.kDim);
      const using = f.rows.filter((r) => r.keys?.[dim.id] === d.kB);
      if (using.length && !confirm(`${plural(using.length, 'combination')} use this range. Remove the range and those combinations?`)) return;
      dim.bands = dim.bands.filter((b) => b.id !== d.kB);
      f.rows = f.rows.filter((r) => r.keys?.[dim.id] !== d.kB);
    } else if (d.kAct === 'delrow') f.rows = f.rows.filter((r) => r.id !== d.kRow);
    else if (d.kAct === 'delcol') {
      const dim = f.dimensions.find((x) => x.id === d.kDim);
      if (f.rows.length && !confirm(`Remove the ${dimLabel(dim, ctxOf(f))} column? Its answers are removed from every combination.`)) return;
      f.dimensions = f.dimensions.filter((x) => x !== dim);
      f.rows.forEach((r) => delete r.keys[dim.id]);
      settleRows(f);
    }
    else return;
    ui.note = '';
    changed();
    refreshAll();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (readOnly()) return;
    const f = current();
    if (!f) return;
    ui.note = '';
    if (t.matches('[data-k-key]')) {
      const row = f.rows.find((r) => r.id === t.dataset.kRow);
      row.keys[t.dataset.kKey] = t.value;
      // Answers further down that no longer fit are cleared, and the person is told.
      const cleared = settleKeys(f, row.keys, ctxOf(f));
      if (cleared.length) ui.note = `${[...new Set(cleared)].join(', ')} cleared: no longer valid for the new selection. Choose again.`;
    } else if (t.matches('[data-k-band]')) {
      // Typing only updates the model (see the input handler); settle here, when the value is committed, so the
      // ranges stay in From order and the row pickers show the new labels.
      const dim = f.dimensions.find((x) => x.id === t.dataset.kDim);
      const before = dim.bands.map((b) => b.id).join();
      dim.bands = sortedBands(dim);
      // Keep focus (Tab from From to To) unless the order moved or a row's picker shows this range.
      if (dim.bands.map((b) => b.id).join() === before && !f.rows.length) {
        changed();
        return refreshLight();
      }
    } else return;
    changed();
    refreshAll();
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    const d = t.dataset;
    if (t.id === 'cf-search') {
      ui.query = t.value;
      return renderList();
    }
    if (readOnly()) return;
    const f = current();
    if (d.kIn) {
      f[d.kIn] = t.value;
    } else if (d.kBand !== undefined) {
      f.dimensions.find((x) => x.id === d.kDim).bands.find((b) => b.id === d.kB)[d.kBand] = t.value;
    } else if (d.kVal !== undefined) f.rows.find((r) => r.id === d.kRow).value = t.value;
    else return;
    changed();
    refreshLight();
  });

  // Suggest a unique code from the name once, so most people never type one.
  root.addEventListener('focusout', (e) => {
    if (e.target.id !== 'cf-name' || readOnly()) return;
    const f = current();
    if (!f || f.code || !f.name.trim()) return;
    const taken = new Set([...counts().keys()]);
    f.code = suggestCode(f.name, taken);
    changed();
    const input = $('#cf-code');
    if (input) input.value = f.code;
    refreshLight();
  });
};

