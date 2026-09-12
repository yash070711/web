"use client";

import { useMemo, useState } from "react";

type Props = {
  value: unknown;
  onChange: (next: unknown) => void;
  path?: string;
};

function parseMaybe(raw: string): unknown {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (t !== "" && !Number.isNaN(Number(t)) && t.length < 16) return Number(t);
  return raw;
}

export function FieldEditor({ value, onChange, path = "" }: Props) {
  if (value === null || value === undefined) {
    return (
      <div className="field-row">
        <input className="form-control" value="" placeholder="Empty — type a value" onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="flex-center gap-2">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span>{value ? "true" : "false"}</span>
      </label>
    );
  }
  if (typeof value === "number" || typeof value === "string") {
    return (
      <input
        className="form-control"
        value={String(value)}
        onChange={(e) => onChange(typeof value === "number" ? Number(e.target.value) || e.target.value : e.target.value)}
      />
    );
  }
  if (Array.isArray(value)) {
    return (
      <div>
        {value.map((item, i) => (
          <div key={`${path}.${i}`} className="field-nested" style={{ marginBottom: 12 }}>
            <div className="flex-between mb-4">
              <strong style={{ fontSize: 12, color: "var(--color-muted)" }}>Item {i + 1}</strong>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              >
                Delete
              </button>
            </div>
            <FieldEditor value={item} path={`${path}.${i}`} onChange={(next) => onChange(value.map((x, idx) => (idx === i ? next : x)))} />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() =>
            onChange([
              ...value,
              typeof value[0] === "object" && value[0] !== null && !Array.isArray(value[0])
                ? { id: `NEW-${Date.now()}` }
                : "",
            ])
          }
        >
          Add item
        </button>
      </div>
    );
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    return (
      <ObjectFields
        obj={obj}
        path={path}
        onChange={onChange}
        keys={keys}
      />
    );
  }
  return <pre>{String(value)}</pre>;
}

function ObjectFields({
  obj,
  path,
  onChange,
  keys,
}: {
  obj: Record<string, unknown>;
  path: string;
  onChange: (next: unknown) => void;
  keys: string[];
}) {
  const [newKey, setNewKey] = useState("");
  const locked = useMemo(() => new Set(["id"]), []);
  return (
    <div>
      {keys.map((key) => (
        <div key={`${path}.${key}`} className="field-row">
          <div className="field-key">{key}</div>
          <div style={{ flex: 1 }}>
            <FieldEditor
              value={obj[key]}
              path={`${path}.${key}`}
              onChange={(next) => onChange({ ...obj, [key]: next })}
            />
          </div>
          {!locked.has(key) ? (
            <button
              type="button"
              className="btn btn-icon btn-sm"
              title={`Delete ${key}`}
              onClick={() => {
                const copy = { ...obj };
                delete copy[key];
                onChange(copy);
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
      <div className="field-row">
        <input className="form-control field-key" placeholder="new field" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const key = newKey.trim();
            if (!key || key in obj) return;
            onChange({ ...obj, [key]: "" });
            setNewKey("");
          }}
        >
          Add field
        </button>
      </div>
    </div>
  );
}

export function JsonToggleEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const [mode, setMode] = useState<"fields" | "json">("fields");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  return (
    <div>
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${mode === "fields" ? "active" : ""}`} onClick={() => setMode("fields")}>
          Fields
        </button>
        <button
          type="button"
          className={`panel-tab ${mode === "json" ? "active" : ""}`}
          onClick={() => {
            setRaw(JSON.stringify(value, null, 2));
            setError("");
            setMode("json");
          }}
        >
          JSON
        </button>
      </div>
      {mode === "fields" ? (
        <FieldEditor value={value} onChange={onChange} />
      ) : (
        <div>
          <textarea
            className="form-control json-editor"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          {error ? <div className="form-help text-danger">{error}</div> : null}
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-2"
            onClick={() => {
              try {
                onChange(JSON.parse(raw));
                setError("");
                setMode("fields");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Invalid JSON");
              }
            }}
          >
            Apply JSON
          </button>
        </div>
      )}
    </div>
  );
}

export { parseMaybe };
