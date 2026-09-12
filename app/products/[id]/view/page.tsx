import { HtmlAppPage } from "@/components/HtmlAppPage";
import { HTML_PAGES } from "@/lib/html-pages";

export default async function ProductViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version } = await searchParams;
  return <HtmlAppPage file={HTML_PAGES["product-view"]} productId={id} version={version} />;
}
