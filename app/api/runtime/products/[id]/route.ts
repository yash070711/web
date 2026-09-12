import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCollection, loadWorkspace, mutateWorkspace } from "@/lib/store";
import { displayDate, nowIso, todayIso } from "@/lib/format";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const workspace = loadWorkspace(session);
  const product = workspace.products.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const version = product.version;
  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
      family: product.family,
      version,
      status: product.status,
      description: product.description,
      segment: product.segment,
      jurisdictions: product.jurisdictions,
    },
    covers: getCollection(workspace, id, version, "covers"),
    questions: getCollection(workspace, id, version, "questionGroups"),
    eligibility: getCollection(workspace, id, version, "eligibilityRules"),
    rating: getCollection(workspace, id, version, "ratingComponents"),
    underwriting: getCollection(workspace, id, version, "underwritingRules"),
    channels: getCollection(workspace, id, version, "channels"),
    documents: getCollection(workspace, id, version, "documents"),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const allowed = ["name", "family", "owner", "description", "segment", "code", "jurisdictions"] as const;
  const cleaned: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) cleaned[key] = body[key];
  }
  if (typeof cleaned.name === "string" && !String(cleaned.name).trim()) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }
  try {
    mutateWorkspace(
      session,
      (ws) => {
        const product = ws.products.find((p) => p.id === id);
        if (!product) throw new Error("Product not found");
        Object.assign(product, cleaned, {
          lastModified: displayDate(todayIso()) || todayIso(),
          lastModifiedAt: nowIso(),
          lastModifiedBy: session.name,
        });
        if (ws.details[id]) Object.assign(ws.details[id], cleaned);
      },
      { action: "MODIFIED", page: "product-detail", productId: id, description: `Updated ${id}` }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message === "Product not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ ok: true, id });
}
