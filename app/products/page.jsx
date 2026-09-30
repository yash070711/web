import ProductCatalogueContainer from '../../src/components/ProductCatalogueContainer';
import { readProducts } from '../../src/lib/product-store';
export const dynamic = 'force-dynamic';
export default async function Products() {
  return <ProductCatalogueContainer products={await readProducts()}/>;
}
