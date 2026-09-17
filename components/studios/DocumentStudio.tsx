"use client";

import { useState } from "react";
import {
  Accordion,
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

const TYPES = ["Core", "Schedule", "Certificate", "Endorsement", "Notice", "Clause"];

export function DocumentStudio({
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
  const { pending, saved, save } = useStudioSave(productId, version, "documents", rows);
  const doc = rows[active];

  function update(key: string, value: unknown) {
    if (readOnly || !doc) return;
    setRows(patchRow(rows, active, key, value));
  }

  function add() {
    if (readOnly) return;
    const next = [...rows, { id: `DOC-${Date.now().toString().slice(-4)}`, name: "New wording", type: "Clause", version, status: "draft", cover: "All Covers", jurisdiction: "All" }];
    setRows(next);
    setActive(next.length - 1);
  }

  return (
    <>
      <StudioHeader
        title="Document Guide"
        subtitle={`${productName} · v${version} — schedules, certificates, wordings, notices and conditional clauses`}
        productId={productId}
        moduleId="document"
        extra={<button className="btn btn-primary" type="button" disabled={readOnly} onClick={add}>+ Add Document</button>}
      />
      <ContextBar productId={productId} version={version} summary={`${rows.length} artifacts · wording version-controlled`} studioId="document" itemCount={rows.length} />
      <PublishedBanner productId={productId} studio="document" readOnly={readOnly} />
      <div className="studio-layout">
        <aside className="cover-sidebar">
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Artifacts</div>
            </div>
            <div className="cover-list">
              {rows.map((row, i) => (
                <div key={str(row, "id", String(i))} className={`cover-item ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
                  <div className="cover-item-left"><div className="cover-item-name">{str(row, "name")}</div></div>
                  <span className="avail-badge avail-optional">{str(row, "type")}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
        <div className="detail-panel">
          {doc ? (
            <>
              <div className="detail-head">
                <h2>{str(doc, "name")}</h2>
                <button className="btn btn-ghost" type="button" disabled={readOnly} onClick={() => { const next = rows.filter((_, i) => i !== active); setRows(next); setActive(Math.max(0, active - 1)); }}>Delete</button>
              </div>
              <Accordion n={1} title="Document identity" subtitle={`${str(doc, "type")} · v${str(doc, "version") || str(doc, "ver", version)}`} open onToggle={() => undefined}>
                <div className="form-grid-2">
                  <Field label="Name"><input className="form-control" disabled={readOnly} value={str(doc, "name")} onChange={(e) => update("name", e.target.value)} /></Field>
                  <Field label="Type">
                    <select className="form-control" disabled={readOnly} value={str(doc, "type")} onChange={(e) => update("type", e.target.value)}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Document version"><input className="form-control" disabled={readOnly} value={str(doc, "version") || str(doc, "ver", version)} onChange={(e) => update("version", e.target.value)} /></Field>
                  <Field label="Status"><input className="form-control" disabled={readOnly} value={str(doc, "status", "draft")} onChange={(e) => update("status", e.target.value)} /></Field>
                  <Field label="Applicable cover"><input className="form-control" disabled={readOnly} value={str(doc, "cover", "All Covers")} onChange={(e) => update("cover", e.target.value)} /></Field>
                  <Field label="Jurisdiction"><input className="form-control" disabled={readOnly} value={str(doc, "jurisdiction") || (doc.identity && typeof doc.identity === "object" ? str(doc.identity as Row, "jur") : "All")} onChange={(e) => update("jurisdiction", e.target.value)} /></Field>
                </div>
              </Accordion>
              {Array.isArray(doc.vars) && (doc.vars as Row[]).length ? (
                <Accordion n={2} title="Merge fields" subtitle={`${(doc.vars as Row[]).length} tokens`} open onToggle={() => undefined}>
                  <table className="val-table">
                    <thead><tr><th>Token</th><th>Source</th><th>Example</th></tr></thead>
                    <tbody>
                      {(doc.vars as Row[]).map((v, i) => (
                        <tr key={i}>
                          <td className="text-mono">{str(v, "tok")}</td>
                          <td>{str(v, "src")}</td>
                          <td>{str(v, "ex")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Accordion>
              ) : null}
              <EditorActions pending={pending} readOnly={readOnly} onDiscard={() => setRows(items)} onSave={() => save()} />
            </>
          ) : null}
        </div>
      </div>
      <SaveToast show={saved} />
    </>
  );
}
