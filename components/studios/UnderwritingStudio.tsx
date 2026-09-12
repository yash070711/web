"use client";

import { useState } from "react";
import { conditionsOf, opOf, previewRule, withSyncedConditions } from "@/lib/studio-data";
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

const OUTCOMES = [
  { id: "accept", label: "Accept", desc: "Risk meets appetite" },
  { id: "decline", label: "Decline", desc: "Outside permitted appetite" },
  { id: "refer", label: "Refer", desc: "Route to an underwriter" },
  { id: "load", label: "Load", desc: "Apply an approved loading" },
  { id: "restrict", label: "Restrict cover", desc: "Cap or modify a cover" },
  { id: "evidence", label: "Require evidence", desc: "Inspection, KYC or documents" },
];

export function UnderwritingStudio({
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
  const [open, setOpen] = useState({ identity: true, condition: true, outcome: true });
  const readOnly = status === "published";
  const { pending, saved, save } = useStudioSave(productId, version, "underwritingRules", rows);
  const rule = rows[active];

  function update(key: string, value: unknown) {
    if (readOnly || !rule) return;
    setRows(patchRow(rows, active, key, value));
  }

  function add() {
    if (readOnly) return;
    const next = [...rows, {
      id: `UW-${Date.now().toString().slice(-4)}`,
      name: "New underwriting rule",
      outcome: "refer",
      field: "",
      operator: "=",
      value: "",
      description: "",
      authority: "Underwriting Manager",
      conditions: [{ field: "", op: "=", value: "" }],
    }];
    setRows(next);
    setActive(next.length - 1);
  }

  const grouped = OUTCOMES.map((o) => ({ ...o, items: rows.map((r, i) => ({ r, i })).filter(({ r }) => str(r, "outcome") === o.id) })).filter((g) => g.items.length);

  return (
    <>
      <StudioHeader
        title="Underwriting Rules Studio"
        subtitle={`${productName} · v${version} — ${rows.length} rules configured`}
        productId={productId}
        moduleId="underwriting"
        extra={<button className="btn btn-primary" type="button" disabled={readOnly} onClick={add}>+ Add Rule</button>}
      />
      <ContextBar productId={productId} version={version} summary={`${rows.length} rules · priority by outcome rank`} studioId="underwriting" itemCount={rows.length} />
      <PublishedBanner productId={productId} studio="underwriting" readOnly={readOnly} />

      <div className="studio-layout">
        <aside className="rule-sidebar">
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Rules</div>
              <button className="btn btn-ghost btn-sm" type="button" disabled={readOnly} onClick={add}>+ Add</button>
            </div>
            <div className="rule-list">
              {grouped.map((g) => (
                <div key={g.id}>
                  <div className="rule-section-label">{g.label}</div>
                  {g.items.map(({ r, i }) => (
                    <div key={str(r, "id", String(i))} className={`rule-item ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
                      <div className="rule-item-body">
                        <div className="rule-item-name">{str(r, "name")}</div>
                        <div className="rule-item-meta">{str(r, "id")} · {previewRule(r, str(r, "outcome", "refer"))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </aside>
        <div className="detail-panel">
          {rule ? (
            <>
              <div className="detail-head">
                <div>
                  <h2>{str(rule, "name")}</h2>
                  <div className="flex-center gap-2 mt-2">
                    <span className="avail-badge avail-mandatory">{str(rule, "outcome").toUpperCase()}</span>
                    <span className="avail-badge avail-optional">{str(rule, "id")}</span>
                  </div>
                </div>
                <button className="btn btn-ghost" type="button" disabled={readOnly} onClick={() => { const next = rows.filter((_, i) => i !== active); setRows(next); setActive(Math.max(0, active - 1)); }}>Delete</button>
              </div>
              <Accordion n={1} title="Rule Identity" subtitle={`${str(rule, "outcome")} · ${str(rule, "authority", "Underwriting Manager")}`} open={open.identity} onToggle={() => setOpen((s) => ({ ...s, identity: !s.identity }))}>
                <div className="form-grid-2">
                  <Field label="Rule name"><input className="form-control" disabled={readOnly} value={str(rule, "name")} onChange={(e) => update("name", e.target.value)} /></Field>
                  <Field label="Authority level"><input className="form-control" disabled={readOnly} value={str(rule, "authority", "Underwriting Manager")} onChange={(e) => update("authority", e.target.value)} /></Field>
                  <Field label="Internal / customer message" span>
                    <textarea className="form-control" rows={3} disabled={readOnly} value={str(rule, "description")} onChange={(e) => update("description", e.target.value)} />
                  </Field>
                </div>
              </Accordion>
              <Accordion n={2} title="Condition tree" subtitle={previewRule(rule, str(rule, "outcome", "refer"))} open={open.condition} onToggle={() => setOpen((s) => ({ ...s, condition: !s.condition }))}>
                <div className="condition-builder">
                  <div className="cb-header">
                    <span className="text-muted" style={{ fontSize: 12 }}>Fire this rule when</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        const next = [...conditionsOf(rule), { connector: "AND", field: "", op: "=", value: "" }];
                        setRows(rows.map((r, i) => (i === active ? withSyncedConditions(r, next) : r)));
                      }}
                    >
                      + Add condition
                    </button>
                  </div>
                  {conditionsOf(rule).map((c, i) => (
                    <div key={i}>
                      {i > 0 ? <div className="elg-and" style={{ padding: "4px 16px" }}>{c.connector || "AND"}</div> : null}
                      <div className="cb-row">
                        <input className="form-control" disabled={readOnly} value={c.field || ""} placeholder="field" onChange={(e) => {
                          const next = conditionsOf(rule).map((row, ri) => (ri === i ? { ...row, field: e.target.value } : row));
                          setRows(rows.map((r, ri) => (ri === active ? withSyncedConditions(r, next) : r)));
                        }} />
                        <select className="form-control" style={{ width: 120 }} disabled={readOnly} value={opOf(c)} onChange={(e) => {
                          const next = conditionsOf(rule).map((row, ri) => (ri === i ? { ...row, op: e.target.value, operator: e.target.value } : row));
                          setRows(rows.map((r, ri) => (ri === active ? withSyncedConditions(r, next) : r)));
                        }}>
                          {["<", "<=", "=", ">=", ">", "in", "not in"].map((op) => <option key={op}>{op}</option>)}
                        </select>
                        <input className="form-control" disabled={readOnly} value={c.value || ""} placeholder="value" onChange={(e) => {
                          const next = conditionsOf(rule).map((row, ri) => (ri === i ? { ...row, value: e.target.value } : row));
                          setRows(rows.map((r, ri) => (ri === active ? withSyncedConditions(r, next) : r)));
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>
              <Accordion n={3} title="Outcome" subtitle={str(rule, "outcome")} open={open.outcome} onToggle={() => setOpen((s) => ({ ...s, outcome: !s.outcome }))}>
                <div className="outcome-type-selector">
                  {OUTCOMES.map((o) => (
                    <button key={o.id} type="button" className={`outcome-card ${str(rule, "outcome") === o.id ? "selected" : ""}`} disabled={readOnly} onClick={() => update("outcome", o.id)}>
                      <div className="outcome-card-label">{o.label}</div>
                      <div className="outcome-card-desc">{o.desc}</div>
                    </button>
                  ))}
                </div>
                {str(rule, "outcome") === "load" ? <Field label="Loading"><input className="form-control" disabled={readOnly} value={str(rule, "loading")} onChange={(e) => update("loading", e.target.value)} /></Field> : null}
                {str(rule, "outcome") === "restrict" ? <Field label="Restriction"><input className="form-control" disabled={readOnly} value={str(rule, "restriction")} onChange={(e) => update("restriction", e.target.value)} /></Field> : null}
              </Accordion>
              <EditorActions pending={pending} readOnly={readOnly} onDiscard={() => setRows(items)} onSave={() => save()} />
            </>
          ) : null}
        </div>
      </div>
      <SaveToast show={saved} />
    </>
  );
}
