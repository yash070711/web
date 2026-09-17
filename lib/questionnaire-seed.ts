import type { Row } from "@/components/studios/shared";

export const QUESTION_TYPES = [
  { id: "text", label: "Text" },
  { id: "textarea", label: "Textarea" },
  { id: "number", label: "Number" },
  { id: "currency", label: "Currency" },
  { id: "date", label: "Date" },
  { id: "daterange", label: "Date Range" },
  { id: "boolean", label: "Boolean" },
  { id: "select", label: "Single-select" },
  { id: "multisel", label: "Multi-select" },
  { id: "entity", label: "Entity Lookup" },
  { id: "attachment", label: "Attachment" },
  { id: "repeat", label: "Repeatable Group" },
  { id: "address", label: "Address" },
] as const;

export function questionTypeLabel(type: string) {
  return QUESTION_TYPES.find((t) => t.id === type)?.label || type;
}

function channels(list: string[] = ["web", "mobile", "agent", "api"]) {
  return list.map((c) => c[0].toUpperCase() + c.slice(1)).join(", ");
}

/** Prototype Questionnaire Guide GROUPS + Q_DETAIL (Private Car). */
export function privateCarQuestionGroups(): Row[] {
  return [
    {
      id: "grp-1",
      name: "Vehicle Details",
      label: "Vehicle Details",
      questions: [
        {
          id: "QST-VEH-001", label: "Make & Model", internalName: "vehicle_make_model", type: "entity", typeLabel: "Entity Lookup",
          required: true, displayOrder: 1, channels: channels(), helpText: "Search the vehicle make and model from the manufacturer catalogue.",
          fieldType: "entity", inputFormat: "Entity lookup", validations: [{ rule: "Required", expr: "true", msg: "Make and model is required." }], conditions: [], evidence: [],
        },
        {
          id: "QST-VEH-002", label: "Year of Manufacture", internalName: "vehicle_year_of_manufacture", type: "number", typeLabel: "Number",
          required: true, displayOrder: 2, derived: { attr: "vehicle_age", formula: 'FLOOR(DATEDIFF(TODAY(), vehicle_year_of_manufacture, "years"))', dataType: "Number", usedIn: "Rating factors (vehicle age band), Eligibility rules" },
          helpText: "The year the vehicle was manufactured, as shown on the registration document.",
          channels: channels(), fieldType: "number", inputFormat: "4-digit year (YYYY)", min: "2005", max: "[Current Year]", step: "1", placeholder: "e.g., 2019",
          validations: [
            { rule: "Min Value", expr: "2005", msg: "Vehicle must be manufactured in 2005 or later." },
            { rule: "Max Value", expr: "Current Year", msg: "Year of manufacture cannot be in the future." },
            { rule: "Required", expr: "true", msg: "This field is required." },
          ],
          conditions: [
            { field: "Purpose of Use", op: "is not", value: "hire" },
            { connector: "AND", field: "Insured Value", op: ">", value: "0" },
          ],
          exprPreview: 'purpose_of_use != "hire" AND insured_value > 0',
          evidence: [],
        },
        {
          id: "QST-VEH-003", label: "Insured Value", internalName: "vehicle_insured_value", type: "currency", typeLabel: "Currency",
          required: true, displayOrder: 3, channels: channels(), helpText: "Agreed or market value of the vehicle.",
          fieldType: "currency", validations: [{ rule: "Required", expr: "true", msg: "Insured value is required." }], conditions: [], evidence: [],
        },
        {
          id: "QST-VEH-004", label: "Vehicle Modifications?", internalName: "vehicle_modifications", type: "boolean", typeLabel: "Boolean",
          required: true, displayOrder: 4, evidence: [{ condition: "vehicle_modifications = Yes", type: "Inspection Required", message: "A vehicle inspection is required for modified vehicles. Our team will contact you to arrange." }],
          helpText: "Please indicate whether the vehicle has been modified from its original factory specification.",
          channels: channels(), fieldType: "boolean", inputFormat: "Yes / No toggle",
          validations: [{ rule: "Required", expr: "true", msg: "This field is required." }], conditions: [],
        },
        {
          id: "QST-VEH-005", label: "Purpose of Use", internalName: "purpose_of_use", type: "select", typeLabel: "Single-select",
          required: true, displayOrder: 5, channels: channels(),
          helpText: "Select the primary purpose for which the vehicle is used.",
          fieldType: "select", inputFormat: "Dropdown",
          options: [
            { value: "private", label: "Private use only" },
            { value: "commercial_light", label: "Commercial — light use (deliveries, trade)" },
            { value: "hire", label: "Hire or reward" },
          ],
          validations: [{ rule: "Required", expr: "true", msg: "Please select a purpose of use." }], conditions: [], evidence: [],
        },
        {
          id: "QST-VEH-006", label: "Annual Mileage", internalName: "annual_mileage", type: "number", typeLabel: "Number",
          required: false, displayOrder: 6, conditional: true, channels: channels(),
          fieldType: "number", conditions: [{ field: "Purpose of Use", op: "is", value: "private" }], validations: [], evidence: [],
        },
      ],
    },
    {
      id: "grp-2",
      name: "Driver Details",
      label: "Driver Details",
      questions: [
        { id: "QST-DRV-001", label: "Primary Driver — Full Name", internalName: "driver_full_name", type: "text", typeLabel: "Text", required: true, displayOrder: 1, channels: channels(), fieldType: "text", validations: [], conditions: [], evidence: [] },
        {
          id: "QST-DRV-002", label: "Primary Driver — Date of Birth", internalName: "driver_date_of_birth", type: "date", typeLabel: "Date",
          required: true, displayOrder: 2, derived: { attr: "driver_age", formula: 'FLOOR(DATEDIFF(TODAY(), driver_date_of_birth, "years"))', dataType: "Number", usedIn: "Rating factors (driver age band), Eligibility rules (minimum age 21)" },
          helpText: "Enter the primary driver's date of birth as shown on their identity document.",
          channels: channels(), fieldType: "date", inputFormat: "DD-MM-YYYY", max: "Today - 18 years",
          validations: [
            { rule: "Max Value", expr: "Today - 18 years", msg: "Primary driver must be at least 18 years old." },
            { rule: "Required", expr: "true", msg: "Date of birth is required." },
          ],
          conditions: [], evidence: [],
        },
        { id: "QST-DRV-003", label: "Primary Driver — Licence No.", internalName: "driver_licence_number", type: "text", typeLabel: "Text", required: true, displayOrder: 3, channels: channels(), fieldType: "text", validations: [], conditions: [], evidence: [] },
        { id: "QST-DRV-004", label: "Primary Driver — Licence Issue Date", internalName: "driver_licence_date", type: "date", typeLabel: "Date", required: true, displayOrder: 4, derived: true, channels: channels(), fieldType: "date", validations: [], conditions: [], evidence: [] },
        { id: "QST-DRV-005", label: "Conviction History?", internalName: "driver_conviction_history", type: "boolean", typeLabel: "Boolean", required: true, displayOrder: 5, channels: channels(), fieldType: "boolean", validations: [], conditions: [], evidence: [] },
        {
          id: "QST-DRV-006", label: "Named Additional Drivers", internalName: "named_drivers", type: "repeat", typeLabel: "Repeatable Group",
          required: false, displayOrder: 6, channels: channels(),
          helpText: "Add details for all additional named drivers on this policy.",
          fieldType: "repeat", inputFormat: "Repeatable Group", repeatMin: 0, repeatMax: 5,
          addLabel: "Add Named Driver", removeLabel: "Remove Driver", displayLabel: "Named Driver {n}",
          repeatQuestions: [
            { label: "Full Name", type: "text", required: true },
            { label: "Date of Birth", type: "date", required: true },
            { label: "Relationship to Policyholder", type: "select", required: true },
            { label: "Licence Number", type: "text", required: true },
          ],
          validations: [], conditions: [], evidence: [],
        },
      ],
    },
    {
      id: "grp-3",
      name: "Policy Details",
      label: "Policy Details",
      questions: [
        { id: "QST-POL-001", label: "Cover Start Date", internalName: "policy_start_date", type: "date", typeLabel: "Date", required: true, displayOrder: 1, channels: channels(), fieldType: "date", validations: [], conditions: [], evidence: [] },
        { id: "QST-POL-002", label: "Policy Period", internalName: "policy_period", type: "select", typeLabel: "Single-select", required: true, displayOrder: 2, channels: channels(), fieldType: "select", options: [{ value: "12m", label: "12 months" }, { value: "6m", label: "6 months" }], validations: [], conditions: [], evidence: [] },
        { id: "QST-POL-003", label: "Covers Required", internalName: "covers_required", type: "multisel", typeLabel: "Multi-select", required: true, displayOrder: 3, channels: channels(), fieldType: "multisel", validations: [], conditions: [], evidence: [] },
        { id: "QST-POL-004", label: "Payment Preference", internalName: "payment_preference", type: "select", typeLabel: "Single-select", required: true, displayOrder: 4, channels: channels(), fieldType: "select", options: [{ value: "annual", label: "Annual" }, { value: "monthly", label: "Monthly" }], validations: [], conditions: [], evidence: [] },
      ],
    },
  ];
}

function slug(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function truckingQuestion(prefix: string, index: number, label: string, type: string, required = true): Row {
  return {
    id: `QST-${prefix}-${String(index).padStart(3, "0")}`,
    label,
    internalName: slug(label),
    type,
    typeLabel: questionTypeLabel(type),
    fieldType: type,
    required,
    displayOrder: index,
    channels: channels(),
    validations: [],
    conditions: [],
    evidence: [],
  };
}

function truckingGroup(
  id: string,
  label: string,
  prefix: string,
  rows: [string, string, boolean?][],
  extra?: Record<string, unknown>
) {
  return {
    id,
    name: label,
    label,
    open: false,
    bindPhase: "pre-bind",
    questions: rows.map(([questionLabel, type, required], i) =>
      truckingQuestion(prefix, i + 1, questionLabel, type, required !== false)
    ),
    ...extra,
  };
}

/** Default trucking questionnaire — Operations, Fleet, Vehicle, Driver, Commodity, Safety, Loss-history */
export function truckingQuestionGroups(): Row[] {
  return [
    truckingGroup("grp-ops", "Operations", "OPS", [
      ["Business Type", "select"],
      ["Years in Business", "number"],
      ["DOT Number", "text"],
      ["MC Number", "text"],
      ["Operating Authority", "select"],
      ["Interstate / Intrastate", "select"],
      ["Operating Radius", "select"],
      ["Annual Mileage", "number"],
      ["Annual Revenue", "currency"],
      ["States Operated", "multisel"],
      ["Primary Garaging State", "select"],
      ["For-Hire / Private Carrier", "select"],
      ["Common / Contract Carrier", "select"],
      ["Owner Operator Usage", "boolean"],
      ["Brokerage Operations", "boolean"],
      ["Hazmat Operations", "boolean"],
    ]),
    truckingGroup("grp-fleet", "Fleet", "FLT", [
      ["Fleet Size", "number"],
      ["Power Units", "number"],
      ["Trailers", "number"],
      ["Owned Vehicles", "number"],
      ["Leased Vehicles", "number"],
      ["Owner-Operator Vehicles", "number"],
      ["Average Vehicle Age", "number"],
      ["Maximum Vehicle Age", "number"],
      ["Fleet Growth", "select"],
      ["Vehicle Replacement Program", "boolean"],
    ]),
    truckingGroup("grp-vehicle", "Vehicle", "VEH", [
      ["VIN", "text"],
      ["Year", "number"],
      ["Make", "text"],
      ["Model", "text"],
      ["Vehicle Type", "select"],
      ["Body Type", "select"],
      ["GVW", "number"],
      ["Vehicle Value", "currency"],
      ["Stated Amount", "currency"],
      ["Ownership Type", "select"],
      ["Lease Type", "select"],
      ["Garaging Location", "address"],
      ["Annual Mileage", "number"],
      ["Operating Radius", "select"],
      ["Primary Use", "select"],
      ["Safety Equipment", "multisel"],
    ]),
    truckingGroup("grp-driver", "Driver", "DRV", [
      ["Driver Name", "text"],
      ["Date of Birth", "date"],
      ["License Number", "text"],
      ["License State", "select"],
      ["CDL Class", "select"],
      ["CDL Status", "select"],
      ["Years CDL Experience", "number"],
      ["Years Trucking Experience", "number"],
      ["Major Violations", "number"],
      ["Minor Violations", "number"],
      ["At-Fault Accidents", "number"],
      ["Suspensions", "number"],
      ["DUI/DWI", "boolean"],
      ["MVR Status", "select"],
      ["Driver Status", "select"],
    ]),
    truckingGroup("grp-commodity", "Commodity", "CMD", [
      ["General Freight", "boolean", false],
      ["Dry Goods", "boolean", false],
      ["Refrigerated Goods", "boolean", false],
      ["Food Products", "boolean", false],
      ["Building Materials", "boolean", false],
      ["Automobiles", "boolean", false],
      ["Machinery", "boolean", false],
      ["Electronics", "boolean", false],
      ["Household Goods", "boolean", false],
      ["Livestock", "boolean", false],
      ["Hazardous Materials", "boolean", false],
      ["Explosives", "boolean", false],
      ["Fuel", "boolean", false],
      ["Commodity Type", "select"],
      ["Percentage of Revenue", "number"],
      ["Maximum Load Value", "currency"],
      ["Average Load Value", "currency"],
      ["Hazardous", "boolean"],
      ["Refrigerated", "boolean"],
    ]),
    truckingGroup("grp-safety", "Safety", "SAF", [
      ["DOT Safety Rating", "select"],
      ["SAFER Score", "number"],
      ["CSA Score", "number"],
      ["Out-of-Service Rate", "number"],
      ["Vehicle Inspection Rate", "number"],
      ["Driver Inspection Rate", "number"],
      ["ELD Used", "boolean"],
      ["Telematics Used", "boolean"],
      ["Dash Cameras", "boolean"],
      ["Driver Monitoring", "boolean"],
      ["Safety Program", "boolean"],
      ["Drug Testing Program", "boolean"],
      ["Driver Training Program", "boolean"],
      ["Maintenance Program", "boolean"],
    ]),
    truckingGroup("grp-loss", "Loss-history", "LSS", [
      ["Loss Period", "daterange"],
      ["Number of Claims", "number"],
      ["Paid Losses", "currency"],
      ["Outstanding Losses", "currency"],
      ["Incurred Losses", "currency"],
      ["Loss Ratio", "number"],
      ["Large Losses", "number"],
      ["Fatality Claims", "number"],
      ["Open Claims", "number"],
      ["Prior Carrier", "text"],
      ["Prior Premium", "currency"],
      ["Cancellation History", "boolean"],
      ["Non-Renewal History", "boolean"],
    ]),
    truckingGroup("grp-policy", "Policy Administration", "POL", [
      ["Billing Method", "select"],
      ["Payment Plan", "select"],
      ["Policy Delivery Preference", "select"],
      ["Named Insured Contact", "text"],
      ["Certificate Holder Requirements", "textarea"],
    ], { bindPhase: "post-bind" }),
    truckingGroup("grp-claims", "Claims", "CLM", [
      ["Claims Contact Name", "text"],
      ["Claims Contact Phone", "text"],
      ["Claims Reporting Method", "select"],
      ["Average Claim Response Time", "number"],
      ["Open Claims Count", "number"],
      ["Claims Made vs Occurrence", "select"],
      ["Deductible Responsibility", "select"],
      ["Subrogation Interest", "boolean"],
    ], { bindPhase: "post-bind" }),
    truckingGroup("grp-renewal", "Renewal", "RNW", [
      ["Renewal Date", "date"],
      ["Renewal Notice Period", "select"],
      ["Auto-Renewal Preference", "boolean"],
      ["Renewal Pricing Review", "boolean"],
      ["Mid-Term Change Policy", "select"],
      ["Non-Renewal Notice", "boolean"],
    ], { bindPhase: "post-bind" }),
  ];
}
