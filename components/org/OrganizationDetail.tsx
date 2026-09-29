"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteOrganizationAction,
  setOrganizationStatusAction,
} from "@/app/actions/organizations";
import { orgTypeMeta } from "@/lib/organizations";
import { orgFieldSections, type OrgFieldBind } from "@/lib/org-fields";
import type { AuditEvent, Organization, OrganizationFieldValue, ParentCompany } from "@/lib/types";
import { AssignedProducts } from "./AssignedProducts";
import { StatusBadge, TypeBadge } from "./badges";
import { Icon } from "./icons";

const LIST_PATH = "/admin/organizations";

function Chips({ values }: { values: string[] }) {
  if (!values.length) return <span className="text-muted">—</span>;
  return (
    <div className="org-chips">
      {values.map((value) => (
        <span className="org-chip" key={value}>{value}</span>
      ))}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="org-info-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function scalar(value: OrganizationFieldValue | undefined): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return "";
  return String(value);
}

function boundValue(bind: OrgFieldBind | undefined, organization: Organization, parentCompany: ParentCompany | undefined): string {
  switch (bind) {
    case "name":
      return organization.name;
    case "code":
      return organization.code;
    case "legalName":
      return organization.legalName;
    case "status":
      return organization.status;
    case "type":
      return orgTypeMeta(organization.type).singular;
    case "notes":
      return organization.notes;
    case "parentCompanyName":
      return parentCompany?.name || "—";
    case "contactName":
      return organization.contact.name;
    case "contactEmail":
      return organization.contact.email;
    case "contactPhone":
      return organization.contact.phone;
    case "address":
      return organization.address;
    case "createdBy":
      return parentCompany?.name || "—";
    case "createdDate":
      return organization.createdAt;
    case "lastModifiedBy":
      return parentCompany?.name || "—";
    case "lastModifiedDate":
      return organization.updatedAt;
    default:
      return "";
  }
}

function ConfigSectionRows({
  organization,
  parentCompany,
  section,
}: {
  organization: Organization;
  parentCompany: ParentCompany | undefined;
  section: (ReturnType<typeof orgFieldSections>)[number];
}) {
  const nodes: { key: string; label: string; node: React.ReactNode }[] = [];
  for (const field of section.fields) {
    if (field.type === "assigned-products" || field.type === "audit-history" || field.type === "reinsurance-config") continue;
    const value = field.bind
      ? boundValue(field.bind, organization, parentCompany)
      : field.type === "studio-permissions"
        ? studioPermissionsText(organization.config?.studioPermissions)
        : scalar(organization.config?.[field.key]);
    const raw = organization.config?.[field.key];
    const chipValues =
      field.type === "list" || field.type === "multiselect"
        ? Array.isArray(raw)
          ? raw.filter((v): v is string => typeof v === "string")
          : value.split(",").map((v) => v.trim()).filter(Boolean)
        : [];
    nodes.push({
      key: field.key,
      label: field.label,
      node:
        field.type === "list" || field.type === "multiselect" ? (
          <Chips values={chipValues} />
        ) : value || "—",
    });
  }
  if (!nodes.length) return null;
  return (
    <>
      <div className="org-sub-section-title">{section.title}</div>
      <dl className="org-info-list">
        {nodes.map(({ key, label, node }) => (
          <InfoRow key={key} label={label}>{node}</InfoRow>
        ))}
      </dl>
    </>
  );
}

function studioPermissionsText(raw: OrganizationFieldValue | undefined): string {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  return Object.values(raw as Record<string, string[]>).flat().join(", ");
}

export function OrganizationDetail({
  organization,
  parentCompany,
  audit,
}: {
  organization: Organization;
  parentCompany: ParentCompany | undefined;
  audit: AuditEvent[];
}) {
  const meta = orgTypeMeta(organization.type);
  const configSections = orgFieldSections(organization.type);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function toggleStatus() {
    const nextStatus = organization.status === "active" ? "inactive" : "active";
    if (nextStatus === "inactive" && !window.confirm(`Deactivate ${organization.name}?`)) return;
    const fd = new FormData();
    fd.set("id", organization.id);
    fd.set("status", nextStatus);
    fd.set("returnTo", `${LIST_PATH}/${organization.id}`);
    setPendingId(organization.id);
    startTransition(() => setOrganizationStatusAction(fd));
  }

  function remove() {
    if (!window.confirm(`Delete ${organization.name}? This permanently removes the organization and its product assignments.`)) return;
    const fd = new FormData();
    fd.set("id", organization.id);
    setPendingId(organization.id);
    startTransition(() => deleteOrganizationAction(fd));
  }

  return (
    <div className="org-detail">
      <Link className="org-back-link" href={LIST_PATH}>
        <Icon name="arrow-left" size={15} /> Back to Organization Management
      </Link>

      <div className="org-detail-band">
        <div className="org-detail-identity">
          <div className="org-detail-mark" style={{ background: meta.color }}>{organization.code.slice(0, 2)}</div>
          <div>
            <div className="flex-center gap-2">
              <h1 className="page-title" style={{ marginBottom: 0 }}>{organization.name}</h1>
              <TypeBadge type={organization.type} />
              <StatusBadge status={organization.status} />
            </div>
            <div className="org-detail-meta">
              {organization.code} · {organization.id} · Parent: {parentCompany?.name || "—"}
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-secondary" href={`${LIST_PATH}/${organization.id}/edit`}>
            <Icon name="edit" size={15} /> Edit
          </Link>
          <button className="btn btn-secondary" type="button" disabled={pending && pendingId === organization.id} onClick={toggleStatus}>
            <Icon name="power" size={15} /> {organization.status === "active" ? "Deactivate" : "Activate"}
          </button>
          <button className="btn btn-danger" type="button" disabled={pending && pendingId === organization.id} onClick={remove}>
            <Icon name="trash" size={15} /> Delete
          </button>
        </div>
      </div>

      <div className="org-detail-grid">
        <section className="card">
          <div className="card-header">
            <div className="card-title">Organization Information</div>
          </div>
          <div className="card-body">
            <dl className="org-info-list">
              <InfoRow label="Organization name">{organization.name}</InfoRow>
              <InfoRow label="Organization code"><span className="text-mono">{organization.code}</span></InfoRow>
              <InfoRow label="Legal name">{organization.legalName || "—"}</InfoRow>
              <InfoRow label="Organization type"><TypeBadge type={organization.type} /></InfoRow>
              <InfoRow label="Parent company">{parentCompany?.name || "—"}</InfoRow>
              <InfoRow label="Status"><StatusBadge status={organization.status} /></InfoRow>
              <InfoRow label="Contact name">{organization.contact.name || "—"}</InfoRow>
              <InfoRow label="Email">
                {organization.contact.email ? <a href={`mailto:${organization.contact.email}`}>{organization.contact.email}</a> : "—"}
              </InfoRow>
              <InfoRow label="Phone">{organization.contact.phone || "—"}</InfoRow>
              <InfoRow label="Address">{organization.address || "—"}</InfoRow>
              <InfoRow label="Notes">{organization.notes || "—"}</InfoRow>
            </dl>
          </div>
        </section>

        <aside className="org-detail-side">
          <section className="card">
            <div className="card-header">
              <div className="card-title">{configSections.length ? "Configuration" : "Risk Carrier Details"}</div>
            </div>
            <div className="card-body">
              {configSections.length ? (
                configSections.map((section) => (
                  <ConfigSectionRows
                    key={section.key}
                    organization={organization}
                    parentCompany={parentCompany}
                    section={section}
                  />
                ))
              ) : (
                <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
                  No configuration fields apply to this organization type. This organization is a {meta.singular}.
                </p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-title">Metadata</div>
            </div>
            <div className="card-body">
              <dl className="org-info-list">
                <InfoRow label="Organization ID"><span className="text-mono">{organization.id}</span></InfoRow>
                <InfoRow label="Parent company ID"><span className="text-mono">{organization.parentCompanyId}</span></InfoRow>
                <InfoRow label="Created">{organization.createdAt ? organization.createdAt.slice(0, 10) : "—"}</InfoRow>
                <InfoRow label="Last updated">{organization.updatedAt ? organization.updatedAt.slice(0, 10) : "—"}</InfoRow>
              </dl>
            </div>
          </section>
        </aside>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Assigned Products</div>
            <div className="card-subtitle">Existing products from the Product Studio assigned to this organization.</div>
          </div>
          <span className="org-count-pill">{organization.assignedProducts?.length || 0}</span>
        </div>
        <div className="card-body">
          <AssignedProducts organization={organization} returnTo={`${LIST_PATH}/${organization.id}`} />
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div className="card-title">Audit</div>
        </div>
        <div className="card-body">
          {audit.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>No audit events recorded for this organization yet.</p>
          ) : (
            <ul className="org-audit-list">
              {audit.map((event) => (
                <li key={event.id} className="org-audit-item">
                  <span className="org-audit-action">{event.action}</span>
                  <div className="org-audit-main">
                    <div>{event.description}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {event.user} · {event.role} · {event.at.slice(0, 19).replace("T", " ")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
