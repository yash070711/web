/* Shared topbar + sidenav shell for the MGA (NTA) workspace pages. Mirrors
   the exact markup/classes /ps/assets/nav.js injects into the real Product
   Studio shell (same style.css), just branded for NTA and scoped to the
   nav items an MGA actually needs. Also holds the small "last opened
   product" memory used so generic sidebar links (Coverage, Risk, ...) know
   which product/version to deep-link into — the same pattern Futuristic's
   own sidenav uses via PS.prototypeApp.context(). */
window.MgaShell = {
  LAST_PRODUCT_KEY: 'mga-nta-last-product',

  profiles: [
    { key: 'vikram', label: 'Futuristic', href: '/ps/catalogue.html' },
    { key: 'southlake', label: 'SouthLake', href: '/ps-southlake/catalogue.html' },
    { key: 'nta', label: 'NTA', href: '/ps-nta/catalogue.html' }
  ],

  icons: {
    'house': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M218.83 103.77l-80-75.48a1.14 1.14 0 01-.11-.11 16 16 0 00-21.53 0l-.11.11-79.93 75.48A16 16 0 0032 115.55V208a16 16 0 0016 16h56a16 16 0 0016-16v-48h16v48a16 16 0 0016 16h56a16 16 0 0016-16v-92.45a16 16 0 00-5.17-11.78zM208 208h-56v-48a16 16 0 00-16-16h-16a16 16 0 00-16 16v48H48v-92.45l.11-.1L128 40l79.9 75.43.1.12z" fill="currentColor"/></svg>`,
    'book-open': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M224 48h-72a40 40 0 00-24 8 40 40 0 00-24-8H32a16 16 0 00-16 16v144a16 16 0 0016 16h72a24 24 0 0124 24 8 8 0 0016 0 24 24 0 0124-24h72a16 16 0 0016-16V64a16 16 0 00-16-16zM104 208H32V64h72a24 24 0 0124 24v120a39.87 39.87 0 00-24-8zm120 0h-72a39.87 39.87 0 00-24 8V88a24 24 0 0124-24h72z" fill="currentColor"/></svg>`,
    'umbrella': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M240 120a112 112 0 00-224 0v8a8 8 0 008 8h104v56a16 16 0 01-32 0 8 8 0 00-16 0 32 32 0 0064 0v-56h104a8 8 0 008-8zm-216-8a96.11 96.11 0 01192 0z" fill="currentColor"/></svg>`,
    'list-checks': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M224 128a8 8 0 01-8 8H128a8 8 0 010-16h88a8 8 0 018 8zm-8-56H128a8 8 0 000 16h88a8 8 0 000-16zm0 112H128a8 8 0 000 16h88a8 8 0 000-16zM82.34 42.34 56 68.69 45.66 58.34a8 8 0 00-11.32 11.32l16 16a8 8 0 0011.32 0l32-32a8 8 0 00-11.32-11.32zm0 64-26.34 26.35-10.34-10.35a8 8 0 00-11.32 11.32l16 16a8 8 0 0011.32 0l32-32a8 8 0 00-11.32-11.32zm0 64-26.34 26.35-10.34-10.35a8 8 0 00-11.32 11.32l16 16a8 8 0 0011.32 0l32-32a8 8 0 00-11.32-11.32z" fill="currentColor"/></svg>`,
    'warning': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M236.8 188.09L149.35 36.22a24.76 24.76 0 00-42.7 0L19.2 188.09a23.51 23.51 0 000 23.72A24.35 24.35 0 0040.55 224h174.9a24.35 24.35 0 0021.33-12.19 23.51 23.51 0 00.02-23.72zm-13.87 15.71a8.3 8.3 0 01-7.48 4.2H40.55a8.3 8.3 0 01-7.48-4.2 7.59 7.59 0 010-7.72l87.45-151.87a8.76 8.76 0 0115 0L223 196.08a7.59 7.59 0 01-.07 7.72zM120 144v-40a8 8 0 0116 0v40a8 8 0 01-16 0zm20 36a12 12 0 11-12-12 12 12 0 0112 12z" fill="currentColor"/></svg>`,
    'user-check': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M144 157.68A68 68 0 1072 40a68 68 0 0072 117.68zM72 56a52 52 0 110 104 52 52 0 010-104zm168 149.72a8 8 0 01-11 2.56A120.44 120.44 0 00144 192a8 8 0 010-16 136.62 136.62 0 0172 20.28 8 8 0 012.56 11zM0 200a8 8 0 018-8 136.62 136.62 0 0172-20.28 8 8 0 010 16A120.44 120.44 0 000 208a8 8 0 01-8-8zm232.49-90.84a8 8 0 01-1.65 11.17l-40 28a8 8 0 01-11-1.6l-16-20a8 8 0 1112.51-9.96l10.67 13.34 34.3-24.11a8 8 0 0111.17 3.16z" fill="currentColor"/></svg>`,
    'calculator': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M200 24H56a16 16 0 00-16 16v176a16 16 0 0016 16h144a16 16 0 0016-16V40a16 16 0 00-16-16zM56 40h144v48H56zm0 176V104h144v112zm36-80a12 12 0 110-24 12 12 0 010 24zm36 0a12 12 0 110-24 12 12 0 010 24zm36 0a12 12 0 110-24 12 12 0 010 24zM92 180a12 12 0 110-24 12 12 0 010 24zm36 0a12 12 0 110-24 12 12 0 010 24zm36-12a12 12 0 01-12 36v-24h-24v-12h36z" fill="currentColor"/></svg>`,
    'tree-structure': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M216 152h-48V120h16a16 16 0 0016-16V56a16 16 0 00-16-16h-56a16 16 0 00-16 16v48a16 16 0 0016 16h16v32H88a16 16 0 00-16 16v16H56a16 16 0 00-16 16v48h16v-48h16v48h16v-48h16v-16h128v16h16v-48a16 16 0 00-16-16zm-88-48V56h56v48z" fill="currentColor"/></svg>`,
    'file-text': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M213.66 82.34l-56-56A8 8 0 00152 24H56a16 16 0 00-16 16v176a16 16 0 0016 16h144a16 16 0 0016-16V88a8 8 0 00-2.34-5.66zM160 51.31 188.69 80H160zM200 216H56V40h88v48a8 8 0 008 8h48v120zm-40-96H96a8 8 0 000 16h64a8 8 0 000-16zm0 32H96a8 8 0 000 16h64a8 8 0 000-16z" fill="currentColor"/></svg>`,
    'flask': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M221.69 199.77L160 96.92V40h8a8 8 0 000-16H88a8 8 0 000 16h8v56.92L34.31 199.77A16 16 0 0048 224h160a16 16 0 0013.69-24.23zM110.43 103.16A8 8 0 00112 99V40h32v59a8 8 0 001.57 4.78L177.12 152H78.88z" fill="currentColor"/></svg>`,
    'check-circle': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M173.66 98.34a8 8 0 010 11.32l-56 56a8 8 0 01-11.32 0l-24-24a8 8 0 0111.32-11.32L112 148.69l50.34-50.35a8 8 0 0111.32 0zM232 128A104 104 0 1128 128a104 104 0 01208 0zm-16 0a88 88 0 10-176 0 88 88 0 00176 0z" fill="currentColor"/></svg>`,
    'sliders': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M32 80a8 8 0 018-8h80a8 8 0 010 16H40a8 8 0 01-8-8zm176 88a8 8 0 01-8 8H40a8 8 0 010-16h160a8 8 0 018 8zM168 48a24 24 0 00-23.75 21H40a8 8 0 000 16h104.25A24 24 0 10168 48zm0 32a8 8 0 118-8 8 8 0 01-8 8zm-80 64a24 24 0 00-23.75 21H40a8 8 0 000 16h24.25A24 24 0 1088 144zm0 32a8 8 0 118-8 8 8 0 01-8 8zm80-16a24 24 0 0023.75-21H216a8 8 0 000-16h-24.25A24 24 0 10168 160zm0-32a8 8 0 11-8 8 8 8 0 018-8z" fill="currentColor"/></svg>`,
    'magnifying-glass': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M229.66 218.34l-50.07-50.07a88 88 0 10-11.31 11.31l50.06 50.07a8 8 0 0011.32-11.31zM40 112a72 72 0 1172 72 72.08 72.08 0 01-72-72z" fill="currentColor"/></svg>`,
    'bell': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M221.8 175.94C216.25 166.38 208 139.33 208 104a80 80 0 00-160 0c0 35.34-8.26 62.38-13.81 71.94A16 16 0 0048 200h40.92a40 40 0 0078.17 0H208a16 16 0 0013.8-24.06zM128 216a24 24 0 01-22.62-16h45.24A24 24 0 01128 216z" fill="currentColor"/></svg>`,
    'arrow-square': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M213.66 82.34L163.31 32H208a8 8 0 000-16h-64a8 8 0 00-8 8v64a8 8 0 0016 0V43.31l50.34 50.35a8 8 0 0011.32-11.32zM192 208H48V64h72a8 8 0 000-16H48a16 16 0 00-16 16v144a16 16 0 0016 16h144a16 16 0 0016-16v-72a8 8 0 00-16 0z" fill="currentColor"/></svg>`
  },

  // The last product/version the MGA opened, so generic sidebar links
  // (Coverage, Risk, ...) can deep-link somewhere real instead of a fake
  // route — the same role PS.prototypeApp.context() plays in the main app.
  lastProduct() {
    try { return JSON.parse(localStorage.getItem(this.LAST_PRODUCT_KEY) || 'null'); } catch (_) { return null; }
  },
  rememberProduct(productId, version) {
    try { localStorage.setItem(this.LAST_PRODUCT_KEY, JSON.stringify({ productId, version })); } catch (_) {}
  },

  studioHref(file, productId, version) {
    return window.MgaData
      ? window.MgaData.studioHref(file, productId, version)
      : `/ps/${file}?product=${encodeURIComponent(productId)}&id=${encodeURIComponent(productId)}&version=${encodeURIComponent(version || '')}`;
  },

  // A generic (non-product-specific) sidebar link: use the last opened
  // product if we have one, otherwise send the user to the catalogue to
  // pick a product first rather than guessing or inventing a fake route.
  genericStudioHref(file) {
    const last = this.lastProduct();
    return last?.productId ? this.studioHref(file, last.productId, last.version) : 'catalogue.html';
  },

  render(activeId, breadcrumbLabel) {
    const logo = document.querySelector('.topbar-logo');
    if (logo) {
      logo.innerHTML = `
        <div class="mga-logo-mark">NT</div>
        <span class="topbar-logo-wordmark">
          <span class="topbar-logo-text">NTA</span>
          <span class="topbar-logo-sub">MGA Workspace</span>
        </span>`;
      // Dashboard is hidden from this app — the logo takes the user to the
      // Product Catalogue instead.
      logo.setAttribute('href', 'catalogue.html');
    }

    const bc = document.querySelector('.topbar-breadcrumb');
    if (bc) bc.innerHTML = `<span class="current">${breadcrumbLabel}</span>`;

    const right = document.querySelector('.topbar-right');
    if (right) right.innerHTML = `
      <div class="topbar-search">
        <span class="topbar-search-icon">${this.icons['magnifying-glass']}</span>
        <input type="search" id="mga-topbar-search" placeholder="Search assigned products…" aria-label="Search products">
      </div>
      <button class="topbar-icon-btn" aria-label="Notifications">${this.icons.bell}</button>
      <div class="topbar-user" id="mga-topbar-user-btn" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">
        <div class="user-avatar">NT</div>
        <div class="topbar-user-info">
          <div class="topbar-user-name">NTA</div>
          <div class="mga-topbar-user-role">MGA</div>
        </div>
        <span class="mga-profile-caret" aria-hidden="true">⌄</span>
      </div>`;

    const profileButton = document.getElementById('mga-topbar-user-btn');
    if (profileButton) {
      profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleProfileMenu();
      });
      profileButton.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        this.toggleProfileMenu();
      });
    }

    const search = document.getElementById('mga-topbar-search');
    if (search) search.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const q = search.value.trim();
      window.location.href = q ? `catalogue.html?q=${encodeURIComponent(q)}` : 'catalogue.html';
    });

    const item = (id, label, href, icon, enabled = true) => enabled
      ? `<a href="${href}" class="nav-item ${activeId === id ? 'active' : ''}">${this.icons[icon]}<span>${label}</span></a>`
      : `<span class="nav-item" style="opacity:.45;cursor:not-allowed" title="Not available yet">${this.icons[icon]}<span>${label}</span></span>`;

    const nav = document.querySelector('.sidenav');
    if (nav) nav.innerHTML = `
      <div class="nav-group">
        <div class="nav-group-label">MGA</div>
        ${item('catalogue', 'Product Catalogue', 'catalogue.html', 'book-open')}
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Product Management</div>
        ${item('products', 'Products', 'catalogue.html', 'book-open')}
        ${item('approvals', 'Approvals', 'dashboard.html#review-queue', 'check-circle')}
        ${item('simulation', 'Simulation &amp; Testing', this.genericStudioHref('simulation-studio.html'), 'flask')}
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Operations</div>
        ${item('documents', 'Documents', this.genericStudioHref('document-studio.html'), 'file-text')}
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Administration</div>
        ${item('settings', 'Settings', '#', 'sliders', false)}
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Switch profile</div>
        <a href="/ps/catalogue.html" class="nav-item">${this.icons['arrow-square']}<span>Futuristic</span></a>
        <a href="/ps-southlake/catalogue.html" class="nav-item">${this.icons['arrow-square']}<span>SouthLake</span></a>
        <a href="catalogue.html" class="nav-item active">${this.icons['arrow-square']}<span>NTA</span></a>
      </div>`;
  },

  toggleProfileMenu() {
    const existing = document.getElementById('mga-profile-dropdown');
    if (existing) {
      this.closeProfileMenu();
      return;
    }

    const menu = document.createElement('div');
    menu.id = 'mga-profile-dropdown';
    menu.className = 'dropdown-menu mga-profile-dropdown';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
      <div style="padding:10px 16px;border-bottom:1px solid var(--color-border)">
        <div style="font-size:13px;font-weight:500">NTA</div>
        <div style="font-size:12px;color:var(--color-muted)">Role: MGA</div>
      </div>
      <div class="mga-profile-heading">Switch Profile</div>
      ${this.profiles.map(profile => `
        <button class="dropdown-item mga-profile-option" type="button" role="menuitem" data-profile-href="${profile.href}">
          <span>${profile.label}</span>
          ${profile.key === 'nta' ? '<span class="mga-profile-check" aria-label="Current profile">✓</span>' : ''}
        </button>
      `).join('')}
    `;
    menu.addEventListener('click', (event) => {
      const option = event.target.closest('[data-profile-href]');
      if (option) this.switchProfile(option.dataset.profileHref);
    });
    document.body.appendChild(menu);
    document.getElementById('mga-topbar-user-btn')?.setAttribute('aria-expanded', 'true');
  },

  closeProfileMenu() {
    document.getElementById('mga-profile-dropdown')?.remove();
    document.getElementById('mga-topbar-user-btn')?.setAttribute('aria-expanded', 'false');
  },

  switchProfile(href) {
    this.closeProfileMenu();
    window.location.href = href;
  }
};

document.addEventListener('click', (event) => {
  if (!event.target.closest('#mga-profile-dropdown, #mga-topbar-user-btn')) {
    window.MgaShell?.closeProfileMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') window.MgaShell?.closeProfileMenu();
});
