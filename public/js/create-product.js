import { api } from './api.js';
import { CARRIERS, esc } from './product-model.js';

const el = (id) => document.getElementById(id);
const form = el('productForm');
const state = { products: [] };

const showErrors = (messages) => {
  el('errors').hidden = !messages.length;
  el('errors').innerHTML = messages.length
    ? `<strong>Please fix the following:</strong><ul>${messages.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '';
  if (messages.length) window.scrollTo({ top: 0, behavior: 'smooth' });
};

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

el('carrier').innerHTML = ['<option value="">Select carrier</option>', ...CARRIERS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)].join('');

api('products')
  .list()
  .then((products) => {
    state.products = products;
  })
  .catch((err) => showErrors([`Unable to load existing products: ${err.message}`]));
