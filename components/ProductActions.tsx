"use client";

import { useState } from "react";
import { cloneProductAction, deleteProductAction } from "@/app/actions/products";
import type { Product } from "@/lib/types";

export { NewProductWizard as NewProductForm } from "./NewProductWizard";

export function CloneButton({
  product,
  className = "btn btn-ghost btn-sm",
  children,
}: {
  product: Product;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button className={className} type="button" onClick={() => setOpen(true)}>
        {children || "Clone"}
      </button>
    );
  }
  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <form action={cloneProductAction}>
          <input type="hidden" name="sourceId" value={product.id} />
          <div className="modal-header"><h2 className="modal-title">Clone {product.name}</h2></div>
          <div className="modal-body">
            <label className="form-label">New name</label>
            <input className="form-control" name="name" defaultValue={`${product.name} — Copy`} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary">Clone</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteButton({ id, name, className = "btn btn-ghost btn-sm text-danger" }: { id: string; name: string; className?: string }) {
  return (
    <form action={deleteProductAction} onSubmit={(e) => { if (!confirm(`Delete ${name}? This cannot be undone.`)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className={className} type="submit">Delete</button>
    </form>
  );
}
