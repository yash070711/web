window.PS = window.PS || {};

function distributionForProductLineage(productId) {
  const app = PS.prototypeApp;
  const seen = new Set();
  let id = productId;
  while (id && !seen.has(String(id))) {
    seen.add(String(id));
    try {
      const saved = JSON.parse(localStorage.getItem(`veridex-distribution-${id}`) || 'null');
      if (saved && String(saved.productId) === String(id) && /southlake/i.test(saved.carrier || '')) return saved;
    } catch (_) { /* Missing or unreadable distribution configuration. */ }
    const product = app?.productById?.(id) || app?.state?.productDetails?.[id];
    id = product?.sourceProductId;
  }
  return null;
}

function futuristicDistributionChannels(distribution) {
  const assigned = Array.isArray(distribution?.assigned) ? distribution.assigned : [];
  const futuristic = assigned.filter(channel => /^futuristic$/i.test(String(channel?.name || '').trim()));
  // Older saved SouthLake records may predate the named organization. Keep
  // their established territory behavior until the channel is saved again.
  return futuristic.length ? futuristic : assigned;
}

// Return the parent Class of Business covers granted to at least one saved
// distribution channel. A null result means Distribution has not been
// configured yet, so upstream Class of Business remains unfiltered.
PS.distributionCoverScope = function (productId) {
  const distribution = distributionForProductLineage(productId);
  if (!distribution) return null;
  const classes = Array.isArray(distribution.classes) ? distribution.classes : [];
  const parentIds = new Set();
  futuristicDistributionChannels(distribution).forEach(channel => {
    const config = distribution.configs?.[`${channel.type}|${channel.name}`];
    (Array.isArray(config?.grants) ? config.grants : []).forEach(grant => {
      if (grant?.parent != null && String(grant.parent).trim()) parentIds.add(String(grant.parent));
    });
  });
  const parents = classes.filter(row => parentIds.has(String(row.id)));
  return {
    ids: new Set(parents.flatMap(row => [row.id, row.sourceCoverId].filter(Boolean).map(String))),
    codes: new Set(parents.map(row => String(row.code || '').trim().toLowerCase()).filter(Boolean)),
    names: new Set(parents.map(row => String(row.name || '').trim().toLowerCase()).filter(Boolean))
  };
};

PS.distributionAllowsCover = function (productId, cover) {
  const scope = PS.distributionCoverScope(productId);
  if (!scope) return true;
  const ids = [cover?.id, cover?.sourceCoverId].filter(Boolean).map(String);
  if (ids.some(id => scope.ids.has(id))) return true;
  const code = String(cover?.code || '').trim().toLowerCase();
  if (code && scope.codes.has(code)) return true;
  const name = String(cover?.name || '').trim().toLowerCase();
  return Boolean(name && scope.names.has(name));
};

// Resolve grants only along this product's source lineage, never by product name.
PS.distributionTerritoryForCover = function (productId, cover) {
  const distribution = distributionForProductLineage(productId);
  if (!distribution) return [];
  const norm = value => String(value || '').trim().toLowerCase();
  const classes = Array.isArray(distribution.classes) ? distribution.classes : [];
  const ids = [cover?.id, cover?.sourceCoverId].filter(Boolean).map(String);
  const parent = classes.find(row => ids.includes(String(row.id))) ||
    classes.find(row => (cover?.code && norm(row.code) === norm(cover.code)) ||
      (cover?.name && norm(row.name) === norm(cover.name)));
  if (!parent) return [];
  const rows = new Map();
  futuristicDistributionChannels(distribution).forEach(channel => {
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
        if (!rows.has(code)) rows.set(code, { state: code, rules: [], cities: [], counties: [], excludedCities: [], excludedCounties: [], entireState: false });
        const entry = rows.get(code);
        if (!entry.rules.includes(rule)) entry.rules.push(rule);
        if (mode === 'local') {
          cities.forEach(city => { if (!entry.cities.includes(city)) entry.cities.push(city); });
          counties.forEach(county => { if (!entry.counties.includes(county)) entry.counties.push(county); });
        } else {
          entry.entireState = true;
          if (mode === 'exclude') {
            cities.forEach(city => { if (!entry.excludedCities.includes(city)) entry.excludedCities.push(city); });
            counties.forEach(county => { if (!entry.excludedCounties.includes(county)) entry.excludedCounties.push(county); });
          }
        }
      });
    });
  });
  return Array.from(rows.values()).map(row => {
    const all = row.rules.includes('Entire state permitted');
    return {
      ...row,
      entireState: all || row.entireState,
      rules: all ? ['Entire state permitted'] : row.rules,
      cities: row.cities.sort((a, b) => a.localeCompare(b)),
      counties: row.counties.sort((a, b) => a.localeCompare(b)),
      excludedCities: all ? [] : row.excludedCities.sort((a, b) => a.localeCompare(b)),
      excludedCounties: all ? [] : row.excludedCounties.sort((a, b) => a.localeCompare(b)),
    };
  });
};
