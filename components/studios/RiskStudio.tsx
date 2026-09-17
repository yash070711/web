"use client";

import { useState } from "react";
import {
  ContextBar,
  EditorActions,
  Field,
  PublishedBanner,
  SaveToast,
  StudioHeader,
  patchRow,
  str,
  useStudioSave,
  type Row,
} from "./shared";

const SOURCES = ["Question", "Library", "Manual"];
const LEVELS = ["High", "Medium", "Low"];
const TYPES = ["Text", "Number", "Select", "Multi-select", "Boolean"];

export function RiskStudio({
  productId,
  version,
  productName,
  status,
  items,
}: {
  productId: string;
  version: string;
  productName: string;
  status: string;
  items: Row[];
}) {
  const [rows, setRows] = useState(items);
  const [active, setActive] = useState(0);
  const readOnly = status === "published";
  const { pending, saved, save } = useStudioSave(productId, version, "riskAttributes", rows);
  const row = rows[active];

  function update(key: string, value: unknown) {
    if (readOnly || !row) return;
    setRows(patchRow(rows, active, key, value));
  }

  return (
    <div className="page-inner">
      <StudioHeader
        title="Risk Guide"
        subtitle="Define the risk attributes captured at quote for commercial auto and trucking products."
        productId={productId}
        moduleId="risk"
      />
      <ContextBar productId={productId} version={version} summary={`${rows.length} attributes`} studioId="risk" itemCount={rows.length} />
      <PublishedBanner productId={productId} studio="risk" readOnly={readOnly} />
      <div className="studio-layout">
        <aside className="card">
          <div className="card-header">
            <div className="card-title">Risk attributes</div>
            {!readOnly ? (
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => {
                  const next = [...rows, {
                    id: `RSK-${String(rows.length + 1).padStart(3, "0")}`,
                    name: "New attribute",
                    source: "Manual",
                    riskLevel: "Medium",
                    type: "Text",
                    questionGroup: "Operations",
                    status: "draft",
                  }];
                  setRows(next);
                  setActive(next.length - 1);
                }}
              >
                + Add
              </button>
            ) : null}
          </div>
          <div className="cover-list" style={{ padding: 8 }}>
            {rows.map((item, i) => (
              <div key={str(item, "id", String(i))} className={`cover-item ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
                <div>
                  <div className="cover-item-name">{str(item, "name", "Attribute")}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>{str(item, "id")}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
        <div className="section-card">
          <div className="section-inner">
            {row ? (
              <>
                <div className="form-grid-2">
                  <Field label="Attribute ID">
                    <input className="form-control mono" value={str(row, "id")} readOnly />
                  </Field>
                  <Field label="Source">
                    <select className="form-control" value={str(row, "source", "Question")} disabled={readOnly} onChange={(e) => update("source", e.target.value)}>
                      {SOURCES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Risk name" span>
                    <input className="form-control" value={str(row, "name")} disabled={readOnly} onChange={(e) => update("name", e.target.value)} />
                  </Field>
                  <Field label="Select risk type">
                    <select className="form-control" value={str(row, "riskLevel", "Medium")} disabled={readOnly} onChange={(e) => update("riskLevel", e.target.value)}>
                      {LEVELS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Field type">
                    <select className="form-control" value={str(row, "type", "Text")} disabled={readOnly} onChange={(e) => update("type", e.target.value)}>
                      {TYPES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Question Group" span>
                    <input className="form-control" value={str(row, "questionGroup", str(row, "category"))} disabled={readOnly} onChange={(e) => update("questionGroup", e.target.value)} />
                  </Field>
                  <Field label="Sample values / options" span>
                    <textarea className="form-control" rows={3} value={str(row, "options")} disabled={readOnly} onChange={(e) => update("options", e.target.value)} />
                  </Field>
                  <Field label="Help text" span>
                    <textarea className="form-control" rows={2} value={str(row, "description")} disabled={readOnly} onChange={(e) => update("description", e.target.value)} />
                  </Field>
                </div>
                <EditorActions pending={pending} readOnly={readOnly} onDiscard={() => setRows(items)} onSave={() => save()} />
              </>
            ) : <p className="text-muted">No risk attributes yet.</p>}
          </div>
        </div>
      </div>
      <SaveToast show={saved} />
    </div>
  );
}
