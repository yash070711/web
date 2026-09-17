"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { saveQuoteAction } from "@/app/actions/products";
import { money } from "@/lib/format";

type Cover = {
  id?: string;
  name?: string;
  description?: string;
  availability?: string;
  defaultSelected?: boolean;
  sumInsured?: string;
};

export function CustomerStorefront({
  product,
  version,
  covers,
  basePremium,
}: {
  product: { id: string; name: string; family: string; description?: string };
  version: string;
  covers: Cover[];
  basePremium: number;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(covers.map((c) => [String(c.id || c.name), c.availability === "mandatory" || Boolean(c.defaultSelected)]))
  );
  const isTruck = /truck/i.test(product.name);
  const [age, setAge] = useState(isTruck ? 38 : 35);
  const [sum, setSum] = useState(isTruck ? 180000 : 50000);
  const [gvw, setGvw] = useState(16);
  const [radius, setRadius] = useState(400);
  const [experience, setExperience] = useState(12);
  const [bodyType, setBodyType] = useState("Rigid");
  const [tracker, setTracker] = useState(true);
  const [result, setResult] = useState("");
  const [pending, start] = useTransition();
  const [blocked, setBlocked] = useState("");

  const premium = useMemo(() => {
    const extras = covers.filter((c) => selected[String(c.id || c.name)] && c.availability === "addon").length;
    if (!isTruck) {
      const ageFactor = age < 25 ? 1.25 : age > 60 ? 1.2 : 1;
      const siFactor = sum > 80000 ? 1.15 : 1;
      return Math.round(basePremium * ageFactor * siFactor * (1 + extras * 0.08));
    }
    const gvwFactor = gvw <= 7.5 ? 0.85 : gvw <= 16 ? 1 : gvw <= 26 ? 1.25 : gvw <= 40 ? 1.55 : 1.85;
    const radiusFactor = radius <= 150 ? 0.9 : radius <= 500 ? 1 : radius <= 1000 ? 1.2 : 1.4;
    const expFactor = experience < 2 ? 1.3 : experience < 5 ? 1.3 : experience < 10 ? 1.1 : experience < 15 ? 1 : 0.9;
    const tanker = bodyType === "Tanker" ? 1.15 : 1;
    const trackerFee = tracker ? 1 : 1.08;
    return Math.round(basePremium * gvwFactor * radiusFactor * expFactor * tanker * trackerFee * (1 + extras * 0.1) + 45);
  }, [age, sum, selected, covers, basePremium, isTruck, gvw, radius, experience, bodyType, tracker]);

  function quote(status: string) {
    if (isTruck && age < 25) {
      setBlocked("Commercial truck cover is only available to drivers aged 25 and over.");
      setResult("");
      return;
    }
    if (isTruck && gvw > 49) {
      setBlocked("Vehicles above 49 tonnes require a specialist fleet product.");
      setResult("");
      return;
    }
    setBlocked("");
    const fd = new FormData();
    fd.set("productId", product.id);
    fd.set("version", version);
    fd.set("premium", String(premium));
    fd.set("status", status);
    fd.set("answers", JSON.stringify({ age, sum, gvw, radius, experience, bodyType, tracker, selected }));
    start(async () => {
      await saveQuoteAction(fd);
      setResult(status === "bought" ? `Policy bound at ${money(premium)}.` : `Quote ${money(premium)} saved to your workspace.`);
    });
  }

  return (
    <div>
      <div className="preview-banner">
        <div>Guide preview — customer / end-user view of {product.name}</div>
        <div className="flex gap-2">
          <Link className="btn btn-sm" href={`/products/${product.id}`}>Exit to guide</Link>
          <Link className="btn btn-sm" href="/catalogue">Catalogue</Link>
        </div>
      </div>
      <main className="storefront">
        <section className="store-hero">
          <div>
            <div className="store-kicker">{product.family} · v{version}</div>
            <h1>{product.name}</h1>
            <p>{product.description || "Configure covers and buy a quote. This is what an end customer sees."}</p>
            <div className="cover-grid">
              {covers.map((c) => {
                const key = String(c.id || c.name);
                const locked = c.availability === "mandatory";
                const on = selected[key];
                return (
                  <div
                    key={key}
                    className={`cover-card ${on ? "on" : ""}`}
                    onClick={() => {
                      if (locked) return;
                      setSelected((s) => ({ ...s, [key]: !s[key] }));
                    }}
                  >
                    <div className="cover-name">{c.name}</div>
                    <div className="cover-desc">{c.description}</div>
                    <div className="cover-meta">{locked ? "Included" : on ? "Added" : "Optional"} · SI {c.sumInsured || "—"}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <aside className="quote-card">
            <div className="text-muted">Indicative premium</div>
            <div className="quote-price">{money(premium)}</div>
            <div className="quote-unit">per year</div>
            <div className="form-group mt-4">
              <label className="form-label">{isTruck ? "Driver age" : "Age"}</label>
              <input className="form-control" type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
            </div>
            {isTruck ? (
              <>
                <div className="form-group">
                  <label className="form-label">Gross vehicle weight (tonnes)</label>
                  <input className="form-control" type="number" value={gvw} onChange={(e) => setGvw(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Body type</label>
                  <select className="form-control" value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
                    {["Rigid", "Tractor Unit", "Tipper", "Tanker", "Box", "Flatbed"].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Radius of operation (km)</label>
                  <input className="form-control" type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">HGV experience (years)</label>
                  <input className="form-control" type="number" value={experience} onChange={(e) => setExperience(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Insured value</label>
                  <input className="form-control" type="number" value={sum} onChange={(e) => setSum(Number(e.target.value))} />
                </div>
                <label className="flex-center gap-2 mb-4">
                  <input type="checkbox" checked={tracker} onChange={(e) => setTracker(e.target.checked)} />
                  GPS tracker fitted
                </label>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Sum insured</label>
                <input className="form-control" type="number" value={sum} onChange={(e) => setSum(Number(e.target.value))} />
              </div>
            )}
            {blocked ? <div className="callout callout-error mb-4">{blocked}</div> : null}
            {result ? <div className="callout callout-success mb-4">{result}</div> : null}
            <div className="cta-row">
              <button className="btn btn-secondary" disabled={pending} onClick={() => quote("quoted")}>Get quote</button>
              <button className="btn btn-primary" disabled={pending} onClick={() => quote("bought")}>Buy now</button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
