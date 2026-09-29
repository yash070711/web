import { orgTypeMeta } from "@/lib/organizations";
import type { OrganizationStatus, OrganizationType } from "@/lib/types";

export function TypeBadge({ type }: { type: OrganizationType }) {
  const meta = orgTypeMeta(type);
  return (
    <span className={`org-type-badge ${meta.className}`}>
      <span className="org-type-dot" style={{ background: meta.color }} />
      {meta.singular}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrganizationStatus }) {
  return <span className={`org-status-badge ${status === "active" ? "on" : "off"}`}>{status}</span>;
}
