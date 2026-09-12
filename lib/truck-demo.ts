export const TRUCK_ID = "PRD-015";
export const TRUCK_VERSION = "2026.08";

export function truckCovers() {
  return [
    {
      id: "COV-CT-001", name: "Own Damage — Truck & Chassis", code: "COV-OD-CT-001",
      availability: "mandatory", complete: true, type: "First Party — Property Damage",
      description: "Covers accidental damage, fire, explosion, and natural peril loss to the insured truck, chassis, and permanently fitted equipment.",
      basisOfCoverage: "Agreed Value", sumInsured: "180000", maxSingleLimit: "180000", subLimit: "",
      deductibleType: "percentage", deductibleAmount: "", deductiblePct: "2.5", minDeductible: "1000", maxDeductible: "8000",
      copay: "0", waitingPeriod: "None", annualAggregate: false, defaultSelected: true, mutualExclusions: "",
      coverVersion: "2026.08", conditionalOn: "", requiresCover: "",
      dependencies: [{ type: "Bundles with", dependsOn: "Third Party Liability", condition: "Always" }],
      constraints: [{ field: "Gross Vehicle Weight", operator: "≤", value: "49 tonnes" }, { field: "Vehicle Age", operator: "≤", value: "20 years" }, { field: "Body Type", operator: "is one of", value: "Rigid, Tractor Unit, Tipper, Tanker, Box, Flatbed" }],
      lossBasis: "Per Occurrence", reinstatement: "Automatic (full limit)", benefitBasis: "Indemnity", claimsNotifPeriod: "24", claimsNotifUnit: "hours",
      wordingDoc: "Own Damage Clause — Standard",
      wordingDocs: [
        { name: "Own Damage Clause — Standard", version: "v2026.04", code: "DOC-OD-CL-001" },
        { name: "General Exclusions Endorsement", version: "v2026.01", code: "DOC-GEN-EX-001" },
      ],
    },
    {
      id: "COV-CT-002", name: "Third Party Liability", code: "COV-TP-CT-001",
      availability: "mandatory", complete: true, type: "Third Party Liability",
      description: "Statutory and excess third-party liability for death, bodily injury, and property damage arising from commercial truck use.",
      basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", maxSingleLimit: "1000000", subLimit: "5000000",
      deductibleType: "fixed", deductibleAmount: "2500", deductiblePct: "", coverVersion: "2026.08",
      defaultSelected: true, dependencies: [],
      constraints: [{ field: "Vehicle Registration", operator: "is", value: "Active CMV / HGV" }, { field: "Operator Licence", operator: "is", value: "Valid" }],
      wordingDocs: [{ name: "Commercial Motor TPL Clause", version: "v2026.08", code: "DOC-TP-CT-001" }],
    },
    {
      id: "COV-CT-003", name: "Driver & Cleaner Personal Accident", code: "COV-PA-CT-001",
      availability: "mandatory", complete: true, type: "Benefit — Personal Accident",
      description: "Fixed benefit for accidental death or permanent disability of the named driver and cleaner while on duty.",
      basisOfCoverage: "Agreed Value", sumInsured: "50000", deductibleType: "none", deductibleAmount: "0",
      coverVersion: "2026.08", maxSingleLimit: "50000", defaultSelected: true, dependencies: [],
      constraints: [{ field: "Driver Licence Class", operator: "in", value: "HGV, CMV, Class 4/5" }, { field: "Named Driver Age", operator: "≥", value: "25 years" }],
      wordingDocs: [{ name: "Commercial PA Schedule", version: "v2026.08", code: "DOC-PA-CT-001" }],
    },
    {
      id: "COV-CT-004", name: "Goods in Transit", code: "COV-GIT-001",
      availability: "default", complete: true, type: "First Party — Cargo",
      description: "Covers loss or damage to lawful cargo carried on the insured truck, including loading and unloading at declared locations.",
      basisOfCoverage: "Declared Value", sumInsured: "250000", deductibleType: "percentage", deductiblePct: "1",
      coverVersion: "2026.08", maxSingleLimit: "250000", defaultSelected: true,
      conditionalOn: "Own Damage — Truck & Chassis", requiresCover: "Own Damage — Truck & Chassis",
      dependencies: [{ type: "Requires", dependsOn: "Own Damage — Truck & Chassis", condition: "Always" }],
      constraints: [{ field: "Goods Class", operator: "not in", value: "Class 1 explosives, radioactive" }, { field: "Radius of Operation", operator: "≤", value: "1,500 km" }],
      wordingDocs: [{ name: "Goods in Transit Clause", version: "v2026.08", code: "DOC-GIT-001" }],
    },
    {
      id: "COV-CT-005", name: "Trailer & Semi-Trailer", code: "COV-TRL-001",
      availability: "optional", complete: true, type: "First Party — Property Damage",
      description: "Extends own-damage and theft cover to declared trailers and semi-trailers attached to the insured tractor unit.",
      basisOfCoverage: "Agreed Value", sumInsured: "80000", deductibleType: "fixed", deductibleAmount: "1500",
      coverVersion: "2026.08", maxSingleLimit: "80000", defaultSelected: false,
      conditionalOn: "Own Damage — Truck & Chassis",
      dependencies: [{ type: "Requires", dependsOn: "Own Damage — Truck & Chassis", condition: "Body type is Tractor Unit" }],
      constraints: [{ field: "Trailer Count", operator: "≤", value: "2" }],
      wordingDocs: [{ name: "Trailer Extension Endorsement", version: "v2026.08", code: "DOC-TRL-001" }],
    },
    {
      id: "COV-CT-006", name: "Theft & Hijack", code: "COV-TH-CT-001",
      availability: "default", complete: true, type: "First Party — Crime",
      description: "Covers theft of the truck, trailer, or cargo following forcible entry, hijack, or armed robbery while in transit.",
      basisOfCoverage: "Agreed Value", sumInsured: "180000", deductibleType: "percentage", deductiblePct: "10",
      coverVersion: "2026.08", maxSingleLimit: "180000", defaultSelected: true,
      conditionalOn: "Own Damage — Truck & Chassis",
      dependencies: [{ type: "Requires", dependsOn: "Own Damage — Truck & Chassis", condition: "Always" }],
      constraints: [{ field: "Tracking Device", operator: "is", value: "Fitted and active" }],
      wordingDocs: [{ name: "Theft & Hijack Clause", version: "v2026.08", code: "DOC-TH-CT-001" }],
    },
    {
      id: "COV-CT-007", name: "Breakdown & Recovery", code: "COV-RSA-CT-001",
      availability: "addon", complete: true, type: "Service Benefit",
      description: "24/7 commercial recovery, towing to nearest authorised workshop, and roadside mechanical assistance. Up to 6 call-outs per year.",
      basisOfCoverage: "Service Limit", sumInsured: "Service", deductibleType: "none", deductibleAmount: "0",
      coverVersion: "2026.08", maxSingleLimit: "Service", defaultSelected: false,
      conditionalOn: "Own Damage — Truck & Chassis",
      dependencies: [{ type: "Requires", dependsOn: "Own Damage — Truck & Chassis", condition: "Vehicle age ≤ 15 years" }],
      constraints: [{ field: "Vehicle Age", operator: "≤", value: "15 years" }],
      wordingDocs: [{ name: "Commercial Recovery Terms", version: "v2026.08", code: "DOC-RSA-CT-001" }],
    },
    {
      id: "COV-CT-008", name: "Loading, Unloading & Overturning", code: "COV-LU-001",
      availability: "addon", complete: true, type: "First Party — Working Risk",
      description: "Covers damage to the truck, trailer, or cargo caused by loading, unloading, tipping, or overturning during commercial operations.",
      basisOfCoverage: "Agreed Value", sumInsured: "180000", deductibleType: "fixed", deductibleAmount: "3000",
      coverVersion: "2026.08", maxSingleLimit: "180000", defaultSelected: false,
      conditionalOn: "Own Damage — Truck & Chassis",
      dependencies: [{ type: "Requires", dependsOn: "Own Damage — Truck & Chassis", condition: "Always" }],
      constraints: [{ field: "Body Type", operator: "in", value: "Tipper, Tanker, Mixer" }],
      wordingDocs: [{ name: "Loading & Overturning Endorsement", version: "v2026.08", code: "DOC-LU-001" }],
    },
  ];
}

export function truckQuestionGroups() {
  const ch = "Web, Mobile, Agent, API";
  return [
    {
      id: "grp-1",
      name: "Truck Details",
      label: "Truck Details",
      questions: [
        { id: "QST-CT-001", label: "Make & Model", internalName: "vehicle_make_model", type: "entity", typeLabel: "Entity Lookup", required: true, displayOrder: 1, helpText: "Manufacturer and model of the truck, e.g. Tata Prima 4928.S", channels: ch, example: "Tata Prima 4928.S", fieldType: "entity", inputFormat: "Entity lookup", validations: [{ rule: "Required", expr: "true", msg: "Make and model is required." }], conditions: [], evidence: [] },
        {
          id: "QST-CT-002", label: "Year of Manufacture", internalName: "vehicle_year_of_manufacture", type: "number", typeLabel: "Number", required: true, displayOrder: 2,
          helpText: "The year the vehicle was manufactured, as shown on the registration document. Used against the 20-year commercial cap.",
          channels: ch, fieldType: "number", inputFormat: "4-digit year (YYYY)", min: "2005", max: "[Current Year]", step: "1", placeholder: "e.g., 2019",
          validations: [
            { rule: "Min Value", expr: "2005", msg: "Vehicle must be manufactured in 2005 or later." },
            { rule: "Max Value", expr: "Current Year", msg: "Year of manufacture cannot be in the future." },
            { rule: "Required", expr: "true", msg: "This field is required." },
          ],
          conditions: [],
          derived: { attr: "vehicle_age", formula: 'FLOOR(DATEDIFF(TODAY(), vehicle_year_of_manufacture, "years"))', dataType: "Number", usedIn: "Rating factors (vehicle age band), Eligibility rules (max 20 years)" },
          evidence: [],
        },
        { id: "QST-CT-003", label: "Gross Vehicle Weight (tonnes)", internalName: "gvw_tonnes", type: "number", typeLabel: "Number", required: true, displayOrder: 3, helpText: "Must be 49 tonnes or less for this product.", channels: ch, example: "16", min: "1", max: "49", fieldType: "number", validations: [{ rule: "Max Value", expr: "49", msg: "GVW must not exceed 49 tonnes." }], conditions: [], evidence: [] },
        { id: "QST-CT-004", label: "Body Type", internalName: "body_type", type: "select", typeLabel: "Single-select", required: true, displayOrder: 4, helpText: "Tankers and tippers may refer to operations underwriting.", channels: ch, fieldType: "select", options: [{ value: "Rigid", label: "Rigid" }, { value: "Tractor Unit", label: "Tractor Unit" }, { value: "Tipper", label: "Tipper" }, { value: "Tanker", label: "Tanker" }, { value: "Box", label: "Box" }, { value: "Flatbed", label: "Flatbed" }], validations: [{ rule: "Required", expr: "true", msg: "Select a body type." }], conditions: [], evidence: [] },
        { id: "QST-CT-005", label: "Insured Value", internalName: "vehicle_insured_value", type: "currency", typeLabel: "Currency", required: true, displayOrder: 5, helpText: "Agreed value of the truck and chassis.", channels: ch, example: "180000", fieldType: "currency", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-006", label: "Axle Count", internalName: "axle_count", type: "number", typeLabel: "Number", required: true, displayOrder: 6, channels: ch, fieldType: "number", validations: [], conditions: [], evidence: [] },
        {
          id: "QST-CT-007", label: "Tracking Device Fitted?", internalName: "tracking_fitted", type: "boolean", typeLabel: "Boolean", required: true, displayOrder: 7,
          helpText: "Required for full Theft & Hijack and GIT limits.", channels: ch, fieldType: "boolean", inputFormat: "Yes / No toggle",
          evidence: [{ condition: "tracking_fitted = No", type: "Tracker Certificate", message: "Upload tracker fitment certificate to restore full GIT and theft limits." }],
          validations: [{ rule: "Required", expr: "true", msg: "Confirm whether a tracker is fitted." }], conditions: [],
        },
      ],
    },
    {
      id: "grp-2",
      name: "Operator & Driver",
      label: "Operator & Driver",
      questions: [
        { id: "QST-CT-008", label: "Operator / Registered Owner", internalName: "operator_name", type: "text", typeLabel: "Text", required: true, displayOrder: 1, example: "Singh Logistics Pvt Ltd", channels: ch, fieldType: "text", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-009", label: "Primary Driver — Full Name", internalName: "driver_full_name", type: "text", typeLabel: "Text", required: true, displayOrder: 2, channels: ch, fieldType: "text", validations: [], conditions: [], evidence: [] },
        {
          id: "QST-CT-010", label: "Primary Driver — Date of Birth", internalName: "driver_date_of_birth", type: "date", typeLabel: "Date", required: true, displayOrder: 3,
          helpText: "Enter the primary driver's date of birth as shown on their identity document. Driver must be 25 or older at cover start.",
          channels: ch, fieldType: "date", inputFormat: "DD-MM-YYYY",
          derived: { attr: "driver_age", formula: 'FLOOR(DATEDIFF(TODAY(), driver_date_of_birth, "years"))', dataType: "Number", usedIn: "Rating factors (driver age band), Eligibility rules (minimum age 25)" },
          evidence: [{ condition: "always", type: "HGV licence scan", message: "Upload a scan of the heavy-vehicle licence with date of birth." }],
          validations: [{ rule: "Required", expr: "true", msg: "Date of birth is required." }], conditions: [],
        },
        { id: "QST-CT-011", label: "HGV / CMV Licence Class", internalName: "licence_class", type: "select", typeLabel: "Single-select", required: true, displayOrder: 4, channels: ch, fieldType: "select", options: [{ value: "HGV", label: "HGV" }, { value: "CMV", label: "CMV" }, { value: "Class 4", label: "Class 4" }, { value: "Class 5", label: "Class 5" }], validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-012", label: "Years of HGV Experience", internalName: "hgv_experience_years", type: "number", typeLabel: "Number", required: true, displayOrder: 5, channels: ch, fieldType: "number", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-013", label: "Conviction History?", internalName: "driver_conviction_history", type: "boolean", typeLabel: "Boolean", required: true, displayOrder: 6, channels: ch, fieldType: "boolean", validations: [], conditions: [], evidence: [] },
      ],
    },
    {
      id: "grp-3",
      name: "Operations",
      label: "Operations",
      questions: [
        { id: "QST-CT-014", label: "Goods Class Carried", internalName: "goods_class", type: "select", typeLabel: "Single-select", required: true, displayOrder: 1, helpText: "Class 1 explosives and radioactive cargo are declined on this product.", channels: ch, fieldType: "select", options: [{ value: "General merchandise", label: "General merchandise" }, { value: "Perishable / refrigerated", label: "Perishable / refrigerated" }, { value: "Construction materials", label: "Construction materials" }, { value: "Fuel / flammable liquids", label: "Fuel / flammable liquids" }, { value: "Chemicals (non-explosive)", label: "Chemicals (non-explosive)" }], validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-015", label: "Radius of Operation (km)", internalName: "radius_km", type: "number", typeLabel: "Number", required: true, displayOrder: 2, channels: ch, fieldType: "number", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-016", label: "Night Operations?", internalName: "night_operations", type: "boolean", typeLabel: "Boolean", required: true, displayOrder: 3, helpText: "Night haul and tankers may be referred.", channels: ch, fieldType: "boolean", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-017", label: "Annual Mileage", internalName: "annual_mileage", type: "number", typeLabel: "Number", required: true, displayOrder: 4, channels: ch, fieldType: "number", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-018", label: "Trailer Attached?", internalName: "trailer_attached", type: "boolean", typeLabel: "Boolean", required: true, displayOrder: 5, channels: ch, fieldType: "boolean", conditional: true, conditions: [{ field: "Body Type", op: "=", value: "Tractor Unit" }], exprPreview: "body_type = Tractor Unit", visibleWhen: "body_type = Tractor Unit", validations: [], evidence: [] },
      ],
    },
    {
      id: "grp-4",
      name: "Policy Details",
      label: "Policy Details",
      questions: [
        { id: "QST-CT-019", label: "Cover Start Date", internalName: "policy_start_date", type: "date", typeLabel: "Date", required: true, displayOrder: 1, channels: ch, fieldType: "date", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-020", label: "Policy Period", internalName: "policy_period", type: "select", typeLabel: "Single-select", required: true, displayOrder: 2, channels: ch, fieldType: "select", options: [{ value: "12m", label: "12 months" }, { value: "6m", label: "6 months" }], validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-021", label: "Covers Required", internalName: "covers_required", type: "multisel", typeLabel: "Multi-select", required: true, displayOrder: 3, channels: ch, fieldType: "multisel", validations: [], conditions: [], evidence: [] },
        { id: "QST-CT-022", label: "Payment Preference", internalName: "payment_preference", type: "select", typeLabel: "Single-select", required: true, displayOrder: 4, channels: ch, fieldType: "select", options: [{ value: "annual", label: "Annual" }, { value: "monthly", label: "Monthly" }], validations: [], conditions: [], evidence: [] },
      ],
    },
  ];
}

export function truckEligibility() {
  return [
    { id: "ELG-CT-001", name: "Min Driver Age — Commercial", field: "driver_age", operator: "<", value: "25", outcome: "ineligible", outcomeType: "hard", category: "Product Eligibility", cover: "All Covers", priority: 10, status: "active", description: "Named driver must be at least 25 years old for commercial truck cover.", customerMsg: "Commercial truck cover is only available to drivers aged 25 and over.", internalMsg: "Driver age below commercial minimum (25).", reasonCode: "ELIG-CT-MIN-AGE", direction: "ineligible", logic: "and", conditions: [{ field: "driver_age", op: "<", value: "25" }], effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
    { id: "ELG-CT-002", name: "Valid HGV / CMV Licence", field: "licence_class", operator: "not in", value: "HGV, CMV, Class 4, Class 5", outcome: "ineligible", outcomeType: "hard", category: "Product Eligibility", cover: "All Covers", priority: 5, status: "active", description: "Primary driver must hold a valid heavy goods or commercial motor vehicle licence.", customerMsg: "A valid heavy vehicle licence is required for this product.", internalMsg: "Licence class not in HGV/CMV allowlist.", reasonCode: "ELIG-CT-LICENCE", conditions: [{ field: "licence_class", op: "not in", value: "HGV, CMV, Class 4, Class 5" }], effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
    { id: "ELG-CT-003", name: "Max Vehicle Age", field: "vehicle_age", operator: ">", value: "20", outcome: "ineligible", outcomeType: "hard", category: "Product Eligibility", cover: "All Covers", priority: 20, status: "active", description: "Truck must be 20 years old or newer.", customerMsg: "This product is only available for trucks manufactured within the last 20 years.", reasonCode: "ELIG-CT-MAX-AGE", conditions: [{ field: "vehicle_age", op: ">", value: "20" }], effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
    { id: "ELG-CT-004", name: "GVW Cap", field: "gvw_tonnes", operator: ">", value: "49", outcome: "ineligible", outcomeType: "hard", category: "Product Eligibility", cover: "All Covers", priority: 15, status: "active", description: "Gross vehicle weight must not exceed 49 tonnes.", customerMsg: "Vehicles above 49 tonnes require a specialist fleet product.", reasonCode: "ELIG-CT-GVW", conditions: [{ field: "gvw_tonnes", op: ">", value: "49" }], effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
    { id: "ELG-CT-007", name: "Min HGV Experience", field: "hgv_experience_years", operator: "<", value: "2", outcome: "ineligible", outcomeType: "soft", category: "Product Eligibility", cover: "All Covers", priority: 18, status: "active", description: "Primary driver must have at least 2 years of heavy-vehicle experience.", customerMsg: "Drivers with under 2 years of HGV experience may receive a premium loading.", reasonCode: "ELIG-CT-EXP", conditions: [{ field: "hgv_experience_years", op: "<", value: "2" }], effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
    { id: "ELG-CT-005", name: "Hazardous Goods Refer", field: "goods_class", operator: "in", value: "Class 1 explosives, radioactive", outcome: "refer", outcomeType: "refer", category: "Cover Eligibility", cover: "Goods in Transit", priority: 25, status: "active", description: "Class 1 explosives and radioactive cargo are referred to specialist underwriting.", customerMsg: "Hazardous cargo of this class needs a specialist review before we can quote.", reasonCode: "ELIG-CT-HAZMAT", conditions: [{ field: "goods_class", op: "in", value: "Class 1 explosives, radioactive" }], effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
    { id: "ELG-CT-006", name: "Tracking Device for Theft Cover", field: "tracking_fitted", operator: "=", value: "No", outcome: "ineligible", outcomeType: "soft", category: "Cover Eligibility", cover: "Theft & Hijack", priority: 30, status: "active", description: "Theft & Hijack requires an active GPS tracking device.", customerMsg: "Theft cover can be added once an approved tracking device is fitted.", reasonCode: "ELIG-CT-TRACK", conditions: [{ field: "tracking_fitted", op: "=", value: "No" }], effectiveFrom: "01-Aug-2026", effectiveTo: "31-Jul-2027" },
  ];
}

export function truckRating() {
  const gvw = [
    { band: "≤ 7.5t", mult: "0.85", note: "Light commercial" },
    { band: "7.6–16t", mult: "1.00", note: "Base band" },
    { band: "16.1–26t", mult: "1.25", note: "" },
    { band: "26.1–40t", mult: "1.55", note: "" },
    { band: "40.1–49t", mult: "1.85", note: "Maximum GVW" },
  ];
  const radius = [
    { band: "0–150 km", mult: "0.90", note: "Local" },
    { band: "151–500 km", mult: "1.00", note: "Regional" },
    { band: "501–1,000 km", mult: "1.20", note: "Long haul" },
    { band: "1,001–1,500 km", mult: "1.40", note: "Interstate" },
  ];
  const goods = [
    { band: "General merchandise", mult: "1.00", note: "" },
    { band: "Perishable / refrigerated", mult: "1.15", note: "" },
    { band: "Construction materials", mult: "1.10", note: "" },
    { band: "Fuel / flammable liquids", mult: "1.45", note: "ADR / hazmat" },
    { band: "Chemicals (non-explosive)", mult: "1.35", note: "" },
  ];
  const exp = [
    { band: "2–4 years", mult: "1.30", note: "Inexperienced loading" },
    { band: "5–9 years", mult: "1.10", note: "" },
    { band: "10–14 years", mult: "1.00", note: "Base" },
    { band: "15+ years", mult: "0.90", note: "Preferred" },
  ];
  const toBands = (rows: { band: string; mult: string }[]) => rows.map((r) => `${r.band} ×${r.mult}`).join(" · ");
  return [
    { id: "RAT-CT-BR-001", name: "Base Rate — Commercial Truck", type: "base", amount: 1850, unit: "per year", cover: "Own Damage — Truck & Chassis (primary)", value: "$1,850/yr", notes: "Commercial motor base rate validated 12-Aug-2026 against 2025 heavy-vehicle loss ratios." },
    { id: "RAT-CT-FAC-001", name: "GVW Factor", type: "factor", field: "gvw_tonnes", lookupAttr: "gvw_tonnes", table1D: gvw, bands: toBands(gvw) },
    { id: "RAT-CT-FAC-002", name: "Radius of Operation", type: "factor", field: "radius_km", lookupAttr: "radius_km", table1D: radius, bands: toBands(radius) },
    { id: "RAT-CT-FAC-003", name: "Goods Class Factor", type: "factor", field: "goods_class", lookupAttr: "goods_class", table1D: goods, bands: toBands(goods) },
    { id: "RAT-CT-FAC-004", name: "Driver Experience Factor", type: "factor", field: "hgv_experience_years", lookupAttr: "hgv_experience_years", table1D: exp, bands: toBands(exp) },
    { id: "RAT-CT-LOAD-001", name: "Night Operations Loading", type: "loading", amount: "18%", condition: "night_operations = Yes", loadingType: "Percentage", loadingValue: "18" },
    { id: "RAT-CT-LOAD-002", name: "Inexperienced Driver", type: "loading", amount: "20%", condition: "hgv_experience_years < 2", loadingType: "Percentage", loadingValue: "20" },
    { id: "RAT-CT-DISC-001", name: "Tracker discount", type: "discount", amount: "5%", condition: "tracking_fitted = Yes" },
    { id: "RAT-CT-MIN-001", name: "Minimum premium", type: "minimum", amount: 1200, unit: "per year" },
    { id: "RAT-CT-FEE-001", name: "Policy Admin Fee", type: "fee", amount: 45, feeType: "Fixed" },
    { id: "RAT-CT-TAX-001", name: "GST / Insurance Tax", type: "tax", amount: "18%", taxType: "Percentage" },
    { id: "RAT-CT-FOR-001", name: "Payable premium formula", type: "formula", expression: "Base Premium × Risk Factors + Loadings − Discounts + Add-ons + Fees + Taxes = Payable Premium" },
  ];
}

export function truckUnderwriting() {
  return [
    { id: "UW-CT-DCL-001", name: "Disqualified HGV licence", outcome: "decline", field: "licence_status", operator: "in", value: "Suspended, Revoked, Disqualified", conditions: [{ field: "licence_status", op: "in", value: "Suspended, Revoked, Disqualified" }] },
    { id: "UW-CT-DCL-002", name: "Explosives / radioactive cargo", outcome: "decline", field: "goods_class", operator: "in", value: "Class 1 explosives, radioactive", conditions: [{ field: "goods_class", op: "in", value: "Class 1 explosives, radioactive" }] },
    { id: "UW-CT-REF-001", name: "High GVW or high value", outcome: "refer", field: "gvw_tonnes", operator: ">", value: "40", conditions: [{ field: "gvw_tonnes", op: ">", value: "40" }, { connector: "OR", field: "vehicle_insured_value", op: ">", value: "250000" }], logic: "or" },
    { id: "UW-CT-REF-002", name: "Fuel tanker / night haul", outcome: "refer", field: "body_type", operator: "=", value: "Tanker", conditions: [{ field: "body_type", op: "=", value: "Tanker" }, { connector: "OR", field: "night_operations", op: "=", value: "Yes" }], logic: "or" },
    { id: "UW-CT-LOAD-001", name: "Recent at-fault commercial claim", outcome: "load", field: "at_fault_claims_24m", operator: ">=", value: "1", loading: "20%", conditions: [{ field: "at_fault_claims_24m", op: ">=", value: "1" }] },
    { id: "UW-CT-RSTR-001", name: "Cap GIT without tracker", outcome: "restrict", field: "tracking_fitted", operator: "=", value: "No", restriction: "GIT limit $50,000", conditions: [{ field: "tracking_fitted", op: "=", value: "No" }] },
    { id: "UW-CT-EVD-001", name: "Require inspection for high SI", outcome: "evidence", field: "vehicle_insured_value", operator: ">", value: "250000", description: "Request physical inspection and tracker certificate before bind.", conditions: [{ field: "vehicle_insured_value", op: ">", value: "250000" }] },
    { id: "UW-CT-ACC-001", name: "Standard commercial accept", outcome: "accept", description: "Accept if no decline, refer, load, or restrict rule has fired.", conditions: [] },
  ];
}

export function truckChannels() {
  return [
    { id: "CHAN-CT-B01", name: "Commercial Broker Portal", accessModel: "Restricted Access", commission: "18%", comm: "18%", status: "active", description: "Appointed commercial motor brokers. Bind up to $200k OD SI.",
      territories: [{ j: "India", p: "Yes", n: "All zones" }, { j: "UAE", p: "Yes", n: "Zones A, B, D" }, { j: "UK", p: "Yes", n: "HGV licensed operators" }],
      commConfig: { type: "Percentage of Gross Premium (excluding taxes)", rate: "18%", code: "COMM-CT-BROKER" } },
    { id: "CHAN-CT-D01", name: "Direct (Web) — Owner Operators", accessModel: "Open Access", commission: "0%", comm: "0%", status: "active", description: "Self-serve quotes for single-truck owner-operators.",
      territories: [{ j: "India", p: "Yes", n: "All zones" }, { j: "UAE", p: "No", n: "Broker only" }] },
    { id: "CHAN-CT-API01", name: "Fleet TMS API", accessModel: "API Partners Only", commission: "8%", comm: "8%", status: "active", description: "Headless quoting for transport-management systems.",
      territories: [{ j: "India", p: "Yes", n: "Connected TMS operators" }] },
  ];
}

export function truckDocuments() {
  return [
    { id: "DOC-CT-WORD-001", name: "Commercial Truck Policy Wording", type: "Core", version: TRUCK_VERSION, ver: "v2026.08", status: "approved",
      identity: { type: "Core — Policy Wording", format: "PDF", lang: "English (UK)", jur: "India, UAE, UK", author: "David Okonkwo" },
      vars: [{ tok: "{{policy_number}}", src: "Policy System", ex: "POL-CT-2026-00811" }, { tok: "{{operator_name}}", src: "Risk data", ex: "Singh Logistics Pvt Ltd" }] },
    { id: "DOC-CT-SCH-001", name: "Commercial Truck Schedule", type: "Core", version: TRUCK_VERSION, status: "approved",
      identity: { type: "Core — Policy Schedule", format: "PDF (dynamic fields)", lang: "English (UK)", jur: "India, UAE, UK" },
      vars: [{ tok: "{{vehicle_make_model}}", src: "Risk data", ex: "Tata Prima 4928.S" }, { tok: "{{gvw_tonnes}}", src: "Risk data", ex: "49" }] },
    { id: "DOC-CT-CERT-001", name: "Certificate of Insurance (CMV)", type: "Core", version: TRUCK_VERSION, status: "approved" },
    { id: "DOC-CT-END-001", name: "Goods in Transit Endorsement", type: "Endorsement", version: TRUCK_VERSION, status: "approved",
      vars: [{ tok: "{{git_limit}}", src: "Coverage", ex: "$250,000" }] },
    { id: "DOC-CT-END-002", name: "Trailer Extension Endorsement", type: "Endorsement", version: TRUCK_VERSION, status: "approved" },
  ];
}

export function truckTests() {
  return [
    { id: "TEST-CT-001", name: "Standard rigid 16t — 12yr HGV driver", expected: "Accept", premium: 3240, result: "pass", answers: { driver_age: 38, licence_class: "HGV", vehicle_age: 8, gvw_tonnes: 16, goods_class: "General merchandise", tracking_fitted: "Yes", hgv_experience_years: 12, night_operations: "No", body_type: "Rigid" } },
    { id: "TEST-CT-002", name: "Long-haul 40t tractor — 800 km radius", expected: "Accept, higher premium", premium: 5110, result: "pass", answers: { driver_age: 42, licence_class: "HGV", vehicle_age: 5, gvw_tonnes: 40, radius_km: 800, goods_class: "Construction materials", tracking_fitted: "Yes", hgv_experience_years: 14, night_operations: "No" } },
    { id: "TEST-CT-003", name: "Driver age 23", expected: "Ineligible (hard block)", premium: 0, result: "pass", answers: { driver_age: 23, licence_class: "HGV", gvw_tonnes: 16, tracking_fitted: "Yes", hgv_experience_years: 3 } },
    { id: "TEST-CT-004", name: "Class 1 explosives cargo", expected: "Decline", premium: 0, result: "pass", answers: { driver_age: 35, licence_class: "HGV", gvw_tonnes: 18, goods_class: "Class 1 explosives", tracking_fitted: "Yes", hgv_experience_years: 8 } },
    { id: "TEST-CT-005", name: "Fuel tanker night operations", expected: "Refer (operations)", premium: 6480, result: "pass", answers: { driver_age: 40, licence_class: "HGV", gvw_tonnes: 26, body_type: "Tanker", night_operations: "Yes", tracking_fitted: "Yes", hgv_experience_years: 10, goods_class: "Fuel / flammable liquids" } },
    { id: "TEST-CT-006", name: "No tracker — GIT selected", expected: "Restrict GIT to $50k", premium: 3390, result: "pass", answers: { driver_age: 36, licence_class: "HGV", gvw_tonnes: 16, tracking_fitted: "No", hgv_experience_years: 7, goods_class: "General merchandise" } },
  ];
}

export function truckCollections() {
  const k = (name: string) => `${TRUCK_ID}::${TRUCK_VERSION}::${name}`;
  return {
    [k("covers")]: truckCovers(),
    [k("questionGroups")]: truckQuestionGroups(),
    [k("eligibilityRules")]: truckEligibility(),
    [k("ratingComponents")]: truckRating(),
    [k("underwritingRules")]: truckUnderwriting(),
    [k("channels")]: truckChannels(),
    [k("documents")]: truckDocuments(),
    [k("testCases")]: truckTests(),
  };
}

export const TRUCK_DESCRIPTION =
  "Comprehensive commercial motor cover for rigid trucks, tractor units, tippers, and tankers. Includes own damage, statutory and excess third-party liability, driver PA, goods in transit, theft/hijack, and optional trailer, breakdown, and loading/overturning extensions. GVW up to 49t. Tracker required for full theft and GIT limits.";
