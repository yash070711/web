"use client";

import { useMemo, useState } from "react";
import { runQuote, type Answers } from "@/lib/runtime";
import { ContextBar, StudioHeader, str, type Row } from "./shared";

export function SimulationStudio({
  productId,
  version,
  productName,
  tests,
  eligibility,
  underwriting,
  rating,
  covers,
  documents,
}: {
  productId: string;
  version: string;
  productName: string;
  tests: Row[];
  eligibility: Row[];
  underwriting: Row[];
  rating: Row[];
  covers: Row[];
  documents: Row[];
}) {
  const [active, setActive] = useState(0);
  const [ran, setRan] = useState<ReturnType<typeof runQuote> | null>(null);

  const results = useMemo(
    () =>
      tests.map((test) => {
        const quote = runQuote({
          productId,
          version,
          answers: (test.answers as Answers) || {},
          eligibility,
          underwriting,
          rating,
          covers,
          documents,
        });
        const expected = str(test, "expected").toLowerCase();
        const actual = !quote.eligibility.eligible ? "ineligible" : quote.underwriting.outcome;
        const pass = expected.includes(actual) || (actual === "accept" && expected.includes("accept"));
        return { test, quote, actual, pass };
      }),
    [tests, productId, version, eligibility, underwriting, rating, covers, documents]
  );

  const current = results[active];

  return (
    <>
      <StudioHeader
        title="Simulation & Testing"
        subtitle={`${productName} · v${version} — scenario library, rule trace and premium breakdown before publication`}
        productId={productId}
        moduleId="simulation"
        extra={<button className="btn btn-primary" type="button" onClick={() => current && setRan(current.quote)}>Run selected</button>}
      />
      <ContextBar
        productId={productId}
        version={version}
        summary={`${tests.length} scenarios · ${results.filter((r) => r.pass).length} matching expected outcome`}
      />

      <div className="studio-layout">
        <aside className="rule-sidebar">
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Scenario library</div>
            </div>
            <div className="rule-list">
              {results.map((r, i) => (
                <div key={str(r.test, "id", String(i))} className={`rule-item ${i === active ? "active" : ""}`} onClick={() => { setActive(i); setRan(r.quote); }}>
                  <span className={`rule-status-icon ${r.pass ? "" : "rule-status-off"}`}>●</span>
                  <div className="rule-item-body">
                    <div className="rule-item-name">{str(r.test, "name")}</div>
                    <div className="rule-item-meta">{r.pass ? "PASS" : "CHECK"} · expected {str(r.test, "expected")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
        <div className="detail-panel">
          {current ? (
            <>
              <div className="detail-head">
                <div>
                  <h2>{str(current.test, "name")}</h2>
                  <p className="page-subtitle">Expected: {str(current.test, "expected")} · Actual: {current.actual} · Premium ${current.quote.rating.payable.toLocaleString()}</p>
                </div>
              </div>
              <div className="rule-preview-box">
                <div className="rp-title">Eligibility trace</div>
                {current.quote.eligibility.fired.length === 0 ? <div className="rp-line">No eligibility rule fired.</div> : current.quote.eligibility.fired.map((f) => <div className="rp-line" key={f.id}>{f.preview}</div>)}
              </div>
              <div className="rule-preview-box">
                <div className="rp-title">Underwriting trace</div>
                <div className="rp-line">Decision: {current.quote.underwriting.outcome.toUpperCase()} — {current.quote.underwriting.reason}</div>
                {current.quote.underwriting.fired.map((f) => <div className="rp-line" key={f.id}>{f.preview}</div>)}
              </div>
              <div className="rule-preview-box">
                <div className="rp-title">Premium breakdown</div>
                {current.quote.rating.trail.map((t) => <div className="rp-line" key={t.id}>{t.name}: {t.effect}</div>)}
                <div className="rp-line">Payable: ${current.quote.rating.payable.toLocaleString()}</div>
              </div>
              {current.quote.snapshot ? (
                <div className="rule-preview-box">
                  <div className="rp-title">Policy snapshot (issuance contract)</div>
                  <div className="rp-line">{productId} · v{version} · {current.quote.snapshot.at}</div>
                  <div className="rp-line">UW: {current.quote.snapshot.underwritingDecision} · Covers: {current.quote.snapshot.covers.length} · Docs: {current.quote.snapshot.documents.length}</div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="card"><div className="card-body empty-state">No scenarios on this version yet.</div></div>
          )}
        </div>
      </div>
    </>
  );
}
