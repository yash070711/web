// Shared Product Studio sidebar: one definition so every page stays aligned.
const ITEMS = [
  { label: 'Product Catalogue', icon: '▦', href: '/', match: (p, h) => p === '/' && (h === '' || h === 'products') },
  { label: 'Coverage', icon: '◫', href: '/coverage.html', match: (p) => p === '/coverage.html' },
  { label: 'Class of Business', icon: '▤', href: '/#class-of-business', match: (p, h) => p === '/' && h === 'class-of-business' },
  { label: 'Distribution', icon: '⇄', href: '/#distribution', match: (p, h) => p === '/' && h === 'distribution' },
  { label: 'Acord', icon: '▥', href: '/#acord', match: (p, h) => p === '/' && h === 'acord' },
];

const sidebar = document.getElementById('sidebar');

function render() {
  const path = location.pathname === '/index.html' ? '/' : location.pathname;
  const hash = location.hash.slice(1);
  sidebar.innerHTML = `
    <div class="nav-heading">Product Studio</div>
    ${ITEMS.map((i) => {
      const on = i.match(path, hash);
      return `<a class="nav-item${on ? ' selected' : ''}" href="${i.href}"${on ? ' aria-current="page"' : ''}><span class="nav-icon">${i.icon}</span><span class="nav-label">${i.label}</span></a>`;
    }).join('')}
    <button class="collapse-btn" type="button" onclick="toggleCollapse()">Collapse</button>`;
}

window.toggleCollapse = () => sidebar.classList.toggle('collapsed');
window.toggleMobile = () => sidebar.classList.toggle('open');

sidebar.addEventListener('click', (e) => { if (e.target.closest('.nav-item')) sidebar.classList.remove('open'); });
addEventListener('hashchange', render);
render();
