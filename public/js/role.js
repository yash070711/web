// Who is using the studio. There is no sign-in yet: the role is picked in the top bar and kept in the browser.
//   Carrier - builds products and distributes them.
//   MGU     - works only on the versions distributed to its own organisation (rater, factors and formula of a fronting product).
import { api } from './api.js';

const KEY = 'ps.role';
const CARRIER = { role: 'Carrier', name: 'Yash Gaur', label: 'Carrier · Yash Gaur · Admin' };
// Pages an MGU may open.
const MGU_PAGES = ['/', '/index.html', '/coverage-config.html'];

export const getRole = () => {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r?.role === 'MGU' && r.orgId) return r;
  } catch {
    // Storage blocked or corrupt: fall back to the carrier.
  }
  return CARRIER;
};

const setRole = (role) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(role));
  } catch {
    // The switch simply won't stick.
  }
};

const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const mount = async (role) => {
  const account = document.querySelector('.top-right .account');
  if (!account) return;
  const avatar = document.querySelector('.top-right .avatar');
  if (avatar) avatar.textContent = initials(role.role === 'MGU' ? role.orgName : role.name);
  const orgs = (await api('organisations').list().catch(() => [])).filter((o) => o.type === 'MGU' && o.status === 'Active');
  const select = document.createElement('select');
  select.className = 'search-box';
  select.setAttribute('aria-label', 'Switch role');
  select.style.cssText = 'max-width:230px;padding:4px 8px;font-size:12px';
  select.innerHTML = [`<option value="">${CARRIER.label}</option>`]
    .concat(orgs.map((o) => `<option value="${o.id}"${role.orgId === o.id ? ' selected' : ''}>MGU · ${o.name}</option>`))
    .join('');
  select.addEventListener('change', () => {
    const org = orgs.find((o) => o.id === select.value);
    setRole(org ? { role: 'MGU', orgId: org.id, orgName: org.name, name: org.name, label: `MGU · ${org.name}` } : CARRIER);
    location.href = '/';
  });
  account.replaceChildren(select);
};

const init = () => {
  const role = getRole();
  if (role.role === 'MGU') {
    // Keep an MGU out of the carrier's pages and menus.
    if (!MGU_PAGES.includes(location.pathname)) location.replace('/');
    document.querySelectorAll('.sidebar .nav-item').forEach((a) => {
      if (a.getAttribute('href') !== '/') a.hidden = true;
    });
  }
  return mount(role);
};

export const roleReady = init();
