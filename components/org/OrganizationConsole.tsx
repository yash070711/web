"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteOrganizationAction,
  parentSignOutAction,
  setOrganizationStatusAction,
} from "@/app/actions/organizations";
import { ORG_TYPES, countByStatus, organizationsByType } from "@/lib/organizations";
import { configSearchText } from "@/lib/org-fields";
import type {
  Organization,
  OrganizationStatus,
  OrganizationType,
  ParentCompany,
  Product,
  SessionUser,
} from "@/lib/types";
import { ProductAssignmentPanel } from "./ProductAssignmentPanel";
import { StatusBadge, TypeBadge } from "./badges";
import { Icon } from "./icons";

const LIST_PATH = "/admin/organizations";

export function OrganizationConsole({
  session,
  parentCompany,
  organizations,
  products,
  ok,
  error,
}: {
  session: SessionUser;
  parentCompany: ParentCompany | undefined;
  organizations: Organization[];
  products: Product[];
  ok?: string;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | OrganizationType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrganizationStatus>("all");
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const byType = useMemo(() => organizationsByType(organizations), [organizations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations.filter((organization) => {
      if (typeFilter !== "all" && organization.type !== typeFilter) return false;
      if (statusFilter !== "all" && organization.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        organization.name,
        organization.code,
        organization.legalName,
        organization.contact.name,
        organization.contact.email,
        configSearchText(organization.config),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [organizations, typeFilter, statusFilter, search]);

  const activeCount = countByStatus(organizations, "active");
  const inactiveCount = countByStatus(organizations, "inactive");

  function run(action: (fd: FormData) => void, fields: Record<string, string>, id: string, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) fd.set(key, value);
    setPendingId(id);
    startTransition(() => action(fd));
  }

  return (
    <div className="org-console">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Organization Management</h1>
          <p className="page-subtitle">
            Create and manage the risk carriers, MGUs, MGAs and brokers under {parentCompany?.name || "the parent company"}, and assign products to them.
          </p>
        </div>
        <div className="page-header-actions">
          <span className="org-session-pill">
            <Icon name="shield" size={14} /> {parentCompany?.name || session.name} · {session.role}
          </span>
          <form action={parentSignOutAction}>
            <button className="btn btn-secondary" type="submit">Sign out</button>
          </form>
          <Link className="btn btn-primary" href={`${LIST_PATH}/new`}>
            <Icon name="plus" size={15} /> Create Organization
          </Link>
        </div>
      </div>

      {ok ? (
        <div className="callout callout-success">
          <Icon name="check" size={16} />
          <div>{ok}</div>
        </div>
      ) : null}
      {error ? (
        <div className="callout callout-error">
          <Icon name="x" size={16} />
          <div>{error}</div>
        </div>
      ) : null}

      <div className="org-kpis">
        <div className="kpi-card">
          <div className="kpi-number">{organizations.length}</div>
          <div className="kpi-label">Organizations</div>
          <div className="kpi-sub">{products.length} products available</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-number" style={{ color: "var(--color-success)" }}>{activeCount}</div>
          <div className="kpi-label">Active</div>
          <div className="kpi-sub">Enabled on the platform</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-number" style={{ color: "var(--color-warning)" }}>{inactiveCount}</div>
          <div className="kpi-label">Inactive</div>
          <div className="kpi-sub">Paused on the platform</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-number" style={{ color: "var(--color-info)" }}>{ORG_TYPES.length}</div>
          <div className="kpi-label">Organization Types</div>
          <div className="kpi-sub">Carrier, MGU, MGA, Broker and more</div>
        </div>
      </div>

      <section className="card org-table-card">
        <div className="card-header org-toolbar">
          <div className="org-filter-pills">
            <button type="button" className={`org-filter-pill ${typeFilter === "all" ? "active" : ""}`} onClick={() => setTypeFilter("all")}>
              All <span>{organizations.length}</span>
            </button>
            {ORG_TYPES.map((meta) => (
              <button
                key={meta.key}
                type="button"
                className={`org-filter-pill ${typeFilter === meta.key ? "active" : ""}`}
                onClick={() => setTypeFilter(meta.key)}
              >
                {meta.label} <span>{(byType.get(meta.key) || []).length}</span>
              </button>
            ))}
          </div>
          <div className="org-toolbar-right">
            <div className="org-search">
              <Icon name="search" size={15} />
              <input
                className="form-control"
                placeholder="Search organizations, codes, NAIC…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-control org-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | OrganizationStatus)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Organization Type</th>
                <th>Contact</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="org-empty" style={{ padding: "28px 0" }}>
                      <Icon name="building" size={22} />
                      <p>
                        {organizations.length === 0
                          ? "No organizations yet. Create your first one."
                          : "No organizations match the current search or filters."}
                      </p>
                      {organizations.length === 0 ? (
                        <Link className="btn btn-primary btn-sm" href={`${LIST_PATH}/new`}>Create Organization</Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((organization) => (
                  <tr key={organization.id}>
                    <td>
                      <div className="fw-600">{organization.name}</div>
                      <div className="text-muted text-mono" style={{ fontSize: 12 }}>
                        {organization.code} · {organization.legalName}
                      </div>
                    </td>
                    <td><TypeBadge type={organization.type} /></td>
                    <td>
                      <div>{organization.contact.name || "—"}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{organization.contact.email || "—"}</div>
                    </td>
                    <td className="mono">{organization.assignedProducts?.length || 0}</td>
                    <td><StatusBadge status={organization.status} /></td>
                    <td>
                      <div className="table-actions">
                        <Link className="org-icon-btn" href={`${LIST_PATH}/${organization.id}`} title="View details">
                          <Icon name="eye" />
                        </Link>
                        <Link className="org-icon-btn" href={`${LIST_PATH}/${organization.id}/edit`} title="Edit">
                          <Icon name="edit" />
                        </Link>
                        <button
                          className="org-icon-btn"
                          type="button"
                          title={organization.status === "active" ? "Deactivate" : "Activate"}
                          disabled={pending && pendingId === organization.id}
                          onClick={() =>
                            run(
                              setOrganizationStatusAction,
                              {
                                id: organization.id,
                                status: organization.status === "active" ? "inactive" : "active",
                                returnTo: LIST_PATH,
                              },
                              organization.id,
                              organization.status === "active"
                                ? `Deactivate ${organization.name}? It will no longer be active on the platform.`
                                : undefined
                            )
                          }
                        >
                          <Icon name="power" />
                        </button>
                        <button
                          className="org-icon-btn danger"
                          type="button"
                          title="Delete"
                          disabled={pending && pendingId === organization.id}
                          onClick={() =>
                            run(
                              deleteOrganizationAction,
                              { id: organization.id },
                              organization.id,
                              `Delete ${organization.name}? This permanently removes the organization and its product assignments.`
                            )
                          }
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ProductAssignmentPanel products={products} organizations={organizations} />
    </div>
  );
}
