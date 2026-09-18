/* Seed configurations for fully built products. Loaded after data.js. */
window.PS = window.PS || {};

PS.studioSeeds = PS.studioSeeds || {};

PS.studioSeeds['PRD-015'] = {
  version: '2026.08',
  covers: [
    {
      id:'COV-CT-001', name:'Own Damage — Truck & Chassis', code:'COV-OD-CT-001',
      availability:'mandatory', complete:true, type:'First Party — Property Damage',
      description:'Covers accidental damage, fire, explosion, and natural peril loss to the insured truck, chassis, and permanently fitted equipment.',
      basisOfCoverage:'Agreed Value', sumInsured:'180,000', maxSingleLimit:'180,000', subLimit:'',
      deductibleType:'percentage', deductibleAmount:'', deductiblePct:'2.5', minDeductible:'1,000', maxDeductible:'8,000',
      copay:'0', waitingPeriod:'None', annualAggregate:false, defaultSelected:true, mutualExclusions:[],
      conditionalOn:'', dependencies:[{ type:'Bundles with', dependsOn:'Third Party Liability', condition:'Always' }],
      constraints:[{ field:'Gross Vehicle Weight', operator:'≤', value:'49 tonnes' },{ field:'Vehicle Age', operator:'≤', value:'20 years' },{ field:'Body Type', operator:'is one of', value:'Rigid, Tractor Unit, Tipper, Tanker, Box, Flatbed' }],
      lossBasis:'Per Occurrence', reinstatement:'Automatic (full limit)', benefitBasis:'Indemnity', claimsNotifPeriod:'24', claimsNotifUnit:'hours',
      wordingDocs:[
        { name:'Own Damage Clause — Standard', version:'v2026.04', code:'DOC-OD-CL-001' },
        { name:'General Exclusions Endorsement', version:'v2026.01', code:'DOC-GEN-EX-001' }
      ]
    },
    {
      id:'COV-CT-002', name:'Third Party Liability', code:'COV-TP-CT-001',
      availability:'mandatory', complete:true, type:'Third Party Liability',
      description:'Statutory and excess third-party liability for death, bodily injury, and property damage arising from commercial truck use.',
      basisOfCoverage:'Limit of Indemnity', sumInsured:'1,000,000', maxSingleLimit:'1,000,000', subLimit:'5,000,000',
      deductibleType:'fixed', deductibleAmount:'2,500', deductiblePct:'', minDeductible:'2,500', maxDeductible:'2,500',
      copay:'0', waitingPeriod:'None', annualAggregate:true, defaultSelected:true, mutualExclusions:[],
      conditionalOn:'', dependencies:[],
      constraints:[{ field:'Vehicle Registration', operator:'is', value:'Active CMV / HGV' },{ field:'Operator Licence', operator:'is', value:'Valid' }],
      lossBasis:'Per Occurrence', reinstatement:'None (aggregate)', benefitBasis:'Indemnity', claimsNotifPeriod:'4', claimsNotifUnit:'hours',
      wordingDocs:[{ name:'Commercial Motor TPL Clause', version:'v2026.08', code:'DOC-TP-CT-001' }]
    },
    {
      id:'COV-CT-003', name:'Driver & Cleaner Personal Accident', code:'COV-PA-CT-001',
      availability:'mandatory', complete:true, type:'Benefit — Personal Accident',
      description:'Fixed benefit for accidental death or permanent disability of the named driver and cleaner while on duty.',
      basisOfCoverage:'Agreed Value', sumInsured:'50,000', maxSingleLimit:'50,000', subLimit:'',
      deductibleType:'none', deductibleAmount:'', deductiblePct:'', minDeductible:'', maxDeductible:'',
      copay:'0', waitingPeriod:'None', annualAggregate:false, defaultSelected:true, mutualExclusions:[],
      conditionalOn:'', dependencies:[],
      constraints:[{ field:'Driver Licence Class', operator:'in', value:'HGV, CMV, Class 4/5' },{ field:'Named Driver Age', operator:'≥', value:'25 years' }],
      lossBasis:'Per Person', reinstatement:'Automatic', benefitBasis:'Fixed Benefit', claimsNotifPeriod:'30', claimsNotifUnit:'days',
      wordingDocs:[{ name:'Commercial PA Schedule', version:'v2026.08', code:'DOC-PA-CT-001' }]
    },
    {
      id:'COV-CT-005', name:'Trailer & Semi-Trailer', code:'COV-TRL-001',
      availability:'optional', complete:true, type:'First Party — Property Damage',
      description:'Extends own-damage and theft cover to declared trailers and semi-trailers attached to the insured tractor unit.',
      basisOfCoverage:'Agreed Value', sumInsured:'80,000', maxSingleLimit:'80,000', subLimit:'',
      deductibleType:'fixed', deductibleAmount:'1,500', deductiblePct:'', minDeductible:'1,500', maxDeductible:'1,500',
      copay:'0', waitingPeriod:'None', annualAggregate:false, defaultSelected:false, mutualExclusions:[],
      conditionalOn:'Own Damage — Truck & Chassis',
      dependencies:[{ type:'Requires', dependsOn:'Own Damage — Truck & Chassis', condition:'Body type is Tractor Unit' }],
      constraints:[{ field:'Trailer Count', operator:'≤', value:'2' }],
      lossBasis:'Per Occurrence', reinstatement:'Automatic', benefitBasis:'Indemnity', claimsNotifPeriod:'24', claimsNotifUnit:'hours',
      wordingDocs:[{ name:'Trailer Extension Endorsement', version:'v2026.08', code:'DOC-TRL-001' }]
    },
    {
      id:'COV-CT-006', name:'Theft & Hijack', code:'COV-TH-CT-001',
      availability:'default', complete:true, type:'First Party — Crime',
      description:'Covers theft of the truck, trailer, or cargo following forcible entry, hijack, or armed robbery while in transit.',
      basisOfCoverage:'Agreed Value', sumInsured:'180,000', maxSingleLimit:'180,000', subLimit:'',
      deductibleType:'percentage', deductibleAmount:'', deductiblePct:'10', minDeductible:'2,500', maxDeductible:'15,000',
      copay:'0', waitingPeriod:'14 days', annualAggregate:false, defaultSelected:true, mutualExclusions:[],
      conditionalOn:'Own Damage — Truck & Chassis',
      dependencies:[{ type:'Requires', dependsOn:'Own Damage — Truck & Chassis', condition:'Always' }],
      constraints:[{ field:'Tracking Device', operator:'is', value:'Fitted and active' }],
      lossBasis:'Per Occurrence', reinstatement:'None — total loss', benefitBasis:'Indemnity', claimsNotifPeriod:'4', claimsNotifUnit:'hours',
      wordingDocs:[{ name:'Theft & Hijack Clause', version:'v2026.08', code:'DOC-TH-CT-001' }]
    },
    {
      id:'COV-CT-007', name:'Breakdown & Recovery', code:'COV-RSA-CT-001',
      availability:'addon', complete:true, type:'Service Benefit',
      description:'24/7 commercial recovery, towing to nearest authorised workshop, and roadside mechanical assistance. Up to 6 call-outs per year.',
      basisOfCoverage:'Service Limit', sumInsured:'', maxSingleLimit:'N/A (Service)', subLimit:'',
      deductibleType:'none', deductibleAmount:'', deductiblePct:'', minDeductible:'', maxDeductible:'',
      copay:'0', waitingPeriod:'None', annualAggregate:false, defaultSelected:false, mutualExclusions:[],
      conditionalOn:'Own Damage — Truck & Chassis',
      dependencies:[{ type:'Requires', dependsOn:'Own Damage — Truck & Chassis', condition:'Vehicle age ≤ 15 years' }],
      constraints:[{ field:'Vehicle Age', operator:'≤', value:'15 years' }],
      lossBasis:'Per Call-out (max 6/year)', reinstatement:'Automatic (annual)', benefitBasis:'Service', claimsNotifPeriod:'Immediate', claimsNotifUnit:'',
      wordingDocs:[{ name:'Commercial Recovery Terms', version:'v2026.08', code:'DOC-RSA-CT-001' }]
    },
    {
      id:'COV-CT-008', name:'Loading, Unloading & Overturning', code:'COV-LU-001',
      availability:'addon', complete:true, type:'First Party — Working Risk',
      description:'Covers damage to the truck, trailer, or cargo caused by loading, unloading, tipping, or overturning during commercial operations.',
      basisOfCoverage:'Agreed Value', sumInsured:'180,000', maxSingleLimit:'180,000', subLimit:'',
      deductibleType:'fixed', deductibleAmount:'3,000', deductiblePct:'', minDeductible:'3,000', maxDeductible:'3,000',
      copay:'0', waitingPeriod:'None', annualAggregate:false, defaultSelected:false, mutualExclusions:[],
      conditionalOn:'Own Damage — Truck & Chassis',
      dependencies:[{ type:'Requires', dependsOn:'Own Damage — Truck & Chassis', condition:'Always' }],
      constraints:[{ field:'Body Type', operator:'in', value:'Tipper, Tanker, Mixer' }],
      lossBasis:'Per Occurrence', reinstatement:'Automatic', benefitBasis:'Indemnity', claimsNotifPeriod:'24', claimsNotifUnit:'hours',
      wordingDocs:[{ name:'Loading & Overturning Endorsement', version:'v2026.08', code:'DOC-LU-001' }]
    }
  ],
  questionGroups: [],
  eligibilityRules: [],
  ratingComponents: [
    { group:'BASE PREMIUM', items:[
      { id:'RAT-CT-BR-001', name:'Base Rate — Commercial Truck', value:'$1,850/yr', status:'done', type:'base', basis:'Annual Rate — Fixed Amount', amount:'1850.00', currency:'USD', cover:'Own Damage — Truck & Chassis (primary)', notes:'Commercial motor base rate validated 12-Aug-2026 against 2025 heavy-vehicle loss ratios.', effectiveFrom:'01-Aug-2026', effectiveTo:'31-Jul-2027' }
    ]},
    { group:'RISK FACTORS', items:[
      { id:'RAT-CT-FAC-001', name:'GVW Factor', value:'table', status:'done', type:'factor', factorType:'Rate Table Lookup', lookupAttr:'gvw_tonnes', dims:'1D', table1D:[
        { band:'≤ 7.5t', mult:'0.85', note:'Light commercial' },
        { band:'7.6–16t', mult:'1.00', note:'Base band' },
        { band:'16.1–26t', mult:'1.25', note:'' },
        { band:'26.1–40t', mult:'1.55', note:'' },
        { band:'40.1–49t', mult:'1.85', note:'Maximum GVW' }
      ]},
      { id:'RAT-CT-FAC-002', name:'Radius of Operation', value:'table', status:'done', type:'factor', factorType:'Rate Table Lookup', lookupAttr:'radius_km', dims:'1D', table1D:[
        { band:'0–150 km', mult:'0.90', note:'Local' },
        { band:'151–500 km', mult:'1.00', note:'Regional' },
        { band:'501–1,000 km', mult:'1.20', note:'Long haul' },
        { band:'1,001–1,500 km', mult:'1.40', note:'Interstate' }
      ]},
      { id:'RAT-CT-FAC-003', name:'Goods Class Factor', value:'table', status:'done', type:'factor', factorType:'Rate Table Lookup', lookupAttr:'goods_class', dims:'1D', table1D:[
        { band:'General merchandise', mult:'1.00', note:'' },
        { band:'Perishable / refrigerated', mult:'1.15', note:'' },
        { band:'Construction materials', mult:'1.10', note:'' },
        { band:'Fuel / flammable liquids', mult:'1.45', note:'ADR / hazmat' },
        { band:'Chemicals (non-explosive)', mult:'1.35', note:'' }
      ]},
      { id:'RAT-CT-FAC-004', name:'Driver Experience Factor', value:'table', status:'done', type:'factor', factorType:'Rate Table Lookup', lookupAttr:'hgv_experience_years', dims:'1D', table1D:[
        { band:'2–4 years', mult:'1.30', note:'Inexperienced loading' },
        { band:'5–9 years', mult:'1.10', note:'' },
        { band:'10–14 years', mult:'1.00', note:'Base' },
        { band:'15+ years', mult:'0.90', note:'Preferred' }
      ]},
      { id:'RAT-CT-FAC-005', name:'Territory Factor', value:'table', status:'done', type:'factor', factorType:'Rate Table Lookup', lookupAttr:'territory_zone', dims:'1D', table1D:[
        { band:'Zone A (Metro corridors)', mult:'1.25', note:'' },
        { band:'Zone B (Industrial belts)', mult:'1.10', note:'' },
        { band:'Zone C (Highway / rural)', mult:'0.95', note:'' },
        { band:'Zone D (Border / port)', mult:'1.35', note:'Hijack loading implicit' }
      ]}
    ]},
    { group:'LOADINGS', items:[
      { id:'RAT-CT-LOAD-001', name:'Night Operations Loading', value:'+18%', status:'done', type:'loading', loadingType:'Percentage', loadingValue:'18', condition:'night_operations = Yes' },
      { id:'RAT-CT-LOAD-002', name:'Inexperienced Driver', value:'+20%', status:'done', type:'loading', loadingType:'Percentage', loadingValue:'20', condition:'hgv_experience_years < 2' },
      { id:'RAT-CT-LOAD-003', name:'No Tracker Loading', value:'+$150', status:'done', type:'loading', loadingType:'Fixed Amount', loadingValue:'150', condition:'tracking_fitted = No' }
    ]},
    { group:'DISCOUNTS', items:[
      { id:'RAT-CT-DISC-001', name:'Fleet Discount', value:'up to 15%', status:'done', type:'discount', discountType:'Percentage', lookupAttr:'fleet_size', table1D:[
        { band:'1 truck', mult:'0%', note:'' },
        { band:'2–5 trucks', mult:'5%', note:'' },
        { band:'6–15 trucks', mult:'10%', note:'' },
        { band:'16+ trucks', mult:'15%', note:'Use fleet product above 25' }
      ], maxThis:'15%', maxCombined:'22%', overrideAuth:'Underwriting Manager', stacking:'Stackable' },
      { id:'RAT-CT-DISC-002', name:'Claim-Free Commercial', value:'up to 25%', status:'done', type:'discount', discountType:'Percentage', lookupAttr:'claims_free_years', table1D:[
        { band:'0 years', mult:'0%', note:'' },
        { band:'1 year', mult:'8%', note:'' },
        { band:'2 years', mult:'15%', note:'' },
        { band:'3+ years', mult:'25%', note:'' }
      ], maxThis:'25%', maxCombined:'30%', overrideAuth:'Underwriting Manager', stacking:'Stackable' }
    ]},
    { group:'FEES & TAXES', items:[
      { id:'RAT-CT-FEE-001', name:'Policy Admin Fee', value:'$45', status:'done', type:'fee', feeType:'Fixed', amount:'45.00' },
      { id:'RAT-CT-TAX-001', name:'GST / Insurance Tax', value:'18%', status:'done', type:'tax', taxType:'Percentage', amount:'18' }
    ]}
  ],
  underwritingRules: (typeof PS.truckingUnderwritingRules === 'function' ? PS.truckingUnderwritingRules() : []),
  channels: [
    { id:'CHAN-CT-B01', name:'Commercial Broker Portal', icon:'🤝', status:'active', comm:'18%', type:'Intermediary — Broker', desc:'Primary channel for appointed commercial motor brokers.', auth:'Brokers may quote and bind up to $200,000 own-damage SI without referral.', territories:[{ j:'India', p:'Yes', n:'All zones' },{ j:'UAE', p:'Yes', n:'Zones A, B, D' },{ j:'UK', p:'Yes', n:'HGV licensed operators' }], commConfig:{ type:'Percentage of Gross Premium (excluding taxes)', rate:'18%', basis:'New Business: 18% / Renewal: 14%', override:'Yes — Underwriting Manager', max:'22%', clawback:'Yes — pro-rata within 90 days', timing:'Monthly in arrears', code:'COMM-CT-BROKER' }, rules:[{ rule:'Max OD SI (Broker)', type:'Override', val:'$250,000', note:'Above $200k requires UW bind' },{ rule:'Hazmat quotes', type:'Restriction', val:'Quote only', note:'Bind blocked for fuel/chemicals' }], accessModel:'Restricted Access', intermediaries:[{ name:'Highway Risk Brokers', code:'BRK-CT-001', auth:'Yes', terr:'India', stat:'Active' },{ name:'Gulf Commercial Cover', code:'BRK-CT-002', auth:'Yes', terr:'UAE', stat:'Active' },{ name:'Haulage Protect Ltd', code:'BRK-CT-003', auth:'No (quote only)', terr:'UK', stat:'Active' }], from:'01-Aug-2026', to:'31-Jul-2027' },
    { id:'CHAN-CT-D01', name:'Direct (Web) — Owner Operators', icon:'🌐', status:'active', comm:'0%', type:'Direct', desc:'Self-serve quotes for single-truck owner-operators.', auth:'Consumers may quote; bind requires document upload (RC, HGV licence, fitness).', territories:[{ j:'India', p:'Yes', n:'All zones' },{ j:'UAE', p:'No', n:'Broker only' }], commConfig:{ type:'None', rate:'0%', basis:'0%', override:'No', max:'0%', clawback:'N/A', timing:'N/A', code:'COMM-CT-DIR' }, rules:[{ rule:'Max SI Direct', type:'Restriction', val:'$150,000', note:'Higher SI via broker' }], accessModel:'Public Access (No intermediaries)', intermediaries:[], from:'01-Aug-2026', to:'31-Jul-2027' },
    { id:'CHAN-CT-API01', name:'Fleet TMS API', icon:'{ }', status:'active', comm:'8%', type:'API Integration', desc:'Headless quoting for transport-management systems placing cover truck-by-truck.', auth:'Quote and bind with operator KYC token. Night/hazmat still refer.', territories:[{ j:'India', p:'Yes', n:'Connected TMS operators' }], commConfig:{ type:'Percentage of Net Premium', rate:'8%', basis:'Flat 8%', override:'No', max:'8%', clawback:'Yes — 14 days', timing:'Monthly', code:'COMM-CT-API' }, apiConfig:{ consumer:'FleetTMS Partner — HaulStack', key:'sk-••••••••••••ct08', limit:'400 quotes/hour', whiteLabel:'Yes — “HaulStack Truck Cover”', dta:'DTA-2026-HAULSTACK-001' }, rules:[{ rule:'Documentation', type:'Restriction', val:'Digital RC + fitness cert', note:'Paper packs not issued via API' }], accessModel:'API Partners Only', intermediaries:[], from:'01-Aug-2026', to:'31-Jul-2027' }
  ],
  documents: (typeof PS.truckingDocuments === 'function' ? PS.truckingDocuments() : []),
  riskAttributes: (typeof PS.truckingRiskAttributes === 'function' ? PS.truckingRiskAttributes() : []),
  testCases: [
    { id:1, name:'Standard rigid 16t — 12yr HGV driver', cat:'Rating', exp:'Accept, $3,240.00', res:'pass', pExp:'$3,240.00', pAct:'$3,240.00', v:'0.0%' },
    { id:2, name:'Long-haul 40t tractor — 800 km radius', cat:'Rating', exp:'Accept, higher premium', res:'pass', pExp:'$5,110.00', pAct:'$5,110.00', v:'0.0%' },
    { id:3, name:'Driver age 23', cat:'Eligibility', exp:'Ineligible (Hard Block)', res:'pass', pExp:'N/A', pAct:'N/A', v:'—' },
    { id:4, name:'No HGV licence', cat:'Eligibility', exp:'Ineligible (Hard Block)', res:'pass', pExp:'N/A', pAct:'N/A', v:'—' },
    { id:5, name:'Class 1 explosives cargo', cat:'Underwriting', exp:'Decline', res:'pass', pExp:'N/A', pAct:'N/A', v:'—' },
    { id:6, name:'Fuel tanker night operations', cat:'Underwriting', exp:'Refer (Operations)', res:'pass', pExp:'$6,480.00*', pAct:'$6,480.00', v:'0.0%' },
    { id:7, name:'No tracker — GIT selected', cat:'Underwriting', exp:'Restrict GIT to $50k', res:'pass', pExp:'$3,390.00', pAct:'$3,390.00', v:'0.0%' },
    { id:8, name:'Trailer + GIT + breakdown add-on', cat:'Rating', exp:'Accept, covers stacked', res:'pass', pExp:'$4,820.00', pAct:'$4,820.00', v:'0.0%' },
    { id:9, name:'Claim-free 3 years, 8-truck fleet', cat:'Rating', exp:'25% NCD + 10% fleet', res:'pass', pExp:'$2,186.00', pAct:'$2,186.00', v:'0.0%' },
    { id:10, name:'Broker bind $220k SI', cat:'Distribution', exp:'Accept via broker override', res:'pass', pExp:'$5,640.00', pAct:'$5,640.00', v:'0.0%' },
    { id:11, name:'Boundary: driver age exactly 25', cat:'Boundary', exp:'Accept (edge)', res:'pass', pExp:'$3,640.00', pAct:'$3,640.00', v:'0.0%' },
    { id:12, name:'Boundary: GVW exactly 49t', cat:'Boundary', exp:'Eligible (edge)', res:'pass', pExp:'$6,920.00', pAct:'$6,920.00', v:'0.0%' }
  ]
};

PS.studioSeeds['PRD-020'] = {
  version: '2026.09',
  covers: [
  
    {
      id:'COV-CYB-002', name:'Privacy Liability & Regulatory Defence', code:'COV-PRIV-001',
      availability:'mandatory', complete:true, type:'Third Party Liability',
      description:'Covers privacy breaches, regulatory investigations, and fines where insurable. Includes GDPR and state privacy law defence costs.',
      basisOfCoverage:'Limit of Indemnity', sumInsured:'1,000,000', maxSingleLimit:'1,000,000', subLimit:'250,000',
      deductibleType:'fixed', deductibleAmount:'10,000', deductiblePct:'', minDeductible:'10,000', maxDeductible:'10,000',
      copay:'0', waitingPeriod:'None', annualAggregate:true, defaultSelected:true, mutualExclusions:[],
      conditionalOn:'', dependencies:[],
      constraints:[{ field:'Records Count', operator:'≤', value:'500,000 PII records' }],
      lossBasis:'Per Claim', reinstatement:'None (aggregate)', benefitBasis:'Indemnity', claimsNotifPeriod:'72', claimsNotifUnit:'hours',
      wordingDocs:[{ name:'Privacy Liability Endorsement', version:'v2026.09', code:'DOC-PRIV-001' }]
    },
    {
      id:'COV-CYB-003', name:'Data Breach Response', code:'COV-DBR-001',
      availability:'default', complete:true, type:'First Party — Crime',
      description:'Covers forensic investigation, notification costs, credit monitoring, and public relations following a data breach.',
      basisOfCoverage:'Limit of Indemnity', sumInsured:'500,000', maxSingleLimit:'500,000', subLimit:'',
      deductibleType:'fixed', deductibleAmount:'5,000', deductiblePct:'', minDeductible:'5,000', maxDeductible:'5,000',
      copay:'0', waitingPeriod:'None', annualAggregate:true, defaultSelected:true, mutualExclusions:[],
      conditionalOn:'', dependencies:[],
      constraints:[{ field:'MFA Enabled', operator:'is', value:'Yes' }],
      lossBasis:'Per Event', reinstatement:'Automatic', benefitBasis:'Indemnity', claimsNotifPeriod:'24', claimsNotifUnit:'hours',
      wordingDocs:[{ name:'Breach Response Schedule', version:'v2026.09', code:'DOC-DBR-001' }]
    },
    
   
    {
      id:'COV-CYB-005', name:'Ransomware & Extortion', code:'COV-RW-001',
      availability:'optional', complete:true, type:'First Party — Crime',
      description:'Covers ransom payments and specialist negotiator fees where legally permitted, subject to sub-limit and prior insurer consent.',
      basisOfCoverage:'Limit of Indemnity', sumInsured:'250,000', maxSingleLimit:'250,000', subLimit:'100,000',
      deductibleType:'fixed', deductibleAmount:'25,000', deductiblePct:'', minDeductible:'25,000', maxDeductible:'25,000',
      copay:'0', waitingPeriod:'None', annualAggregate:true, defaultSelected:false, mutualExclusions:[],
      conditionalOn:'Data Breach Response',
      dependencies:[{ type:'Requires', dependsOn:'Data Breach Response', condition:'Always' }],
      constraints:[{ field:'Offline Backups', operator:'is', value:'Yes' }],
      lossBasis:'Per Event', reinstatement:'None (aggregate)', benefitBasis:'Indemnity', claimsNotifPeriod:'4', claimsNotifUnit:'hours',
      wordingDocs:[{ name:'Ransomware Sub-limit Endorsement', version:'v2026.09', code:'DOC-RW-001' }]
    }
  ],
  eligibilityRules: [
    { id:'ELG-CYB-001', name:'Minimum MFA on email and VPN', field:'mfa_enabled', operator:'is not', value:'Yes', outcome:'ineligible', category:'Security Controls', cover:'All Covers', priority:10, status:'active', description:'Multi-factor authentication required on email and remote access.', conditions:[{ field:'mfa_enabled', op:'is not', value:'Yes' }], reasonCode:'ELIG-NO-MFA', effectiveFrom:'01-Sep-2026', effectiveTo:'31-Aug-2027' },
    { id:'ELG-CYB-002', name:'Maximum revenue $25M', field:'annual_revenue', operator:'>', value:'25000000', outcome:'refer', category:'Account Size', cover:'All Covers', priority:20, status:'active', description:'Accounts above $25M revenue referred to cyber underwriting.', conditions:[{ field:'annual_revenue', op:'>', value:'25000000' }], reasonCode:'ELIG-REV-REFER', effectiveFrom:'01-Sep-2026', effectiveTo:'31-Aug-2027' },
    { id:'ELG-CYB-003', name:'Prohibited industry — crypto exchange', field:'industry', operator:'is', value:'Cryptocurrency exchange', outcome:'ineligible', category:'Industry', cover:'All Covers', priority:30, status:'active', description:'Cryptocurrency exchanges are outside appetite.', conditions:[{ field:'industry', op:'is', value:'Cryptocurrency exchange' }], reasonCode:'ELIG-IND-DECLINE', effectiveFrom:'01-Sep-2026', effectiveTo:'31-Aug-2027' }
  ],
  questionGroups: [
    {
      id:'GRP-CYB-001', name:'Organisation', label:'Organisation',
      questions:[
        { id:'Q-CYB-001', label:'Legal entity name', type:'text', typeLabel:'Text', fieldType:'text', required:true, internalName:'entity_name', displayOrder:1, category:'general', channels:'Web, Agent, API', validations:[], conditions:[], evidence:[] },
        { id:'Q-CYB-002', label:'Annual revenue (USD)', type:'currency', typeLabel:'Currency', fieldType:'currency', required:true, internalName:'annual_revenue', displayOrder:2, category:'risk', channels:'Web, Agent, API', validations:[], conditions:[], evidence:[] },
        { id:'Q-CYB-003', label:'Industry sector', type:'select', typeLabel:'Select', fieldType:'select', required:true, internalName:'industry', displayOrder:3, category:'risk', channels:'Web, Agent, API', validations:[], conditions:[], evidence:[] }
      ]
    },
    {
      id:'GRP-CYB-002', name:'Security controls', label:'Security controls',
      questions:[
        { id:'Q-CYB-004', label:'MFA enabled on email and VPN?', type:'boolean', typeLabel:'Yes/No', fieldType:'boolean', required:true, internalName:'mfa_enabled', displayOrder:4, category:'eligibility', channels:'Web, Agent, API', validations:[], conditions:[], evidence:[] },
        { id:'Q-CYB-005', label:'Offline backup frequency', type:'select', typeLabel:'Select', fieldType:'select', required:true, internalName:'backup_frequency', displayOrder:5, category:'eligibility', channels:'Web, Agent, API', validations:[], conditions:[], evidence:[] },
        { id:'Q-CYB-006', label:'Approximate PII records held', type:'number', typeLabel:'Number', fieldType:'number', required:true, internalName:'pii_records', displayOrder:6, category:'risk', channels:'Web, Agent, API', validations:[], conditions:[], evidence:[] }
      ]
    }
  ],
  testCases: [
    { id:1, name:'SME professional services — $5M revenue', cat:'Rating', exp:'Accept, $4,680.00', res:'pass', pExp:'$4,680.00', pAct:'$4,680.00', v:'0.0%' },
    { id:2, name:'No MFA enabled', cat:'Eligibility', exp:'Ineligible (Hard Block)', res:'pass', pExp:'N/A', pAct:'N/A', v:'—' },
    { id:3, name:'Crypto exchange industry', cat:'Eligibility', exp:'Ineligible (Hard Block)', res:'pass', pExp:'N/A', pAct:'N/A', v:'—' },
    { id:4, name:'Revenue $30M', cat:'Eligibility', exp:'Refer', res:'pass', pExp:'$8,200.00*', pAct:'$8,200.00', v:'0.0%' }
  ]
};

if (typeof PS.truckingQuestionGroups === 'function' && PS.studioSeeds['PRD-015']) {
  PS.studioSeeds['PRD-015'].questionGroups = PS.truckingQuestionGroups();
}

if (typeof PS.truckingRiskAttributes === 'function' && PS.studioSeeds['PRD-015']) {
  PS.studioSeeds['PRD-015'].riskAttributes = PS.truckingRiskAttributes();
}

if (typeof PS.truckingUnderwritingRules === 'function' && PS.studioSeeds['PRD-015']) {
  PS.studioSeeds['PRD-015'].underwritingRules = PS.truckingUnderwritingRules();
}

if (typeof PS.truckingDocuments === 'function' && PS.studioSeeds['PRD-015']) {
  PS.studioSeeds['PRD-015'].documents = PS.truckingDocuments();
}
