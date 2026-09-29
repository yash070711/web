import { notFound, redirect } from "next/navigation";
import { StudioFrame } from "@/components/StudioFrame";
import { OrganizationDetail } from "@/components/org/OrganizationDetail";
import { DEFAULT_PARENT_COMPANY_ID, isParentCompanyAdmin } from "@/lib/organizations";
import { getSession } from "@/lib/session";
import { loadWorkspace } from "@/lib/store";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!isParentCompanyAdmin(session)) redirect("/admin/organizations");

  const workspace = loadWorkspace(session);
  const organization = workspace.organizations.find((o) => o.id === id);
  if (!organization) notFound();

  const parentCompany =
    workspace.parentCompanies.find((p) => p.id === organization.parentCompanyId) ||
    workspace.parentCompanies.find((p) => p.id === DEFAULT_PARENT_COMPANY_ID) ||
    workspace.parentCompanies[0];

  const audit = workspace.audit.filter(
    (event) => event.page === "organizations" && event.description.includes(organization.id)
  );

  return (
    <StudioFrame
      active="organizations"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Organization Management", href: "/admin/organizations" },
        { label: organization.name, href: `/admin/organizations/${organization.id}` },
      ]}
    >
      <div className="page-inner">
        <OrganizationDetail organization={organization} parentCompany={parentCompany} audit={audit} />
      </div>
    </StudioFrame>
  );
}
