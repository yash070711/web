// Rater setup (step 5 of the product version workspace).
// For every coverage the product owner picks a rating method and fills in its rate table.
//
// Value-based: the customer's answer to a value question (e.g. a truck declared at $50,000) is looked up in
// a table of bands; the band it falls in gives the rate. A band includes its From value and stops just before
// its To value, so 100-1,000 followed by 1,000-2,500 neither overlaps nor leaves a gap.
//
// Territory-based: a flat-rate table over the fields the owner picks: state, ZIP code, territory code, or any
// multiple-choice question such as vehicle type. Each row is one combination of those fields and its rate, and
// an optional default rate covers every combination that is not listed. A territory is a state plus a set of ZIP
// codes, defined once per version (version.territories) and shared by every coverage.
//
// Single base price: one flat amount for the coverage. Differences between risks come later, from rating factors
// (step 6) combined in the premium formula (step 7).
//
// Storage: coverage.rating = { method, valueSource, value: { bands }, territory: { dimensions, defaultRate, rows }, flat: { amount } }.
// A new method gets its own block next to these and an entry in RATING_METHODS.
import { esc, newId, clone, blankRating, allCoverages, productStates, parseZips } from './product-model.js';

export const RATING_METHODS = {
  value: { label: 'Value-based', hint: 'Rate depends on the value of the insured item, such as a truck declared at $50,000', ready: true },
  flat: { label: 'Single base price', hint: 'One base price for the coverage. Add rating factors afterwards to adjust it by answers', ready: true },
  territory: { label: 'Territory-based', hint: 'Flat rate by the fields you choose: state, ZIP code, territory code, vehicle type and more', ready: true },
};
const RATE_TYPES = [['percent', '% of value'], ['flat', 'Flat amount']];
const LOCATION_FIELDS = [['state', 'State'], ['zip', 'ZIP code'], ['territory', 'Territory code']];
const CHOICE_TYPES = ['dropdown', 'radio', 'yesno'];
const MAX_GEN = 5000;
const NUMERIC = ['number', 'currency'];
const PAGE = 50;

const blank = (v) => v === '' || v == null;
const num = (v) => (blank(v) ? NaN : Number(v));
const fmt = (v) => Number(v).toLocaleString('en-US');
const usd = (v) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const sortKey = (b) => (Number.isNaN(num(b.min)) ? Infinity : num(b.min));
const byMin = (a, b) => (sortKey(a) === sortKey(b) ? 0 : sortKey(a) < sortKey(b) ? -1 : 1);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// "75001" or "75001-75099" -> [75001, 75099]; anything else -> null.
const zipRange = (key) => {
  const m = String(key ?? '').trim().match(/^(\d{5})(?:-(\d{5}))?$/);
  if (!m) return null;
  const lo = +m[1], hi = m[2] ? +m[2] : lo;
  return lo <= hi ? [lo, hi] : null;
};
// Items { id, lo, hi, label, owner? } -> Map(id -> label of the item it overlaps). Items of the same owner never conflict.
const findOverlaps = (items) => {
  const out = new Map();
  let top = null;
  [...items].sort((a, b) => a.lo - b.lo || a.hi - b.hi).forEach((it) => {
    if (top && it.lo <= top.hi && (it.owner === undefined || it.owner !== top.owner)) out.set(it.id, top.label);
    if (!top || it.hi > top.hi) top = it;
  });
  return out;
};
const tally = (byId, general = []) => {
  const all = [...byId.values()].flat().concat(general);
  return { errors: all.filter((p) => p.level === 'error').length, warns: all.filter((p) => p.level === 'warn').length };
};

// ---- Which questions can supply the value ----
// Number and currency questions a coverage can see: product questions, its own, and those on its attached forms.
export const valueSources = (version, cov, acordForms) => {
  const out = [];
  const add = (q, key, group) => NUMERIC.includes(q.type) && out.push({ key, label: q.label?.trim() || 'Untitled question', group });
  (version.questions ?? []).forEach((q) => add(q, `product:${q.id}`, 'Product questions'));
  (cov.questions ?? []).forEach((q) => add(q, `coverage:${q.id}`, 'Questions on this coverage'));
  (cov.forms ?? []).forEach((att) => {
    const form = acordForms.find((f) => f.id === att.formId);
    if (!form) return;
    const excluded = att.excluded ?? [];
    form.sections.flatMap((s) => s.questions).filter((q) => !excluded.includes(q.id)).forEach((q) => add(q, `form:${form.id}:${q.id}`, `Form › ${form.name}`));
  });
  return out;
};

// States a coverage can be rated in: the product's states minus those the coverage excludes.
export const allowedStatesFor = (version, cov) => productStates(version).filter((st) => !(cov.jurisdiction?.excludedStates ?? []).includes(st));

// ---- Validation ----
// Errors block publishing, warnings do not.
const checkRate = (add, id, rate, rateType) => {
  const n = num(rate);
  if (!(n >= 0)) add(id, 'rate', 'error', 'Enter a rate of 0 or more.');
  else if (rateType === 'percent' && n > 100) add(id, 'rate', 'warn', 'A rate above 100% charges more than the value.');
};
const collector = () => {
  const byId = new Map();
  return { byId, add: (id, field, level, msg) => byId.set(id, [...(byId.get(id) ?? []), { field, level, msg }]) };
};

// Bands are checked in From order, whatever order they are stored in.
export const bandProblems = (bands) => {
  const { byId, add } = collector();
  const rows = [...bands].sort(byMin);
  rows.forEach((b, i) => {
    const min = num(b.min), max = num(b.max);
    const prev = rows[i - 1];
    if (!(min >= 0)) add(b.id, 'min', 'error', 'Enter a From value of 0 or more.');
    if (blank(b.max)) {
      if (i < rows.length - 1) add(b.id, 'max', 'error', 'Only the last band can have no upper limit.');
    } else if (!(max >= 0)) add(b.id, 'max', 'error', 'Enter a valid To value.');
    else if (min >= 0 && max <= min) add(b.id, 'max', 'error', 'To must be greater than From.');
    checkRate(add, b.id, b.rate, b.rateType);
    if (prev && min >= 0 && !Number.isNaN(num(prev.max))) {
      const pmax = num(prev.max);
      if (pmax > min) add(b.id, 'min', 'error', `Starts before band ${i} ends (${fmt(pmax)}).`);
      else if (pmax < min) add(b.id, 'min', 'warn', `Values from ${fmt(pmax)} up to ${fmt(min)} have no rate.`);
    }
  });
  const first = rows[0], last = rows[rows.length - 1];
  if (first && num(first.min) > 0) add(first.id, 'min', 'warn', `Values below ${fmt(first.min)} have no rate.`);
  if (last && !blank(last.max) && !Number.isNaN(num(last.max))) add(last.id, 'max', 'warn', `Values of ${fmt(last.max)} and above have no rate. Leave To blank to cover them.`);
  return { byId, general: [], ...tally(byId) };
};

// ---- Territory fields ----
const walkQuestions = (version, cov, acordForms, visit) => {
  (version.questions ?? []).forEach((q) => visit(q, `product:${q.id}`, 'Product questions'));
  (cov.questions ?? []).forEach((q) => visit(q, `coverage:${q.id}`, 'Questions on this coverage'));
  (cov.forms ?? []).forEach((att) => {
    const form = acordForms.find((f) => f.id === att.formId);
    if (!form) return;
    const excluded = att.excluded ?? [];
    form.sections.flatMap((s) => s.questions).filter((q) => !excluded.includes(q.id)).forEach((q) => visit(q, `form:${form.id}:${q.id}`, `Form › ${form.name}`));
  });
};
// Multiple-choice questions a coverage can see, with their options (vehicle type, for example).
export const choiceSources = (version, cov, acordForms) => {
  const out = [];
  walkQuestions(version, cov, acordForms, (q, key, group) => {
    if (CHOICE_TYPES.includes(q.type)) out.push({ key, group, label: q.label?.trim() || 'Untitled question', options: q.type === 'yesno' ? ['Yes', 'No'] : (q.options ?? []).filter(Boolean) });
  });
  return out;
};
const fieldContext = (version, cov, acordForms) => ({ states: allowedStatesFor(version, cov), defs: version.territories ?? [], choices: choiceSources(version, cov, acordForms) });
// What a rating field is and which values it accepts.
const fieldInfo = (dim, ctx) => {
  if (dim.type === 'state') return { kind: 'state', label: 'State', options: ctx.states };
  if (dim.type === 'zip') return { kind: 'zip', label: 'ZIP code', options: [] };
  if (dim.type === 'territory') return { kind: 'territory', label: 'Territory code', options: ctx.defs.map((d) => d.code).filter(Boolean) };
  const source = ctx.choices.find((c) => c.key === dim.source);
  return { kind: 'choice', label: source?.label ?? 'Unavailable question', options: source?.options ?? [], missing: !source };
};
const fieldError = (info, raw) => {
  const v = String(raw ?? '').trim();
  if (!v) return { state: 'Choose a state.', zip: 'Enter a ZIP code or range.', territory: 'Choose a territory.', choice: 'Choose a value.' }[info.kind];
  if (info.kind === 'state' && !info.options.includes(v)) return `${v} is not available for this coverage.`;
  if (info.kind === 'zip' && !zipRange(v)) return 'Use a 5-digit ZIP or a range like 33101-33199.';
  if (info.kind === 'territory' && !info.options.includes(v)) return 'This territory is not defined.';
  if (info.kind === 'choice' && !info.options.includes(v)) return 'Not one of the question’s options.';
  return '';
};
// Match what was typed or pasted to the canonical value (state codes upper case, options in their own case).
const normalizeField = (info, raw) => {
  const v = String(raw ?? '').trim();
  if (info.kind === 'state') return v.toUpperCase();
  return info.options.find((o) => o.toLowerCase() === v.toLowerCase()) ?? v;
};
const tupleKey = (dims, keys) => dims.map((d) => String(keys?.[d.id] ?? '').trim().toLowerCase()).join('\u0001');

// Messages per row (keyed by the field's id, or 'rate') plus general ones about the table as a whole.
export const territoryProblems = (cov, version, acordForms) => {
  const t = cov.rating.territory;
  const dims = t.dimensions;
  const { byId, add } = collector();
  const general = [];
  const ctx = fieldContext(version, cov, acordForms);
  const infos = dims.map((d) => fieldInfo(d, ctx));
  if (!dims.length) general.push({ level: 'error', msg: 'Choose at least one field the rate depends on.' });
  infos.forEach((i) => i.missing && general.push({ level: 'error', msg: 'A question used as a field is no longer available. Remove that field.' }));
  const clean = [];
  t.rows.forEach((r) => {
    let ok = true;
    dims.forEach((d, i) => {
      const why = infos[i].missing ? '' : fieldError(infos[i], r.keys?.[d.id]);
      if (why) {
        add(r.id, d.id, 'error', why);
        ok = false;
      }
    });
    if (!(num(r.rate) >= 0)) add(r.id, 'rate', 'error', 'Enter a rate of 0 or more.');
    if (ok && !infos.some((i) => i.missing)) clean.push(r);
  });
  // The same combination twice is an error; with a ZIP field, ZIP ranges that overlap for the same other values are too.
  const zip = dims.find((d) => d.type === 'zip');
  const others = dims.filter((d) => d !== zip);
  const groups = new Map();
  clean.forEach((r) => groups.set(tupleKey(others, r.keys), [...(groups.get(tupleKey(others, r.keys)) ?? []), r]));
  groups.forEach((list) => {
    if (list.length < 2) return;
    if (!zip) return list.slice(1).forEach((r) => add(r.id, dims[0].id, 'error', 'This combination already has a rate above.'));
    const ranges = list.map((r) => {
      const z = zipRange(r.keys[zip.id]);
      return { id: r.id, lo: z[0], hi: z[1], label: String(r.keys[zip.id]).trim() };
    });
    findOverlaps(ranges).forEach((label, id) => add(id, zip.id, 'error', `Overlaps ${label}.`));
  });
  if (!blank(t.defaultRate) && !(num(t.defaultRate) >= 0)) general.push({ level: 'error', msg: 'Enter a valid default rate, or leave it blank.' });
  if (dims.length && !t.rows.length && blank(t.defaultRate)) general.push({ level: 'error', msg: 'Add at least one rate, or a default rate for every other combination.' });
  return { byId, general, ...tally(byId, general) };
};

// Territory definitions are shared, so they are checked once for the whole version.
export const territoryDefProblems = (version) => {
  const { byId, add } = collector();
  const defs = version.territories ?? [];
  const codes = new Set();
  const ranges = [];
  defs.forEach((d) => {
    const code = String(d.code ?? '').trim();
    if (!code) add(d.id, 'code', 'error', 'Enter a territory code.');
    else if (codes.has(code.toLowerCase())) add(d.id, 'code', 'error', `The code ${code} is used twice.`);
    codes.add(code.toLowerCase());
    if (!d.state) add(d.id, 'state', 'error', 'Choose the state.');
    const { valid, invalid } = parseZips(d.zips);
    if (invalid.length) add(d.id, 'zips', 'error', `Not valid ZIP codes: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}`);
    else if (!valid.length) add(d.id, 'zips', 'warn', 'No ZIP codes yet.');
    valid.forEach((tok, i) => {
      const z = zipRange(tok);
      ranges.push({ id: `${d.id}:${i}`, owner: d.id, lo: z[0], hi: z[1], label: `${code || 'another territory'} (${tok})` });
    });
  });
  const seenOwner = new Set();
  findOverlaps(ranges).forEach((label, id) => {
    const owner = id.slice(0, id.lastIndexOf(':'));
    if (seenOwner.has(owner)) return;
    seenOwner.add(owner);
    add(owner, 'zips', 'error', `Shares ZIP codes with ${label}.`);
  });
  return { byId, ...tally(byId) };
};

// What a coverage still needs, as short phrases.
export const ratingProblems = (cov, sources, version, acordForms) => {
  const r = cov.rating ?? blankRating();
  if (!r.method) return ['choose a rating method'];
  if (!RATING_METHODS[r.method]?.ready) return ['choose a rating method that is available'];
  const out = [];
  if (r.method === 'value' && !sources.some((s) => s.key === r.valueSource)) out.push(r.valueSource ? 'pick a value question that still exists' : 'choose the question to rate on');
  if (r.method === 'flat') {
    if (!(num(r.flat?.amount) >= 0)) out.push('enter the base price');
  } else if (r.method === 'value') {
    const bands = r.value?.bands ?? [];
    if (!bands.length) out.push('add at least one rate band');
    else if (bandProblems(bands).errors) out.push(`fix ${plural(bandProblems(bands).errors, 'rate band error')}`);
  } else {
    const { errors } = territoryProblems(cov, version, acordForms);
    if (errors) out.push(`fix ${plural(errors, 'rate table error')}`);
    if (r.territory.dimensions.some((d) => d.type === 'territory') && territoryDefProblems(version).errors) out.push('fix the territory definitions');
  }
  return out;
};

// What still blocks publishing: every coverage needs a complete rating.
export const raterIssues = (version, acordForms) =>
  allCoverages(version.components).flatMap((cov) => ratingProblems(cov, valueSources(version, cov, acordForms), version, acordForms).map((p) => `Rater setup › ${cov.name}: ${p}.`));

// ---- Using the tables ----
const findBand = (bands, value) => [...bands].sort(byMin).find((b) => value >= num(b.min) && (blank(b.max) || value < num(b.max)) && !Number.isNaN(num(b.rate)));
const amount = (rateType, rate, value) => (rateType === 'percent' ? (value * num(rate)) / 100 : num(rate));
const findTerritoryRate = (t, vals) => {
  const dims = t.dimensions;
  const hit = t.rows.find((r) => !blank(r.rate) && !Number.isNaN(num(r.rate)) && dims.every((d) => {
    const have = String(vals[d.id] ?? '').trim(), want = String(r.keys?.[d.id] ?? '').trim();
    if (!have) return false;
    if (d.type === 'zip') {
      const z = zipRange(want), at = zipRange(have);
      return Boolean(z && at && at[0] >= z[0] && at[0] <= z[1]);
    }
    return want.toLowerCase() === have.toLowerCase();
  }));
  if (hit) return { rate: hit.rate, source: dims.map((d) => hit.keys[d.id]).join(' · ') };
  return !blank(t.defaultRate) && num(t.defaultRate) >= 0 ? { rate: t.defaultRate, source: 'the default rate' } : null;
};

// ---- The page ----
export const mountRater = (host, { getVersion, getForms, readOnly, onChange }) => {
  host.innerHTML = '';
  const root = document.createElement('div');
  host.append(root);

  const ui = { selected: null, filter: 'all', query: '', test: '', testVals: {}, rowQuery: '', page: 0, genOpen: false, gen: { off: {}, zips: '' }, genMsg: '', defsOpen: true };
  const $ = (sel) => root.querySelector(sel);
  const changed = () => onChange?.();

  const groups = () =>
    getVersion().components.flatMap((c) =>
      c.classes.filter((k) => k.coverages.length).map((k) => ({ title: k.name, sub: c.name, items: k.coverages })),
    );
  const everyCoverage = () => allCoverages(getVersion().components);
  const current = () => everyCoverage().find((c) => c.id === ui.selected);
  const sourcesOf = (cov) => valueSources(getVersion(), cov, getForms());
  const rating = (cov) => (cov.rating ??= blankRating());
  const bandsOf = (cov) => ((rating(cov).value ??= { bands: [] }).bands ??= []);
  const flatOf = (cov) => (rating(cov).flat ??= blankRating().flat);
  const terr = (cov) => (rating(cov).territory ??= blankRating().territory);
  const dimsOf = (cov) => terr(cov).dimensions;
  const rowsOf = (cov) => terr(cov).rows;
  const ctxOf = (cov) => fieldContext(getVersion(), cov, getForms());
  const defsOf = () => (getVersion().territories ??= []);
  const problemsOf = (cov) => ratingProblems(cov, sourcesOf(cov), getVersion(), getForms());

  const status = (cov) => {
    const r = rating(cov);
    if (!r.method) return { tone: 'warn', text: 'Not set', title: 'No rating method chosen yet' };
    const problems = problemsOf(cov);
    if (problems.length) return { tone: 'senior', text: 'Incomplete', title: `Needs: ${problems.join(', ')}` };
    if (r.method === 'flat') return { tone: 'ok', text: `Flat · ${usd(r.flat.amount)}`, title: 'Ready' };
    const n = r.method === 'value' ? bandsOf(cov).length : rowsOf(cov).length;
    return { tone: 'ok', text: r.method === 'value' ? `Value · ${plural(n, 'band')}` : `Territory · ${plural(n, 'rate')}`, title: 'Ready' };
  };

  const renderStrip = () => {
    const all = everyCoverage();
    const ready = all.filter((c) => status(c).tone === 'ok').length;
    const stat = (v, l, cls = '') => `<div class="el-stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
    $('#rt-strip').innerHTML = stat(all.length, 'coverages to rate') + stat(ready, 'ready') + stat(all.length - ready, 'need attention', all.length - ready ? 'warn' : '');
  };

  const renderList = () => {
    const term = ui.query.trim().toLowerCase();
    let html = '';
    let shown = 0;
    groups().forEach((g) => {
      const items = g.items.filter((c) => (!term || c.name.toLowerCase().includes(term)) && (ui.filter === 'all' || status(c).tone !== 'ok'));
      if (!items.length) return;
      shown += items.length;
      html += `<div class="el-grp"><strong>${esc(g.title)}</strong><small>${esc(g.sub)}</small></div>` +
        items.map((c) => {
          const s = status(c);
          return `<button type="button" class="el-q" data-r-q="${esc(c.id)}" aria-current="${c.id === ui.selected}"><span class="el-qmain"><span class="el-qlabel">${esc(c.name)}</span></span><span class="el-pills"><span class="el-pill t-${s.tone}" title="${esc(s.title)}">${esc(s.text)}</span></span></button>`;
        }).join('');
    });
    $('#rt-list').innerHTML = shown ? html : `<div class="el-empty">${ui.filter === 'all' && !term ? 'There are no coverages in this product yet.' : 'No coverages match.'}</div>`;
  };

  // ---- shared bits ----
  const cell = (probs, field) => {
    const p = probs.filter((x) => x.field === field);
    return p.some((x) => x.level === 'error') ? ' bad' : p.length ? ' warnc' : '';
  };
  const messages = (probs) => probs.map((p) => `<span class="${p.level === 'error' ? 'e' : 'w'}">${esc(p.msg)}</span>`).join('');
  const summary = (p, empty) => {
    if (empty) return '';
    return p.errors || p.warns
      ? `${p.errors ? `<span class="e">${plural(p.errors, 'error')}</span>` : ''}${p.warns ? `<span class="w">${plural(p.warns, 'warning')}</span>` : ''}`
      : '<span class="ok">Everything is valid</span>';
  };

  const sourceSelect = (cov) => {
    const r = rating(cov);
    const sources = sourcesOf(cov);
    const byGroup = {};
    sources.forEach((s) => (byGroup[s.group] ??= []).push(s));
    const known = sources.some((s) => s.key === r.valueSource);
    return `<div class="rt-src">
      <label class="el-h3" for="rt-source">Rate on</label>
      <select id="rt-source" class="el-f" data-r-source aria-label="Question that holds the value">
        <option value="">Choose the question that captures the value…</option>
        ${Object.entries(byGroup).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((s) => `<option value="${esc(s.key)}"${s.key === r.valueSource ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</optgroup>`).join('')}
        ${r.valueSource && !known ? `<option value="${esc(r.valueSource)}" selected>This question is no longer available</option>` : ''}
      </select>
      <p class="muted" style="margin:0">${sources.length
        ? 'The answer to this question, for example a truck declared at $50,000, is the value the rate is applied to.'
        : 'There is no Number or Currency question for this coverage yet. Add one on the Questions step, for example “Vehicle value”, then come back.'}</p>
    </div>`;
  };

  // ---- value-based table ----
  const bandRow = (b, i, probs) => {
    const pct = b.rateType === 'percent';
    return `<tr data-r-row="${b.id}">
      <td class="rt-n">${i + 1}</td>
      <td><div class="rt-cell">$<input class="el-f num${cell(probs, 'min')}" type="number" min="0" step="any" data-r-in="min" data-r-band="${b.id}" value="${esc(b.min)}" aria-label="From value, band ${i + 1}"></div></td>
      <td><div class="rt-cell">$<input class="el-f num${cell(probs, 'max')}" type="number" min="0" step="any" data-r-in="max" data-r-band="${b.id}" value="${esc(b.max)}" placeholder="and above" aria-label="To value, band ${i + 1}"></div></td>
      <td><select class="el-f" data-r-in="rateType" data-r-band="${b.id}" aria-label="Rate type, band ${i + 1}">${RATE_TYPES.map(([v, l]) => `<option value="${v}"${v === b.rateType ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
      <td><div class="rt-cell">${pct ? '' : '$'}<input class="el-f num${cell(probs, 'rate')}" type="number" min="0" step="any" data-r-in="rate" data-r-band="${b.id}" value="${esc(b.rate)}" aria-label="Rate, band ${i + 1}">${pct ? '%' : ''}</div></td>
      <td class="rt-act"><button type="button" class="el-del" data-r-act="next" data-r-band="${b.id}" title="Add a band that starts where this one ends, with the same rate">Add after</button><button type="button" class="el-del" data-r-act="del" data-r-band="${b.id}">Remove</button></td>
    </tr>
    <tr class="rt-msgrow"><td></td><td colspan="5" class="rt-msg" data-r-msg="${b.id}"${probs.length ? '' : ' hidden'}>${messages(probs)}</td></tr>`;
  };

  const valuePanel = (cov) => {
    const bands = bandsOf(cov);
    const probs = bandProblems(bands);
    return `${sourceSelect(cov)}
      <div class="rt-wrap"><table class="rt-table rt-bands">
        <thead><tr><th>#</th><th>From<small>included</small></th><th>To<small>not included</small></th><th>Rate type</th><th>Rate</th><th></th></tr></thead>
        <tbody>${bands.map((b, i) => bandRow(b, i, probs.byId.get(b.id) ?? [])).join('') || '<tr><td colspan="6"><div class="el-none">No rate bands yet.<br>Add the first band to start the rate table.</div></td></tr>'}</tbody>
      </table></div>
      <div class="rt-foot"><button type="button" class="action el-add" data-r-act="add">+ Add a band</button><span class="rt-sum" id="rt-sum">${summary(probs, !bands.length)}</span></div>
      <p class="rt-note">Each band includes its From value and stops just before its To value. Leave the last To blank to cover every higher value.</p>`;
  };

  // ---- territory-based table ----
  const keyControl = (r, dim, info, probs) => {
    const c = `el-f${cell(probs, dim.id)}`;
    const attrs = `data-t-in="key" data-t-dim="${dim.id}" data-t-row="${r.id}"`;
    const v = r.keys?.[dim.id] ?? '';
    if (info.kind === 'zip') return `<input class="${c}" type="text" ${attrs} value="${esc(v)}" placeholder="75001 or 75001-75099" aria-label="${esc(info.label)}">`;
    const known = !v || info.options.includes(v);
    return `<select class="${c}" ${attrs} aria-label="${esc(info.label)}"><option value="">Choose…</option>${info.options.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}${known ? '' : `<option selected>${esc(v)}</option>`}</select>`;
  };
  const tRow = (r, n, probs, dims, infos) => `<tr data-t-rowwrap="${r.id}">
      <td class="rt-n">${n}</td>
      ${dims.map((d, i) => `<td>${keyControl(r, d, infos[i], probs)}</td>`).join('')}
      <td><div class="rt-cell">$<input class="el-f num${cell(probs, 'rate')}" type="number" min="0" step="any" data-t-in="rate" data-t-row="${r.id}" value="${esc(r.rate)}" aria-label="Flat rate"></div></td>
      <td class="rt-act"><button type="button" class="el-del" data-r-act="tdel" data-t-row="${r.id}">Remove</button></td>
    </tr>
    <tr class="rt-msgrow"><td></td><td colspan="${dims.length + 2}" class="rt-msg" data-t-msg="${r.id}"${probs.length ? '' : ' hidden'}>${messages(probs)}</td></tr>`;
  const visibleRows = (cov) => {
    const term = ui.rowQuery.trim().toLowerCase();
    const all = rowsOf(cov).map((r, i) => ({ r, n: i + 1 })).filter(({ r }) => !term || Object.values(r.keys ?? {}).some((v) => String(v).toLowerCase().includes(term)));
    const pages = Math.max(1, Math.ceil(all.length / PAGE));
    ui.page = Math.min(ui.page, pages - 1);
    return { slice: all.slice(ui.page * PAGE, (ui.page + 1) * PAGE), total: all.length, pages };
  };
  // A published version is read-only, but paging through a long table still works.
  const lockIfReadOnly = (scope) => {
    if (readOnly()) scope.querySelectorAll('input,select,textarea,button').forEach((n) => !n.closest('[data-keep]') && (n.disabled = true));
  };
  const renderTerritoryTable = () => {
    if (!$('#rt-tbl')) return;
    const cov = current();
    const dims = dimsOf(cov);
    const infos = dims.map((d) => fieldInfo(d, ctxOf(cov)));
    const probs = territoryProblems(cov, getVersion(), getForms());
    const { slice, total, pages } = visibleRows(cov);
    $('#rt-tbl').innerHTML = `<div class="rt-wrap"><table class="rt-table"><thead><tr><th>#</th>${infos.map((i) => `<th>${esc(i.label)}</th>`).join('')}<th>Flat rate</th><th></th></tr></thead>
      <tbody>${slice.map(({ r, n }) => tRow(r, n, probs.byId.get(r.id) ?? [], dims, infos)).join('') || `<tr><td colspan="${dims.length + 3}"><div class="el-none">${ui.rowQuery ? 'No rows match.' : 'No rates yet.<br>Add a row, or add every combination at once.'}</div></td></tr>`}</tbody></table></div>
      ${pages > 1 ? `<div class="rt-pager" data-keep><button type="button" class="mini" data-r-act="tpage" data-d="-1"${ui.page ? '' : ' disabled'}>‹ Previous</button><span>Page ${ui.page + 1} of ${pages} · ${fmt(total)} rows</span><button type="button" class="mini" data-r-act="tpage" data-d="1"${ui.page < pages - 1 ? '' : ' disabled'}>Next ›</button></div>` : ''}`;
    lockIfReadOnly($('#rt-tbl'));
  };

  // Generate a row for every combination of the values picked for each field.
  const genOff = (id) => (ui.gen.off[id] ??= new Set());
  const genValues = (d, info) => (info.kind === 'zip' ? parseZips(ui.gen.zips).valid : info.options.filter((o) => !genOff(d.id).has(o)));
  const genCombos = (cov) => {
    const dims = dimsOf(cov), ctx = ctxOf(cov);
    const lists = dims.map((d) => genValues(d, fieldInfo(d, ctx)));
    const total = lists.reduce((n, l) => n * l.length, 1);
    if (total === 0) return { total, rows: [] };
    if (total > MAX_GEN) return { total, rows: null };
    let rows = [{}];
    dims.forEach((d, i) => (rows = rows.flatMap((r) => lists[i].map((v) => ({ ...r, [d.id]: v })))));
    return { total, rows };
  };
  const genPreview = (cov) => {
    const note = ui.genMsg ? `<span class="ok">${esc(ui.genMsg)}</span>` : '';
    const { total, rows } = genCombos(cov);
    if (rows === null) return `${note}<span class="e">${fmt(total)} combinations is too many at once. Narrow the selection to ${fmt(MAX_GEN)} or fewer.</span>`;
    const dims = dimsOf(cov);
    const have = new Set(rowsOf(cov).map((r) => tupleKey(dims, r.keys)));
    const fresh = rows.filter((k) => !have.has(tupleKey(dims, k))).length;
    return `${note}<span>${plural(fresh, 'new row')} will be added${rows.length - fresh ? `, ${rows.length - fresh} already exist` : ''}.</span>`;
  };
  const genInner = (cov) => {
    const ctx = ctxOf(cov);
    const fields = dimsOf(cov).map((d) => {
      const info = fieldInfo(d, ctx);
      if (info.kind === 'zip') return `<div><span class="el-h3">${esc(info.label)}</span><textarea class="el-f" rows="3" data-t-genzips placeholder="75001, 75201-75299" aria-label="ZIP codes and ranges">${esc(ui.gen.zips)}</textarea></div>`;
      return `<div><span class="el-h3">${esc(info.label)}</span> <button type="button" class="mini" data-r-act="gall" data-dim-id="${d.id}">All</button> <button type="button" class="mini" data-r-act="gnone" data-dim-id="${d.id}">None</button>
        <div class="el-chips" style="margin-top:6px">${info.options.map((o) => `<button type="button" class="el-chip" data-r-act="gtoggle" data-dim-id="${d.id}" data-v="${esc(o)}" aria-pressed="${!genOff(d.id).has(o)}">${esc(o)}</button>`).join('') || '<span class="muted">No options available yet.</span>'}</div></div>`;
    }).join('');
    return `<span class="el-h3">Add a row for every combination</span>${fields}
      <div class="rt-sum" id="rt-genprev">${genPreview(cov)}</div>
      <div><button type="button" class="action primary" data-r-act="gapply">Add rows</button></div>`;
  };

  const defsPanel = () => {
    const defs = defsOf();
    const probs = territoryDefProblems(getVersion());
    return `<details class="rt-defs" data-r-defs${ui.defsOpen ? ' open' : ''}>
      <summary>Territories <span class="muted" style="margin:0">· ${plural(defs.length, 'territory', 'territories')}, shared by every coverage in this version</span></summary>
      <div class="rt-defs-body">
        ${defs.map((d) => {
          const p = probs.byId.get(d.id) ?? [];
          return `<div class="rt-def" data-d-wrap="${d.id}">
            <div class="rt-def-top">
              <input class="el-f${cell(p, 'code')}" type="text" data-d-in="code" data-d-id="${d.id}" value="${esc(d.code)}" placeholder="Code, e.g. T-014" aria-label="Territory code">
              <input class="el-f" type="text" data-d-in="name" data-d-id="${d.id}" value="${esc(d.name)}" placeholder="Name (optional)" aria-label="Territory name">
              <select class="el-f${cell(p, 'state')}" data-d-in="state" data-d-id="${d.id}" aria-label="State"><option value="">State…</option>${productStates(getVersion()).map((st) => `<option${st === d.state ? ' selected' : ''}>${st}</option>`).join('')}</select>
              <button type="button" class="el-del" data-r-act="ddel" data-d-id="${d.id}">Remove</button>
            </div>
            <textarea class="el-f${cell(p, 'zips')}" rows="2" data-d-in="zips" data-d-id="${d.id}" placeholder="ZIP codes and ranges, e.g. 75001, 75201-75299" aria-label="ZIP codes">${esc(d.zips)}</textarea>
            <div class="rt-msg" data-d-msg="${d.id}"${p.length ? '' : ' hidden'}>${messages(p)}</div>
          </div>`;
        }).join('') || '<div class="el-none">No territories yet. A territory is a state plus a set of ZIP codes.</div>'}
        <button type="button" class="action el-add" data-r-act="dadd">+ Add a territory</button>
      </div></details>`;
  };

  const flatPanel = (cov) => `<div class="rt-src">
      <label class="el-h3" for="rt-flat">Base price</label>
      <div class="rt-cell">$<input id="rt-flat" class="el-f num${num(flatOf(cov).amount) >= 0 ? '' : ' bad'}" type="number" min="0" step="any" data-r-flat value="${esc(flatOf(cov).amount)}" placeholder="e.g. 1,200" aria-label="Base price" style="max-width:200px"></div>
      <div class="rt-msg" id="rt-flatmsg"${blank(flatOf(cov).amount) || num(flatOf(cov).amount) >= 0 ? ' hidden' : ''}><span class="e">Enter a base price of 0 or more.</span></div>
      <p class="muted" style="margin:0">Every quote on this coverage starts from this price. Add rating factors on the next step, such as radius or vehicle age, and combine them with <b>BaseRate</b> in the premium formula.</p>
    </div>`;

  const territoryPanel = (cov) => {
    const t = terr(cov);
    const dims = dimsOf(cov);
    const ctx = ctxOf(cov);
    const infos = dims.map((d) => fieldInfo(d, ctx));
    const probs = territoryProblems(cov, getVersion(), getForms());
    const locs = LOCATION_FIELDS.filter(([v]) => !dims.some((d) => d.type === v));
    const byGroup = {};
    ctx.choices.filter((c) => !dims.some((d) => d.type === 'question' && d.source === c.key)).forEach((c) => (byGroup[c.group] ??= []).push(c));
    const adder = locs.length || Object.keys(byGroup).length
      ? `<select class="el-f" data-t-adddim aria-label="Add a field"><option value="">+ Add a field…</option>
          ${locs.length ? `<optgroup label="Location">${locs.map(([v, l]) => `<option value="loc:${v}">${l}</option>`).join('')}</optgroup>` : ''}
          ${Object.entries(byGroup).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((c) => `<option value="q:${esc(c.key)}">${esc(c.label)}</option>`).join('')}</optgroup>`).join('')}</select>`
      : '';
    const head = `<div class="rt-fields"><span class="el-h3">Rate depends on</span>
      <div class="rt-chips">${dims.map((d, i) => `<span class="rt-chip${infos[i].missing ? ' bad' : ''}">${esc(infos[i].label)}<button type="button" data-r-act="tdimdel" data-dim-id="${d.id}" aria-label="Remove ${esc(infos[i].label)}">✕</button></span>`).join('')}${adder}</div>
      <p class="rt-note">Pick the fields that decide the rate, for example State and Vehicle type. Each row below is one combination of them with a flat rate.${ctx.choices.length ? '' : ' To rate by something like vehicle type, add a dropdown or multiple-choice question for it on the Questions step first.'}</p></div>`;
    if (!dims.length) return `${head}<div class="el-none">Choose at least one field above to start the rate table.</div>`;
    return `${head}
      ${dims.some((d) => d.type === 'territory') ? defsPanel() : ''}
      <div class="el-row rt-tools">
        <button type="button" class="action" data-r-act="tadd">+ Add a row</button>
        <button type="button" class="action" data-r-act="tgen" aria-expanded="${ui.genOpen}">Add all combinations</button>
      </div>
      ${ui.genOpen ? `<div class="rt-import" id="rt-genbox">${genInner(cov)}</div>` : ''}
      <div id="rt-tbl"></div>
      <div class="el-row rt-fill"><span class="el-kw" style="min-width:0">Set every blank rate to</span>
        $<input class="el-f num" type="number" min="0" step="any" data-t-fill aria-label="Rate for blank rows"><button type="button" class="action" data-r-act="tfill">Apply</button></div>
      <div class="rt-default"><div class="el-row"><span class="el-kw" style="min-width:0"><b>All other combinations</b></span>
        <div class="rt-cell">$<input class="el-f num" type="number" min="0" step="any" data-t-default value="${esc(t.defaultRate)}" placeholder="Optional" aria-label="Default flat rate for combinations not listed"></div></div>
        <p class="rt-note">Used for any combination that is not in the table. Leave it blank to have no rate there.</p></div>
      <div class="rt-msg" id="rt-gen"${probs.general.length ? '' : ' hidden'}>${messages(probs.general)}</div>
      <div class="rt-foot"><span class="rt-sum" id="rt-sum">${summary(probs, !rowsOf(cov).length && !probs.general.length)}</span></div>`;
  };

  const copyBar = (cov) => {
    const others = everyCoverage().filter((c) => c.id !== cov.id && rating(c).method);
    return others.length
      ? `<div class="el-row"><span class="el-kw" style="min-width:0">Copy from</span>
          <select class="el-f" id="rt-copy" aria-label="Copy the rating from another coverage"><option value="">Another coverage…</option>${others.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select>
          <button type="button" class="action" data-r-act="copy">Copy rating</button></div>`
      : '';
  };

  const testResult = (cov) => {
    const r = rating(cov);
    const v = num(ui.test);
    if (r.method === 'flat') {
      return num(r.flat.amount) >= 0
        ? `<div class="el-result t-ok">Base price ${usd(r.flat.amount)}<small>Used as BaseRate in the premium formula.</small></div>`
        : '<div class="el-result">Enter a base price to see it here.</div>';
    }
    if (r.method === 'value') {
      if (!(v >= 0)) return '<div class="el-result">Enter a value, for example 50000, to see the rate that applies.</div>';
      const bands = bandsOf(cov);
      const hit = findBand(bands, v);
      if (!hit) return `<div class="el-result t-senior">No band covers ${usd(v)}.<small>Add a band for this value or leave the last To blank.</small></div>`;
      const n = [...bands].sort(byMin).indexOf(hit) + 1;
      return `<div class="el-result t-ok">Premium ${usd(amount(hit.rateType, hit.rate, v))}<small>Band ${n} applies: ${hit.rateType === 'percent' ? `${usd(v)} × ${hit.rate}%` : 'flat amount'}.</small></div>`;
    }
    const t = r.territory;
    const dims = t.dimensions;
    if (!dims.length) return '<div class="el-result">Choose the fields the rate depends on first.</div>';
    const ctx = ctxOf(cov);
    const missing = dims.filter((d) => !String(ui.testVals[d.id] ?? '').trim());
    if (missing.length) return `<div class="el-result">Enter ${esc(missing.map((d) => fieldInfo(d, ctx).label).join(', '))} to see the rate that applies.</div>`;
    const hit = findTerritoryRate(t, ui.testVals);
    if (!hit) return '<div class="el-result t-senior">No rate for this combination.<small>Add a row for it or set a rate for all other combinations.</small></div>';
    return `<div class="el-result t-ok">Premium ${usd(hit.rate)}<small>Flat rate for ${esc(hit.source)}.</small></div>`;
  };

  const testFields = (cov) => {
    const ctx = ctxOf(cov);
    return dimsOf(cov).map((d) => {
      const info = fieldInfo(d, ctx);
      const v = ui.testVals[d.id] ?? '';
      if (info.kind === 'zip') return `<input class="el-f" type="text" data-r-testdim="${d.id}" value="${esc(v)}" placeholder="ZIP, e.g. 75001" aria-label="${esc(info.label)}">`;
      return `<select class="el-f" data-r-testdim="${d.id}" aria-label="${esc(info.label)}"><option value="">${esc(info.label)}…</option>${info.options.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    }).join('');
  };

  const renderEditor = () => {
    const cov = current();
    if (!cov) {
      $('#rt-editor').innerHTML = '<div class="el-none" style="margin:16px">There are no coverages to rate yet. Add coverages on the Components step.</div>';
      return;
    }
    const r = rating(cov);
    const where = groups().find((g) => g.items.includes(cov));
    $('#rt-editor').innerHTML = `
      <div class="el-edh"><h2>${esc(cov.name)}</h2>
        <div class="el-meta"><span class="el-tag">Base rate</span><span>${esc(where?.title ?? '')} · ${esc(where?.sub ?? '')}</span></div></div>
      <fieldset class="plain el-edb">
        <div><span class="el-h3">Rating method</span>
          <div class="el-outcomes" style="margin-top:8px">${Object.entries(RATING_METHODS).map(([key, m]) => `<button type="button" class="el-oc t-uw" data-r-act="method" data-r-v="${key}" aria-pressed="${r.method === key}"${m.ready ? '' : ' disabled'}><b>${m.label}</b><span>${m.hint}</span></button>`).join('')}</div></div>
        ${r.method === 'value' ? valuePanel(cov) : r.method === 'flat' ? flatPanel(cov) : r.method === 'territory' ? territoryPanel(cov) : '<div class="el-none">Choose how this coverage is rated.</div>'}
        ${copyBar(cov)}
      </fieldset>
      ${r.method ? `<div class="el-test"><span class="el-h3">${r.method === 'flat' ? 'Result' : 'Try it out'}</span>
        ${r.method === 'flat' ? '' : `<div class="el-row">
          ${r.method === 'territory' ? testFields(cov) : `<input class="el-f num" type="number" min="0" step="any" data-r-test value="${esc(ui.test)}" placeholder="Value, e.g. 50000" aria-label="Sample value">`}
        </div>`}
        <div id="rt-testres">${testResult(cov)}</div></div>` : ''}`;
    if (r.method === 'territory') renderTerritoryTable();
    lockIfReadOnly($('.el-edb'));
  };

  // Light refresh keeps typing focus: only messages, outlines, counts and the tester change.
  const setClass = (node, base, probs, field) => {
    if (node && node.tagName !== 'TEXTAREA') node.className = `${base}${cell(probs, field)}`;
  };
  const refreshLight = () => {
    const cov = current();
    const r = rating(cov);
    if (r.method === 'value') {
      const bands = bandsOf(cov);
      const probs = bandProblems(bands);
      bands.forEach((b) => {
        const list = probs.byId.get(b.id) ?? [];
        const msg = $(`[data-r-msg="${b.id}"]`);
        if (msg) {
          msg.innerHTML = messages(list);
          msg.hidden = !list.length;
        }
        root.querySelectorAll(`[data-r-band="${b.id}"][data-r-in]`).forEach((input) => input.tagName === 'INPUT' && (input.className = `el-f num${cell(list, input.dataset.rIn)}`));
      });
      $('#rt-sum').innerHTML = summary(probs, !bands.length);
    } else if (r.method === 'territory') {
      const probs = territoryProblems(cov, getVersion(), getForms());
      visibleRows(cov).slice.forEach(({ r: row }) => {
        const list = probs.byId.get(row.id) ?? [];
        const msg = $(`[data-t-msg="${row.id}"]`);
        if (msg) {
          msg.innerHTML = messages(list);
          msg.hidden = !list.length;
        }
        root.querySelectorAll(`[data-t-row="${row.id}"][data-t-in]`).forEach((input) => setClass(input, input.dataset.tIn === 'rate' ? 'el-f num' : 'el-f', list, input.dataset.tIn === 'rate' ? 'rate' : input.dataset.tDim));
      });
      const gen = $('#rt-gen');
      if (gen) {
        gen.innerHTML = messages(probs.general);
        gen.hidden = !probs.general.length;
        $('#rt-sum').innerHTML = summary(probs, !rowsOf(cov).length && !probs.general.length);
      }
      if (dimsOf(cov).some((d) => d.type === 'territory')) {
        const defProbs = territoryDefProblems(getVersion());
        defsOf().forEach((d) => {
          const list = defProbs.byId.get(d.id) ?? [];
          const msg = $(`[data-d-msg="${d.id}"]`);
          if (msg) {
            msg.innerHTML = messages(list);
            msg.hidden = !list.length;
          }
          root.querySelectorAll(`[data-d-id="${d.id}"][data-d-in]`).forEach((input) => setClass(input, 'el-f', list, input.dataset.dIn));
        });
      }
    }
    if (r.method === 'flat') {
      const msg = $('#rt-flatmsg');
      const bad = !blank(flatOf(cov).amount) && !(num(flatOf(cov).amount) >= 0);
      if (msg) msg.hidden = !bad;
      $('#rt-flat')?.classList.toggle('bad', bad);
    }
    const res = $('#rt-testres');
    if (res) res.innerHTML = testResult(cov);
    renderStrip();
    renderList();
  };
  const refreshAll = () => {
    renderStrip();
    renderList();
    renderEditor();
  };

  const all = everyCoverage();
  ui.selected = (all.find((c) => status(c).tone !== 'ok') ?? all[0])?.id ?? null;

  root.innerHTML = `
    <div class="el-strip" id="rt-strip"></div>
    <div class="el-grid">
      <section class="el-panel" aria-label="Coverages">
        <div class="el-panelh">
          <h3 class="el-title">Coverages</h3>
          <input class="el-search" id="rt-search" type="search" placeholder="Search coverages" aria-label="Search coverages">
          <div class="el-seg" id="rt-filter">
            <button type="button" data-r-f="all" aria-pressed="true">All</button>
            <button type="button" data-r-f="todo" aria-pressed="false">Needs attention</button>
          </div>
        </div>
        <div class="el-list" id="rt-list"></div>
      </section>
      <section class="el-panel" id="rt-editor" aria-live="polite"></section>
    </div>`;
  refreshAll();

  const resetView = () => Object.assign(ui, { test: '', testVals: {}, rowQuery: '', page: 0, genOpen: false, gen: { off: {}, zips: '' }, genMsg: '' });

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-r-q],[data-r-act],[data-r-f]');
    if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.rF) {
      ui.filter = d.rF;
      root.querySelectorAll('#rt-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      return renderList();
    }
    if (d.rQ) {
      ui.selected = d.rQ;
      resetView();
      renderList();
      return renderEditor();
    }
    const cov = current();
    // Allowed on a published version: paging only reads.
    if (d.rAct === 'tpage') {
      ui.page += Number(d.d);
      return renderTerritoryTable();
    }
    if (readOnly()) return;
    const bands = bandsOf(cov);
    const at = bands.findIndex((b) => b.id === d.rBand);
    let focus = null;
    let focusTerritory = null;
    if (d.rAct === 'method') {
      if (!RATING_METHODS[d.rV]?.ready) return;
      rating(cov).method = d.rV;
      resetView();
    } else if (d.rAct === 'add') {
      const last = [...bands].sort(byMin).pop();
      const band = { id: newId(), min: last && !blank(last.max) ? last.max : '', max: '', rateType: last?.rateType ?? 'percent', rate: '' };
      bands.push(band);
      focus = band.id;
    } else if (d.rAct === 'next' && at >= 0) {
      const from = bands[at];
      const band = { id: newId(), min: from.max, max: '', rateType: from.rateType, rate: from.rate };
      bands.splice(at + 1, 0, band);
      focus = band.id;
    } else if (d.rAct === 'del' && at >= 0) {
      bands.splice(at, 1);
    } else if (d.rAct === 'copy') {
      const source = everyCoverage().find((c) => c.id === $('#rt-copy').value);
      if (!source) return;
      if (({ value: bands.length, flat: Number(!blank(flatOf(cov).amount)) }[rating(cov).method] ?? rowsOf(cov).length) && !confirm(`Replace the rating on ${cov.name} with the rating from ${source.name}?`)) return;
      const from = clone(rating(source));
      const withIds = (list) => (list ?? []).map((x) => ({ ...x, id: newId() }));
      from.value.bands = withIds(from.value.bands);
      // Fields that use a question this coverage cannot see are left out; the others get new ids.
      const choices = ctxOf(cov).choices;
      const kept = (from.territory?.dimensions ?? []).filter((d) => d.type !== 'question' || choices.some((c) => c.key === d.source));
      const fresh = new Map(kept.map((d) => [d.id, newId()]));
      from.territory = {
        defaultRate: from.territory?.defaultRate ?? '',
        dimensions: kept.map((d) => ({ ...d, id: fresh.get(d.id) })),
        rows: (from.territory?.rows ?? []).map((r) => ({ id: newId(), rate: r.rate, keys: Object.fromEntries(kept.map((d) => [fresh.get(d.id), r.keys?.[d.id] ?? ''])) })),
      };
      if (!sourcesOf(cov).some((s) => s.key === from.valueSource)) from.valueSource = '';
      cov.rating = from;
      resetView();
    } else if (d.rAct === 'tadd') {
      const row = { id: newId(), keys: Object.fromEntries(dimsOf(cov).map((x) => [x.id, ''])), rate: '' };
      rowsOf(cov).push(row);
      ui.rowQuery = '';
      ui.page = Math.floor((rowsOf(cov).length - 1) / PAGE);
      focusTerritory = row.id;
    } else if (d.rAct === 'tdel') {
      const rows = rowsOf(cov);
      rows.splice(rows.findIndex((r) => r.id === d.tRow), 1);
    } else if (d.rAct === 'tdimdel') {
      const dim = dimsOf(cov).find((x) => x.id === d.dimId);
      if (!dim) return;
      if (rowsOf(cov).length && !confirm(`Remove “${fieldInfo(dim, ctxOf(cov)).label}” from this table? Its column is dropped from every row.`)) return;
      terr(cov).dimensions = dimsOf(cov).filter((x) => x !== dim);
      rowsOf(cov).forEach((r) => delete r.keys?.[dim.id]);
    } else if (d.rAct === 'tgen') {
      ui.genOpen = !ui.genOpen;
      ui.genMsg = '';
      return renderEditor();
    } else if (['gtoggle', 'gall', 'gnone'].includes(d.rAct)) {
      const dim = dimsOf(cov).find((x) => x.id === d.dimId);
      const off = genOff(d.dimId);
      if (d.rAct === 'gtoggle') off.has(d.v) ? off.delete(d.v) : off.add(d.v);
      else if (d.rAct === 'gall') off.clear();
      else fieldInfo(dim, ctxOf(cov)).options.forEach((o) => off.add(o));
      ui.genMsg = '';
      $('#rt-genbox').innerHTML = genInner(cov);
      return;
    } else if (d.rAct === 'gapply') {
      const { rows: combos } = genCombos(cov);
      if (!combos?.length) return;
      const dims = dimsOf(cov);
      const have = new Set(rowsOf(cov).map((r) => tupleKey(dims, r.keys)));
      let added = 0;
      combos.forEach((keys) => {
        const k = tupleKey(dims, keys);
        if (have.has(k)) return;
        have.add(k);
        rowsOf(cov).push({ id: newId(), keys, rate: '' });
        added += 1;
      });
      Object.assign(ui, { genMsg: `Added ${plural(added, 'row')}. Fill in the rates below, or use “Set every blank rate to”.`, rowQuery: '' });
    } else if (d.rAct === 'tfill') {
      const value = $('[data-t-fill]').value;
      if (!(num(value) >= 0)) return;
      rowsOf(cov).forEach((r) => blank(r.rate) && (r.rate = value));
    } else if (d.rAct === 'dadd') {
      defsOf().push({ id: newId(), code: '', name: '', state: '', zips: '' });
      ui.defsOpen = true;
    } else if (d.rAct === 'ddel') {
      const def = defsOf().find((x) => x.id === d.dId);
      const used = everyCoverage().filter((c) => {
        const ids = dimsOf(c).filter((x) => x.type === 'territory').map((x) => x.id);
        return def.code && rowsOf(c).some((r) => ids.some((id) => r.keys?.[id] === def.code));
      }).length;
      if (used && !confirm(`${def.code} is used by ${plural(used, 'coverage')}. Remove it and leave those rates without a territory?`)) return;
      getVersion().territories = defsOf().filter((x) => x.id !== d.dId);
    } else return;
    changed();
    refreshAll();
    if (focus) $(`[data-r-row="${focus}"] [data-r-in="min"]`)?.focus();
    if (focusTerritory) $(`[data-t-rowwrap="${focusTerritory}"] [data-t-in="key"]`)?.focus();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (readOnly()) return;
    const cov = current();
    if (t.dataset.rSource !== undefined) {
      rating(cov).valueSource = t.value;
      changed();
      return refreshAll();
    }
    if (t.dataset.tAdddim !== undefined) {
      if (!t.value) return;
      const dim = t.value.startsWith('loc:') ? { id: newId(), type: t.value.slice(4) } : { id: newId(), type: 'question', source: t.value.slice(2) };
      dimsOf(cov).push(dim);
      rowsOf(cov).forEach((r) => ((r.keys ??= {})[dim.id] = ''));
      changed();
      return refreshAll();
    }
    if (t.dataset.tIn === 'key' && t.tagName === 'SELECT') {
      const row = rowsOf(cov).find((r) => r.id === t.dataset.tRow);
      (row.keys ??= {})[t.dataset.tDim] = t.value;
      changed();
      return refreshLight();
    }
    if (t.dataset.dIn === 'state') {
      defsOf().find((d) => d.id === t.dataset.dId).state = t.value;
      changed();
      return refreshLight();
    }
    if (t.dataset.dIn === 'code') {
      // Rates point at a territory by its code, so renaming it renames them too.
      const def = defsOf().find((d) => d.id === t.dataset.dId);
      const next = t.value.trim();
      const old = def.code;
      def.code = next;
      if (old) {
        everyCoverage().forEach((c) => {
          const ids = dimsOf(c).filter((x) => x.type === 'territory').map((x) => x.id);
          rowsOf(c).forEach((r) => ids.forEach((id) => r.keys?.[id] === old && (r.keys[id] = next)));
        });
      }
      changed();
      return refreshAll();
    }
    if (t.dataset.rIn === undefined) return;
    const bands = bandsOf(cov);
    if (t.dataset.rIn === 'rateType') {
      bands.find((b) => b.id === t.dataset.rBand).rateType = t.value;
      changed();
      return refreshAll();
    }
    // Keep the table in From order, but only redraw it when a row actually moved so Tab keeps working.
    const before = bands.map((b) => b.id).join();
    bands.sort(byMin);
    if (bands.map((b) => b.id).join() !== before) {
      changed();
      refreshAll();
    }
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    const d = t.dataset;
    if (d.rTest !== undefined) {
      ui.test = t.value;
      return ($('#rt-testres').innerHTML = testResult(current()));
    }
    if (d.rTestdim !== undefined) {
      ui.testVals[d.rTestdim] = t.value;
      return ($('#rt-testres').innerHTML = testResult(current()));
    }
    if (d.tGenzips !== undefined) {
      ui.gen.zips = t.value;
      ui.genMsg = '';
      return ($('#rt-genprev').innerHTML = genPreview(current()));
    }
    if (t.id === 'rt-search') {
      ui.query = t.value;
      return renderList();
    }
    if (readOnly()) return;
    const cov = current();
    if (d.rFlat !== undefined) flatOf(cov).amount = t.value;
    else if (d.rIn && t.tagName === 'INPUT') bandsOf(cov).find((b) => b.id === d.rBand)[d.rIn] = t.value;
    else if (d.tIn === 'rate' && t.tagName === 'INPUT') rowsOf(cov).find((r) => r.id === d.tRow).rate = t.value;
    else if (d.tIn === 'key' && t.tagName === 'INPUT') (rowsOf(cov).find((r) => r.id === d.tRow).keys ??= {})[d.tDim] = t.value;
    else if (d.tDefault !== undefined) terr(cov).defaultRate = t.value;
    else if (d.dIn && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') && d.dIn !== 'code') defsOf().find((x) => x.id === d.dId)[d.dIn] = t.value;
    else return;
    changed();
    refreshLight();
  });

  root.addEventListener('toggle', (e) => {
    if (e.target.dataset?.rDefs !== undefined) ui.defsOpen = e.target.open;
  }, true);
};
