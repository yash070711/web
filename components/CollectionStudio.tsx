"use client";

import { useState, useTransition } from "react";
import { saveCollectionAction } from "@/app/actions/products";
import { JsonToggleEditor } from "./FieldEditor";

export function CollectionStudio({
  productId,
  version,
  collection,
  itemLabel,
  items,
}: {
  productId: string;
  version: string;
  collection: string;
  itemLabel: string;
  items: Record<string, unknown>[];
}) {
  const [rows, setRows] = useState(items);
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const current = rows[active];

  function save(next = rows) {
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("version", version);
    fd.set("collection", collection);
    fd.set("json", JSON.stringify(next));
    start(() => saveCollectionAction(fd));
  }

  return (
    <div className="studio-layout">
      <aside className="card">
        <div className="card-header">
          <div className="card-title">{itemLabel}s</div>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => {
              const row = { id: `${itemLabel.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`, name: `New ${itemLabel}` };
              const next = [...rows, row];
              setRows(next);
              setActive(next.length - 1);
            }}
          >
            + Add
          </button>
        </div>
        <div className="cover-list" style={{ padding: 8 }}>
          {rows.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-state-title">None yet</div>
              <div className="empty-state-desc">Add a {itemLabel.toLowerCase()} to start configuring.</div>
            </div>
          ) : (
            rows.map((row, i) => (
              <div
                key={String(row.id || i)}
                className={`cover-item ${i === active ? "active" : ""}`}
                onClick={() => setActive(i)}
              >
                <div>
                  <div className="cover-item-name">{String(row.name || row.term || row.label || row.id || `${itemLabel} ${i + 1}`)}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{String(row.id || "")}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = rows.filter((_, idx) => idx !== i);
                    setRows(next);
                    setActive(Math.max(0, i - 1));
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{current ? String(current.name || current.id || itemLabel) : `No ${itemLabel}`}</div>
            <div className="card-subtitle">Edit or delete any field. Changes save to your session workspace.</div>
          </div>
          <button className="btn btn-primary" disabled={pending} onClick={() => save()}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
        <div className="card-body">
          {current ? (
            <JsonToggleEditor
              value={current}
              onChange={(next) => {
                const copy = [...rows];
                copy[active] = next as Record<string, unknown>;
                setRows(copy);
              }}
            />
          ) : (
            <p className="text-muted">Add an item from the left to configure it.</p>
          )}
        </div>
      </section>
    </div>
  );
}
