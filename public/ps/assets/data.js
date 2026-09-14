/* ============================================================
   Insurance Product Studio — Shared Dummy Data Store
   data.js
   ============================================================ */

window.PS = window.PS || {};

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
      pending: false
    },
    {
      id: 'PRD-011', name: 'Commercial Vehicle Fleet',
      family: 'Trucking', version: '2026.05-DRAFT', status: 'draft',
      effectiveFrom: null, effectiveTo: null,
      lastModified: '18-Aug-2026', lastModifiedBy: 'Anika Sharma',
      pending: true
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
      action: 'View'
    }
  ],

  activityFeed: [
    { userId:'U003', action:'published', subject:'Commercial Truck Comprehensive v2026.08', time:'Just now', status:'published' },
    { userId:'U002', action:'approved rating for', subject:'Commercial Truck Comprehensive', time:'Yesterday 14:22', status:'approved' },
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

PS.getUser = (id) => PS.data.users.find(u => u.id === id);
PS.statusBadgeClass = (status) => {
  const map = { draft:'badge-draft', review:'badge-review', approved:'badge-approved', published:'badge-published', superseded:'badge-superseded', retired:'badge-retired' };
  return map[status] || 'badge-draft';
};
PS.statusLabel = (status) => {
  const map = { draft:'Draft', review:'In Review', approved:'Approved', published:'Published', superseded:'Superseded', retired:'Retired' };
  return map[status] || status;
};
