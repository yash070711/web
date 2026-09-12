import { notFound } from "next/navigation";
import { HtmlAppPage } from "@/components/HtmlAppPage";
import { STUDIO_HTML } from "@/lib/html-pages";

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; studio: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id, studio } = await params;
  const { version } = await searchParams;
  const file = STUDIO_HTML[studio];
  if (!file) notFound();
  return <HtmlAppPage file={file} productId={id} version={version} />;
}
