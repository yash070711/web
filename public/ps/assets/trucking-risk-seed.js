/* Commercial Trucking risk attributes — Risk Studio */
window.PS = window.PS || {};

(function () {
  const GROUPS = [
    { id: 'operations', label: 'Operations', filterKey: 'operations' },
    { id: 'fleet', label: 'Fleet', filterKey: 'fleet' },
    { id: 'vehicle', label: 'Vehicle', filterKey: 'vehicle' },
    { id: 'driver', label: 'Driver', filterKey: 'driver' },
    { id: 'commodity', label: 'Commodity', filterKey: 'commodity' },
    { id: 'safety', label: 'Safety', filterKey: 'safety' },
    { id: 'loss-history', label: 'Loss History', filterKey: 'loss history' },
    { id: 'policy-administration', label: 'Policy Administration', filterKey: 'policy administration' },
    { id: 'claims', label: 'Claims', filterKey: 'claims' },
    { id: 'renewal', label: 'Renewal', filterKey: 'renewal' }
  ];

  function slug(label) {
    return String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function attr(id, name, groupId, groupLabel, type) {
    const g = GROUPS.find(x => x.id === groupId) || GROUPS[0];
    return {
      id,
      name,
      code: id,
      source: 'Question',
      questionGroup: groupLabel || g.label,
      questionGroupId: groupId,
      category: groupLabel || g.label,
      extra: groupLabel || g.label,
      type: type || 'Text',
      required: false,
      status: 'active',
      description: `${name} — risk attribute linked to the ${groupLabel || g.label} question group.`,
      fieldKey: slug(name)
    };
  }

  function rows(groupId, prefix, pairs) {
    const g = GROUPS.find(x => x.id === groupId);
    return pairs.map(([code, name, type]) => attr(`RSK-${prefix}-${code}`, name, groupId, g.label, type));
  }

  PS.truckingQuestionGroupMeta = function truckingQuestionGroupMeta() {
    return GROUPS.slice();
  };

  PS.truckingRiskAttributes = function truckingRiskAttributes() {
    return [
      ...rows('operations', 'OPR', [
        ['001', 'Trucking Business Type', 'Select'],
        ['002', 'Years in Business', 'Number'],
        ['003', 'Primary Operation', 'Select'],
        ['004', 'Operating Territory', 'Select'],
        ['005', 'Primary State of Operation', 'Select'],
        ['006', 'Radius of Operation', 'Select'],
        ['007', 'Interstate / Intrastate', 'Select'],
        ['008', 'Annual Gross Revenue', 'Number'],
        ['009', 'Annual Trucking Revenue', 'Number'],
        ['010', 'Number of Locations', 'Number'],
        ['011', 'Business Ownership Type', 'Select'],
        ['012', 'Years Under Current Ownership', 'Number'],
        ['013', 'For-Hire Operations Percentage', 'Number'],
        ['014', 'Private Operations Percentage', 'Number'],
        ['015', 'Contracted Freight Percentage', 'Number'],
        ['016', 'Seasonal Operations', 'Boolean']
      ]),
      ...rows('fleet', 'FLT', [
        ['001', 'Fleet Size', 'Number'],
        ['002', 'Power Units', 'Number'],
        ['003', 'Trailers', 'Number'],
        ['004', 'Vehicle Types', 'Multi-select'],
        ['005', 'Average Fleet Age', 'Number'],
        ['006', 'Annual Mileage', 'Number'],
        ['007', 'Average Mileage per Unit', 'Number'],
        ['008', 'Owned Vehicles', 'Number'],
        ['009', 'Leased Vehicles', 'Number'],
        ['010', 'Hired Vehicles', 'Number']
      ]),
      ...rows('vehicle', 'VEH', [
        ['001', 'Vehicle Type', 'Select'],
        ['002', 'Vehicle Year', 'Number'],
        ['003', 'Vehicle Make', 'Text'],
        ['004', 'Vehicle Model', 'Text'],
        ['005', 'Vehicle Value', 'Number'],
        ['006', 'VIN', 'Text'],
        ['007', 'Vehicle Usage', 'Select'],
        ['008', 'Garaging State', 'Select'],
        ['009', 'Garaging ZIP Code', 'Text'],
        ['010', 'Vehicle Radius', 'Select'],
        ['011', 'Vehicle Ownership', 'Select'],
        ['012', 'Vehicle Lease Status', 'Select'],
        ['013', 'Special Equipment', 'Multi-select'],
        ['014', 'Vehicle Modification', 'Boolean'],
        ['015', 'Anti-Theft Device', 'Boolean'],
        ['016', 'Telematics Installed', 'Boolean']
      ]),
      ...rows('driver', 'DRV', [
        ['001', 'Number of Drivers', 'Number'],
        ['002', 'Minimum Driver Age', 'Number'],
        ['003', 'Average Driver Age', 'Number'],
        ['004', 'Average Driving Experience', 'Number'],
        ['005', 'CDL Required', 'Boolean'],
        ['006', 'CDL Experience', 'Number'],
        ['007', 'Driver Type', 'Select'],
        ['008', 'Driver Turnover Rate', 'Number'],
        ['009', 'MVR Review Frequency', 'Select'],
        ['010', 'Major Violations', 'Number'],
        ['011', 'Minor Violations', 'Number'],
        ['012', 'Driver Accidents', 'Number'],
        ['013', 'Driver Training Program', 'Boolean'],
        ['014', 'Written Hiring Policy', 'Boolean'],
        ['015', 'Drug & Alcohol Testing Program', 'Boolean']
      ]),
      ...rows('commodity', 'CMD', [
        ['001', 'Primary Commodity', 'Select'],
        ['002', 'Commodity Types', 'Multi-select'],
        ['003', 'Average Cargo Value', 'Number'],
        ['004', 'Maximum Cargo Value', 'Number'],
        ['005', 'Annual Cargo Revenue', 'Number'],
        ['006', 'Hazardous Materials', 'Boolean'],
        ['007', 'Hazmat Percentage', 'Number'],
        ['008', 'Flammable Materials', 'Boolean'],
        ['009', 'Refrigerated Cargo', 'Boolean'],
        ['010', 'Reefer Breakdown Exposure', 'Boolean'],
        ['011', 'High-Value Cargo', 'Boolean'],
        ['012', 'Cargo Theft Exposure', 'Boolean'],
        ['013', 'Cargo Loading Method', 'Select'],
        ['014', 'Cargo Unloading Method', 'Select'],
        ['015', 'Temperature-Controlled Cargo', 'Boolean'],
        ['016', 'Livestock Cargo', 'Boolean'],
        ['017', 'Oversized / Heavy Haul', 'Boolean'],
        ['018', 'Double / Triple Trailer Operations', 'Boolean'],
        ['019', 'Cross-Border Cargo', 'Boolean']
      ]),
      ...rows('safety', 'SFT', [
        ['001', 'Safety Program', 'Boolean'],
        ['002', 'Formal Safety Policy', 'Boolean'],
        ['003', 'Driver Safety Training', 'Boolean'],
        ['004', 'Defensive Driving Training', 'Boolean'],
        ['005', 'Fleet Maintenance Program', 'Boolean'],
        ['006', 'Preventive Maintenance Frequency', 'Select'],
        ['007', 'Telematics Usage', 'Boolean'],
        ['008', 'GPS Tracking', 'Boolean'],
        ['009', 'Dash Cameras', 'Boolean'],
        ['010', 'Electronic Logging Devices', 'Boolean'],
        ['011', 'Drug & Alcohol Policy', 'Boolean'],
        ['012', 'Safety Violation History', 'Boolean'],
        ['013', 'DOT Inspection History', 'Select'],
        ['014', 'CSA Safety Score', 'Number']
      ]),
      ...rows('loss-history', 'LSS', [
        ['001', 'Prior Claims', 'Boolean'],
        ['002', 'Claims in Last 3 Years', 'Number'],
        ['003', 'Claims in Last 5 Years', 'Number'],
        ['004', 'Total Incurred Losses', 'Number'],
        ['005', 'Largest Individual Loss', 'Number'],
        ['006', 'Auto Liability Losses', 'Number'],
        ['007', 'Physical Damage Losses', 'Number'],
        ['008', 'Cargo Losses', 'Number'],
        ['009', 'Bodily Injury Claims', 'Number'],
        ['010', 'Open Claims', 'Number'],
        ['011', 'Prior Insurance Carrier', 'Text'],
        ['012', 'Prior Policy Cancellation', 'Boolean'],
        ['013', 'Prior Non-Renewal', 'Boolean']
      ]),
      ...rows('policy-administration', 'POL', [
        ['001', 'Business Operations Changed', 'Boolean'],
        ['002', 'Change in Ownership', 'Boolean'],
        ['003', 'New Operating Location', 'Boolean'],
        ['004', 'Change in Operating Territory', 'Boolean'],
        ['005', 'Change in Insured Information', 'Boolean']
      ]),
      ...rows('claims', 'CLM', [
        ['001', 'New Claims Since Bind', 'Number'],
        ['002', 'New Auto Accidents', 'Number'],
        ['003', 'New Bodily Injury Claims', 'Number'],
        ['004', 'New Property Damage Claims', 'Number'],
        ['005', 'New Cargo Claims', 'Number'],
        ['006', 'Open Claims', 'Number'],
        ['007', 'Large Loss Event', 'Boolean'],
        ['008', 'Significant Incident', 'Boolean']
      ]),
      ...rows('renewal', 'RNW', [
        ['001', 'Current Fleet Size', 'Number'],
        ['002', 'Current Driver Count', 'Number'],
        ['003', 'Current Annual Mileage', 'Number'],
        ['004', 'Current Annual Revenue', 'Number'],
        ['005', 'New States of Operation', 'Multi-select'],
        ['006', 'Exposure Change', 'Select']
      ])
    ];
  };

  PS.normalizeRiskAttribute = function normalizeRiskAttribute(r) {
    const group = r.questionGroup || r.category || r.extra || 'Operations';
    const meta = GROUPS.find(g => g.label.toLowerCase() === String(group).toLowerCase())
      || GROUPS.find(g => g.id === r.questionGroupId);
    return Object.assign({}, r, {
      name: r.name || r.label,
      source: r.source || 'Question',
      questionGroup: meta ? meta.label : group,
      questionGroupId: r.questionGroupId || meta?.id || slug(group),
      category: meta ? meta.label : group,
      extra: meta ? meta.label : group,
      riskLevel: r.riskLevel || r.riskType || 'Medium',
      sourceQuestionId: r.sourceQuestionId || r.questionId || '',
    questionId: r.questionId || r.sourceQuestionId || '',
      usedBy: Array.isArray(r.usedBy) ? r.usedBy : [],
      availableForEligibility: r.availableForEligibility === true || (Array.isArray(r.usedBy) && r.usedBy.includes('eligibility')),
    });
  };

  PS.riskGroupFilterKey = function riskGroupFilterKey(item) {
    const meta = GROUPS.find(g => g.id === item?.questionGroupId);
    if (meta) return meta.filterKey;
    return String(item?.questionGroup || item?.category || item?.extra || '').toLowerCase();
  };
})();
