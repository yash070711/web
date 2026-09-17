"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTION_TYPES, questionTypeLabel } from "@/lib/questionnaire-seed";
import {
  Accordion,
  ContextBar,
  EditorActions,
  Field,
  PublishedBanner,
  SaveToast,
  StudioHeader,
  Toggle,
  str,
  useStudioSave,
  type Row,
} from "./shared";

const CHANNELS = ["Web", "Mobile", "Agent", "API"];

const QUESTION_CATEGORIES = [
  { id: "general", label: "General question", short: "General" },
  { id: "risk", label: "Risk-related question", short: "Risk" },
  { id: "eligibility", label: "Eligibility-related question", short: "Eligibility" },
] as const;

function questionCategoryLabel(id: string) {
  return QUESTION_CATEGORIES.find((c) => c.id === id)?.label || "General question";
}

const EVIDENCE_TRIGGER_TYPES = [
  { id: "document_required", label: "Document Required", desc: "Trigger when a specific document is required", icon: "📄", tone: "#A78BFA" },
  { id: "answer_selected", label: "Answer Selected", desc: "Trigger when a specific answer is selected", icon: "✓", tone: "#2DD4BF" },
  { id: "value_equals", label: "Value Equals", desc: "Trigger when a field value equals a specific value", icon: "=", tone: "#FB923C" },
  { id: "value_contains", label: "Value Contains", desc: "Trigger when a field value contains specific text", icon: "⌕", tone: "#60A5FA" },
  { id: "value_gt", label: "Value Greater Than", desc: "Trigger when a field value is greater than", icon: "↑", tone: "#4ADE80" },
  { id: "value_lt", label: "Value Less Than", desc: "Trigger when a field value is less than", icon: "↓", tone: "#F87171" },
  { id: "custom", label: "Custom Condition", desc: "Create a custom trigger condition", icon: "⛭", tone: "#94A3B8" },
] as const;

const LEGACY_EVIDENCE_TYPE_MAP: Record<string, string> = {
  "Document Required": "document_required",
  "Inspection Required": "document_required",
  "Photo Required": "document_required",
  "Tracker Certificate": "document_required",
  "HGV licence scan": "document_required",
  Declaration: "custom",
};

function evidenceTriggerMeta(row: Row) {
  const rawType = str(row, "conditionType") || LEGACY_EVIDENCE_TYPE_MAP[str(row, "type")] || str(row, "type");
  const meta = EVIDENCE_TRIGGER_TYPES.find((t) => t.id === rawType)
    || EVIDENCE_TRIGGER_TYPES.find((t) => t.label === str(row, "type"))
    || EVIDENCE_TRIGGER_TYPES[0];
  return meta;
}

function evidenceDetailPlaceholder(typeId: string) {
  if (typeId === "answer_selected") return "e.g. Yes, Modified, Commercial use";
  if (typeId === "value_contains") return "Text the answer should contain";
  if (typeId === "value_gt" || typeId === "value_lt") return "Numeric threshold";
  if (typeId === "value_equals") return "Exact value to match";
  if (typeId === "custom") return "Describe the custom condition…";
  return "";
}

function EvidenceTriggerRow({
  row,
  readOnly,
  open,
  onToggleOpen,
  onChange,
  onRemove,
}: {
  row: Row;
  readOnly: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (next: Row) => void;
  onRemove: () => void;
}) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const meta = evidenceTriggerMeta(row);
  const message = str(row, "message");
  const showDetail = meta.id !== "document_required" || Boolean(str(row, "condition").trim());

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      onToggleOpen();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onToggleOpen]);

  return (
    <div className="evidence-row">
      <span className="evidence-row-icon" aria-hidden>⚠</span>
      <div className="evidence-trigger-body">
        <div className="evidence-trigger-grid">
          <div className="evidence-trigger-field">
            <label>When this is true…</label>
            <div className={`evidence-condition-picker ${open ? "open" : ""}`} ref={pickerRef}>
              <button
                type="button"
                className="evidence-condition-trigger"
                disabled={readOnly}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={onToggleOpen}
              >
                <span>{meta.label}</span>
                <span className="caret">▾</span>
              </button>
              {open && !readOnly ? (
                <div className="evidence-condition-menu" role="listbox">
                  {EVIDENCE_TRIGGER_TYPES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`evidence-condition-option ${option.id === meta.id ? "selected" : ""}`}
                      role="option"
                      onClick={() => onChange({ ...row, conditionType: option.id, type: option.label })}
                    >
                      <span className="evidence-condition-icon" style={{ background: `${option.tone}22`, color: option.tone }}>
                        {option.icon}
                      </span>
                      <span className="evidence-condition-copy">
                        <strong>{option.label}</strong>
                        <span>{option.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {showDetail ? (
              <div className="evidence-condition-detail">
                <input
                  className="form-control"
                  disabled={readOnly}
                  value={str(row, "condition")}
                  placeholder={evidenceDetailPlaceholder(meta.id)}
                  onChange={(e) => onChange({ ...row, condition: e.target.value })}
                />
              </div>
            ) : null}
          </div>
          <div className="evidence-trigger-field">
            <label>Message shown to the user</label>
            <div className="evidence-message-wrap">
              <textarea
                className="form-control"
                rows={2}
                maxLength={200}
                disabled={readOnly}
                placeholder="Enter message to display to the user"
                value={message}
                onChange={(e) => onChange({ ...row, message: e.target.value })}
              />
              <span className="evidence-char-count">{message.length}/200</span>
            </div>
          </div>
          {readOnly ? null : (
            <button className="evidence-remove" type="button" onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function asGroups(items: Row[]): Row[] {
  if (!items.length) return [];
  if (Array.isArray(items[0]?.questions)) return items;
  return [{ id: "GRP-001", name: "Questions", label: "Questions", questions: items }];
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

function typeLabel(q: Row) {
  return str(q, "typeLabel") || questionTypeLabel(str(q, "fieldType") || str(q, "type"));
}

function parseChannels(value: string) {
  return CHANNELS.filter((c) => value.toLowerCase().includes(c.toLowerCase()));
}

function optionsOf(q: Row): Row[] {
  if (Array.isArray(q.options)) return q.options as Row[];
  return str(q, "options")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ value: s, label: s }));
}

function derivedOf(q: Row): Row | null {
  if (q.derived && typeof q.derived === "object" && !Array.isArray(q.derived)) return q.derived as Row;
  return null;
}

function hasConditions(q: Row) {
  return asRows(q.conditions).length > 0 || Boolean(q.conditional) || Boolean(str(q, "visibleWhen"));
}

function hasEvidence(q: Row) {
  return asRows(q.evidence).length > 0 || Boolean(str(q, "evidence"));
}

function hasDerived(q: Row) {
  return Boolean(derivedOf(q) || q.derived === true || str(q, "derivedFrom"));
}

export function QuestionnaireStudio({
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
  const [groups, setGroups] = useState<Row[]>(asGroups(items));
  const [sel, setSel] = useState(() => {
    const g = asGroups(items);
    const qs = asRows(g[0]?.questions);
    return { g: 0, q: qs.length > 1 ? 1 : 0 };
  });
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [open, setOpen] = useState({ identity: true, field: true, validation: true, conditional: true, evidence: true });
  const [openEvidencePicker, setOpenEvidencePicker] = useState<number | null>(null);
  const [groupMenuGi, setGroupMenuGi] = useState<number | null>(null);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [addQuestionForm, setAddQuestionForm] = useState({
    label: "",
    type: "text",
    bindPhase: "pre-bind",
    groupIndex: 0,
  });
  const readOnly = status === "published";
  const { pending, saved, save } = useStudioSave(productId, version, "questionGroups", groups);

  const group = groups[sel.g];
  const questions = asRows(group?.questions);
  const question = questions[sel.q] || questions[0];
  const questionCount = groups.reduce((n, g) => n + asRows(g.questions).length, 0);
  const validations = asRows(question?.validations);
  const conditions = asRows(question?.conditions);
  const evidenceRows = asRows(question?.evidence);
  const repeatQuestions = asRows(question?.repeatQuestions);
  const qType = question ? (str(question, "fieldType") || str(question, "type")) : "text";

  function setQuestion(patch: Row) {
    if (readOnly || !group || !question) return;
    const next = groups.map((g, gi) => {
      if (gi !== sel.g) return g;
      const qs = [...asRows(g.questions)];
      qs[sel.q] = { ...qs[sel.q], ...patch };
      return { ...g, questions: qs };
    });
    setGroups(next);
  }

  function addGroup() {
    if (readOnly) return;
    const next = [...groups, { id: `grp-${Date.now()}`, name: "New group", label: "New group", bindPhase: "pre-bind", open: false, questions: [] }];
    setGroups(next);
    setSel({ g: next.length - 1, q: 0 });
  }

  function groupBindPhase(g: Row) {
    return str(g, "bindPhase") === "post-bind" ? "post-bind" : "pre-bind";
  }

  function groupsInPhase(phase: string) {
    return groups.map((group, index) => ({ group, index })).filter(({ group }) => groupBindPhase(group) === phase);
  }

  function openAddQuestionModal(groupIndex?: number) {
    if (readOnly) return;
    const gi = groupIndex ?? activeGroupIndex();
    const g = groups[gi];
    const phase = g ? groupBindPhase(g) : "pre-bind";
    const phaseGroups = groupsInPhase(phase);
    const resolvedGi = g && groupBindPhase(g) === phase
      ? gi
      : (phaseGroups[0]?.index ?? gi);
    setAddQuestionForm({
      label: "",
      type: "text",
      bindPhase: phase,
      groupIndex: Math.max(0, resolvedGi),
    });
    setAddQuestionOpen(true);
  }

  function submitAddQuestion() {
    const label = addQuestionForm.label.trim();
    if (!label) return;
    const id = `QST-${String(questionCount + 1).padStart(3, "0")}`;
    const newQ: Row = {
      id,
      label,
      internalName: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "question",
      type: addQuestionForm.type,
      fieldType: addQuestionForm.type,
      typeLabel: questionTypeLabel(addQuestionForm.type),
      required: true,
      helpText: "",
      channels: "Web, Mobile, Agent, API",
      validations: [],
      conditions: [],
      evidence: [],
    };
    const phaseGroups = groupsInPhase(addQuestionForm.bindPhase);
    let targetGi = addQuestionForm.groupIndex;
    const current = groups[targetGi];
    if (!current || groupBindPhase(current) !== addQuestionForm.bindPhase) {
      const match = phaseGroups.find(({ index }) => index === addQuestionForm.groupIndex);
      targetGi = match?.index ?? phaseGroups[0]?.index ?? -1;
    }
    if (targetGi < 0) {
      const created = {
        id: `grp-${Date.now()}`,
        name: "General",
        label: "General",
        bindPhase: addQuestionForm.bindPhase,
        open: false,
        questions: [newQ],
      };
      setGroups([...groups, created]);
      setSel({ g: groups.length, q: 0 });
    } else {
      const qs = [...asRows(groups[targetGi].questions), newQ];
      setGroups(groups.map((row, i) => (i === targetGi ? { ...row, questions: qs } : row)));
      setSel({ g: targetGi, q: qs.length - 1 });
    }
    setAddQuestionOpen(false);
  }

  function addQuestion(gi: number) {
    openAddQuestionModal(gi);
  }

  function removeQuestion(gi: number, qi: number) {
    if (readOnly) return;
    const g = groups[gi];
    const qs = asRows(g.questions);
    const label = str(qs[qi], "label") || "this question";
    if (!window.confirm(`Remove "${label}" from this product?`)) return;
    const nextQs = qs.filter((_, i) => i !== qi);
    setGroups(groups.map((row, i) => (i === gi ? { ...row, questions: nextQs } : row)));
    if (sel.g === gi) {
      setSel({ g: gi, q: Math.max(0, Math.min(qi, nextQs.length - 1)) });
    }
  }

  function removeGroup(gi: number) {
    if (readOnly) return;
    const g = groups[gi];
    const label = str(g, "name") || str(g, "label") || "this group";
    const count = asRows(g.questions).length;
    const msg = count
      ? `Remove "${label}" and its ${count} question${count === 1 ? "" : "s"} from this product?`
      : `Remove empty group "${label}" from this product?`;
    if (!window.confirm(msg)) return;
    const next = groups.filter((_, i) => i !== gi);
    setGroups(next);
    if (!next.length) {
      setSel({ g: 0, q: 0 });
      return;
    }
    setSel({ g: Math.max(0, Math.min(sel.g, next.length - 1)), q: 0 });
  }

  function toggleChannel(channel: string, on: boolean) {
    const current = parseChannels(str(question, "channels"));
    const next = on ? [...new Set([...current, channel])] : current.filter((c) => c !== channel);
    setQuestion({ channels: next.join(", ") });
  }

  const flows = groups.reduce((n, g) => n + asRows(g.questions).filter((q) => hasConditions(q)).length, 0);
  const repeats = groups.reduce((n, g) => n + asRows(g.questions).filter((q) => str(q, "type") === "repeat" || str(q, "fieldType") === "repeat").length, 0);

  function expandAllGroups() {
    setCollapsed({});
  }

  function collapseAllGroups() {
    const all: Record<number, boolean> = {};
    groups.forEach((_, i) => { all[i] = true; });
    setCollapsed(all);
  }

  function activeGroupIndex() {
    if (sel.g >= 0 && sel.g < groups.length) return sel.g;
    return groups.length ? 0 : -1;
  }

  function renderGroupRow(g: Row, gi: number) {
    const qs = asRows(g.questions);
    const closed = collapsed[gi];
    const menuOpen = groupMenuGi === gi;
    return (
      <div className="q-group" key={str(g, "id", String(gi))}>
        <div className="q-group-header" onClick={() => setCollapsed((c) => ({ ...c, [gi]: !c[gi] }))}>
          <span className={`section-chevron q-group-chevron ${closed ? "" : "open"}`}>›</span>
          <div className="q-group-label">{str(g, "name") || str(g, "label")}</div>
          <span className="q-group-count">{qs.length}</span>
          {readOnly ? null : (
            <>
              <button
                type="button"
                className="q-group-kebab"
                title="Group actions"
                aria-label="Group actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setGroupMenuGi(menuOpen ? null : gi);
                }}
              >
                ⋮
              </button>
              {menuOpen ? (
                <div
                  className="dropdown-menu"
                  style={{ position: "absolute", right: 12, top: "100%", zIndex: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button type="button" className="dropdown-item" onClick={() => { addQuestion(gi); setGroupMenuGi(null); }}>Add question</button>
                  <div className="dropdown-sep" />
                  <button type="button" className="dropdown-item danger" onClick={() => { setGroupMenuGi(null); removeGroup(gi); }}>Remove group</button>
                </div>
              ) : null}
            </>
          )}
        </div>
        {closed ? null : (
          <div className="q-items">
            {qs.map((q, qi) => (
              <div
                key={str(q, "id", String(qi))}
                className={`q-item ${sel.g === gi && sel.q === qi ? "active" : ""}`}
                onClick={() => setSel({ g: gi, q: qi })}
              >
                <span className="q-item-dot" />
                <span className="q-item-label">
                  {str(q, "label")}
                  {str(q, "type") === "repeat" || str(q, "fieldType") === "repeat" ? <span className="q-repeatable-badge">REPEAT</span> : null}
                </span>
                {hasConditions(q) ? <span className="q-item-conditional" title="Has conditions">⚡</span> : null}
                {hasEvidence(q) ? <span title="Triggers evidence" style={{ fontSize: 11 }}>⚠</span> : null}
                {hasDerived(q) ? <span title="Has derived value" style={{ color: "var(--color-brand)", fontSize: 11 }}>ƒ</span> : null}
                <span className="q-item-type">{typeLabel(q)}</span>
                {readOnly ? null : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    title="Remove question"
                    aria-label="Remove question"
                    style={{ color: "var(--color-danger, #dc2626)", padding: "0 4px", minHeight: 22 }}
                    onClick={(e) => { e.stopPropagation(); removeQuestion(gi, qi); }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button className="q-add-btn" type="button" disabled={readOnly} onClick={() => addQuestion(gi)}>+ Add question</button>
          </div>
        )}
      </div>
    );
  }

  function renderPhaseSection(phaseKey: string, phaseLabel: string, phaseGroups: { group: Row; index: number }[]) {
    if (!phaseGroups.length) return null;
    const count = phaseGroups.reduce((n, { group }) => n + asRows(group.questions).length, 0);
    return (
      <div className="q-phase" data-phase={phaseKey} key={phaseKey}>
        <div className="q-phase-header">
          <span className="q-phase-label">{phaseLabel}</span>
          <span className="q-phase-count">{count}</span>
        </div>
        {phaseGroups.map(({ group, index }) => renderGroupRow(group, index))}
      </div>
    );
  }

  const preBindGroups = groups
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => str(group, "bindPhase") !== "post-bind");
  const postBindGroups = groups
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => str(group, "bindPhase") === "post-bind");

  useEffect(() => {
    if (groupMenuGi === null) return;
    const close = () => setGroupMenuGi(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [groupMenuGi]);

  return (
    <>
      <StudioHeader
        title="Questionnaire Guide"
        subtitle={`${productName} · v${version} — ${questionCount} questions · ${groups.length} groups · ${flows} conditional flows · ${repeats} repeatable groups`}
        productId={productId}
        moduleId="questionnaire"
        extra={(
          <>
            <button className="btn btn-ghost" type="button" onClick={() => window.open(`/products/${productId}/view`, "_blank")}>Preview Flow</button>
            <button className="btn btn-secondary" type="button" disabled={readOnly} onClick={addGroup}>+ Add Group</button>
            <button className="btn btn-primary" type="button" disabled={readOnly} onClick={() => openAddQuestionModal()}>+ Add Question</button>
          </>
        )}
      />

      <ContextBar
        productId={productId}
        version={version}
        summary={`${questionCount} questions · ${groups.length} groups · ${flows} conditional flows · ${repeats} repeatable groups`}
        studioId="questionnaire"
        itemCount={questionCount}
      />
      <PublishedBanner productId={productId} studio="questionnaire" readOnly={readOnly} />

      <div className="studio-layout">
        <aside className="q-tree-sidebar">
          <div className="card">
            <div className="q-sidebar-header">
              <div className="q-sidebar-header-top">
                <div>
                  <div className="q-sidebar-title-lg">Questions</div>
                  <div className="q-sidebar-count">
                    {questionCount
                      ? `${questionCount} question${questionCount === 1 ? "" : "s"} · ${groups.length} group${groups.length === 1 ? "" : "s"}`
                      : "No questions yet"}
                  </div>
                </div>
                <div className="q-sidebar-icon-actions">
                  <button className="btn btn-ghost btn-sm" type="button" onClick={expandAllGroups} title="Expand all">⤢</button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={collapseAllGroups} title="Collapse all">⤡</button>
                </div>
              </div>
              <div className="q-sidebar-header-actions">
                <button className="btn btn-ghost btn-sm" type="button" disabled={readOnly} onClick={addGroup}>+ Group</button>
                <button className="btn btn-primary btn-sm" type="button" disabled={readOnly || activeGroupIndex() < 0} onClick={() => openAddQuestionModal(activeGroupIndex())}>+ Question</button>
              </div>
            </div>
            <div className="q-tree-scroll">
              <div className="q-tree">
                {renderPhaseSection("pre-bind", "Pre-bind", preBindGroups)}
                {renderPhaseSection("post-bind", "Post-bind", postBindGroups)}
              </div>
            </div>
          </div>
        </aside>

        <div className="detail-panel">
          {question ? (
            <>
              <div className="detail-head">
                <div>
                  <h2>{str(question, "label")}</h2>
                  <div className="flex-center gap-2 mt-2">
                    <span className="avail-badge avail-optional">{str(question, "id")}</span>
                    {question.required ? <span className="avail-badge avail-mandatory">REQUIRED</span> : <span className="avail-badge avail-optional">OPTIONAL</span>}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={readOnly}
                  onClick={() => removeQuestion(sel.g, sel.q)}
                >
                  Remove question
                </button>
              </div>

              <Accordion n={1} title="Identity" subtitle="Label, group, channel visibility" open={open.identity} onToggle={() => setOpen((s) => ({ ...s, identity: !s.identity }))}>
                <div className="form-grid-2">
                  <Field label="Question Label">
                    <input className="form-control" disabled={readOnly} value={str(question, "label")} onChange={(e) => setQuestion({ label: e.target.value, internalName: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "question" })} />
                  </Field>
                  <Field label="Question ID">
                    <input className="form-control text-mono" readOnly value={str(question, "id")} />
                  </Field>
                  <Field label="Question Group">
                    <select className="form-control" disabled={readOnly} value={str(group, "id")} onChange={(e) => {
                      const to = groups.findIndex((g) => str(g, "id") === e.target.value);
                      if (to < 0 || to === sel.g) return;
                      const moving = questions[sel.q];
                      const next = groups.map((g, i) => {
                        if (i === sel.g) return { ...g, questions: questions.filter((_, qi) => qi !== sel.q) };
                        if (i === to) return { ...g, questions: [...asRows(g.questions), moving] };
                        return g;
                      });
                      setGroups(next);
                      setSel({ g: to, q: asRows(groups[to].questions).length });
                    }}>
                      {groups.map((g) => <option key={str(g, "id")} value={str(g, "id")}>{str(g, "name") || str(g, "label")}</option>)}
                    </select>
                  </Field>
                  <Field label="Question Category">
                    <select
                      className="form-control"
                      disabled={readOnly}
                      value={str(question, "questionCategory", "general")}
                      onChange={(e) => setQuestion({ questionCategory: e.target.value })}
                    >
                      {QUESTION_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Help Text" span>
                    <textarea className="form-control" rows={3} disabled={readOnly} value={str(question, "helpText")} onChange={(e) => setQuestion({ helpText: e.target.value })} />
                  </Field>
                  <Field label="Channel Visibility" span>
                    <div className="channel-checks">
                      {CHANNELS.map((c) => (
                        <label key={c} className="channel-check">
                          <input type="checkbox" disabled={readOnly} checked={parseChannels(str(question, "channels")).includes(c)} onChange={(e) => toggleChannel(c, e.target.checked)} />
                          {c}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </Accordion>

              <Accordion n={2} title="Field Configuration" subtitle={typeLabel(question)} open={open.field} onToggle={() => setOpen((s) => ({ ...s, field: !s.field }))}>
                {qType === "repeat" ? (
                  <>
                    <div className="form-grid-3">
                      <Field label="Min Occurrences"><input className="form-control" disabled={readOnly} value={str(question, "repeatMin", "0")} onChange={(e) => setQuestion({ repeatMin: e.target.value })} /></Field>
                      <Field label="Max Occurrences"><input className="form-control" disabled={readOnly} value={str(question, "repeatMax", "5")} onChange={(e) => setQuestion({ repeatMax: e.target.value })} /></Field>
                      <Field label="Add Button Label"><input className="form-control" disabled={readOnly} value={str(question, "addLabel", "Add item")} onChange={(e) => setQuestion({ addLabel: e.target.value })} /></Field>
                    </div>
                    <Field label="Display Label"><input className="form-control" disabled={readOnly} value={str(question, "displayLabel")} onChange={(e) => setQuestion({ displayLabel: e.target.value })} /></Field>
                    <div className="form-label" style={{ marginTop: 16 }}>Questions in this group</div>
                    {repeatQuestions.map((rq, i) => (
                      <div key={i} className="option-row">
                        <span className="text-muted" style={{ width: 20 }}>{i + 1}</span>
                        <input className="form-control" style={{ flex: 1 }} disabled={readOnly} value={str(rq, "label")} onChange={(e) => {
                          const next = repeatQuestions.map((row, ri) => (ri === i ? { ...row, label: e.target.value } : row));
                          setQuestion({ repeatQuestions: next });
                        }} />
                        <span className="q-item-type">{questionTypeLabel(str(rq, "type"))}</span>
                        {rq.required ? <span className="avail-badge avail-mandatory">REQUIRED</span> : null}
                        {readOnly ? null : <button className="btn btn-ghost btn-sm" type="button" onClick={() => setQuestion({ repeatQuestions: repeatQuestions.filter((_, ri) => ri !== i) })}>Remove</button>}
                      </div>
                    ))}
                    {readOnly ? null : <button className="btn btn-secondary btn-sm" type="button" onClick={() => setQuestion({ repeatQuestions: [...repeatQuestions, { label: "New field", type: "text", required: true }] })}>+ Add field</button>}
                  </>
                ) : (
                  <div className="form-grid-2">
                    <Field label="Field Type">
                      <select className="form-control" disabled={readOnly} value={qType} onChange={(e) => {
                        const t = QUESTION_TYPES.find((x) => x.id === e.target.value);
                        setQuestion({ type: e.target.value, fieldType: e.target.value, typeLabel: t?.label || e.target.value });
                      }}>
                        {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Input Format"><input className="form-control" disabled={readOnly} value={str(question, "inputFormat")} onChange={(e) => setQuestion({ inputFormat: e.target.value })} /></Field>
                    <Field label="Minimum Value"><input className="form-control" disabled={readOnly} value={str(question, "min") || str(question, "minVal")} onChange={(e) => setQuestion({ min: e.target.value, minVal: e.target.value })} /></Field>
                    <Field label="Maximum Value"><input className="form-control" disabled={readOnly} value={str(question, "max") || str(question, "maxVal")} onChange={(e) => setQuestion({ max: e.target.value, maxVal: e.target.value })} /></Field>
                    <Field label="Placeholder"><input className="form-control" disabled={readOnly} value={str(question, "placeholder") || str(question, "example")} onChange={(e) => setQuestion({ placeholder: e.target.value })} /></Field>
                    <Field label="Required">
                      <Toggle checked={Boolean(question.required)} disabled={readOnly} label={question.required ? "Yes" : "No"} onChange={(on) => setQuestion({ required: on })} />
                    </Field>
                    {["select", "multisel"].includes(qType) ? (
                      <Field label="Options" span>
                        <div className="options-list">
                          {optionsOf(question).map((o, i) => (
                            <div className="option-row" key={i}>
                              <input className="form-control text-mono" style={{ minWidth: 120 }} disabled={readOnly} value={str(o, "value")} onChange={(e) => {
                                const next = optionsOf(question).map((row, ri) => (ri === i ? { ...row, value: e.target.value } : row));
                                setQuestion({ options: next });
                              }} />
                              <input className="form-control" disabled={readOnly} value={str(o, "label")} onChange={(e) => {
                                const next = optionsOf(question).map((row, ri) => (ri === i ? { ...row, label: e.target.value } : row));
                                setQuestion({ options: next });
                              }} />
                              {readOnly ? null : <button className="btn btn-ghost btn-sm" type="button" onClick={() => setQuestion({ options: optionsOf(question).filter((_, ri) => ri !== i) })}>Remove</button>}
                            </div>
                          ))}
                          {readOnly ? null : <button className="btn btn-secondary btn-sm" type="button" onClick={() => setQuestion({ options: [...optionsOf(question), { value: "", label: "" }] })}>+ Add option</button>}
                        </div>
                      </Field>
                    ) : null}
                  </div>
                )}
              </Accordion>

              <Accordion n={3} title="Validation Rules" subtitle={`${validations.length} rule${validations.length === 1 ? "" : "s"} configured`} open={open.validation} onToggle={() => setOpen((s) => ({ ...s, validation: !s.validation }))}>
                <table className="val-table">
                  <thead><tr><th>Rule Type</th><th>Expression / Value</th><th>Error Message</th>{readOnly ? null : <th />}</tr></thead>
                  <tbody>
                    {validations.length === 0 ? (
                      <tr><td colSpan={readOnly ? 3 : 4} className="text-muted" style={{ textAlign: "center" }}>No validation rules configured.</td></tr>
                    ) : validations.map((v, i) => (
                      <tr key={i}>
                        <td><input className="form-control" disabled={readOnly} value={str(v, "rule")} onChange={(e) => setQuestion({ validations: validations.map((row, ri) => (ri === i ? { ...row, rule: e.target.value } : row)) })} /></td>
                        <td><input className="form-control" disabled={readOnly} value={str(v, "expr")} onChange={(e) => setQuestion({ validations: validations.map((row, ri) => (ri === i ? { ...row, expr: e.target.value } : row)) })} /></td>
                        <td><input className="form-control" disabled={readOnly} value={str(v, "msg")} onChange={(e) => setQuestion({ validations: validations.map((row, ri) => (ri === i ? { ...row, msg: e.target.value } : row)) })} /></td>
                        {readOnly ? null : <td><button className="btn btn-ghost btn-sm" type="button" onClick={() => setQuestion({ validations: validations.filter((_, ri) => ri !== i) })}>Remove</button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-secondary btn-sm" type="button" disabled={readOnly} onClick={() => setQuestion({ validations: [...validations, { rule: "Required", expr: "true", msg: "" }] })}>+ Add validation</button>
              </Accordion>

              <Accordion n={4} title="Conditional Visibility" subtitle={conditions.length ? `Show when: ${str(question, "exprPreview") || str(question, "visibleWhen")}` : "Always visible"} open={open.conditional} onToggle={() => setOpen((s) => ({ ...s, conditional: !s.conditional }))}>
                {conditions.length ? (
                  <div className="condition-builder">
                    <div className="cb-header"><span>SHOW this question when:</span></div>
                    {conditions.map((c, i) => (
                      <div key={i}>
                        {i > 0 ? <div className="elg-and" style={{ padding: "4px 16px" }}>{str(c, "connector", "AND")}</div> : null}
                        <div className="cb-row">
                          <input className="form-control" disabled={readOnly} value={str(c, "field")} onChange={(e) => {
                            const next = conditions.map((row, ri) => (ri === i ? { ...row, field: e.target.value } : row));
                            setQuestion({ conditions: next });
                          }} />
                          <input className="form-control" style={{ width: 120 }} disabled={readOnly} value={str(c, "op")} onChange={(e) => {
                            const next = conditions.map((row, ri) => (ri === i ? { ...row, op: e.target.value } : row));
                            setQuestion({ conditions: next });
                          }} />
                          <input className="form-control" disabled={readOnly} value={str(c, "value")} onChange={(e) => {
                            const next = conditions.map((row, ri) => (ri === i ? { ...row, value: e.target.value } : row));
                            setQuestion({ conditions: next });
                          }} />
                          {readOnly ? null : <button className="btn btn-ghost btn-sm" type="button" onClick={() => setQuestion({ conditions: conditions.filter((_, ri) => ri !== i), conditional: conditions.length > 1 })}>Remove</button>}
                        </div>
                      </div>
                    ))}
                    {str(question, "exprPreview") ? <div className="expr-preview">{str(question, "exprPreview")}</div> : null}
                  </div>
                ) : (
                  <div className="text-muted" style={{ textAlign: "center", padding: 12 }}>This question is always visible. No conditions configured.</div>
                )}
                {readOnly ? null : <button className="btn btn-secondary btn-sm" type="button" style={{ marginTop: 12 }} onClick={() => {
                  const others = questions.filter((_, qi) => qi !== sel.q);
                  setQuestion({ conditions: [...conditions, { field: str(others[0], "label"), op: "is", value: "", connector: "AND" }], conditional: true });
                }}>+ Add condition</button>}
              </Accordion>

              <Accordion n={5} title="Evidence Triggers" subtitle={evidenceRows.length ? `${evidenceRows.length} trigger${evidenceRows.length === 1 ? "" : "s"}` : "No triggers"} open={open.evidence} onToggle={() => setOpen((s) => ({ ...s, evidence: !s.evidence }))}>
                {evidenceRows.length ? evidenceRows.map((e, i) => (
                  <EvidenceTriggerRow
                    key={i}
                    row={e}
                    readOnly={readOnly}
                    open={openEvidencePicker === i}
                    onToggleOpen={() => setOpenEvidencePicker((current) => (current === i ? null : i))}
                    onChange={(next) => {
                      setOpenEvidencePicker(null);
                      setQuestion({ evidence: evidenceRows.map((row, ri) => (ri === i ? next : row)) });
                    }}
                    onRemove={() => setQuestion({ evidence: evidenceRows.filter((_, ri) => ri !== i) })}
                  />
                )) : (
                  <div className="text-muted" style={{ textAlign: "center", padding: 12 }}>No evidence triggers configured.</div>
                )}
                {readOnly ? null : <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                  const existing = Array.isArray(question.evidence) ? evidenceRows : [];
                  setQuestion({ evidence: [...existing, { conditionType: "document_required", condition: "", type: "Document Required", message: "" }] });
                }}>+ Add evidence trigger</button>}
              </Accordion>

              <EditorActions pending={pending} readOnly={readOnly} onDiscard={() => setGroups(asGroups(items))} onSave={() => save()} />
            </>
          ) : (
            <div className="card"><div className="card-body empty-state">Select or add a question in the tree.</div></div>
          )}
        </div>
      </div>
      {addQuestionOpen ? (
        <div className="studio-modal-overlay" onClick={() => setAddQuestionOpen(false)}>
          <div className="studio-modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <h2>Add Question</h2>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAddQuestionOpen(false)}>Close</button>
            </div>
            <div className="studio-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Question Label" span>
                <input
                  className="form-control"
                  value={addQuestionForm.label}
                  onChange={(e) => setAddQuestionForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="What the user sees"
                />
              </Field>
              <Field label="Field Type">
                <select
                  className="form-control"
                  value={addQuestionForm.type}
                  onChange={(e) => setAddQuestionForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Bind Phase">
                <select
                  className="form-control"
                  value={addQuestionForm.bindPhase}
                  onChange={(e) => {
                    const bindPhase = e.target.value;
                    const phaseGroups = groups.map((group, index) => ({ group, index })).filter(({ group }) => groupBindPhase(group) === bindPhase);
                    setAddQuestionForm((f) => ({
                      ...f,
                      bindPhase,
                      groupIndex: phaseGroups[0]?.index ?? f.groupIndex,
                    }));
                  }}
                >
                  <option value="pre-bind">Pre-bind</option>
                  <option value="post-bind">Post-bind</option>
                </select>
              </Field>
              <Field label="Question Group">
                <select
                  className="form-control"
                  value={String(addQuestionForm.groupIndex)}
                  onChange={(e) => setAddQuestionForm((f) => ({ ...f, groupIndex: Number(e.target.value) }))}
                >
                  {groupsInPhase(addQuestionForm.bindPhase).length ? (
                    groupsInPhase(addQuestionForm.bindPhase).map(({ group, index }) => (
                      <option key={str(group, "id", String(index))} value={index}>
                        {str(group, "name") || str(group, "label")}
                      </option>
                    ))
                  ) : (
                    <option value={-1}>New group ({addQuestionForm.bindPhase === "post-bind" ? "Post-bind" : "Pre-bind"})</option>
                  )}
                </select>
              </Field>
            </div>
            <div className="studio-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 20px" }}>
              <button className="btn btn-secondary" type="button" onClick={() => setAddQuestionOpen(false)}>Cancel</button>
              <button className="btn btn-primary" type="button" onClick={submitAddQuestion}>Add Question</button>
            </div>
          </div>
        </div>
      ) : null}
      <SaveToast show={saved} />
    </>
  );
}
