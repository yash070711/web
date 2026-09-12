"use client";

import { useMemo, useRef, useState } from "react";
import { createProductAction } from "@/app/actions/products";
import { nextVersionLabel } from "@/lib/format";

const STEPS = ["Product Identity", "Version Setup", "Initial Studios", "Review & Create"];
const PRODUCT_TYPE_LOB: Record<string, string[]> = {
  Transportation: ["Commercial Auto", "Personal Auto", "Inland Marine"],
  Property: ["Commercial Property", "Homeowners"],
};
const PRODUCT_FAMILIES = Object.keys(PRODUCT_TYPE_LOB).filter(
  (family) => (PRODUCT_TYPE_LOB[family]?.length ?? 0) > 0
);
const DEFAULT_FAMILY = PRODUCT_FAMILIES[0] || "Transportation";
const DEFAULT_LOB = PRODUCT_TYPE_LOB[DEFAULT_FAMILY]?.[0] || "Commercial Auto";
const STUDIOS = [
  { id: "coverage", label: "Coverage Studio", desc: "Define what is covered, limits, deductibles, and exclusions.", checked: true },
  { id: "questionnaire", label: "Questionnaire Studio", desc: "Build the questions asked at quote, application, and renewal.", checked: true },
  { id: "risk", label: "Risk Studio", desc: "Trucking risk data: business type, fleet, radius, commodities, DOT/MC.", checked: true },
  { id: "eligibility", label: "Eligibility Studio", desc: "Set rules for who can buy this product.", checked: true },
  { id: "rating", label: "Rating & Pricing Studio", desc: "Configure base rates, factors, and premium calculation rules.", checked: true },
  { id: "underwriting", label: "Underwriting Rules Studio", desc: "Define accept/decline/refer rules and loading logic.", checked: true },
  { id: "distribution", label: "Distribution Studio", desc: "Configure channels, broker agreements, and commission structures.", checked: false },
  { id: "document", label: "Document Studio", desc: "Set up policy documents, endorsements, and certificate templates.", checked: false },
];

type Source = { id: string; name: string; version: string; status: string };

export function NewProductWizard({
  owners,
  sources = [],
}: {
  owners: string[];
  sources?: Source[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner] = useState(owners[0] || "Anika Sharma");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState(() => nextVersionLabel([]));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cloneOn, setCloneOn] = useState(false);
  const [cloneFrom, setCloneFrom] = useState(sources[0]?.id || "");
  const [studios, setStudios] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(STUDIOS.map((s) => [s.id, s.checked]))
  );
  const allowSubmit = useRef(false);
  const [productFamily, setProductFamily] = useState(DEFAULT_FAMILY);
  const [lineOfBusiness, setLineOfBusiness] = useState(DEFAULT_LOB);
  const [businessType, setBusinessType] = useState("New");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [status, setStatus] = useState("Draft");

  const lobOptions = PRODUCT_TYPE_LOB[productFamily] || [];
  const suggestedCode = useMemo(() => {
    const src = lineOfBusiness || productFamily;
    if (!src) return "";
    const slug = src.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase().slice(0, 18);
    return `${slug}-${new Date().getFullYear()}-001`;
  }, [lineOfBusiness, productFamily]);

  function reset() {
    allowSubmit.current = false;
    setOpen(false);
    setStep(1);
    setError("");
  }

  function next(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    if (step === 1) {
      if (!name.trim() || !productFamily || !lineOfBusiness) {
        setError("Please complete all required product identity fields.");
        return;
      }
      if (sources.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase())) {
        setError("A product with this name already exists. Choose a unique name.");
        return;
      }
      if (!code) setCode(suggestedCode);
      if (!from) setFrom(effectiveDate);
    }
    if (step === 2) {
      const start = from || effectiveDate;
      if (!start) {
        setError("Please select an effective proposed date from.");
        return;
      }
      if (!from) setFrom(start);
      if (to && to < start) {
        setError("Effective Proposed Date To must be the same date as Effective Proposed Date From, or later.");
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function back(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  if (!open) {
    return (
      <button className="btn btn-primary" type="button" onClick={() => { setOpen(true); setStep(1); }}>
        + New Product
      </button>
    );
  }

  const selectedStudios = STUDIOS.filter((s) => studios[s.id]);

  return (
    <div className="modal-overlay" onClick={reset}>
      <div className="modal modal-lg np-wizard" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Product</h2>
          <button className="btn btn-icon" type="button" onClick={reset} aria-label="Close">×</button>
        </div>
        <form
          action={createProductAction}
          onSubmit={(e) => {
            if (!allowSubmit.current) e.preventDefault();
          }}
        >
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="family" value={productFamily} />
          <input type="hidden" name="productType" value={lineOfBusiness} />
          <input type="hidden" name="lineOfBusiness" value={lineOfBusiness} />
          <input type="hidden" name="businessType" value={businessType} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="segment" value={["Personal Auto", "Homeowners"].includes(lineOfBusiness) ? "Personal Lines" : "Commercial Lines"} />
          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="owner" value={owner} />
          <input type="hidden" name="code" value={code || suggestedCode} />
          <input type="hidden" name="jurisdictions" value="India" />
          <input type="hidden" name="version" value={version} />
          <input type="hidden" name="effectiveFrom" value={from || effectiveDate} />
          <input type="hidden" name="effectiveTo" value={to} />
          <input type="hidden" name="cloneFrom" value={cloneOn ? cloneFrom : ""} />
          {selectedStudios.map((s) => (
            <input key={s.id} type="hidden" name="studios" value={s.id} />
          ))}

          <div className="modal-body">
            <div className="wizard-stepper">
              {STEPS.flatMap((label, i) => {
                const num = i + 1;
                const cls = num < step ? "done" : num === step ? "active" : "";
                const node = (
                  <div key={label} className={`wizard-stepper-step ${cls}`}>
                    <div className="wizard-circle">{num < step ? "✓" : num}</div>
                    <div className="wizard-step-label">{label}</div>
                  </div>
                );
                if (i === STEPS.length - 1) return [node];
                return [
                  node,
                  <div key={`${label}-line`} className={`wizard-connector ${num < step ? "done" : ""}`} />,
                ];
              })}
            </div>

            {error ? <div className="callout callout-error mb-4"><div>{error}</div></div> : null}

            {step === 1 ? (
              <div className="np-grid">
                      <div className="form-group span-2">
                  <label className="form-label">Product Name <span className="required">*</span></label>
                  <input
                    className="form-control"
                    maxLength={100}
                    placeholder="e.g. Truck Auto Liability"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <span className="form-help">Must be unique. You cannot create two products with the same name.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Fam <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={productFamily}
                    onChange={(e) => {
                      const next = e.target.value;
                      setProductFamily(next);
                      setLineOfBusiness(PRODUCT_TYPE_LOB[next]?.[0] || "");
                    }}
                  >
                    {PRODUCT_FAMILIES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Line of Business <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={lineOfBusiness}
                    disabled={!productFamily}
                    onChange={(e) => setLineOfBusiness(e.target.value)}
                  >
                    {lobOptions.map((lob) => (
                      <option key={lob} value={lob}>{lob}</option>
                    ))}
                  </select>
                  <span className="form-help">Updates with Product Family.</span>
                </div>

          

                <div className="form-group">
                  <label className="form-label">Product Owner <span className="required">*</span></label>
                  <select className="form-control" defaultValue={owner}>
                    {(owners.length ? owners : [owner]).map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Business Type <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="Renew">Renew</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div className="form-group span-2">
                  <label className="form-label">Product Description</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    maxLength={500}
                    placeholder="Brief description of the product and its intended market…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ minHeight: 120, resize: "vertical" }}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <>
                <div className="np-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Effective Proposed Date From <span className="required">*</span></label>
                    <input className="form-control" type="date" value={from || effectiveDate} onChange={(e) => setFrom(e.target.value)} />
                    <span className="form-help">Effective proposed date must be approved.</span>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Effective Proposed Date To</label>
                    <input className="form-control" type="date" value={to} min={from || effectiveDate || undefined} onChange={(e) => setTo(e.target.value)} />
                    <span className="form-help">Leave blank for open-ended. Must be on or after Effective Proposed Date From.</span>
                  </div>
                </div>
                <div className="mt-6" style={{ padding: 20, border: "1px solid var(--color-border)", borderRadius: 8 }}>
                  <div className="flex-between">
                    <div>
                      <div className="fw-500">Clone configuration from existing product?</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>Copy coverage, eligibility, and rating rules from a published version.</div>
                    </div>
                    <label className="toggle-wrap">
                      <span className="toggle-switch">
                        <input type="checkbox" checked={cloneOn} onChange={(e) => setCloneOn(e.target.checked)} />
                        <span className="toggle-slider" />
                        <span className="toggle-dot" />
                      </span>
                    </label>
                  </div>
                  {cloneOn ? (
                    <div className="form-group mt-4" style={{ marginBottom: 0 }}>
                      <label className="form-label">Source Product</label>
                      <select className="form-control" value={cloneFrom} onChange={(e) => setCloneFrom(e.target.value)}>
                        {sources.length === 0 ? <option value="">No published products</option> : null}
                        {sources.map((p) => <option key={p.id} value={p.id}>{p.name} — v{p.version}</option>)}
                      </select>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <p className="text-muted mb-4">Select which studios to configure during setup. You can access any studio later from the product detail page.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {STUDIOS.map((s) => (
                    <label key={s.id} className="studio-pick">
                      <input type="checkbox" checked={Boolean(studios[s.id])} onChange={(e) => setStudios((cur) => ({ ...cur, [s.id]: e.target.checked }))} />
                      <div>
                        <div className="fw-500" style={{ marginBottom: 2 }}>{s.label}</div>
                        <div className="text-muted" style={{ fontSize: 13 }}>{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <div className="callout callout-success mb-6">
                  <div>Review all details below. The product will be created with status {status}.</div>
                </div>
                <div className="review-kicker">Product Identity</div>
                <div className="np-grid mb-6">
                  {[
                    ["Product Name", name],
                    ["Product Family", productFamily],
                    ["Line of Business", lineOfBusiness],
                    ["Business Type", businessType],
                    ["Status", status],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
                      <div className="fw-500" style={{ marginTop: 2 }}>{value || "—"}</div>
                    </div>
                  ))}
                </div>
                {description ? (
                  <div className="mb-6">
                    <div className="text-muted" style={{ fontSize: 12 }}>Description</div>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{description}</div>
                  </div>
                ) : null}
                <div className="review-kicker">Version Setup</div>
                <div className="form-grid-2 mb-6">
                  <div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Effective Proposed Date From</div>
                    <div className="fw-500" style={{ marginTop: 2 }}>{from || effectiveDate || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Effective Proposed Date To</div>
                    <div className="fw-500" style={{ marginTop: 2 }}>{to || "Open-ended"}</div>
                  </div>
                </div>
                <div className="review-kicker">Studios to Configure</div>
                <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                  {selectedStudios.map((s) => <span key={s.id} className="role-badge">{s.label}</span>)}
                </div>
              </>
            ) : null}
          </div>

          <div className="modal-footer">
            {step > 1 ? (
              <button type="button" className="btn btn-secondary" onClick={back} style={{ marginRight: "auto" }}>
                ← Back
              </button>
            ) : <span style={{ marginRight: "auto" }} />}
            <div className="flex gap-2">
              {step < 4 ? (
                <button key="continue" type="button" className="btn btn-primary" onClick={next}>
                  Continue →
                </button>
              ) : (
                <button
                  key="create"
                  className="btn btn-primary"
                  type="submit"
                  onClick={() => {
                    allowSubmit.current = true;
                  }}
                >
                  Create Product
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
