import { redirect } from "next/navigation";
import { StudioFrame } from "@/components/StudioFrame";
import { OrganizationForm } from "@/components/org/OrganizationForm";
import { collectCoverages } from "@/lib/org-fields";
import { DEFAULT_PARENT_COMPANY_ID, isParentCompanyAdmin } from "@/lib/organizations";
import { getSession } from "@/lib/session";
import { loadWorkspace } from "@/lib/store";

export default async function NewOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  if (!isParentCompanyAdmin(session)) redirect("/admin/organizations");

  const workspace = loadWorkspace(session);
  const parentCompany =
    workspace.parentCompanies.find((p) => p.id === session.parentCompanyId) ||
    workspace.parentCompanies.find((p) => p.id === DEFAULT_PARENT_COMPANY_ID) ||
    workspace.parentCompanies[0];

  const audit = workspace.audit.filter(
    (event) => event.page === "organizations" && event.description.includes("ORG-")
  );

  return (
    <StudioFrame
      active="organizations"
      crumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Organization Management", href: "/admin/organizations" },
        { label: "Create", href: "/admin/organizations/new" },
      ]}
    >
      <div className="page-inner">
        <OrganizationForm
          parentCompany={parentCompany}
          audit={audit}
          error={error}
          products={workspace.products}
          coverages={collectCoverages(workspace)}
          organizations={workspace.organizations}
        />
      </div>
    </StudioFrame>
  );
}
