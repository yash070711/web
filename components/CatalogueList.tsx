"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { CloneButton, DeleteButton } from "./ProductActions";
import { STATUS_LABEL, relativeDay } from "@/lib/format";
import type { Product, VersionRecord } from "@/lib/types";

export type CatalogueItem = Product & { versions: VersionRecord[] };

export function CatalogueList({ items }: { items: CatalogueItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const [menuId, setMenuId] = useState<string | null>(null);

  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Product name</th>
              <th>Family</th>
              <th>Version</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Modified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const expanded = openId === p.id;
              const versions = p.versions?.length ? p.versions : [{
                label: p.version,
                status: p.status,
                from: p.effectiveFrom,
                to: p.effectiveTo,
                by: p.owner,
                on: p.lastModified,
              }];
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className={`expand-chevron ${expanded ? "open" : ""}`}
                        aria-label={expanded ? "Collapse version history" : "Expand version history"}
                        onClick={() => setOpenId(expanded ? null : p.id)}
                      >
                        ›
                      </button>
                    </td>
                    <td>
                      <Link className="cat-name" href={`/products/${p.id}`}>{p.name}</Link>
                      <div className="cat-id">{p.id}</div>
                    </td>
                    <td><span className="family-badge">{p.family}</span></td>
                    <td className="cat-version">{p.version}</td>
                    <td><span className={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span></td>
                    <td>{p.owner}</td>
                    <td className="text-muted">{relativeDay(p.lastModifiedAt, p.lastModified)}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="cat-action" href={`/products/${p.id}`}>View Product</Link>
                        <Link className="cat-action" href={`/products/${p.id}#editor`}>Edit Product</Link>
                        <Link className="cat-action" href={`/products/${p.id}/view`}>Customer view</Link>
                        <CloneButton product={p} className="cat-action" />
                        <div className="cat-more">
                          <button type="button" className="cat-action" aria-label="More options" onClick={() => setMenuId(menuId === p.id ? null : p.id)}>⋯</button>
                          {menuId === p.id ? (
                            <div className="cat-more-menu">
                              <Link className="dropdown-item" href={`/products/${p.id}#editor`} onClick={() => setMenuId(null)}>Edit Product</Link>
                              <Link className="dropdown-item" href={`/products/${p.id}/coverage`} onClick={() => setMenuId(null)}>Coverage Guide</Link>
                              <div className="dropdown-sep" />
                              <DeleteButton id={p.id} name={p.name} className="dropdown-item cat-action-danger" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="expand-row">
                      <td colSpan={8}>
                        <div className="version-history">
                          <div className="version-history-title">Version History</div>
                          {versions.map((v, i) => (
                            <div className="version-history-row" key={`${p.id}-${v.label}-${i}`}>
                              <span className="version-tree-icon">{i === versions.length - 1 ? "└" : "├"}</span>
                              <span className="cat-version">{v.label}</span>
                              <span className={`badge badge-${v.status}`}>{STATUS_LABEL[v.status] || v.status}</span>
                              <span className="text-muted" style={{ flex: 1 }}>{v.from || "—"} — {v.to || "Open"}</span>
                              <Link className="cat-action" href={`/products/${p.id}`}>View</Link>
                              <Link className="cat-action" href={`/products/${p.id}#editor`}>Edit Product</Link>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
