'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ProductCatalogue({ products, onDelete }) {
  const [query, setQuery] = useState('');
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const rows = products.filter(product =>
    [product.name, product.productId || product.id, product.lineOfBusiness, product.status]
      .join(' ')
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  const metrics = [
    ['Total Products', products.length],
    ...['Published', 'Draft', 'Needs Review'].map(status => [
      status,
      products.filter(product => product.status === status).length
    ])
  ];

  const openDeleteDialog = product => {
    setDeleteProduct(product);
    setDeleteError('');
    setDeleteName('');
  };

  const closeDeleteDialog = () => {
    if (deleting) return;

    setDeleteProduct(null);
    setDeleteName('');
  };

  const confirmDelete = async () => {
    if (!deleteProduct || deleting) return;

    if (deleteName !== deleteProduct.name) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');

      /*
       * The parent onDelete callback should permanently remove
       * the product from your database/product store.
       */
      if (!onDelete) throw new Error('Product deletion is unavailable. Please reload and try again.');
      await onDelete(deleteProduct);

      setDeleteProduct(null);
      setDeleteName('');
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="breadcrumb">
        Product Studio / Product Catalogue
      </div>

      <div className="page-header">
        <div>
          <div className="eyebrow">Product Studio</div>

          <h1>Product Catalogue</h1>

          <p>
            Manage commercial insurance products and their configuration
            versions.
          </p>
        </div>

        <div className="tools">
          <button
            className="btn"
            disabled
            title="Product import is not yet configured"
          >
            Import
          </button>

          <Link
            className="btn primary"
            href="/products/new"
          >
            + Create Product
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <section
        className="metrics"
        aria-label="Product metrics"
      >
        {metrics.map(([label, count]) => (
          <div
            className="card"
            key={label}
          >
            <div className="metric-label">
              {label}
            </div>

            <div className="metric-num">
              {count}
            </div>
          </div>
        ))}
      </section>

      {/* Product table */}
      <section className="card">

        <div className="card-header">
          <div>
            <div className="section-label">
              Product Studio
            </div>

            <div className="card-title">
              Products
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="toolbar">
          <input
            className="search"
            type="search"
            aria-label="Search products"
            placeholder="Search Products..."
            value={query}
            onChange={event =>
              setQuery(event.target.value)
            }
          />
        </div>

        <div className="tbl-wrap">

          <table className="tbl">

            <thead>
              <tr>
                {[
                  'Product',
                  'Product ID',
                  'Line of Business',
                  'Version',
                  'Status',
                  'Effective Date',
                  'Actions'
                ].map(label => (
                  <th
                    scope="col"
                    key={label}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {rows.map(product => (

                <tr key={product.id}>

                  {/* Product */}
                  <td>
                    {product.href ? (
                      <Link href={product.href}>
                        <strong>
                          {product.name}
                        </strong>
                      </Link>
                    ) : (
                      <strong>
                        {product.name}
                      </strong>
                    )}
                  </td>

                  {/* Product ID */}
                  <td>
                    {product.productId || product.id}
                  </td>

                  {/* LOB */}
                  <td>
                    {product.lineOfBusiness}
                  </td>

                  {/* Version */}
                  <td>
                    {product.version}
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={
                        'badge ' +
                        (
                          product.status === 'Published'
                            ? 'live'
                            : product.status === 'Draft'
                              ? 'draft'
                              : 'info'
                        )
                      }
                    >
                      {product.status}
                    </span>
                  </td>

                  {/* Effective Date */}
                  <td>
                    {product.effectiveDate}
                  </td>

                  {/* Actions */}
                  <td>

                    <div className="product-actions">

                      {/* Open */}
                      {product.href ? (
                        <Link
                          className="icon-btn"
                          href={product.href}
                          aria-label={`Open ${product.name}`}
                          title="Open"
                        >

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                          >
                            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

                            <circle
                              cx="12"
                              cy="12"
                              r="2.5"
                            />
                          </svg>

                        </Link>
                      ) : (
                        <span className="card-subtitle">
                          Saved
                        </span>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        className="icon-btn delete"
                        onClick={() =>
                          openDeleteDialog(product)
                        }
                        aria-label={`Delete ${product.name}`}
                        title="Delete"
                      >

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path d="M4 7h16" />

                          <path d="M9 7V4h6v3" />

                          <path d="M7 7l1 13h8l1-13" />

                          <path d="M10 11v5M14 11v5" />
                        </svg>

                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {/* No results */}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    No products match your search.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        <div
          className="card-subtitle"
          role="status"
        >
          {rows.length} of {products.length} products
        </div>

      </section>

      {/* Footer */}
      <div className="footer">
        <span>
          VeriDex Product Studio
        </span>

        <span>
          Product Catalogue
        </span>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteProduct && (

        <div
          className="delete-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >

          <div className="delete-modal">

            {/* Delete icon */}
            <div className="delete-modal-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 7h16" />

                <path d="M9 7V4h6v3" />

                <path d="M7 7l1 13h8l1-13" />

                <path d="M10 11v5M14 11v5" />
              </svg>

            </div>

            <h2 id="delete-product-title">
              Delete product?
            </h2>

            <p>
              You are about to permanently delete:
            </p>

            <div className="delete-product-name">
              {deleteProduct.name}
            </div>

            <p className="delete-warning">
              This action cannot be undone.
            </p>

            <label
              className="delete-confirm-label"
              htmlFor="delete-confirm-input"
            >
              Type the product name to confirm:
            </label>

            <input
              id="delete-confirm-input"
              className="delete-confirm-input"
              type="text"
              value={deleteName}
              onChange={event =>
                setDeleteName(event.target.value)
              }
              placeholder={deleteProduct.name}
              autoFocus
              disabled={deleting}
            />

            <div className="delete-confirm-hint">
              Enter exactly:
              <strong>
                {deleteProduct.name}
              </strong>
            </div>

            {deleteError && <p className="delete-warning" role="alert">{deleteError}</p>}

            <div className="delete-modal-actions">

              <button
                type="button"
                className="btn"
                onClick={closeDeleteDialog}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn danger"
                disabled={
                  deleteName !== deleteProduct.name ||
                  deleting
                }
                onClick={confirmDelete}
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete permanently'}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* Component CSS */}
      <style jsx>{`

        .product-actions {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: auto;
          height: auto;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;
          max-width: 32px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          padding: 0;
          margin: 0;

          border: 1px solid #d8dee7;
          border-radius: 6px;

          background: #ffffff;
          color: #536273;

          cursor: pointer;
          text-decoration: none;

          line-height: 1;
        }

        .icon-btn svg {
          width: 16px;
          height: 16px;
          min-width: 16px;
          max-width: 16px;
          min-height: 16px;
          max-height: 16px;

          display: block;
          flex: 0 0 16px;

          margin: 0;
          padding: 0;
        }

        .icon-btn:hover {
          background: #f4f6f8;
          border-color: #c7ced8;
          color: #172033;
        }

        .icon-btn.delete {
          color: #b42318;
          border-color: #efd0cd;
        }

        .icon-btn.delete:hover {
          background: #fff1f0;
          border-color: #e5aaa5;
          color: #d92d20;
        }

        .tbl td:last-child {
          width: 100px;
          min-width: 100px;
          white-space: nowrap;
        }

        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background: rgba(15, 23, 42, 0.48);
        }

        .delete-modal {
          width: min(460px, 100%);

          background: #ffffff;

          border: 1px solid #e2e5ea;
          border-radius: 12px;

          padding: 26px;

          box-shadow:
            0 24px 70px rgba(15, 23, 42, 0.25);
        }

        .delete-modal-icon {
          width: 44px;
          height: 44px;

          display: grid;
          place-items: center;

          border-radius: 50%;

          background: #fff1f0;
          color: #b42318;

          margin-bottom: 16px;
        }

        .delete-modal-icon svg {
          width: 21px;
          height: 21px;
        }

        .delete-modal h2 {
          margin: 0 0 8px;

          font-size: 19px;
          line-height: 1.3;

          color: #172033;
        }

        .delete-modal p {
          margin: 6px 0;

          color: #667085;
          font-size: 13px;
        }

        .delete-product-name {
          display: block;

          margin: 12px 0;

          padding: 11px 13px;

          border-radius: 6px;

          background: #f5f6f8;

          color: #172033;

          font-size: 14px;
          font-weight: 700;

          word-break: break-word;
        }

        .delete-warning {
          color: #b42318 !important;
          font-weight: 600;
        }

        .delete-confirm-label {
          display: block;

          margin-top: 20px;
          margin-bottom: 7px;

          color: #344054;

          font-size: 12px;
          font-weight: 600;
        }

        .delete-confirm-input {
          width: 100%;
          height: 42px;

          padding: 0 11px;

          border: 1px solid #d0d5dd;
          border-radius: 6px;

          outline: none;

          color: #172033;
          background: #ffffff;

          font-size: 13px;
        }

        .delete-confirm-input:focus {
          border-color: #667085;

          box-shadow:
            0 0 0 3px rgba(102, 112, 133, 0.1);
        }

        .delete-confirm-input:disabled {
          background: #f5f6f8;
          cursor: not-allowed;
        }

        .delete-confirm-hint {
          margin-top: 7px;

          color: #667085;

          font-size: 11px;
        }

        .delete-confirm-hint strong {
          margin-left: 4px;

          color: #344054;
        }

        .delete-modal-actions {
          display: flex;

          justify-content: flex-end;

          gap: 8px;

          margin-top: 22px;
        }

        .delete-modal-actions .btn {
          min-height: 38px;
        }

        .btn.danger {
          background: #b42318;
          border-color: #b42318;
          color: #ffffff;
        }

        .btn.danger:hover:not(:disabled) {
          background: #912018;
          border-color: #912018;
        }

        .btn.danger:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .delete-modal {
            padding: 20px;
          }

          .delete-modal-actions {
            flex-direction: column-reverse;
          }

          .delete-modal-actions .btn {
            width: 100%;
          }
        }

      `}</style>
    </>
  );
}