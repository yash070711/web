"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, patchSession } from "@/lib/session";
import { clone, collectionKey, loadWorkspace, mutateWorkspace, setCollection } from "@/lib/store";
import { productDetailFrom, starterCovers, starterQuestionGroups } from "@/lib/seed";
import { displayDate, nextId, nextVersionLabel, nowIso, todayIso } from "@/lib/format";
import type { Product, ProductDetail, ProductStatus } from "@/lib/types";

async function requireUser() {
  return getSession();
}

export async function setActiveProduct(productId: string, version?: string) {
  const session = await requireUser();
  const workspace = loadWorkspace(session);
  const product = workspace.products.find((p) => p.id === productId);
  await patchSession({
    productId,
    version: version || product?.version || workspace.details[productId]?.activeVersion,
  });
  revalidatePath("/");
}

export async function createProductAction(formData: FormData) {
  const session = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const family = String(formData.get("family") || "").trim();
  const productType = String(formData.get("productType") || "").trim();
  const lineOfBusiness = String(formData.get("lineOfBusiness") || "").trim();
  const businessType = String(formData.get("businessType") || "New").trim() || "New";
  const carrier = String(formData.get("carrier") || "").trim();
  const mga = String(formData.get("mga") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const owner = String(formData.get("owner") || session.name);
  const description = String(formData.get("description") || "").trim();
  const from = String(formData.get("effectiveFrom") || "");
  const to = String(formData.get("effectiveTo") || "");
  const uiStatus = String(formData.get("status") || "Draft");
  const statusMap: Record<string, ProductStatus> = {
    Draft: "draft",
    Active: "published",
    Inactive: "retired",
    Archived: "superseded",
  };
  const status = statusMap[uiStatus] || "draft";
  const selectedStudios = formData.getAll("studios").map((v) => String(v)).filter(Boolean);
  if (!name || !family) redirect("/catalogue?error=" + encodeURIComponent("Name and family are required."));
  const existing = loadWorkspace(session);
  if (existing.products.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) {
    redirect("/catalogue?error=" + encodeURIComponent("A product with this name already exists. Choose a unique name."));
  }
  if (from && to && to < from) {
    redirect("/catalogue?error=" + encodeURIComponent("Effective To must be the same date as Effective From, or later."));
  }
  const preview = loadWorkspace(session);
  const usedVersions = preview.products.flatMap((p) => [p.version, ...((preview.details[p.id]?.versions || []).map((v) => v.label))]).filter(Boolean);
  let version = String(formData.get("version") || "").trim() || nextVersionLabel(usedVersions);
  if (usedVersions.includes(version)) version = nextVersionLabel(usedVersions);
  const usedCodes = new Set(preview.products.map((p) => String(p.code || "").toUpperCase()).filter(Boolean));
  let code = String(formData.get("code") || "").trim();
  if (!code || usedCodes.has(code.toUpperCase())) {
    const prefix = `${(family || "PRD").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "PRD"}-${new Date().getFullYear()}-`;
    let seq = 1;
    code = `${prefix}${String(seq).padStart(3, "0")}`;
    while (usedCodes.has(code.toUpperCase())) {
      seq += 1;
      code = `${prefix}${String(seq).padStart(3, "0")}`;
    }
  }
  const cloneFrom = String(formData.get("cloneFrom") || "");
  const newId = nextId("PRD", preview.products.map((p) => p.id));
  mutateWorkspace(
    session,
    (ws) => {
      const product: Product = {
        id: newId,
        name,
        family,
        version,
        status,
        owner,
        lastModified: displayDate(todayIso()) || todayIso(),
        lastModifiedAt: nowIso(),
        lastModifiedBy: session.name,
        effectiveFrom: displayDate(from),
        effectiveTo: displayDate(to),
        description: description || `${name} draft created in Veridex.`,
        code,
        segment: String(formData.get("segment") || "Personal Lines"),
        productType,
        lineOfBusiness,
        businessType,
        carrier,
        mga,
        jurisdictions: String(formData.get("jurisdictions") || "India")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        enabledStudios: selectedStudios,
        pending: true,
      };
      const detail = productDetailFrom(product);
      detail.enabledStudios = selectedStudios;
      ws.products.unshift(product);
      ws.details[newId] = detail;
      const source = cloneFrom ? ws.products.find((p) => p.id === cloneFrom) : null;
      if (source) {
        Object.keys(ws.collections)
          .filter((k) => k.startsWith(`${source.id}::${source.version}::`))
          .forEach((k) => {
            const colName = k.split("::")[2];
            ws.collections[collectionKey(newId, version, colName)] = clone(ws.collections[k]);
          });
      } else {
        setCollection(ws, newId, version, "covers", starterCovers(family));
        setCollection(ws, newId, version, "questionGroups", starterQuestionGroups(family));
        setCollection(ws, newId, version, "eligibilityRules", []);
        setCollection(ws, newId, version, "ratingComponents", [{ id: "RATE-001", name: "Base premium", type: "base", amount: 300, unit: "per year" }]);
        setCollection(ws, newId, version, "underwritingRules", []);
        setCollection(ws, newId, version, "channels", [{ id: "CHAN-001", name: "Direct (Web)", accessModel: "Open Access", status: "active" }]);
        setCollection(ws, newId, version, "documents", []);
        setCollection(ws, newId, version, "testCases", []);
      }
    },
    { action: "CREATED", page: "catalogue", productId: newId, version, description: `Created ${name}` }
  );
  await patchSession({ productId: newId, version });
  revalidatePath("/catalogue");
  redirect(`/products/${newId}`);
}

export async function cloneProductAction(formData: FormData) {
  const session = await requireUser();
  const sourceId = String(formData.get("sourceId") || "");
  const name = String(formData.get("name") || "").trim();
  mutateWorkspace(
    session,
    (ws) => {
      const source = ws.products.find((p) => p.id === sourceId);
      if (!source) throw new Error("Source product not found");
      const newId = nextId("PRD", ws.products.map((p) => p.id));
      const version = nextVersionLabel([]);
      const product: Product = {
        ...clone(source),
        id: newId,
        name: name || `${source.name} — Copy`,
        version,
        status: "draft",
        owner: session.name,
        lastModified: displayDate(todayIso()) || todayIso(),
        lastModifiedAt: nowIso(),
        lastModifiedBy: session.name,
        sourceProductId: sourceId,
        pending: true,
      };
      ws.products.unshift(product);
      ws.details[newId] = { ...clone(ws.details[sourceId] || productDetailFrom(product)), ...productDetailFrom(product) };
      Object.keys(ws.collections)
        .filter((k) => k.startsWith(`${sourceId}::`))
        .forEach((k) => {
          const parts = k.split("::");
          ws.collections[`${newId}::${version}::${parts[2]}`] = clone(ws.collections[k]);
        });
    },
    { action: "CLONED", page: "catalogue", description: `Cloned ${sourceId}` }
  );
  revalidatePath("/catalogue");
  redirect("/catalogue");
}

export async function deleteProductAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  mutateWorkspace(
    session,
    (ws) => {
      ws.products = ws.products.filter((p) => p.id !== id);
      delete ws.details[id];
      Object.keys(ws.collections)
        .filter((k) => k.startsWith(`${id}::`))
        .forEach((k) => delete ws.collections[k]);
    },
    { action: "DELETED", page: "catalogue", productId: id, description: `Deleted ${id}` }
  );
  revalidatePath("/catalogue");
  redirect("/catalogue");
}

export async function updateProductFieldsAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  const raw = String(formData.get("json") || "");
  mutateWorkspace(
    session,
    (ws) => {
      const parsed = JSON.parse(raw) as Product;
      const index = ws.products.findIndex((p) => p.id === id);
      if (index < 0) throw new Error("Product not found");
      const existing = ws.products[index];
      parsed.id = id;
      const requestedCode = String(parsed.code || "").trim();
      if (requestedCode) {
        const dup = ws.products.some((p) => p.id !== id && String(p.code || "").trim().toUpperCase() === requestedCode.toUpperCase());
        if (dup) throw new Error("A product with this internal code already exists.");
        parsed.code = requestedCode;
      } else {
        parsed.code = existing.code || parsed.code;
      }
      parsed.lastModified = displayDate(todayIso()) || todayIso();
      parsed.lastModifiedAt = nowIso();
      parsed.lastModifiedBy = session.name;
      ws.products[index] = parsed;
      if (ws.details[id]) {
        ws.details[id] = { ...ws.details[id], name: parsed.name, family: parsed.family, owner: parsed.owner, status: parsed.status, description: parsed.description || ws.details[id].description };
      }
    },
    { action: "MODIFIED", page: "product-detail", productId: id, description: `Updated ${id}` }
  );
  revalidatePath(`/products/${id}`);
}

export async function patchProductAction(id: string, patch: Record<string, unknown>) {
  const session = await requireUser();
  mutateWorkspace(
    session,
    (ws) => {
      const product = ws.products.find((p) => p.id === id);
      if (!product) throw new Error("Product not found");
      Object.assign(product, patch, { lastModified: displayDate(todayIso()), lastModifiedAt: nowIso(), lastModifiedBy: session.name });
      if (ws.details[id]) Object.assign(ws.details[id], patch);
    },
    { action: "MODIFIED", page: "product-detail", productId: id, description: `Patched ${id}` }
  );
  revalidatePath(`/products/${id}`);
  revalidatePath("/catalogue");
}

export async function deleteProductFieldAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  const field = String(formData.get("field") || "");
  const locked = new Set(["id", "name", "family", "version", "status"]);
  if (locked.has(field)) return;
  mutateWorkspace(session, (ws) => {
    const product = ws.products.find((p) => p.id === id);
    if (product) delete product[field];
    if (ws.details[id]) delete ws.details[id][field];
  }, { action: "FIELD_DELETED", page: "product-detail", productId: id, description: `Removed field ${field}` });
  revalidatePath(`/products/${id}`);
}

export async function addProductFieldAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  const field = String(formData.get("field") || "").trim();
  const value = String(formData.get("value") || "");
  if (!field) return;
  mutateWorkspace(session, (ws) => {
    const product = ws.products.find((p) => p.id === id);
    if (product) product[field] = value;
  }, { action: "FIELD_ADDED", page: "product-detail", productId: id, description: `Added field ${field}` });
  revalidatePath(`/products/${id}`);
}

export async function setProductStatusAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "draft") as ProductStatus;
  mutateWorkspace(session, (ws) => {
    const product = ws.products.find((p) => p.id === id);
    if (product) product.status = status;
    if (ws.details[id]) ws.details[id].status = status;
  }, { action: status.toUpperCase(), page: "governance", productId: id, description: `Set status to ${status}` });
  revalidatePath(`/products/${id}`);
  revalidatePath("/catalogue");
  revalidatePath("/governance");
}

export async function saveCollectionAction(formData: FormData) {
  const session = await requireUser();
  const productId = String(formData.get("productId") || "");
  const version = String(formData.get("version") || "");
  const collection = String(formData.get("collection") || "");
  const json = String(formData.get("json") || "[]");
  mutateWorkspace(
    session,
    (ws) => {
      setCollection(ws, productId, version, collection, JSON.parse(json));
    },
    { action: "MODIFIED", page: collection, productId, version, description: `Saved ${collection}` }
  );
  revalidatePath("/");
}

export async function saveDetailAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  const json = String(formData.get("json") || "{}");
  mutateWorkspace(session, (ws) => {
    ws.details[id] = JSON.parse(json) as ProductDetail;
  }, { action: "MODIFIED", page: "product-detail", productId: id, description: `Saved product detail ${id}` });
  revalidatePath(`/products/${id}`);
}

export async function createVersionAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  const from = String(formData.get("effectiveFrom") || "");
  const to = String(formData.get("effectiveTo") || "");
  mutateWorkspace(session, (ws) => {
    const detail = ws.details[id];
    const product = ws.products.find((p) => p.id === id);
    if (!detail || !product) throw new Error("Product not found");
    const label = nextVersionLabel(detail.versions.map((v) => v.label));
    const source = product.version;
    detail.versions.unshift({
      label,
      status: "draft",
      from: displayDate(from),
      to: displayDate(to),
      by: session.name,
      on: displayDate(todayIso()) || todayIso(),
      gates: 0,
      sim: "Not Run",
    });
    detail.activeVersion = label;
    detail.status = "draft";
    product.version = label;
    product.status = "draft";
    Object.keys(ws.collections)
      .filter((k) => k.startsWith(`${id}::${source}::`))
      .forEach((k) => {
        const name = k.split("::")[2];
        ws.collections[collectionKey(id, label, name)] = clone(ws.collections[k]);
      });
  }, { action: "CREATED", page: "product-detail", productId: id, description: "Created a new draft version" });
  const workspace = loadWorkspace(session);
  const version = workspace.products.find((p) => p.id === id)?.version;
  if (version) await patchSession({ productId: id, version });
  revalidatePath("/");
  const returnTo = String(formData.get("returnTo") || "");
  if (returnTo.startsWith("/")) redirect(returnTo);
}

export async function decideGateAction(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") || "");
  const index = Number(formData.get("index") || 0);
  const action = String(formData.get("action") || "Approved");
  const comment = String(formData.get("comment") || "");
  mutateWorkspace(session, (ws) => {
    const gate = ws.details[id]?.governance[index];
    if (!gate) return;
    gate.action = action;
    gate.comment = comment || gate.comment;
    gate.approver = session.name;
    gate.date = displayDate(todayIso()) || todayIso();
  }, { action: action.toUpperCase(), page: "governance", productId: id, description: `${action} gate` });
  revalidatePath("/governance");
  revalidatePath(`/products/${id}`);
}

export async function saveQuoteAction(formData: FormData) {
  const session = await requireUser();
  const productId = String(formData.get("productId") || "");
  const version = String(formData.get("version") || "");
  const premium = Number(formData.get("premium") || 0);
  const status = String(formData.get("status") || "quoted");
  mutateWorkspace(session, (ws) => {
    ws.quotes.unshift({
      id: `QTE-${Date.now()}`,
      productId,
      version,
      premium,
      status,
      answers: JSON.parse(String(formData.get("answers") || "{}")),
      at: nowIso(),
    });
  }, { action: "QUOTED", page: "customer-view", productId, version, description: `${status} quote ${premium}` });
  revalidatePath(`/products/${productId}/view`);
}

export async function saveListAction(kind: "team" | "pricing" | "glossary" | "webhooks", json: string) {
  const session = await requireUser();
  mutateWorkspace(session, (ws) => {
    (ws as unknown as Record<string, unknown>)[kind] = JSON.parse(json);
  }, { action: "MODIFIED", page: kind, description: `Updated ${kind}` });
  revalidatePath("/");
}
