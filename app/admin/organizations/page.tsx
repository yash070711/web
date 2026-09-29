import { StudioFrame } from "@/components/StudioFrame";
import { OrganizationConsole } from "@/components/org/OrganizationConsole";
import { ParentAdminSignIn } from "@/components/org/ParentAdminSignIn";
import { DEFAULT_PARENT_COMPANY_ID, isParentCompanyAdmin } from "@/lib/organizations";
import { getSession } from "@/lib/session";
import { loadWorkspace } from "@/lib/store";

const CRUMBS = [
  { label: "Admin", href: "/admin" },
  { label: "Organization Management", href: "/admin/organizations" },
];

export default async function OrganizationManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const session = await getSession();
  const workspace = loadWorkspace(session);

  const parentCompany =
    workspace.parentCompanies.find((p) => p.id === session.parentCompanyId) ||
    workspace.parentCompanies.find((p) => p.id === DEFAULT_PARENT_COMPANY_ID) ||
    workspace.parentCompanies[0];

  const allowed = isParentCompanyAdmin(session);

  return (
    <StudioFrame active="organizations" crumbs={CRUMBS}>
      {allowed ? (
        <div className="page-inner">
          <OrganizationConsole
            session={session}
            parentCompany={parentCompany}
            organizations={workspace.organizations}
            products={workspace.products}
            ok={ok}
            error={error}
          />
        </div>
      ) : (
        <ParentAdminSignIn parentCompany={parentCompany} error={error} />
      )}
    </StudioFrame>
  );
}
