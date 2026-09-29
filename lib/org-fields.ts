import type { OrganizationConfig, OrganizationType, Workspace } from "./types";

export type OrgFieldType =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "currency"
  | "percent"
  | "email"
  | "tel"
  | "url"
  | "select"
  | "list"
  | "multiselect"
  | "checkbox"
  | "file"
  | "readonly"
  | "studio-permissions"
  | "assigned-products"
  | "reinsurance-config"
  | "audit-history";

export type OrgFieldOption = { value: string; label: string };

export type OrgOptionSource =
  | "product-families"
  | "products"
  | "coverages"
  | "carriers"
  | "mgas-mgus"
  | "brokers";

export type OrgFieldBind =
  | "name"
  | "code"
  | "legalName"
  | "status"
  | "type"
  | "notes"
  | "parentCompanyName"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "address"
  | "createdBy"
  | "createdDate"
  | "lastModifiedBy"
  | "lastModifiedDate";

export type OrgField = {
  key: string;
  label: string;
  type: OrgFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: OrgFieldOption[];
  optionsSource?: OrgOptionSource;
  ui?: "dropdown";
  bind?: OrgFieldBind;
  wide?: boolean;
};

export type OrgSection = {
  key: string;
  title: string;
  hint?: string;
  intro?: string;
  fields: OrgField[];
};

export type OrgTypeFieldConfig = {
  sections: OrgSection[];
};

const opt = (value: string, label?: string): OrgFieldOption => ({ value, label: label || value });

export const AUTHORITY_TYPES: OrgFieldOption[] = [
  { value: "binding", label: "Binding" },
  { value: "brokerage", label: "Brokerage" },
  { value: "binding-rating", label: "Binding Rating" },
];

export const REINSURERS = [
  "Munich Re",
  "Swiss Re",
  "Hannover Re",
  "Berkshire Hathaway Reinsurance",
  "Reinsurance Group of America (RGA)",
  "General Insurance Corporation of India (GIC Re)",
] as const;

export const TREATY_TYPES: OrgFieldOption[] = [
  { value: "quota-share", label: "Quota Share" },
  { value: "surplus", label: "Surplus" },
  { value: "excess-of-loss", label: "Excess of Loss" },
  { value: "facultative", label: "Facultative" },
];

export const AUTHORITY_TYPE_TARGETS: OrganizationType[] = ["market-company", "risk-company", "mga", "mgu", "broker"];

const AUTHORITY_FIELD: OrgField = {
  key: "authorityType",
  label: "Authority Type",
  type: "select",
  options: AUTHORITY_TYPES,
};

export function isAuthorityTypeTarget(type: OrganizationType): boolean {
  return AUTHORITY_TYPE_TARGETS.includes(type);
}

export const AUTHORIZED_TERRITORIES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD",
  "TN","TX","UT","VT","VA","WA","WV","WI","WY","Canada","UK","EU","UAE","India","Australia",
] as const;

export const LINES_OF_BUSINESS = [
  "Commercial Auto", "Commercial Property", "General Liability", "Workers Compensation",
  "Inland Marine", "Excess / Umbrella", "Professional Liability", "Cyber Liability",
  "Marine", "Aviation", "Surety", "Fleet (Motor)",
] as const;

export const CLASSES_OF_BUSINESS = [
  "Auto Liability", "Auto Physical Damage", "Cargo / Goods in Transit", "General Liability", "Commercial Property",
  "Inland Marine", "Workers Compensation", "Excess Liability", "Umbrella", "Marine", "Aviation", "Cyber Liability",
  "Surety", "Professional Liability", "Fleet (Motor)",
] as const;

export const RISK_TYPES = [
  "Primary", "Excess", "Quota Share", "Facultative", "Treaty", "Catastrophe", "Proportional", "Non-Proportional",
] as const;

export const LEGAL_ENTITY_TYPES = [
  "Corporation", "LLC", "Partnership", "Sole Proprietorship", "Trust", "Mutual Company", "Crown / State Enterprise",
] as const;

export const SETTLEMENT_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "CHF"] as const;

export const SETTLEMENT_FREQUENCIES = [
  "Monthly", "Quarterly", "Semi-Annual", "Annual", "Upon Settlement",
] as const;

export const PARTICIPATION_TYPES = [
  { key: "lead", label: "Lead" },
  { key: "following", label: "Following" },
  { key: "participating", label: "Participating" },
] as const;

export const REINSURANCE_AUTHORIZATION_TYPES = ["Treaty Reinsurance", "Facultative Reinsurance", "Both (Treaty & Facultative)"] as const;

export const STUDIOS: Array<{ key: string; label: string }> = [
  { key: "product-definition", label: "Product Definition" },
  { key: "coverage-studio", label: "Coverage Studio" },
  { key: "question-studio", label: "Question Studio" },
  { key: "risk-studio", label: "Risk Studio" },
  { key: "underwriting-studio", label: "Underwriting Studio" },
  { key: "eligibility-studio", label: "Eligibility Studio" },
  { key: "rating-pricing-studio", label: "Rating & Pricing Studio" },
  { key: "document-studio", label: "Document Studio" },
  { key: "distribution-studio", label: "Distribution Studio" },
];

export const STUDIO_PERMISSIONS: Array<{ key: string; label: string }> = [
  { key: "view", label: "View" },
  { key: "configure", label: "Configure/Edit" },
  { key: "submit", label: "Submit for Review" },
  { key: "approve", label: "Approve" },
  { key: "publish", label: "Publish" },
];

const riskCompanySections: OrgSection[] = [
  {
    key: "basic-information",
    title: "Basic Information",
    fields: [
      { key: "name", bind: "name", label: "Risk Carrier Name", type: "text", required: true, placeholder: "e.g. Southlake" },
      { key: "legalName", bind: "legalName", label: "Legal Name", type: "text", required: true, placeholder: "Registered legal entity name" },
      { key: "dbaName", label: "DBA Name", type: "text", placeholder: "Trading / brand name" },
      { key: "type", bind: "type", label: "Organization Type", type: "readonly" },
      { key: "authorityType", label: "Authority Type", type: "select", options: AUTHORITY_TYPES },
      { key: "organizationRelationship", label: "Organization Relationship", type: "select", options: [opt("affiliated", "Affiliated"), opt("non-affiliated", "Non-Affiliated")] },
      { key: "status", bind: "status", label: "Status", type: "select", required: true, options: [opt("active", "Active"), opt("inactive", "Inactive")] },
      { key: "statusReason", label: "Status Reason", type: "text", placeholder: "Reason for the current status" },
      { key: "notes", bind: "notes", label: "Description / Notes", type: "textarea", wide: true },
      { key: "carrierLogo", label: "Carrier Logo", type: "file", help: "PNG or SVG. Stored as the file name in this demo." },
    ],
  },
  {
    key: "parent-company",
    title: "Parent Company",
    fields: [
      { key: "parentCompanyName", bind: "parentCompanyName", label: "Parent Company", type: "readonly", required: true },
      {
        key: "ownershipType",
        label: "Ownership Type",
        type: "select",
        options: [opt("wholly-owned", "Wholly Owned"), opt("majority", "Majority Owned"), opt("minority", "Minority Owned"), opt("joint-venture", "Joint Venture"), opt("affiliate", "Affiliate")],
      },
      { key: "ownershipPercentage", label: "Ownership Percentage", type: "percent", placeholder: "e.g. 100" },
    ],
  },
  {
    key: "regulatory-licensing",
    title: "Regulatory & Licensing",
    fields: [
      { key: "naicNumber", label: "NAIC Number", type: "text", placeholder: "e.g. 10001" },
      { key: "regulatoryId", label: "Regulatory ID", type: "text" },
      { key: "domicileState", label: "Domicile State", type: "text", placeholder: "e.g. NY" },
      {
        key: "admissionStatus",
        label: "Admission Status",
        type: "select",
        options: [opt("admitted", "Admitted"), opt("non-admitted", "Non-Admitted"), opt("surplus-lines", "Surplus Lines"), opt("conditional", "Conditional")],
      },
      {
        key: "regulatoryStatus",
        label: "Regulatory Status",
        type: "select",
        options: [opt("active", "Active"), opt("suspended", "Suspended"), opt("revoked", "Revoked"), opt("pending", "Pending"), opt("inactive", "Inactive")],
      },
      { key: "licenseNumber", label: "License Number", type: "text" },
      {
        key: "licenseType",
        label: "License Type",
        type: "select",
        options: [opt("certificate-of-authority", "Certificate of Authority"), opt("surplus-lines-license", "Surplus Lines License"), opt("provisional", "Provisional"), opt("limited", "Limited"), opt("foreign", "Foreign")],
      },
      {
        key: "licenseStatus",
        label: "License Status",
        type: "select",
        options: [opt("active", "Active"), opt("expired", "Expired"), opt("pending-renewal", "Pending Renewal"), opt("suspended", "Suspended"), opt("revoked", "Revoked")],
      },
      { key: "licenseIssueDate", label: "License Issue Date", type: "date" },
      { key: "licenseExpirationDate", label: "License Expiration Date", type: "date" },
      { key: "licensedStates", label: "Licensed States", type: "list", wide: true, placeholder: "Comma separated, e.g. NY, NJ, CT", help: "Comma separated state codes." },
    ],
  },
  {
    key: "contact-address",
    title: "Contact & Address",
    fields: [
      { key: "primaryContactName", bind: "contactName", label: "Primary Contact Name", type: "text" },
      { key: "primaryContactEmail", bind: "contactEmail", label: "Primary Contact Email", type: "email" },
      { key: "phone", bind: "contactPhone", label: "Phone", type: "tel" },
      { key: "alternatePhone", label: "Alternate Phone", type: "tel" },
      { key: "fax", label: "Fax", type: "tel" },
      { key: "website", label: "Website", type: "url", placeholder: "https://" },
      { key: "address1", bind: "address", label: "Address 1", type: "text", wide: true },
      { key: "address2", label: "Address 2", type: "text", wide: true },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "zip", label: "ZIP / Postal Code", type: "text" },
      { key: "country", label: "Country", type: "text" },
    ],
  },
  {
    key: "business-authority",
    title: "Business Authority",
    fields: [
      { key: "linesOfBusiness", label: "Lines of Business", type: "multiselect", ui: "dropdown", options: LINES_OF_BUSINESS.map((l) => opt(l)), wide: true },
      { key: "insuranceClasses", label: "Class of Business", type: "multiselect", ui: "dropdown", options: CLASSES_OF_BUSINESS.map((c) => opt(c)), wide: true },
    ],
  },
  {
    key: "contracts-agreements",
    title: "Contracts & Agreements",
    fields: [
      { key: "contractNumber", label: "Contract Number", type: "text" },
      { key: "contractType", label: "Contract Type", type: "select", options: [opt("master", "Master"), opt("product", "Product"), opt("underwriting", "Underwriting"), opt("distribution", "Distribution"), opt("service", "Service"), opt("nda", "Non-Disclosure")] },
      { key: "contractDate", label: "Contract Date", type: "date" },
      { key: "contractEffectiveDate", label: "Effective Date", type: "date" },
      { key: "contractExpirationDate", label: "Expiration Date", type: "date" },
      { key: "terminationDate", label: "Termination Date", type: "date" },
      { key: "contractStatus", label: "Contract Status", type: "select", options: [opt("draft", "Draft"), opt("active", "Active"), opt("expired", "Expired"), opt("terminated", "Terminated"), opt("pending", "Pending")] },
      { key: "productAgreement", label: "Product Agreement", type: "text" },
      { key: "underwritingAgreement", label: "Underwriting Agreement", type: "text" },
      { key: "distributionAgreement", label: "Distribution Agreement", type: "text" },
      { key: "specialAgreements", label: "Special Agreements", type: "textarea", wide: true },
    ],
  },
  {
    key: "reinsurance",
    title: "Reinsurance",
    hint: "Configure one or more reinsurance placements for this risk company. Each reinsurer has its own treaty type, shared risk, retention, ceded % and dates.",
    fields: [{ key: "reinsuranceRecords", label: "Reinsurance Configuration", type: "reinsurance-config", wide: true }],
  },
  {
    key: "product-assignment",
    title: "Product Assignment",
    hint: "Products of the parent company that can be assigned to this risk company. Select products to assign them.",
    fields: [{ key: "assignedProducts", label: "Assigned Products", type: "assigned-products", wide: true }],
  },
  {
    key: "product-configuration",
    title: "Product Configuration Authority",
    hint: "Define which Product Studio areas this Risk Carrier can configure, and the permissions granted for each.",
    fields: [{ key: "studioPermissions", label: "Studio Permissions", type: "studio-permissions", wide: true }],
  },
];

const cedingCompanySections: OrgSection[] = [
  {
    key: "ceding-company-information",
    title: "Company Information",
    fields: [
      { key: "legalCompanyName", bind: "legalName", label: "Legal Company Name", type: "text", required: true, placeholder: "Registered legal entity name" },
      { key: "tradingName", label: "Display / Trading Name", type: "text", placeholder: "Trading / brand name" },
      { key: "organizationType", bind: "type", label: "Organization Type", type: "readonly", required: true },
      { key: "companyCode", bind: "code", label: "Company Code", type: "readonly", required: true, help: "Auto-generated from the organization name." },
      { key: "parentOrganization", bind: "parentCompanyName", label: "Parent Organization", type: "readonly", required: true },
      { key: "companyStatus", bind: "status", label: "Company Status", type: "select", required: true, options: [opt("active", "Active"), opt("inactive", "Inactive")] },
      { key: "countryOfIncorporation", label: "Country of Incorporation", type: "text", required: true, placeholder: "e.g. United States" },
      { key: "legalEntityType", label: "Legal Entity Type", type: "select", required: true, options: LEGAL_ENTITY_TYPES.map((t) => opt(t)) },
    ],
  },
  {
    key: "ceding-regulatory-licensing",
    title: "Regulatory & Licensing",
    fields: [
      { key: "licenseNumber", label: "Insurance / Reinsurance License Number", type: "text", required: true, placeholder: "e.g. RE-LIC-8821" },
      { key: "regulator", label: "Regulator / Supervisory Authority", type: "text", required: true, placeholder: "e.g. UK PRA" },
      { key: "naicNumber", label: "NAIC Number", type: "text", placeholder: "e.g. 10008" },
      { key: "taxId", label: "Tax ID / EIN", type: "text", placeholder: "e.g. 88-7712345" },
      { key: "authorizedTerritories", label: "Licensed / Authorized Territories", type: "multiselect", ui: "dropdown", required: true, options: AUTHORIZED_TERRITORIES.map((t) => opt(t)), wide: true },
      { key: "reinsuranceAuthorizationType", label: "Reinsurance Authorization Type", type: "select", required: true, options: REINSURANCE_AUTHORIZATION_TYPES.map((t) => opt(t)) },
    ],
  },
  {
    key: "ceding-reinsurance-capability",
    title: "Reinsurance Capability",
    fields: [
      { key: "linesOfBusiness", label: "Lines of Business", type: "multiselect", required: true, optionsSource: "product-families", wide: true },
      { key: "classesOfBusiness", label: "Classes of Business", type: "multiselect", ui: "dropdown", required: true, options: CLASSES_OF_BUSINESS.map((c) => opt(c)), wide: true },
      { key: "riskTypes", label: "Risk Types", type: "multiselect", ui: "dropdown", required: true, options: RISK_TYPES.map((r) => opt(r)), wide: true },
      { key: "reinsuranceType", label: "Reinsurance Type", type: "select", required: true, options: [opt("treaty", "Treaty Reinsurance"), opt("facultative", "Facultative Reinsurance"), opt("both", "Both (Treaty & Facultative)")] },
      { key: "supportedCedingCompanies", label: "Supported Ceding Companies", type: "list", wide: true, placeholder: "Comma separated, e.g. Southlake, Westkale" },
      { key: "supportedProducts", label: "Supported Products", type: "list", wide: true, placeholder: "Comma separated product names" },
      { key: "maximumCapacity", label: "Maximum Capacity", type: "currency", placeholder: "e.g. 25,000,000" },
      { key: "geographicCapacity", label: "Geographic Capacity", type: "text", placeholder: "e.g. US, UK, UAE" },
    ],
  },
  {
    key: "ceding-reinsurance-agreements",
    title: "Reinsurance Agreements",
    fields: [
      { key: "treatyName", label: "Treaty / Agreement Name", type: "text", placeholder: "e.g. Westlake Trucking Quota Share" },
      { key: "treatyNumber", label: "Treaty / Agreement Number", type: "text", placeholder: "e.g. TRTY-2026-101" },
      { key: "effectiveDate", label: "Effective Date", type: "date" },
      { key: "expirationDate", label: "Expiration Date", type: "date" },
      { key: "participationType", label: "Participation Type", type: "select", required: true, options: PARTICIPATION_TYPES.map((p) => opt(p.key, p.label)) },
      { key: "riskParticipationPercent", label: "Risk Participation %", type: "percent", required: true, placeholder: "e.g. 20" },
      { key: "premiumParticipationPercent", label: "Premium Participation %", type: "percent", placeholder: "e.g. 20" },
      { key: "limitCapacity", label: "Limit / Capacity", type: "currency", placeholder: "e.g. 50,000,000" },
      { key: "attachmentPoint", label: "Attachment Point", type: "currency", placeholder: "e.g. 1,000,000" },
      { key: "reinsuranceCommissionPercent", label: "Reinsurance Commission %", type: "percent" },
      { key: "cedingCommissionPercent", label: "Ceding Commission %", type: "percent" },
      { key: "minimumPremium", label: "Minimum Premium", type: "currency" },
      { key: "maximumPremium", label: "Maximum Premium", type: "currency" },
    ],
  },
  {
    key: "ceding-contacts-settlement",
    title: "Contacts & Settlement",
    fields: [
      { key: "registeredAddress", label: "Registered Address", type: "textarea", required: true, wide: true, placeholder: "Full registered office address" },
      { key: "mailingAddress", label: "Mailing Address", type: "textarea", wide: true },
      { key: "primaryContactName", bind: "contactName", label: "Primary Contact Name", type: "text", required: true },
      { key: "primaryContactEmail", bind: "contactEmail", label: "Email", type: "email", required: true },
      { key: "primaryContactPhone", bind: "contactPhone", label: "Phone", type: "tel", required: true },
      { key: "claimsContact", label: "Claims Contact", type: "text" },
      { key: "financeContact", label: "Finance Contact", type: "text" },
      { key: "settlementCurrency", label: "Settlement Currency", type: "select", required: true, options: SETTLEMENT_CURRENCIES.map((c) => opt(c)) },
      { key: "settlementFrequency", label: "Settlement Frequency", type: "select", required: true, options: SETTLEMENT_FREQUENCIES.map((f) => opt(f)) },
      { key: "paymentTerms", label: "Payment Terms", type: "text", required: true, placeholder: "e.g. Net 30" },
      { key: "bankPaymentDetails", label: "Bank / Payment Details", type: "textarea", wide: true },
      { key: "accountingReference", label: "Accounting Reference", type: "text" },
      { key: "taxTreatment", label: "Tax Treatment", type: "text" },
    ],
  },
];

const brokerSections: OrgSection[] = [
  {
    key: "broker-information",
    title: "Broker Information",
    fields: [
      { key: "name", bind: "name", label: "Broker Name", type: "text", required: true, placeholder: "e.g. HTI Brokerage" },
      { key: "legalName", bind: "legalName", label: "DBA / Legal Name", type: "text", placeholder: "Registered legal / trading name" },
      { key: "type", bind: "type", label: "Organization Type", type: "readonly", required: true },
      { key: "authorityType", label: "Authority Type", type: "select", options: AUTHORITY_TYPES },
      { key: "status", bind: "status", label: "Status", type: "select", required: true, options: [opt("active", "Active"), opt("inactive", "Inactive")] },
      { key: "statusReason", label: "Status Reason", type: "text", placeholder: "Reason for the current status" },
      { key: "taxId", label: "Tax ID / EIN", type: "text", placeholder: "e.g. 88-7712345" },
      { key: "form1099", label: "Form 1099", type: "checkbox", help: "Enable when a 1099 must be issued to this broker." },
      { key: "brokerLogo", label: "Broker Logo", type: "file", help: "PNG or SVG. Stored as the file name in this demo." },
    ],
  },
  {
    key: "broker-parent-hierarchy",
    title: "Parent / Hierarchy",
    fields: [
      { key: "parentOrganization", label: "Parent Organization", type: "text", placeholder: "e.g. Southlake Holdings", help: "The parent organization this broker reports into." },
      { key: "parentBroker", label: "Parent Broker", type: "select", optionsSource: "brokers", help: "Select from existing broker organizations in this workspace." },
      { key: "billToParent", label: "Bill to Parent", type: "checkbox", help: "Bill invoices to the parent broker / organization." },
    ],
  },
  {
    key: "broker-licensing-regulatory",
    title: "Licensing & Regulatory",
    fields: [
      { key: "licenseNumber", label: "License Number", type: "text", required: true, placeholder: "e.g. BRK-LIC-5541" },
      {
        key: "licenseType",
        label: "License Type",
        type: "select",
        options: [opt("insurance-agent-license", "Insurance Agent License"), opt("broker-license", "Broker License"), opt("surplus-lines", "Surplus Lines"), opt("mga-license", "MGA License"), opt("other", "Other")],
      },
      { key: "licensingAuthority", label: "Licensing Authority", type: "text", placeholder: "e.g. New York Department of Financial Services" },
      { key: "licenseIssueDate", label: "License Issue Date", type: "date" },
      { key: "licenseExpirationDate", label: "License Expiration Date", type: "date" },
      { key: "licensedTerritories", label: "Licensed States / Territories", type: "multiselect", ui: "dropdown", required: true, options: AUTHORIZED_TERRITORIES.map((t) => opt(t)), wide: true },
      { key: "linesOfBusiness", label: "Lines of Business", type: "multiselect", ui: "dropdown", options: LINES_OF_BUSINESS.map((l) => opt(l)), wide: true },
      { key: "classesOfBusiness", label: "Classes of Business", type: "multiselect", ui: "dropdown", options: CLASSES_OF_BUSINESS.map((c) => opt(c)), wide: true },
    ],
  },
  {
    key: "broker-contact-address",
    title: "Contact & Address",
    fields: [
      { key: "primaryContactName", bind: "contactName", label: "Primary Contact Name", type: "text" },
      { key: "primaryContactEmail", bind: "contactEmail", label: "Email", type: "email", required: true },
      { key: "phone", bind: "contactPhone", label: "Phone", type: "tel" },
      { key: "alternatePhone", label: "Alternate Phone", type: "tel" },
      { key: "fax", label: "Fax", type: "tel" },
      { key: "website", label: "Website", type: "url", placeholder: "https://" },
      { key: "address1", bind: "address", label: "Main Address", type: "text", wide: true, required: true, placeholder: "Registered / main office address" },
      { key: "mailingAddress", label: "Mailing Address", type: "textarea", wide: true },
      { key: "billingAddress", label: "Billing Address", type: "textarea", wide: true },
      { key: "generalMailboxEmail", label: "General Mailbox Email", type: "email" },
    ],
  },
  {
    key: "broker-contracts-agreements",
    title: "Contract & Agreements",
    fields: [
      { key: "contractNumber", label: "Contract Number", type: "text", placeholder: "e.g. BRC-2026-091" },
      { key: "contractDate", label: "Contract Date", type: "date" },
      { key: "effectiveDate", label: "Effective Date", type: "date" },
      { key: "terminationDate", label: "Termination Date", type: "date" },
      { key: "correspondenceAgreement", label: "Correspondence Agreement", type: "checkbox", help: "Agree to electronic correspondence for notices and renewals." },
      { key: "emailAgreement", label: "Email Agreement", type: "checkbox", help: "Agree to receive policy documents by email." },
      { key: "specialAgreements", label: "Special Agreements", type: "textarea", wide: true },
    ],
  },
  {
    key: "broker-business-operational",
    title: "Business / Operational",
    fields: [
      { key: "numberOfEmployees", label: "No. of Employees", type: "number", placeholder: "e.g. 120" },
      { key: "brokerGroup", label: "Broker Group", type: "text", placeholder: "e.g. HTI Network" },
      {
        key: "brokerGrade",
        label: "Broker Grade",
        type: "select",
        options: [opt("platinum", "Platinum"), opt("gold", "Gold"), opt("silver", "Silver"), opt("standard", "Standard"), opt("provisional", "Provisional")],
      },
      { key: "brokerDistrict", label: "Broker District", type: "text", placeholder: "e.g. Northeast" },
      { key: "informationSystem", label: "Information System", type: "text", placeholder: "e.g. Applied EPIC, Vertafore, TAM" },
      { key: "primaryOffice", label: "Primary Office", type: "select", options: [opt("head-office", "Head Office"), opt("branch", "Branch"), opt("satellite", "Satellite")] },
      { key: "coverage", label: "Coverage", type: "text", placeholder: "Markets / capacity this broker covers" },
      { key: "notes", bind: "notes", label: "Notes", type: "textarea", wide: true },
    ],
  },
  {
    key: "broker-commission-billing",
    title: "Commission & Billing",
    fields: [
      { key: "billingType", label: "Billing Type", type: "select", options: [opt("agency-bill", "Agency Bill"), opt("direct-bill", "Direct Bill"), opt("hybrid", "Hybrid")] },
      { key: "commissionType", label: "Commission Type", type: "select", options: [opt("flat-percent", "Flat %"), opt("tiered", "Tiered"), opt("flat-fee", "Flat Fee"), opt("effective-rate", "Effective Rate")] },
      { key: "defaultCommissionPercent", label: "Default Commission %", type: "percent", placeholder: "e.g. 15" },
      { key: "withholdDirectBillCommission", label: "Withhold Direct-Bill Commission", type: "checkbox" },
      { key: "suppressFinanceQuote", label: "Suppress Finance Quote", type: "checkbox" },
      { key: "includeOnParentStatement", label: "Include on Parent Statement", type: "checkbox" },
    ],
  },
  {
    key: "broker-product-market-access",
    title: "Product / Market Access",
    hint: "Reference existing Product Studio products, coverages and approved organizations. No new records are created.",
    fields: [
      { key: "assignedProducts", label: "Assigned Products", type: "multiselect", ui: "dropdown", optionsSource: "products", wide: true },
      { key: "assignedCoverages", label: "Assigned Coverages", type: "multiselect", ui: "dropdown", optionsSource: "coverages", wide: true },
      { key: "authorizedRiskCarriers", label: "Authorized Risk Carriers", type: "multiselect", ui: "dropdown", optionsSource: "carriers", wide: true },
      { key: "authorizedMgasMgus", label: "Authorized MGAs / MGUs", type: "multiselect", ui: "dropdown", optionsSource: "mgas-mgus", wide: true },
      { key: "geographicRestrictions", label: "Geographic Restrictions", type: "multiselect", ui: "dropdown", options: AUTHORIZED_TERRITORIES.map((t) => opt(t)), wide: true },
      { key: "productAccessStatus", label: "Product Access Status", type: "select", options: [opt("active", "Active"), opt("restricted", "Restricted"), opt("disabled", "Disabled")] },
    ],
  },
  {
    key: "broker-portal-communication",
    title: "Portal & Communication",
    fields: [
      { key: "portalAccess", label: "Portal Access", type: "select", options: [opt("none", "None"), opt("full", "Full Access"), opt("limited", "Limited Access")] },
      { key: "portalAccessAllUsers", label: "Portal Access For All Users", type: "checkbox" },
      { key: "preferredBroker", label: "Preferred Broker", type: "checkbox", help: "Flag as a preferred broker for placements." },
      { key: "preferredBrokerReason", label: "Preferred Broker Reason", type: "text" },
      { key: "policyDelivery", label: "Policy Delivery", type: "select", options: [opt("email", "Email"), opt("portal-download", "Portal Download"), opt("print-courier", "Print / Courier")] },
      { key: "brokerStatement", label: "Broker Statement", type: "select", options: [opt("monthly", "Monthly"), opt("quarterly", "Quarterly"), opt("annual", "Annual"), opt("none", "None")] },
      { key: "emailConfiguration", label: "Email Configuration", type: "text", placeholder: "e.g. binding@broker.example.com" },
    ],
  },
];

export const ORG_FIELD_CONFIG: Partial<Record<OrganizationType, OrgTypeFieldConfig>> = {
  "risk-company": { sections: riskCompanySections },
  "risk-carrier": { sections: riskCompanySections },
  "ceding-company": { sections: cedingCompanySections },
  broker: { sections: brokerSections },
};

export function orgFieldSections(type: OrganizationType): OrgSection[] {
  return ORG_FIELD_CONFIG[type]?.sections ?? [];
}

export function hasOrgFieldConfig(type: OrganizationType): boolean {
  return orgFieldSections(type).length > 0;
}

export function orgConfigFields(type: OrganizationType): OrgField[] {
  const fields: OrgField[] = [];
  for (const section of orgFieldSections(type)) fields.push(...section.fields);
  return fields;
}

export function orgConfigFieldsWithAuthority(type: OrganizationType): OrgField[] {
  const fields = orgConfigFields(type);
  if (isAuthorityTypeTarget(type) && !fields.some((field) => field.key === AUTHORITY_FIELD.key)) {
    return [...fields, AUTHORITY_FIELD];
  }
  return fields;
}

export function orgFieldByKey(type: OrganizationType, key: string): OrgField | undefined {
  return orgConfigFields(type).find((field) => field.key === key);
}

export function configSearchText(config: OrganizationConfig | undefined): string {
  if (!config || typeof config !== "object") return "";
  const parts: string[] = [];
  for (const raw of Object.values(config)) {
    if (Array.isArray(raw)) parts.push(raw.join(", "));
    else if (typeof raw === "string") parts.push(raw);
    else if (raw && typeof raw === "object") parts.push(Object.values(raw).flat().join(", "));
  }
  return parts.join(" ");
}

export function collectCoverages(workspace: Workspace): OrgFieldOption[] {
  const seen = new Set<string>();
  const out: OrgFieldOption[] = [];
  for (const [key, value] of Object.entries(workspace.collections)) {
    if (!key.endsWith("::covers") || !Array.isArray(value)) continue;
    for (const raw of value) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as { id?: unknown; name?: unknown };
      const id = String(item.id ?? "");
      const name = String(item.name ?? "");
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      out.push({ value: name, label: name });
    }
  }
  return out;
}
