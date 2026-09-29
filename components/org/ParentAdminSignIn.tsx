"use client";

import { useState } from "react";
import Link from "next/link";
import { parentSignInAction } from "@/app/actions/organizations";
import { SubmitButton } from "./SubmitButton";
import { Icon } from "./icons";

export function ParentAdminSignIn({
  parentCompany,
  error,
}: {
  parentCompany: { id: string; name: string; code: string; users?: { email: string }[] } | undefined;
  error?: string;
}) {
  const [showHint, setShowHint] = useState(true);
  const demoEmail = parentCompany?.users?.[0]?.email || "admin@southlakeholdings.com";

  return (
    <div className="org-signin-wrap">
      <div className="org-signin-card">
        <div className="org-signin-brand">
          <div className="org-signin-mark">{parentCompany?.code?.slice(0, 1) || "S"}</div>
          <div>
            <div className="org-signin-kicker">Parent Company Admin</div>
            <h1 className="org-signin-title">{parentCompany?.name || "Parent Company"}</h1>
          </div>
        </div>
        <p className="org-signin-desc">
          Sign in to manage the risk carriers, MGUs, MGAs and brokers under{" "}
          {parentCompany?.name || "your parent company"}, and assign products to them.
        </p>

        {error ? (
          <div className="callout callout-error">
            <Icon name="x" size={16} />
            <div>
              <div className="callout-title">Sign-in failed</div>
              <div>{error}</div>
            </div>
          </div>
        ) : null}

        <form action={parentSignInAction} className="org-signin-form">
          <div className="form-group">
            <label className="form-label" htmlFor="org-email">Email address</label>
            <input
              id="org-email"
              className="form-control"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="name@southlakeholdings.com"
              defaultValue={demoEmail}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="org-password">Password</label>
            <input
              id="org-password"
              className="form-control"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
            />
          </div>
          <SubmitButton className="btn btn-primary org-signin-submit" pendingLabel="Signing in…">
            Sign in to Organization Management
          </SubmitButton>
        </form>

        <button className="org-signin-hint-toggle" type="button" onClick={() => setShowHint((v) => !v)}>
          {showHint ? "Hide demo credentials" : "Show demo credentials"}
        </button>
        {showHint ? (
          <div className="org-demo-creds">
            <code>{demoEmail}</code>
            <code>southlake123</code>
          </div>
        ) : null}

        <div className="org-signin-foot">
          <Link href="/catalogue">← Back to Product Studio</Link>
          <span>Demo prototype · credentials seeded for local testing</span>
        </div>
      </div>
    </div>
  );
}
