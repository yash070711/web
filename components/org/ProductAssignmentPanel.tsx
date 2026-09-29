"use client";

import { useMemo, useState } from "react";
import { assignProductAction } from "@/app/actions/organizations";
import { ORG_TYPES } from "@/lib/organizations";
import type { Organization, Product } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";
import { TypeBadge } from "./badges";
import { Icon } from "./icons";

export function ProductAssignmentPanel({
  products,
  organizations,
}: {
  products: Product[];
  organizations: Organization[];
}) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [selected, setSelected] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const selectedProduct = products.find((p) => p.id === productId);

  const alreadyAssigned = useMemo(() => {
    if (!selectedProduct) return new Set<string>();
    return new Set(
      organizations.filter((o) => o.assignedProducts.some((a) => a.productId === selectedProduct.id)).map((o) => o.id)
    );
  }, [organizations, selectedProduct]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAll() {
    setSelected(organizations.map((o) => o.id));
  }

  return (
    <section className="card org-assign-card" id="assign-products">
      <div className="card-header">
        <div>
          <div className="card-title">Assign Products</div>
          <div className="card-subtitle">
            Pick an existing product, choose one or more organizations, then assign.
          </div>
        </div>
        <span className="org-assign-badge">
          <Icon name="link" size={14} /> Product → Organizations
        </span>
      </div>
      <form action={assignProductAction} className="card-body">
        <div className="org-assign-grid">
          <div className="org-assign-controls">
            <div className="form-group">
              <label className="form-label" htmlFor="assign-product">Product</label>
              <select
                id="assign-product"
                className="form-control"
                name="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                {products.length === 0 ? <option value="">No products available</option> : null}
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} ({product.id})</option>
                ))}
              </select>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="assign-role">Assignment role</label>
                <input
                  id="assign-role"
                  className="form-control"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Carrier, MGU, MGA, Broker"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="assign-status">Status</label>
                <select
                  id="assign-status"
                  className="form-control"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {selectedProduct ? (
              <div className="org-assign-summary">
                <strong>{selectedProduct.name}</strong>
                <span className="text-muted"> ↓ </span>
                {selected.length === 0 ? (
                  <span className="text-muted">no organizations selected</span>
                ) : (
                  <span>{selected.map((id) => organizations.find((o) => o.id === id)?.name).filter(Boolean).join(", ")}</span>
                )}
              </div>
            ) : null}
          </div>

          <div className="org-assign-picker">
            <div className="org-assign-picker-head">
              <span>Organizations</span>
              <div className="org-assign-picker-actions">
                <button type="button" className="org-link-btn" onClick={selectAll}>Select all</button>
                <button type="button" className="org-link-btn" onClick={() => setSelected([])}>Clear</button>
              </div>
            </div>
            {organizations.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>No organizations yet. Create one first.</p>
            ) : (
              ORG_TYPES.map((meta) => {
                const group = organizations.filter((o) => o.type === meta.key);
                if (!group.length) return null;
                return (
                  <div className="org-assign-group" key={meta.key}>
                    <div className="org-assign-group-label">
                      <span className="org-type-dot" style={{ background: meta.color }} />
                      {meta.label}
                    </div>
                    {group.map((organization) => (
                      <label key={organization.id} className={`org-assign-option ${selected.includes(organization.id) ? "on" : ""}`}>
                        <input
                          type="checkbox"
                          name="organizationIds"
                          value={organization.id}
                          checked={selected.includes(organization.id)}
                          onChange={() => toggle(organization.id)}
                        />
                        <span className="org-assign-option-name">{organization.name}</span>
                        <span className="org-assign-option-code">{organization.code}</span>
                        {alreadyAssigned.has(organization.id) ? <span className="org-assign-tag">assigned</span> : <TypeBadge type={organization.type} />}
                      </label>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="org-form-footer">
          <span className="text-muted" style={{ fontSize: 12 }}>
            {selected.length} selected
          </span>
          <SubmitButton pendingLabel="Assigning…" disabled={!selectedProduct || selected.length === 0}>
            Assign product
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}
