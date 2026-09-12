import { StudioFrame } from "@/components/StudioFrame";
import type { ReactNode } from "react";

export function SimpleTablePage({
  active,
  title,
  subtitle,
  columns,
  rows,
}: {
  active: string;
  title: string;
  subtitle: string;
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <StudioFrame active={active} crumbs={[{ label: title, href: `/${active === "audit" ? "audit-log" : active}` }]}>
      <div className="page-inner">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((cells, i) => (
                  <tr key={i}>{cells.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                )) : (
                  <tr><td colSpan={columns.length} className="text-muted">No records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StudioFrame>
  );
}
