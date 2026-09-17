"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { createVersionAction, saveCollectionAction } from "@/app/actions/products";

export type Row = Record<string, unknown>;

export function str(row: Row | undefined, key: string, fallback = "") {
  if (!row) return fallback;
  const value = row[key];
  return value == null ? fallback : String(value);
}

export function patchRow(rows: Row[], index: number, key: string, value: unknown) {
  const next = [...rows];
  next[index] = { ...next[index], [key]: value };
  return next;
}

export function money(value: string) {
  if (!value || /service/i.test(value)) return value || "—";
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return value;
  return `$${n.toLocaleString("en-US")}`;
}

export function availLabel(value: string) {
  const map: Record<string, string> = {
    mandatory: "MANDATORY",
    default: "DEFAULT-ON",
    optional: "OPTIONAL",
    addon: "ADD-ON",
  };
  return map[value] || value.toUpperCase();
}

export function availClass(value: string) {
  if (value === "mandatory") return "avail-mandatory";
  if (value === "default") return "avail-default";
  if (value === "addon") return "avail-addon";
  return "avail-optional";
}

export function useStudioSave(
  productId: string,
  version: string,
  collection: string,
  rows: Row[]
) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(next = rows) {
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("version", version);
    fd.set("collection", collection);
    fd.set("json", JSON.stringify(next));
    start(() => {
      void saveCollectionAction(fd).then(() => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
      });
    });
  }

  return { pending, saved, save };
}

export function Accordion({
  n,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="section-card">
      <div className="section-header" onClick={onToggle}>
        <div className="section-header-left">
          <div className="section-number">{n}</div>
          <div>
            <div className="section-title">{title}</div>
            {subtitle ? <div className="section-subtitle">{subtitle}</div> : null}
          </div>
        </div>
        <span className={`section-chevron ${open ? "open" : ""}`}>›</span>
      </div>
      <div className={`section-body ${open ? "open" : ""}`}>
        <div className="section-inner">{children}</div>
      </div>
    </div>
  );
}

export function StudioHeader({
  title,
  subtitle,
  productId,
  moduleId,
  extra,
}: {
  title: string;
  subtitle: string;
  productId: string;
  moduleId?: string;
  extra?: ReactNode;
}) {
  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-primary" href={`/products/${productId}/view`}>Customer view</Link>
          <Link className="btn btn-secondary" href={`/products/${productId}`}>View Product</Link>
          {extra}
        </div>
      </div>
      {moduleId ? <ModuleHelpBanner moduleId={moduleId} /> : null}
    </>
  );
}

export function EditorActions({
  pending,
  readOnly,
  onDiscard,
  onSave,
  saveLabel = "Save Changes",
}: {
  pending?: boolean;
  readOnly?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="studio-editor-actions">
      <button className="btn btn-secondary" type="button" disabled={readOnly} onClick={onDiscard}>Discard visible edits</button>
      <button className="btn btn-primary" type="button" disabled={pending} onClick={onSave}>{pending ? "Saving…" : saveLabel}</button>
    </div>
  );
}

export function ModuleHelpBanner({ moduleId }: { moduleId: string }) {
  const mod = getModuleHelp(moduleId);
  if (!mod) return null;
  return (
    <details className="module-help-banner">
      <summary className="module-help-summary">
        <span className="module-help-icon" aria-hidden="true">?</span>
        <span className="module-help-title">About {mod.title}</span>
      </summary>
      <div className="module-help-body">
        <p className="module-help-desc">{mod.description}</p>
        {mod.tips?.length ? (
          <ul className="module-help-tips">
            {mod.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}

export function Field({
  label,
  help,
  children,
  span,
}: {
  label: string;
  help?: string;
  children: ReactNode;
  span?: boolean;
}) {
  const text = help ?? helpForLabel(label);
  return (
    <div className={`form-group ${span ? "span-2" : ""}`} style={{ marginBottom: 0 }}>
      <label className="form-label">{label}</label>
      {children}
      {text ? <p className="form-help">{text}</p> : null}
    </div>
  );
}

export function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="toggle-wrap">
      <span className="toggle-switch">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-slider" />
        <span className="toggle-dot" />
      </span>
      {label}
    </label>
  );
}

import { getNextStudio } from "@/lib/studio-nav";
import { getModuleHelp, helpForLabel } from "@/lib/studio-help";

export function ContextBar({
  productId,
  version,
  summary,
  studioId,
  itemCount = 0,
}: {
  productId: string;
  version: string;
  summary: string;
  studioId?: string;
  itemCount?: number;
}) {
  const next = studioId && itemCount > 0 ? getNextStudio(studioId, productId) : null;
  return (
    <div className="studio-context-bar">
      <span className="studio-context-pill">
        {productId} · v{version}
      </span>
      <span style={{ color: "var(--color-muted)" }}>·</span>
      <span>{summary}</span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {next ? (
          <a className="btn btn-primary btn-sm" href={next.href}>
            {next.finish ? "Finish · Product Hub ›" : `Next: ${next.title} ›`}
          </a>
        ) : null}
        <a className="btn btn-ghost btn-sm" href={`/products/${productId}`}>
          ← Back to Product
        </a>
      </div>
    </div>
  );
}

export function PublishedBanner({
  productId,
  studio,
  readOnly,
}: {
  productId: string;
  studio: string;
  readOnly: boolean;
}) {
  if (!readOnly) return null;
  return (
    <div className="readonly-band">
      <span>This version is <strong>Published</strong> — all fields are read-only.</span>
      <form action={createVersionAction}>
        <input type="hidden" name="id" value={productId} />
        <input type="hidden" name="returnTo" value={`/products/${productId}/${studio}`} />
        <button className="btn btn-primary btn-sm" type="submit">
          Clone Version to Edit
        </button>
      </form>
    </div>
  );
}

export function SaveToast({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="save-toast">Saved to workspace</div>;
}
