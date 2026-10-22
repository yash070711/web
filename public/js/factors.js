// Rating factors (step 6 of the product version workspace).
// A factor is a named number that depends on the answer to a question: "Radius of operation" gives 1.00,
// 1.15 or 1.35. This step only defines factors. A later step lets each coverage use them in a formula.
//
// Choice questions (dropdown, multiple choice, Yes / No) get one value per answer. Number and currency
// questions get value ranges: a range includes its From value and stops just before its To value.
//
// Storage (so factors survive copying a version):
//   product + coverage questions -> question.factors
//   form questions               -> coverage.formFactors["<formId>:<questionId>"]
// A factor is { id, name, code, mode: 'choice' | 'range', byAnswer: [ { id, answer, value, note } ],
//               bands: [ { id, min, max, value } ], fallback }. A question holds a list; the screen edits the first.
import { esc, newId } from './product-model.js';

const TYPE_LABEL = { text: 'Short text', textarea: 'Long text', number: 'Number', currency: 'Currency', date: 'Date', yesno: 'Yes / No', radio: 'Multiple choice', checkboxes: 'Checkboxes', dropdown: 'Dropdown', checkbox: 'Single checkbox' };
const YESNO = ['yesno', 'checkbox'];
const CHOICE = ['dropdown', 'radio', ...YESNO];
const RANGE = ['number', 'currency'];
export const factorKind = (type) => (CHOICE.includes(type) ? 'choice' : RANGE.includes(type) ? 'range' : null);
const answersOf = (q) => (YESNO.includes(q.type) ? ['Yes', 'No'] : (q.options ?? []).filter(Boolean));
const CODE = /^[A-Za-z][A-Za-z0-9_]*$/;
const RESERVED = ['baserate'];

const blank = (v) => v === '' || v == null;
const num = (v) => (blank(v) ? NaN : Number(v));
const fmt = (v) => Number(v).toLocaleString('en-US');
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const sortKey = (b) => (Number.isNaN(num(b.min)) ? Infinity : num(b.min));
const byMin = (a, b) => (sortKey(a) === sortKey(b) ? 0 : sortKey(a) < sortKey(b) ? -1 : 1);

// ---- Collecting the questions of a version ----
// Each entry: { key, label, type, kind, answers, group, factors() -> array, setFactors(array) }
export const collectFactorGroups = (version, acordForms) => {
  const groups = [];
  const own = (q, key, group) => ({
    key, group, label: q.label?.trim() || 'Untitled question', type: q.type, kind: factorKind(q.type), answers: answersOf(q),
    factors: () => q.factors ?? [],
    setFactors: (list) => (q.factors = list),
  });
  const product = version.questions ?? [];
  if (product.length) groups.push({ id: 'product', title: 'Product questions', sub: 'Asked for the whole product', qs: product.map((q) => ({ ...own(q, `p:${q.id}`), group: 'Product questions' })) });
  version.components.forEach((c) =>
    c.classes.forEach((k) =>
      k.coverages.forEach((cov) => {
        if ((cov.questions ?? []).length) {
          groups.push({ id: `c:${cov.id}`, title: `Coverage › ${cov.name}`, sub: `${c.name} › ${k.name}`, qs: cov.questions.map((q) => ({ ...own(q, `c:${cov.id}:${q.id}`), group: `Coverage › ${cov.name}` })) });
        }
        (cov.forms ?? []).forEach((att) => {
          const form = acordForms.find((f) => f.id === att.formId);
          if (!form) return;
          const excluded = att.excluded ?? [];
          const qs = form.sections.flatMap((s) => s.questions).filter((q) => !excluded.includes(q.id));
          if (!qs.length) return;
          groups.push({
            id: `f:${cov.id}:${form.id}`,
            title: `Form › ${form.name}`,
            sub: `Attached to ${cov.name}`,
            qs: qs.map((q) => {
              const rk = `${form.id}:${q.id}`;
              return { ...own(q, `f:${cov.id}:${rk}`), group: `Form › ${form.name}`, factors: () => cov.formFactors?.[rk] ?? [], setFactors: (list) => ((cov.formFactors ??= {})[rk] = list) };
            }),
          });
        });
      }),
    ),
  );
  return groups;
};

// ---- Validation ----
const collector = () => {
  const byId = new Map();
  return { byId, add: (id, field, level, msg) => byId.set(id, [...(byId.get(id) ?? []), { field, level, msg }]) };
};
const tally = (byId) => {
  const all = [...byId.values()].flat();
  return { errors: all.filter((p) => p.level === 'error').length, warns: all.filter((p) => p.level === 'warn').length };
};
const checkValue = (add, id, v, field = 'value') => {
  const n = num(v);
  if (Number.isNaN(n)) add(id, field, 'error', 'Enter a number, for example 1.15.');
  else if (n < 0) add(id, field, 'error', 'Values cannot be negative.');
  else if (n < 0.25 || n > 3) add(id, field, 'warn', 'This could zero out or triple a premium. Check it is intended.');
};

// How many times each code (any case) is used by a factor in the whole version.
export const codeCounts = (groups) => {
  const counts = new Map();
  groups.forEach((g) => g.qs.forEach((q) => q.factors().forEach((f) => counts.set(String(f.code ?? '').trim().toLowerCase(), (counts.get(String(f.code ?? '').trim().toLowerCase()) ?? 0) + 1))));
  return counts;
};

// Messages for one factor, keyed by the id of the row or field they belong to.
export const factorProblems = (entry, f, counts) => {
  const { byId, add } = collector();
  if (!f.name?.trim()) add('name', 'name', 'error', 'Enter a name.');
  const code = String(f.code ?? '').trim();
  if (!code) add('code', 'code', 'error', 'Enter a code.');
  else if (!CODE.test(code)) add('code', 'code', 'error', 'Use letters, digits and underscore, starting with a letter.');
  else if (RESERVED.includes(code.toLowerCase())) add('code', 'code', 'error', 'BaseRate is reserved for the base rate. Choose another code.');
  else if ((counts.get(code.toLowerCase()) ?? 0) > 1) add('code', 'code', 'error', `The code ${code} is already used by another factor.`);
  checkValue(add, 'fallback', f.fallback, 'fallback');
  if (f.mode !== entry.kind) add('general', 'general', 'error', 'This factor no longer fits the question type. Remove it and define it again.');
  else if (f.mode === 'choice') {
    if (!entry.answers.length) add('general', 'general', 'error', 'This question has no options yet. Add some on the Questions step.');
    const rows = f.byAnswer ?? [];
    entry.answers.filter((a) => !rows.some((r) => r.answer === a)).forEach((a) => add('general', 'general', 'error', `No value for “${a}”.`));
    rows.forEach((r) => {
      if (!entry.answers.includes(r.answer)) add(r.id, 'answer', 'error', 'This option no longer exists. Remove the row.');
      else checkValue(add, r.id, r.value);
    });
  } else {
    const bands = f.bands ?? [];
    if (!bands.length) add('general', 'general', 'error', 'Add at least one range.');
    const rows = [...bands].sort(byMin);
    rows.forEach((b, i) => {
      const min = num(b.min), max = num(b.max);
      const prev = rows[i - 1];
      if (!(min >= 0)) add(b.id, 'min', 'error', 'Enter a From value of 0 or more.');
      if (blank(b.max)) {
        if (i < rows.length - 1) add(b.id, 'max', 'error', 'Only the last range can have no upper limit.');
      } else if (!(max >= 0)) add(b.id, 'max', 'error', 'Enter a valid To value.');
      else if (min >= 0 && max <= min) add(b.id, 'max', 'error', 'To must be greater than From.');
      checkValue(add, b.id, b.value);
      if (prev && min >= 0 && !Number.isNaN(num(prev.max))) {
        const pmax = num(prev.max);
        if (pmax > min) add(b.id, 'min', 'error', `Starts before range ${i} ends (${fmt(pmax)}).`);
        else if (pmax < min) add(b.id, 'min', 'warn', `Values from ${fmt(pmax)} up to ${fmt(min)} use the fallback value.`);
      }
    });
    const first = rows[0], last = rows[rows.length - 1];
    if (first && num(first.min) > 0) add(first.id, 'min', 'warn', `Values below ${fmt(first.min)} use the fallback value.`);
    if (last && !blank(last.max) && !Number.isNaN(num(last.max))) add(last.id, 'max', 'warn', `Values of ${fmt(last.max)} and above use the fallback value. Leave To blank to cover them.`);
  }
  return { byId, ...tally(byId) };
};

// What still blocks publishing: factors that are not finished. Factors are optional, so none at all is fine.
export const factorIssues = (version, acordForms) => {
  const groups = collectFactorGroups(version, acordForms);
  const counts = codeCounts(groups);
  return groups.flatMap((g) =>
    g.qs.flatMap((q) =>
      q.factors().flatMap((f) => {
        const { errors } = factorProblems(q, f, counts);
        return errors ? [`Rating factors › ${q.label}: fix ${plural(errors, 'error')} in the ${f.code || 'factor'} factor.`] : [];
      }),
    ),
  );
};

// ---- Using a factor ----
export const factorValue = (f, answer) => {
  const fallback = { value: num(f.fallback), how: 'the fallback value' };
  if (f.mode === 'choice') {
    const row = (f.byAnswer ?? []).find((r) => r.answer === answer && !Number.isNaN(num(r.value)));
    return row ? { value: num(row.value), how: `the answer “${answer}”` } : fallback;
  }
  const v = num(answer);
  if (Number.isNaN(v)) return fallback;
  const band = [...(f.bands ?? [])].sort(byMin).find((b) => v >= num(b.min) && (blank(b.max) || v < num(b.max)) && !Number.isNaN(num(b.value)));
  return band ? { value: num(band.value), how: `the range ${fmt(band.min)} to ${blank(band.max) ? 'and above' : fmt(band.max)}` } : fallback;
};
const suggestCode = (label, counts) => {
  let base = String(label).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) || 'FACTOR';
  if (/^\d/.test(base)) base = `F_${base}`;
  let code = base, n = 2;
  while (counts.has(code.toLowerCase()) || RESERVED.includes(code.toLowerCase())) code = `${base}_${n++}`;
  return code;
};
const effect = (v) => {
  const n = num(v);
  if (Number.isNaN(n)) return '';
  if (n === 1) return '<span class="fc-pill">no change</span>';
  return n > 1 ? `<span class="fc-pill up">+${Math.round((n - 1) * 100)}%</span>` : `<span class="fc-pill down">−${Math.round((1 - n) * 100)}%</span>`;
};

// ---- The page ----
export const mountFactors = (host, { getVersion, getForms, readOnly, onChange }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { selected: null, filter: 'all', query: '', test: '' };
  const $ = (sel) => root.querySelector(sel);
  const changed = () => onChange?.();
  const groups = () => collectFactorGroups(getVersion(), getForms());
  const entries = () => groups().flatMap((g) => g.qs.map((q) => ({ ...q, g })));
  const current = () => entries().find((q) => q.key === ui.selected);
  const first = (e) => e.factors()[0];
  const problemsFor = (e, f) => factorProblems(e, f, codeCounts(groups()));
  const status = (e) => {
    const f = first(e);
    if (!e.kind) return { tone: 'warn', text: 'Not factorable', title: 'This question type cannot carry a factor' };
    if (!f) return { tone: 'warn', text: 'No factor', title: '' };
    const p = problemsFor(e, f);
    return p.errors ? { tone: 'senior', text: f.code || 'Incomplete', title: `${plural(p.errors, 'error')} to fix` } : { tone: 'ok', text: f.code, title: 'Ready' };
  };

  const cell = (probs, field) => {
    const p = probs.filter((x) => x.field === field);
    return p.some((x) => x.level === 'error') ? ' bad' : p.length ? ' warnc' : '';
  };
  const messages = (probs) => probs.map((p) => `<span class="${p.level === 'error' ? 'e' : 'w'}">${esc(p.msg)}</span>`).join('');
  const summary = (p) => (p.errors || p.warns
    ? `${p.errors ? `<span class="e">${plural(p.errors, 'error')}</span>` : ''}${p.warns ? `<span class="w">${plural(p.warns, 'warning')}</span>` : ''}`
    : '<span class="ok">Everything is valid</span>');

  const renderStrip = () => {
    const all = entries().filter((e) => e.kind);
    const withFactor = all.filter((e) => first(e));
    const bad = withFactor.filter((e) => problemsFor(e, first(e)).errors).length;
    const stat = (v, l, cls = '') => `<div class="el-stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
    $('#fc-strip').innerHTML = stat(all.length, 'questions that can carry a factor') + stat(withFactor.length, 'with a factor') + stat(bad, 'need attention', bad ? 'warn' : '');
  };

  const renderList = () => {
    const term = ui.query.trim().toLowerCase();
    let html = '';
    let shown = 0;
    groups().forEach((g) => {
      const items = g.qs.filter((q) => {
        if (term && !q.label.toLowerCase().includes(term)) return false;
        if (ui.filter === 'all') return true;
        if (!q.kind) return false;
        return ui.filter === 'with' ? Boolean(first(q)) : first(q) && problemsFor(q, first(q)).errors;
      });
      if (!items.length) return;
      shown += items.length;
      html += `<div class="el-grp"><strong>${esc(g.title)}</strong><small>${esc(g.sub)}</small></div>` + items.map((q) => {
        const s = status(q);
        const label = `<span class="el-qmain"><span class="el-qlabel">${esc(q.label)}</span><span class="el-qtype">${TYPE_LABEL[q.type] ?? 'Text'}</span></span><span class="el-pills"><span class="el-pill t-${s.tone}" title="${esc(s.title)}">${esc(s.text)}</span></span>`;
        return q.kind
          ? `<button type="button" class="el-q" data-f-q="${esc(q.key)}" aria-current="${q.key === ui.selected}">${label}</button>`
          : `<div class="el-q fc-off">${label}</div>`;
      }).join('');
    });
    $('#fc-list').innerHTML = shown ? html : '<div class="el-empty">No questions match.</div>';
  };

  // ---- editor ----
  // Make sure every current answer has a row; removed answers stay (flagged) until the owner removes them.
  const syncAnswers = (e, f) => {
    if (f.mode !== 'choice' || f.mode !== e.kind) return;
    const rows = f.byAnswer ?? [];
    const kept = e.answers.map((a) => rows.find((r) => r.answer === a) ?? { id: newId(), answer: a, value: '', note: '' });
    f.byAnswer = [...kept, ...rows.filter((r) => !e.answers.includes(r.answer))];
  };

  const choiceRow = (e, r, probs) => {
    const stale = !e.answers.includes(r.answer);
    return `<tr data-f-row="${r.id}">
      <td>${esc(r.answer)}${stale ? ' <span class="chip">removed</span>' : ''}</td>
      <td class="num"><input class="el-f num${cell(probs, 'value')}" type="number" min="0" step="0.01" data-f-in="value" data-f-row="${r.id}" value="${esc(r.value)}" aria-label="Value for ${esc(r.answer)}"></td>
      <td class="num" data-f-fx="${r.id}">${effect(r.value)}</td>
      <td><input class="el-f" type="text" data-f-in="note" data-f-row="${r.id}" value="${esc(r.note)}" placeholder="Optional" aria-label="Note for ${esc(r.answer)}"></td>
      <td class="rt-act">${stale ? `<button type="button" class="el-del" data-f-act="delrow" data-f-row="${r.id}">Remove</button>` : ''}</td>
    </tr>
    <tr class="rt-msgrow"><td></td><td colspan="4" class="rt-msg" data-f-msg="${r.id}"${probs.length ? '' : ' hidden'}>${messages(probs)}</td></tr>`;
  };
  const rangeRow = (b, i, probs, currency) => `<tr data-f-row="${b.id}">
      <td><div class="rt-cell">${currency ? '$' : ''}<input class="el-f num${cell(probs, 'min')}" type="number" min="0" step="any" data-f-in="min" data-f-row="${b.id}" value="${esc(b.min)}" aria-label="From, range ${i + 1}"></div></td>
      <td><div class="rt-cell">${currency ? '$' : ''}<input class="el-f num${cell(probs, 'max')}" type="number" min="0" step="any" data-f-in="max" data-f-row="${b.id}" value="${esc(b.max)}" placeholder="and above" aria-label="To, range ${i + 1}"></div></td>
      <td class="num"><input class="el-f num${cell(probs, 'value')}" type="number" min="0" step="0.01" data-f-in="value" data-f-row="${b.id}" value="${esc(b.value)}" aria-label="Value, range ${i + 1}"></td>
      <td class="num" data-f-fx="${b.id}">${effect(b.value)}</td>
      <td class="rt-act"><button type="button" class="el-del" data-f-act="next" data-f-row="${b.id}" title="Add a range that starts where this one ends">Add after</button><button type="button" class="el-del" data-f-act="delrow" data-f-row="${b.id}">Remove</button></td>
    </tr>
    <tr class="rt-msgrow"><td colspan="5" class="rt-msg" data-f-msg="${b.id}"${probs.length ? '' : ' hidden'}>${messages(probs)}</td></tr>`;

  const factorEditor = (e, f) => {
    const p = problemsFor(e, f);
    const get = (id) => p.byId.get(id) ?? [];
    const field = (label, key, extra = '') => `<div class="fc-field"><label for="fc-${key}">${label}</label>
        <input id="fc-${key}" class="el-f${cell(get(key), key)}${key === 'fallback' ? ' num' : ''}" ${extra} data-f-in="${key}" value="${esc(f[key])}">
        <div class="rt-msg" data-f-msg="${key}"${get(key).length ? '' : ' hidden'}>${messages(get(key))}</div></div>`;
    const rows = f.mode === 'choice'
      ? (f.byAnswer ?? []).map((r) => choiceRow(e, r, get(r.id))).join('')
      : [...(f.bands ?? [])].map((b, i) => rangeRow(b, i, get(b.id), e.type === 'currency')).join('');
    const head = f.mode === 'choice'
      ? '<tr><th>Answer</th><th class="num">Value</th><th class="num">Reads as</th><th>Note</th><th></th></tr>'
      : '<tr><th>From <small>included</small></th><th>To <small>not included</small></th><th class="num">Value</th><th class="num">Reads as</th><th></th></tr>';
    return `${field('Name', 'name', 'type="text" maxlength="60"')}
      <div class="fc-fields">
        ${field('Code, used in formulas', 'code', 'type="text" maxlength="30" spellcheck="false" style="font-family:var(--mono,monospace)"')}
        ${field('Fallback value', 'fallback', 'type="number" min="0" step="0.01"')}
      </div>
      <p class="rt-note" style="margin-top:-6px">The fallback is used when the question is unanswered${f.mode === 'range' ? ' or the answer falls outside every range' : ''}. 1.00 means no change.</p>
      <div class="rt-wrap"><table class="rt-table fc-table"><thead>${head}</thead><tbody>${rows || '<tr><td colspan="5"><div class="el-none">No ranges yet.</div></td></tr>'}</tbody></table></div>
      ${f.mode === 'range' ? '<div class="rt-foot"><button type="button" class="action el-add" data-f-act="add">+ Add a range</button></div><p class="rt-note">Each range includes its From value and stops just before its To value. Leave the last To blank to cover every higher value.</p>' : ''}
      <div class="rt-msg" data-f-msg="general"${get('general').length ? '' : ' hidden'}>${messages(get('general'))}</div>
      <div class="rt-foot"><span class="rt-sum" id="fc-sum">${summary(p)}</span><button type="button" class="el-del" data-f-act="remove" style="margin-left:auto">Remove this factor</button></div>
      <div class="rt-note">Used in: no formulas yet. Coverage formulas are set up in the next step.</div>`;
  };

  const testBody = (e, f) => {
    if (f.mode === 'choice') return `<select class="el-f" data-f-test aria-label="Sample answer"><option value="">Pick an answer…</option>${e.answers.map((a) => `<option${a === ui.test ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select>`;
    return `<input class="el-f num" type="number" min="0" step="any" data-f-test value="${esc(ui.test)}" placeholder="e.g. 3" aria-label="Sample answer">`;
  };
  const testResult = (e, f) => {
    if (blank(ui.test)) return '<div class="el-result">Pick or enter a sample answer to see its value.</div>';
    const hit = factorValue(f, ui.test);
    if (Number.isNaN(hit.value)) return '<div class="el-result t-senior">No value yet.<small>Fill in the value or the fallback.</small></div>';
    return `<div class="el-result t-ok">${esc(f.code || 'FACTOR')} = ${hit.value.toFixed(2)}<small>From ${esc(hit.how)}.</small></div>`;
  };

  const renderEditor = () => {
    const e = current();
    if (!e) {
      $('#fc-editor').innerHTML = '<div class="el-none" style="margin:16px">There are no questions to put a factor on yet. Add questions on the Questions step, or attach forms to a coverage.</div>';
      return;
    }
    const f = first(e);
    if (f) syncAnswers(e, f);
    $('#fc-editor').innerHTML = `
      <div class="el-edh"><h2>${esc(e.label)}</h2>
        <div class="el-meta"><span class="el-tag">${TYPE_LABEL[e.type] ?? 'Text'}</span><span>${esc(e.g.title)} · ${esc(e.g.sub)}</span></div></div>
      <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}>
        ${f
          ? factorEditor(e, f)
          : `<div class="el-none">No factor on this question.<br>A factor gives each answer a value that coverage formulas can use.</div>
             <button type="button" class="action primary el-add" data-f-act="create">+ Define a factor</button>`}
      </fieldset>
      ${f ? `<div class="el-test"><span class="el-h3">Try it out</span><div class="el-row" id="fc-testrow">${testBody(e, f)}</div><div id="fc-testres">${testResult(e, f)}</div></div>` : ''}`;
  };

  // Light refresh keeps typing focus: only messages, outlines, counts and the tester change.
  const refreshLight = () => {
    const e = current();
    const f = first(e);
    if (!f) return;
    const p = problemsFor(e, f);
    const rows = f.mode === 'choice' ? f.byAnswer ?? [] : f.bands ?? [];
    ['name', 'code', 'fallback', 'general'].forEach((id) => {
      const list = p.byId.get(id) ?? [];
      const msg = $(`[data-f-msg="${id}"]`);
      if (msg) {
        msg.innerHTML = messages(list);
        msg.hidden = !list.length;
      }
      const input = $(`#fc-${id}`);
      if (input) input.className = `el-f${cell(list, id)}${id === 'fallback' ? ' num' : ''}`;
    });
    rows.forEach((r) => {
      const list = p.byId.get(r.id) ?? [];
      const msg = $(`[data-f-msg="${r.id}"]`);
      if (msg) {
        msg.innerHTML = messages(list);
        msg.hidden = !list.length;
      }
      root.querySelectorAll(`[data-f-row="${r.id}"][data-f-in]`).forEach((input) => {
        if (input.type === 'number') input.className = `el-f num${cell(list, input.dataset.fIn)}`;
      });
      const fx = $(`[data-f-fx="${r.id}"]`);
      if (fx) fx.innerHTML = effect(r.value);
    });
    $('#fc-sum').innerHTML = summary(p);
    $('#fc-testres').innerHTML = testResult(e, f);
    renderStrip();
    renderList();
  };
  const refreshAll = () => {
    renderStrip();
    renderList();
    renderEditor();
  };

  const all = entries().filter((e) => e.kind);
  ui.selected = (all.find((e) => first(e) && problemsFor(e, first(e)).errors) ?? all.find((e) => first(e)) ?? all[0])?.key ?? null;

  root.innerHTML = `
    <div class="el-strip" id="fc-strip"></div>
    <div class="el-grid">
      <section class="el-panel" aria-label="Questions">
        <div class="el-panelh">
          <h3 class="el-title">Questions</h3>
          <input class="el-search" id="fc-search" type="search" placeholder="Search questions" aria-label="Search questions">
          <div class="el-seg" id="fc-filter">
            <button type="button" data-f-f="all" aria-pressed="true">All</button>
            <button type="button" data-f-f="with" aria-pressed="false">With a factor</button>
            <button type="button" data-f-f="bad" aria-pressed="false">Needs attention</button>
          </div>
        </div>
        <div class="el-list" id="fc-list"></div>
      </section>
      <section class="el-panel" id="fc-editor" aria-live="polite"></section>
    </div>`;
  refreshAll();

  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-f-q],[data-f-act],[data-f-f]');
    if (!el) return;
    const d = el.dataset;
    if (d.fF) {
      ui.filter = d.fF;
      root.querySelectorAll('#fc-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      return renderList();
    }
    if (d.fQ) {
      ui.selected = d.fQ;
      ui.test = '';
      renderList();
      return renderEditor();
    }
    if (readOnly()) return;
    const e = current();
    const f = first(e);
    let focus = null;
    if (d.fAct === 'create') {
      const counts = codeCounts(groups());
      const base = { id: newId(), name: e.label, code: suggestCode(e.label, counts), mode: e.kind, byAnswer: [], bands: [], fallback: '1.00' };
      if (e.kind === 'choice') base.byAnswer = e.answers.map((a) => ({ id: newId(), answer: a, value: '1.00', note: '' }));
      else base.bands = [{ id: newId(), min: '0', max: '', value: '1.00' }];
      e.setFactors([base, ...e.factors()]);
    } else if (d.fAct === 'remove') {
      if (!confirm(`Remove the ${f.code || 'factor'} factor from this question?`)) return;
      e.setFactors(e.factors().slice(1));
      ui.test = '';
    } else if (d.fAct === 'add') {
      const last = [...f.bands].sort(byMin).pop();
      const band = { id: newId(), min: last && !blank(last.max) ? last.max : '', max: '', value: '1.00' };
      f.bands.push(band);
      focus = band.id;
    } else if (d.fAct === 'next') {
      const at = f.bands.findIndex((b) => b.id === d.fRow);
      if (at < 0) return;
      const band = { id: newId(), min: f.bands[at].max, max: '', value: f.bands[at].value };
      f.bands.splice(at + 1, 0, band);
      focus = band.id;
    } else if (d.fAct === 'delrow') {
      const list = f.mode === 'choice' ? f.byAnswer : f.bands;
      const at = list.findIndex((r) => r.id === d.fRow);
      if (at >= 0) list.splice(at, 1);
    } else return;
    changed();
    refreshAll();
    if (focus) $(`[data-f-row="${focus}"] [data-f-in="min"]`)?.focus();
  });

  root.addEventListener('change', (ev) => {
    const t = ev.target;
    if (readOnly() || t.dataset.fIn === undefined || !['min', 'max'].includes(t.dataset.fIn)) return;
    const f = first(current());
    // Keep ranges in From order, but only redraw when a row actually moved so Tab keeps working.
    const before = f.bands.map((b) => b.id).join();
    f.bands.sort(byMin);
    if (f.bands.map((b) => b.id).join() !== before) {
      changed();
      refreshAll();
    }
  });

  root.addEventListener('input', (ev) => {
    const t = ev.target;
    const d = t.dataset;
    if (d.fTest !== undefined) {
      ui.test = t.value;
      const e = current();
      return ($('#fc-testres').innerHTML = testResult(e, first(e)));
    }
    if (t.id === 'fc-search') {
      ui.query = t.value;
      return renderList();
    }
    if (d.fIn === undefined || readOnly()) return;
    const f = first(current());
    if (['name', 'code', 'fallback'].includes(d.fIn)) f[d.fIn] = t.value;
    else (f.mode === 'choice' ? f.byAnswer : f.bands).find((r) => r.id === d.fRow)[d.fIn] = t.value;
    changed();
    refreshLight();
  });
};
