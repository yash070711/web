import { api } from './api.js';

const productsApi = api('products');
const carriersApi = api('carriers');
const reinsurersApi = api('reinsurers');
const channelsApi = api('channels');
const coveragesApi = api('coverages');
const distributionApi = api('distribution');

const el = (id) => document.getElementById(id);
const dom = {
  productSelect: el('productSelect'),
  sumProduct: el('sumProduct'),
  sumProductVersion: el('sumProductVersion'),
  sumCarrier: el('sumCarrier'),
  sumCarrierHint: el('sumCarrierHint'),
  sumScope: el('sumScope'),
  sumScopeHint: el('sumScopeHint'),
  studioNav: document.querySelector('.studio-nav'),
  stepTitle: el('stepTitle'),
  stepSubtitle: el('stepSubtitle'),
  stepBody: el('stepBody'),
  stepStatus: el('stepStatus'),
  stepCancel: el('stepCancel'),
  stepSave: el('stepSave'),
  footerProduct: el('footerProduct'),
  modal: el('addChannelModal'),
  form: el('addChannelForm'),
  channelType: el('addChannelType'),
  channelId: el('addChannelName'),
  modalHint: el('addChannelHint'),
  modalNote: el('addChannelNote'),
  toast: el('toast'),
  sidebar: el('sidebar'),
};

const COMMISSION_DEFAULT = { MGU: 12, MGA: 10, Broker: 8, Agent: 6 };
const TREATIES = ['Quota Share', 'Surplus Share', 'Treaty Reinsurance', 'Retrocession', 'Facultative Placement'];

const state = {
  products: [],
  carriers: [],
  reinsurers: [],
  channels: [],
  coverages: [],
  records: [],
  productId: '',
  step: 1,
  subTab: 1,
  activeReinsurerId: '',
  recordId: null,
  createdAt: null,
  status: 'draft',
  draft: { reinsurance: [], channels: [] },
};

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const normalise = (value) => String(value ?? '').toLowerCase();
const isApproved = (row) => normalise(row.status) === 'approved';
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usd = (value) => money.format(Number(value) || 0);
const percent = (value) => `${round(value)}%`;
const today = () => new Date().toISOString().slice(0, 10);

const currentProduct = () => state.products.find((row) => row.id === state.productId) ?? null;
const currentRecord = () => state.records.find((row) => row.productId === state.productId) ?? null;
const currentCarrier = () => {
  const product = currentProduct();
  return state.carriers.find((row) => row.id === product?.carrierId) ?? null;
};
const reinsurer = (id) => state.reinsurers.find((row) => row.id === id) ?? null;
const channel = (id) => state.channels.find((row) => row.id === id) ?? null;

const cededShare = () => round(state.draft.reinsurance.reduce((sum, row) => sum + (Number(row.share) || 0), 0));
const retainedShare = () => round(100 - cededShare());
const grantedLimit = () => round(state.draft.channels.reduce((sum, row) => sum + (Number(row.authorityLimit) || 0), 0));
const weightedCommission = () => {
  const total = grantedLimit();
  if (!total) return 0;
  const weighted = state.draft.channels.reduce(
    (sum, row) => sum + (Number(row.authorityLimit) || 0) * (Number(row.commission) || 0),
    0,
  );
  return round(weighted / total);
};

const bindingLimit = () => {
  const carrier = currentCarrier();
  const product = currentProduct();
  const limits = asList(product?.coverageIds)
    .map((id) => Number(carrier?.maxBindingLimits?.[id]) || 0)
    .filter(Boolean);
  return limits.length ? Math.max(...limits) : 250000;
};

let toastTimer;
const toast = (message, kind = 'ok') => {
  dom.toast.textContent = message;
  dom.toast.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.className = 'toast';
  }, 2800);
};

const setStatus = (message, kind = '') => {
  dom.stepStatus.className = `status-line ${kind}`.trim();
  dom.stepStatus.textContent = message;
};

const optionHtml = (values, placeholder) =>
  [
    `<option value="">${esc(placeholder)}</option>`,
    ...values.map((value) => `<option value="${esc(value.value ?? value)}">${esc(value.label ?? value)}</option>`),
  ].join('');

const clearErrors = () => {
  dom.form.querySelectorAll('.err').forEach((node) => {
    node.textContent = '';
  });
  dom.form.querySelectorAll('.input.invalid').forEach((node) => node.classList.remove('invalid'));
};

const setError = (name, message) => {
  const slot = dom.form.querySelector(`[data-err="${name}"]`);
  if (slot) slot.textContent = message;
  const input = dom.form.elements[name];
  if (input && input.classList.contains('input')) input.classList.add('invalid');
};

const renderSummary = () => {
  const product = currentProduct();
  const carrier = currentCarrier();
  if (!product) {
    dom.sumProduct.textContent = '—';
    dom.sumProductVersion.textContent = 'Select a product to configure';
    dom.sumCarrier.textContent = '—';
    dom.sumCarrierHint.textContent = 'No carrier assigned';
    dom.sumScope.textContent = '—';
    dom.sumScopeHint.textContent = 'No coverages attached';
    dom.footerProduct.textContent = 'Distribution';
    return;
  }
  const coverageIds = asList(product.coverageIds);
  const names = coverageIds
    .map((id) => state.coverages.find((row) => row.id === id)?.name)
    .filter(Boolean);
  const authorities = asList(product.coverageIds).filter((id) => Number(carrier?.maxBindingLimits?.[id]) > 0);
  dom.sumProduct.textContent = product.name;
  dom.sumProductVersion.textContent = `Version ${product.version ?? '—'} · ${state.status === 'configured' ? 'Configured' : 'Draft'} · ${product.id}`;
  dom.sumCarrier.textContent = carrier?.name ?? 'Unassigned';
  dom.sumCarrierHint.textContent = carrier
    ? `${normalise(carrier.status) === 'active' ? 'Active' : 'Inactive'} · ${authorities.length} binding authority limit(s)`
    : 'No carrier record for this product';
  dom.sumScope.textContent = product.scope || '—';
  dom.sumScopeHint.textContent = names.length
    ? `${coverageIds.length} coverage(s): ${names.join(', ')}`
    : `${coverageIds.length} coverage(s) attached`;
  dom.footerProduct.textContent = product.name;
};

const allocationTotalsHtml = () => {
  const ceded = clamp(cededShare(), 0, 100);
  const over = cededShare() > 100;
  return `<div class="share-bar"><i class="ceded" style="width:${ceded}%"></i><i class="retained" style="width:${100 - ceded}%"></i></div>
    <div class="legend">
      <span><i class="ceded" style="background:#1b2635"></i>Ceded ${percent(cededShare())}</span>
      <span><i class="retained" style="background:#ed883e"></i>Retained ${percent(retainedShare())}</span>
    </div>
    <div class="totals">
      <div>Treaties in force<strong>${state.draft.reinsurance.length}</strong></div>
      <div>Ceded risk share<strong${over ? ' style="color:#a3261f"' : ''}>${percent(cededShare())}</strong></div>
      <div>Carrier retained<strong${retainedShare() < 0 ? ' style="color:#a3261f"' : ''}>${percent(retainedShare())}</strong></div>
    </div>`;
};

const grantTotalsHtml = () => {
  const limit = bindingLimit();
  const total = grantedLimit();
  const breach = total > limit;
  return `<div class="totals">
    <div>Channels in authority<strong>${state.draft.channels.length}</strong></div>
    <div>Total authority granted<strong${breach ? ' style="color:#a3261f"' : ''}>${usd(total)}</strong></div>
    <div>Weighted commission<strong>${percent(weightedCommission())}</strong></div>
  </div>
  <div class="guidance" style="margin-top:14px">${esc(
    breach
      ? `Combined authority exceeds the carrier maximum binding limit of ${usd(limit)}. Reduce a channel limit before completing distribution.`
      : `Carrier maximum binding limit ${usd(limit)} · ${usd(Math.max(0, limit - total))} headroom remaining.`,
  )}</div>`;
};

const renderReinsurance = () => {
  const rows = state.draft.reinsurance;
  if (!rows.some((row) => row.reinsurerId === state.activeReinsurerId)) {
    state.activeReinsurerId = rows[0]?.reinsurerId ?? '';
  }
  const entry = rows.find((row) => row.reinsurerId === state.activeReinsurerId) ?? null;
  const party = entry ? reinsurer(entry.reinsurerId) : null;
  const label = party?.name || entry?.name || '—';
  const used = new Set(rows.map((row) => row.reinsurerId));
  const available = state.reinsurers.filter((row) => isApproved(row) && !used.has(row.id));
  const sub = state.subTab;

  const tabs = `<div class="sub-tabs" role="tablist" aria-label="Reinsurance allocation">
    ${[['1', 'Insurer'], ['2', 'Treaty'], ['3', 'Risk share %']]
      .map(([id, text]) => `<button type="button" role="tab" aria-selected="${sub === Number(id)}" data-subtab="${id}" class="${sub === Number(id) ? 'active' : ''}">${id}. ${esc(text)}</button>`)
      .join('')}
  </div>`;

  const blank = '<div class="empty">Add an approved reinsurer in the Insurer tab to continue.<br>Treaty and risk share apply to the selected reinsurer.</div>';

  const insurerPanel = `<div class="sub-row">
      <select class="filter" id="insurerSelect" aria-label="Select approved reinsurer"${available.length ? '' : ' disabled'}>${optionHtml(
        available.map((row) => ({ value: row.id, label: `${row.name} · ${row.rating}` })),
        available.length ? 'Select approved reinsurer' : 'All approved reinsurers added',
      )}</select>
      <button class="btn sm" type="button" data-action="balance"${rows.length ? '' : ' disabled'}>Balance to 100%</button>
      <button class="btn sm danger" type="button" data-action="clear-reinsurance"${rows.length ? '' : ' disabled'}>Clear</button>
    </div>
    ${rows.length
      ? `<div class="picks">${rows
          .map((row) => {
            const item = reinsurer(row.reinsurerId);
            const name = item?.name || row.name || 'Unknown reinsurer';
            return `<div class="pick-row${row.reinsurerId === state.activeReinsurerId ? ' active' : ''}">
              <button class="pick-main" type="button" data-action="select-reinsurer" data-id="${esc(row.reinsurerId)}">
                <strong>${esc(name)}</strong>${item?.rating ? `<span class="tag">${esc(item.rating)}</span>` : ''}
                <span class="pick-meta">${esc(row.treaty || 'Quota Share')} · ${percent(row.share)}</span>
              </button>
              <button class="btn sm danger" type="button" data-action="remove-reinsurer" data-id="${esc(row.reinsurerId)}">Remove</button>
            </div>`;
          })
          .join('')}</div>`
      : '<div class="empty">No reinsurers participating yet.</div>'}`;

  const treatyPanel = entry
    ? `<div class="sub-grid">
        <div>
          <span class="sub-label">Reinsurer</span>
          <div class="sub-value">${esc(label)}</div>
          <div class="hint">Currently ${esc(entry.treaty || 'Quota Share')} · ${percent(entry.share)} ceded</div>
        </div>
        <div>
          <label class="sub-label" for="treatySelect">Treaty</label>
          <select class="filter" id="treatySelect" aria-label="Select treaty" style="max-width:none;width:100%">${optionHtml(TREATIES, 'Select treaty')}</select>
        </div>
      </div>`
    : blank;

  const sharePanel = entry
    ? `<div class="sub-grid">
        <div>
          <span class="sub-label">Reinsurer</span>
          <div class="sub-value">${esc(label)}</div>
          <div class="hint">${esc(entry.treaty || 'Quota Share')} treaty · Ceded total ${percent(cededShare())} · Carrier retained ${percent(retainedShare())}</div>
        </div>
        <div>
          <label class="sub-label" for="shareInput">Risk share %</label>
          <input class="alloc alloc-lg${Number(entry.share) > 0 ? '' : ' invalid'}" id="shareInput" type="number" min="0" max="100" step="0.5" value="${esc(entry.share ?? 0)}" data-scope="reinsurance" data-id="${esc(entry.reinsurerId)}" data-field="share" aria-label="Risk share for ${esc(label)}">
        </div>
      </div>`
    : blank;

  return `${tabs}<div class="sub-panel">${[insurerPanel, treatyPanel, sharePanel][sub - 1] ?? insurerPanel}</div>
    <div id="allocationTotals">${allocationTotalsHtml()}</div>`;
};

const renderChannels = () => {
  const used = new Set(state.draft.channels.map((row) => row.channelId));
  const remaining = state.channels.filter((row) => isApproved(row) && !used.has(row.id));
  const rows = state.draft.channels;
  const table = rows.length
    ? `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Channel</th><th>Type</th><th class="right">Authority Limit</th><th class="right">Commission</th><th>Effective</th><th>Status</th><th class="right">Actions</th></tr></thead>
        <tbody>${rows
          .map((row) => {
            const party = channel(row.channelId);
            const name = party?.name || row.name || 'Unknown channel';
            return `<tr>
              <td><strong>${esc(name)}</strong><div class="sub mono">${esc(row.channelId)}</div></td>
              <td><span class="tag">${esc(row.type ?? party?.type ?? '—')}</span></td>
              <td class="right"><input class="alloc" type="number" min="0" step="5000" value="${esc(row.authorityLimit ?? 0)}" data-scope="channels" data-id="${esc(row.channelId)}" data-field="authorityLimit" aria-label="Authority limit for ${esc(name)}"></td>
              <td class="right"><input class="alloc" type="number" min="0" max="100" step="0.5" value="${esc(row.commission ?? 0)}" data-scope="channels" data-id="${esc(row.channelId)}" data-field="commission" aria-label="Commission for ${esc(name)}"></td>
              <td><input class="alloc" type="date" value="${esc(row.effective ?? today())}" data-scope="channels" data-id="${esc(row.channelId)}" data-field="effective" aria-label="Effective date for ${esc(name)}"></td>
              <td>${isApproved(row) || normalise(row.status) === 'active' ? '<span class="badge live">Granted</span>' : '<span class="badge draft">Pending</span>'}</td>
              <td class="right nowrap"><button class="btn sm danger" type="button" data-action="remove-channel" data-id="${esc(row.channelId)}">Remove</button></td>
            </tr>`;
          })
          .join('')}</tbody>
      </table></div>`
    : `<div class="empty">No distribution channels granted authority yet.<br>Add an approved channel to assign binding authority.</div>`;
  return `<div class="toolbar">
      <button class="btn sm" type="button" data-action="add-channel"${remaining.length ? '' : ' disabled'}>Add Another Channel</button>
      <button class="btn sm danger" type="button" data-action="clear-channels"${rows.length ? '' : ' disabled'}>Clear</button>
      <span class="hint" style="margin:0">${remaining.length} approved channel${remaining.length === 1 ? '' : 's'} available</span>
    </div>
    ${table}
    <div id="grantTotals">${grantTotalsHtml()}</div>`;
};

const renderStep = () => {
  const first = state.step === 1;
  dom.studioNav.querySelectorAll('button').forEach((button) => {
    const active = Number(button.dataset.step) === state.step;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  dom.stepTitle.textContent = first ? 'Reinsurance' : 'Channel Configuration';
  dom.stepSubtitle.textContent = first
    ? 'Select reinsurers and allocate product risk before configuring distribution channels.'
    : 'Grant coverage authority to approved channels and confirm the ceded allocation.';
  dom.stepSave.textContent = first ? 'Save & Continue' : 'Complete Configuration';
  dom.stepCancel.hidden = first;
  dom.stepBody.innerHTML = first ? renderReinsurance() : renderChannels();
  setStatus(
    first
      ? 'Step 1 of 2 · Allocation is stored as a draft until distribution is completed.'
      : 'Step 2 of 2 · Completing distribution publishes the authority grants for this product.',
  );
};

const render = () => {
  renderSummary();
  renderStep();
};

const refreshTotals = () => {
  renderSummary();
  const allocation = dom.stepBody.querySelector('#allocationTotals');
  const grants = dom.stepBody.querySelector('#grantTotals');
  if (allocation) allocation.innerHTML = allocationTotalsHtml();
  if (grants) grants.innerHTML = grantTotalsHtml();
};

const hydrate = () => {
  const record = currentRecord();
  state.recordId = record?.id ?? null;
  state.createdAt = record?.createdAt ?? new Date().toISOString();
  state.status = record?.status ?? 'draft';
  state.step = Math.min(2, Math.max(1, Number(record?.step) || 1));
  state.draft = {
    reinsurance: asList(record?.reinsurance).map((row) => ({
      reinsurerId: row.reinsurerId,
      name: row.name ?? '',
      treaty: row.treaty ?? 'Quota Share',
      share: round(row.share),
    })),
    channels: asList(record?.channels).map((row) => ({
      channelId: row.channelId,
      name: row.name ?? '',
      type: row.type ?? '',
      authorityLimit: round(row.authorityLimit),
      commission: round(row.commission),
      effective: row.effective ?? today(),
      status: row.status ?? 'active',
    })),
  };
  render();
};

const validateReinsurance = () => {
  if (!state.draft.reinsurance.length) return 'Add at least one approved reinsurer to continue.';
  const blank = state.draft.reinsurance.find((row) => !(Number(row.share) > 0));
  if (blank) return `Set a participation share above 0% for ${reinsurer(blank.reinsurerId)?.name ?? blank.reinsurerId}.`;
  if (cededShare() > 100) return `Ceded share is ${percent(cededShare())} and cannot exceed 100%.`;
  return '';
};

const validateChannels = () => {
  if (!state.draft.channels.length) return 'Grant authority to at least one approved channel.';
  const missing = state.draft.channels.find((row) => !(Number(row.authorityLimit) > 0));
  if (missing) return `Set an authority limit for ${channel(missing.channelId)?.name ?? missing.channelId}.`;
  const commission = state.draft.channels.find((row) => clamp(row.commission, 0, 100) !== Number(row.commission));
  if (commission) return `Commission for ${channel(commission.channelId)?.name ?? commission.channelId} must be between 0% and 100%.`;
  if (grantedLimit() > bindingLimit()) return `Combined authority of ${usd(grantedLimit())} exceeds the carrier limit of ${usd(bindingLimit())}.`;
  return '';
};

const validateStep = () => (state.step === 1 ? validateReinsurance() : validateChannels());

const payload = () => {
  const product = currentProduct();
  const carrier = currentCarrier();
  const now = new Date().toISOString();
  return {
    productId: product.id,
    productName: product.name,
    productVersion: product.version ?? '',
    carrierId: carrier?.id ?? '',
    carrierName: carrier?.name ?? '',
    status: state.status,
    step: state.step,
    reinsurance: state.draft.reinsurance.map((row) => ({ ...row, share: round(row.share) })),
    cededShare: cededShare(),
    retainedShare: retainedShare(),
    channels: state.draft.channels.map((row) => ({
      ...row,
      authorityLimit: round(row.authorityLimit),
      commission: round(row.commission),
    })),
    authorityLimit: bindingLimit(),
    grantedLimit: grantedLimit(),
    updatedAt: now,
  };
};

const persist = async () => {
  const body = { ...payload(), createdAt: state.createdAt ?? new Date().toISOString() };
  const saved = state.recordId
    ? await distributionApi.update(state.recordId, body)
    : await distributionApi.create(body);
  state.recordId = saved.id;
  state.createdAt = saved.createdAt ?? body.createdAt;
  const index = state.records.findIndex((row) => row.id === saved.id);
  if (index < 0) state.records.push(saved);
  else state.records[index] = saved;
  return saved;
};

const goToStep = (step) => {
  state.step = step;
  renderStep();
};

const saveStep = async ({ advance }) => {
  if (!currentProduct()) {
    toast('Select a product before saving distribution.', 'err');
    return;
  }
  const error = validateStep();
  if (error) {
    setStatus(error, 'err');
    toast(error, 'err');
    return;
  }
  dom.stepSave.disabled = true;
  try {
    if (advance && state.step === 1) {
      state.status = 'draft';
      await persist();
      goToStep(2);
      setStatus('Reinsurance saved. Configure channel authority to complete distribution.', 'ok');
      toast('Reinsurance allocation saved.');
    } else {
      state.status = 'configured';
      await persist();
      setStatus('Distribution configured and authority grants published.', 'ok');
      renderSummary();
      toast(`Distribution for “${currentProduct().name}” completed.`);
    }
  } catch (err) {
    setStatus(`Unable to save distribution: ${err.message}`, 'err');
    toast(err.message, 'err');
  } finally {
    dom.stepSave.disabled = false;
  }
};

const addReinsurer = (id) => {
  const party = reinsurer(id);
  if (!party || state.draft.reinsurance.some((row) => row.reinsurerId === id)) return;
  state.draft.reinsurance.push({
    reinsurerId: party.id,
    name: party.name,
    treaty: 'Quota Share',
    share: round(clamp(100 - cededShare(), 0, 100)),
  });
  state.activeReinsurerId = party.id;
  state.subTab = 2;
  renderStep();
  setStatus(`${party.name} added. Confirm the treaty, then set the risk share.`, 'ok');
};

const balance = () => {
  const rows = state.draft.reinsurance;
  if (!rows.length) return;
  const even = round(100 / rows.length);
  state.draft.reinsurance = rows.map((row, index) => ({
    ...row,
    share: index === rows.length - 1 ? round(100 - even * (rows.length - 1)) : even,
  }));
  renderStep();
  setStatus('Participation balanced to 100% of premium across all treaties.', 'ok');
};

const goToSubTab = (tab) => {
  state.subTab = tab;
  renderStep();
};

const openChannelModal = () => {
  const used = new Set(state.draft.channels.map((row) => row.channelId));
  const remaining = state.channels.filter((row) => isApproved(row) && !used.has(row.id));
  if (!remaining.length) {
    toast('Every approved channel already has authority.', 'err');
    return;
  }
  clearErrors();
  const types = [...new Set(remaining.map((row) => row.type))].sort();
  dom.channelType.innerHTML = optionHtml(types, 'Select channel type');
  dom.channelId.innerHTML = optionHtml([], 'Select approved organization');
  dom.modalNote.textContent = `Adds alongside ${state.draft.channels.length} existing channel(s).`;
  updateChannelHint();
  dom.modal.showModal();
};

const updateChannelHint = () => {
  const used = new Set(state.draft.channels.map((row) => row.channelId));
  const type = dom.channelType.value;
  const available = state.channels.filter(
    (row) => isApproved(row) && !used.has(row.id) && (!type || row.type === type),
  );
  dom.channelId.innerHTML = optionHtml(
    available.map((row) => ({ value: row.id, label: `${row.name} · ${row.type}` })),
    available.length ? 'Select approved organization' : 'No organizations for this type',
  );
  dom.channelId.disabled = !available.length;
  const limit = bindingLimit();
  dom.modalHint.textContent = available.length
    ? `${available.length} approved organization(s) available. Authority defaults to ${usd(limit)} with a ${COMMISSION_DEFAULT[type] ?? 10}% commission.`
    : 'No approved organization matches the selected channel type.';
};

const readChannelForm = () => ({
  type: dom.channelType.value,
  channelId: dom.channelId.value,
});

const addChannel = (event) => {
  event.preventDefault();
  const selection = readChannelForm();
  clearErrors();
  const errors = {};
  if (!selection.type) errors.channelType = 'Select a channel type.';
  if (!selection.channelId) errors.channelId = 'Select an approved organization.';
  if (selection.channelId && state.draft.channels.some((row) => row.channelId === selection.channelId)) {
    errors.channelId = 'That organization already has authority on this product.';
  }
  if (selection.channelId && selection.type && channel(selection.channelId)?.type !== selection.type) {
    errors.channelId = 'Selected organization does not operate as that channel type.';
  }
  Object.entries(errors).forEach(([name, message]) => setError(name, message));
  if (Object.keys(errors).length) return;

  const party = channel(selection.channelId);
  state.draft.channels.push({
    channelId: party.id,
    name: party.name,
    type: party.type,
    authorityLimit: bindingLimit(),
    commission: COMMISSION_DEFAULT[party.type] ?? 10,
    effective: today(),
    status: 'active',
  });
  dom.modal.close();
  renderStep();
  setStatus(`${party.name} granted authority.`, 'ok');
  toast(`Channel “${party.name}” added.`);
};

dom.productSelect.addEventListener('change', () => {
  state.productId = dom.productSelect.value;
  state.step = 1;
  state.subTab = 1;
  state.activeReinsurerId = '';
  hydrate();
});

dom.studioNav.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-step]');
  if (!button) return;
  const target = Number(button.dataset.step);
  if (target === state.step) return;
  if (target > state.step && validateReinsurance()) {
    setStatus(validateReinsurance(), 'err');
    toast('Complete step 1 before configuring channels.', 'err');
    return;
  }
  goToStep(target);
});

dom.stepBody.addEventListener('click', (event) => {
  const subtab = event.target.closest('button[data-subtab]');
  if (subtab) {
    goToSubTab(Number(subtab.dataset.subtab));
    return;
  }
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const { action, id } = button.dataset;
  if (action === 'select-reinsurer') {
    state.activeReinsurerId = id;
    renderStep();
    return;
  }
  if (action === 'balance') {
    balance();
    return;
  }
  if (action === 'clear-reinsurance') {
    state.draft.reinsurance = [];
    state.activeReinsurerId = '';
    state.subTab = 1;
    renderStep();
    setStatus('All treaty allocations cleared.', 'ok');
    return;
  }
  if (action === 'remove-reinsurer') {
    const name = reinsurer(id)?.name ?? id;
    state.draft.reinsurance = state.draft.reinsurance.filter((row) => row.reinsurerId !== id);
    renderStep();
    setStatus(`${name} removed from the treaty allocation.`, 'ok');
    return;
  }
  if (action === 'add-channel') {
    openChannelModal();
    return;
  }
  if (action === 'clear-channels') {
    state.draft.channels = [];
    renderStep();
    setStatus('All channel authority grants cleared.', 'ok');
    return;
  }
  if (action === 'remove-channel') {
    const name = channel(id)?.name ?? id;
    state.draft.channels = state.draft.channels.filter((row) => row.channelId !== id);
    renderStep();
    setStatus(`${name} authority revoked.`, 'ok');
  }
});

dom.stepBody.addEventListener('change', (event) => {
  const { id, value } = event.target;
  if (id === 'insurerSelect') {
    if (value) addReinsurer(value);
    return;
  }
  if (id === 'treatySelect' && value) {
    const entry = state.draft.reinsurance.find((row) => row.reinsurerId === state.activeReinsurerId);
    if (!entry) return;
    entry.treaty = value;
    renderStep();
    setStatus(`Treaty set to ${value}. Set the risk share in tab 3.`, 'ok');
  }
});

dom.stepBody.addEventListener('input', (event) => {
  const { scope, id, field } = event.target.dataset;
  if (!scope || !field) return;
  const list = scope === 'channels' ? state.draft.channels : state.draft.reinsurance;
  const entry = list.find((row) => (scope === 'channels' ? row.channelId === id : row.reinsurerId === id));
  if (!entry) return;
  entry[field] = field === 'effective' ? event.target.value : round(event.target.value);
  if (field === 'share') event.target.classList.toggle('invalid', !(Number(entry.share) > 0));
  const cell = event.target.closest('td')?.nextElementSibling;
  if (field === 'share' && cell) cell.textContent = percent(entry.share);
  refreshTotals();
});

dom.stepSave.addEventListener('click', () => saveStep({ advance: true }));
dom.stepCancel.addEventListener('click', () => goToStep(1));

dom.channelType.addEventListener('change', () => {
  setError('channelType', '');
  setError('channelId', '');
  updateChannelHint();
});
dom.form.addEventListener('submit', addChannel);
el('addChannelClose').addEventListener('click', () => dom.modal.close());
el('addChannelCancel').addEventListener('click', () => dom.modal.close());
dom.modal.addEventListener('close', clearErrors);

window.toggleCollapse = () => dom.sidebar.classList.toggle('collapsed');
window.toggleMobile = () => dom.sidebar.classList.toggle('open');

const load = async () => {
  try {
    const [products, carriers, reinsurers, channels, coverages, records] = await Promise.all([
      productsApi.list(),
      carriersApi.list(),
      reinsurersApi.list(),
      channelsApi.list(),
      coveragesApi.list(),
      distributionApi.list(),
    ]);
    state.products = products;
    state.carriers = carriers;
    state.reinsurers = reinsurers;
    state.channels = channels;
    state.coverages = coverages;
    state.records = records;
  } catch (err) {
    toast(`Unable to load distribution data: ${err.message}`, 'err');
  }
  const active = state.products.filter((row) => normalise(row.status) !== 'archived');
  dom.productSelect.innerHTML = optionHtml(
    active.map((row) => ({ value: row.id, label: `${row.name} · ${row.version ?? 'no version'}` })),
    active.length ? 'Select product' : 'No products available',
  );
  dom.productSelect.disabled = !active.length;
  state.productId = active[0]?.id ?? '';
  hydrate();
  setStatus(
    state.productId
      ? 'Step 1 of 2 · Allocation is stored as a draft until distribution is completed.'
      : 'Select a product to begin configuring distribution.',
  );
};

load();
