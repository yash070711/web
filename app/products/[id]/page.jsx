import { readProducts } from '../../../src/lib/product-store';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
import ProductOverview from '../../../src/components/ProductOverview';

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = (await readProducts()).find(p => p.id === id);
  if (!product) notFound();

  return <ProductOverview product={product} />;
}
