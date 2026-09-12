import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCollection, loadWorkspace } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  const workspace = loadWorkspace(session);
  const products = workspace.products
    .filter((p) => p.status === "published" || p.status === "approved" || p.status === "draft")
    .map((p) => ({
      id: p.id,
      name: p.name,
      family: p.family,
      version: p.version,
      status: p.status,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo,
      segment: p.segment,
      jurisdictions: p.jurisdictions,
    }));
  return NextResponse.json({ products, source: "authoring-registry" });
}
