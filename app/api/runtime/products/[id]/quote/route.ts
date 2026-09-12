import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCollection, loadWorkspace } from "@/lib/store";
import { runQuote, type Answers } from "@/lib/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { answers?: Answers; addonCount?: number };
  const session = await getSession();
  const workspace = loadWorkspace(session);
  const product = workspace.products.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const version = product.version;
  const result = runQuote({
    productId: id,
    version,
    answers: body.answers || {},
    addonCount: body.addonCount || 0,
    eligibility: getCollection(workspace, id, version, "eligibilityRules"),
    underwriting: getCollection(workspace, id, version, "underwritingRules"),
    rating: getCollection(workspace, id, version, "ratingComponents"),
    covers: getCollection(workspace, id, version, "covers"),
    documents: getCollection(workspace, id, version, "documents"),
  });
  return NextResponse.json({
    productId: id,
    version,
    status: product.status,
    immutable: product.status === "published",
    ...result,
  });
}
