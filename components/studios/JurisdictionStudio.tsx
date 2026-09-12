"use client";

import { useState, useTransition } from "react";
import { updateProductFieldsAction } from "@/app/actions/products";
import { US_STATES } from "@/lib/us-states";
import { ContextBar, PublishedBanner, StudioHeader } from "./shared";
import type { Product } from "@/lib/types";

export function JurisdictionStudio({ product }: { product: Product }) {
  const initial = Array.isArray(product.jurisdictions) ? product.jurisdictions.map(String) : [];
  const [selected, setSelected] = useState<string[]>(initial);
  const [filter, setFilter] = useState("Filter");
  const [pending, start] = useTransition();
  const readOnly = product.status === "published";
  const q = filter === "Filter" || filter === "all" ? "" : filter.toLowerCase();
  const rows = US_STATES.filter((s) => !q || s.name.toLowerCase().includes(q) || s.abbr.toLowerCase().includes(q));

  function toggle(code: string) {
    if (readOnly) return;
            setSelected((cur) => cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
  }

  function save() {
    const fd = new FormData();
    fd.set("id", product.id);
    fd.set("json", JSON.stringify({ ...product, jurisdictions: selected }));
    start(() => updateProductFieldsAction(fd));
  }

  return (
    <div className="page-inner">
      <StudioHeader
        title="Define Jurisdiction"
        subtitle="States where the product is available, admitted status, and effective dates."
        productId={product.id}
        moduleId="jurisdiction"
      />
      <ContextBar productId={product.id} version={product.version} summary={`${selected.length} states`} />
      <PublishedBanner productId={product.id} studio="jurisdiction" readOnly={readOnly} />
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <div className="card-title">US states</div>
            <div className="card-subtitle">Select jurisdictions linked to this product.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
              <option>Filter</option>
              <option value="all">All states</option>
            </select>
            {!readOnly ? (
              <button className="btn btn-primary" type="button" disabled={pending} onClick={save}>
                {pending ? "Saving…" : "Save jurisdictions"}
              </button>
            ) : null}
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>State</th>
                <th>Code</th>
                <th>On product</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const on = selected.includes(s.abbr) || selected.includes(s.name);
                return (
                <tr key={s.abbr}>
                  <td>
                    <input type="checkbox" checked={on} disabled={readOnly} onChange={() => toggle(s.abbr)} />
                  </td>
                  <td>{s.name}</td>
                  <td className="mono">{s.abbr}</td>
                  <td>{on ? "Yes" : "—"}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
