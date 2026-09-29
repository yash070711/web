"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { removeProductAssignmentAction } from "@/app/actions/organizations";
import type { Organization } from "@/lib/types";
import { Icon } from "./icons";

export function AssignedProducts({
  organization,
  returnTo,
}: {
  organization: Organization;
  returnTo: string;
}) {
  const [removing, startRemove] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const assignments = organization.assignedProducts || [];

  function remove(productId: string, productName: string) {
    if (!window.confirm(`Remove "${productName}" from ${organization.name}?`)) return;
    setPendingId(productId);
    const fd = new FormData();
    fd.set("organizationId", organization.id);
    fd.set("productId", productId);
    fd.set("returnTo", returnTo);
    startRemove(() => removeProductAssignmentAction(fd));
  }

  if (!assignments.length) {
    return (
      <div className="org-empty">
        <Icon name="link" size={22} />
        <p>No products assigned yet.</p>
        <Link className="btn btn-secondary btn-sm" href="/admin/organizations#assign-products">Assign products</Link>
      </div>
    );
  }

  return (
    <ul className="org-assigned-list">
      {assignments.map((assignment) => (
        <li key={assignment.productId} className="org-assigned-item">
          <div className="org-assigned-main">
            <div className="org-assigned-name">{assignment.productName}</div>
            <div className="org-assigned-meta">
              <span className="text-mono">{assignment.productId}</span>
              <span>· {assignment.role || "—"}</span>
              <span>· since {assignment.since}</span>
            </div>
          </div>
          <span className={`org-status-badge ${assignment.status === "active" ? "on" : "off"}`}>{assignment.status}</span>
          <button
            className="org-icon-btn danger"
            type="button"
            title="Remove assignment"
            disabled={removing && pendingId === assignment.productId}
            onClick={() => remove(assignment.productId, assignment.productName)}
          >
            <Icon name="trash" />
          </button>
        </li>
      ))}
    </ul>
  );
}
