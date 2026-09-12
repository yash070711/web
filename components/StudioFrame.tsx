import { TRUCK_ID, TRUCK_VERSION } from "@/lib/truck-demo";
import { getSession } from "@/lib/session";
import { loadWorkspace } from "@/lib/store";
import { Shell } from "./Shell";

export async function StudioFrame({
  active,
  crumbs,
  children,
}: {
  active: string;
  crumbs: { label: string; href: string }[];
  children: React.ReactNode;
}) {
  const session = await getSession();
  const workspace = loadWorkspace(session);
  const productId = session.productId || TRUCK_ID || workspace.products[0]?.id;
  const version = session.version || TRUCK_VERSION || workspace.products.find((p) => p.id === productId)?.version;
  return (
    <Shell user={session} active={active} crumbs={crumbs} productId={productId} version={version}>
      {children}
    </Shell>
  );
}

export async function studioContext() {
  const session = await getSession();
  const workspace = loadWorkspace(session);
  const productId = session.productId || TRUCK_ID;
  const product = workspace.products.find((p) => p.id === productId) || workspace.products.find((p) => p.id === TRUCK_ID) || workspace.products[0];
  const version = session.version || product?.version || TRUCK_VERSION;
  return { session, workspace, product, productId: product?.id || "", version };
}
