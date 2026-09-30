import { readProducts } from '../../../../src/lib/product-store';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
import CoverageConfigure from '../../../../src/components/CoverageConfigure';

export default async function CoveragePage({ params }) {
  const { id } = await params;
  const product = (await readProducts()).find(p => p.id === id);
  if (!product) notFound();
  return <CoverageConfigure product={product} />;
}
