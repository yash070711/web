/* Reference data for Create Distribution Channel */
window.PS = window.PS || {};
PS.distributionCreate = PS.distributionCreate || {};

PS.distributionCreate.carriers = [
  { id: 'CAR-001', name: 'ABC Insurance Company' },
  { id: 'CAR-002', name: 'XYZ Insurance Company' },
  { id: 'CAR-003', name: 'Acme Insurance' },
  { id: 'CAR-004', name: 'Global Insurance Group' },
  { id: 'CAR-005', name: 'SouthLake Carrier' }
];

PS.distributionCreate.reinsurers = [
  { id: 'RE-001', name: 'Swiss Re' },
  { id: 'RE-002', name: 'Munich Re' },
  { id: 'RE-003', name: 'Hannover Re' },
  { id: 'RE-004', name: 'SCOR Global P&C' },
  { id: 'RE-005', name: 'PartnerRe' },
  { id: 'RE-006', name: 'Berkshire Hathaway Re' }
];

PS.distributionCreate.mgas = [
  { id: 'MGA-001', name: 'ABC MGA Services' },
  { id: 'MGA-002', name: 'Global Risk Partners' },
  { id: 'MGA-003', name: 'Premier Underwriting Group' },
  { id: 'MGA-004', name: 'Summit MGA' },
  { id: 'MGA-005', name: 'United MGA' },
  { id: 'MGA-006', name: 'Atlantic Risk MGA' }
];

PS.distributionCreate.commissionTypes = ['Percentage (%)', 'Flat Amount'];
PS.distributionCreate.commissionBases = [
  'Gross Written Premium',
  'Net Written Premium',
  'Gross Premium',
  'Net Premium',
  'Commissionable Premium'
];
PS.distributionCreate.factorTypes = ['Percentage (%)', 'Multiplier', 'Flat Amount', 'Fixed Value'];
PS.distributionCreate.appliesToOptions = [
  'All Accounts',
  'All MGAs',
  'All States',
  'All Coverages',
  'All Products',
  'Specific MGA',
  'Specific State',
  'Specific Coverage'
];

PS.distributionCreate.usStates = [
  { id: 'AL', name: 'Alabama', code: 'AL', cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'] },
  { id: 'AK', name: 'Alaska', code: 'AK', cities: ['Anchorage', 'Fairbanks', 'Juneau'] },
  { id: 'AZ', name: 'Arizona', code: 'AZ', cities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'] },
  { id: 'CA', name: 'California', code: 'CA', cities: ['Los Angeles', 'San Diego', 'San Francisco', 'Sacramento', 'San Jose', 'Oakland'] },
  { id: 'FL', name: 'Florida', code: 'FL', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'] },
  { id: 'IL', name: 'Illinois', code: 'IL', cities: ['Chicago', 'Springfield', 'Naperville', 'Peoria'] },
  { id: 'NY', name: 'New York', code: 'NY', cities: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'] },
  { id: 'TX', name: 'Texas', code: 'TX', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'] }
];

PS.distributionCreate.defaultProductStates = {
  'PRD-015': ['CA', 'TX', 'NY', 'FL'],
  'PRD-011': ['CA', 'TX', 'IL'],
  'PRD-020': ['NY', 'CA', 'IL']
};

PS.distributionCreate.coveragesFromCatalogue = function coveragesFromCatalogue(product) {
  if (!product) return [];
  const app = PS.prototypeApp;
  const bundle = app?.getProductBundle?.(product.id, product.version);
  const seedCovers = PS.studioSeeds?.[product.id]?.covers
    || (product.sourceProductId ? PS.studioSeeds?.[product.sourceProductId]?.covers : null)
    || [];
  const raw = (Array.isArray(bundle?.covers) && bundle.covers.length) ? bundle.covers : seedCovers;
  return (raw || []).map(c => ({
    id: c.id || c.code,
    name: c.name || c.label || c.id,
    productId: product.id
  })).filter(c => c.id);
};

PS.distributionCreate.lobForProduct = function lobForProduct(product) {
  if (!product) return '';
  return product.lob || product.productType || product.lineOfBusiness || product.family || '';
};

PS.distributionCreate.linkedStateIdsForProduct = function linkedStateIdsForProduct(product) {
  const find = PS.distributionCreate.findState;
  const fromSetup = (PS.prototypeApp?.jurisdictionSetupFor?.(product.id) || [])
    .map(row => {
      const raw = String(row.state || '');
      const st = find(raw) || PS.distributionCreate.usStates.find(s => s.name.toLowerCase() === raw.toLowerCase());
      return st?.id;
    })
    .filter(Boolean);
  if (fromSetup.length) return fromSetup;
  const fromProduct = (product.jurisdictions || [])
    .map(j => {
      const raw = String(j);
      const st = find(raw) || PS.distributionCreate.usStates.find(s => s.name.toLowerCase() === raw.toLowerCase());
      return st?.id;
    })
    .filter(Boolean);
  if (fromProduct.length) return fromProduct;
  return PS.distributionCreate.defaultProductStates[product.id]
    || PS.distributionCreate.usStates.slice(0, 3).map(s => s.id);
};

PS.distributionCreate.buildProductCatalog = function buildProductCatalog() {
  const app = PS.prototypeApp;
  const fromState = app?.state?.products;
  const products = (Array.isArray(fromState) && fromState.length)
    ? fromState
    : (PS.data?.products || []);
  const typeMap = { Trucking: 'Commercial', 'Commercial Auto': 'Commercial', Cyber: 'Commercial' };

  return products.map(p => {
    const coverages = PS.distributionCreate.coveragesFromCatalogue(p);
    return {
      id: p.id,
      name: p.name,
      code: p.code || p.id,
      version: p.version || '',
      lob: PS.distributionCreate.lobForProduct(p),
      type: typeMap[p.family] || typeMap[p.productType] || 'Commercial',
      currency: p.currency || 'USD',
      status: p.status === 'published' ? 'Active' : (p.status === 'draft' ? 'Draft' : (p.status || 'Draft')),
      linkedCoverageIds: coverages.map(c => c.id),
      linkedStateIds: PS.distributionCreate.linkedStateIdsForProduct(p),
      coverages
    };
  });
};

PS.distributionCreate.findState = function findState(id) {
  return PS.distributionCreate.usStates.find(s => s.id === id || s.code === id);
};

PS.distributionCreate.findProduct = function findProduct(id) {
  return PS.distributionCreate.buildProductCatalog().find(p => p.id === id);
};
