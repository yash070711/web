"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { switchRoleAction } from "@/app/actions/auth";
import { NAV, productStudioPath, type NavLink } from "@/lib/nav";
import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/types";
import { NavIcon } from "./NavIcon";

function hrefFor(item: NavLink, productId?: string, version?: string) {
  if (item.studio && productId) return productStudioPath(productId, item.studio, version);
  return item.href;
}

export function Shell({
  user,
  active,
  crumbs,
  productId,
  version,
  children,
}: {
  user: SessionUser;
  active: string;
  crumbs: { label: string; href: string }[];
  productId?: string;
  version?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const productStudios = new Set([
    "jurisdiction", "coverage", "questionnaire", "risk",
    "eligibility", "rating", "underwriting", "distribution", "document",
  ]);
  const navActive = productStudios.has(active) && productId ? active : (productStudios.has(active) && !productId ? "catalogue" : active);

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/dashboard" className="topbar-logo">
          <div className="topbar-logo-mark">v</div>
          <span className="topbar-logo-wordmark">
            <span className="topbar-logo-text">Veridex</span>
            <span className="topbar-logo-sub">Product Guide</span>
          </span>
        </Link>
        <div className="topbar-divider" />
        <nav className="topbar-breadcrumb">
          <Link href="/dashboard">Guide</Link>
          {crumbs.map((c, i) => (
            <span key={`${c.href}-${i}`}>
              <span className="sep"> › </span>
              {i === crumbs.length - 1 ? <span className="current">{c.label}</span> : <Link href={c.href}>{c.label}</Link>}
            </span>
          ))}
        </nav>
        <div className="topbar-right">
          <form
            className="topbar-search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q");
              router.push(`/catalogue${q ? `?q=${encodeURIComponent(String(q))}` : ""}`);
            }}
          >
            <span className="topbar-search-icon">⌕</span>
            <input name="q" placeholder="Search products, rules, versions…" aria-label="Global search" />
          </form>
          <div className="topbar-user" onClick={() => setOpen((v) => !v)}>
            <div className="user-avatar">{initials(user.name)}</div>
            <div className="topbar-user-info">
              <div className="topbar-user-name">{user.name}</div>
              <div className="topbar-user-role">{user.role}</div>
            </div>
          </div>
          {open ? (
            <div className="dropdown-menu user-menu">
              <form action={switchRoleAction}>
                <select className="form-control" name="role" defaultValue={user.role} style={{ margin: 8, width: "calc(100% - 16px)" }}>
                  <option>Product Manager</option>
                  <option>Pricing Actuary</option>
                  <option>Underwriting Manager</option>
                  <option>Compliance Officer</option>
                  <option>Publisher</option>
                  <option>Administrator</option>
                </select>
                <button className="dropdown-item" type="submit" style={{ width: "100%" }}>Switch role</button>
              </form>
            </div>
          ) : null}
        </div>
      </header>
      <nav className="sidenav">
        {NAV.map((item, i) =>
          "group" in item ? (
            <div key={`${item.group}-${i}`} className="nav-group">
              <div className="nav-group-label">{item.group}</div>
            </div>
          ) : (
            <Link
              key={item.id}
              href={hrefFor(item, productId, version)}
              className={`nav-item ${navActive === item.id ? "active" : ""}`}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          )
        )}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
