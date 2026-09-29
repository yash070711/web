"use client";

import { useState } from "react";
import Link from "next/link";
import { saveOrganizationAction } from "@/app/actions/organizations";
import { hasOrgFieldConfig, isAuthorityTypeTarget, AUTHORITY_TYPES, type OrgFieldOption } from "@/lib/org-fields";
import { ORG_STATUSES, ORG_TYPE_OPTIONS, orgTypeMeta } from "@/lib/organizations";
import type { AuditEvent, Organization, OrganizationType, ParentCompany, Product } from "@/lib/types";
import { OrgConfigFields } from "./OrgConfigFields";
import { SubmitButton } from "./SubmitButton";
import { Icon } from "./icons";

export function OrganizationForm({
  organization,
  parentCompany,
  audit = [],
  error,
  products = [],
  coverages = [],
  organizations = [],
}: {
  organization?: Organization;
  parentCompany: ParentCompany | undefined;
  audit?: AuditEvent[];
  error?: string;
  products?: Product[];
  coverages?: OrgFieldOption[];
  organizations?: Organization[];
}) {
  const options = ORG_TYPE_OPTIONS.slice();
  if (organization && !options.some((o) => o.key === organization.type)) {
    options.unshift(orgTypeMeta(organization.type));
  }
  const [type, setType] = useState<OrganizationType>(organization?.type || options[0].key);
  const isEdit = Boolean(organization);
  const configured = hasOrgFieldConfig(type);

  return (
    <div className="org-form-page">
      <Link className="org-back-link" href={isEdit ? `/admin/organizations/${organization?.id}` : "/admin/organizations"}>
        <Icon name="arrow-left" size={15} /> {isEdit ? "Back to organization" : "Back to Organization Management"}
      </Link>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isEdit ? `Edit ${organization?.name}` : "Create Organization"}</h1>
          <p className="page-subtitle">
            {isEdit
              ? "Update the organization profile and configuration."
              : "Add a new organization under the parent company. Selecting Risk Company loads its carrier configuration."}
          </p>
        </div>
      </div>

      {error ? (
        <div className="callout callout-error">
          <Icon name="x" size={16} />
          <div>
            <div className="callout-title">Could not save</div>
            <div>{error}</div>
          </div>
        </div>
      ) : null}

      <form action={saveOrganizationAction} className="card org-form">
        {isEdit ? <input type="hidden" name="id" value={organization?.id} /> : null}
        <div className="card-body">
          <div className="org-form-section-title">
            Organization Type
            <span className="org-form-section-hint">
              The organization type determines which configuration sections are shown.
            </span>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="org-type">Organization Type <span className="required">*</span></label>
              <select
                id="org-type"
                className="form-control"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as OrganizationType)}
              >
                {options.map((meta) => (
                  <option key={meta.key} value={meta.key}>{meta.singular}</option>
                ))}
              </select>
              <p className="form-help">
                {configured
                  ? `${orgTypeMeta(type).singular} configuration fields are shown below.`
                  : `${orgTypeMeta(type).singular} uses the standard organization fields below.`}
              </p>
            </div>
          </div>

          {configured ? (
            <OrgConfigFields
              key={type}
              type={type}
              organization={organization}
              parentCompany={parentCompany}
              audit={audit}
              products={products}
              coverages={coverages}
              organizations={organizations}
            />
          ) : (
            <>
              <div className="org-form-section-title">Organization details</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="org-name">Organization Name <span className="required">*</span></label>
                  <input id="org-name" className="form-control" name="name" required defaultValue={organization?.name || ""} placeholder="e.g. Southlake" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="org-status">Status</label>
                  <select id="org-status" className="form-control" name="status" defaultValue={organization?.status || "active"}>
                    {ORG_STATUSES.map((status) => (
                      <option key={status} value={status}>{status === "active" ? "Active" : "Inactive"}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="org-legal">Legal Name</label>
                  <input id="org-legal" className="form-control" name="legalName" defaultValue={organization?.legalName || ""} placeholder="Registered legal entity name" />
                </div>
                {isAuthorityTypeTarget(type) && !hasOrgFieldConfig(type) ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="org-authority">Authority Type</label>
                    <select
                      id="org-authority"
                      className="form-control"
                      name="authorityType"
                      defaultValue={typeof organization?.config?.authorityType === "string" ? organization.config.authorityType : ""}
                    >
                      <option value="">Select…</option>
                      {AUTHORITY_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="form-group">
                  <label className="form-label">Parent Company</label>
                  <input className="form-control" value={parentCompany?.name || "Southlake Holdings"} readOnly disabled />
                  <p className="form-help">Automatically set — organizations are always created under the parent company.</p>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="org-notes">Notes</label>
                  <textarea id="org-notes" className="form-control" name="notes" rows={3} defaultValue={organization?.notes || ""} />
                </div>
              </div>

              <div className="org-form-section-title">Contact information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="org-contact-name">Contact Name</label>
                  <input id="org-contact-name" className="form-control" name="contactName" defaultValue={organization?.contact.name || ""} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="org-contact-email">Email</label>
                  <input id="org-contact-email" className="form-control" type="email" name="contactEmail" defaultValue={organization?.contact.email || ""} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="org-contact-phone">Phone</label>
                  <input id="org-contact-phone" className="form-control" name="contactPhone" defaultValue={organization?.contact.phone || ""} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label" htmlFor="org-address">Address</label>
                  <input id="org-address" className="form-control" name="address" defaultValue={organization?.address || ""} />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="org-form-footer">
          <Link className="btn btn-secondary" href={isEdit ? `/admin/organizations/${organization?.id}` : "/admin/organizations"}>
            Cancel
          </Link>
          <SubmitButton pendingLabel="Saving…">{isEdit ? "Save changes" : "Create organization"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}