// Premium formulas (step 7 of the product version workspace).
// Each coverage gets one formula that turns its base rate (step 5) and rating factors (step 6) into a premium,
// for example: BaseRate * RADIUS * VEHICLE_AGE. A formula may use numbers, + - * / ( ), the names of the factors
// the coverage can see, and the functions min, max and round.
//
// Factors a coverage can use: those on product questions, on its own questions and on its attached forms, plus the version's
// single Account-Level Factor (AccountFactor) when one is set up. That one arrives already limited to its minimum and maximum.
//
// Storage: coverage.formula = { expression }.
import { esc } from './product-model.js';
import { collectFactorGroups, factorValue } from './factors.js';
import { ACCOUNT_CODE, ACCOUNT_LABEL, BASE_FACTOR, isConfigured, clampFactor } from './account-factor-calc.js';

const FUNCTIONS = { min: [1, Infinity, Math.min], max: [1, Infinity, Math.max], round: [1, 2, (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d] };
const BASE = 'BaseRate';

const blank = (v) => v === '' || v == null;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const usd = (v) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// ---- Parsing ----
// Returns { ast, names } or { error }. `names` are the identifiers used as values, as typed.
export const parseFormula = (text) => {
  const src = String(text ?? '');
  const tokens = [];
  const re = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|(.))/y;
  let m;
  while (re.lastIndex < src.length && (m = re.exec(src))) {
    if (m[1] !== undefined) tokens.push({ t: 'num', v: Number(m[1]), at: m.index });
    else if (m[2] !== undefined) tokens.push({ t: 'id', v: m[2], at: m.index });
    else if ('+-*/(),'.includes(m[3])) tokens.push({ t: m[3], at: m.index });
    else return { error: `“${m[3]}” is not allowed. Use numbers, names, + - * / ( ) and commas.` };
  }
  let i = 0;
  const names = [];
  const fail = (msg) => {
    throw new Error(msg);
  };
  const peek = () => tokens[i];
  const eat = (t) => (peek()?.t === t ? tokens[i++] : null);
  const expr = () => {
    let left = term();
    for (let op; (op = eat('+') ?? eat('-')); ) left = { op: op.t, left, right: term() };
    return left;
  };
  const term = () => {
    let left = unary();
    for (let op; (op = eat('*') ?? eat('/')); ) left = { op: op.t, left, right: unary() };
    return left;
  };
  const unary = () => (eat('-') ? { op: 'neg', arg: unary() } : primary());
  const primary = () => {
    const tok = tokens[i++];
    if (!tok) return fail('The formula ends too early. Something is missing after the last symbol.');
    if (tok.t === 'num') return { num: tok.v };
    if (tok.t === '(') {
      const inner = expr();
      if (!eat(')')) fail('A closing ) is missing.');
      return inner;
    }
    if (tok.t === 'id') {
      if (peek()?.t === '(') {
        const fn = FUNCTIONS[tok.v.toLowerCase()];
        if (!fn) return fail(`${tok.v}( ) is not a function. Available: min, max, round.`);
        i += 1;
        const args = [];
        if (!eat(')')) {
          do args.push(expr());
          while (eat(','));
          if (!eat(')')) fail(`A closing ) is missing after ${tok.v}(.`);
        }
        if (args.length < fn[0] || args.length > fn[1]) fail(`${tok.v}( ) needs ${fn[1] === Infinity ? `at least ${fn[0]}` : fn[0] === fn[1] ? fn[0] : `${fn[0]} to ${fn[1]}`} value(s).`);
        return { fn: tok.v.toLowerCase(), args };
      }
      names.push(tok.v);
      return { name: tok.v };
    }
    return fail(`Unexpected “${tok.t}”. A value or name was expected here.`);
  };
  if (!tokens.length) return { error: 'Enter a formula.' };
  try {
    const ast = expr();
    if (i < tokens.length) fail(`Unexpected “${tokens[i].t === 'num' ? tokens[i].v : tokens[i].v ?? tokens[i].t}”. Two values need an operator such as * between them.`);
    return { ast, names };
  } catch (e) {
    return { error: e.message };
  }
};

// env: lower-case name -> number. Throws on division by zero.
const run = (n, env) => {
  if (n.num !== undefined) return n.num;
  if (n.name !== undefined) return env[n.name.toLowerCase()];
  if (n.fn) return FUNCTIONS[n.fn][2](...n.args.map((a) => run(a, env)));
  if (n.op === 'neg') return -run(n.arg, env);
  const a = run(n.left, env), b = run(n.right, env);
  if (n.op === '+') return a + b;
  if (n.op === '-') return a - b;
  if (n.op === '*') return a * b;
  if (b === 0) throw new Error('Division by zero.');
  return a / b;
};

// ---- Which factors a coverage can use ----
// Map(lower-case code -> { code, name, label, entry, factor }) for one coverage.
export const factorsFor = (version, cov, acordForms) => {
  const out = new Map();
  collectFactorGroups(version, acordForms)
    .filter((g) => g.id === 'product' || g.id === `c:${cov.id}` || g.id.startsWith(`f:${cov.id}:`))
    .forEach((g) => g.qs.forEach((q) => q.factors().forEach((f) => {
      const code = String(f.code ?? '').trim();
      if (code && !out.has(code.toLowerCase())) out.set(code.toLowerCase(), { code, name: f.name || code, label: q.label, entry: q, factor: f });
    })));
  const account = version.accountFactor;
  if (isConfigured(account)) out.set(ACCOUNT_CODE.toLowerCase(), { code: ACCOUNT_CODE, name: ACCOUNT_LABEL, label: ACCOUNT_LABEL, account: true, config: account });
  return out;
};

// ---- Validation ----
export const formulaProblems = (cov, available) => {
  const expr = cov.formula?.expression ?? '';
  if (!expr.trim()) return { errors: [], warns: [], empty: true, parsed: null };
  const parsed = parseFormula(expr);
  const errors = [], warns = [];
  if (parsed.error) return { errors: [parsed.error], warns, empty: false, parsed };
  const unknown = [...new Set(parsed.names.filter((n) => n.toLowerCase() !== BASE.toLowerCase() && !available.has(n.toLowerCase())))];
  unknown.forEach((n) => errors.push(n.toLowerCase() === ACCOUNT_CODE.toLowerCase()
    ? `${ACCOUNT_CODE} is the Account-Level Factor, which has no factors set up yet. Add them on the Rating factors step, in the Account-Level Factors tab.`
    : `${n} is not a factor this coverage can use. Define it on the Rating factors step, or check the spelling.`));
  if (!parsed.names.some((n) => n.toLowerCase() === BASE.toLowerCase())) warns.push(`The formula does not use ${BASE}, so the base rate has no effect.`);
  if (!errors.length) {
    const env = { [BASE.toLowerCase()]: 1000, ...Object.fromEntries([...available].map(([k]) => [k, 1])) };
    try {
      const r = run(parsed.ast, env);
      if (!Number.isFinite(r)) errors.push('The formula does not produce a number.');
    } catch (e) {
      warns.push('The formula can divide by zero for some factor values.');
    }
  }
  return { errors, warns, empty: false, parsed };
};

// What still blocks publishing: every coverage needs a valid formula.
export const formulaIssues = (version, acordForms) =>
  version.components.flatMap((c) => c.classes.flatMap((k) => k.coverages)).flatMap((cov) => {
    const p = formulaProblems(cov, factorsFor(version, cov, acordForms));
    if (p.empty) return [`Premium formula › ${cov.name}: enter a formula.`];
    return p.errors.map((e) => `Premium formula › ${cov.name}: ${e}`);
  });

// ---- The page ----
export const mountFormula = (host, { getVersion, getForms, readOnly, onChange }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { selected: null, filter: 'all', query: '', base: '', ans: {} };
  const $ = (sel) => root.querySelector(sel);
  const groups = () => getVersion().components.flatMap((c) => c.classes.filter((k) => k.coverages.length).map((k) => ({ title: k.name, sub: c.name, items: k.coverages })));
  const everyCoverage = () => groups().flatMap((g) => g.items);
  const current = () => everyCoverage().find((c) => c.id === ui.selected);
  const formulaOf = (cov) => (cov.formula ??= { expression: '' });
  const availableOf = (cov) => factorsFor(getVersion(), cov, getForms());
  const problemsOf = (cov) => formulaProblems(cov, availableOf(cov));

  const status = (cov) => {
    const p = problemsOf(cov);
    if (p.empty) return { tone: 'warn', text: 'Not set', title: 'No formula yet' };
    if (p.errors.length) return { tone: 'senior', text: 'Incomplete', title: p.errors[0] };
    return { tone: 'ok', text: 'Ready', title: 'Ready' };
  };

  const renderStrip = () => {
    const all = everyCoverage();
    const ready = all.filter((c) => status(c).tone === 'ok').length;
    const stat = (v, l, cls = '') => `<div class="el-stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
    $('#fm-strip').innerHTML = stat(all.length, 'coverages') + stat(ready, 'with a valid formula') + stat(all.length - ready, 'need attention', all.length - ready ? 'warn' : '');
  };

  const renderList = () => {
    const term = ui.query.trim().toLowerCase();
    let html = '', shown = 0;
    groups().forEach((g) => {
      const items = g.items.filter((c) => (!term || c.name.toLowerCase().includes(term)) && (ui.filter === 'all' || status(c).tone !== 'ok'));
      if (!items.length) return;
      shown += items.length;
      html += `<div class="el-grp"><strong>${esc(g.title)}</strong><small>${esc(g.sub)}</small></div>` + items.map((c) => {
        const s = status(c);
        return `<button type="button" class="el-q" data-x-q="${esc(c.id)}" aria-current="${c.id === ui.selected}"><span class="el-qmain"><span class="el-qlabel">${esc(c.name)}</span></span><span class="el-pills"><span class="el-pill t-${s.tone}" title="${esc(s.title)}">${esc(s.text)}</span></span></button>`;
      }).join('');
    });
    $('#fm-list').innerHTML = shown ? html : `<div class="el-empty">${ui.filter === 'all' && !term ? 'There are no coverages in this product yet.' : 'No coverages match.'}</div>`;
  };

  const messages = (p) => [...p.errors.map((m) => `<span class="e">${esc(m)}</span>`), ...p.warns.map((m) => `<span class="w">${esc(m)}</span>`)].join('');
  const summary = (p) => (p.empty ? '' : p.errors.length || p.warns.length
    ? `${p.errors.length ? `<span class="e">${plural(p.errors.length, 'error')}</span>` : ''}${p.warns.length ? `<span class="w">${plural(p.warns.length, 'warning')}</span>` : ''}`
    : '<span class="ok">Formula is valid</span>');

  // ---- tester ----
  const usedFactors = (cov, p) => {
    if (!p.parsed?.names) return [];
    const av = availableOf(cov);
    return [...new Set(p.parsed.names.map((n) => n.toLowerCase()))].map((k) => av.get(k)).filter(Boolean);
  };
  const testFields = (cov, p) => {
    const used = usedFactors(cov, p);
    const base = `<label class="fm-t"><span>${BASE}</span><div class="rt-cell">$<input class="el-f num" type="number" min="0" step="any" data-x-base value="${esc(ui.base)}" placeholder="e.g. 1200" aria-label="Base rate"></div></label>`;
    return base + used.map((u) => {
      const v = ui.ans[u.code] ?? '';
      if (u.account) {
        const { min, max } = u.config;
        return `<label class="fm-t"><span>${ACCOUNT_LABEL} <small>${ACCOUNT_CODE}</small></span><input class="el-f num" type="number" min="0" step="0.01" data-x-ans="${ACCOUNT_CODE}" value="${esc(v)}" placeholder="Final value, e.g. 1.30" aria-label="${ACCOUNT_LABEL}"><small class="muted" style="margin:0">Limited to ${esc(min)} – ${esc(max)}</small></label>`;
      }
      const control = u.factor.mode === 'choice'
        ? `<select class="el-f" data-x-ans="${esc(u.code)}" aria-label="${esc(u.label)}"><option value="">Unanswered</option>${u.entry.answers.map((a) => `<option${a === v ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select>`
        : `<input class="el-f num" type="number" min="0" step="any" data-x-ans="${esc(u.code)}" value="${esc(v)}" placeholder="Unanswered" aria-label="${esc(u.label)}">`;
      return `<label class="fm-t"><span>${esc(u.label)} <small>${esc(u.code)}</small></span>${control}</label>`;
    }).join('');
  };
  const testResult = (cov, p) => {
    if (p.empty || p.errors.length) return '<div class="el-result">Fix the formula to try it out.</div>';
    if (blank(ui.base) || Number.isNaN(Number(ui.base))) return `<div class="el-result">Enter a base rate to see the premium.</div>`;
    const env = { [BASE.toLowerCase()]: Number(ui.base) };
    const lines = usedFactors(cov, p).map((u) => {
      if (u.account) {
        // The formula receives the consolidated factor, already kept between the limits.
        const entered = blank(ui.ans[u.code]) || Number.isNaN(Number(ui.ans[u.code])) ? BASE_FACTOR : Number(ui.ans[u.code]);
        const value = clampFactor(entered, u.config.min, u.config.max);
        env[u.code.toLowerCase()] = value;
        return `${esc(u.code)} = ${value.toFixed(2)} (${value === entered ? 'within the limits' : 'limited to the limits'})`;
      }
      const hit = factorValue(u.factor, ui.ans[u.code] ?? '');
      env[u.code.toLowerCase()] = hit.value;
      return `${esc(u.code)} = ${Number.isNaN(hit.value) ? '?' : hit.value.toFixed(2)} (${esc(hit.how)})`;
    });
    try {
      const r = run(p.parsed.ast, env);
      if (!Number.isFinite(r)) return '<div class="el-result t-senior">No premium.<small>A factor has no value yet.</small></div>';
      return `<div class="el-result t-ok">Premium ${usd(r)}<small>${lines.join(' · ') || 'No factors used.'}</small></div>`;
    } catch (e) {
      return `<div class="el-result t-senior">${esc(e.message)}</div>`;
    }
  };

  // ---- editor ----
  const renderEditor = () => {
    const cov = current();
    if (!cov) {
      $('#fm-editor').innerHTML = '<div class="el-none" style="margin:16px">There are no coverages yet. Add coverages on the Components step.</div>';
      return;
    }
    const where = groups().find((g) => g.items.includes(cov));
    const av = [...availableOf(cov).values()];
    const p = problemsOf(cov);
    $('#fm-editor').innerHTML = `
      <div class="el-edh"><h2>${esc(cov.name)}</h2>
        <div class="el-meta"><span class="el-tag">Premium formula</span><span>${esc(where?.title ?? '')} · ${esc(where?.sub ?? '')}</span></div></div>
      <fieldset class="plain el-edb"${readOnly() ? ' disabled' : ''}>
        <div class="fc-field"><label for="fm-expr">Formula</label>
          <textarea id="fm-expr" class="el-f fm-expr${p.errors.length ? ' bad' : ''}" rows="3" spellcheck="false" data-x-expr placeholder="${BASE} * …" aria-label="Premium formula">${esc(formulaOf(cov).expression)}</textarea>
          <div class="rt-msg" id="fm-msg"${p.errors.length || p.warns.length ? '' : ' hidden'}>${messages(p)}</div></div>
        <div><span class="el-h3">Insert</span>
          <div class="fm-chips">
            <button type="button" class="el-chip" data-x-ins="${BASE}" title="The base rate from Rater setup">${BASE}</button>
            ${av.map((u) => `<button type="button" class="el-chip" data-x-ins="${esc(u.code)}" title="${esc(u.name)} · ${esc(u.label)}">${esc(u.code)}</button>`).join('')}
            ${['*', '+', '-', '/', '(', ')'].map((o) => `<button type="button" class="el-chip fm-op" data-x-ins="${o}">${o}</button>`).join('')}
          </div>
          <p class="rt-note" style="margin-top:6px">${av.length ? 'Click a name to add it at the cursor.' : 'No factors are available for this coverage. Define some on the Rating factors step.'} You can also use min( ), max( ) and round( ).</p></div>
        ${av.length ? `<div><button type="button" class="action" data-x-act="seed">Start from all factors</button></div>` : ''}
        <div class="rt-foot"><span class="rt-sum" id="fm-sum">${summary(p)}</span></div>
      </fieldset>
      <div class="el-test"><span class="el-h3">Try it out</span>
        <div class="fm-testgrid" id="fm-testfields">${testFields(cov, p)}</div>
        <div id="fm-testres">${testResult(cov, p)}</div></div>`;
  };

  // Typing keeps focus: only messages, outline, counts and the tester change.
  const refreshLight = ({ rebuildTest = true } = {}) => {
    const cov = current();
    const p = problemsOf(cov);
    const msg = $('#fm-msg');
    msg.innerHTML = messages(p);
    msg.hidden = !(p.errors.length || p.warns.length);
    $('#fm-expr').classList.toggle('bad', p.errors.length > 0);
    $('#fm-sum').innerHTML = summary(p);
    if (rebuildTest) $('#fm-testfields').innerHTML = testFields(cov, p);
    $('#fm-testres').innerHTML = testResult(cov, p);
    renderStrip();
    renderList();
  };
  const refreshAll = () => {
    renderStrip();
    renderList();
    renderEditor();
  };

  ui.selected = (everyCoverage().find((c) => status(c).tone !== 'ok') ?? everyCoverage()[0])?.id ?? null;
  root.innerHTML = `
    <div class="el-strip" id="fm-strip"></div>
    <div class="el-grid">
      <section class="el-panel" aria-label="Coverages">
        <div class="el-panelh">
          <h3 class="el-title">Coverages</h3>
          <input class="el-search" id="fm-search" type="search" placeholder="Search coverages" aria-label="Search coverages">
          <div class="el-seg" id="fm-filter">
            <button type="button" data-x-f="all" aria-pressed="true">All</button>
            <button type="button" data-x-f="todo" aria-pressed="false">Needs attention</button>
          </div>
        </div>
        <div class="el-list" id="fm-list"></div>
      </section>
      <section class="el-panel" id="fm-editor" aria-live="polite"></section>
    </div>`;
  refreshAll();

  const setExpression = (cov, text) => {
    formulaOf(cov).expression = text;
    onChange?.();
  };

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-x-q],[data-x-f],[data-x-ins],[data-x-act]');
    if (!el) return;
    const d = el.dataset;
    if (d.xF) {
      ui.filter = d.xF;
      root.querySelectorAll('#fm-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      return renderList();
    }
    if (d.xQ) {
      Object.assign(ui, { selected: d.xQ, base: '', ans: {} });
      renderList();
      return renderEditor();
    }
    if (readOnly()) return;
    const cov = current();
    const area = $('#fm-expr');
    if (d.xIns !== undefined) {
      const isOp = el.classList.contains('fm-op');
      const text = area.value;
      const from = area.selectionStart ?? text.length, to = area.selectionEnd ?? text.length;
      const piece = isOp ? ` ${d.xIns} ` : d.xIns;
      const next = `${text.slice(0, from)}${piece}${text.slice(to)}`.replace(/ {2,}/g, ' ');
      area.value = next;
      const pos = Math.min(next.length, from + piece.length);
      area.focus();
      area.setSelectionRange(pos, pos);
      setExpression(cov, next);
      return refreshLight();
    }
    if (d.xAct === 'seed') {
      const used = [...availableOf(cov).values()].map((u) => u.code);
      if (formulaOf(cov).expression.trim() && !confirm('Replace the current formula?')) return;
      setExpression(cov, [BASE, ...used].join(' * '));
      refreshAll();
    }
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    const d = t.dataset;
    if (t.id === 'fm-search') {
      ui.query = t.value;
      return renderList();
    }
    if (d.xBase !== undefined) {
      ui.base = t.value;
      return ($('#fm-testres').innerHTML = testResult(current(), problemsOf(current())));
    }
    if (d.xAns !== undefined) {
      ui.ans[d.xAns] = t.value;
      return ($('#fm-testres').innerHTML = testResult(current(), problemsOf(current())));
    }
    if (d.xExpr !== undefined && !readOnly()) {
      setExpression(current(), t.value);
      refreshLight();
    }
  });
  // Answer pickers are selects, which fire change rather than input.
  root.addEventListener('change', (e) => {
    const d = e.target.dataset;
    if (d.xAns !== undefined) {
      ui.ans[d.xAns] = e.target.value;
      $('#fm-testres').innerHTML = testResult(current(), problemsOf(current()));
    }
  });
};
