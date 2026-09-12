import Link from "next/link";
import { CloneButton } from "@/components/ProductActions";
import { initials, STATUS_LABEL } from "@/lib/format";
import { LIFECYCLE } from "@/lib/blueprint";
import type { HubStudio } from "@/lib/product-hub";
import type { AuditEvent, Product, ProductDetail } from "@/lib/types";

const AVATAR = ["av-pm", "av-act", "av-uw", "av-co", "av-pub"];

function StudioIcon({ id }: { id: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (id === "coverage") return <svg {...common}><path d="M12 3 5 6v5c0 5 3.2 8.4 7 10 3.8-1.6 7-5 7-10V6l-7-3Z" /></svg>;
  if (id === "questionnaire") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1.9-1.1 1.8" /><circle cx="12" cy="17" r=".7" fill="currentColor" /></svg>;
  if (id === "eligibility") return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="m15 11 2 2 4-4" /></svg>;
  if (id === "rating") return <svg {...common}><path d="M12 3v18M8 7h5.5a3 3 0 0 1 0 6H8h6a3 3 0 0 1 0 6H8" /></svg>;
  if (id === "underwriting") return <svg {...common}><path d="M12 3 4 7v5c0 5.2 3.4 8.6 8 10 4.6-1.4 8-4.8 8-10V7l-8-4Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (id === "distribution") return <svg {...common}><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M8 7.5 10.5 16M16 7.5 13.5 16" /></svg>;
  if (id === "document") return <svg {...common}><path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" /><path d="M14 3.5V8h4.5M9 12h6M9 16h4" /></svg>;
  return <svg {...common}><path d="M9 4h6l1 3h3v12H5V7h3l1-3Z" /><path d="M9 14h6" /></svg>;
}

function QuickIcon({ kind }: { kind: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "clone") return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" /></svg>;
  if (kind === "compare") return <svg {...common}><rect x="3" y="4" width="7" height="16" rx="1" /><rect x="14" y="4" width="7" height="16" rx="1" /></svg>;
  if (kind === "simulate") return <svg {...common}><path d="M9 3h6M10 3v6L6 17a4 4 0 0 0 12 0l-4-8V3" /></svg>;
  if (kind === "export") return <svg {...common}><path d="M12 4v10M8 8l4-4 4 4" /><path d="M5 15v4h14v-4" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></svg>;
}

function Donut({ pct }: { pct: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <svg className="ph-donut" width="128" height="128" viewBox="0 0 128 128" aria-hidden>
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="60" textAnchor="middle" fill="#F3F4F6" fontSize="22" fontWeight="700">{pct}%</text>
      <text x="64" y="78" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="600">Configured</text>
    </svg>
  );
}

function activityWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProductHub({
  product,
  detail,
  studios,
  summary,
  activity,
}: {
  product: Product;
  detail: ProductDetail;
  studios: HubStudio[];
  summary: { overall: number; complete: number; progress: number; empty: number; incomplete: number };
  activity: AuditEvent[];
}) {
  const lifecycle = LIFECYCLE.find((s) => s.id === product.status);
  const firstOpen = studios.find((s) => s.state !== "complete") || studios[0];
  const created = detail.versions.at(-1)?.on || product.lastModified || "—";

  return (
    <>
      <div className="ph-header">
        <div className="ph-header-left">
          <div className="ph-mark" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7.5 12 3l8 4.5V17L12 21.5 4 17V7.5Z" />
              <path d="M12 12v9.5M4 7.5 12 12l8-4.5" />
            </svg>
          </div>
          <div>
            <div className="ph-title-row">
              <h1 className="ph-title">{product.name}</h1>
              <span className={`badge badge-${product.status}`}>{STATUS_LABEL[product.status]}</span>
            </div>
            <p className="ph-meta">
              {product.id} · {product.family} · v{product.version} · {product.owner}
            </p>
            {lifecycle ? (
              <p className="ph-desc">{lifecycle.meaning} Allowed: {lifecycle.actions}</p>
            ) : null}
          </div>
        </div>
        <div className="ph-actions">
          <Link className="btn btn-secondary" href={`/products/${product.id}#editor`}>Edit Product</Link>
          <Link className="btn btn-secondary" href={`/products/${product.id}/view`}>Customer View</Link>
          <Link className="btn btn-secondary" href="/simulation">Simulate</Link>
          <Link className="btn btn-primary" href={`/products/${product.id}/coverage`}>
            Open Coverage Studio
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="ph-life" role="tablist" aria-label="Product lifecycle">
        {LIFECYCLE.map((s) => {
          const current = s.id === product.status;
          return (
            <div key={s.id} className={`ph-life-step ${current ? "current" : ""}`}>
              <div className="ph-life-label">{STATUS_LABEL[s.id]}</div>
              <div className="ph-life-sub">{current ? "Current" : "—"}</div>
            </div>
          );
        })}
      </div>

      <div className="ph-grid">
        <div>
          <div className="card" id="studios">
            <div className="card-header">
              <div>
                <div className="card-title">Product Studio</div>
                <div className="card-subtitle">Design and configure every aspect of your product.</div>
              </div>
              <Link className="btn btn-secondary btn-sm" href={firstOpen?.href || `/products/${product.id}/coverage`}>
                Configure All
              </Link>
            </div>
            <div className="ph-studio-list">
              {studios.map((s) => (
                <div key={s.id} className="ph-studio-row">
                  <div className="ph-studio-icon" style={{ background: `${s.tone}22`, color: s.tone }}>
                    <StudioIcon id={s.id} />
                  </div>
                  <div className="ph-studio-copy">
                    <div className="ph-studio-name">{s.title}</div>
                    <div className="ph-studio-desc">{s.description}</div>
                  </div>
                  <div className="ph-studio-stat">
                    <div className="ph-studio-stat-value">{s.countLabel}</div>
                    <div className="ph-studio-stat-label">Configured items</div>
                  </div>
                  <div className="ph-studio-stat">
                    <div className="ph-studio-stat-value">{s.pct}%</div>
                    <div className="ph-progress"><span style={{ width: `${s.pct}%`, background: s.tone }} /></div>
                    <div className="ph-studio-stat-label">Configured</div>
                  </div>
                  <Link className="ph-configure" href={s.href}>Configure ›</Link>
                </div>
              ))}
            </div>
          </div>

          <div className="ph-quick">
            <CloneButton product={product} className="ph-quick-card">
              <span className="ph-quick-icon"><QuickIcon kind="clone" /></span>
              <span className="ph-quick-title">Clone Product</span>
              <span className="ph-quick-desc">Copy this product into a new draft</span>
            </CloneButton>
            <Link className="ph-quick-card" href={`/products/${product.id}#editor`}>
              <span className="ph-quick-icon"><QuickIcon kind="compare" /></span>
              <span className="ph-quick-title">Compare Versions</span>
              <span className="ph-quick-desc">Review version history and gates</span>
            </Link>
            <Link className="ph-quick-card" href="/simulation">
              <span className="ph-quick-icon"><QuickIcon kind="simulate" /></span>
              <span className="ph-quick-title">Simulate Product</span>
              <span className="ph-quick-desc">Run quotes and rule traces</span>
            </Link>
            <Link className="ph-quick-card" href={`/api/runtime/products/${product.id}`} target="_blank">
              <span className="ph-quick-icon"><QuickIcon kind="export" /></span>
              <span className="ph-quick-title">Export Configuration</span>
              <span className="ph-quick-desc">Download the runtime package</span>
            </Link>
            <Link className="ph-quick-card" href="/audit">
              <span className="ph-quick-icon"><QuickIcon kind="log" /></span>
              <span className="ph-quick-title">View Change Log</span>
              <span className="ph-quick-desc">See every recorded change</span>
            </Link>
          </div>
        </div>

        <aside className="ph-side">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Product Details</div>
              <Link className="btn btn-ghost btn-sm" href={`/products/${product.id}#editor`}>Edit</Link>
            </div>
            <div className="card-body">
              <dl className="ph-dl">
                <dt>Product Code</dt><dd className="text-mono">{product.id}</dd>
                <dt>LOB</dt><dd>{product.family}</dd>
                <dt>Version</dt><dd className="text-mono">v{product.version}</dd>
                <dt>Status</dt><dd><span className={`badge badge-${product.status}`}>{STATUS_LABEL[product.status]}</span></dd>
                <dt>Owner</dt><dd>{product.owner}</dd>
                <dt>Created On</dt><dd>{created}</dd>
                <dt>Last Modified</dt><dd>{product.lastModified || "—"}</dd>
              </dl>
              <div className="ph-detail-desc">
                <div className="ph-dl-label">Description</div>
                <p>{detail.description || product.description || `${product.name} configuration.`}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Configuration Summary</div></div>
            <div className="card-body">
              <div className="ph-summary">
                <Donut pct={summary.overall} />
                <ul className="ph-legend">
                  <li><span className="ph-dot" style={{ background: "#4ADE80" }} /> Complete ({summary.complete})</li>
                  <li><span className="ph-dot" style={{ background: "#C09553" }} /> In Progress ({summary.progress})</li>
                  <li><span className="ph-dot" style={{ background: "#64748B" }} /> Not Started ({summary.empty})</li>
                  <li><span className="ph-dot" style={{ background: "#F87171" }} /> Incomplete ({summary.incomplete})</li>
                </ul>
              </div>
              <Link className="ph-report" href="#studios">View Configuration Report ›</Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Activity</div>
              <Link className="btn btn-ghost btn-sm" href="/audit">View All</Link>
            </div>
            <div className="card-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
              {activity.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 13, padding: "8px 0 12px" }}>No activity recorded for this product yet.</p>
              ) : (
                <div className="activity-feed">
                  {activity.map((e, i) => (
                    <div key={e.id} className="activity-item">
                      <div className={`activity-avatar ${AVATAR[i % AVATAR.length]}`}>{initials(e.user)}</div>
                      <div className="activity-content">
                        <div className="activity-text"><strong>{e.user}</strong> {e.description}</div>
                        <div className="activity-meta">{activityWhen(e.at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
