"use client";

import { useState, useTransition } from "react";
import {
  addProductFieldAction,
  createVersionAction,
  saveDetailAction,
  setProductStatusAction,
  updateProductFieldsAction,
} from "@/app/actions/products";
import { JsonToggleEditor } from "./FieldEditor";
import type { Product, ProductDetail } from "@/lib/types";

export function ProductEditor({ product, detail }: { product: Product; detail: ProductDetail }) {
  const [prod, setProd] = useState(product);
  const [det, setDet] = useState(detail);
  const [pending, start] = useTransition();

  return (
    <div id="editor" className="layout-cols layout-8-4">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Product fields</div>
            <div className="card-subtitle">Edit any value. Add a field. Delete a field. Then save.</div>
          </div>
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", product.id);
              fd.set("json", JSON.stringify(prod));
              start(() => updateProductFieldsAction(fd));
            }}
          >
            {pending ? "Saving…" : "Save product"}
          </button>
        </div>
        <div className="card-body">
          <JsonToggleEditor value={prod} onChange={(v) => setProd(v as Product)} />
        </div>
      </div>
      <div>
        <div className="card mb-4">
          <div className="card-header"><div className="card-title">Lifecycle</div></div>
          <div className="card-body">
            <form action={setProductStatusAction} className="flex gap-2">
              <input type="hidden" name="id" value={product.id} />
              <select className="form-control" name="status" defaultValue={product.status}>
                {["draft", "review", "approved", "published", "superseded", "retired"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button className="btn btn-secondary">Update</button>
            </form>
            <form action={createVersionAction} className="mt-4">
              <input type="hidden" name="id" value={product.id} />
              <label className="form-label">New version effective from</label>
              <input className="form-control mb-4" type="date" name="effectiveFrom" />
              <label className="form-label">Effective to</label>
              <input className="form-control mb-4" type="date" name="effectiveTo" />
              <button className="btn btn-primary" type="submit">Create draft version</button>
            </form>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Add a custom field</div></div>
          <div className="card-body">
            <form action={addProductFieldAction}>
              <input type="hidden" name="id" value={product.id} />
              <input className="form-control mb-4" name="field" placeholder="field name" />
              <input className="form-control mb-4" name="value" placeholder="value" />
              <button className="btn btn-secondary">Add field</button>
            </form>
          </div>
        </div>
      </div>
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header">
          <div className="card-title">Product detail record</div>
          <button
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", product.id);
              fd.set("json", JSON.stringify(det));
              start(() => saveDetailAction(fd));
            }}
          >
            Save detail
          </button>
        </div>
        <div className="card-body">
          <JsonToggleEditor value={det} onChange={(v) => setDet(v as ProductDetail)} />
        </div>
      </div>
    </div>
  );
}
