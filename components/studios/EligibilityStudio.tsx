"use client";

import { useMemo, useState, useTransition } from "react";
import { setProductStatusAction } from "@/app/actions/products";
import { conditionText, conditionsOf, opOf, previewRule, withSyncedConditions } from "@/lib/studio-data";
import { ruleMatches } from "@/lib/runtime";
import {
  Accordion,
  ContextBar,
  EditorActions,
  Field,
  PublishedBanner,
  SaveToast,
  StudioHeader,
  Toggle,
  patchRow,
  str,
  useStudioSave,
  type Row,
} from "./shared";

const OPERATORS = ["<", "<=", "=", ">=", ">", "in", "not in"];
const BASE_ELIG_FIELDS = [
  "driver_age", "vehicle_age", "policy_jurisdiction", "vehicle_type", "vehicle_insured_value",
  "licence_duration_years", "annual_mileage", "purpose_of_use", "driver_conviction_history",
];

function riskFieldKey(risk: Row) {
  const explicit = str(risk, "fieldKey") || str(risk, "internalName");
  if (explicit) return explicit;
  const name = str(risk, "name");
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || str(risk, "id");
}
const CATEGORIES = ["Product Eligibility", "Cover Eligibility", "Fleet Risk", "Cargo Type", "Route / Jurisdiction"];
const OUTCOMES = [
  { id: "eligible", label: "Eligible", desc: "Risk may proceed to quote" },
  { id: "ineligible", label: "Ineligible", desc: "Hard block — cannot quote" },
  { id: "refer", label: "Refer", desc: "Send to specialist UW" },
  { id: "restrict", label: "Restrict", desc: "Offer with a cover cap" },
  { id: "load", label: "Load", desc: "Quote with a loading" },
];

const OUTCOME_META: Record<string, { label: string; color: string; className: string }> = {
  eligible: { label: "Eligible", color: "#22C55E", className: "elg-out-eligible" },
  ineligible: { label: "Decline", color: "#F59E0B", className: "elg-out-decline" },
  decline: { label: "Decline", color: "#F59E0B", className: "elg-out-decline" },
  refer: { label: "Refer", color: "#A78BFA", className: "elg-out-refer" },
  restrict: { label: "Restrict", color: "#60A5FA", className: "elg-out-restrict" },
  load: { label: "Load", color: "#FBBF24", className: "elg-out-load" },
};

function prettyField(field: string) {
  return field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Field";
}

function passCondition(rule: Row) {
  const conds = conditionsOf(rule);
  const invert: Record<string, string> = { "<": ">=", "<=": ">", ">": "<=", ">=": "<", "=": "≠", in: "not in", "not in": "in" };
  if (!conds.length) return "No condition";
  const outcome = str(rule, "outcome", "ineligible");
  return conds
    .map((c, i) => {
      const op = opOf(c);
      const shown = outcome === "eligible" ? op : invert[op] || op;
      return `${i && c.connector ? `${c.connector} ` : ""}${prettyField(c.field || "")} ${shown} ${c.value}`;
    })
    .join(" ");
}

function preview(rule: Row) {
  return previewRule(rule);
}

function fires(rule: Row, answers: Record<string, string>) {
  const conds = conditionsOf(rule);
  if (!conds.length) return null;
  if (conds.some((c) => !answers[c.field || ""] && answers[c.field || ""] !== "0")) return null;
  return ruleMatches(rule, answers);
}

function questionCount(groups: Row[]) {
  return groups.reduce((n, g) => n + (Array.isArray(g.questions) ? g.questions.length : 0), 0);
}

function outcomeOf(rule: Row) {
  return str(rule, "outcome", "ineligible");
}

function statusOf(rule: Row) {
  return str(rule, "status", "active") || "active";
}

function Icon({ name }: { name: "eye" | "shield" | "edit" | "copy" | "trash" | "info" }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "eye") return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 5 6v5c0 5 3.2 8.4 7 10 3.8-1.6 7-5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "edit") return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
  if (name === "copy") return <svg {...common}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
  if (name === "trash") return <svg {...common}><path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
}

function OutcomeDonut({ slices, total }: { slices: { label: string; count: number; color: string }[]; total: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const safe = total || 1;
  return (
    <svg className="elg-donut" width="140" height="140" viewBox="0 0 140 140" aria-hidden>
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(148,163,184,.16)" strokeWidth="12" />
      {slices.filter((s) => s.count > 0).map((s) => {
        const len = (s.count / safe) * c;
        const el = (
          <circle
            key={s.label}
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeLinecap="butt"
            strokeDasharray={`${len} ${c}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        );
        offset += len;
        return el;
      })}
      <text x="70" y="66" textAnchor="middle" fill="#F3F4F6" fontSize="22" fontWeight="700">{total}</text>
      <text x="70" y="84" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600">Total</text>
    </svg>
  );
}

export function EligibilityStudio({
  productId,
  version,
  productName,
  status,
  items,
  covers,
  riskAttributes = [],
  questions = [],
  underwriting = [],
}: {
  productId: string;
  version: string;
  productName: string;
  status: string;
  items: Row[];
  covers: Row[];
  riskAttributes?: Row[];
  questions?: Row[];
  underwriting?: Row[];
}) {
  const [rows, setRows] = useState(items);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState({ identity: true, condition: true, outcome: true });
  const [tab, setTab] = useState<"rules" | "sets" | "summary">("rules");
  const [mode, setMode] = useState<"hub" | "edit">("hub");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [validateOpen, setValidateOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({
    driver_age: "28",
    licence_class: "HGV",
    vehicle_age: "8",
    gvw_tonnes: "16",
    goods_class: "General merchandise",
    tracking_fitted: "Yes",
    hgv_experience_years: "6",
  });
  const [publishing, startPublish] = useTransition();
  const readOnly = status === "published";
  const { pending, saved, save } = useStudioSave(productId, version, "eligibilityRules", rows);
  const rule = rows[active];
  const coverNames = ["All Covers", ...covers.map((c) => str(c, "name")).filter(Boolean)];
  const qCount = questionCount(questions);

  const grouped = useMemo(() => {
    const map = new Map<string, { row: Row; index: number }[]>();
    rows.forEach((row, index) => {
      const cat = str(row, "category", "Product Eligibility");
      map.set(cat, [...(map.get(cat) || []), { row, index }]);
    });
    return [...map.entries()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (statusFilter !== "all" && statusOf(row) !== statusFilter) return false;
        if (!q) return true;
        return [str(row, "name"), str(row, "id"), conditionText(row), str(row, "outcome")].join(" ").toLowerCase().includes(q);
      });
  }, [rows, search, statusFilter]);

  const activeCount = rows.filter((r) => statusOf(r) === "active").length;
  const ruleSets = grouped.map(([name, list]) => ({ name, count: list.length, rules: list }));
  const outcomeSlices = [
    { key: "eligible", label: "Eligible", color: "#22C55E" },
    { key: "refer", label: "Refer", color: "#A78BFA" },
    { key: "ineligible", label: "Decline", color: "#F59E0B" },
  ].map((s) => ({
    ...s,
    count: rows.filter((r) => {
      const o = outcomeOf(r);
      if (s.key === "ineligible") return o === "ineligible" || o === "decline";
      return o === s.key;
    }).length,
  }));
  const otherOutcomes = rows.filter((r) => !["eligible", "refer", "ineligible", "decline"].includes(outcomeOf(r))).length;
  if (otherOutcomes) outcomeSlices.push({ key: "other", label: "Other", color: "#60A5FA", count: otherOutcomes });

  const issues = useMemo(() => {
    const found: string[] = [];
    const ids = new Set<string>();
    rows.forEach((r, i) => {
      const name = str(r, "name");
      const id = str(r, "id", `row-${i}`);
      if (!name.trim()) found.push(`Rule ${id} is missing a name.`);
      const conds = conditionsOf(r);
      if (!conds.length || conds.some((c) => !c.field?.trim())) found.push(`${name || id} has no condition field.`);
      if (conds.some((c) => !String(c.value ?? "").trim()) && !str(r, "value").trim()) found.push(`${name || id} has no comparison value.`);
      if (ids.has(id)) found.push(`Duplicate rule code ${id}.`);
      ids.add(id);
    });
    return found;
  }, [rows]);

  function update(key: string, value: unknown) {
    if (readOnly || !rule) return;
    setRows(patchRow(rows, active, key, value));
  }

  function addRule(category = "Product Eligibility") {
    if (readOnly) return;
    const id = `ELG-${String(rows.length + 1).padStart(3, "0")}`;
    const next = [
      ...rows,
      {
        id,
        name: "New eligibility rule",
        field: "driver_age",
        operator: ">=",
        value: "21",
        outcome: "eligible",
        outcomeType: "hard",
        direction: "eligible",
        logic: "and",
        reasonCode: id,
        category,
        cover: "All Covers",
        priority: 40,
        status: "active",
        description: "",
        customerMsg: "",
        internalMsg: "",
        conditions: [{ field: "driver_age", op: ">=", value: "21" }],
        effectiveFrom: "01-Aug-2026",
        effectiveTo: "31-Jul-2027",
      },
    ];
    setRows(next);
    setActive(next.length - 1);
    setMode("edit");
    setTab("rules");
  }

  function copyRule(index: number) {
    if (readOnly) return;
    const source = rows[index];
    const id = `ELG-${String(rows.length + 1).padStart(3, "0")}`;
    const next = [...rows, { ...source, id, name: `${str(source, "name")} (copy)` }];
    setRows(next);
    setActive(next.length - 1);
  }

  function deleteRule(index: number) {
    if (readOnly) return;
    const next = rows.filter((_, i) => i !== index);
    setRows(next);
    setActive(Math.max(0, Math.min(active, next.length - 1)));
    if (!next.length) setMode("hub");
  }

  function publish() {
    if (readOnly) return;
    save();
    const fd = new FormData();
    fd.set("id", productId);
    fd.set("status", "published");
    startPublish(() => {
      void setProductStatusAction(fd);
    });
  }

  const attributeFields = useMemo(
    () => [...new Set([...BASE_ELIG_FIELDS, ...riskAttributes.map(riskFieldKey).filter(Boolean)])],
    [riskAttributes]
  );

  const fields = [...new Set([...attributeFields, ...rows.flatMap((r) => conditionsOf(r).map((c) => c.field || "").filter(Boolean))])];
  const results = testOpen ? rows.map((r) => ({ rule: r, hit: fires(r, answers) })) : [];

  return (
    <>
      <StudioHeader
        title="Eligibility Studio"
        subtitle="Define eligibility criteria to determine who can buy this product."
        productId={productId}
        moduleId="eligibility"
        extra={(
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setValidateOpen(true)}>
              <Icon name="shield" /> Validate
            </button>
            <button className="btn btn-secondary" type="button" disabled={pending} onClick={() => save()}>
              {pending ? "Saving…" : "Save Draft"}
            </button>
            <button className="btn btn-primary" type="button" disabled={readOnly || publishing} onClick={publish}>
              {publishing ? "Publishing…" : "Publish Changes"}
            </button>
          </>
        )}
      />

      <ContextBar
        productId={productId}
        version={version}
        summary={`${rows.length} rules · ${ruleSets.length} rule sets · ${activeCount} active`}
        studioId="eligibility"
        itemCount={rows.length}
      />
      <PublishedBanner productId={productId} studio="eligibility" readOnly={readOnly} />

      {mode === "edit" && rule ? (
        <div className="studio-layout">
          <aside className="q-tree-sidebar">
            <div className="card">
              <div className="card-header" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Eligibility Tree</div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setMode("hub")}>← Rules</button>
              </div>
              <div className="q-tree">
                {grouped.map(([cat, itemsInCat]) => {
                  const closed = collapsed[cat];
                  return (
                    <div className="q-group" key={cat}>
                      <div className="q-group-header" onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}>
                        <span className={`section-chevron ${closed ? "" : "open"}`}>›</span>
                        <div className="q-group-label">{cat}</div>
                        <span className="q-group-count">{itemsInCat.length}</span>
                      </div>
                      {closed ? null : (
                        <div className="q-items">
                          {itemsInCat.map(({ row, index }) => (
                            <div
                              key={str(row, "id", String(index))}
                              className={`q-item ${index === active ? "active" : ""}`}
                              onClick={() => setActive(index)}
                            >
                              <span className="q-item-dot" />
                              <span className="q-item-label">{str(row, "name")}</span>
                              <span className="q-item-type">{OUTCOME_META[outcomeOf(row)]?.label || outcomeOf(row)}</span>
                            </div>
                          ))}
                          <button className="q-add-btn" type="button" disabled={readOnly} onClick={() => addRule(cat)}>+ Add eligibility rule</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="detail-panel">
            <div className="detail-head">
              <div>
                <h2>{str(rule, "name")}</h2>
                <div className="flex-center gap-2 mt-2">
                  <span className="avail-badge avail-optional">{str(rule, "id")}</span>
                  <span className={`avail-badge ${statusOf(rule) === "active" ? "avail-default" : "avail-optional"}`}>
                    {statusOf(rule).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" type="button" onClick={() => setMode("hub")}>Back to rules</button>
                <button className="btn btn-ghost" type="button" disabled={readOnly} onClick={() => deleteRule(active)}>Delete</button>
              </div>
            </div>

            <Accordion
              n={1}
              title="Rule Identity"
              subtitle={`${str(rule, "category", "Product Eligibility")} · Priority ${str(rule, "priority", "10")}`}
              open={open.identity}
              onToggle={() => setOpen((s) => ({ ...s, identity: !s.identity }))}
            >
              <div className="form-grid-2">
                <Field label="Rule Name">
                  <input className="form-control" disabled={readOnly} value={str(rule, "name")} onChange={(e) => update("name", e.target.value)} />
                </Field>
                <Field label="Rule Code">
                  <input className="form-control text-mono" disabled={readOnly} value={str(rule, "id")} onChange={(e) => update("id", e.target.value)} />
                </Field>
                <Field label="Rule Category">
                  <select className="form-control" disabled={readOnly} value={str(rule, "category", "Product Eligibility")} onChange={(e) => update("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <input className="form-control" type="number" disabled={readOnly} value={str(rule, "priority", "10")} onChange={(e) => update("priority", e.target.value)} />
                </Field>
                <Field label="Applicable Cover">
                  <select className="form-control" disabled={readOnly} value={str(rule, "cover", "All Covers")} onChange={(e) => update("cover", e.target.value)}>
                    {coverNames.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <Toggle
                    checked={statusOf(rule) === "active"}
                    disabled={readOnly}
                    label={statusOf(rule) === "active" ? "Active" : "Inactive"}
                    onChange={(on) => update("status", on ? "active" : "inactive")}
                  />
                </Field>
                <Field label="Description" span>
                  <textarea className="form-control" rows={3} disabled={readOnly} value={str(rule, "description")} onChange={(e) => update("description", e.target.value)} />
                </Field>
              </div>
            </Accordion>

            <Accordion n={2} title="Condition Builder" subtitle={preview(rule)} open={open.condition} onToggle={() => setOpen((s) => ({ ...s, condition: !s.condition }))}>
              <div className="condition-builder">
                <div className="cb-header">
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {str(rule, "direction", "ineligible").toUpperCase()} when {str(rule, "logic", "AND").toUpperCase()} of the following are true
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      const next = [...conditionsOf(rule), { connector: "AND", field: "", op: "=", value: "" }];
                      setRows(patchRow(rows, active, "conditions", next).map((r, i) => (i === active ? withSyncedConditions(r, next) : r)));
                    }}
                  >
                    + Add condition
                  </button>
                </div>
                {conditionsOf(rule).map((c, i) => (
                  <div key={i}>
                    {i > 0 ? <div className="elg-and" style={{ padding: "4px 16px" }}>{c.connector || "AND"}</div> : null}
                    <div className="cb-row">
                      <select
                        className="form-control"
                        disabled={readOnly}
                        value={c.field || ""}
                        onChange={(e) => {
                          const next = conditionsOf(rule).map((row, ri) => (ri === i ? { ...row, field: e.target.value } : row));
                          setRows(rows.map((r, ri) => (ri === active ? withSyncedConditions(r, next) : r)));
                        }}
                      >
                        <option value="">Select attribute…</option>
                        {fields.map((field) => (
                          <option key={field} value={field}>{prettyField(field)}</option>
                        ))}
                      </select>
                      <select
                        className="form-control"
                        style={{ width: 120 }}
                        disabled={readOnly}
                        value={opOf(c)}
                        onChange={(e) => {
                          const next = conditionsOf(rule).map((row, ri) => (ri === i ? { ...row, op: e.target.value, operator: e.target.value } : row));
                          setRows(rows.map((r, ri) => (ri === active ? withSyncedConditions(r, next) : r)));
                        }}
                      >
                        {OPERATORS.map((op) => <option key={op}>{op}</option>)}
                      </select>
                      <input
                        className="form-control"
                        disabled={readOnly}
                        value={c.value || ""}
                        placeholder="value"
                        onChange={(e) => {
                          const next = conditionsOf(rule).map((row, ri) => (ri === i ? { ...row, value: e.target.value } : row));
                          setRows(rows.map((r, ri) => (ri === active ? withSyncedConditions(r, next) : r)));
                        }}
                      />
                    </div>
                  </div>
                ))}
                {!conditionsOf(rule).length ? (
                  <div className="cb-row">
                    <span className="text-muted">No conditions — add one to evaluate this rule.</span>
                  </div>
                ) : null}
              </div>
              <div className="rule-preview-box mt-4">
                <div className="rp-title">Logic preview</div>
                <div className="rp-line">{preview(rule)}</div>
              </div>
            </Accordion>

            <Accordion n={3} title="Outcome" subtitle={str(rule, "outcome", "ineligible")} open={open.outcome} onToggle={() => setOpen((s) => ({ ...s, outcome: !s.outcome }))}>
              <div className="outcome-type-selector">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`outcome-card ${str(rule, "outcome") === o.id ? "selected" : ""}`}
                    disabled={readOnly}
                    onClick={() => update("outcome", o.id)}
                  >
                    <div className="outcome-card-label">{o.label}</div>
                    <div className="outcome-card-desc">{o.desc}</div>
                  </button>
                ))}
              </div>
              <Field label="Customer message">
                <textarea className="form-control" rows={3} disabled={readOnly} value={str(rule, "customerMsg")} onChange={(e) => update("customerMsg", e.target.value)} />
              </Field>
              <div className="form-grid-2 mt-4">
                <Field label="Reason code">
                  <input className="form-control text-mono" disabled={readOnly} value={str(rule, "reasonCode")} onChange={(e) => update("reasonCode", e.target.value)} />
                </Field>
                <Field label="Outcome type">
                  <select className="form-control" disabled={readOnly} value={str(rule, "outcomeType", "hard")} onChange={(e) => update("outcomeType", e.target.value)}>
                    <option value="hard">Hard</option>
                    <option value="soft">Soft</option>
                    <option value="refer">Refer</option>
                  </select>
                </Field>
                <Field label="Internal message" span>
                  <textarea className="form-control" rows={2} disabled={readOnly} value={str(rule, "internalMsg")} onChange={(e) => update("internalMsg", e.target.value)} />
                </Field>
              </div>
            </Accordion>
            <EditorActions pending={pending} readOnly={readOnly} onDiscard={() => { setRows(items); setMode("hub"); }} onSave={() => save()} />
          </div>
        </div>
      ) : (
        <>
          <div className="elg-tabs" role="tablist">
            <button type="button" className={tab === "rules" ? "active" : ""} onClick={() => setTab("rules")}>Eligibility Rules ({rows.length})</button>
            <button type="button" className={tab === "sets" ? "active" : ""} onClick={() => setTab("sets")}>Rule Sets ({ruleSets.length})</button>
            <button type="button" className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}>Summary</button>
          </div>

          <div className="elg-hub">
            <div className="elg-main">
              {tab === "rules" ? (
                <div className="card elg-table-card">
                  <div className="elg-toolbar">
                    <input
                      className="form-control elg-search"
                      placeholder="Search rules..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select className="form-control elg-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <button className="btn btn-blue" type="button" disabled={readOnly} onClick={() => addRule()}>+ Add Eligibility Rule</button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Rule Name</th>
                          <th>Rule Code</th>
                          <th>Conditions</th>
                          <th>Outcome</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-muted" style={{ height: 72 }}>No eligibility rules match this filter.</td>
                          </tr>
                        ) : filtered.map(({ row, index }) => {
                          const meta = OUTCOME_META[outcomeOf(row)] || OUTCOME_META.ineligible;
                          return (
                            <tr
                              key={str(row, "id", String(index))}
                              className={index === active ? "selected" : ""}
                              onClick={() => setActive(index)}
                            >
                              <td className="fw-600">{str(row, "name")}</td>
                              <td className="mono">{str(row, "id")}</td>
                              <td>{conditionText(row)}</td>
                              <td>{meta.label}</td>
                              <td>
                                <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                                  <button className="elg-icon-btn" type="button" title="Edit" onClick={() => { setActive(index); setMode("edit"); }}>
                                    <Icon name="edit" />
                                  </button>
                                  <button className="elg-icon-btn" type="button" title="Copy" disabled={readOnly} onClick={() => copyRule(index)}>
                                    <Icon name="copy" />
                                  </button>
                                  <button className="elg-icon-btn danger" type="button" title="Delete" disabled={readOnly} onClick={() => deleteRule(index)}>
                                    <Icon name="trash" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {tab === "sets" ? (
                <div className="elg-set-grid">
                  {ruleSets.map((set) => (
                    <div className="card" key={set.name}>
                      <div className="card-header">
                        <div>
                          <div className="card-title">{set.name}</div>
                          <div className="card-subtitle">{set.count} rules in this set</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" type="button" disabled={readOnly} onClick={() => addRule(set.name)}>+ Add</button>
                      </div>
                      <div className="card-body" style={{ paddingTop: 8 }}>
                        {set.rules.map(({ row, index }) => (
                          <button
                            key={str(row, "id", String(index))}
                            type="button"
                            className="elg-set-row"
                            onClick={() => { setActive(index); setMode("edit"); }}
                          >
                            <span>{str(row, "name")}</span>
                            <span className="text-muted">{conditionText(row)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {tab === "summary" ? (
                <div className="card">
                  <div className="card-header"><div className="card-title">Eligibility summary</div></div>
                  <div className="card-body">
                    <p className="text-muted" style={{ marginBottom: 16 }}>{productName} evaluates {rows.length} eligibility rules across {ruleSets.length} rule sets before a quote can proceed.</p>
                    <div className="elg-summary-grid">
                      <div><div className="elg-kpi">{rows.length}</div><div className="text-muted">Total rules</div></div>
                      <div><div className="elg-kpi">{activeCount}</div><div className="text-muted">Active</div></div>
                      <div><div className="elg-kpi">{rows.length - activeCount}</div><div className="text-muted">Inactive</div></div>
                      <div><div className="elg-kpi">{ruleSets.length}</div><div className="text-muted">Rule sets</div></div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="card elg-logic">
                <div className="card-header">
                  <div className="card-title">Rule Logic Example</div>
                  {rule ? <span className="text-muted" style={{ fontSize: 12 }}>{str(rule, "name")}</span> : null}
                </div>
                <div className="elg-logic-body">
                  <div className="elg-if">
                    <div className="elg-logic-kicker">IF ALL of the following are true</div>
                    {(rows.length ? rows : []).slice(0, 6).map((r, i, list) => (
                      <div className="elg-if-row" key={str(r, "id", String(i))}>
                        <span>{passCondition(r)}</span>
                        {i < list.length - 1 ? <span className="elg-and">AND</span> : null}
                      </div>
                    ))}
                    {rows.length === 0 ? <div className="text-muted">Add a rule to preview eligibility logic.</div> : null}
                  </div>
                  <div className="elg-then">
                    <div className="elg-logic-kicker">THEN</div>
                    <div className="elg-then-result">
                      <span className="elg-then-dot" /> Eligible
                    </div>
                  </div>
                </div>
                <div className="elg-logic-note">
                  <Icon name="info" />
                  Rules are evaluated in the order shown. The first failing rule will determine the outcome.
                </div>
              </div>
            </div>

            <aside className="elg-side">
              <div className="card">
                <div className="card-header"><div className="card-title">Eligibility Summary</div></div>
                <div className="card-body">
                  <dl className="elg-dl">
                    <dt>Total Rules</dt><dd>{rows.length}</dd>
                    <dt>Active Rules</dt><dd>{activeCount}</dd>
                    <dt>Inactive Rules</dt><dd>{rows.length - activeCount}</dd>
                    <dt>Rule Sets</dt><dd>{ruleSets.length}</dd>
                  </dl>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Rule Outcomes</div></div>
                <div className="card-body elg-outcome-card">
                  <OutcomeDonut slices={outcomeSlices} total={rows.length} />
                  <ul className="elg-legend">
                    {outcomeSlices.map((s) => (
                      <li key={s.label}>
                        <span className="ph-dot" style={{ background: s.color }} />
                        {s.label} ({s.count}, {rows.length ? Math.round((s.count / rows.length) * 100) : 0}%)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Linked Items</div></div>
                <div className="card-body">
                  <dl className="elg-dl">
                    <dt>Questions</dt><dd>{qCount}</dd>
                    <dt>Coverages</dt><dd>{covers.length}</dd>
                    <dt>Underwriting Rules</dt><dd>{underwriting.length}</dd>
                  </dl>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      <SaveToast show={saved} />

      {validateOpen ? (
        <div className="studio-modal-overlay" onClick={() => setValidateOpen(false)}>
          <div className="studio-modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <div className="card-title">Validate eligibility rules</div>
              <button className="btn btn-ghost" type="button" onClick={() => setValidateOpen(false)}>Close</button>
            </div>
            <div className="studio-modal-body">
              {issues.length === 0 ? (
                <p>All {rows.length} rules have a name, field, and value. No conflicts detected.</p>
              ) : (
                <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              )}
              <div className="flex gap-2 mt-4">
                <button className="btn btn-secondary" type="button" onClick={() => { setValidateOpen(false); setTestOpen(true); }}>Test Eligibility</button>
                <button className="btn btn-primary" type="button" onClick={() => setValidateOpen(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {testOpen ? (
        <div className="studio-modal-overlay" onClick={() => setTestOpen(false)}>
          <div className="studio-modal" style={{ width: 860 }} onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <div className="card-title">Test Eligibility — {productName}</div>
              <button className="btn btn-ghost" type="button" onClick={() => setTestOpen(false)}>Close</button>
            </div>
            <div className="studio-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                {fields.map((field) => (
                  <div className="form-group" key={field}>
                    <label className="form-label">{prettyField(field)}</label>
                    <input className="form-control" value={answers[field] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div>
                {results.map(({ rule: r, hit }) => (
                  <div key={str(r, "id")} className={`test-result-item ${hit ? "test-fail" : hit === false ? "test-pass" : "test-na"}`}>
                    <div>
                      <div className="fw-600">{str(r, "name")}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{preview(r)} — {hit ? "FIRES" : hit === false ? "clear" : "no input"}</div>
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
