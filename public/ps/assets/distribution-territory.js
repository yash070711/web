window.PS = window.PS || {};

// Resolve grants only along this product's source lineage, never by product name.
PS.distributionTerritoryForCover = function (productId, cover) {
  const app = PS.prototypeApp;
  const seen = new Set();
  let id = productId;
  let distribution = null;
  while (id && !seen.has(String(id))) {
    seen.add(String(id));
    try {
      const saved = JSON.parse(localStorage.getItem(`veridex-distribution-${id}`) || 'null');
      if (saved && String(saved.productId) === String(id) && /southlake/i.test(saved.carrier || '')) {
        distribution = saved;
        break;
      }
    } catch (_) { /* Missing or unreadable grants provide no permitted territory. */ }
    const product = app?.productById?.(id) || app?.state?.productDetails?.[id];
    id = product?.sourceProductId;
  }
  if (!distribution) return [];
  const norm = value => String(value || '').trim().toLowerCase();
  const classes = Array.isArray(distribution.classes) ? distribution.classes : [];
  const ids = [cover?.id, cover?.sourceCoverId].filter(Boolean).map(String);
  const parent = classes.find(row => ids.includes(String(row.id))) ||
    classes.find(row => (cover?.code && norm(row.code) === norm(cover.code)) ||
      (cover?.name && norm(row.name) === norm(cover.name)));
  if (!parent) return [];
  const rows = new Map();
  const assigned = Array.isArray(distribution.assigned) ? distribution.assigned : [];
  assigned.forEach(channel => {
    const config = distribution.configs?.[`${channel.type}|${channel.name}`];
    (Array.isArray(config?.grants) ? config.grants : []).forEach(grant => {
      if (String(grant.parent) !== String(parent.id)) return;
      (Array.isArray(grant.states) ? grant.states : []).forEach(state => {
        const code = String(state).trim().toUpperCase();
        if (!code) return;
        const territory = grant.territory?.[state] || {};
        const list = value => (Array.isArray(value) ? value : String(value || '').split(/[,;\n]/)).map(x => String(x).trim()).filter(Boolean);
        const cities = list(territory.cities);
        const counties = list(territory.counties);
        const locations = [cities.length ? `Cities: ${cities.join(', ')}` : '', counties.length ? `Counties: ${counties.join(', ')}` : ''].filter(Boolean).join('; ');
        const mode = territory.mode || 'state';
        const rule = mode === 'local' ? (locations ? `Only selected locations — ${locations}` : 'No cities or counties permitted') :
          mode === 'exclude' && locations ? `Entire state except ${locations}` : 'Entire state permitted';
        if (!rows.has(code)) rows.set(code, { state: code, rules: [] });
        const rules = rows.get(code).rules;
        if (!rules.includes(rule)) rules.push(rule);
      });
    });
  });
  return Array.from(rows.values()).map(row => ({ ...row, rules: row.rules.includes('Entire state permitted') ? ['Entire state permitted'] : row.rules }));
};