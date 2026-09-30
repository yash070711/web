'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCatalogue from './ProductCatalogue';

export default function ProductCatalogueContainer({ products }) {
  const [deletedIds, setDeletedIds] = useState([]);
  const router = useRouter();
  async function handleDeleteProduct(product) {
    const response = await fetch('/api/products/' + encodeURIComponent(product.id), { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to delete product. Please try again.');
    }
    setDeletedIds(current => [...current, product.id]);
    router.refresh();
  }
  return <ProductCatalogue products={products.filter(product => !deletedIds.includes(product.id))} onDelete={handleDeleteProduct}/>;
}
