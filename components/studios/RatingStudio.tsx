"use client";

import { useMemo, useState } from "react";
import { DEFAULT_PREMIUM_EXPRESSION, rateQuote, type Answers } from "@/lib/runtime";
import { bandsFromTable, table1DOf } from "@/lib/studio-data";
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

const GROUPS: { type: string; label: string }[] = [
  { type: "base", label: "BASE PREMIUM" },
  { type: "factor", label: "RISK FACTORS" },
  { type: "loading", label: "LOADINGS" },
  { type: "discount", label: "DISCOUNTS" },
  { type: "minimum", label: "MINIMUM / MAXIMUM" },
  { type: "fee", label: "FEES" },
  { type: "tax", label: "TAXES" },
  { type: "formula", label: "FORMULA" },
];

const ADD_TYPES = [
  { type: "base", name: "Base Rate" },
  { type: "factor", name: "Factor (Rate Table)" },
  { type: "loading", name: "Loading" },
  { type: "discount", name: "Discount" },
  { type: "minimum", name: "Minimum Premium" },
  { type: "fee", name: "Fee" },
  { type: "tax", name: "Tax" },
];

const FORMULA_GROUPS: { type: string; token: string; label: string }[] = [
  { type: "factor", token: "FACTORS", label: "Risk Factors" },
  { type: "loading", token: "LOADINGS", label: "Loadings" },
  { type: "discount", token: "DISCOUNTS", label: "Discounts" },
  { type: "fee", token: "FEES", label: "Fees" },
  { type: "tax", token: "TAXES", label: "Taxes" },
];

const FORMULA_OPERATORS: { symbol: string; insert: string }[] = [
  { symbol: "+", insert: "+" },
  { symbol: "−", insert: "-" },
  { symbol: "×", insert: "*" },
  { symbol: "÷", insert: "/" },
  { symbol: "(", insert: "(" },
  { symbol: ")", insert: ")" },
];

export function RatingStudio({
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
  const [open, setOpen] = useState({ identity: true, table: true });
  const [addOpen, setAddOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    gvw_tonnes: 16,
    radius_km: 400,
    goods_class: "General merchandise",
    hgv_experience_years: 12,
    night_operations: "No",
    tracking_fitted: "Yes",
  });
  const readOnly = status === "published";
  const { pending, saved, save } = useStudioSave(productId, version, "ratingComponents", rows);
  const row = rows[active];
  const quote = useMemo(() => rateQuote(rows, answers, 1), [rows, answers]);

  function update(key: string, value: unknown) {
    if (readOnly || !row) return;
    setRows(patchRow(rows, active, key, value));
  }

  function setTable(next: Row[]) {
    if (readOnly || !row) return;
    const patched = [...rows];
    patched[active] = { ...patched[active], table1D: next, bands: bandsFromTable(next) };
    setRows(patched);
  }

  const table = table1DOf(row);
  const showTable = ["factor", "discount"].includes(str(row, "type")) || table.length > 0;

  function nextComponentId(type: string) {
    const prefix = `RAT-${type.slice(0, 3).toUpperCase()}-`;
    const used = rows
      .map((r) => str(r, "id"))
      .filter((id) => id.startsWith(prefix))
      .map((id) => Number(id.slice(prefix.length)) || 0);
    const n = (used.length ? Math.max(...used) : 0) + 1;
    return `${prefix}${String(n).padStart(3, "0")}`;
  }

  function add(type: string, name: string) {
    if (readOnly) return;
    const next = [...rows, { id: nextComponentId(type), name, type, amount: type === "base" ? 1850 : type === "tax" ? "18%" : "0", field: "", bands: "", condition: "", unit: "per year" }];
    setRows(next);
    setActive(next.length - 1);
    setAddOpen(false);
  }

  const formulaRow = rows.find((r) => str(r, "type") === "formula");
  const formulaExpr = str(formulaRow, "expression") || DEFAULT_PREMIUM_EXPRESSION;

  function setFormulaExpression(expr: string) {
    if (readOnly) return;
    const idx = rows.findIndex((r) => str(r, "type") === "formula");
    if (idx >= 0) {
      setRows(patchRow(rows, idx, "expression", expr));
    } else {
      setRows([...rows, { id: "RAT-FORMULA", name: "Payable Premium Formula", type: "formula", expression: expr }]);
    }
  }

  function insertFormulaToken(token: string) {
    setFormulaExpression(`${formulaExpr.trim()} ${token}`.trim());
  }

  function formulaTokenGroups() {
    return [
      { label: "Base Premium", items: [{ token: "BASE", name: "Base Premium" }] },
      ...FORMULA_GROUPS.map((g) => ({
        label: g.label,
        items: [
          { token: g.token, name: `All ${g.label}` },
          ...rows.filter((r) => str(r, "type") === g.type).map((r) => ({ token: str(r, "id"), name: str(r, "name") || str(r, "id") })),
        ],
      })),
      { label: "Add-ons", items: [{ token: "ADDONS", name: "Optional Add-ons" }] },
    ];
  }

  return (
    <>
      <StudioHeader
        title="Rating & Pricing Guide"
        subtitle={`${productName} · v${version} — ${rows.length} rating components · 1 premium formula · $${quote.payable.toLocaleString("en-US")} est. annual premium`}
        productId={productId}
        moduleId="rating"
        extra={(
          <>
            <button className="btn btn-ghost" type="button" onClick={() => setOpen({ identity: true, table: true })}>Edit Formula</button>
            <button className="btn btn-secondary" type="button" onClick={() => setTestOpen(true)}>Run Premium Test</button>
            <button className="btn btn-primary" type="button" disabled={readOnly} onClick={() => setAddOpen((v) => !v)}>+ Add Component</button>
          </>
        )}
      />
      {addOpen ? (
        <div className="flex gap-2 mb-4" style={{ flexWrap: "wrap" }}>
          {ADD_TYPES.map((t) => (
            <button key={t.type} className="btn btn-secondary btn-sm" type="button" onClick={() => add(t.type, t.name)}>{t.name}</button>
          ))}
        </div>
      ) : null}

      <ContextBar productId={productId} version={version} summary={`${rows.length} components · ${rows.filter((r) => str(r, "type") === "factor").length} factors · ${rows.filter((r) => str(r, "type") === "discount").length} discounts · ${rows.filter((r) => ["fee", "tax"].includes(str(r, "type"))).length} fees/taxes`} studioId="rating" itemCount={rows.length} />
      <PublishedBanner productId={productId} studio="rating" readOnly={readOnly} />

      <div className="section-card mb-6">
        <div className="section-inner">
          <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div className="card-title">Formula Builder</div>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                Build the exact expression used to calculate the payable premium, from this product&apos;s Base Premium, Risk Factors, Loadings, Discounts, Fees and Taxes.
              </p>
            </div>
            <div className="quote-price" style={{ fontSize: 22, fontWeight: 700, color: quote.formulaError ? "var(--color-danger, #EF4444)" : undefined }}>
              {quote.formulaError ? "Formula error" : `$${quote.payable.toLocaleString("en-US")}`}
            </div>
          </div>

          {formulaTokenGroups().map((g) => (
            <div key={g.label} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>{g.label}</div>
              <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                {g.items.map((it) => (
                  <button key={it.token} type="button" className="btn btn-ghost btn-sm" disabled={readOnly} onClick={() => insertFormulaToken(it.token)}>{it.name}</button>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 6 }}>Operators</div>
            <div className="flex gap-2">
              {FORMULA_OPERATORS.map((op) => (
                <button key={op.insert} type="button" className="btn btn-ghost btn-sm" disabled={readOnly} onClick={() => insertFormulaToken(op.insert)}>{op.symbol}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="Formula expression" span help="Click tokens above to build the formula, or type component IDs and operators directly.">
              <textarea
                className="form-control text-mono"
                rows={2}
                disabled={readOnly}
                value={formulaExpr}
                onChange={(e) => setFormulaExpression(e.target.value)}
              />
            </Field>
            {quote.formulaError ? (
              <p style={{ color: "var(--color-danger, #EF4444)", fontSize: 12, marginTop: 4 }}>
                {quote.formulaError} — showing the default formula result above until this is fixed.
              </p>
            ) : null}
            <button className="btn btn-ghost btn-sm" type="button" disabled={readOnly} style={{ marginTop: 8 }} onClick={() => setFormulaExpression(DEFAULT_PREMIUM_EXPRESSION)}>
              Reset to default formula
            </button>
          </div>
        </div>
      </div>

      <div className="rule-preview-box mb-6">
        <div className="rp-title">Deterministic calculation graph</div>
        <div className="rp-line">{formulaExpr}</div>
      </div>

      <div className="studio-layout">
        <aside className="rule-sidebar">
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Components</div>
            </div>
            <div className="rule-list">
              {GROUPS.map((g) => {
                const itemsIn = rows.map((r, i) => ({ r, i })).filter(({ r }) => str(r, "type") === g.type);
                if (!itemsIn.length) return null;
                return (
                  <div key={g.type}>
                    <div className="rule-section-label">{g.label}</div>
                    {itemsIn.map(({ r, i }) => (
                      <div key={str(r, "id", String(i))} className={`rule-item ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
                        <div className="rule-item-body">
                          <div className="rule-item-name">{str(r, "name")}</div>
                          <div className="rule-item-meta">{str(r, "id")} · {str(r, "amount") || str(r, "bands") || str(r, "expression") || str(r, "type")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="detail-panel">
          {row ? (
            <>
              <div className="detail-head">
                <div>
                  <h2>{str(row, "name")}</h2>
                  <div className="flex-center gap-2 mt-2">
                    <span className="avail-badge avail-mandatory">{str(row, "type").toUpperCase()}</span>
                    <span className="avail-badge avail-optional">{str(row, "id")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost" type="button" disabled={readOnly} onClick={() => { const next = rows.filter((_, i) => i !== active); setRows(next); setActive(Math.max(0, active - 1)); }}>Delete</button>
                </div>
              </div>
              <Accordion n={1} title="Component Identity" subtitle={str(row, "type")} open={open.identity} onToggle={() => setOpen((s) => ({ ...s, identity: !s.identity }))}>
                <div className="form-grid-2">
                  <Field label="Name"><input className="form-control" disabled={readOnly} value={str(row, "name")} onChange={(e) => update("name", e.target.value)} /></Field>
                  <Field label="Type">
                    <select className="form-control" disabled={readOnly} value={str(row, "type")} onChange={(e) => update("type", e.target.value)}>
                      {GROUPS.map((g) => <option key={g.type} value={g.type}>{g.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Amount / Rate"><input className="form-control" disabled={readOnly} value={str(row, "amount")} onChange={(e) => update("amount", e.target.value)} /></Field>
                  <Field label="Unit"><input className="form-control" disabled={readOnly} value={str(row, "unit")} onChange={(e) => update("unit", e.target.value)} /></Field>
                  {str(row, "type") === "base" ? (
                    <Field label="Jurisdiction Base Rate Mode">
                      <select className="form-control" disabled={readOnly} value={str(row, "stateMode", "uniform")} onChange={(e) => update("stateMode", e.target.value)}>
                        <option value="uniform">All States Same (Uniform National Rate)</option>
                        <option value="multi_state">Multiple States Have Different Rates (State-by-State Matrix)</option>
                      </select>
                    </Field>
                  ) : null}
                  {str(row, "type") === "factor" ? (
                    <Field label="Rating Factor Behavior">
                      <select className="form-control" disabled={readOnly} value={str(row, "behavior", "multiply")} onChange={(e) => update("behavior", e.target.value)}>
                        <option value="multiply">Multiply (× Multiplier)</option>
                        <option value="divide">Divide (/ Divisor)</option>
                        <option value="plus">Plus (+ Flat Amount)</option>
                        <option value="minus">Minus (- Credit Amount)</option>
                      </select>
                    </Field>
                  ) : null}
                  {str(row, "type") === "discount" ? (
                    <>
                      <Field label="Discount Calculation Mode">
                        <select className="form-control" disabled={readOnly} value={str(row, "discountType", str(row, "amount").includes("%") ? "Percentage" : "Flat")} onChange={(e) => {
                          const mode = e.target.value;
                          const val = str(row, "discountValue", "10");
                          update("discountType", mode);
                          update("amount", mode === "Percentage" ? `${val}%` : `$${val}`);
                        }}>
                          <option value="Percentage">Percentage Discount (%)</option>
                          <option value="Flat">Flat Amount Discount ($)</option>
                        </select>
                      </Field>
                      <Field label="Discount Condition Case Preset">
                        <select className="form-control" disabled={readOnly} value={str(row, "casePreset", "custom")} onChange={(e) => {
                          const p = e.target.value;
                          update("casePreset", p);
                          if (p === "renewal") { update("condition", "is_renewed_policy = Yes"); update("name", "Policy Renewal Discount"); }
                          else if (p === "noclaim") { update("condition", "no_claim = Yes"); update("name", "No-Claim Bonus Discount"); }
                          else if (p === "loyalty") { update("condition", "active_policies > 1"); update("name", "Multi-Policy Discount"); }
                        }}>
                          <option value="custom">Custom Condition Case</option>
                          <option value="renewal">Policy Renewal (is_renewed_policy = Yes)</option>
                          <option value="noclaim">No-Claim Bonus (no_claim = Yes)</option>
                          <option value="loyalty">Multi-Policy Savings (active_policies &gt; 1)</option>
                        </select>
                      </Field>
                    </>
                  ) : null}
                  <Field label="Lookup field"><input className="form-control text-mono" disabled={readOnly} value={str(row, "field") || str(row, "lookupAttr")} onChange={(e) => update("field", e.target.value)} /></Field>
                  <Field label="Cover / condition"><input className="form-control" disabled={readOnly} value={str(row, "cover") || str(row, "condition")} onChange={(e) => update(str(row, "type") === "loading" || str(row, "type") === "discount" ? "condition" : "cover", e.target.value)} /></Field>
                  {str(row, "type") === "formula" ? (
                    <Field label="Expression" span help="Also editable from the Formula Builder section above.">
                      <textarea className="form-control" rows={3} disabled={readOnly} value={str(row, "expression", DEFAULT_PREMIUM_EXPRESSION)} onChange={(e) => update("expression", e.target.value)} />
                    </Field>
                  ) : null}
                </div>
              </Accordion>
              {showTable ? (
                <Accordion n={2} title="Rate Table" subtitle={table.length ? `${table.length} bands` : str(row, "bands") || "No bands"} open={open.table} onToggle={() => setOpen((s) => ({ ...s, table: !s.table }))}>
                  <table className="val-table">
                    <thead><tr><th>Band</th><th>Multiplier</th><th>Note</th></tr></thead>
                    <tbody>
                      {table.length === 0 ? (
                        <tr><td colSpan={3} className="text-muted" style={{ textAlign: "center" }}>No table rows — add a band or keep the bands string below.</td></tr>
                      ) : table.map((r, i) => (
                        <tr key={i}>
                          <td><input className="form-control" disabled={readOnly} value={str(r, "band")} onChange={(e) => setTable(table.map((band, ri) => (ri === i ? { ...band, band: e.target.value } : band)))} /></td>
                          <td><input className="form-control text-mono" disabled={readOnly} value={str(r, "mult")} onChange={(e) => setTable(table.map((band, ri) => (ri === i ? { ...band, mult: e.target.value } : band)))} /></td>
                          <td><input className="form-control" disabled={readOnly} value={str(r, "note")} onChange={(e) => setTable(table.map((band, ri) => (ri === i ? { ...band, note: e.target.value } : band)))} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn btn-ghost btn-sm" type="button" disabled={readOnly} onClick={() => setTable([...table, { band: "", mult: "1.00", note: "" }])}>+ Add band</button>
                  <Field label="Bands string (kept in sync for the quote engine)">
                    <textarea className="form-control" rows={2} disabled={readOnly} value={str(row, "bands")} onChange={(e) => update("bands", e.target.value)} />
                  </Field>
                </Accordion>
              ) : null}
              <EditorActions pending={pending} readOnly={readOnly} onDiscard={() => setRows(items)} onSave={() => save()} />
            </>
          ) : null}
        </div>
      </div>
      <SaveToast show={saved} />

      {testOpen ? (
        <div className="studio-modal-overlay" onClick={() => setTestOpen(false)}>
          <div className="studio-modal" style={{ width: 860 }} onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <div className="card-title">Premium test — explanation trail</div>
              <button className="btn btn-ghost" type="button" onClick={() => setTestOpen(false)}>Close</button>
            </div>
            <div className="studio-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                {["gvw_tonnes", "radius_km", "goods_class", "hgv_experience_years", "night_operations", "tracking_fitted"].map((field) => (
                  <div className="form-group" key={field}>
                    <label className="form-label">{field}</label>
                    <input className="form-control" value={String(answers[field] ?? "")} onChange={(e) => setAnswers((a) => ({ ...a, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div>
                <div className="quote-price" style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>${quote.payable.toLocaleString()}</div>
                {quote.trail.map((t) => (
                  <div className="test-result-item test-na" key={t.id}>
                    <div>
                      <div className="fw-600">{t.name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{t.type} · {t.effect}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
