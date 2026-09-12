"use client";

import { useState, useTransition } from "react";
import { saveListAction } from "@/app/actions/products";
import { JsonToggleEditor } from "./FieldEditor";

export function ListEditor({
  kind,
  items,
  label,
}: {
  kind: "team" | "pricing" | "glossary" | "webhooks";
  items: object[];
  label: string;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>(items as Record<string, unknown>[]);
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const current = rows[active];
  return (
    <div className="studio-layout">
      <aside className="card">
        <div className="card-header">
          <div className="card-title">{label}</div>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => {
              const next = [...rows, { id: `${kind}-${Date.now()}`, name: `New ${label}` }];
              setRows(next);
              setActive(next.length - 1);
            }}
          >
            + Add
          </button>
        </div>
        <div style={{ padding: 8 }}>
          {rows.map((row, i) => (
            <div key={i} className={`cover-item ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
              <div>{String(row.name || row.term || row.email || row.id)}</div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setRows(rows.filter((_, idx) => idx !== i));
                  setActive(0);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </aside>
      <section className="card">
        <div className="card-header">
          <div className="card-title">Edit any field</div>
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() => start(() => saveListAction(kind, JSON.stringify(rows)))}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="card-body">
          {current ? (
            <JsonToggleEditor
              value={current}
              onChange={(v) => {
                const copy = [...rows];
                copy[active] = v as Record<string, unknown>;
                setRows(copy);
              }}
            />
          ) : (
            <p className="text-muted">Nothing here yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
