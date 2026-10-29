// Eligibility rules (step 4 of the product version workspace).
// Lists the questions marked as eligibility questions (product, coverage and attached-form questions; see
// question-uses.js) and lets the product owner attach rules to them: "when the answer is ..., refer / decline / warn".
// Questions can be added to this stage from the stage itself.
//
// Storage (so rules survive copying a version):
//   product + coverage questions -> question.rules
//   form questions               -> coverage.formRules["<formId>:<questionId>"]
// A rule is { id, op, value, value2, outcome, message }.
import { formFor } from './form-versions.js';
import { esc, newId } from './product-model.js';
import { USES, questionHandle, formHandle, toggleUse, confirmUntick } from './question-uses.js';
import { openAddQuestion } from './question-add.js';

export const OUTCOMES = {
  senior: { label: 'Refer to Senior Underwriter', short: 'Senior UW', hint: 'Cannot bind until approved', rank: 3 },
  uw: { label: 'Refer to Underwriter', short: 'UW', hint: 'Needs a manual review', rank: 2 },
  decline: { label: 'Decline', short: 'Decline', hint: 'Not eligible for this product', rank: 4 },
  warn: { label: 'Allow with a warning', short: 'Warn', hint: 'Quote continues, note is shown', rank: 1 },
};
// Only referral is offered for now; the other outcomes stay defined so they can be switched on later by adding them here.
const OUT_ORDER = ['uw'];

export const TYPE_LABEL = { text: 'Short text', textarea: 'Long text', number: 'Number', currency: 'Currency', date: 'Date', yesno: 'Yes / No', radio: 'Multiple choice', checkboxes: 'Checkboxes', dropdown: 'Dropdown', checkbox: 'Single checkbox' };
export const OPS = {
  number: [['lt', 'is less than'], ['lte', 'is at most'], ['gt', 'is greater than'], ['gte', 'is at least'], ['eq', 'is exactly'], ['neq', 'is not'], ['between', 'is between']],
  date: [['before', 'is before'], ['after', 'is after'], ['olderYears', 'is more than … years ago'], ['withinYears', 'is within the last … years']],
  yesno: [['is', 'is']],
  choice: [['in', 'is any of'], ['notin', 'is none of']],
  multi: [['any', 'includes any of'], ['all', 'includes all of'], ['none', 'includes none of']],
  text: [['eq', 'is exactly'], ['contains', 'contains'], ['blank', 'is left blank']],
};
export const family = (t) => ({ number: 'number', currency: 'number', date: 'date', yesno: 'yesno', checkbox: 'yesno', radio: 'choice', dropdown: 'choice', checkboxes: 'multi' })[t] ?? 'text';

// ---- Collecting the questions of a version ----
// Each entry: { key, label, type, options, rules() -> array, setRules(array) }
export const collectGroups = (version, acordForms) => {
  const groups = [];
  const own = (q) => ({
    label: q.label,
    type: q.type,
    options: q.options ?? [],
    rules: () => q.rules ?? [],
    setRules: (list) => (q.rules = list),
    ...questionHandle(q),
  });
  const product = version.questions ?? [];
  if (product.length) {
    groups.push({ id: 'product', title: 'Product questions', sub: 'Asked for the whole product', qs: product.map((q) => ({ key: `p:${q.id}`, ...own(q) })) });
  }
  version.components.forEach((c) =>
    c.classes.forEach((k) =>
      k.coverages.forEach((cov) => {
        const where = `${c.name} › ${k.name}`;
        if ((cov.questions ?? []).length) {
          groups.push({ id: `c:${cov.id}`, title: `Coverage › ${cov.name}`, sub: where, qs: cov.questions.map((q) => ({ key: `c:${cov.id}:${q.id}`, ...own(q) })) });
        }
        (cov.forms ?? []).forEach((att) => {
          const form = formFor(att, acordForms);
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
              return {
                key: `f:${cov.id}:${rk}`,
                label: q.label,
                type: q.type,
                options: q.options ?? [],
                rules: () => cov.formRules?.[rk] ?? [],
                setRules: (list) => ((cov.formRules ??= {})[rk] = list),
                ...formHandle(cov, rk, q),
              };
            }),
          });
        });
      }),
    ),
  );
  return groups;
};

export const ruleDone = (r, q) => {
  const f = family(q.type);
  if (f === 'text' && r.op === 'blank') return true;
  if (f === 'choice' || f === 'multi') return Array.isArray(r.value) && r.value.length > 0;
  if (r.op === 'between') return r.value !== '' && r.value2 !== '' && Number(r.value) <= Number(r.value2);
  return r.value !== '' && r.value != null;
};

// What still blocks publishing: rules that are not filled in.
export const eligibilityIssues = (version, acordForms) =>
  collectGroups(version, acordForms).flatMap((g) =>
    g.qs.flatMap((q) => (q.rules().some((r) => !ruleDone(r, q)) ? [`Eligibility rules › ${q.label || 'Untitled question'}: finish or remove the incomplete rule.`] : [])),
  );

// ---- Describing and evaluating rules ----
const opLabel = (q, r) => (OPS[family(q.type)].find((o) => o[0] === r.op) ?? [, ''])[1];
const fmtVal = (q, v) => (q.type === 'currency' && v !== '' ? `$${Number(v).toLocaleString()}` : Array.isArray(v) ? v.join(', ') : v);
const sentence = (q, r) => {
  const f = family(q.type);
  let cond;
  if (f === 'text' && r.op === 'blank') cond = 'is left blank';
  else if (r.op === 'between') cond = `is between <b>${esc(fmtVal(q, r.value))}</b> and <b>${esc(fmtVal(q, r.value2))}</b>`;
  else if (r.op === 'olderYears') cond = `is more than <b>${esc(r.value)}</b> years ago`;
  else if (r.op === 'withinYears') cond = `is within the last <b>${esc(r.value)}</b> years`;
  else cond = `${opLabel(q, r)} <b>${esc(fmtVal(q, r.value))}</b>`;
  return `If the answer to “${esc(q.label)}” ${cond}, then <b>${OUTCOMES[r.outcome].label.toLowerCase()}</b>.`;
};
export const matches = (q, r, a) => {
  const f = family(q.type);
  if (f === 'text') {
    const s = String(a ?? '').trim().toLowerCase();
    if (r.op === 'blank') return s === '';
    if (s === '') return false;
    return r.op === 'eq' ? s === String(r.value).trim().toLowerCase() : s.includes(String(r.value).trim().toLowerCase());
  }
  if (a === '' || a == null || (Array.isArray(a) && !a.length && f !== 'multi')) return false;
  if (f === 'number') {
    const n = Number(a), v = Number(r.value), w = Number(r.value2);
    return { lt: n < v, lte: n <= v, gt: n > v, gte: n >= v, eq: n === v, neq: n !== v, between: n >= v && n <= w }[r.op];
  }
  if (f === 'date') {
    const d = new Date(a);
    if (r.op === 'before') return d < new Date(r.value);
    if (r.op === 'after') return d > new Date(r.value);
    const cut = new Date();
    cut.setFullYear(cut.getFullYear() - Number(r.value));
    return r.op === 'olderYears' ? d < cut : d >= cut;
  }
  if (f === 'yesno') return a === r.value;
  if (f === 'choice') return r.op === 'in' ? r.value.includes(a) : !r.value.includes(a);
  const have = a ?? [];
  if (r.op === 'any') return r.value.some((v) => have.includes(v));
  if (r.op === 'all') return r.value.every((v) => have.includes(v));
  return !r.value.some((v) => have.includes(v));
};
export const defaultRule = (q) => {
  const f = family(q.type);
  return { id: newId(), op: OPS[f][0][0], value: f === 'yesno' ? 'Yes' : f === 'choice' || f === 'multi' ? [] : '', value2: '', outcome: 'uw', message: '' };
};

// ---- The page ----
// The value controls of a condition. `at` says how the controls announce themselves, because eligibility rules and
// account-level factor conditions listen for different data attributes.
const ELIGIBILITY_ATTRS = {
  chip: (act, r, v) => `data-e-act="${act}" data-e-rule="${r.id}" data-e-v="${v}"`,
  input: (field, r) => `data-e-in="${field}" data-e-rule="${r.id}"`,
};
export const valueInputs = (q, r, at = ELIGIBILITY_ATTRS) => {
  const f = family(q.type);
  if (f === 'text' && r.op === 'blank') return '';
  if (f === 'yesno') return `<div class="el-chips">${['Yes', 'No'].map((v) => `<button type="button" class="el-chip" ${at.chip('val', r, v)} aria-pressed="${r.value === v}">${v}</button>`).join('')}</div>`;
  if (f === 'choice' || f === 'multi') {
    return q.options.length
      ? `<div class="el-chips">${q.options.map((v) => `<button type="button" class="el-chip" ${at.chip('toggle', r, esc(v))} aria-pressed="${r.value.includes(v)}">${esc(v)}</button>`).join('')}</div>`
      : '<span class="muted">This question has no options yet. Add some on the Questions step.</span>';
  }
  if (f === 'date' && (r.op === 'before' || r.op === 'after')) return `<input class="el-f" type="date" ${at.input('value', r)} value="${esc(r.value)}" aria-label="Date">`;
  if (f === 'number') {
    const pre = q.type === 'currency' ? '$ ' : '';
    return `${pre}<input class="el-f num" type="number" step="any" ${at.input('value', r)} value="${esc(r.value)}" aria-label="Value">` +
      (r.op === 'between' ? ` and ${pre}<input class="el-f num" type="number" step="any" ${at.input('value2', r)} value="${esc(r.value2)}" aria-label="Upper value">` : '');
  }
  if (f === 'date') return `<input class="el-f num" type="number" min="0" ${at.input('value', r)} value="${esc(r.value)}" aria-label="Years"> years`;
  return `<input class="el-f wide" type="text" ${at.input('value', r)} value="${esc(r.value)}" aria-label="Value">`;
};

export const mountEligibility = (host, { getVersion, getForms, readOnly, onChange }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { selected: null, filter: 'all', query: '', answers: {}, groups: [] };
  // Only the questions marked as eligibility questions are part of this stage.
  const inStage = (q) => q.uses().eligibility;
  const entries = () => ui.groups.flatMap((g) => g.qs.filter(inStage).map((q) => ({ ...q, group: g })));
  const current = () => entries().find((q) => q.key === ui.selected);
  const $ = (sel) => root.querySelector(sel);
  const findRule = (id) => current()?.rules().find((r) => r.id === id);
  const changed = () => onChange?.();

  const pills = (q) => {
    const n = {};
    q.rules().forEach((r) => (n[r.outcome] = (n[r.outcome] || 0) + 1));
    return OUT_ORDER.filter((o) => n[o]).map((o) => `<span class="el-pill t-${o}" title="${OUTCOMES[o].label}">${n[o]} ${OUTCOMES[o].short}</span>`).join('');
  };

  const renderStrip = () => {
    const qs = entries();
    const flat = qs.flatMap((q) => q.rules());
    const stat = (v, l, cls = '') => `<div class="el-stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
    $('#el-strip').innerHTML =
      stat(qs.length, 'questions in this stage') + stat(qs.filter((q) => q.rules().length).length, 'questions with rules') +
      stat(flat.length, 'refer to underwriter rules', 'warn');
  };

  const renderList = () => {
    const term = ui.query.trim().toLowerCase();
    let html = '';
    let shown = 0;
    ui.groups.forEach((g) => {
      const items = g.qs.filter((q) => inStage(q) && (!term || q.label.toLowerCase().includes(term)) && (ui.filter === 'all' || (ui.filter === 'with') === q.rules().length > 0));
      if (!items.length) return;
      shown += items.length;
      html += `<div class="el-grp"><strong>${esc(g.title)}</strong><small>${esc(g.sub)}</small></div>` +
        items.map((q) => `<button type="button" class="el-q" data-e-q="${esc(q.key)}" aria-current="${q.key === ui.selected}"><span class="el-qmain"><span class="el-qlabel">${esc(q.label)}</span><span class="el-qtype">${TYPE_LABEL[q.type] ?? 'Text'}</span></span><span class="el-pills">${pills(q)}</span></button>`).join('');
    });
    $('#el-list').innerHTML = shown ? html : `<div class="el-empty">${entries().length ? 'No questions match.' : 'No questions in this stage yet.<br>Use “Add question” to bring one in.'}</div>`;
  };

  const sentenceText = (q, r) => (ruleDone(r, q) ? sentence(q, r) : 'Fill in the condition to see this rule as a sentence.');

  const testInput = (q) => {
    const f = family(q.type);
    const a = ui.answers[q.key];
    if (f === 'yesno') return ['Yes', 'No'].map((v) => `<button type="button" class="el-chip" data-e-act="tans" data-e-v="${v}" aria-pressed="${a === v}">${v}</button>`).join('');
    if (f === 'choice') return q.options.map((v) => `<button type="button" class="el-chip" data-e-act="tans" data-e-v="${esc(v)}" aria-pressed="${a === v}">${esc(v)}</button>`).join('');
    if (f === 'multi') return q.options.map((v) => `<button type="button" class="el-chip" data-e-act="tmulti" data-e-v="${esc(v)}" aria-pressed="${(a ?? []).includes(v)}">${esc(v)}</button>`).join('');
    const type = f === 'number' ? 'number' : f === 'date' ? 'date' : 'text';
    return `<input class="el-f wide" type="${type}" step="any" data-e-tin value="${esc(a ?? '')}" placeholder="Enter a sample answer" aria-label="Sample answer">`;
  };
  const testResult = (q) => {
    const rs = q.rules().filter((r) => ruleDone(r, q));
    const a = ui.answers[q.key];
    const empty = a == null || a === '' || (Array.isArray(a) && !a.length);
    if (!rs.length) return '<div class="el-result">No rules to test yet.</div>';
    if (empty && !rs.some((r) => family(q.type) === 'text' && r.op === 'blank')) return '<div class="el-result">Enter a sample answer to see what would happen.</div>';
    const hit = rs.filter((r) => matches(q, r, a)).sort((x, y) => OUTCOMES[y.outcome].rank - OUTCOMES[x.outcome].rank);
    if (!hit.length) return '<div class="el-result t-ok">Accepted. No rule applies to this answer.</div>';
    const w = hit[0];
    return `<div class="el-result t-${w.outcome}">${OUTCOMES[w.outcome].label}${w.message ? `<small>${esc(w.message)}</small>` : ''}${hit.length > 1 ? `<small>${hit.length} rules matched. The strictest outcome is shown.</small>` : ''}</div>`;
  };
  const renderTester = (q) => {
    $('#el-testrow').innerHTML = testInput(q);
    $('#el-testres').innerHTML = testResult(q);
  };

  const renderEditor = () => {
    const q = current();
    if (!q) {
      $('#el-editor').innerHTML = '<div class="el-none" style="margin:16px">There are no eligibility questions yet. Use “Add question” to bring one in from the form or the product, or create a new one.</div>';
      return;
    }
    const f = family(q.type);
    const rs = q.rules();
    const dis = readOnly() ? ' disabled' : '';
    $('#el-editor').innerHTML = `
      <div class="el-edh"><h2>${esc(q.label)}</h2>
        <div class="el-meta"><span class="el-tag">${TYPE_LABEL[q.type] ?? 'Text'}</span><span>${esc(q.group.title)} · ${esc(q.group.sub)}</span></div></div>
      <fieldset class="plain el-edb"${dis}>
        <div class="el-uses"><span class="el-h3">Use this question for</span>${USES.map((u) => `<label class="ac-choice" title="${esc(u.hint)}"><input type="checkbox" data-e-use="${u.key}"${q.uses()[u.key] ? ' checked' : ''}> ${u.label}</label>`).join('')}</div>
        ${rs.length ? rs.map((r, i) => `
          <div class="el-rule">
            <div class="el-ruletop"><span class="el-h3">Rule ${i + 1}</span><button type="button" class="el-del" data-e-act="del" data-e-rule="${r.id}">Remove</button></div>
            <div class="el-row"><span class="el-kw">When</span>
              <select class="el-f" data-e-op data-e-rule="${r.id}" aria-label="Condition">${OPS[f].map((o) => `<option value="${o[0]}"${o[0] === r.op ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>
              ${valueInputs(q, r)}</div>
            <div class="el-row"><span class="el-kw">Then</span>
              <div class="el-outcomes">${OUT_ORDER.map((o) => `<button type="button" class="el-oc t-${o}" data-e-act="outcome" data-e-rule="${r.id}" data-e-v="${o}" aria-pressed="${r.outcome === o}"><b>${OUTCOMES[o].label}</b><span>${OUTCOMES[o].hint}</span></button>`).join('')}</div></div>
            <div class="el-row"><span class="el-kw">Note</span>
              <input class="el-f wide" type="text" data-e-in="message" data-e-rule="${r.id}" value="${esc(r.message)}" placeholder="Reason shown to the underwriter or agent (optional)" aria-label="Note"></div>
            <div class="el-sentence" data-e-sentence="${r.id}">${sentenceText(q, r)}</div>
          </div>`).join('') : '<div class="el-none">No eligibility rule on this question.<br>Every answer is accepted until you add one.</div>'}
        <button type="button" class="action el-add" data-e-act="add">+ Add a rule</button>
      </fieldset>
      <div class="el-test"><span class="el-h3">Try it out</span><div class="el-row" id="el-testrow"></div><div id="el-testres"></div></div>`;
    renderTester(q);
  };

  // Light refresh keeps typing focus: only badges, counts, sentences and the tester change.
  const refreshLight = () => {
    const q = current();
    renderStrip();
    renderList();
    q.rules().forEach((r) => {
      const node = $(`[data-e-sentence="${r.id}"]`);
      if (node) node.innerHTML = sentenceText(q, r);
    });
    $('#el-testres').innerHTML = testResult(q);
  };
  const refreshAll = () => {
    renderStrip();
    renderList();
    renderEditor();
  };

  ui.groups = collectGroups(getVersion(), getForms());
  const first = entries();
  ui.selected = (first.find((q) => q.rules().length) ?? first[0])?.key ?? null;

  root.innerHTML = `
    <div class="el-strip" id="el-strip"></div>
    <div class="el-grid">
      <section class="el-panel" aria-label="Questions">
        <div class="el-panelh">
          <h3 class="el-title">Questions <button type="button" class="action" id="el-addq" style="float:right"${readOnly() ? ' disabled' : ''}>+ Add question</button></h3>
          <input class="el-search" id="el-search" type="search" placeholder="Search questions" aria-label="Search questions">
          <div class="el-seg" id="el-filter">
            <button type="button" data-e-f="all" aria-pressed="true">All</button>
            <button type="button" data-e-f="with" aria-pressed="false">With rules</button>
            <button type="button" data-e-f="without" aria-pressed="false">No rules yet</button>
          </div>
        </div>
        <div class="el-list" id="el-list"></div>
      </section>
      <section class="el-panel" id="el-editor" aria-live="polite"></section>
    </div>`;
  refreshAll();

  root.addEventListener('click', (e) => {
    if (e.target.closest('#el-addq')) {
      return openAddQuestion({
        use: 'eligibility',
        groups: ui.groups,
        getVersion,
        onAdded: (keys) => {
          ui.groups = collectGroups(getVersion(), getForms());
          ui.selected = keys[0];
          ui.filter = 'all';
          root.querySelectorAll('#el-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.eF === 'all')));
          changed();
          refreshAll();
        },
      });
    }
    const el = e.target.closest('[data-e-q],[data-e-act],[data-e-f]');
    if (!el) return;
    const d = el.dataset;
    if (d.eF) {
      ui.filter = d.eF;
      root.querySelectorAll('#el-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      return renderList();
    }
    if (d.eQ) {
      ui.selected = d.eQ;
      renderList();
      return renderEditor();
    }
    const q = current();
    const r = findRule(d.eRule);
    const v = d.eV;
    switch (d.eAct) {
      case 'tans': ui.answers[q.key] = v; return renderTester(q);
      case 'tmulti': {
        const a = ui.answers[q.key] ?? [];
        ui.answers[q.key] = a.includes(v) ? a.filter((x) => x !== v) : [...a, v];
        return renderTester(q);
      }
      default:
    }
    if (readOnly()) return;
    if (d.eAct === 'add') q.setRules([...q.rules(), defaultRule(q)]);
    else if (d.eAct === 'del') q.setRules(q.rules().filter((x) => x.id !== d.eRule));
    else if (d.eAct === 'outcome') r.outcome = v;
    else if (d.eAct === 'val') r.value = v;
    else if (d.eAct === 'toggle') r.value = r.value.includes(v) ? r.value.filter((x) => x !== v) : [...r.value, v];
    else return;
    changed();
    refreshAll();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.eUse && !readOnly()) {
      const q = current();
      const use = t.dataset.eUse;
      if (!t.checked && !confirmUntick(q, use)) {
        t.checked = true;
        return;
      }
      toggleUse(q, use, t.checked);
      changed();
      if (!inStage(q)) ui.selected = entries()[0]?.key ?? null;
      return refreshAll();
    }
    if (t.dataset.eOp === undefined || readOnly()) return;
    const q = current();
    const r = findRule(t.dataset.eRule);
    r.op = t.value;
    if (family(q.type) === 'date' || r.op === 'between') r.value2 = '';
    if (family(q.type) === 'date') r.value = '';
    changed();
    refreshAll();
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.eIn) {
      findRule(t.dataset.eRule)[t.dataset.eIn] = t.value;
      changed();
      refreshLight();
    } else if (t.dataset.eTin !== undefined) {
      const q = current();
      ui.answers[q.key] = t.value;
      $('#el-testres').innerHTML = testResult(q);
    } else if (t.id === 'el-search') {
      ui.query = t.value;
      renderList();
    }
  });
};
