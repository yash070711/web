import { api } from './api.js';
import { CARRIERS, US_STATES, esc } from './product-model.js';

const el = (id) => document.getElementById(id);
const form = el('productForm');
const state = { products: [], excluded: [] }; // excluded = states this version is NOT available in

const showErrors = (messages) => {
  el('errors').hidden = !messages.length;
  el('errors').innerHTML = messages.length
    ? `<strong>Please fix the following:</strong><ul>${messages.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '';
  if (messages.length) window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderStates = () => {
  const on = US_STATES.length - state.excluded.length;
  el('jurisSummary').textContent = `${on === US_STATES.length ? `All ${on} states included` : `${on} of ${US_STATES.length} states included`}${on === 0 ? ' · ⚠ at least one state must be included' : ''}`;
  el('jurisStates').innerHTML = US_STATES.map((st) => `<label><input type="checkbox" data-state value="${st}"${state.excluded.includes(st) ? '' : ' checked'}> ${st}</label>`).join('');
};

el('jurisdiction').addEventListener('change', (event) => {
  const t = event.target;
  if (!('state' in t.dataset)) return;
  const excluded = new Set(state.excluded);
  t.checked ? excluded.delete(t.value) : excluded.add(t.value);
  state.excluded = US_STATES.filter((st) => excluded.has(st));
  renderStates();
});

el('jurisdiction').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-juris]');
  if (!btn) return;
  state.excluded = btn.dataset.juris === 'all' ? [] : [...US_STATES];
  renderStates();
});

const nextProductId = () => {
  const max = state.products.reduce((m, p) => Math.max(m, parseInt(String(p.productId).replace(/\D/g, ''), 10) || 0), 0);
  return `PRD-${String(max + 1).padStart(3, '0')}`;
};

const values = () => ({
  carrier: form.elements.carrier.value,
  name: form.elements.name.value.trim(),
  description: form.elements.description.value.trim(),
  arrangement: form.elements.arrangement.value,
});

const validate = (v) => {
  const errors = [];
  if (!v.carrier) errors.push('Carrier is required.');
  if (!v.name) errors.push('Product name is required.');
  else if (state.products.some((p) => p.name.toLowerCase() === v.name.toLowerCase())) errors.push(`A product named “${v.name}” already exists.`);
  if (!v.arrangement) errors.push('Select an arrangement.');
  if (state.excluded.length >= US_STATES.length) errors.push('Select at least one state.');
  showErrors(errors);
  return !errors.length;
};

form.addEventListener('change', (event) => {
  if (event.target.name !== 'arrangement') return;
  form.querySelectorAll('.wiz-option').forEach((opt) => opt.classList.toggle('selected', opt.querySelector('input').checked));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const v = values();
  if (!validate(v)) return;
  el('create').disabled = true;
  const firstVersion = `${new Date().getFullYear()}.01`; // system-generated
  const now = new Date().toISOString();
  try {
    const product = await api('products').create({
      productId: nextProductId(),
      name: v.name,
      description: v.description,
      carrier: v.carrier,
      arrangement: v.arrangement,
      lineOfBusiness: '',
      version: firstVersion,
      status: 'Draft',
      createdOn: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      effectiveDate: '',
    });
    const version = await api('product_versions').create({
      productRef: product.id,
      label: firstVersion,
      status: 'Draft',
      components: [],
      jurisdiction: { excludedStates: [...state.excluded] },
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      releaseId: null,
    });
    window.location.href = `/product-version.html?id=${encodeURIComponent(version.id)}`;
  } catch (err) {
    showErrors([err.message]);
    el('create').disabled = false;
  }
});

renderStates();
el('carrier').innerHTML = ['<option value="">Select carrier</option>', ...CARRIERS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)].join('');

api('products')
  .list()
  .then((products) => {
    state.products = products;
  })
  .catch((err) => showErrors([`Unable to load existing products: ${err.message}`]));
