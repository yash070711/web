// "Add question" dialog shared by the stages (eligibility rules, rating factors).
// Two ways in: pick questions that already exist in the product (from its forms or its own questions) and are not
// yet in this stage, or create a new product / coverage question without leaving the stage.
import { esc, allCoverages, blankQuestion, QUESTION_TYPES, QUESTION_HAS_OPTIONS } from './product-model.js';
import { USES, RATING_TYPES } from './question-uses.js';

const TYPE_LABEL = Object.fromEntries(QUESTION_TYPES.map((t) => [t.value, t.label]));

// groups: [{ title, sub, qs: [{ key, label, type, uses(), setUses() }] }], every question of the version.
// onAdded(keys) runs after the changes are made; the stage then refreshes itself.
export const openAddQuestion = ({ use, groups, getVersion, onAdded }) => {
  const stage = USES.find((u) => u.key === use);
  const ui = {
    tab: 'existing',
    query: '',
    picked: new Set(),
    cats: { eligibility: false, rating: false, account: false, [use]: true },
    scope: 'product',
    draft: blankQuestion(),
    errors: [],
  };
  const dlg = document.createElement('dialog');
  dlg.setAttribute('aria-labelledby', 'aq-title');
  document.body.append(dlg);

  const scopes = () => [
    { value: 'product', label: 'Whole product' },
    ...getVersion().components.flatMap((c) =>
      c.classes.flatMap((k) => k.coverages.map((cov) => ({ value: cov.id, label: `${c.name} › ${k.name} › ${cov.name}` }))),
    ),
  ];
  const fits = (q) => use !== 'rating' || RATING_TYPES.includes(q.type);
  // Questions not yet in this stage.
  const available = () => {
    const term = ui.query.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, qs: g.qs.filter((q) => !q.uses()[use] && fits(q) && (!term || q.label.toLowerCase().includes(term))) }))
      .filter((g) => g.qs.length);
  };
  const find = (key) => groups.flatMap((g) => g.qs).find((q) => q.key === key);

  const catBoxes = () => `<div class="field-group"><span class="el-h3">Use this question for</span>
    ${USES.map((u) => `<label class="check-row"><input type="checkbox" data-aq-cat="${u.key}"${ui.cats[u.key] ? ' checked' : ''}${u.key === use ? ' disabled' : ''}>
      <span><strong>${u.label}</strong>${u.key === use ? ' <small>(this stage)</small>' : `<small>${u.hint}</small>`}</span></label>`).join('')}</div>`;

  const existingTab = () => {
    const list = available();
    return `<input class="search-box" type="search" data-aq-q placeholder="Search questions" aria-label="Search questions" value="${esc(ui.query)}" style="width:100%;margin:12px 0">
      <div style="max-height:260px;overflow:auto;border:1px solid #dce3eb;border-radius:6px;padding:4px 12px" data-aq-list>
        ${list.length
          ? list.map((g) => `<div class="ws-sub" style="margin-top:8px">${esc(g.title)} <small>${esc(g.sub)}</small></div>` +
              g.qs.map((q) => `<label class="check-row"><input type="checkbox" data-aq-pick="${esc(q.key)}"${ui.picked.has(q.key) ? ' checked' : ''}><span><strong>${esc(q.label || 'Untitled question')}</strong><small>${esc(TYPE_LABEL[q.type] ?? 'Text')}</small></span></label>`).join('')).join('')
          : `<div class="wiz-note" style="margin:10px 0">${ui.query ? 'No questions match.' : `Every ${use === 'rating' ? 'suitable ' : ''}question is already in this stage. Create a new one instead.`}</div>`}
      </div>`;
  };

  const newTab = () => {
    const q = ui.draft;
    return `<div class="fields" style="margin-top:12px">
      <div class="field full"><label for="aq-scope">Applies to</label>
        <select class="search-box" id="aq-scope" data-aq-scope>${scopes().map((s) => `<option value="${esc(s.value)}"${s.value === ui.scope ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select></div>
      <div class="field full"><label for="aq-label">Question text *</label>
        <input class="search-box" id="aq-label" data-aq-f="label" maxlength="200" value="${esc(q.label)}" autocomplete="off"></div>
      <div class="field"><label for="aq-type">Answer type</label>
        <select class="search-box" id="aq-type" data-aq-type>${QUESTION_TYPES.map((t) => `<option value="${t.value}"${t.value === q.type ? ' selected' : ''}>${t.label}</option>`).join('')}</select></div>
      <div class="field"><label>&nbsp;</label><label class="ac-choice"><input type="checkbox" data-aq-req${q.required ? ' checked' : ''}> Required</label></div>
      ${QUESTION_HAS_OPTIONS.includes(q.type) ? `<div class="field full"><label for="aq-opts">Options — one per line *</label>
        <textarea class="search-box" id="aq-opts" data-aq-opts rows="4" placeholder="Option 1&#10;Option 2">${esc(q.options.join('\n'))}</textarea></div>` : ''}
      <div class="field full"><label for="aq-help">Help text (optional)</label>
        <input class="search-box" id="aq-help" data-aq-f="help" value="${esc(q.help)}" autocomplete="off"></div>
    </div>`;
  };

  const paint = () => {
    dlg.innerHTML = `<form class="card" method="dialog" novalidate style="width:min(680px,94vw);max-height:90vh;overflow:auto">
      <div class="section-meta">${stage.label}</div>
      <h2 id="aq-title">Add a question</h2>
      <div class="val-summary" ${ui.errors.length ? '' : 'hidden'}><ul>${ui.errors.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
      <div class="el-seg" role="tablist" style="margin-top:8px">
        <button type="button" data-aq-tab="existing" aria-pressed="${ui.tab === 'existing'}">From existing questions</button>
        <button type="button" data-aq-tab="new" aria-pressed="${ui.tab === 'new'}">New question</button>
      </div>
      ${ui.tab === 'existing' ? existingTab() : newTab()}
      ${catBoxes()}
      <div class="actions field-group">
        <button type="button" class="action primary" data-aq-save>${ui.tab === 'existing' ? `Add ${ui.picked.size || ''} to this stage`.replace('  ', ' ') : 'Create and add'}</button>
        <button type="button" class="action" data-aq-cancel>Cancel</button>
      </div>
    </form>`;
  };

  const close = () => {
    dlg.close();
    dlg.remove();
  };

  const submit = () => {
    const errors = [];
    const on = Object.entries(ui.cats).filter(([, v]) => v).map(([k]) => k);
    if (ui.tab === 'existing') {
      if (!ui.picked.size) errors.push('Pick at least one question.');
      if (ui.cats.rating) [...ui.picked].map(find).filter((q) => q && !RATING_TYPES.includes(q.type)).forEach((q) => errors.push(`“${q.label}” has a ${TYPE_LABEL[q.type] ?? 'text'} answer, which cannot carry a rating factor.`));
      ui.errors = errors;
      if (errors.length) return paint();
      const keys = [...ui.picked];
      keys.forEach((key) => {
        const q = find(key);
        q.setUses({ ...q.uses(), ...Object.fromEntries(on.map((k) => [k, true])) });
      });
      close();
      return onAdded(keys);
    }
    const q = ui.draft;
    const version = getVersion();
    const cov = ui.scope === 'product' ? null : allCoverages(version.components).find((c) => c.id === ui.scope);
    const list = cov ? (cov.questions ??= []) : (version.questions ??= []);
    if (!q.label.trim()) errors.push('Enter the question text.');
    else if (list.some((x) => String(x.label).trim().toLowerCase() === q.label.trim().toLowerCase())) errors.push('A question with this text already exists there. Add it from the existing questions instead.');
    if (QUESTION_HAS_OPTIONS.includes(q.type) && !q.options.length) errors.push('Add at least one option.');
    if (ui.cats.rating && !RATING_TYPES.includes(q.type)) errors.push('A rating factor needs a choice, Yes / No, number or currency answer.');
    ui.errors = errors;
    if (errors.length) return paint();
    const made = { ...q, label: q.label.trim(), uses: Object.fromEntries(USES.map((u) => [u.key, ui.cats[u.key]])) };
    list.push(made);
    close();
    onAdded([cov ? `c:${cov.id}:${made.id}` : `p:${made.id}`]);
  };

  dlg.addEventListener('click', (e) => {
    const t = e.target;
    if (t.dataset.aqTab) {
      ui.tab = t.dataset.aqTab;
      ui.errors = [];
      paint();
    } else if (t.dataset.aqSave !== undefined) submit();
    else if (t.dataset.aqCancel !== undefined) close();
  });
  dlg.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.aqQ !== undefined) {
      ui.query = t.value;
      const box = dlg.querySelector('[data-aq-list]');
      const holder = document.createElement('div');
      ui.query = t.value;
      holder.innerHTML = existingTab();
      box.replaceWith(holder.querySelector('[data-aq-list]'));
    } else if (t.dataset.aqF) ui.draft[t.dataset.aqF] = t.value;
    else if (t.dataset.aqOpts !== undefined) ui.draft.options = t.value.split('\n').map((o) => o.trim()).filter(Boolean);
  });
  dlg.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.aqPick) {
      t.checked ? ui.picked.add(t.dataset.aqPick) : ui.picked.delete(t.dataset.aqPick);
      dlg.querySelector('[data-aq-save]').textContent = `Add ${ui.picked.size || ''} to this stage`.replace('  ', ' ');
    } else if (t.dataset.aqCat) ui.cats[t.dataset.aqCat] = t.checked;
    else if (t.dataset.aqScope !== undefined) ui.scope = t.value;
    else if (t.dataset.aqType !== undefined) {
      ui.draft.type = t.value;
      paint();
    } else if (t.dataset.aqReq !== undefined) ui.draft.required = t.checked;
  });
  dlg.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });
  dlg.addEventListener('cancel', () => dlg.remove());

  paint();
  dlg.showModal();
};
