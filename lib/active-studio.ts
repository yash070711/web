import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadWorkspace } from "@/lib/store";
import { productStudioPath } from "@/lib/nav";

export async function redirectToActiveStudio(studio: string): Promise<never> {
  const session = await getSession();
  const workspace = loadWorkspace(session);
  const id = session.productId || workspace.products[0]?.id;
  if (!id) redirect("/catalogue");
  const product = workspace.products.find((p) => p.id === id) || workspace.products[0];
  redirect(productStudioPath(product.id, studio, product.version));
}
