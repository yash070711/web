/* ============================================================
   Insurance Product Studio — Shared Dummy Data Store
   data.js
   ============================================================ */

window.PS = window.PS || {};

/* ── Role / session model ─────────────────────────────────────
   Two personas drive the prototype:
     • risk-carrier (Risk Carrier) — owns the base product fabric
       (identity, coverages, jurisdiction, distribution).
     • mga — managing general agent — receives assigned products
       and configures Question / Risk / Eligibility / Underwriting
       / Rating & Pricing studios.
   The session is held in localStorage (ps-auth-session) so the
   logged-in role/org survives refresh and logout/login.          */
PS.auth = (function () {
  var SESSION_KEY = 'ps-auth-session';

  var ORGS = {
    'RC-VERIDEX': {
      role: 'risk-carrier', roleLabel: 'Risk Carrier', kind: 'carrier',
      name: 'Veridex Insurance',
      user: { id: 'U001', name: 'Anika Sharma', initials: 'AS', title: 'Product Manager', avatarClass: 'av-pm' }
    },
    'RC-ATLAS': {
      role: 'risk-carrier', roleLabel: 'Risk Carrier', kind: 'carrier',
      name: 'Atlas Mutual',
      user: { id: 'U004', name: 'David Okonkwo', initials: 'DO', title: 'Compliance Officer', avatarClass: 'av-co' }
    },
    'MGA-CRESTLINE': {
      role: 'mga', roleLabel: 'MGU', kind: 'mga',
      name: 'Crestline MGU',
      user: { id: 'U006', name: 'Marcus Lee', initials: 'CL', title: 'MGU Manager', avatarClass: 'av-adm' }
    },
    'MGA-NORTHBRIDGE': {
      role: 'mga', roleLabel: 'MGU', kind: 'mga',
      name: 'Northbridge MGU',
      user: { id: 'U005', name: 'Priya Varghese', initials: 'PV', title: 'MGU Manager', avatarClass: 'av-pub' }
    }
  };

  /* Static pages each role is allowed to open. Pages not listed are
     redirected to the role's home page by the page-level guard.   */
  var PAGE_ACCESS = {
    'risk-carrier': [
      'index.html', 'catalogue.html', 'product-detail.html', 'product-view.html',
      'coverage-studio.html', 'mgu-assignment.html', 'audit-log.html', 'glossary.html'
    ],
    'mga': [
      'mgu.html', 'product-detail.html',
      'product-view.html', 'coverage-studio.html', 'questionnaire-studio.html',
      'risk-studio.html', 'eligibility-studio.html', 'underwriting-studio.html',
      'rating-studio.html', 'document-studio.html', 'distribution-studio.html',
      'audit-log.html', 'glossary.html'
    ]
  };
  var HOME = { 'risk-carrier': '/ps/index.html', 'mga': '/ps/mgu.html' };

  function read() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; }
  }
  function write(session) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (_) {}
  }
  function clear() {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
  }
  function current() { return read(); }
  function isLoggedIn() { return Boolean(read()); }
  function isRiskCarrier() { var s = read(); return Boolean(s && s.role === 'risk-carrier'); }
  function isMGA() { var s = read(); return Boolean(s && s.role === 'mga'); }

  function isPageLogin() {
    if (window.__PS_HTML_FILE__ && /login\.html/i.test(window.__PS_HTML_FILE__)) return true;
    return /login\.html/i.test(location.pathname || '');
  }

  function applyToData(session) {
    if (!session) return;
    /* Re-resolve the persona from the ORGS definition (canonical source)
       so avatar/identity stay correct even when a stored session was
       written before a persona change. */
    var persona = null;
    if (session.orgId && ORGS[session.orgId]) persona = ORGS[session.orgId];
    if (!persona) {
      for (var k in ORGS) {
        if (ORGS[k].name === session.org) { persona = ORGS[k]; break; }
      }
    }
    var u = (persona && persona.user) || session.user || {};
    var frame = session.roleLabel || session.role || 'User';
    PS.data.currentUser = {
      id: u.id || 'U000',
      name: u.name || session.org,
      initials: u.initials || (String(session.org || '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() || '?'),
      role: frame,
      roleKind: session.role,
      orgId: session.orgId,
      org: session.org,
      carrier: session.org,
      avatarClass: u.avatarClass || 'av-pm',
      title: u.title || frame
    };
  }

  /* Login with a party org id (e.g. 'RC-VERIDEX', 'MGA-CRESTLINE'). */
  function login(orgId) {
    var org = ORGS[orgId];
    if (!org) return null;
    var session = {
      orgId: orgId,
      org: org.name,
      role: org.role,
      roleLabel: org.roleLabel,
      kind: org.kind,
      user: org.user,
      loggedInAt: new Date().toISOString()
    };
    write(session);
    applyToData(session);
    return session;
  }

  function logout() {
    clear();
    window.location.replace('/ps/login.html');
  }

  /* Login guard for every page: keep sessions alive, otherwise send
     the visitor to the role-selection screen, preserving the URL.  */
  function guard() {
    if (isPageLogin()) return;
    if (!isLoggedIn()) {
      var next = encodeURIComponent(location.href);
      window.location.replace('/ps/login.html?next=' + next);
    }
  }

  function pageAccessFor(file) {
    var s = read();
    if (!s || !PAGE_ACCESS[s.role]) return true;
    return PAGE_ACCESS[s.role].indexOf(file) !== -1;
  }

  function homeFor(role) {
    return HOME[role] || '/ps/index.html';
  }

  function orgsBy(role) {
    var out = [];
    Object.keys(ORGS).forEach(function (id) {
      if (ORGS[id].role === role) out.push({ id: id, org: ORGS[id] });
    });
    return out;
  }
  function carrierOrgs() { return orgsBy('risk-carrier'); }
  function mgaOrgs() { return orgsBy('mga'); }

  /* Does this product belong to the signed-in risk carrier? */
  function ownsProduct(product) {
    var s = read();
    if (!s || !product) return false;
    if (s.role !== 'risk-carrier') return false;
    return String(product.carrierId || '') === s.orgId ||
      String(product.carrier || '') === s.org ||
      String(product.owner || '') === (s.user && s.user.name);
  }

  /* Is this product assigned to the signed-in MGU? */
  function isAssignedToMe(product) {
    var s = read();
    if (!s || !product) return false;
    if (s.role !== 'mga') return false;
    var list = product.assignedMGAs || product.mgaAssignments || [];
    return list.some(function (m) {
      return m && (m.mgaId === s.orgId || m.mgaName === s.org || m.name === s.org) && m.status !== 'revoked';
    });
  }

  /* Products a role should see on its home/catalogue surfaces. */
  function visibleProducts(all) {
    var s = read();
    var list = Array.isArray(all) ? all : [];
    if (!s) return list;
    if (s.role === 'mga') {
      return list.filter(isAssignedToMe);
    }
    if (s.role === 'risk-carrier') {
      var owned = list.filter(ownsProduct);
      return owned.length ? owned : list;
    }
    return list;
  }

  return {
    SESSION_KEY: SESSION_KEY,
    ORGS: ORGS,
    current: current,
    isLoggedIn: isLoggedIn,
    isRiskCarrier: isRiskCarrier,
    isMGA: isMGA,
    login: login,
    logout: logout,
    guard: guard,
    applyToData: applyToData,
    pageAccessFor: pageAccessFor,
    homeFor: homeFor,
    carrierOrgs: carrierOrgs,
    mgaOrgs: mgaOrgs,
    ownsProduct: ownsProduct,
    isAssignedToMe: isAssignedToMe,
    visibleProducts: visibleProducts
  };
})();

PS.data = {
  currentUser: {
    id: 'U001',
    name: 'Anika Sharma',
    initials: 'AS',
    role: 'Product Manager',
    avatarClass: 'av-pm',
    carrier: 'Veridex Insurance'
  },

  users: [
    { id:'U001', name:'Anika Sharma',    initials:'AS', role:'Product Manager',       avatarClass:'av-pm'  },
    { id:'U002', name:'Rajan Mehta',     initials:'RM', role:'Pricing Actuary',        avatarClass:'av-act' },
    { id:'U003', name:'Sunita Pillai',   initials:'SP', role:'Underwriting Manager',   avatarClass:'av-uw'  },
    { id:'U004', name:'David Okonkwo',   initials:'DO', role:'Compliance Officer',     avatarClass:'av-co'  },
    { id:'U005', name:'Priya Varghese',  initials:'PV', role:'Publisher',              avatarClass:'av-pub' },
    { id:'U006', name:'Marcus Lee',      initials:'ML', role:'Administrator',          avatarClass:'av-adm' }
  ],

  products: [
    {
      id: 'PRD-015', name: 'Commercial Truck Comprehensive',
      family: 'Trucking', version: '2026.08', status: 'published',
      effectiveFrom: '01-Aug-2026', effectiveTo: '31-Jul-2027',
      lastModified: '24-Aug-2026', lastModifiedBy: 'Sunita Pillai',
      carrierId: 'RC-VERIDEX', carrier: 'Veridex Insurance', owner: 'Sunita Pillai',
      assignedMGAs: [
        { mgaId: 'MGA-CRESTLINE', mgaName: 'Crestline MGU', status: 'assigned', assignedAt: '10-Aug-2026', configuration: { studiosDone: 5, lastSavedAt: '21-Aug-2026' } },
        { mgaId: 'MGA-NORTHBRIDGE', mgaName: 'Northbridge MGU', status: 'assigned', assignedAt: '12-Aug-2026', configuration: { studiosDone: 3, lastSavedAt: '20-Aug-2026' } }
      ],
      pending: false
    },
    {
      id: 'PRD-011', name: 'Commercial Vehicle Fleet',
      family: 'Trucking', version: '2026.05-DRAFT', status: 'draft',
      effectiveFrom: null, effectiveTo: null,
      lastModified: '18-Aug-2026', lastModifiedBy: 'Anika Sharma',
      carrierId: 'RC-VERIDEX', carrier: 'Veridex Insurance', owner: 'Anika Sharma',
      assignedMGAs: [],
      pending: true
    },
    {
      id: 'PRD-020', name: 'Cyber Liability — SME',
      family: 'Cyber', version: '2026.09', status: 'published',
      effectiveFrom: '01-Sep-2026', effectiveTo: '31-Aug-2027',
      lastModified: '22-Aug-2026', lastModifiedBy: 'David Okonkwo',
      carrierId: 'RC-ATLAS', carrier: 'Atlas Mutual', owner: 'David Okonkwo',
      assignedMGAs: [
        { mgaId: 'MGA-CRESTLINE', mgaName: 'Crestline MGU', status: 'assigned', assignedAt: '19-Aug-2026', configuration: { studiosDone: 2, lastSavedAt: '20-Aug-2026' } }
      ],
      pending: false
    },
  ],

  pendingActions: [
    {
      type: 'draft', typeLabel: 'Draft Incomplete',
      product: 'Commercial Vehicle Fleet',
      productId: 'PRD-011',
      detail: 'Rating Studio has no base rate configured',
      since: '5 days ago',
      action: 'Complete'
    },
    {
      type: 'expiring', typeLabel: 'Version Expiring',
      product: 'Commercial Truck Comprehensive v2026.08',
      productId: 'PRD-015',
      detail: 'Effective end date: 31-Jul-2027. Plan successor version before expiry.',
      since: '14 days ago',
      action: 'Review'
    }
  ],

  activityFeed: [
    { userId:'U003', action:'published', subject:'Commercial Truck Comprehensive v2026.08', time:'Just now', status:'published' },
    { userId:'U004', action:'published', subject:'Cyber Liability — SME v2026.09', time:'2 hours ago', status:'published' },
    { userId:'U006', action:'started configuring', subject:'Commercial Truck Comprehensive', time:'Yesterday 14:22', status:null },
    { userId:'U003', action:'updated eligibility rules in', subject:'Cyber Liability — SME', time:'2 days ago', status:null },
    { userId:'U004', action:'commented on', subject:'Cyber Liability compliance review', time:'2 days ago', status:null }
  ],

  pipeline: {
    draft:      { count: 1,  label: 'Draft' },
    review:     { count: 0,  label: 'In Review' },
    approved:   { count: 0,  label: 'Approved' },
    published:  { count: 2,  label: 'Published' },
    superseded: { count: 0,  label: 'Superseded' },
    retired:    { count: 0,  label: 'Retired' }
  },

  kpis: {
    activeProducts:    { value: 3,  label: 'Total Active Products', sub: 'Published and Approved versions', trend: '+1', trendDir: 'up' },
    pendingApproval:   { value: 0,  label: 'Pending Approval', sub: 'Awaiting governance action', trend: '0', trendDir: 'up' },
    inDraft:           { value: 1,  label: 'In Draft', sub: 'Versions in active design', trend: '+1', trendDir: 'up' },
    publishedThisMonth:{ value: 2,  label: 'Published This Month', sub: 'Released this calendar month', trend: '+1', trendDir: 'up' }
  }
};

/* Apply the signed-in session (if any) to the shared current-user
   shape, then enforce the login guard for the current page.     */
(function () {
  PS.auth.applyToData(PS.auth.current());
  PS.auth.guard();
})();

PS.getUser = (id) => PS.data.users.find(u => u.id === id);
PS.statusBadgeClass = (status) => {
  const map = { draft:'badge-draft', review:'badge-review', approved:'badge-approved', published:'badge-published', superseded:'badge-superseded', retired:'badge-retired' };
  return map[status] || 'badge-draft';
};
PS.statusLabel = (status) => {
  const map = { draft:'Draft', review:'In Review', approved:'Approved', published:'Published', superseded:'Superseded', retired:'Retired' };
  return map[status] || status;
};