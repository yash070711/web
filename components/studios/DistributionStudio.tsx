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

export function DistributionStudio({
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
  const { pending, saved, save } = useStudioSave(productId, version, "channels", rows);
  const channel = rows[active];

  function update(key: string, value: unknown) {
    if (readOnly || !channel) return;
    setRows(patchRow(rows, active, key, value));
  }

  function add() {
    if (readOnly) return;
    const next = [...rows, { id: `CHAN-${Date.now().toString().slice(-4)}`, name: "New channel", accessModel: "Restricted Access", commission: "0%", status: "active", territory: "All", bindLimit: "", description: "" }];
    setRows(next);
    setActive(next.length - 1);
  }

  return (
    <>
      <StudioHeader
        title="Distribution Guide"
        subtitle={`${productName} · v${version} — channels, intermediaries, territories, commissions and bind authority`}
        productId={productId}
        moduleId="distribution"
        extra={<button className="btn btn-primary" type="button" disabled={readOnly} onClick={add}>+ Add Channel</button>}
      />
      <ContextBar productId={productId} version={version} summary={`${rows.length} channels`} studioId="distribution" itemCount={rows.length} />
      <PublishedBanner productId={productId} studio="distribution" readOnly={readOnly} />
      <div className="studio-layout">
        <aside className="cover-sidebar">
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Channels</div>
            </div>
            <div className="cover-list">
              {rows.map((row, i) => (
                <div key={str(row, "id", String(i))} className={`cover-item ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
                  <div className="cover-item-left"><div className="cover-item-name">{str(row, "name")}</div></div>
                  <span className={`avail-badge ${str(row, "status") === "active" ? "avail-default" : "avail-optional"}`}>{str(row, "status").toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
        <div className="detail-panel">
          {channel ? (
            <>
              <div className="detail-head">
                <h2>{str(channel, "name")}</h2>
                <button className="btn btn-ghost" type="button" disabled={readOnly} onClick={() => { const next = rows.filter((_, i) => i !== active); setRows(next); setActive(Math.max(0, active - 1)); }}>Delete</button>
              </div>
              <Accordion n={1} title="Channel rules" subtitle={`${str(channel, "accessModel")} · ${str(channel, "commission")} commission`} open onToggle={() => undefined}>
                <div className="form-grid-2">
                  <Field label="Channel name"><input className="form-control" disabled={readOnly} value={str(channel, "name")} onChange={(e) => update("name", e.target.value)} /></Field>
                  <Field label="Access model">
                    <select className="form-control" disabled={readOnly} value={str(channel, "accessModel")} onChange={(e) => update("accessModel", e.target.value)}>
                      <option>Open Access</option>
                      <option>Restricted Access</option>
                      <option>API Partners Only</option>
                    </select>
                  </Field>
                  <Field label="Commission"><input className="form-control" disabled={readOnly} value={str(channel, "commission") || str(channel, "comm")} onChange={(e) => update("commission", e.target.value)} /></Field>
                  <Field label="Territory"><input className="form-control" disabled={readOnly} value={str(channel, "territory", "All")} onChange={(e) => update("territory", e.target.value)} /></Field>
                  <Field label="Bind limit"><input className="form-control" disabled={readOnly} value={str(channel, "bindLimit")} onChange={(e) => update("bindLimit", e.target.value)} /></Field>
                  <Field label="Status">
                    <select className="form-control" disabled={readOnly} value={str(channel, "status")} onChange={(e) => update("status", e.target.value)}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </Field>
                  <Field label="Description" span>
                    <textarea className="form-control" rows={3} disabled={readOnly} value={str(channel, "description") || str(channel, "desc")} onChange={(e) => update("description", e.target.value)} />
                  </Field>
                </div>
              </Accordion>
              {Array.isArray(channel.territories) && (channel.territories as Row[]).length ? (
                <Accordion n={2} title="Territories" subtitle={`${(channel.territories as Row[]).length} jurisdictions`} open onToggle={() => undefined}>
                  <table className="val-table">
                    <thead><tr><th>Jurisdiction</th><th>Permitted</th><th>Notes</th></tr></thead>
                    <tbody>
                      {(channel.territories as Row[]).map((t, i) => (
                        <tr key={i}>
                          <td>{str(t, "j")}</td>
                          <td>{str(t, "p")}</td>
                          <td>{str(t, "n")}</td>
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
