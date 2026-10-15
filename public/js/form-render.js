export const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderControl(q, suffix = '') {
  const name = `q_${q.id}${suffix}`;
  const req = q.required ? ' required' : '';
  switch (q.type) {
    case 'textarea': return `<textarea class="ac-textarea" name="${name}"${req}></textarea>`;
    case 'number': return `<input class="ac-input" type="number" name="${name}"${req}>`;
    case 'currency': return `<input class="ac-input" type="number" min="0" step="0.01" placeholder="$" name="${name}"${req}>`;
    case 'date': return `<input class="ac-input" type="date" name="${name}"${req}>`;
    case 'dropdown': return `<select class="ac-select" name="${name}"${req}><option value="">Select…</option>${q.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`;
    case 'radio': return `<div class="ac-choices">${q.options.map((o) => `<label class="ac-choice"><input type="radio" name="${name}" value="${esc(o)}"${req}> ${esc(o)}</label>`).join('')}</div>`;
    case 'yesno': return `<div class="ac-choices inline">${['Yes', 'No'].map((o) => `<label class="ac-choice"><input type="radio" name="${name}" value="${o}"${req}> ${o}</label>`).join('')}</div>`;
    case 'checkboxes': return `<div class="ac-choices">${q.options.map((o) => `<label class="ac-choice"><input type="checkbox" name="${name}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</div>`;
    case 'checkbox': return `<label class="ac-choice"><input type="checkbox" name="${name}"${req}> ${esc(q.label || 'Untitled question')}${q.required ? '<span class="req">*</span>' : ''}</label>`;
    default: return `<input class="ac-input" type="text" name="${name}"${req}>`;
  }
}

let instanceSeq = 0;

export function renderInstance(s, removable) {
  const suffix = `_${++instanceSeq}`;
  const body = `
    <div class="ac-grid" style="--cols:${s.columns || 1}">
    ${s.questions.map((q) => `
      <div class="ac-preview-q ac-field">
        ${q.type === 'checkbox' ? '' : `<label class="ac-label">${esc(q.label || 'Untitled question')}${q.required ? '<span class="req">*</span>' : ''}</label>`}
        ${renderControl(q, suffix)}
        ${q.help ? `<div class="ac-help">${esc(q.help)}</div>` : ''}
      </div>`).join('')}
    </div>`;
  if (!s.repeatable) return body;
  return `<div class="ac-instance">
    <div class="ac-instance-head"><strong class="ac-instance-title"></strong>${removable ? '<button type="button" class="ac-icon danger" data-act="inst-del">Remove</button>' : ''}</div>${body}</div>`;
}

export function renderPreviewSection(s, si) {
  if (!s.repeatable) {
    return `<section class="card ac-section"><div class="card-title" style="margin-bottom:14px">${esc(s.title)}</div>${renderInstance(s)}</section>`;
  }
  return `<section class="card ac-section ac-repeat" data-si="${si}">
    <div class="card-title" style="margin-bottom:14px">${esc(s.title)}</div>
    <div class="ac-instances">${renderInstance(s, false)}</div>
    <button type="button" class="btn sm" data-act="inst-add">+ Add ${esc(s.itemLabel || 'item')}</button></section>`;
}

export function numberInstances(sec, sections) {
  const label = sections[sec.dataset.si].itemLabel || 'Item';
  sec.querySelectorAll('.ac-instance').forEach((el, i) => {
    el.querySelector('.ac-instance-title').textContent = `${label} ${i + 1}`;
    el.querySelector('.ac-instance-head').style.display = '';
  });
}

