"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, patchSession, setSession, verifyPassword } from "@/lib/session";
import { loadWorkspace, mutateWorkspace } from "@/lib/store";
import { nowIso } from "@/lib/format";
import type {
  Organization,
  OrganizationConfig,
  OrganizationStatus,
  OrganizationType,
  ProductAssignment,
} from "@/lib/types";
import {
  DEFAULT_PARENT_COMPANY_ID,
  isOrganizationType,
  ORG_STATUSES,
  PARENT_COMPANY_ADMIN_ROLE,
} from "@/lib/organizations";
import { orgConfigFields, orgConfigFieldsWithAuthority } from "@/lib/org-fields";

const LIST_PATH = "/admin/organizations";

async function requireParentAdmin() {
  const session = await getSession();
  const parentCompanyId = session.parentCompanyId || DEFAULT_PARENT_COMPANY_ID;
  if (session.context !== "parent" && session.role !== PARENT_COMPANY_ADMIN_ROLE) {
    redirect(LIST_PATH);
  }
  return { session, parentCompanyId };
}

function str(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function list(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function withParam(base: string, params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) q.set(key, value);
  }
  const query = q.toString();
  return query ? `${base}?${query}` : base;
}

function normalizeStatus(value: string): OrganizationStatus {
  return ORG_STATUSES.includes(value as OrganizationStatus) ? (value as OrganizationStatus) : "active";
}

function codeBase(name: string) {
  const letters = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "ORG").padEnd(3, "X");
}

function uniqueCode(name: string, used: Set<string>) {
  const base = codeBase(name);
  if (!used.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}${String(Date.now()).slice(-4)}`;
}

function parseFile(value: FormDataEntryValue | null) {
  if (value && typeof value !== "string" && "name" in value) return value.name;
  return str(value);
}

function parseStudioPermissions(formData: FormData) {
  const result: Record<string, string[]> = {};
  for (const entry of formData.getAll("studioPermissions")) {
    const [studio, permission] = String(entry).split(":");
    if (!studio || !permission) continue;
    (result[studio] ||= []).push(permission);
  }
  return result;
}

function parseConfig(
  type: OrganizationType,
  formData: FormData,
  existing: OrganizationConfig
): OrganizationConfig {
  const next: OrganizationConfig = { ...existing };
  for (const field of orgConfigFieldsWithAuthority(type)) {
    if (field.bind || field.type === "readonly" || field.type === "assigned-products" || field.type === "audit-history") {
      continue;
    }
    if (field.type === "studio-permissions") {
      next[field.key] = parseStudioPermissions(formData);
    } else if (field.type === "list" || field.type === "multiselect") {
      const raw = field.type === "multiselect" ? formData.getAll(field.key).map((v) => str(v)).filter(Boolean) : list(str(formData.get(field.key)));
      next[field.key] = [...new Set(raw)];
    } else if (field.type === "checkbox") {
      next[field.key] = formData.get(field.key) === "on";
    } else if (field.type === "file") {
      next[field.key] = parseFile(formData.get(field.key));
    } else {
      next[field.key] = str(formData.get(field.key));
    }
  }
  return next;
}

function parsedProductAssignments(
  existing: ProductAssignment[],
  productIds: string[],
  products: { id: string; name: string }[]
): ProductAssignment[] {
  const prev = new Map(existing.map((a) => [a.productId, a]));
  const names = new Map(products.map((p) => [p.id, p.name]));
  return productIds.map((productId) => {
    const prior = prev.get(productId);
    if (prior) return prior;
    return {
      productId,
      productName: names.get(productId) || productId,
      role: "Distributor",
      status: "active",
      since: nowIso().slice(0, 10),
    };
  });
}

function validateConfig(type: OrganizationType, formData: FormData) {
  for (const field of orgConfigFields(type)) {
    if (!field.required || field.type === "readonly") continue;
    const name = field.bind || field.key;
    if (field.type === "multiselect") {
      if (!formData.getAll(name).length) return `${field.label} is required.`;
      continue;
    }
    if (!str(formData.get(name))) return `${field.label} is required.`;
  }
  return "";
}

export async function parentSignInAction(formData: FormData) {
  const email = str(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") || "");
  const session = await getSession();
  const workspace = loadWorkspace(session);

  if (email && password) {
    const parent = workspace.parentCompanies.find((p) =>
      p.users.some((u) => u.email.toLowerCase() === email)
    );
    const user = parent?.users.find((u) => u.email.toLowerCase() === email);
    if (parent && user && user.passwordHash && verifyPassword(password, user.passwordHash)) {
      await patchSession({
        context: "parent",
        parentCompanyId: parent.id,
        name: user.name,
        role: user.role || PARENT_COMPANY_ADMIN_ROLE,
      });
      mutateWorkspace(session, () => undefined, {
        action: "SIGNED_IN",
        page: "organizations",
        description: `${user.name} signed in to ${parent.name} console`,
      });
      revalidatePath(LIST_PATH);
      redirect(LIST_PATH);
    }
  }

  revalidatePath(LIST_PATH);
  redirect(withParam(LIST_PATH, { error: "Invalid email or password. Use the demo credentials below." }));
}

export async function parentSignOutAction() {
  const session = await getSession();
  const next = { ...session };
  delete next.context;
  delete next.parentCompanyId;
  next.role = "Product Manager";
  await setSession(next);
  revalidatePath("/");
  redirect(LIST_PATH);
}

export async function saveOrganizationAction(formData: FormData) {
  const { session, parentCompanyId } = await requireParentAdmin();
  const id = str(formData.get("id"));
  const returnTo = id ? `${LIST_PATH}/${id}/edit` : `${LIST_PATH}/new`;

  const name = str(formData.get("name"));
  const typeRaw = str(formData.get("type"));

  if (!name) redirect(withParam(returnTo, { error: "Organization name is required." }));
  if (!isOrganizationType(typeRaw)) redirect(withParam(returnTo, { error: "Select a valid organization type." }));

  const type = typeRaw as OrganizationType;
  const workspace = loadWorkspace(session);
  const existing = id ? workspace.organizations.find((o) => o.id === id) : undefined;
  const usedCodes = new Set(
    workspace.organizations.filter((o) => o.id !== id).map((o) => o.code.trim().toUpperCase())
  );
  const code = existing?.code || uniqueCode(name, usedCodes);

  const configError = validateConfig(type, formData);
  if (configError) redirect(withParam(returnTo, { error: configError }));
  const config = parseConfig(type, formData, existing?.config || {});

  const assignInitialized = formData.get("assignProductsInitialized") === "1";
  const assignedProductIds = assignInitialized
    ? formData.getAll("assignedProductIds").map((v) => str(v)).filter(Boolean)
    : null;

  const base = {
    name,
    code,
    legalName: str(formData.get("legalName")) || name,
    type,
    status: normalizeStatus(str(formData.get("status")) || "active"),
    parentCompanyId,
    contact: {
      name: str(formData.get("contactName")),
      email: str(formData.get("contactEmail")),
      phone: str(formData.get("contactPhone")),
    },
    address: str(formData.get("address")),
    notes: str(formData.get("notes")),
    config,
    updatedAt: nowIso(),
  };

  let targetId = id;
  mutateWorkspace(
    session,
    (ws) => {
      const index = ws.organizations.findIndex((o) => o.id === id);
      if (index >= 0) {
        ws.organizations[index] = { ...ws.organizations[index], ...base };
        if (assignedProductIds !== null) {
          ws.organizations[index].assignedProducts = parsedProductAssignments(
            ws.organizations[index].assignedProducts || [],
            assignedProductIds,
            ws.products
          );
        }
      } else {
        const nextNumber =
          ws.organizations.reduce((max, o) => Math.max(max, Number(o.id.replace(/\D/g, "")) || 0), 0) + 1;
        targetId = `ORG-${String(nextNumber).padStart(3, "0")}`;
        const organization: Organization = {
          id: targetId,
          ...base,
          assignedProducts: assignedProductIds !== null
            ? parsedProductAssignments([], assignedProductIds, ws.products)
            : [],
          createdAt: nowIso(),
        };
        ws.organizations.push(organization);
        const parent = ws.parentCompanies.find((p) => p.id === parentCompanyId);
        if (parent && !parent.organizationIds.includes(targetId)) parent.organizationIds.push(targetId);
      }
    },
    {
      action: id ? "MODIFIED" : "CREATED",
      page: "organizations",
      description: `${id ? "Updated" : "Created"} organization ${targetId} — ${name}`,
    }
  );

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${targetId}`);
  redirect(withParam(`${LIST_PATH}/${targetId}`, { ok: id ? "Organization updated." : "Organization created." }));
}

export async function setOrganizationStatusAction(formData: FormData) {
  const { session } = await requireParentAdmin();
  const id = str(formData.get("id"));
  const status = normalizeStatus(str(formData.get("status")));
  const returnTo = str(formData.get("returnTo")) || `${LIST_PATH}/${id}`;
  mutateWorkspace(
    session,
    (ws) => {
      const organization = ws.organizations.find((o) => o.id === id);
      if (organization) {
        organization.status = status;
        organization.updatedAt = nowIso();
      }
    },
    {
      action: status === "active" ? "ACTIVATED" : "DEACTIVATED",
      page: "organizations",
      description: `${status === "active" ? "Activated" : "Deactivated"} organization ${id}`,
    }
  );
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  redirect(withParam(returnTo, { ok: `Organization ${status === "active" ? "activated" : "deactivated"}.` }));
}

export async function deleteOrganizationAction(formData: FormData) {
  const { session } = await requireParentAdmin();
  const id = str(formData.get("id"));
  mutateWorkspace(
    session,
    (ws) => {
      ws.organizations = ws.organizations.filter((o) => o.id !== id);
      ws.parentCompanies.forEach((parent) => {
        parent.organizationIds = parent.organizationIds.filter((orgId) => orgId !== id);
      });
    },
    { action: "DELETED", page: "organizations", description: `Deleted organization ${id}` }
  );
  revalidatePath(LIST_PATH);
  redirect(withParam(LIST_PATH, { ok: "Organization deleted." }));
}

export async function assignProductAction(formData: FormData) {
  const { session } = await requireParentAdmin();
  const productId = str(formData.get("productId"));
  const organizationIds = formData.getAll("organizationIds").map((v) => String(v));
  const role = str(formData.get("role"));
  const status = normalizeStatus(str(formData.get("status")) || "active");
  const returnTo = str(formData.get("returnTo")) || LIST_PATH;

  if (!productId) redirect(withParam(returnTo, { error: "Select a product to assign." }));
  if (!organizationIds.length) redirect(withParam(returnTo, { error: "Select at least one organization." }));

  mutateWorkspace(
    session,
    (ws) => {
      const product = ws.products.find((p) => p.id === productId);
      if (!product) return;
      const since = nowIso().slice(0, 10);
      for (const organizationId of organizationIds) {
        const organization = ws.organizations.find((o) => o.id === organizationId);
        if (!organization) continue;
        const assignment: ProductAssignment = {
          productId: product.id,
          productName: product.name,
          role: role || "Distributor",
          status,
          since,
        };
        const index = organization.assignedProducts.findIndex((a) => a.productId === product.id);
        if (index >= 0) organization.assignedProducts[index] = assignment;
        else organization.assignedProducts.push(assignment);
        organization.updatedAt = nowIso();
      }
    },
    {
      action: "ASSIGNED",
      page: "organizations",
      description: `Assigned product ${productId} to ${organizationIds.join(", ")}`,
    }
  );
  revalidatePath(LIST_PATH);
  for (const organizationId of organizationIds) revalidatePath(`${LIST_PATH}/${organizationId}`);
  redirect(withParam(returnTo, { ok: "Product assigned to the selected organizations." }));
}

export async function removeProductAssignmentAction(formData: FormData) {
  const { session } = await requireParentAdmin();
  const organizationId = str(formData.get("organizationId"));
  const productId = str(formData.get("productId"));
  const returnTo = str(formData.get("returnTo")) || `${LIST_PATH}/${organizationId}`;
  mutateWorkspace(
    session,
    (ws) => {
      const organization = ws.organizations.find((o) => o.id === organizationId);
      if (organization) {
        organization.assignedProducts = organization.assignedProducts.filter((a) => a.productId !== productId);
        organization.updatedAt = nowIso();
      }
    },
    {
      action: "UNASSIGNED",
      page: "organizations",
      description: `Removed product ${productId} from ${organizationId}`,
    }
  );
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${organizationId}`);
  redirect(withParam(returnTo, { ok: "Product assignment removed." }));
}
