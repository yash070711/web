// Shared sidebar for the plain-HTML pages. It mirrors the Next.js sidebar (src/components/Sidebar.jsx),
// so both halves of the app show the same navigation and link to each other.
const ITEMS = [
  { label: 'Product Catalogue', icon: '▦', href: '/products', match: (p) => p.startsWith('/products') },
  { label: 'Coverage', icon: '◫', href: '/coverage', match: (p) => p === '/coverage' || p === '/coverage.html' || p === '/coverage-form' || p === '/coverage-form.html' },
  { label: 'Class of Business', icon: '▤', href: '/class-of-business', match: (p) => p === '/class-of-business' },
  { label: 'Distribution', icon: '⇄', href: '/distribution', match: (p) => p === '/distribution' },
  { label: 'Acord', icon: '▥', href: '/acord', match: (p) => p === '/acord' },
];

const sidebar = document.getElementById('sidebar');

function render() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  sidebar.innerHTML = `
    <div class="nav-heading">Product Studio</div>
    ${ITEMS.map((i) => {
      const on = i.match(path);
      return `<a class="nav-item${on ? ' selected' : ''}" href="${i.href}"${on ? ' aria-current="page"' : ''}><span class="nav-icon">${i.icon}</span><span class="nav-label">${i.label}</span></a>`;
    }).join('')}
    <button class="collapse-btn" type="button" onclick="toggleCollapse()">Collapse</button>`;
}

window.toggleCollapse = () => sidebar.classList.toggle('collapsed');
window.toggleMobile = () => sidebar.classList.toggle('open');

sidebar.addEventListener('click', (e) => { if (e.target.closest('.nav-item')) sidebar.classList.remove('open'); });
render();
