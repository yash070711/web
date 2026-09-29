"use client";

import { useMemo, useState } from "react";
import {
  REINSURERS,
  STUDIOS,
  STUDIO_PERMISSIONS,
  TREATY_TYPES,
  orgFieldSections,
  type OrgField,
  type OrgFieldBind,
  type OrgFieldOption,
} from "@/lib/org-fields";
import { orgOptionsFor, type OrgOptionsContext } from "@/lib/org-options";
import { DEFAULT_PARENT_COMPANY_NAME, orgTypeMeta } from "@/lib/organizations";
import type {
  AuditEvent,
  Organization,
  OrganizationFieldValue,
  OrganizationType,
  ParentCompany,
  Product,
} from "@/lib/types";
import { Icon } from "./icons";

function asList(value: OrganizationFieldValue | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function asScalar(value: OrganizationFieldValue | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return "";
  return String(value);
}

type BindContext = {
  organization?: Organization;
  parentCompany?: ParentCompany;
  type: OrganizationType;
};

function boundValue(bind: OrgFieldBind | undefined, ctx: BindContext): string {
  const { organization, parentCompany, type } = ctx;
  switch (bind) {
    case "name":
      return organization?.name || "";
    case "code":
      return organization?.code || "";
    case "legalName":
      return organization?.legalName || "";
    case "status":
      return organization?.status || "active";
    case "type":
      return orgTypeMeta(type).singular;
    case "notes":
      return organization?.notes || "";
    case "parentCompanyName":
      return parentCompany?.name || DEFAULT_PARENT_COMPANY_NAME;
    case "contactName":
      return organization?.contact.name || "";
    case "contactEmail":
      return organization?.contact.email || "";
    case "contactPhone":
      return organization?.contact.phone || "";
    case "address":
      return organization?.address || "";
    case "createdBy":
      return organization ? parentCompany?.name || DEFAULT_PARENT_COMPANY_NAME : "";
    case "createdDate":
      return organization?.createdAt || "";
    case "lastModifiedBy":
      return organization ? parentCompany?.name || DEFAULT_PARENT_COMPANY_NAME : "";
    case "lastModifiedDate":
      return organization?.updatedAt || "";
    default:
      return "";
  }
}

function StudioPermissionsField({ organization }: { organization?: Organization }) {
  const perms = useMemo(() => {
    const raw = organization?.config?.studioPermissions;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, string[]>) : {};
  }, [organization]);

  return (
    <div className="org-studio-matrix">
      <table>
        <thead>
          <tr>
            <th>Studio</th>
            {STUDIO_PERMISSIONS.map((permission) => (
              <th key={permission.key}>{permission.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STUDIOS.map((studio) => (
            <tr key={studio.key}>
              <td className="org-studio-name">{studio.label}</td>
              {STUDIO_PERMISSIONS.map((permission) => (
                <td key={permission.key} className="org-studio-cell">
                  <input
                    type="checkbox"
                    name="studioPermissions"
                    value={`${studio.key}:${permission.key}`}
                    defaultChecked={(perms[studio.key] || []).includes(permission.key)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditHistoryField({ audit }: { audit: AuditEvent[] }) {
  if (!audit.length) {
    return <p className="org-config-muted">No audit events recorded yet.</p>;
  }
  return (
    <ul className="org-audit-list">
      {audit.map((event) => (
        <li key={event.id} className="org-audit-item">
          <span className="org-audit-action">{event.action}</span>
          <div className="org-audit-main">
            <div>{event.description}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {event.user} · {event.at.slice(0, 19).replace("T", " ")}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MultiSelectDropdown({
  field,
  configValue,
  options,
}: {
  field: OrgField;
  configValue: OrganizationFieldValue | undefined;
  options: OrgFieldOption[];
}) {
  const [open, setOpen] = useState(false);
  const initial = Array.isArray(configValue)
    ? configValue.filter((v): v is string => typeof v === "string")
    : [];
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial));
  const allSelected = options.length > 0 && selected.size === options.length;

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <div className="org-multi-dropdown">
      <button type="button" className="org-multi-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="org-multi-trigger-label">
          {selected.size === 0
            ? "Select…"
            : allSelected
              ? `All ${options.length} selected`
              : selected.size === 1
                ? "1 selected"
                : `${selected.size} selected`}
        </span>
        <Icon name="chevron-down" size={14} />
      </button>
      <div className={`org-multi-panel ${open ? "open" : ""}`}>
        <div className="org-multi-panel-list">
          {options.map((option) => {
            const value = option.value;
            const on = selected.has(value);
            return (
              <label className={`org-multi-option ${on ? "on" : ""}`} key={value}>
                <input
                  type="checkbox"
                  name={field.key}
                  value={value}
                  checked={on}
                  onChange={() => toggle(value)}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
      {selected.size > 0 ? (
        <div className="org-multi-trigger-tags">
          {options.filter((o) => selected.has(o.value)).slice(0, 5).map((o) => (
            <span className="org-assign-tag" key={o.value}>{o.label}</span>
          ))}
          {selected.size > 5 ? <span className="org-assign-tag">+{selected.size - 5}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function fieldOptions(field: OrgField, optionsCtx: OrgOptionsContext): OrgFieldOption[] {
  return field.optionsSource ? orgOptionsFor(field.optionsSource, optionsCtx) : field.options || [];
}

function CheckboxControl({
  name,
  id,
  defaultValue,
}: {
  name: string;
  id: string;
  defaultValue: boolean;
}) {
  const [on, setOn] = useState(defaultValue);
  return (
    <label className="org-toggle">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultValue}
        onChange={(e) => setOn(e.target.checked)}
      />
      <span className="org-toggle-track" aria-hidden="true">
        <span className="org-toggle-thumb" />
      </span>
      <span className="org-toggle-text">{on ? "Yes" : "No"}</span>
    </label>
  );
}

function ProductAssignmentField({
  organization,
  products,
}: {
  organization?: Organization;
  products: Product[];
}) {
  const assignedIds = useMemo(
    () => new Set((organization?.assignedProducts || []).map((a) => a.productId)),
    [organization]
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set(assignedIds));
  const [open, setOpen] = useState(false);

  function toggle(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  if (!products.length) {
    return <p className="org-config-muted">No products available to assign.</p>;
  }

  return (
    <div className="org-multi-dropdown org-product-assign">
      <input type="hidden" name="assignProductsInitialized" value="1" />
      <button type="button" className="org-multi-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="org-multi-trigger-label">
          {selected.size === 0
            ? "Select products…"
            : selected.size === 1
              ? "1 product selected"
              : `${selected.size} products selected`}
        </span>
        <Icon name="chevron-down" size={14} />
      </button>
      <div className={`org-multi-panel ${open ? "open" : ""}`}>
        <div className="org-multi-panel-list">
          {products.map((product) => {
            const on = selected.has(product.id);
            return (
              <label className={`org-multi-option ${on ? "on" : ""}`} key={product.id}>
                <input
                  type="checkbox"
                  name="assignedProductIds"
                  value={product.id}
                  checked={on}
                  onChange={() => toggle(product.id)}
                />
                <span>{product.name}</span>
                <span className="text-mono" style={{ fontSize: 11 }}>{product.id}</span>
              </label>
            );
          })}
        </div>
      </div>
      {selected.size > 0 ? (
        <div className="org-multi-trigger-tags">
          {products.filter((p) => selected.has(p.id)).slice(0, 5).map((p) => (
            <span className="org-assign-tag" key={p.id}>{p.name}</span>
          ))}
          {selected.size > 5 ? <span className="org-assign-tag">+{selected.size - 5}</span> : null}
        </div>
      ) : null}
      <p className="form-help">
        {organization
          ? "Selecting products updates the assignment for this risk company when saved."
          : "Save the organization first, then return to assign products from the parent company catalogue."}
      </p>
    </div>
  );
}

type ReinsuranceRecord = {
  reinsurer: string;
  treatyType: string;
  participationPercent: string;
  retentionPercent: string;
  cededPercent: string;
  effectiveDate: string;
  expirationDate: string;
};

const EMPTY_REINSURANCE_RECORD: ReinsuranceRecord = {
  reinsurer: "",
  treatyType: "",
  participationPercent: "",
  retentionPercent: "",
  cededPercent: "",
  effectiveDate: "",
  expirationDate: "",
};

function coerceReinsuranceRecord(raw: unknown): ReinsuranceRecord {
  const record = typeof raw === "object" && raw ? (raw as Record<string, unknown>) : {};
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    reinsurer: text(record.reinsurer),
    treatyType: text(record.treatyType),
    participationPercent: text(record.participationPercent),
    retentionPercent: text(record.retentionPercent),
    cededPercent: text(record.cededPercent),
    effectiveDate: text(record.effectiveDate),
    expirationDate: text(record.expirationDate),
  };
}

function parseReinsuranceRecords(value: OrganizationFieldValue | undefined): ReinsuranceRecord[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(coerceReinsuranceRecord);
  } catch {
    return [];
  }
}

function ReinsuranceConfigField({ organization }: { organization?: Organization }) {
  const initial = useMemo(() => parseReinsuranceRecords(organization?.config?.reinsuranceRecords), [organization]);
  const [records, setRecords] = useState<ReinsuranceRecord[]>(() =>
    initial.length ? initial : [{ ...EMPTY_REINSURANCE_RECORD }]
  );

  function update(index: number, patch: Partial<ReinsuranceRecord>) {
    setRecords((prev) => prev.map((record, i) => (i === index ? { ...record, ...patch } : record)));
  }

  function addRecord() {
    setRecords((prev) => [...prev, { ...EMPTY_REINSURANCE_RECORD }]);
  }

  function removeRecord(index: number) {
    setRecords((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <div className="org-reinsurance">
      <input type="hidden" name="reinsuranceRecords" value={JSON.stringify(records)} onChange={() => {}} />
      {records.map((record, index) => (
        <div className="org-reinsurance-row" key={index}>
          <div className="org-reinsurance-row-head">
            <span className="org-reinsurance-row-title">{record.reinsurer || `Reinsurer ${index + 1}`}</span>
            {records.length > 1 ? (
              <button
                type="button"
                className="org-icon-btn org-reinsurance-remove"
                title="Remove this reinsurer"
                onClick={() => removeRecord(index)}
              >
                <Icon name="trash" size={14} />
              </button>
            ) : null}
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Reinsurer</label>
              <select
                className="form-control"
                value={record.reinsurer}
                onChange={(e) => update(index, { reinsurer: e.target.value })}
              >
                <option value="">Select reinsurer…</option>
                {REINSURERS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Treaty Type</label>
              <select
                className="form-control"
                value={record.treatyType}
                onChange={(e) => update(index, { treatyType: e.target.value })}
              >
                <option value="">Select…</option>
                {TREATY_TYPES.map((treaty) => (
                  <option key={treaty.value} value={treaty.value}>{treaty.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Shared Risk %</label>
              <input
                className="form-control"
                value={record.participationPercent}
                placeholder="e.g. 25"
                inputMode="decimal"
                onChange={(e) => update(index, { participationPercent: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Retention %</label>
              <input
                className="form-control"
                value={record.retentionPercent}
                placeholder="e.g. 30"
                inputMode="decimal"
                onChange={(e) => update(index, { retentionPercent: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ceded %</label>
              <input
                className="form-control"
                value={record.cededPercent}
                placeholder="e.g. 70"
                inputMode="decimal"
                onChange={(e) => update(index, { cededPercent: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Effective Date</label>
              <input
                className="form-control"
                type="date"
                value={record.effectiveDate}
                onChange={(e) => update(index, { effectiveDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expiration Date</label>
              <input
                className="form-control"
                type="date"
                value={record.expirationDate}
                onChange={(e) => update(index, { expirationDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="org-reinsurance-add" onClick={addRecord}>
        <Icon name="plus" size={14} /> Add reinsurer
      </button>
    </div>
  );
}

function Field({
  field,
  ctx,
  audit,
  optionsCtx,
}: {
  field: OrgField;
  ctx: BindContext;
  audit: AuditEvent[];
  optionsCtx: OrgOptionsContext;
}) {
  const { organization } = ctx;
  const configValue = organization?.config?.[field.key];
  const id = `org-field-${field.key}`;
  const wide =
    field.wide ||
    field.type === "textarea" ||
    field.type === "studio-permissions" ||
    field.type === "multiselect" ||
    field.type === "audit-history" ||
    field.type === "reinsurance-config";

  if (field.type === "studio-permissions") {
    return (
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label className="form-label">{field.label}</label>
        <StudioPermissionsField organization={organization} />
      </div>
    );
  }

  if (field.type === "assigned-products") {
    return (
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label className="form-label">{field.label}</label>
        <ProductAssignmentField organization={organization} products={optionsCtx.products} />
      </div>
    );
  }

  if (field.type === "audit-history") {
    return (
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label className="form-label">{field.label}</label>
        <AuditHistoryField audit={audit} />
      </div>
    );
  }

  if (field.type === "reinsurance-config") {
    return (
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label className="form-label">{field.label}</label>
        <ReinsuranceConfigField organization={organization} />
      </div>
    );
  }

  if (field.type === "readonly") {
    const display = field.bind ? boundValue(field.bind, ctx) : asScalar(configValue);
    return (
      <div className="form-group" style={{ gridColumn: wide ? "1 / -1" : undefined }}>
        <label className="form-label">{field.label}</label>
        <div className="org-config-readonly">{display || "—"}</div>
        {field.help ? <p className="form-help">{field.help}</p> : null}
      </div>
    );
  }

  const name = field.bind || field.key;
  const stringValue = field.bind ? boundValue(field.bind, ctx) : asScalar(configValue);
  const listValue = field.bind ? boundValue(field.bind, ctx) : asList(configValue);

  const label = (
    <label className="form-label" htmlFor={id}>
      {field.label} {field.required ? <span className="required">*</span> : null}
    </label>
  );

  const help = field.help ? <p className="form-help">{field.help}</p> : null;

  let control: React.ReactNode;
  switch (field.type) {
    case "textarea":
      control = <textarea id={id} className="form-control" name={name} rows={3} defaultValue={stringValue} placeholder={field.placeholder} />;
      break;
    case "select":
      control = (
        <select id={id} className="form-control" name={name} defaultValue={stringValue}>
          <option value="">Select…</option>
          {fieldOptions(field, optionsCtx).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
      break;
    case "checkbox":
      control = (
        <CheckboxControl
          name={name}
          id={id}
          defaultValue={typeof configValue === "boolean" ? configValue : false}
        />
      );
      break;
    case "file":
      control = (
        <>
          <input id={id} className="form-control" type="file" name={name} />
          {stringValue ? <p className="form-help">Current: {stringValue}</p> : null}
        </>
      );
      break;
    case "date":
      control = <input id={id} className="form-control" type="date" name={name} defaultValue={stringValue} />;
      break;
    case "number":
    case "currency":
    case "percent":
      control = (
        <input
          id={id}
          className="form-control"
          name={name}
          defaultValue={stringValue}
          placeholder={field.placeholder || (field.type === "percent" ? "e.g. 25" : undefined)}
          inputMode="decimal"
        />
      );
      break;
    case "email":
      control = <input id={id} className="form-control" type="email" name={name} defaultValue={stringValue} placeholder={field.placeholder} />;
      break;
    case "tel":
      control = <input id={id} className="form-control" type="tel" name={name} defaultValue={stringValue} placeholder={field.placeholder} />;
      break;
    case "url":
      control = <input id={id} className="form-control" type="url" name={name} defaultValue={stringValue} placeholder={field.placeholder} />;
      break;
    case "list":
      control = <input id={id} className="form-control" name={name} defaultValue={listValue} placeholder={field.placeholder} />;
      break;
    case "multiselect":
      {
        const options = fieldOptions(field, optionsCtx);
        if (field.ui === "dropdown") {
          control = (
            <MultiSelectDropdown field={field} configValue={configValue} options={options} />
          );
        } else {
          const current = Array.isArray(configValue) ? configValue : [];
          control = (
            <div className="org-multi-wrap">
              {options.map((option) => {
                const value = String(option.value);
                return (
                  <label className={`org-multi-option ${current.includes(value) ? "on" : ""}`} key={value}>
                    <input type="checkbox" name={name} value={value} defaultChecked={current.includes(value)} />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          );
        }
      }
      break;
    default:
      control = <input id={id} className="form-control" name={name} defaultValue={stringValue} placeholder={field.placeholder} />;
  }

  return (
    <div className="form-group" style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      {label}
      {control}
      {help}
    </div>
  );
}

export function OrgConfigFields({
  type,
  organization,
  parentCompany,
  audit,
  products,
  coverages = [],
  organizations = [],
}: {
  type: OrganizationType;
  organization?: Organization;
  parentCompany?: ParentCompany;
  audit: AuditEvent[];
  products: Product[];
  coverages?: OrgFieldOption[];
  organizations?: Organization[];
}) {
  const sections = orgFieldSections(type);
  const ctx: BindContext = { organization, parentCompany, type };
  const optionsCtx: OrgOptionsContext = { products, coverages, organizations };

  if (!sections.length) return null;

  return (
    <div className="org-config-sections">
      {sections.map((section) => (
        <section className="org-config-section" key={section.key}>
          <div className="org-form-section-title">
            {section.title}
            {section.hint ? <span className="org-form-section-hint">{section.hint}</span> : null}
          </div>
          {section.intro ? <p className="org-config-muted">{section.intro}</p> : null}
          <div className="form-grid-2">
            {section.fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                ctx={ctx}
                audit={audit}
                optionsCtx={optionsCtx}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function OrgConfigEmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="org-config-muted">
      <Icon name="x" size={14} /> {children}
    </div>
  );
}
