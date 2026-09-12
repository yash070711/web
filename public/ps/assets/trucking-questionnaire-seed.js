/* Default trucking questionnaire groups — Questionnaire Studio */
window.PS = window.PS || {};

(function () {
  function slug(label) {
    return String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function q(prefix, index, label, type, extra) {
    return Object.assign({
      id: `QST-${prefix}-${String(index).padStart(3, '0')}`,
      label,
      internalName: slug(label),
      type,
      required: true,
      conditional: false,
      incomplete: false
    }, extra || {});
  }

  function group(id, label, prefix, rows, extra) {
    return Object.assign({
      id,
      label,
      open: false,
      bindPhase: 'pre-bind',
      questions: rows.map((row, i) => {
        const [questionLabel, type, qExtra] = row;
        return q(prefix, i + 1, questionLabel, type, qExtra);
      })
    }, extra || {});
  }

  PS.truckingQuestionGroups = function truckingQuestionGroups() {
    return [
      group('grp-ops', 'Operations', 'OPS', [
        ['Business Type', 'select'],
        ['Years in Business', 'number'],
        ['DOT Number', 'text'],
        ['MC Number', 'text'],
        ['Operating Authority', 'select'],
        ['Interstate / Intrastate', 'select'],
        ['Operating Radius', 'select'],
        ['Annual Mileage', 'number'],
        ['Annual Revenue', 'currency'],
        ['States Operated', 'multisel'],
        ['Primary Garaging State', 'select'],
        ['For-Hire / Private Carrier', 'select'],
        ['Common / Contract Carrier', 'select'],
        ['Owner Operator Usage', 'boolean'],
        ['Brokerage Operations', 'boolean'],
        ['Hazmat Operations', 'boolean']
      ]),
      group('grp-fleet', 'Fleet', 'FLT', [
        ['Fleet Size', 'number'],
        ['Power Units', 'number'],
        ['Trailers', 'number'],
        ['Owned Vehicles', 'number'],
        ['Leased Vehicles', 'number'],
        ['Owner-Operator Vehicles', 'number'],
        ['Average Vehicle Age', 'number'],
        ['Maximum Vehicle Age', 'number'],
        ['Fleet Growth', 'select'],
        ['Vehicle Replacement Program', 'boolean']
      ]),
      group('grp-vehicle', 'Vehicle', 'VEH', [
        ['VIN', 'text'],
        ['Year', 'number'],
        ['Make', 'text'],
        ['Model', 'text'],
        ['Vehicle Type', 'select'],
        ['Body Type', 'select'],
        ['GVW', 'number'],
        ['Vehicle Value', 'currency'],
        ['Stated Amount', 'currency'],
        ['Ownership Type', 'select'],
        ['Lease Type', 'select'],
        ['Garaging Location', 'address'],
        ['Annual Mileage', 'number'],
        ['Operating Radius', 'select'],
        ['Primary Use', 'select'],
        ['Safety Equipment', 'multisel']
      ]),
      group('grp-driver', 'Driver', 'DRV', [
        ['Driver Name', 'text'],
        ['Date of Birth', 'date'],
        ['License Number', 'text'],
        ['License State', 'select'],
        ['CDL Class', 'select'],
        ['CDL Status', 'select'],
        ['Years CDL Experience', 'number'],
        ['Years Trucking Experience', 'number'],
        ['Major Violations', 'number'],
        ['Minor Violations', 'number'],
        ['At-Fault Accidents', 'number'],
        ['Suspensions', 'number'],
        ['DUI/DWI', 'boolean'],
        ['MVR Status', 'select'],
        ['Driver Status', 'select']
      ]),
      group('grp-commodity', 'Commodity', 'CMD', [
        ['General Freight', 'boolean', { required: false }],
        ['Dry Goods', 'boolean', { required: false }],
        ['Refrigerated Goods', 'boolean', { required: false }],
        ['Food Products', 'boolean', { required: false }],
        ['Building Materials', 'boolean', { required: false }],
        ['Automobiles', 'boolean', { required: false }],
        ['Machinery', 'boolean', { required: false }],
        ['Electronics', 'boolean', { required: false }],
        ['Household Goods', 'boolean', { required: false }],
        ['Livestock', 'boolean', { required: false }],
        ['Hazardous Materials', 'boolean', { required: false }],
        ['Explosives', 'boolean', { required: false }],
        ['Fuel', 'boolean', { required: false }],
        ['Commodity Type', 'select'],
        ['Percentage of Revenue', 'number'],
        ['Maximum Load Value', 'currency'],
        ['Average Load Value', 'currency'],
        ['Hazardous', 'boolean'],
        ['Refrigerated', 'boolean']
      ]),
      group('grp-safety', 'Safety', 'SAF', [
        ['DOT Safety Rating', 'select'],
        ['SAFER Score', 'number'],
        ['CSA Score', 'number'],
        ['Out-of-Service Rate', 'number'],
        ['Vehicle Inspection Rate', 'number'],
        ['Driver Inspection Rate', 'number'],
        ['ELD Used', 'boolean'],
        ['Telematics Used', 'boolean'],
        ['Dash Cameras', 'boolean'],
        ['Driver Monitoring', 'boolean'],
        ['Safety Program', 'boolean'],
        ['Drug Testing Program', 'boolean'],
        ['Driver Training Program', 'boolean'],
        ['Maintenance Program', 'boolean']
      ]),
      group('grp-loss', 'Loss-history', 'LSS', [
        ['Loss Period', 'daterange'],
        ['Number of Claims', 'number'],
        ['Paid Losses', 'currency'],
        ['Outstanding Losses', 'currency'],
        ['Incurred Losses', 'currency'],
        ['Loss Ratio', 'number'],
        ['Large Losses', 'number'],
        ['Fatality Claims', 'number'],
        ['Open Claims', 'number'],
        ['Prior Carrier', 'text'],
        ['Prior Premium', 'currency'],
        ['Cancellation History', 'boolean'],
        ['Non-Renewal History', 'boolean']
      ]),
      group('grp-policy', 'Policy Administration', 'POL', [
        ['Billing Method', 'select'],
        ['Payment Plan', 'select'],
        ['Policy Delivery Preference', 'select'],
        ['Named Insured Contact', 'text'],
        ['Certificate Holder Requirements', 'textarea']
      ], { bindPhase: 'post-bind' }),
      group('grp-claims', 'Claims', 'CLM', [
        ['Claims Contact Name', 'text'],
        ['Claims Contact Phone', 'text'],
        ['Claims Reporting Method', 'select'],
        ['Average Claim Response Time', 'number'],
        ['Open Claims Count', 'number'],
        ['Claims Made vs Occurrence', 'select'],
        ['Deductible Responsibility', 'select'],
        ['Subrogation Interest', 'boolean']
      ], { bindPhase: 'post-bind' }),
      group('grp-renewal', 'Renewal', 'RNW', [
        ['Renewal Date', 'date'],
        ['Renewal Notice Period', 'select'],
        ['Auto-Renewal Preference', 'boolean'],
        ['Renewal Pricing Review', 'boolean'],
        ['Mid-Term Change Policy', 'select'],
        ['Non-Renewal Notice', 'boolean']
      ], { bindPhase: 'post-bind' })
    ];
  };

  PS.isTruckingProduct = function isTruckingProduct(product) {
    if (!product) return false;
    const family = String(product.family || product.productType || '').trim();
    const name = String(product.name || '').trim();
    const segment = String(product.segment || product.lineOfBusiness || '').trim();
    return family === 'Commercial Auto'
      || family === 'Trucking'
      || /commercial auto/i.test(family)
      || /truck/i.test(family)
      || /truck/i.test(name)
      || /auto liability|motor truck cargo|physical damage|garage liability|commercial auto/i.test(segment);
  };
})();
